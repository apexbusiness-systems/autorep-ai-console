import { describe, it, expect, beforeEach, vi } from 'vitest';
import aiProvider from '../services/ai-provider';

// Mock the environment to strictly return demo
vi.mock('../agents/autorepai/env', () => ({
  getAgentMode: vi.fn(() => 'demo'),
  isDemoMode: vi.fn(() => true),
  isProdMode: vi.fn(() => false)
}));

describe('AI Provider Service', () => {
  beforeEach(() => {
    aiProvider.configure({
      provider: 'grok',
      apiKey: '',
      modelId: 'test-model',
    });
  });

  it('reports not configured when no API key set', () => {
    expect(aiProvider.isConfigured()).toBe(false);
  });

  it('returns demo response when not configured in demo mode', async () => {
    const response = await aiProvider.complete({
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(response.intent).toBe('general_inquiry');
  });

  it('handles price-related queries in demo mode', async () => {
    const response = await aiProvider.complete({
      messages: [{ role: 'user', content: 'What is the price?' }],
    });
    expect(response.message.toLowerCase()).toContain('pricing');
    expect(response.intent).toBe('finance_inquiry');
  });

  it('generates next best action correctly', async () => {
    const action = await aiProvider.generateNextBestAction();
    expect(action.type).toBe('collect_info');
  });

  it('summarizes transcript in demo mode', async () => {
    const summary = await aiProvider.summarizeTranscript();
    expect(summary).toBe('Conversation summary.');
  });
});
