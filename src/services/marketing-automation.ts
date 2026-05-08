import type { Conversation, Lead, Quote } from '@/types/domain';

export interface MarketingAutomationInput {
  lead: Lead;
  conversation?: Conversation | null;
  quotes?: Quote[];
  now?: Date;
}

export interface MarketingAutomationDecision {
  allowed: boolean;
  reason: string;
  message: string | null;
  dryRun: true;
  signals: string[];
}

const AI_DISCLOSURE = 'Disclosure: This message was prepared by an AI assistant for APEX Business Systems LTD.';

function hoursSince(now: Date, iso?: string): number {
  if (!iso) return 9999;
  const time = new Date(iso).getTime();
  return Number.isFinite(time) ? (now.getTime() - time) / 3_600_000 : 9999;
}

export function buildMarketingAutomationDecision(input: MarketingAutomationInput): MarketingAutomationDecision {
  const now = input.now ?? new Date();
  const conversation = input.conversation ?? null;
  const quotes = input.quotes ?? [];
  const signals: string[] = [];

  if (conversation?.optedOut || conversation?.suppressionActive) {
    return { allowed: false, reason: 'Blocked by opt-out or suppression.', message: null, dryRun: true, signals: ['opt-out'] };
  }
  if (conversation?.restricted || conversation?.status === 'restricted') {
    return { allowed: false, reason: 'Blocked because conversation is restricted.', message: null, dryRun: true, signals: ['restricted'] };
  }

  const viewedQuote = quotes.find(quote => quote.leadId === input.lead.id && quote.status === 'viewed');
  const sentQuote = quotes.find(quote => quote.leadId === input.lead.id && quote.status === 'sent');
  const idleHours = hoursSince(now, conversation?.lastMessageAt ?? input.lead.lastActivityAt);

  let body: string;
  if (viewedQuote) {
    signals.push('quote-viewed');
    body = `Hi ${input.lead.name}, noticed quote ${viewedQuote.quoteNumber} was reviewed. Want help comparing payments or booking a test drive?`;
  } else if (sentQuote) {
    signals.push('quote-sent');
    body = `Hi ${input.lead.name}, checking in on quote ${sentQuote.quoteNumber}. I can answer questions or adjust packages and terms.`;
  } else if (idleHours >= 72) {
    signals.push('reactivation');
    body = `Hi ${input.lead.name}, we have fresh inventory that may fit your search. Would you like updated options?`;
  } else {
    return { allowed: false, reason: 'No automation trigger reached.', message: null, dryRun: true, signals: ['no-trigger'] };
  }

  return {
    allowed: true,
    reason: 'Eligible for local dry-run marketing automation.',
    message: `${AI_DISCLOSURE}\n${body}\nReply STOP to opt out.`,
    dryRun: true,
    signals,
  };
}

export { AI_DISCLOSURE };
