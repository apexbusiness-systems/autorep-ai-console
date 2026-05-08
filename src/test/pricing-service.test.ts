import { describe, expect, it } from 'vitest';
import { calculateQuoteTotals, forecastDemand, suggestDynamicPrice } from '@/services/pricingService';
import type { Conversation, Lead, Message, Quote, Vehicle } from '@/types/domain';

const now = new Date('2026-05-08T12:00:00Z');
const vehicle: Vehicle = { id: 'veh-x', stock: 'X-1', year: 2024, make: 'Toyota', model: 'RAV4', trim: 'XLE', body: 'SUV', mileage: 'New', price: 40000, status: 'available', features: [], inventorySource: 'manual', daysOnLot: 10 };
const lead: Lead = { id: 'lead-x', name: 'Buyer', phone: '555', source: 'website', stage: 'quote_sent', priority: 'hot', assignedTo: 'AI Agent', crmSyncStatus: 'synced', isDuplicate: false, firstContactAt: '2026-05-08T10:00:00Z', lastActivityAt: '2026-05-08T11:00:00Z', followUpOverdue: false, tags: [], vehicleInterests: ['RAV4'], conversationIds: ['conv-x'] };
const conversation: Conversation = { id: 'conv-x', leadId: 'lead-x', channel: 'web', status: 'active', sentiment: 'positive', currentHandler: 'ai', handlerName: 'AI Agent', aiDisclosureSent: true, suppressionActive: false, optedOut: false, dealStage: 'quote_sent', objectionCount: 0, escalationFlag: false, startedAt: '2026-05-08T10:00:00Z', lastMessageAt: '2026-05-08T11:00:00Z', unreadCount: 0, customerName: 'Buyer', messages: [] };
const message: Message = { id: 'm-x', conversationId: 'conv-x', role: 'customer', content: 'I want a quote on this RAV4 and can buy today', timestamp: '2026-05-08T11:00:00Z', channel: 'web', delivered: true, read: true, aiGenerated: false, requiresApproval: false };
const quote: Quote = { id: 'quote-x', quoteNumber: 'Q-X', leadId: 'lead-x', vehicleIds: ['veh-x'], status: 'viewed', scenarios: [], revision: 1, disclosureIncluded: true, createdAt: '2026-05-08T11:30:00Z' };

describe('pricingService', () => {
  it('forecasts demand deterministically from lead, quote, inventory, and activity signals', () => {
    const forecast = forecastDemand({ vehicle, vehicles: [vehicle], leads: [lead], conversations: [conversation], messages: [message], quotes: [quote], now });
    expect(forecast.score).toBeGreaterThanOrEqual(60);
    expect(forecast.band).toBe('moderate');
    expect(forecast.trend).toHaveLength(4);
    expect(forecast.signals).toContain('1 active quote');
  });

  it('suggests a bounded dynamic price with rationale and contributing signals', () => {
    const suggestion = suggestDynamicPrice({ vehicle, vehicles: [vehicle], leads: [lead], conversations: [conversation], messages: [message], quotes: [quote], basePrice: 40000, minPrice: 38000, maxPrice: 41000, now });
    expect(suggestion.suggestedPrice).toBeGreaterThanOrEqual(38000);
    expect(suggestion.suggestedPrice).toBeLessThanOrEqual(41000);
    expect(suggestion.rationale).toMatch(/Recommend/);
    expect(suggestion.contributingSignals.length).toBeGreaterThan(1);
  });

  it('calculates taxes, packages, payments, and sparse-data fallbacks', () => {
    const totals = calculateQuoteTotals({ sellingPrice: 30000, downPayment: 2000, tradeInValue: 3000, taxRate: 0.13, fees: 499, termMonths: 60, interestRate: 0, packages: [{ id: 'pkg', label: 'Warranty', price: 1000, taxable: true }, { id: 'svc', label: 'Service', price: 500, taxable: false }] });
    expect(totals.principal).toBe(25000);
    expect(totals.packageTotal).toBe(1500);
    expect(totals.taxes).toBe(3380);
    expect(totals.totalCost).toBe(30379);
    expect(totals.monthlyPayment).toBeCloseTo(506.32, 2);
  });
});
