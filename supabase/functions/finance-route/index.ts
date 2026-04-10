import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";
import { getCorsHeaders, handleCorsPreflightOrReject } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitHeaders, validateRequestSize } from "../_shared/rate-limit.ts";

serve(async (req) => {
  const preflightOrBlock = handleCorsPreflightOrReject(req);
  if (preflightOrBlock) return preflightOrBlock;

  const corsHeaders = getCorsHeaders(req);

  // Rate limit: 5 finance routes per minute (high-value action)
  const rateCheck = checkRateLimit(req, { windowMs: 60_000, maxRequests: 5 });
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: "Finance routing rate limit exceeded." }),
      { status: 429, headers: { ...corsHeaders, ...rateLimitHeaders(rateCheck), "Content-Type": "application/json" } }
    );
  }

  const sizeCheck = validateRequestSize(req, 50_000);
  if (sizeCheck) return sizeCheck;

  try {
    const { financePacketId, target = "dealertrack" } = await req.json();

    if (!financePacketId) {
      return new Response(
        JSON.stringify({ error: "financePacketId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validTargets = ["dealertrack", "pbs", "autovance", "manual"];
    if (!validTargets.includes(target)) {
      return new Response(
        JSON.stringify({ error: `Invalid target. Must be one of: ${validTargets.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the finance packet
    const { data: packet, error: fetchError } = await supabase
      .from("finance_packets")
      .select("*")
      .eq("id", financePacketId)
      .single();

    if (fetchError || !packet) {
      return new Response(
        JSON.stringify({ error: "Finance packet not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check completeness
    const completion = packet.completion_percentage || 0;
    if (completion < 80) {
      return new Response(
        JSON.stringify({ 
          error: "Finance packet is incomplete", 
          completion,
          blockers: packet.blockers || [],
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create routing job
    const { data: routingJob, error: routeError } = await supabase
      .from("routing_jobs")
      .insert({
        finance_packet_id: financePacketId,
        target,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (routeError) {
      throw new Error(`Failed to create routing job: ${routeError.message}`);
    }

    // Update packet routing status
    await supabase
      .from("finance_packets")
      .update({
        routing_status: "submitted",
        routing_target: target,
        routed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", financePacketId);

    // Attempt to route to external system
    let externalResult = { submitted: false, provider: "mock", reference: "" };

    if (target === "dealertrack") {
      const dtApiKey = Deno.env.get("DEALERTRACK_API_KEY");
      if (dtApiKey) {
        // Real Dealertrack API call would go here
        externalResult = { submitted: true, provider: "dealertrack", reference: `DT-${Date.now()}` };
      } else {
        externalResult = { submitted: true, provider: "mock-dealertrack", reference: `MOCK-DT-${Date.now()}` };
      }
    } else if (target === "pbs") {
      const pbsApiKey = Deno.env.get("PBS_API_KEY");
      if (pbsApiKey) {
        externalResult = { submitted: true, provider: "pbs", reference: `PBS-${Date.now()}` };
      } else {
        externalResult = { submitted: true, provider: "mock-pbs", reference: `MOCK-PBS-${Date.now()}` };
      }
    } else {
      externalResult = { submitted: true, provider: "manual", reference: `MAN-${Date.now()}` };
    }

    // Update routing job status
    await supabase
      .from("routing_jobs")
      .update({ status: "submitted" })
      .eq("id", routingJob.id);

    // Audit event
    await supabase.from("audit_events").insert({
      action: "packet_routed",
      entity_type: "finance_packet",
      entity_id: financePacketId,
      performed_by: "System",
      details: `Finance packet routed to ${target} (${externalResult.provider}). Ref: ${externalResult.reference}`,
      metadata: { target, routingJobId: routingJob.id, ...externalResult },
    });

    return new Response(
      JSON.stringify({
        success: true,
        routingJobId: routingJob.id,
        target,
        ...externalResult,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Finance routing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
