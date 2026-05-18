import { describe, expect, it, vi, afterEach } from 'vitest';
import { scoreLead } from '@/services/lead-scoring';
import { evaluateOutboundEligibility, getMaintenanceReminders } from '@/services/maintenanceService';
import { AI_DISCLOSURE, buildMarketingAutomationDecision } from '@/services/marketing-automation';
import type { Conversation, Lead, Message, Quote, Vehicle } from '@/types/domain';

const now = new Date('2026-05-08T12:00:00Z');
const lead: Lead = { id: 'lead-1', name: 'Sarah', phone: '555', source: 'website', stage: 'quote_sent', priority: 'warm', assignedTo: 'AI Agent', crmSyncStatus: 'synced', isDuplicate: false, firstContactAt: '2026-05-08T09:00:00Z', lastActivityAt: '2026-05-08T11:30:00Z', followUpOverdue: false, tags: [], vehicleInterests: ['SUV'], conversationIds: ['conv-1'] };
const conversation: Conversation = { id: 'conv-1', leadId: 'lead-1', channel: 'sms', status: 'active', sentiment: 'neutral', currentHandler: 'ai', handlerName: 'AI Agent', aiDisclosureSent: true, suppressionActive: false, optedOut: false, dealStage: 'quote_sent', objectionCount: 0, escalationFlag: false, startedAt: '2026-05-08T09:00:00Z', lastMessageAt: '2026-05-08T11:30:00Z', unreadCount: 0, customerName: 'Sarah', messages: [] };
const messages: Message[] = [{ id: 'm-1', conversationId: 'conv-1', role: 'customer', content: 'Please send a quote, I want to buy and schedule a test drive', timestamp: '2026-05-08T11:30:00Z', channel: 'sms', delivered: true, read: true, aiGenerated: false, requiresApproval: false }];

describe('lead intelligence, maintenance reminders, and compliance gating', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('computes lead scores and score rationale from conversation intent', () => {
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime());
    const score = scoreLead(lead, [conversation], messages);
    expect(score.total).toBeGreaterThan(35);
    expect(score.priority).toMatch(/new|warm|hot/);
    expect(score.signals).toEqual(expect.arrayContaining(['purchase-intent', 'appointment-intent', 'price-inquiry']));
  });

  it('flags due-soon and overdue maintenance reminders defensively', () => {
    const vehicles: Vehicle[] = [
      { id: 'veh-1', stock: 'A', year: 2024, make: 'A', model: 'One', trim: '', body: 'SUV', mileage: '8,200 km', price: 1, status: 'available', features: [], inventorySource: 'manual', nextServiceDueDate: '2026-05-20T00:00:00Z', nextServiceDueMileage: 8500 },
      { id: 'veh-2', stock: 'B', year: 2024, make: 'B', model: 'Two', trim: '', body: 'SUV', mileage: '12,500 km', price: 1, status: 'available', features: [], inventorySource: 'manual', nextServiceDueDate: '2026-05-01T00:00:00Z', nextServiceDueMileage: 12000 },
    ];
    const reminders = getMaintenanceReminders(vehicles, now);
    expect(reminders.map(reminder => reminder.status)).toEqual(['due_soon', 'overdue']);
  });

  it('blocks outbound automation for opt-outs or restricted conversations and keeps dry-run safety', () => {
    const quote: Quote = { id: 'quote-1', quoteNumber: 'Q-1', leadId: 'lead-1', vehicleIds: [], status: 'viewed', scenarios: [], revision: 1, disclosureIncluded: true, createdAt: '2026-05-08T10:00:00Z' };
    const allowed = buildMarketingAutomationDecision({ lead, conversation, quotes: [quote], now });
    expect(allowed.allowed).toBe(true);
    expect(allowed.dryRun).toBe(true);
    expect(allowed.message).toContain(AI_DISCLOSURE);
    expect(allowed.message).toContain('Reply STOP');

    const restrictedConversation = { ...conversation, status: 'restricted' as const, restricted: true };
    expect(buildMarketingAutomationDecision({ lead, conversation: restrictedConversation, quotes: [quote], now }).allowed).toBe(false);
    expect(evaluateOutboundEligibility({ conversation: restrictedConversation, reminder: { vehicleId: 'veh-1', stock: 'A', label: 'A One', status: 'overdue', reasons: ['overdue'] } }).allowed).toBe(false);
  });
});
