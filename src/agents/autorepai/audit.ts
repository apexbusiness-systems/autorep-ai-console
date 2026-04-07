import { AgentContext, AgentResponse, ComplianceResult } from './types';

export interface AuditEvent {
  timestamp: string;
  conversationId?: string;
  channel: string;
  promptVersion: string;
  model: string;
  posture: string;
  intent: string;
  toolCallRequested: string | null;
  complianceApproved: boolean;
  complianceBlockedReason: string | null;
  complianceFlags: string[];
  escalationDecision: boolean;
}

export function buildAuditEvent(
  context: AgentContext,
  response: AgentResponse,
  compliance: ComplianceResult,
  conversationId?: string
): AuditEvent {
  return {
    timestamp: new Date().toISOString(),
    conversationId: conversationId || context.conversation?.id,
    channel: context.channel,
    promptVersion: response.auditMeta.promptVersion,
    model: response.auditMeta.model,
    posture: response.posture,
    intent: response.intent,
    toolCallRequested: response.toolCall?.name || null,
    complianceApproved: compliance.approved,
    complianceBlockedReason: compliance.blockedReason,
    complianceFlags: compliance.flags,
    escalationDecision: response.escalate
  };
}
