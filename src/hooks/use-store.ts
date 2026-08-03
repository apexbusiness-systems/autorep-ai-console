/**
 * Central reactive store for demo data.
 * In production, this would be backed by Supabase real-time subscriptions.
 * For the investor demo, it provides reactive state over seed data.
 */

import { useState, useCallback, useMemo, useSyncExternalStore } from 'react';
import type {
  Lead, Conversation, Message, Vehicle, Quote, FollowUpTask,
  FinancePacket, Appointment, AuditEvent, Escalation, IntegrationConfig,
  ConversationStatus, LeadStage, Sentiment,
} from '@/types/domain';
import { scoreLead } from '@/services/lead-scoring';

type StoreState = {
  leads: Lead[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  vehicles: Vehicle[];
  quotes: Quote[];
  followUpTasks: FollowUpTask[];
  financePackets: FinancePacket[];
  appointments: Appointment[];
  auditEvents: AuditEvent[];
  escalations: Escalation[];
  integrations: IntegrationConfig[];
  activeConversationId: string | null;
  activeLeadId: string | null;
};

let state: StoreState = {
  leads: [],
  conversations: [],
  messages: {},
  vehicles: [],
  quotes: [],
  followUpTasks: [],
  financePackets: [],
  appointments: [],
  auditEvents: [],
  escalations: [],
  integrations: [],
  activeConversationId: null,
  activeLeadId: null,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach(l => l());
}

function setState(partial: Partial<StoreState>) {
  state = { ...state, ...partial };
  emitChange();
}

export function getState(): StoreState {
  return state;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ─── Actions ────────────────────────────────────────────────────────────────

export function initializeStore(data: Partial<StoreState>) {
  setState(data);
}

export function setActiveConversation(id: string | null) {
  setState({ activeConversationId: id });
}

export function setActiveLead(id: string | null) {
  setState({ activeLeadId: id });
}

export function addMessage(conversationId: string, message: Message) {
  const current = state.messages[conversationId] || [];
  setState({
    messages: { ...state.messages, [conversationId]: [...current, message] },
    conversations: state.conversations.map(c =>
      c.id === conversationId
        ? { ...c, lastMessageAt: message.timestamp, unreadCount: c.unreadCount + (message.role === 'customer' ? 1 : 0) }
        : c
    ),
  });
}

export function updateConversationStatus(id: string, status: ConversationStatus) {
  setState({
    conversations: state.conversations.map(c =>
      c.id === id ? { ...c, status } : c
    ),
  });
}

export function updateLeadStage(id: string, stage: LeadStage) {
  setState({
    leads: state.leads.map(l =>
      l.id === id ? { ...l, stage, lastActivityAt: new Date().toISOString() } : l
    ),
  });
}

export function updateConversationSentiment(id: string, sentiment: Sentiment) {
  setState({
    conversations: state.conversations.map(c =>
      c.id === id ? { ...c, sentiment } : c
    ),
  });
}

export function addAuditEvent(event: AuditEvent) {
  setState({ auditEvents: [event, ...state.auditEvents] });
}

export function updateIntegration(id: string, partial: Partial<IntegrationConfig>) {
  setState({
    integrations: state.integrations.map(i =>
      i.id === id ? { ...i, ...partial } : i
    ),
  });
}

export function markFollowUpComplete(id: string) {
  setState({
    followUpTasks: state.followUpTasks.map(t =>
      t.id === id ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() } : t
    ),
  });
}

export function initiateHandoff(conversationId: string, assignTo: string) {
  setState({
    conversations: state.conversations.map(c =>
      c.id === conversationId
        ? { ...c, currentHandler: 'human' as const, handlerName: assignTo, status: 'active' as const, escalationFlag: false }
        : c
    ),
  });
  addAuditEvent({
    id: `audit-${Date.now()}`,
    action: 'handoff_completed',
    entityType: 'conversation',
    entityId: conversationId,
    performedBy: 'Manager',
    performedAt: new Date().toISOString(),
    details: `Conversation handed off to ${assignTo}`,
  });
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useStore<T>(selector: (s: StoreState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export function summarizeConversation(conversation: Conversation, messages: Message[]): string {
  if (conversation.summary) return conversation.summary;

  // ⚡ Bolt Performance Optimization: Single-pass backward loop for top-K selection
  // Replaced `.filter(...).slice(-2)` with a backward loop to prevent O(N) allocation
  const customerMessages: Message[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'customer') {
      customerMessages.unshift(messages[i]);
      if (customerMessages.length === 2) break;
    }
  }

  if (customerMessages.length === 0) return 'No customer message summary available yet.';
  return customerMessages.map(message => message.content).join(' ').slice(0, 180);
}

export function useLeads() {
  const baseLeads = useStore(s => s.leads);
  const baseConversations = useStore(s => s.conversations);
  const messagesDict = useStore(s => s.messages);

  // Performance Fix: Deriving state inside useMemo rather than inside useStore
  // selector directly. This prevents referential inequality (from .map) causing
  // excessive component re-renders on unrelated store updates.
  // Impact: Reduces React rendering workload when any unrelated state changes.
  return useMemo(() => {
    // ⚡ Bolt Performance Optimization: Grouping for O(1) lookups
    // Pre-group conversations by leadId using a Map to avoid O(N*M) traversal
    const conversationsByLead = new Map<string, typeof baseConversations>();
    for (const conv of baseConversations) {
      if (!conversationsByLead.has(conv.leadId)) {
        conversationsByLead.set(conv.leadId, []);
      }
      conversationsByLead.get(conv.leadId)!.push(conv);
    }

    return baseLeads.map(lead => {
      const leadConversations = conversationsByLead.get(lead.id) || [];

      // Instead of flattening all messages dictionary to a massive array for every lead,
      // only extract the messages for this lead's conversations.
      const leadMessages: typeof messagesDict[string] = [];
      for (let i = 0; i < leadConversations.length; i++) {
        const msgs = messagesDict[leadConversations[i].id];
        if (msgs) leadMessages.push(...msgs);
      }

      const score = scoreLead(lead, leadConversations, leadMessages);
      return {
        ...lead,
        leadScore: score.total,
        priority: score.priority,
        scoreRationale: score.signals.length ? score.signals : ['limited engagement data'],
      };
    });
  }, [baseLeads, baseConversations, messagesDict]);
}

export function useConversations() {
  const baseConversations = useStore(s => s.conversations);
  const messagesDict = useStore(s => s.messages);

  // Performance Fix: Memoize the mapped conversations list based on the base store data
  // to avoid creating new object references in the useStore selector,
  // preventing constant re-renders when other state changes.
  // Impact: Reduces React rendering workload when any unrelated state changes.
  return useMemo(() => {
    return baseConversations.map(conversation => {
      const messages = messagesDict[conversation.id] || EMPTY_ARRAY;
      const restricted = conversation.restricted || conversation.status === 'restricted' || conversation.optedOut || conversation.suppressionActive;
      return {
        ...conversation,
        restricted,
        restrictionReason: restricted
          ? conversation.optedOut
            ? 'Customer opted out.'
            : conversation.suppressionActive
            ? 'Suppression is active.'
            : conversation.restrictionReason || 'Conversation is restricted.'
          : undefined,
        summary: summarizeConversation(conversation, messages),
        messages,
      };
    });
  }, [baseConversations, messagesDict]);
}


export function useActiveConversation() {
  return useStore(s => {
    if (!s.activeConversationId) return null;
    return s.conversations.find(c => c.id === s.activeConversationId) || null;
  });
}

const EMPTY_ARRAY: Message[] = [];

export function useMessages(conversationId: string | null) {
  return useStore(s => (conversationId ? s.messages[conversationId] || EMPTY_ARRAY : EMPTY_ARRAY));
}

export function useVehicles() {
  return useStore(s => s.vehicles);
}

export function useQuotes() {
  return useStore(s => s.quotes);
}

export function useFollowUpTasks() {
  return useStore(s => s.followUpTasks);
}

export function useFinancePackets() {
  return useStore(s => s.financePackets);
}

export function useAppointments() {
  return useStore(s => s.appointments);
}

export function useAuditEvents() {
  return useStore(s => s.auditEvents);
}

export function useEscalations() {
  return useStore(s => s.escalations);
}

export function useIntegrations() {
  return useStore(s => s.integrations);
}

export function useActiveLead() {
  return useStore(s => {
    if (!s.activeLeadId) return null;
    return s.leads.find(l => l.id === s.activeLeadId) || null;
  });
}
