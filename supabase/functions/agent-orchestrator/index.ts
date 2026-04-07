import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

import { buildAgentContext } from "@/agents/autorepai/context-builder.ts";
import { getAgentMode, isDemoMode, isProdMode } from "@/agents/autorepai/env.ts";
import { buildSystemPrompt } from "@/agents/autorepai/prompt-builder.ts";
import { runComplianceGate } from "@/agents/autorepai/compliance.ts";
import { validateToolCall } from "@/agents/autorepai/tool-registry.ts";
import { agentResponseSchema } from "@/agents/autorepai/output-schema.ts";
import { buildAuditEvent } from "@/agents/autorepai/audit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { messages, conversationId, contextParams = {} } = payload;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Load context
    const context = buildAgentContext({
      ...contextParams,
      recentMessages: messages
    });

    // 2. Determine Mode
    const envObj = Object.fromEntries(Object.entries(Deno.env.toObject()));
    const mode = getAgentMode(envObj);

    // 3. Build Prompt
    const systemPrompt = buildSystemPrompt(context);

    // 4. Call Model Provider or Mock
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

    let rawJsonResponse = "";

    if (isDemoMode(mode) && !GROQ_API_KEY) {
       // Intelligent Mock for demo
       rawJsonResponse = JSON.stringify({
         message: "I am a demo mock response.",
         intent: "demo_intent",
         posture: "GUIDE",
         stage: context.stage || "new",
         confidence: 1.0,
         nextAction: null,
         toolCall: null,
         escalate: false,
         complianceFlags: ["MOCK_DISCLOSURE"],
         auditMeta: { promptVersion: "1.0", model: "mock-model", channel: context.channel }
       });
    } else if (isProdMode(mode) && !GROQ_API_KEY) {
       // Fail closed in prod if no key
       throw new Error("Missing required provider configuration in prod mode.");
    } else {
       // Call Groq / LLM
       const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
            ],
            response_format: { type: "json_object" },
            temperature: 0.1, // low temp for JSON
          }),
       });

       if (!response.ok) {
         const errorBody = await response.text();
         console.error(`Provider error [${response.status}]: ${errorBody}`);
         throw new Error(`AI provider error: ${response.status}`);
       }
       const data = await response.json();
       rawJsonResponse = data.choices?.[0]?.message?.content || "{}";
    }

    // 5. Validate Structured Output
    let parsedJson;
    try {
      parsedJson = JSON.parse(rawJsonResponse);
    } catch (e) {
      console.error("Failed to parse JSON from LLM", rawJsonResponse);
      throw new Error("LLM did not return valid JSON");
    }

    const validationResult = agentResponseSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      console.error("Schema validation failed", validationResult.error);
      throw new Error("LLM response did not match required schema");
    }

    const agentResponse = validationResult.data;

    // 6. Run Compliance Gate
    const complianceResult = runComplianceGate(context, agentResponse);
    if (!complianceResult.approved) {
      // Return structured blocked result
      return new Response(
        JSON.stringify({
          error: "Blocked by compliance gate",
          reason: complianceResult.blockedReason,
          audit: buildAuditEvent(context, agentResponse, complianceResult, conversationId)
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Validate tool call
    if (!validateToolCall(agentResponse.toolCall)) {
      console.warn(`Invalid tool call requested: ${agentResponse.toolCall?.name}`);
      agentResponse.toolCall = null; // Strip invalid tool
    }

    // 8. Log Audit/Messages (if connected to DB)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const auditEvent = buildAuditEvent(context, agentResponse, complianceResult, conversationId);

    if (supabaseUrl && supabaseKey && conversationId) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Save message
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "agent",
        content: agentResponse.message,
        channel: context.channel,
        ai_generated: true,
        delivered: true,
        metadata: {
          intent: agentResponse.intent,
          posture: agentResponse.posture,
          toolCall: agentResponse.toolCall
        }
      });

      // In a real repo, we'd have an audit table. We'll use logs or a mock table.
      // await supabase.from("audit_events").insert(auditEvent);
    }

    // 9. Return structured result
    return new Response(
      JSON.stringify({
        ...agentResponse,
        audit: auditEvent
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Agent orchestrator error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // Important: Fail closed. Do not return mock success in error path.
    return new Response(
      JSON.stringify({ error: errorMessage, status: "failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
