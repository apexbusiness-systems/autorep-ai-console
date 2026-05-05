/**
 * Webhook Security: HMAC Signature Verification
 *
 * Validates inbound webhook payloads using HMAC-SHA256 signatures.
 * Supports Twilio, Meta, and custom webhook sources.
 */

/**
 * Verify HMAC-SHA256 signature on a webhook payload.
 * Returns true if the signature matches, false otherwise.
 */
export async function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: string = "SHA-256"
): Promise<boolean> {
  if (!signature || !secret) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: algorithm },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );

    const computedHex = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison to prevent timing attacks
    const signatureClean = signature.replace(/^sha256=/, "").toLowerCase();
    if (computedHex.length !== signatureClean.length) return false;

    let diff = 0;
    for (let i = 0; i < computedHex.length; i++) {
      diff |= computedHex.charCodeAt(i) ^ signatureClean.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

/**
 * Verify Twilio webhook signature using HMAC-SHA1.
 *
 * Twilio signs: HMAC-SHA1(authToken, fullUrl + sortedParamValues)
 * See: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
export async function verifyTwilioSignature(
  request: Request,
  body: string
): Promise<boolean> {
  const twilioSignature = request.headers.get("X-Twilio-Signature");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

  if (!twilioSignature || !authToken) return false;

  // Reconstruct the full URL Twilio signed
  const url = new URL(request.url);
  let signingString = url.toString();

  // For form-encoded POST bodies, Twilio appends sorted key=value pairs
  if (
    request.headers.get("content-type")?.includes("application/x-www-form-urlencoded") &&
    body
  ) {
    const params = new URLSearchParams(body);
    const sorted = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
    for (const [key, value] of sorted) {
      signingString += key + value;
    }
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(authToken),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signingString));
    const computed = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    // Constant-time comparison
    if (computed.length !== twilioSignature.length) return false;
    let diff = 0;
    for (let i = 0; i < computed.length; i++) {
      diff |= computed.charCodeAt(i) ^ twilioSignature.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

/**
 * Verify Meta (Facebook/Instagram) webhook signature.
 */
export async function verifyMetaSignature(
  request: Request,
  body: string
): Promise<boolean> {
  const signature = request.headers.get("X-Hub-Signature-256");
  const appSecret = Deno.env.get("META_APP_SECRET");

  if (!signature || !appSecret) {
    // If no secret is configured, allow (for development)
    return !appSecret;
  }

  return verifyHmacSignature(body, signature, appSecret);
}

/**
 * Verify a generic custom webhook using a shared secret.
 */
export async function verifyCustomWebhookSignature(
  request: Request,
  body: string
): Promise<boolean> {
  const signature =
    request.headers.get("X-Webhook-Signature") ||
    request.headers.get("X-Signature-256");
  const secret = Deno.env.get("WEBHOOK_SECRET");

  if (!secret) return true; // No secret configured = allow (dev mode)
  if (!signature) return false; // Secret configured but no signature = reject

  return verifyHmacSignature(body, signature, secret);
}
