import { describe, it, expect } from "vitest";
import { aiProvider } from "@/services/ai-provider";

describe("AI Provider Service", () => {
  it("reports not configured when no API key set", () => {
    expect(aiProvider.isConfigured()).toBe(false);
  });

  it("returns demo response when not configured", async () => {
    const result = await aiProvider.complete({
      systemPrompt: "Test prompt",
      messages: [{ role: "user", content: "What's the price of the RAV4?" }],
    });
    expect(result.content).toBeTruthy();
    expect(result.content.length).toBeGreaterThan(10);
    expect(result.finishReason).toBe("demo");
    expect(result.tokensUsed).toBe(0);
  });

  it("handles price-related queries in demo mode", async () => {
    const result = await aiProvider.complete({
      systemPrompt: "",
      messages: [{ role: "user", content: "How much does this cost?" }],
    });
    expect(result.content.toLowerCase()).toContain("pricing");
  });

  it("handles trade-in queries in demo mode", async () => {
    const result = await aiProvider.complete({
      systemPrompt: "",
      messages: [{ role: "user", content: "I want to trade in my car" }],
    });
    expect(result.content.toLowerCase()).toContain("trade");
  });

  it("handles test drive queries in demo mode", async () => {
    const result = await aiProvider.complete({
      systemPrompt: "",
      messages: [{ role: "user", content: "Can I see it and do a test drive?" }],
    });
    expect(result.content.toLowerCase()).toContain("test drive");
  });

  it("handles finance queries in demo mode", async () => {
    const result = await aiProvider.complete({
      systemPrompt: "",
      messages: [{ role: "user", content: "What about financing options?" }],
    });
    expect(result.content.toLowerCase()).toContain("lender");
  });

  it("generates next best action for first contact", async () => {
    const action = await aiProvider.generateNextBestAction({
      dealStage: "first_contact",
      sentiment: "neutral",
      lastMessages: [],
      vehicleInterests: [],
      quotesSent: 0,
    });
    expect(action.type).toBe("collect_info");
    expect(action.priority).toBe("high");
  });

  it("generates next best action for vehicle interest with no quotes", async () => {
    const action = await aiProvider.generateNextBestAction({
      dealStage: "vehicle_interest",
      sentiment: "positive",
      lastMessages: [],
      vehicleInterests: ["RAV4", "CR-V"],
      quotesSent: 0,
    });
    expect(action.type).toBe("send_quote");
    expect(action.description).toContain("RAV4");
  });

  it("generates next best action for quote sent stage", async () => {
    const action = await aiProvider.generateNextBestAction({
      dealStage: "quote_sent",
      sentiment: "positive",
      lastMessages: [],
      vehicleInterests: ["RAV4"],
      quotesSent: 1,
    });
    expect(action.type).toBe("book_appointment");
  });

  it("recommends escalation for frustrated sentiment", async () => {
    const action = await aiProvider.generateNextBestAction({
      dealStage: "negotiation",
      sentiment: "frustrated",
      lastMessages: [],
      vehicleInterests: [],
      quotesSent: 1,
    });
    expect(action.type).toBe("escalate");
    expect(action.priority).toBe("high");
  });

  it("generates follow-up for appointment set stage", async () => {
    const action = await aiProvider.generateNextBestAction({
      dealStage: "appointment_set",
      sentiment: "positive",
      lastMessages: [],
      vehicleInterests: [],
      quotesSent: 1,
    });
    expect(action.type).toBe("collect_info");
  });

  it("summarizes transcript in demo mode", async () => {
    const summary = await aiProvider.summarizeTranscript([
      { role: "customer", content: "I'm looking for an SUV under $40,000" },
      { role: "agent", content: "I have several options in that budget range" },
      { role: "customer", content: "What about trade-in for my current car?" },
    ]);
    expect(summary).toContain("SUV");
    expect(summary).toContain("trade-in");
    expect(summary).toContain("3 messages");
  });

  it("reports correct provider name", () => {
    expect(aiProvider.getProviderName()).toBe("grok");
  });
});
