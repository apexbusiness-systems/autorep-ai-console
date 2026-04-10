import { AgentContext } from './types';
import { AUTOREPAI_CONSTITUTION } from './constitution';
import { ALLOWED_TOOLS } from './tool-registry';

const BASE_PROMPT = `You are AUTOREPAI, an expert automotive sales AI agent for Door Step Auto.
You help customers find their ideal vehicle, answer questions about inventory, build quotes, handle objections professionally, and guide them through the purchase process.
Be warm, professional, knowledgeable, and consultative. Mirror the customer's energy level — enthusiastic with excited buyers, calm and patient with researchers.

You MUST respond ONLY in valid JSON matching the provided schema. Do NOT include markdown blocks or any other text outside the JSON.
`;

const TOOL_DESCRIPTIONS: Record<string, string> = {
  inventory_match: "Search vehicle inventory by preferences (make, model, year, budget, body type). Use when the customer expresses interest in finding a vehicle.",
  send_sms: "Send an SMS message to the customer. Use when communicating via SMS channel or when asked to text details.",
  send_email: "Send an email (quote, follow-up, confirmation). Use when sending detailed information like quotes, payment breakdowns, or appointment confirmations.",
  finance_route: "Route a completed finance packet to Dealertrack, PBS, or Autovance for credit decisioning. Use only when the finance packet is at least 80% complete.",
  quote_present: "Build and present a payment quote with scenarios (monthly/biweekly, different terms). Use when the customer asks about pricing, payments, or wants to see numbers.",
  escalate: "Hand the conversation to a human manager. MUST use when: customer explicitly requests a human, sentiment is angry, repeated failures to assist, or confidence drops below 0.4.",
  stage_update: "Update the lead's pipeline stage (e.g., from 'first_contact' to 'vehicle_interest'). Use when a clear stage transition occurs.",
};

function buildToolSection(): string {
  let section = "AVAILABLE TOOLS (use 'toolCall' field to invoke):\n";
  for (const tool of ALLOWED_TOOLS) {
    section += `- ${tool}: ${TOOL_DESCRIPTIONS[tool] || "No description."}\n`;
  }
  section += "\nOnly request ONE tool per response. If no tool is needed, set toolCall to null.\n";
  return section;
}

function buildConversationSummary(context: AgentContext): string {
  const msgs = context.recentMessages;
  if (msgs.length === 0) return "";

  let summary = "CONVERSATION HISTORY SUMMARY:\n";
  summary += `- Messages exchanged: ${msgs.length}\n`;

  // Detect conversation themes
  const allContent = msgs.map(m => m.content.toLowerCase()).join(" ");
  const themes: string[] = [];
  if (/suv|truck|sedan|coupe|van|wagon|hatchback/.test(allContent)) themes.push("vehicle type discussion");
  if (/price|payment|afford|budget|monthly|biweekly|finance/.test(allContent)) themes.push("pricing/finance inquiry");
  if (/trade.?in|current.?car|existing.?vehicle/.test(allContent)) themes.push("trade-in discussion");
  if (/test.?drive|come.?in|visit|appointment|schedule/.test(allContent)) themes.push("appointment interest");
  if (/credit|approval|score|application/.test(allContent)) themes.push("credit/finance application");
  if (/objection|expensive|too.?much|cheaper|competitor/.test(allContent)) themes.push("price objection");

  if (themes.length > 0) {
    summary += `- Key topics: ${themes.join(", ")}\n`;
  }

  // Include last 3 messages for immediate context
  const recent = msgs.slice(-3);
  summary += "- Recent exchange:\n";
  for (const msg of recent) {
    const role = msg.role === 'user' ? 'Customer' : 'Agent';
    const truncated = msg.content.length > 150 ? msg.content.substring(0, 147) + "..." : msg.content;
    summary += `  [${role}]: ${truncated}\n`;
  }

  return summary;
}

function buildLeadContext(context: AgentContext): string {
  let section = "";

  if (context.lead) {
    const lead = context.lead;
    section += "LEAD PROFILE:\n";
    if (lead.name) section += `- Name: ${lead.name}\n`;
    if (lead.source) section += `- Source: ${String(lead.source).replace(/_/g, " ")}\n`;
    if (lead.stage) section += `- Current Stage: ${String(lead.stage).replace(/_/g, " ")}\n`;
    if (lead.priority) section += `- Priority: ${lead.priority}\n`;
    if (lead.vehicleInterests && Array.isArray(lead.vehicleInterests) && (lead.vehicleInterests as string[]).length > 0) {
      section += `- Vehicle Interests: ${(lead.vehicleInterests as string[]).join(", ")}\n`;
    }
    if (lead.notes) section += `- Notes: ${lead.notes}\n`;
  }

  if (context.quoteState) {
    section += "\nACTIVE QUOTE:\n";
    const q = context.quoteState;
    if (q.status) section += `- Status: ${q.status}\n`;
    if (q.scenarios && Array.isArray(q.scenarios)) {
      section += `- Scenarios: ${(q.scenarios as unknown[]).length} payment option(s) prepared\n`;
    }
  }

  if (context.financePacketState) {
    const fp = context.financePacketState;
    section += "\nFINANCE STATUS:\n";
    if (fp.completionPercentage !== undefined) section += `- Completion: ${fp.completionPercentage}%\n`;
    if (fp.blockers && Array.isArray(fp.blockers) && (fp.blockers as string[]).length > 0) {
      section += `- Blockers: ${(fp.blockers as string[]).join(", ")}\n`;
    }
    if (fp.status) section += `- Status: ${fp.status}\n`;
  }

  return section;
}

export function buildSystemPrompt(context: AgentContext): string {
  let prompt = BASE_PROMPT + '\n\n' + AUTOREPAI_CONSTITUTION + '\n\n';

  // Tool descriptions for better tool selection
  prompt += buildToolSection() + '\n';

  // Conversation summary for multi-turn memory
  const conversationSummary = buildConversationSummary(context);
  if (conversationSummary) {
    prompt += conversationSummary + '\n';
  }

  // Lead and deal context
  const leadContext = buildLeadContext(context);
  if (leadContext) {
    prompt += leadContext + '\n';
  }

  // Dealership configuration
  if (context.dealershipConfig) {
    prompt += "DEALERSHIP:\n";
    const dc = context.dealershipConfig;
    if (dc.name) prompt += `- Name: ${dc.name}\n`;
    if (dc.city) prompt += `- Location: ${dc.city}, ${dc.province || ""}\n`;
    if (dc.website) prompt += `- Website: ${dc.website}\n`;
    prompt += '\n';
  }

  prompt += "CURRENT CONTEXT:\n";
  prompt += `- Channel: ${context.channel}\n`;
  prompt += `- AI Disclosed: ${context.disclosureState.aiDisclosed}\n`;
  prompt += `- Escalation Active: ${context.escalationState.escalated}\n`;
  if (context.currentVehicleInterest && context.currentVehicleInterest.length > 0) {
    prompt += `- Vehicle Interests: ${context.currentVehicleInterest.join(', ')}\n`;
  }

  prompt += "\nINSTRUCTIONS FOR RESPONSE:\n";
  prompt += "- Choose an appropriate 'posture': LEAN_IN (high intent, ready to move), GUIDE (researching, needs options), PLANT (handling objection, holding ground), RESET (frustrated, starting over).\n";
  prompt += "- Determine 'intent' (e.g., vehicle_inquiry, finance_question, appointment_request, objection, general_chat, escalation_request).\n";
  prompt += "- Set 'confidence' honestly (0.0-1.0). If below 0.4, set 'escalate' to true.\n";
  prompt += "- Provide your 'message' text for the user.\n";
  prompt += "- Ensure you ask ONLY ONE QUESTION per message.\n";
  prompt += "- If the customer mentions a budget, vehicle type, or feature — use the inventory_match tool.\n";
  prompt += "- If the customer asks about payments — use the quote_present tool.\n";
  if (!context.disclosureState.aiDisclosed) {
    prompt += "- YOU MUST DISCLOSE YOU ARE AN AI ASSISTANT IN YOUR MESSAGE. Example: 'Hi! I'm an AI assistant with Door Step Auto...'\n";
  }

  return prompt;
}
