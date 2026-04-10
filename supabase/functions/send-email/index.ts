import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";
import { getCorsHeaders, handleCorsPreflightOrReject } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitHeaders, validateRequestSize } from "../_shared/rate-limit.ts";
import { checkMessagingTimeWindow, sanitizeEmailHtml } from "../_shared/messaging-compliance.ts";

serve(async (req) => {
  const preflightOrBlock = handleCorsPreflightOrReject(req);
  if (preflightOrBlock) return preflightOrBlock;

  const corsHeaders = getCorsHeaders(req);

  // Rate limit: 15 emails per minute per IP
  const rateCheck = checkRateLimit(req, { windowMs: 60_000, maxRequests: 15 });
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: "Email rate limit exceeded." }),
      { status: 429, headers: { ...corsHeaders, ...rateLimitHeaders(rateCheck), "Content-Type": "application/json" } }
    );
  }

  const sizeCheck = validateRequestSize(req, 100_000);
  if (sizeCheck) return sizeCheck;

  try {
    const { to, subject, html, text, from, replyTo, leadId, conversationId, type = "general" } = await req.json();

    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ error: "to, subject, and html or text are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize HTML content to prevent XSS injection
    const safeHtml = html ? sanitizeEmailHtml(html) : undefined;

    // TCPA/CASL time window check for marketing emails
    if (type === "marketing") {
      const timeCheck = checkMessagingTimeWindow();
      if (!timeCheck.allowed) {
        return new Response(
          JSON.stringify({ error: "Blocked by CASL compliance", reason: timeCheck.reason }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    let messageId: string;
    let provider: string;

    if (RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: from || "Door Step Auto <sales@doorstepauto.com>",
          to: [to],
          subject,
          html: safeHtml || undefined,
          text: text || undefined,
          reply_to: replyTo || undefined,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Resend error [${response.status}]: ${errorBody}`);
        throw new Error(`Email send failed: ${response.status}`);
      }

      const result = await response.json();
      messageId = result.id;
      provider = "resend";
    } else {
      messageId = `mock-email-${Date.now()}`;
      provider = "mock";
      console.log(`[Mock Email] To: ${to} | Subject: ${subject}`);
    }

    // Audit
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("audit_events").insert({
        action: "message_sent",
        entity_type: "email",
        entity_id: messageId,
        performed_by: "AI Agent",
        details: `${type} email sent to ${to}: "${subject}" via ${provider}`,
        metadata: { provider, leadId, conversationId, type },
      });
    }

    return new Response(
      JSON.stringify({ success: true, messageId, provider }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email send error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
