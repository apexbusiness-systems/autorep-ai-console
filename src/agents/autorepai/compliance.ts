import { AgentContext, AgentResponse, ComplianceResult } from './types';

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

  // 2. Disclosure required
  if (!context.disclosureState.aiDisclosed && context.recentMessages.length <= 1) {
    const messageLower = response.message.toLowerCase();
    if (!messageLower.includes("ai") && !messageLower.includes("assistant") && !messageLower.includes("automated")) {
       // We can either block or just flag it. The rule is strictly disclosure on first contact.
       // We will block and require the prompt to fix it, or we could auto-append. Let's block to enforce model behavior.
       return {
         approved: false,
         blockedReason: "AI disclosure missing on first contact.",
         flags: ["MISSING_DISCLOSURE"]
       };
    }
    flags.push("AI_DISCLOSED");
  }

  // 3. Finance language safe
  const financeGuarantees = ["guaranteed approval", "100% approved", "guaranteed apr", "will be approved"];
  const messageLower = response.message.toLowerCase();
  for (const phrase of financeGuarantees) {
    if (messageLower.includes(phrase)) {
      return {
        approved: false,
        blockedReason: "Contains prohibited finance guarantee language.",
        flags: ["FINANCE_GUARANTEE_VIOLATION"]
      };
    }
  }

  // 4. One ask per turn
  // A simple heuristic: count question marks. If > 1, might be multiple asks.
  // We'll just flag it for now as blocking on '?' might be too aggressive,
  // but if the rules are strict, we could block.
  const questionMarks = (response.message.match(/\?/g) || []).length;
  if (questionMarks > 1) {
     flags.push("MULTIPLE_QUESTIONS_DETECTED");
     // depending on strictness we could return { approved: false, blockedReason: "Multiple asks detected." }
     // Let's stick to flagging for multiple question marks but enforcing prompt instructions.
  }

  return {
    approved: true,
    blockedReason: null,
    flags
  };
}
