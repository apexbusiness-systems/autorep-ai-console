/**
 * AI Provider Service
 * Refactored to route exclusively through the centralized AUTOREPAI agent-orchestrator edge function.
 */

import { supabase } from '@/lib/supabase';
import { AgentResponse, AgentContext } from '@/agents/autorepai/types';
import { getAgentMode, isDemoMode } from '@/agents/autorepai/env';

export interface AIProviderConfig {
  provider: 'grok' | 'openai' | 'anthropic';
  apiKey: string;
  modelId: string;
}

export interface AICompletionRequest {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  contextParams?: Partial<AgentContext>;
  conversationId?: string;
}

class AIProviderService {
  private config: AIProviderConfig | null = null;

  configure(config: AIProviderConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return this.config !== null && !!this.config.apiKey;
  }

  async complete(request: AICompletionRequest): Promise<AgentResponse> {
    const mode = getAgentMode(import.meta.env || {});

    if (isDemoMode(mode) && !this.isConfigured()) {
       // Demo mode fallback when no backend is configured.
       // This ensures local demo functionality works without Supabase edge functions,
       // but is strictly isolated by the environment gate.
       return this.demoComplete(request);
    }

    // Call the centralized edge function
    const { data, error } = await supabase.functions.invoke('agent-orchestrator', {
      body: {
        messages: request.messages,
        conversationId: request.conversationId,
        contextParams: request.contextParams
      }
    });

    if (error) {
      console.error("Orchestrator error:", error);
      throw new Error(`AI Orchestrator Error: ${error.message}`);
    }

    if (data.error) {
      // Compliance gate or inner failure
      throw new Error(`Agent Error: ${data.error} - ${data.reason || ''}`);
    }

    return data as AgentResponse;
  }

  private async demoComplete(request: AICompletionRequest): Promise<AgentResponse> {
    const lastUserMsg = [...request.messages].reverse().find(m => m.role === 'user')?.content || '';
    const lastUserMsgLower = lastUserMsg.toLowerCase();

    let message = "I'd be happy to help you find the perfect vehicle! Could you tell me more about what you're looking for?";
    let intent = "general_inquiry";
    let posture: "LEAN_IN" | "GUIDE" | "PLANT" | "RESET" = "GUIDE";

    if (lastUserMsgLower.includes('price') || lastUserMsgLower.includes('payment')) {
      message = "Great question about pricing! Let me pull up some payment scenarios for you. Would you like me to build a detailed quote?";
      intent = "finance_inquiry";
      posture = "LEAN_IN";
    } else if (lastUserMsgLower.includes('human') || lastUserMsgLower.includes('manager')) {
      message = "I'll connect you with a manager right away.";
      intent = "escalation";
      posture = "RESET";
    }

    return {
      message,
      intent,
      posture,
      stage: 'demo_stage',
      confidence: 1.0,
      nextAction: null,
      toolCall: intent === 'escalation' ? { name: 'escalate', args: {} } : null,
      escalate: intent === 'escalation',
      complianceFlags: ['MOCK_DISCLOSURE'],
      auditMeta: {
        promptVersion: 'demo',
        model: 'mock-demo',
        channel: request.contextParams?.channel || 'web'
      }
    };
  }

  // Keeping stub methods to prevent breaking existing components that rely on them
  // In a full refactor, these would be removed and components would use the new orchestrator schema natively.
  async generateNextBestAction() {
    return {
      action: 'Qualify customer needs',
      description: 'Ask about budget and timeline.',
      priority: 'high',
      type: 'collect_info',
    };
  }

  async summarizeTranscript() {
    return "Conversation summary.";
  }
}

export const aiProvider = new AIProviderService();
export default aiProvider;
