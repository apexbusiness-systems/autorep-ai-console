export type AgentMode = 'demo' | 'sandbox' | 'prod';

export type Posture = 'LEAN_IN' | 'GUIDE' | 'PLANT' | 'RESET';

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface AgentResponse {
  message: string;
  intent: string;
  posture: Posture;
  stage: string | null;
  confidence: number;
  nextAction: string | null;
  toolCall: ToolCall | null;
  escalate: boolean;
  complianceFlags: string[];
  auditMeta: {
    promptVersion: string;
    model: string;
    channel: string;
  };
}

export interface AgentContext {
  lead?: Record<string, unknown>;
  customerProfile?: Record<string, unknown>;
  conversation?: Record<string, unknown>;
  recentMessages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  currentVehicleInterest?: string[];
  quoteState?: Record<string, unknown>;
  financePacketState?: Record<string, unknown>;
  channel: 'web' | 'sms' | 'voice' | 'email';
  consentStatus: {
    optedOut: boolean;
    suppressed: boolean;
  };
  disclosureState: {
    aiDisclosed: boolean;
  };
  escalationState: {
    escalated: boolean;
  };
  dealershipConfig?: Record<string, unknown>;
  integrationStatus?: Record<string, boolean>;
}

export interface ComplianceResult {
  approved: boolean;
  blockedReason: string | null;
  flags: string[];
}
