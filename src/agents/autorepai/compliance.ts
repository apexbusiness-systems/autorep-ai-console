import { AgentContext, AgentResponse, ComplianceResult } from './types';

// Comprehensive finance guarantee blocklist — covers common LLM hallucination patterns
const FINANCE_BLOCKLIST = [
  "guaranteed approval",
  "100% approved",
  "guaranteed apr",
  "will be approved",
  "guaranteed financing",
  "everyone is approved",
  "no credit check required",
  "guaranteed rate",
  "approval guaranteed",
  "we guarantee",
  "you will qualify",
  "instant approval",
  "pre-approved for",
  "you're approved",
  "you are approved",
  "guaranteed to get",
  "no one is turned down",
  "zero percent guaranteed",
  "0% guaranteed",
  "we can guarantee",
  "guaranteed credit",
  "definitely approved",
  "certain to be approved",
];

// Urgency/scarcity blocklist — prevents fabricated pressure tactics
const URGENCY_BLOCKLIST = [
  "deal ends today",
  "offer expires tonight",
  "last one on the lot",
  "won't last long",
  "someone else is looking",
  "another buyer is interested",
  "price goes up tomorrow",
  "limited time only",
  "act now or",
  "only available today",
  "selling fast",
  "going to be gone",
];

// Low-confidence auto-escalation threshold
const LOW_CONFIDENCE_THRESHOLD = 0.4;

export function runComplianceGate(context: AgentContext, response: AgentResponse): ComplianceResult {
  const flags: string[] = [];

  // 1. Contact/channel authorized
  if (context.consentStatus.optedOut || context.consentStatus.suppressed) {
    return {
      approved: false,
      blockedReason: "User is opted out or suppressed.",
      flags: ["OPTED_OUT"]
    };
  }

  // 2. Already escalated — block AI responses if human has taken over
  if (context.escalationState.escalated) {
    return {
      approved: false,
      blockedReason: "Conversation is escalated to a human agent. AI responses are blocked.",
      flags: ["ESCALATED_BLOCKED"]
    };
  }

  // 3. Disclosure required
  if (!context.disclosureState.aiDisclosed && context.recentMessages.length <= 1) {
    const messageLower = response.message.toLowerCase();
    if (!messageLower.includes("ai") && !messageLower.includes("assistant") && !messageLower.includes("automated")) {
       return {
         approved: false,
         blockedReason: "AI disclosure missing on first contact.",
         flags: ["MISSING_DISCLOSURE"]
       };
    }
    flags.push("AI_DISCLOSED");
  }

  const messageLower = response.message.toLowerCase();

  // 4. Finance language safe — expanded blocklist
  for (const phrase of FINANCE_BLOCKLIST) {
    if (messageLower.includes(phrase)) {
      return {
        approved: false,
        blockedReason: `Contains prohibited finance guarantee language: "${phrase}"`,
        flags: ["FINANCE_GUARANTEE_VIOLATION"]
      };
    }
  }

  // 5. Urgency/scarcity language check
  for (const phrase of URGENCY_BLOCKLIST) {
    if (messageLower.includes(phrase)) {
      return {
        approved: false,
        blockedReason: `Contains prohibited urgency/scarcity language: "${phrase}"`,
        flags: ["URGENCY_SCARCITY_VIOLATION"]
      };
    }
  }

  // 6. One ask per turn
  const questionMarks = (response.message.match(/\?/g) || []).length;
  if (questionMarks > 1) {
     flags.push("MULTIPLE_QUESTIONS_DETECTED");
  }

  // 7. Confidence-based auto-escalation
  if (response.confidence < LOW_CONFIDENCE_THRESHOLD && !response.escalate) {
    flags.push("LOW_CONFIDENCE_ESCALATION_RECOMMENDED");
  }

  // 8. Message length sanity check (prevent runaway LLM output)
  if (response.message.length > 2000) {
    flags.push("EXCESSIVE_MESSAGE_LENGTH");
  }

  // 9. PII leakage check — ensure agent doesn't echo back sensitive data unnecessarily
  const piiPatterns = [
    /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/, // SSN-like
    /\b\d{9}\b/, // 9-digit sequences (SIN, etc.)
    /\bdriver'?s?\s*licen[cs]e\s*#?\s*:?\s*\w{5,}/i, // DL number
  ];
  for (const pattern of piiPatterns) {
    if (pattern.test(response.message)) {
      flags.push("POTENTIAL_PII_EXPOSURE");
      break;
    }
  }

  return {
    approved: true,
    blockedReason: null,
    flags
  };
}
