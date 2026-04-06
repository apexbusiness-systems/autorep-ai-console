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
    const { vin } = req.method === "GET"
      ? { vin: new URL(req.url).searchParams.get("vin") }
      : await req.json();

    if (!vin || typeof vin !== "string") {
      return new Response(
        JSON.stringify({ error: "vin is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate VIN format (17 chars, alphanumeric, no I/O/Q)
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
    if (!vinRegex.test(vin)) {
      return new Response(
        JSON.stringify({ error: "Invalid VIN format. Must be 17 alphanumeric characters (excluding I, O, Q)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call NHTSA vPIC API (free, no key required)
    const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin.toUpperCase()}?format=json`;
    const response = await fetch(nhtsaUrl);

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`);
    }

    const data = await response.json();
    const results = data.Results || [];

    const getValue = (variableId: number): string => {
      const entry = results.find((r: { VariableId: number; Value: string | null }) => r.VariableId === variableId);
      return entry?.Value || "";
    };

    const errorCode = getValue(143);

    const decoded = {
      vin: vin.toUpperCase(),
      year: parseInt(getValue(29)) || 0,
      make: getValue(26),
      model: getValue(28),
      trim: getValue(109),
      body: getValue(5),
      engine: `${getValue(13)} ${getValue(21)}`.trim(),
      fuelType: getValue(24),
      transmission: getValue(37),
      drivetrain: getValue(15),
      doors: parseInt(getValue(14)) || undefined,
      plantCountry: getValue(75),
      valid: errorCode === "0" || errorCode === "",
      errorCode,
      errorText: errorCode !== "0" && errorCode !== "" ? getValue(144) : undefined,
    };

    return new Response(
      JSON.stringify(decoded),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("VIN decode error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
