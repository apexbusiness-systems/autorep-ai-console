import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

/**
 * Unified webhook handler for inbound events:
 * - Twilio SMS/Voice callbacks
 * - Meta (Facebook/Instagram) webhook verification & messages
 * - Generic CRM/DMS callbacks
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const source = url.searchParams.get("source") || "unknown";

  // Meta webhook verification (GET)
  if (req.method === "GET" && source === "meta") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    
    const VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN") || "doorstep-auto-verify";
    
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const body = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let result: Record<string, unknown> = {};

    switch (source) {
      case "twilio-sms": {
        const { From, Body, MessageSid } = body;
        
        // Find or create conversation
        const { data: existingConv } = await supabase
          .from("conversations")
          .select("id")
          .eq("customer_phone", From)
          .eq("status", "active")
          .order("last_message_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const conversationId = existingConv?.id;

        if (conversationId) {
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            role: "customer",
            content: Body,
            channel: "sms",
            delivered: true,
          });

          await supabase.from("conversations").update({
            last_message_at: new Date().toISOString(),
            unread_count: (await supabase.from("conversations").select("unread_count").eq("id", conversationId).single()).data?.unread_count + 1 || 1,
          }).eq("id", conversationId);
        }

        result = { processed: true, source: "twilio-sms", messageSid: MessageSid, conversationId };
        break;
      }

      case "twilio-voice": {
        const { CallSid, From, CallStatus } = body;
        
        await supabase.from("audit_events").insert({
          action: CallStatus === "initiated" ? "call_started" : "call_ended",
          entity_type: "call",
          entity_id: CallSid,
          performed_by: "System",
          details: `${CallStatus} call from ${From}`,
          metadata: body,
        });

        result = { processed: true, source: "twilio-voice", callSid: CallSid };
        break;
      }

      case "meta": {
        // Handle Facebook/Instagram messages
        const entries = body.entry || [];
        for (const entry of entries) {
          const messaging = entry.messaging || [];
          for (const event of messaging) {
            if (event.message) {
              const senderId = event.sender?.id;
              const messageText = event.message?.text;

              if (senderId && messageText) {
                await supabase.from("audit_events").insert({
                  action: "message_sent",
                  entity_type: "meta_message",
                  entity_id: event.message.mid || `meta-${Date.now()}`,
                  performed_by: "Customer",
                  details: `Inbound message from Meta user ${senderId}: "${messageText.substring(0, 100)}"`,
                  metadata: { senderId, platform: entry.id ? "facebook" : "instagram" },
                });
              }
            }
          }
        }
        result = { processed: true, source: "meta", entries: entries.length };
        break;
      }

      case "dealertrack":
      case "pbs": {
        // DMS callback — finance application response
        const { referenceId, status, decision } = body;
        
        if (referenceId) {
          await supabase.from("routing_jobs")
            .update({
              status: status === "approved" ? "accepted" : status === "declined" ? "rejected" : "submitted",
              response_at: new Date().toISOString(),
            })
            .eq("id", referenceId);
        }

        await supabase.from("audit_events").insert({
          action: "finance_submitted",
          entity_type: "routing_response",
          entity_id: referenceId || `${source}-${Date.now()}`,
          performed_by: source,
          details: `${source} response: ${decision || status || "unknown"}`,
          metadata: body,
        });

        result = { processed: true, source, referenceId };
        break;
      }

      default:
        result = { processed: false, error: `Unknown source: ${source}` };
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
