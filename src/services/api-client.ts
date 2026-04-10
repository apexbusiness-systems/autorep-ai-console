/**
 * API Client Service
 * Provides a clean interface for calling Supabase edge functions.
 * Centralizes all API calls so swapping between mock/live is seamless.
 */

import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
if (!PROJECT_ID) {
  throw new Error('Missing VITE_SUPABASE_PROJECT_ID environment variable.');
}
const FUNCTIONS_URL = `https://${PROJECT_ID}.supabase.co/functions/v1`;

async function callEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
  method: "POST" | "GET" = "POST"
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      method,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as T, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export interface AIChatResponse {
  content: string;
  tokensUsed: number;
  finishReason: string;
  model: string;
  conversationId?: string;
}

export async function sendAIChat(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  conversationId?: string,
  maxTokens?: number
): Promise<{ data: AIChatResponse | null; error: string | null }> {
  return callEdgeFunction<AIChatResponse>("ai-chat", {
    messages,
    conversationId,
    maxTokens,
  });
}

// ─── SMS ────────────────────────────────────────────────────────────────────

export interface SMSResponse {
  success: boolean;
  messageSid: string;
  provider: string;
}

export async function sendSMS(
  to: string,
  body: string,
  conversationId?: string,
  leadId?: string
): Promise<{ data: SMSResponse | null; error: string | null }> {
  return callEdgeFunction<SMSResponse>("send-sms", {
    to,
    body,
    conversationId,
    leadId,
  });
}

// ─── Email ──────────────────────────────────────────────────────────────────

export interface EmailResponse {
  success: boolean;
  messageId: string;
  provider: string;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  leadId?: string;
  conversationId?: string;
  type?: string;
}): Promise<{ data: EmailResponse | null; error: string | null }> {
  return callEdgeFunction<EmailResponse>("send-email", params);
}

// ─── Finance Routing ────────────────────────────────────────────────────────

export interface FinanceRouteResponse {
  success: boolean;
  routingJobId: string;
  target: string;
  submitted: boolean;
  provider: string;
  reference: string;
}

export async function routeFinancePacket(
  financePacketId: string,
  target: "dealertrack" | "pbs" | "autovance" | "manual" = "dealertrack"
): Promise<{ data: FinanceRouteResponse | null; error: string | null }> {
  return callEdgeFunction<FinanceRouteResponse>("finance-route", {
    financePacketId,
    target,
  });
}

// ─── Inventory Search ───────────────────────────────────────────────────────

export interface InventorySearchResponse {
  vehicles: Record<string, unknown>[];
  externalListings: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
  hasMarketcheck: boolean;
}

export async function searchInventory(params: {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  bodyType?: string;
  condition?: "new" | "used" | "all";
  sortBy?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: InventorySearchResponse | null; error: string | null }> {
  return callEdgeFunction<InventorySearchResponse>("inventory-search", params);
}

// ─── VIN Decode ─────────────────────────────────────────────────────────────

export interface VINDecodeResponse {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  body?: string;
  engine?: string;
  fuelType?: string;
  transmission?: string;
  drivetrain?: string;
  doors?: number;
  plantCountry?: string;
  valid: boolean;
  errorCode?: string;
  errorText?: string;
}

export async function decodeVIN(
  vin: string
): Promise<{ data: VINDecodeResponse | null; error: string | null }> {
  return callEdgeFunction<VINDecodeResponse>("vin-decode", { vin });
}

export default {
  sendAIChat,
  sendSMS,
  sendEmail,
  routeFinancePacket,
  searchInventory,
  decodeVIN,
};
