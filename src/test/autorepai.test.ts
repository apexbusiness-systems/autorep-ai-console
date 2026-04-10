import { describe, it, expect } from 'vitest';
import { runComplianceGate } from '../agents/autorepai/compliance';
import { buildSystemPrompt } from '../agents/autorepai/prompt-builder';
import { agentResponseSchema } from '../agents/autorepai/output-schema';
import { AgentResponse, AgentContext } from '../agents/autorepai/types';
import { validateToolCall } from '../agents/autorepai/tool-registry';
import { agentEvalFixtures } from './fixtures/agent-evals';
import { getAgentMode, isDemoMode, isProdMode } from '../agents/autorepai/env';
import { scoreLead } from '../services/lead-scoring';
import { generateFollowUps } from '../services/follow-up-engine';

// Helper to create a mock response
function mockResponse(overrides: Partial<AgentResponse> = {}): AgentResponse {
  return {
    message: "I am an AI assistant. How can I help?",
    intent: "general",
    posture: "GUIDE",
    stage: "new",
    confidence: 0.9,
    nextAction: null,
    toolCall: null,
    escalate: false,
    complianceFlags: [],
    auditMeta: { promptVersion: '1', model: 'test', channel: 'web' },
    ...overrides,
  };
}

describe('AUTOREPAI Runtime', () => {
  describe('Compliance Gate', () => {
    it('should block opted-out users', () => {
      const { context, expectedComplianceApproved } = agentEvalFixtures.optOutBlocked;
      const result = runComplianceGate(context, mockResponse({ message: "Sure, let's look at cars." }));
      expect(result.approved).toBe(expectedComplianceApproved);
      expect(result.flags).toContain("OPTED_OUT");
    });

    it('should flag missing AI disclosure on first contact', () => {
      const { context } = agentEvalFixtures.firstContact;
      const result = runComplianceGate(context, mockResponse({ message: "Hello! How can I help?" }));
      expect(result.approved).toBe(false);
      expect(result.flags).toContain("MISSING_DISCLOSURE");
    });

    it('should block finance guarantees', () => {
      const context = agentEvalFixtures.financeQuestion.context;
      const result = runComplianceGate(context, mockResponse({ message: "You are guaranteed approval!" }));
      expect(result.approved).toBe(false);
      expect(result.flags).toContain("FINANCE_GUARANTEE_VIOLATION");
    });

    it('should block urgency/scarcity language', () => {
      const context = agentEvalFixtures.financeQuestion.context;
      const result = runComplianceGate(context, mockResponse({ message: "This deal ends today — you should act fast!" }));
      expect(result.approved).toBe(false);
      expect(result.flags).toContain("URGENCY_SCARCITY_VIOLATION");
    });

    it('should block expanded finance guarantee phrases', () => {
      const context = agentEvalFixtures.financeQuestion.context;

      const blockedPhrases = [
        "everyone is approved at our dealership",
        "you will qualify for this rate",
        "instant approval available",
        "no credit check required here",
        "we can guarantee your financing",
      ];

      for (const phrase of blockedPhrases) {
        const result = runComplianceGate(context, mockResponse({ message: phrase }));
        expect(result.approved).toBe(false);
      }
    });

    it('should block AI responses when conversation is escalated', () => {
      const context: AgentContext = {
        ...agentEvalFixtures.financeQuestion.context,
        escalationState: { escalated: true },
      };
      const result = runComplianceGate(context, mockResponse());
      expect(result.approved).toBe(false);
      expect(result.flags).toContain("ESCALATED_BLOCKED");
    });

    it('should flag low confidence responses', () => {
      const context = agentEvalFixtures.financeQuestion.context;
      const result = runComplianceGate(context, mockResponse({ confidence: 0.2 }));
      expect(result.approved).toBe(true);
      expect(result.flags).toContain("LOW_CONFIDENCE_ESCALATION_RECOMMENDED");
    });

    it('should flag multiple questions', () => {
      const context = agentEvalFixtures.financeQuestion.context;
      const result = runComplianceGate(context, mockResponse({ message: "What is your budget? And what color do you prefer?" }));
      expect(result.approved).toBe(true);
      expect(result.flags).toContain("MULTIPLE_QUESTIONS_DETECTED");
    });
  });

  describe('Prompt Builder', () => {
    it('should include constitution rules', () => {
      const prompt = buildSystemPrompt(agentEvalFixtures.firstContact.context);
      expect(prompt).toContain('AUTOREPAI CONSTITUTION');
      expect(prompt).toContain('ONE ASK PER TURN');
      expect(prompt).toContain('YOU MUST DISCLOSE YOU ARE AN AI ASSISTANT');
    });

    it('should include tool descriptions', () => {
      const prompt = buildSystemPrompt(agentEvalFixtures.firstContact.context);
      expect(prompt).toContain('AVAILABLE TOOLS');
      expect(prompt).toContain('inventory_match');
      expect(prompt).toContain('send_sms');
      expect(prompt).toContain('escalate');
    });

    it('should include conversation summary for multi-turn context', () => {
      const context: AgentContext = {
        ...agentEvalFixtures.financeQuestion.context,
        recentMessages: [
          { role: 'assistant', content: 'I am an AI assistant. How can I help?' },
          { role: 'user', content: 'I am looking for an SUV under $40,000' },
          { role: 'assistant', content: 'Great choice! Let me search our inventory.' },
          { role: 'user', content: 'Can I get approved with bad credit?' },
        ],
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain('CONVERSATION HISTORY SUMMARY');
      expect(prompt).toContain('Recent exchange');
    });

    it('should include lead context when available', () => {
      const context: AgentContext = {
        ...agentEvalFixtures.firstContact.context,
        lead: { name: 'John Smith', stage: 'vehicle_interest', source: 'google_ads', priority: 'warm', vehicleInterests: ['SUV', 'Truck'] },
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain('LEAD PROFILE');
      expect(prompt).toContain('John Smith');
      expect(prompt).toContain('SUV, Truck');
    });
  });

  describe('Tool Registry', () => {
    it('should allow valid tools', () => {
      expect(validateToolCall({ name: 'inventory_match', args: {} })).toBe(true);
    });

    it('should reject invalid tools', () => {
      expect(validateToolCall({ name: 'hack_database', args: {} })).toBe(false);
    });
  });

  describe('Output Schema', () => {
    it('should validate complete response', () => {
      const validPayload = {
        message: "I am an AI assistant. How can I help?",
        intent: "general",
        posture: "GUIDE",
        stage: "new",
        confidence: 0.9,
        nextAction: null,
        toolCall: { name: "inventory_match", args: { type: "suv" } },
        escalate: false,
        complianceFlags: [],
        auditMeta: { promptVersion: "1.0", model: "test-model", channel: "web" }
      };

      const result = agentResponseSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('Environment Gating', () => {
    it('should parse modes correctly', () => {
      expect(getAgentMode({ AGENT_MODE: 'demo' })).toBe('demo');
      expect(getAgentMode({ AGENT_MODE: 'sandbox' })).toBe('sandbox');
      expect(getAgentMode({ AGENT_MODE: 'prod' })).toBe('prod');
      expect(getAgentMode({ AGENT_MODE: 'unknown' })).toBe('prod');
    });

    it('should properly identify modes', () => {
      expect(isDemoMode('demo')).toBe(true);
      expect(isProdMode('prod')).toBe(true);
      expect(isDemoMode('prod')).toBe(false);
    });
  });

  describe('Lead Scoring', () => {
    it('should score a hot lead in negotiation with high engagement', () => {
      const lead = {
        id: 'lead-1', name: 'Test', email: 'test@test.com', phone: '+15551234567',
        source: 'google_ads' as const, stage: 'negotiation' as const, priority: 'warm' as const,
        assignedTo: 'AI Agent', crmSyncStatus: 'synced' as const, isDuplicate: false,
        firstContactAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        lastActivityAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        followUpOverdue: false, tags: [], vehicleInterests: ['SUV'], conversationIds: ['conv-1'],
      };
      const conversations = [{
        id: 'conv-1', leadId: 'lead-1', channel: 'sms' as const, status: 'active' as const,
        sentiment: 'positive' as const, currentHandler: 'ai' as const, handlerName: 'AI',
        aiDisclosureSent: true, suppressionActive: false, optedOut: false,
        dealStage: 'negotiation' as const, objectionCount: 0, escalationFlag: false,
        startedAt: '', lastMessageAt: '', unreadCount: 0, customerName: 'Test', messages: [],
      }];
      const messages = [
        { id: 'm1', conversationId: 'conv-1', role: 'customer' as const, content: 'I want to buy this SUV', timestamp: '', channel: 'sms' as const, delivered: true, read: true, aiGenerated: false, requiresApproval: false },
        { id: 'm2', conversationId: 'conv-1', role: 'customer' as const, content: 'What is the monthly payment?', timestamp: '', channel: 'sms' as const, delivered: true, read: true, aiGenerated: false, requiresApproval: false },
        { id: 'm3', conversationId: 'conv-1', role: 'customer' as const, content: 'Can I schedule a test drive?', timestamp: '', channel: 'sms' as const, delivered: true, read: true, aiGenerated: false, requiresApproval: false },
      ];

      const score = scoreLead(lead, conversations, messages);
      expect(score.priority).toBe('hot');
      expect(score.total).toBeGreaterThanOrEqual(50);
      expect(score.signals).toContain('purchase-intent');
    });

    it('should score a cold lead with no activity', () => {
      const lead = {
        id: 'lead-2', name: 'Cold', email: '', phone: '+15559999999',
        source: 'website' as const, stage: 'stale' as const, priority: 'new' as const,
        assignedTo: 'AI Agent', crmSyncStatus: 'not_synced' as const, isDuplicate: false,
        firstContactAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastActivityAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        followUpOverdue: true, tags: [], vehicleInterests: [], conversationIds: [],
      };

      const score = scoreLead(lead, [], []);
      expect(score.priority).toBe('cold');
      expect(score.total).toBeLessThan(20);
    });
  });

  describe('Follow-Up Engine', () => {
    it('should create follow-up task for quote_present tool call', () => {
      const response = mockResponse({ toolCall: { name: 'quote_present', args: {} } });
      const context = {
        leadId: 'lead-1', conversationId: 'conv-1', customerName: 'Test Customer',
        channel: 'web' as const, currentStage: 'quote_sent' as const, priority: 'warm' as const,
      };

      const tasks = generateFollowUps(response, context);
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks.some(t => t.type === 'quote_follow_up')).toBe(true);
    });

    it('should create escalation follow-up when agent escalates', () => {
      const response = mockResponse({ escalate: true, intent: 'customer_request' });
      const context = {
        leadId: 'lead-1', conversationId: 'conv-1', customerName: 'Angry Customer',
        channel: 'phone' as const, currentStage: 'negotiation' as const, priority: 'hot' as const,
      };

      const tasks = generateFollowUps(response, context);
      expect(tasks.some(t => t.type === 'callback')).toBe(true);
    });
  });
});
