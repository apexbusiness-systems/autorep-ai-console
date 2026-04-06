import { describe, it, expect } from "vitest";
import { telephonyService } from "@/services/telephony";

describe("Telephony Service", () => {
  it("reports not configured when no credentials set", () => {
    expect(telephonyService.isConfigured()).toBe(false);
  });

  it("returns default provider name", () => {
    expect(telephonyService.getProviderName()).toBe("twilio");
  });

  it("returns demo call session when not configured", async () => {
    const session = await telephonyService.makeCall("+14165551234");
    expect(session).not.toBeNull();
    expect(session!.id).toContain("demo-call");
    expect(session!.direction).toBe("outbound");
    expect(session!.status).toBe("ringing");
  });

  it("returns demo SMS result when not configured", async () => {
    const result = await telephonyService.sendSMS("+14165551234", "Test message");
    expect(result.success).toBe(true);
    expect(result.messageSid).toContain("demo-sms");
  });

  it("handles endCall gracefully when not configured", async () => {
    await expect(telephonyService.endCall("test-sid")).resolves.toBeUndefined();
  });

  it("fires incoming call listeners", () => {
    let receivedEvent: unknown = null;
    const unsub = telephonyService.onIncomingCall((event) => {
      receivedEvent = event;
    });

    telephonyService.simulateIncomingCall({
      callSid: "test-call-123",
      from: "+14165551234",
      to: "+14165559999",
      direction: "inbound",
      callerName: "Test Caller",
    });

    expect(receivedEvent).not.toBeNull();
    expect((receivedEvent as { callSid: string }).callSid).toBe("test-call-123");

    unsub();
  });

  it("fires incoming SMS listeners", () => {
    let receivedEvent: unknown = null;
    const unsub = telephonyService.onIncomingSMS((event) => {
      receivedEvent = event;
    });

    telephonyService.simulateIncomingSMS({
      messageSid: "test-sms-456",
      from: "+14165551234",
      to: "+14165559999",
      body: "Test SMS body",
      direction: "inbound",
    });

    expect(receivedEvent).not.toBeNull();
    expect((receivedEvent as { body: string }).body).toBe("Test SMS body");

    unsub();
  });

  it("unsubscribes listeners correctly", () => {
    let callCount = 0;
    const unsub = telephonyService.onIncomingCall(() => {
      callCount++;
    });

    telephonyService.simulateIncomingCall({
      callSid: "call-1",
      from: "+1111",
      to: "+2222",
      direction: "inbound",
    });
    expect(callCount).toBe(1);

    unsub();

    telephonyService.simulateIncomingCall({
      callSid: "call-2",
      from: "+1111",
      to: "+2222",
      direction: "inbound",
    });
    expect(callCount).toBe(1); // Should not increment
  });

  it("returns supported channels", () => {
    const channels = telephonyService.getSupportedChannels();
    expect(channels).toContain("phone");
    expect(channels).toContain("sms");
    expect(channels).toHaveLength(2);
  });

  it("configures and reports configured state", () => {
    telephonyService.configure({
      provider: "twilio",
      accountSid: "test-sid",
      authToken: "test-token",
      phoneNumber: "+14165550000",
    });
    expect(telephonyService.isConfigured()).toBe(true);

    // Reset for other tests
    telephonyService.configure({
      provider: "twilio",
      accountSid: "",
      authToken: "",
      phoneNumber: "",
    });
  });
});
