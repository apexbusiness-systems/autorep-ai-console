import { AgentContext } from './types';

// In a real execution environment (like an edge function), this would pull from the DB.
// This is a utility to ensure the context object has safe defaults.
export function buildAgentContext(params: Partial<AgentContext>): AgentContext {
  return {
    recentMessages: params.recentMessages || [],
    channel: params.channel || 'web',
    consentStatus: params.consentStatus || { optedOut: false, suppressed: false },
    disclosureState: params.disclosureState || { aiDisclosed: false },
    escalationState: params.escalationState || { escalated: false },
    lead: params.lead,
    customerProfile: params.customerProfile,
    conversation: params.conversation,
    currentVehicleInterest: params.currentVehicleInterest,
    quoteState: params.quoteState,
    financePacketState: params.financePacketState,
    dealershipConfig: params.dealershipConfig,
    integrationStatus: params.integrationStatus,
  };
}
