import { describe, it, expect } from 'vitest';
import { runComplianceGate } from '../agents/autorepai/compliance';
import { buildSystemPrompt } from '../agents/autorepai/prompt-builder';
import { agentResponseSchema, AgentResponseSchemaType } from '../agents/autorepai/output-schema';
import { validateToolCall } from '../agents/autorepai/tool-registry';
import { agentEvalFixtures } from './fixtures/agent-evals';
import { getAgentMode, isDemoMode, isProdMode } from '../agents/autorepai/env';

describe('AUTOREPAI Runtime', () => {
  describe('Compliance Gate', () => {
    it('should block opted-out users', () => {
      const { context, expectedComplianceApproved } = agentEvalFixtures.optOutBlocked;

      const mockResponse: AgentResponseSchemaType = {
        message: "Sure, let's look at cars.",
        intent: "general",
        posture: "GUIDE",
        stage: "new",
        confidence: 0.9,
        nextAction: null,
        toolCall: null,
        escalate: false,
        complianceFlags: [],
        auditMeta: { promptVersion: '1', model: 'test', channel: 'sms' }
      };

      const result = runComplianceGate(context, mockResponse);
      expect(result.approved).toBe(expectedComplianceApproved);
      expect(result.flags).toContain("OPTED_OUT");
    });

    it('should flag missing AI disclosure on first contact', () => {
      const { context } = agentEvalFixtures.firstContact;

      const mockResponse: AgentResponseSchemaType = {
        message: "Hello! How can I help?", // No disclosure
        intent: "general",
        posture: "GUIDE",
        stage: "new",
        confidence: 0.9,
        nextAction: null,
        toolCall: null,
        escalate: false,
        complianceFlags: [],
        auditMeta: { promptVersion: '1', model: 'test', channel: 'web' }
      };

      const result = runComplianceGate(context, mockResponse);
      expect(result.approved).toBe(false); // We set it to block
      expect(result.flags).toContain("MISSING_DISCLOSURE");
    });

    it('should block finance guarantees', () => {
      const context = agentEvalFixtures.financeQuestion.context;

      const mockResponse: AgentResponseSchemaType = {
        message: "You are guaranteed approval!",
        intent: "finance",
        posture: "LEAN_IN",
        stage: "finance",
        confidence: 0.9,
        nextAction: null,
        toolCall: null,
        escalate: false,
        complianceFlags: [],
        auditMeta: { promptVersion: '1', model: 'test', channel: 'web' }
      };

      const result = runComplianceGate(context, mockResponse);
      expect(result.approved).toBe(false);
      expect(result.flags).toContain("FINANCE_GUARANTEE_VIOLATION");
    });
  });

  describe('Prompt Builder', () => {
    it('should include constitution rules', () => {
      const prompt = buildSystemPrompt(agentEvalFixtures.firstContact.context);
      expect(prompt).toContain('AUTOREPAI CONSTITUTION');
      expect(prompt).toContain('ONE ASK PER TURN');
      expect(prompt).toContain('YOU MUST DISCLOSE YOU ARE AN AI ASSISTANT');
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
      expect(getAgentMode({ AGENT_MODE: 'unknown' })).toBe('prod'); // Default fail-safe
    });

    it('should properly identify modes', () => {
      expect(isDemoMode('demo')).toBe(true);
      expect(isProdMode('prod')).toBe(true);
      expect(isDemoMode('prod')).toBe(false);
    });
  });
});
