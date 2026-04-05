/**
 * Telephony Provider Adapter
 * Supports Twilio / Telnyx for inbound/outbound voice + SMS.
 * Drop in credentials via IntegrationConfig to activate.
 */

import type { CallSession, Channel } from '@/types/domain';

export interface TelephonyConfig {
  provider: 'twilio' | 'telnyx';
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  webhookUrl?: string;
}

export interface IncomingCallEvent {
  callSid: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  callerName?: string;
}

export interface SMSEvent {
  messageSid: string;
  from: string;
  to: string;
  body: string;
  direction: 'inbound' | 'outbound';
}

class TelephonyService {
  private config: TelephonyConfig | null = null;
  private callListeners: ((event: IncomingCallEvent) => void)[] = [];
  private smsListeners: ((event: SMSEvent) => void)[] = [];

  configure(config: TelephonyConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return this.config !== null && !!this.config.authToken;
  }

  getProviderName(): string {
    return this.config?.provider || 'twilio';
  }

  onIncomingCall(listener: (event: IncomingCallEvent) => void) {
    this.callListeners.push(listener);
    return () => {
      this.callListeners = this.callListeners.filter(l => l !== listener);
    };
  }

  onIncomingSMS(listener: (event: SMSEvent) => void) {
    this.smsListeners.push(listener);
    return () => {
      this.smsListeners = this.smsListeners.filter(l => l !== listener);
    };
  }

  async makeCall(to: string): Promise<CallSession | null> {
    if (!this.isConfigured()) {
      console.warn('[Telephony] Not configured — returning demo call session');
      return {
        id: `demo-call-${Date.now()}`,
        conversationId: '',
        leadId: '',
        direction: 'outbound',
        status: 'ringing',
        startedAt: new Date().toISOString(),
        transcriptAvailable: false,
      };
    }

    // Real implementation would hit Twilio/Telnyx API
    const response = await fetch(`/api/telephony/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, from: this.config!.phoneNumber }),
    });

    if (!response.ok) throw new Error('Failed to initiate call');
    return response.json();
  }

  async sendSMS(to: string, body: string): Promise<{ success: boolean; messageSid?: string }> {
    if (!this.isConfigured()) {
      console.warn('[Telephony] Not configured — simulating SMS send');
      return { success: true, messageSid: `demo-sms-${Date.now()}` };
    }

    const response = await fetch(`/api/telephony/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, body, from: this.config!.phoneNumber }),
    });

    if (!response.ok) throw new Error('Failed to send SMS');
    return response.json();
  }

  async endCall(callSid: string): Promise<void> {
    if (!this.isConfigured()) return;

    await fetch(`/api/telephony/call/${callSid}/end`, { method: 'POST' });
  }

  // For demo: simulate an incoming call
  simulateIncomingCall(event: IncomingCallEvent) {
    this.callListeners.forEach(l => l(event));
  }

  simulateIncomingSMS(event: SMSEvent) {
    this.smsListeners.forEach(l => l(event));
  }

  getSupportedChannels(): Channel[] {
    return ['phone', 'sms'];
  }
}

export const telephonyService = new TelephonyService();
export default telephonyService;
