/**
 * Shared CORS configuration for all Supabase Edge Functions.
 * Restricts Access-Control-Allow-Origin to explicitly allowed origins.
 *
 * Set ALLOWED_ORIGINS as a comma-separated list in Supabase secrets:
 *   supabase secrets set ALLOWED_ORIGINS="https://app.doorstepauto.com,https://localhost:8080"
 *
 * Falls back to the Supabase project URL if ALLOWED_ORIGINS is not set.
 */

function getAllowedOrigins(): string[] {
  const envOrigins = Deno.env.get("ALLOWED_ORIGINS");
  if (envOrigins) {
    return envOrigins.split(",").map((o) => o.trim()).filter(Boolean);
  }
  // Fallback: allow the project's own Supabase URL (for Supabase Studio/dashboard)
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  return supabaseUrl ? [supabaseUrl] : [];
}

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") || "";
  const allowed = getAllowedOrigins();

  // In development (no ALLOWED_ORIGINS set and no Supabase URL), permit all origins
  // This ensures local dev and demo mode work without configuration
  const isDevFallback = allowed.length === 0;
  const isAllowed = isDevFallback || allowed.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? (origin || "*") : "",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleCorsPreflightOrReject(
  request: Request
): Response | null {
  const corsHeaders = getCorsHeaders(request);

  // Block requests from disallowed origins
  if (!corsHeaders["Access-Control-Allow-Origin"]) {
    return new Response("Forbidden: origin not allowed", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return null; // Proceed to handler
}
