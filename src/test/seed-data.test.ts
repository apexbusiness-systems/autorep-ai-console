import { describe, it, expect } from "vitest";
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

describe("Seed Data — Integrity & Completeness", () => {
  describe("Leads", () => {
    it("has 8 leads", () => {
      expect(demoLeads).toHaveLength(8);
    });

    it("has all priority types", () => {
      const priorities = new Set(demoLeads.map(l => l.priority));
      expect(priorities.has("hot")).toBe(true);
      expect(priorities.has("warm")).toBe(true);
      expect(priorities.has("cold")).toBe(true);
      expect(priorities.has("new")).toBe(true);
    });

    it("has diverse sources", () => {
      const sources = new Set(demoLeads.map(l => l.source));
      expect(sources.size).toBeGreaterThanOrEqual(5);
    });

    it("has diverse stages across the pipeline", () => {
      const stages = new Set(demoLeads.map(l => l.stage));
      expect(stages.size).toBeGreaterThanOrEqual(5);
    });

    it("all leads have required fields", () => {
      for (const lead of demoLeads) {
        expect(lead.id).toBeTruthy();
        expect(lead.name).toBeTruthy();
        expect(lead.phone).toBeTruthy();
        expect(lead.source).toBeTruthy();
        expect(lead.stage).toBeTruthy();
        expect(lead.priority).toBeTruthy();
      }
    });

    it("hot leads have vehicle interests", () => {
      const hotLeads = demoLeads.filter(l => l.priority === "hot");
      expect(hotLeads.every(l => l.vehicleInterests.length > 0)).toBe(true);
    });
  });

  describe("Conversations", () => {
    it("has 7 conversations", () => {
      expect(demoConversations).toHaveLength(7);
    });

    it("covers all channels", () => {
      const channels = new Set(demoConversations.map(c => c.channel));
      expect(channels.has("phone")).toBe(true);
      expect(channels.has("sms")).toBe(true);
      expect(channels.has("web")).toBe(true);
      expect(channels.has("instagram")).toBe(true);
      expect(channels.has("facebook")).toBe(true);
    });

    it("has conversations linked to leads", () => {
      expect(demoConversations.every(c => c.leadId)).toBe(true);
    });

    it("has escalated conversations", () => {
      expect(demoConversations.some(c => c.escalationFlag)).toBe(true);
    });
  });

  describe("Messages", () => {
    it("has messages for all conversations", () => {
      const convIds = demoConversations.map(c => c.id);
      for (const id of convIds) {
        expect(demoMessages[id]).toBeDefined();
        expect(demoMessages[id].length).toBeGreaterThan(0);
      }
    });

    it("all messages have required fields", () => {
      for (const [, msgs] of Object.entries(demoMessages)) {
        for (const msg of msgs) {
          expect(msg.id).toBeTruthy();
          expect(msg.conversationId).toBeTruthy();
          expect(msg.role).toBeTruthy();
          expect(msg.content).toBeTruthy();
          expect(msg.timestamp).toBeTruthy();
        }
      }
    });

    it("has AI-generated messages", () => {
      const allMsgs = Object.values(demoMessages).flat();
      expect(allMsgs.some(m => m.aiGenerated)).toBe(true);
    });

    it("has a message requiring approval", () => {
      const allMsgs = Object.values(demoMessages).flat();
      expect(allMsgs.some(m => m.requiresApproval)).toBe(true);
    });
  });

  describe("Vehicles", () => {
    it("has 12+ vehicles", () => {
      expect(demoVehicles.length).toBeGreaterThanOrEqual(12);
    });

    it("has diverse makes", () => {
      const makes = new Set(demoVehicles.map(v => v.make));
      expect(makes.size).toBeGreaterThanOrEqual(6);
    });

    it("has diverse body types", () => {
      const bodies = new Set(demoVehicles.map(v => v.body));
      expect(bodies.size).toBeGreaterThanOrEqual(3);
    });

    it("all vehicles have stock numbers", () => {
      expect(demoVehicles.every(v => v.stock)).toBe(true);
    });

    it("has new and used vehicles", () => {
      expect(demoVehicles.some(v => v.mileage === "New")).toBe(true);
      expect(demoVehicles.some(v => v.mileage !== "New")).toBe(true);
    });

    it("has estimated payments", () => {
      expect(demoVehicles.every(v => v.estimatedPayment && v.estimatedPayment > 0)).toBe(true);
    });
  });

  describe("Quotes", () => {
    it("has quotes linked to leads", () => {
      expect(demoQuotes.every(q => q.leadId)).toBe(true);
    });

    it("has quote scenarios with payment data", () => {
      for (const quote of demoQuotes) {
        expect(quote.scenarios.length).toBeGreaterThan(0);
        for (const scenario of quote.scenarios) {
          expect(scenario.monthlyPayment).toBeGreaterThan(0);
          expect(scenario.sellingPrice).toBeGreaterThan(0);
          expect(scenario.termMonths).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("Finance Packets", () => {
    it("has packets with completion percentage", () => {
      expect(demoFinancePackets.every(p => typeof p.completionPercentage === "number")).toBe(true);
    });

    it("has diverse statuses", () => {
      const statuses = new Set(demoFinancePackets.map(p => p.status));
      expect(statuses.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Appointments", () => {
    it("has appointments with types", () => {
      expect(demoAppointments.every(a => a.type)).toBe(true);
    });

    it("has appointments with diverse statuses", () => {
      const statuses = new Set(demoAppointments.map(a => a.status));
      expect(statuses.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Cross-Reference Integrity", () => {
    it("all conversation leadIds reference valid leads", () => {
      const leadIds = new Set(demoLeads.map(l => l.id));
      for (const conv of demoConversations) {
        expect(leadIds.has(conv.leadId)).toBe(true);
      }
    });

    it("all quote leadIds reference valid leads", () => {
      const leadIds = new Set(demoLeads.map(l => l.id));
      for (const quote of demoQuotes) {
        expect(leadIds.has(quote.leadId)).toBe(true);
      }
    });

    it("all escalation conversationIds reference valid conversations", () => {
      const convIds = new Set(demoConversations.map(c => c.id));
      for (const escalation of demoEscalations) {
        expect(convIds.has(escalation.conversationId)).toBe(true);
      }
    });
  });
});
