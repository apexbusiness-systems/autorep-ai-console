import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";
import { getCorsHeaders, handleCorsPreflightOrReject } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitHeaders, validateRequestSize } from "../_shared/rate-limit.ts";

serve(async (req) => {
  const preflightOrBlock = handleCorsPreflightOrReject(req);
  if (preflightOrBlock) return preflightOrBlock;

  const corsHeaders = getCorsHeaders(req);

  // Rate limit: 30 inventory searches per minute
  const rateCheck = checkRateLimit(req, { windowMs: 60_000, maxRequests: 30 });
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: "Search rate limit exceeded." }),
      { status: 429, headers: { ...corsHeaders, ...rateLimitHeaders(rateCheck), "Content-Type": "application/json" } }
    );
  }

  try {
    const params = req.method === "GET" 
      ? Object.fromEntries(new URL(req.url).searchParams)
      : await req.json();

    const { make, model, yearMin, yearMax, priceMin, priceMax, bodyType, condition, sortBy, page = 1, pageSize = 20 } = params;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query against local inventory
    let query = supabase.from("vehicles").select("*", { count: "exact" });

    if (make) query = query.ilike("make", `%${make}%`);
    if (model) query = query.ilike("model", `%${model}%`);
    if (yearMin) query = query.gte("year", Number(yearMin));
    if (yearMax) query = query.lte("year", Number(yearMax));
    if (priceMin) query = query.gte("price", Number(priceMin));
    if (priceMax) query = query.lte("price", Number(priceMax));
    if (bodyType) query = query.ilike("body", `%${bodyType}%`);
    if (condition === "new") query = query.eq("mileage", "New");
    if (condition === "used") query = query.neq("mileage", "New");

    // Sort
    if (sortBy === "price_asc") query = query.order("price", { ascending: true });
    else if (sortBy === "price_desc") query = query.order("price", { ascending: false });
    else if (sortBy === "year_desc") query = query.order("year", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    // Paginate
    const start = (Number(page) - 1) * Number(pageSize);
    query = query.range(start, start + Number(pageSize) - 1);

    const { data: localVehicles, error, count } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Also search Marketcheck if configured
    let externalListings: unknown[] = [];
    const MARKETCHECK_API_KEY = Deno.env.get("MARKETCHECK_API_KEY");

    if (MARKETCHECK_API_KEY && (make || model)) {
      try {
        const mcParams = new URLSearchParams({
          api_key: MARKETCHECK_API_KEY,
          country: "CA",
          rows: "10",
          ...(make && { make }),
          ...(model && { model }),
          ...(priceMax && { price_range: `0-${priceMax}` }),
        });

        const mcResponse = await fetch(
          `https://mc-api.marketcheck.com/v2/search/car/active?${mcParams}`
        );

        if (mcResponse.ok) {
          const mcData = await mcResponse.json();
          externalListings = (mcData.listings || []).slice(0, 5).map((l: Record<string, unknown>) => ({
            id: `mc-${l.id}`,
            source: "marketcheck",
            year: l.year,
            make: l.make,
            model: l.model,
            trim: l.trim || "",
            price: l.price,
            mileage: l.miles ? `${(l.miles as number).toLocaleString()} km` : "N/A",
            exteriorColor: l.exterior_color,
            dealerName: (l.dealer as Record<string, unknown>)?.name,
          }));
        }
      } catch (mcError) {
        console.warn("Marketcheck search failed:", mcError);
      }
    }

    return new Response(
      JSON.stringify({
        vehicles: localVehicles || [],
        externalListings,
        total: count || 0,
        page: Number(page),
        pageSize: Number(pageSize),
        hasMarketcheck: !!MARKETCHECK_API_KEY,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Inventory search error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
