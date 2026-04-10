/**
 * Lead Scoring Algorithm
 * Computes a composite score (0-100) based on behavioral signals, engagement patterns,
 * and deal velocity. Replaces the simple stage-based priority mapping.
 *
 * Score Bands:
 *   70-100  → HOT   (ready to close, high engagement)
 *   40-69   → WARM  (engaged, needs nurturing)
 *   15-39   → NEW   (early stage, low data)
 *   0-14    → COLD  (stale, unresponsive)
 */

import type { Lead, Conversation, Message, LeadPriority } from '@/types/domain';

export interface LeadScoreBreakdown {
  total: number;
  priority: LeadPriority;
  factors: {
    stageScore: number;       // 0-25: Pipeline position
    engagementScore: number;  // 0-25: Message frequency & recency
    intentScore: number;      // 0-25: Signal strength from conversation content
    velocityScore: number;    // 0-25: Speed of stage progression
  };
  signals: string[];
}

// Stage position weights (further along = higher score)
const STAGE_WEIGHTS: Record<string, number> = {
  new: 2,
  first_contact: 5,
  vehicle_interest: 10,
  quote_sent: 15,
  appointment_set: 18,
  finance_intake: 20,
  negotiation: 23,
  closed_won: 25,
  closed_lost: 0,
  stale: 1,
};

// Intent signal keywords with weights
const INTENT_SIGNALS: { pattern: RegExp; weight: number; label: string }[] = [
  { pattern: /\b(buy|purchase|ready to|let'?s do it|sign|close)\b/i, weight: 5, label: "purchase-intent" },
  { pattern: /\b(test drive|come in|visit|appointment|schedule|book)\b/i, weight: 4, label: "appointment-intent" },
  { pattern: /\b(finance|payment|monthly|biweekly|credit|loan|lease)\b/i, weight: 4, label: "finance-intent" },
  { pattern: /\b(trade.?in|current car|selling my)\b/i, weight: 3, label: "trade-in-signal" },
  { pattern: /\b(quote|price|cost|how much|afford|budget)\b/i, weight: 3, label: "price-inquiry" },
  { pattern: /\b(specific model|vin|stock number|this one)\b/i, weight: 3, label: "specific-vehicle" },
  { pattern: /\b(family|kids|commute|work|tow|haul)\b/i, weight: 2, label: "needs-identified" },
  { pattern: /\b(warranty|service|maintenance|insurance)\b/i, weight: 2, label: "ownership-research" },
  { pattern: /\b(compare|versus|vs|difference|better)\b/i, weight: 1, label: "comparison-shopping" },
];

export function scoreLead(
  lead: Lead,
  conversations: Conversation[],
  messages: Message[]
): LeadScoreBreakdown {
  const signals: string[] = [];

  // 1. Stage Score (0-25)
  const stageScore = STAGE_WEIGHTS[lead.stage] ?? 2;

  // 2. Engagement Score (0-25)
  let engagementScore = 0;
  const leadConversations = conversations.filter(c => c.leadId === lead.id);
  const leadMessages = messages.filter(m =>
    leadConversations.some(c => c.id === m.conversationId) && m.role === 'customer'
  );

  // Message volume (max 10 points)
  engagementScore += Math.min(leadMessages.length * 2, 10);
  if (leadMessages.length >= 5) signals.push("high-engagement");

  // Recency (max 10 points) — how recently did they last message?
  if (lead.lastActivityAt) {
    const hoursSinceActivity = (Date.now() - new Date(lead.lastActivityAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceActivity < 1) {
      engagementScore += 10;
      signals.push("active-now");
    } else if (hoursSinceActivity < 24) {
      engagementScore += 7;
      signals.push("active-today");
    } else if (hoursSinceActivity < 72) {
      engagementScore += 4;
    } else if (hoursSinceActivity < 168) {
      engagementScore += 1;
    }
    // >7 days: 0 additional points
  }

  // Multi-channel engagement (max 5 points)
  const channels = new Set(leadConversations.map(c => c.channel));
  if (channels.size >= 2) {
    engagementScore += Math.min(channels.size * 2, 5);
    signals.push("multi-channel");
  }

  engagementScore = Math.min(engagementScore, 25);

  // 3. Intent Score (0-25)
  let intentScore = 0;
  const allCustomerText = leadMessages.map(m => m.content).join(" ");

  for (const signal of INTENT_SIGNALS) {
    if (signal.pattern.test(allCustomerText)) {
      intentScore += signal.weight;
      signals.push(signal.label);
    }
  }

  // Escalation requested = strong signal (positive or negative)
  const hasEscalation = leadConversations.some(c => c.escalationFlag);
  if (hasEscalation) {
    signals.push("escalation-active");
  }

  intentScore = Math.min(intentScore, 25);

  // 4. Velocity Score (0-25) — how fast are they progressing?
  let velocityScore = 0;
  if (lead.firstContactAt) {
    const daysSinceFirst = (Date.now() - new Date(lead.firstContactAt).getTime()) / (1000 * 60 * 60 * 24);
    const stageIndex = Object.keys(STAGE_WEIGHTS).indexOf(lead.stage);

    if (daysSinceFirst > 0 && stageIndex > 0) {
      const velocity = stageIndex / daysSinceFirst; // stages per day
      if (velocity > 2) {
        velocityScore = 25;
        signals.push("fast-mover");
      } else if (velocity > 1) {
        velocityScore = 18;
      } else if (velocity > 0.5) {
        velocityScore = 12;
      } else if (velocity > 0.2) {
        velocityScore = 6;
      } else {
        velocityScore = 2;
        if (daysSinceFirst > 14 && stageIndex < 3) signals.push("slow-progression");
      }
    }
  }

  // Overdue follow-up reduces velocity
  if (lead.followUpOverdue) {
    velocityScore = Math.max(velocityScore - 5, 0);
    signals.push("follow-up-overdue");
  }

  const total = Math.min(stageScore + engagementScore + intentScore + velocityScore, 100);

  // Determine priority band
  // Threshold: 70+ = hot (in automotive, negotiation-stage active leads are hot)
  let priority: LeadPriority;
  if (total >= 70) priority = 'hot';
  else if (total >= 40) priority = 'warm';
  else if (total >= 15) priority = 'new';
  else priority = 'cold';

  return {
    total,
    priority,
    factors: { stageScore, engagementScore, intentScore, velocityScore },
    signals,
  };
}
