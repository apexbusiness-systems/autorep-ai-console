// This edge function is deprecated. All requests should go to agent-orchestrator.
// Left as a thin wrapper to prevent breaking existing deployed clients.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightOrReject } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitHeaders } from "../_shared/rate-limit.ts";

serve(async (req) => {
  const preflightOrBlock = handleCorsPreflightOrReject(req);
  if (preflightOrBlock) return preflightOrBlock;

  const corsHeaders = getCorsHeaders(req);

  const rateCheck = checkRateLimit(req, { windowMs: 60_000, maxRequests: 20 });
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded." }),
      { status: 429, headers: { ...corsHeaders, ...rateLimitHeaders(rateCheck), "Content-Type": "application/json" } }
    );
  }

  try {
    const payload = await req.json();

    // Forward to agent-orchestrator
    const orchestratorUrl = new URL(req.url).origin + "/agent-orchestrator";

    const token = req.headers.get("Authorization");

    const response = await fetch(orchestratorUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": token } : {})
      },
      body: JSON.stringify({
        messages: payload.messages,
        conversationId: payload.conversationId,
        contextParams: { channel: "web" }
      })
    });

    const data = await response.json();

    if (!response.ok) {
       return new Response(JSON.stringify(data), { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Map the new structured response back to the old format for backwards compatibility
    const oldFormat = {
      content: data.message,
      tokensUsed: 0,
      finishReason: "stop",
      model: data.auditMeta?.model || "unknown",
      conversationId: payload.conversationId
    };

    return new Response(JSON.stringify(oldFormat), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
