/**
 * AI Provider Service
 * Abstracts the LLM integration behind a clean service boundary.
 * Currently targets Grok (xAI) as the primary model provider.
 * Drop in API keys via IntegrationConfig to activate.
 */

export interface AIProviderConfig {
  provider: 'grok' | 'openai' | 'anthropic';
  apiKey: string;
  modelId: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionRequest {
  systemPrompt: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  context?: {
    customerProfile?: Record<string, unknown>;
    vehicleMatches?: Record<string, unknown>[];
    dealStage?: string;
    objections?: string[];
  };
  maxTokens?: number;
}

export interface AICompletionResponse {
  content: string;
  tokensUsed: number;
  finishReason: string;
  suggestedActions?: string[];
  detectedIntent?: string;
  detectedSentiment?: string;
  confidenceScore?: number;
}

export interface NextBestAction {
  action: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'send_quote' | 'book_appointment' | 'follow_up' | 'send_vehicle' | 'escalate' | 'collect_info' | 'handle_objection';
}

const GROK_BASE_URL = 'https://api.x.ai/v1';

const DEFAULT_SYSTEM_PROMPT = `You are an expert automotive sales AI agent for Door Step Auto. You help customers find their ideal vehicle, answer questions about inventory, build quotes, handle objections professionally, and guide them through the purchase process. Be warm, professional, knowledgeable, and consultative. Never make claims about financing approval. Always disclose you are an AI when asked.`;

class AIProviderService {
  private config: AIProviderConfig | null = null;

  configure(config: AIProviderConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return this.config !== null && !!this.config.apiKey;
  }

  getProviderName(): string {
    return this.config?.provider || 'grok';
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.config?.apiKey) {
      // Demo mode: return intelligent mock responses
      return this.demoComplete(request);
    }

    const baseUrl = this.config.baseUrl || (this.config.provider === 'grok' ? GROK_BASE_URL : 'https://api.openai.com/v1');

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.modelId,
        messages: [
          { role: 'system', content: request.systemPrompt || DEFAULT_SYSTEM_PROMPT },
          ...request.messages,
        ],
        max_tokens: request.maxTokens || this.config.maxTokens || 1024,
        temperature: this.config.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI provider error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content || '',
      tokensUsed: data.usage?.total_tokens || 0,
      finishReason: choice?.finish_reason || 'stop',
    };
  }

  async generateNextBestAction(context: {
    dealStage: string;
    sentiment: string;
    lastMessages: string[];
    vehicleInterests: string[];
    quotesSent: number;
  }): Promise<NextBestAction> {
    // Intelligent rule-based fallback when AI is not configured
    if (context.dealStage === 'first_contact' || context.dealStage === 'new') {
      return {
        action: 'Qualify customer needs and preferences',
        description: 'Ask about budget, vehicle type preference, and timeline to purchase.',
        priority: 'high',
        type: 'collect_info',
      };
    }
    if (context.dealStage === 'vehicle_interest' && context.quotesSent === 0) {
      return {
        action: 'Send vehicle comparison quote',
        description: `Build and send a comparison quote for ${context.vehicleInterests.join(' vs ')} with monthly payment breakdown.`,
        priority: 'high',
        type: 'send_quote',
      };
    }
    if (context.dealStage === 'quote_sent') {
      return {
        action: 'Book test drive appointment',
        description: 'Customer has received a quote. Suggest booking a test drive to move toward closing.',
        priority: 'high',
        type: 'book_appointment',
      };
    }
    if (context.sentiment === 'frustrated') {
      return {
        action: 'Escalate to manager',
        description: 'Customer sentiment is negative. Recommend human handoff to an experienced closer.',
        priority: 'high',
        type: 'escalate',
      };
    }
    if (context.dealStage === 'appointment_set') {
      return {
        action: 'Initiate finance pre-qualification',
        description: 'Appointment is booked. Begin finance intake to have paperwork ready.',
        priority: 'medium',
        type: 'collect_info',
      };
    }
    return {
      action: 'Follow up with customer',
      description: 'Send a personalized follow-up message to keep the deal moving.',
      priority: 'medium',
      type: 'follow_up',
    };
  }

  async summarizeTranscript(messages: { role: string; content: string }[]): Promise<string> {
    if (!this.isConfigured()) {
      const topics = new Set<string>();
      for (const m of messages) {
        if (m.content.toLowerCase().includes('suv')) topics.add('SUV');
        if (m.content.toLowerCase().includes('truck')) topics.add('truck');
        if (m.content.toLowerCase().includes('budget') || m.content.toLowerCase().includes('$')) topics.add('budget discussed');
        if (m.content.toLowerCase().includes('trade')) topics.add('trade-in');
        if (m.content.toLowerCase().includes('finance')) topics.add('financing');
      }
      return `Customer inquiry covering: ${[...topics].join(', ') || 'general vehicle inquiry'}. ${messages.length} messages exchanged.`;
    }
    const result = await this.complete({
      systemPrompt: 'Summarize this automotive sales conversation in 2-3 sentences. Focus on: customer needs, vehicles discussed, objections, and next steps.',
      messages: messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      maxTokens: 200,
    });
    return result.content;
  }

    private async demoComplete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const lastUserMsg = [...request.messages].reverse().find(m => m.role === 'user')?.content || '';
    const lastUserMsgLower = lastUserMsg.toLowerCase();

    // Determine if it's a voice call context
    const isVoice = request.systemPrompt.includes("voice") || request.messages.some(m => m.content.toLowerCase().includes("call"));

    // Fillers for more natural voice
    const fillers = isVoice ? ["Um, ", "Let me see... ", "Ah, ", "Well, "] : [""];
    const randomFiller = () => fillers[Math.floor(Math.random() * fillers.length)];

    let response = "I'd be happy to help you find the perfect vehicle! Could you tell me more about what you're looking for?";

    if (lastUserMsgLower.includes('price') || lastUserMsgLower.includes('cost') || lastUserMsgLower.includes('payment') || lastUserMsgLower.includes('expensive')) {
      response = randomFiller() + "Great question about pricing! Let me pull up some payment scenarios for you. With our current programs, I can show you options that work within your budget. Would you like me to build a detailed quote?";
    } else if (lastUserMsgLower.includes('trade') || lastUserMsgLower.includes('selling')) {
      response = randomFiller() + "We'd love to look at your trade-in! To give you the most accurate value, could you share the year, make, model, and approximate mileage? I can have a preliminary estimate for you right away.";
    } else if (lastUserMsgLower.includes('test drive') || lastUserMsgLower.includes('see it') || lastUserMsgLower.includes('come in')) {
      response = "Absolutely! I can get you booked for a test drive. What day and time works best for you this week? We have availability throughout the day.";
    } else if (lastUserMsgLower.includes('finance') || lastUserMsgLower.includes('credit') || lastUserMsgLower.includes('loan')) {
      response = randomFiller() + "We work with multiple lenders to find the best rates available. I can start a quick pre-qualification for you. It's a soft inquiry that won't affect your credit score. Would you like to proceed with that?";
    } else if (lastUserMsgLower.includes('hello') || lastUserMsgLower.includes('hi') || lastUserMsgLower.includes('hey')) {
      response = "Hi there! I'm Alex from Door Step Auto. How can I help you today?";
    } else if (lastUserMsgLower.includes('human') || lastUserMsgLower.includes('robot') || lastUserMsgLower.includes('ai') || lastUserMsgLower.includes('real person')) {
      response = "I am an AI assistant here at Door Step Auto, but I'm fully equipped to help you with inventory, pricing, and booking appointments. If you need to speak with a human manager, I can certainly get one for you. How would you like to proceed?";
    } else if (lastUserMsgLower.includes('yes') || lastUserMsgLower.includes('sure') || lastUserMsgLower.includes('okay')) {
      response = "Perfect! Let me get that sorted out for you right now. Just a moment.";
    } else if (lastUserMsgLower.includes('no') || lastUserMsgLower.includes('not really')) {
      response = "No problem at all. Is there anything else I can help you with today?";
    } else if (lastUserMsgLower.includes('bye') || lastUserMsgLower.includes('goodbye')) {
      response = "Thanks for reaching out to Door Step Auto! Have a wonderful day.";
    }

    return {
      content: response,
      tokensUsed: 0,
      finishReason: 'demo',
      confidenceScore: 0.85,
    };
  }
}

export const aiProvider = new AIProviderService();
export default aiProvider;
