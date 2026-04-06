import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

const SYSTEM_PROMPT = `You are an expert automotive sales AI agent for Door Step Auto. You help customers find their ideal vehicle, answer questions about inventory, build quotes, handle objections professionally, and guide them through the purchase process. Be warm, professional, knowledgeable, and consultative. Never make claims about financing approval. Always disclose you are an AI when asked.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, maxTokens = 1024 } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

    // If no API key, return intelligent mock response
    if (!GROQ_API_KEY) {
      const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user")?.content || "";
      const mockResponse = generateMockResponse(lastUserMsg);
      
      return new Response(
        JSON.stringify({
          content: mockResponse,
          tokensUsed: 0,
          finishReason: "mock",
          model: "mock-demo",
          conversationId,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Groq API error [${response.status}]: ${errorBody}`);
      throw new Error(`AI provider error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    // Log to Supabase if conversation context provided
    if (conversationId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "agent",
          content: choice?.message?.content || "",
          channel: "web",
          ai_generated: true,
          delivered: true,
        });
      }
    }

    return new Response(
      JSON.stringify({
        content: choice?.message?.content || "",
        tokensUsed: data.usage?.total_tokens || 0,
        finishReason: choice?.finish_reason || "stop",
        model: data.model || "llama-3.3-70b-versatile",
        conversationId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateMockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  
  if (lower.includes("price") || lower.includes("cost") || lower.includes("payment")) {
    return "Great question about pricing! Let me pull up some payment scenarios for you. With our current programs, I can show you options that work within your budget. Would you like me to build a detailed quote?";
  }
  if (lower.includes("trade")) {
    return "We'd love to look at your trade-in! To give you the most accurate value, could you share the year, make, model, and approximate mileage? I can have a preliminary estimate for you right away.";
  }
  if (lower.includes("test drive") || lower.includes("see it") || lower.includes("appointment")) {
    return "Absolutely! I can get you booked for a test drive. What day and time works best for you this week? We have availability throughout the day.";
  }
  if (lower.includes("finance") || lower.includes("credit") || lower.includes("loan")) {
    return "We work with multiple lenders to find the best rates available. I can start a quick pre-qualification — it's a soft inquiry that won't affect your credit score. Would you like to proceed?";
  }
  if (lower.includes("suv") || lower.includes("truck") || lower.includes("sedan")) {
    return "We have a great selection in stock right now! Let me narrow it down for you — what's your budget range, and do you have any must-have features like AWD, heated seats, or towing capability?";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Welcome to Door Step Auto! I'm your AI sales assistant. I can help you browse inventory, get pricing, schedule test drives, or answer any questions. What can I help you with today?";
  }
  return "I'd be happy to help you find the perfect vehicle! Could you tell me more about what you're looking for — body style, budget, or any specific features?";
}
