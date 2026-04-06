import { describe, it, expect } from "vitest";
import { integrationManager, INTEGRATION_DEFINITIONS } from "@/services/integration-manager";

describe("Integration Manager", () => {
  it("has 18 integration definitions", () => {
    expect(INTEGRATION_DEFINITIONS.length).toBe(18);
  });

  it("covers all required categories", () => {
    const categories = new Set(INTEGRATION_DEFINITIONS.map(d => d.category));
    expect(categories.has("ai")).toBe(true);
    expect(categories.has("channel")).toBe(true);
    expect(categories.has("crm")).toBe(true);
    expect(categories.has("dms")).toBe(true);
    expect(categories.has("inventory")).toBe(true);
    expect(categories.has("email")).toBe(true);
    expect(categories.has("calendar")).toBe(true);
    expect(categories.has("webhook")).toBe(true);
  });

  it("all definitions have required fields", () => {
    for (const def of INTEGRATION_DEFINITIONS) {
      expect(def.id).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.provider).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.icon).toBeTruthy();
      expect(Array.isArray(def.fields)).toBe(true);
    }
  });

  it("returns disconnected status for unconfigured integrations", () => {
    expect(integrationManager.getStatus("grok")).toBe("disconnected");
    expect(integrationManager.getStatus("telephony")).toBe("disconnected");
    expect(integrationManager.getStatus("nonexistent")).toBe("disconnected");
  });

  it("tests connection fails without credentials", async () => {
    const result = await integrationManager.testConnection("grok");
    expect(result.connected).toBe(false);
    expect(result.error).toContain("No credentials");
  });

  it("loads default configs on failure", async () => {
    const configs = await integrationManager.loadConfigs();
    expect(configs.length).toBe(INTEGRATION_DEFINITIONS.length);
    expect(configs.every(c => c.status === "disconnected")).toBe(true);
  });

  it("saves config and updates local state", async () => {
    const result = await integrationManager.saveConfig("grok", {
      apiKey: "test-key-123",
      modelId: "grok-3",
    });
    expect(result.success).toBe(true);
    expect(integrationManager.getStatus("grok")).toBe("pending");
  });

  it("tests connection succeeds with credentials", async () => {
    await integrationManager.saveConfig("webchat", {
      websiteUrl: "https://doorstepauto.com",
      widgetColor: "#C5A55A",
      position: "bottom-right",
    });
    const result = await integrationManager.testConnection("webchat");
    expect(result.connected).toBe(true);
    expect(result.latencyMs).toBeGreaterThan(0);
  });

  it("rejects unknown integration IDs", async () => {
    const result = await integrationManager.saveConfig("nonexistent", { key: "val" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unknown");
  });

  it("has key integrations for Door Step Auto", () => {
    const ids = INTEGRATION_DEFINITIONS.map(d => d.id);
    expect(ids).toContain("grok");
    expect(ids).toContain("telephony");
    expect(ids).toContain("sms");
    expect(ids).toContain("facebook");
    expect(ids).toContain("instagram");
    expect(ids).toContain("webchat");
    expect(ids).toContain("pbs");
    expect(ids).toContain("dealertrack");
    expect(ids).toContain("email");
    expect(ids).toContain("marketcheck");
  });
});
