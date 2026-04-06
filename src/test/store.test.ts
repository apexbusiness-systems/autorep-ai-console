import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  initializeStore,
  getState,
  addMessage,
  setActiveConversation,
  updateConversationStatus,
  updateLeadStage,
  updateConversationSentiment,
  addAuditEvent,
  updateIntegration,
  markFollowUpComplete,
  initiateHandoff,
  setActiveLead,
} from "@/hooks/use-store";
import {
  demoLeads,
  demoConversations,
  demoMessages,
  demoVehicles,
  demoQuotes,
  demoFollowUpTasks,
  demoFinancePackets,
  demoAppointments,
  demoAuditEvents,
  demoEscalations,
} from "@/data/seed";
import type { Message, AuditEvent } from "@/types/domain";

describe("Store — Core State Management", () => {
  beforeEach(() => {
    initializeStore({
      leads: demoLeads,
      conversations: demoConversations,
      messages: demoMessages,
      vehicles: demoVehicles,
      quotes: demoQuotes,
      followUpTasks: demoFollowUpTasks,
      financePackets: demoFinancePackets,
      appointments: demoAppointments,
      auditEvents: demoAuditEvents,
      escalations: demoEscalations,
      activeConversationId: "conv-1",
    });
  });

  it("initializes with correct seed data counts", () => {
    const state = getState();
    expect(state.leads).toHaveLength(8);
    expect(state.conversations).toHaveLength(7);
    expect(state.vehicles.length).toBeGreaterThanOrEqual(8);
    expect(state.quotes.length).toBeGreaterThanOrEqual(2);
    expect(state.followUpTasks.length).toBeGreaterThanOrEqual(5);
    expect(state.financePackets.length).toBeGreaterThanOrEqual(2);
    expect(state.appointments.length).toBeGreaterThanOrEqual(3);
    expect(state.escalations).toHaveLength(2);
    expect(state.activeConversationId).toBe("conv-1");
  });

  it("adds a message to a conversation", () => {
    const msg: Message = {
      id: "test-msg-1",
      conversationId: "conv-1",
      role: "customer",
      content: "Test message",
      timestamp: new Date().toISOString(),
      channel: "web",
      delivered: true,
      read: false,
      aiGenerated: false,
      requiresApproval: false,
    };
    addMessage("conv-1", msg);
    const state = getState();
    const messages = state.messages["conv-1"];
    expect(messages[messages.length - 1].content).toBe("Test message");
  });

  it("increments unread count when customer sends message", () => {
    const initialUnread = getState().conversations.find(c => c.id === "conv-1")!.unreadCount;
    const msg: Message = {
      id: "test-msg-unread",
      conversationId: "conv-1",
      role: "customer",
      content: "Customer message",
      timestamp: new Date().toISOString(),
      channel: "web",
      delivered: true,
      read: false,
      aiGenerated: false,
      requiresApproval: false,
    };
    addMessage("conv-1", msg);
    const newUnread = getState().conversations.find(c => c.id === "conv-1")!.unreadCount;
    expect(newUnread).toBe(initialUnread + 1);
  });

  it("does not increment unread for agent messages", () => {
    const initialUnread = getState().conversations.find(c => c.id === "conv-1")!.unreadCount;
    const msg: Message = {
      id: "test-msg-agent",
      conversationId: "conv-1",
      role: "agent",
      content: "Agent reply",
      timestamp: new Date().toISOString(),
      channel: "web",
      delivered: true,
      read: false,
      aiGenerated: true,
      requiresApproval: false,
    };
    addMessage("conv-1", msg);
    expect(getState().conversations.find(c => c.id === "conv-1")!.unreadCount).toBe(initialUnread);
  });

  it("sets active conversation", () => {
    setActiveConversation("conv-3");
    expect(getState().activeConversationId).toBe("conv-3");
  });

  it("sets active conversation to null", () => {
    setActiveConversation(null);
    expect(getState().activeConversationId).toBeNull();
  });

  it("updates conversation status", () => {
    updateConversationStatus("conv-1", "escalated");
    expect(getState().conversations.find(c => c.id === "conv-1")!.status).toBe("escalated");
  });

  it("updates lead stage", () => {
    updateLeadStage("lead-1", "negotiation");
    const lead = getState().leads.find(l => l.id === "lead-1")!;
    expect(lead.stage).toBe("negotiation");
    expect(new Date(lead.lastActivityAt).getTime()).toBeGreaterThan(Date.now() - 5000);
  });

  it("updates conversation sentiment", () => {
    updateConversationSentiment("conv-1", "frustrated");
    expect(getState().conversations.find(c => c.id === "conv-1")!.sentiment).toBe("frustrated");
  });

  it("adds audit event at the top", () => {
    const event: AuditEvent = {
      id: "test-audit-1",
      action: "message_sent",
      entityType: "conversation",
      entityId: "conv-1",
      performedBy: "Test",
      performedAt: new Date().toISOString(),
      details: "Test audit event",
    };
    addAuditEvent(event);
    expect(getState().auditEvents[0].id).toBe("test-audit-1");
  });

  it("updates integration config", () => {
    initializeStore({
      integrations: [
        { id: "grok", name: "Grok", provider: "xai", category: "ai", status: "disconnected", credentials: {}, syncStatus: "not_synced" },
      ],
    });
    updateIntegration("grok", { status: "connected", credentials: { apiKey: "test-key" } });
    const integration = getState().integrations.find(i => i.id === "grok")!;
    expect(integration.status).toBe("connected");
    expect(integration.credentials.apiKey).toBe("test-key");
  });

  it("marks follow-up task as complete", () => {
    const taskId = getState().followUpTasks[0].id;
    markFollowUpComplete(taskId);
    const task = getState().followUpTasks.find(t => t.id === taskId)!;
    expect(task.status).toBe("completed");
    expect(task.completedAt).toBeDefined();
  });

  it("initiates handoff correctly", () => {
    initiateHandoff("conv-1", "Mike R.");
    const conv = getState().conversations.find(c => c.id === "conv-1")!;
    expect(conv.currentHandler).toBe("human");
    expect(conv.handlerName).toBe("Mike R.");
    expect(conv.status).toBe("active");
    expect(conv.escalationFlag).toBe(false);
    // Check audit event was created
    expect(getState().auditEvents[0].action).toBe("handoff_completed");
  });

  it("sets active lead", () => {
    setActiveLead("lead-3");
    expect(getState().activeLeadId).toBe("lead-3");
  });
});
