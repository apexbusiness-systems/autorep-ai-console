import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, body, conversationId, leadId } = await req.json();

    if (!to || !body) {
      return new Response(
        JSON.stringify({ error: "to and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = to.replace(/[\s\-\(\)]/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER");

    let messageSid: string;
    let provider: string;

    if (TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM) {
      // Real Twilio API call
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
      const twilioAuth = btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`);
      
      const formData = new URLSearchParams();
      formData.append("To", cleanPhone);
      formData.append("From", TWILIO_FROM);
      formData.append("Body", body);

      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${twilioAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Twilio error [${response.status}]: ${errorBody}`);
        throw new Error(`Twilio SMS failed: ${response.status}`);
      }

      const result = await response.json();
      messageSid = result.sid;
      provider = "twilio";
    } else {
      // Mock mode
      messageSid = `mock-sms-${Date.now()}`;
      provider = "mock";
      console.log(`[Mock SMS] To: ${cleanPhone} | Body: ${body.substring(0, 50)}...`);
    }

    // Log audit event
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Log message
      if (conversationId) {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "agent",
          content: body,
          channel: "sms",
          ai_generated: true,
          delivered: true,
        });
      }

      // Audit event
      await supabase.from("audit_events").insert({
        action: "message_sent",
        entity_type: "sms",
        entity_id: messageSid,
        performed_by: "AI Agent",
        details: `SMS sent to ${cleanPhone} via ${provider}`,
        metadata: { provider, conversationId, leadId },
      });
    }

    return new Response(
      JSON.stringify({ success: true, messageSid, provider }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("SMS send error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
