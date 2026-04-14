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

export function useLeads() {
  return useStore(s => s.leads);
}

export function useConversations() {
  return useStore(s => s.conversations);
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
