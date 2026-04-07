// This edge function is deprecated. All requests should go to agent-orchestrator.
// Left as a thin wrapper to prevent breaking existing deployed clients.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
