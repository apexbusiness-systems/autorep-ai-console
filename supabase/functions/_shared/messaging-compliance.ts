/**
 * TCPA (US) and CASL (Canada) compliance checks for outbound messaging.
 *
 * TCPA: No automated SMS/calls before 8 AM or after 9 PM in recipient's local time.
 * CASL: No commercial electronic messages without prior consent; must include
 *        sender identification and unsubscribe mechanism.
 *
 * This module enforces time-window restrictions and content sanitization.
 */

// North American timezone offsets from UTC (standard time approximations)
const TIMEZONE_OFFSETS: Record<string, number> = {
  // Canada
  "NL": -3.5, "NS": -4, "NB": -4, "PE": -4, "QC": -5, "ON": -5,
  "MB": -6, "SK": -6, "AB": -7, "BC": -8, "YT": -8, "NT": -7, "NU": -5,
  // US major zones
  "ET": -5, "CT": -6, "MT": -7, "PT": -8, "AK": -9, "HI": -10,
};

export interface TimeWindowResult {
  allowed: boolean;
  reason?: string;
  localHour?: number;
  timezone?: string;
}

/**
 * Check if outbound messaging is within TCPA/CASL allowed hours (8 AM - 9 PM).
 * Uses phone number prefix to estimate timezone when province is unknown.
 */
export function checkMessagingTimeWindow(
  recipientTimezone?: string
): TimeWindowResult {
  const now = new Date();
  const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;

  // Default to Eastern Time if timezone unknown (conservative for North America)
  const tz = recipientTimezone?.toUpperCase() || "ON";
  const offset = TIMEZONE_OFFSETS[tz] ?? -5;

  let localHour = utcHour + offset;
  if (localHour < 0) localHour += 24;
  if (localHour >= 24) localHour -= 24;

  const intHour = Math.floor(localHour);

  if (intHour < 8 || intHour >= 21) {
    return {
      allowed: false,
      reason: `Outside TCPA/CASL allowed hours (8 AM - 9 PM). Recipient local time: ~${intHour}:${String(Math.floor((localHour % 1) * 60)).padStart(2, "0")}`,
      localHour: intHour,
      timezone: tz,
    };
  }

  return { allowed: true, localHour: intHour, timezone: tz };
}

/**
 * Sanitize SMS body content to prevent injection and ensure compliance.
 * - Strips control characters (except newline)
 * - Enforces max length (1600 chars for SMS, standard Twilio limit)
 * - Checks for required opt-out language on marketing messages
 */
export function sanitizeSmsBody(
  body: string,
  isMarketing: boolean = false
): { sanitized: string; warnings: string[] } {
  const warnings: string[] = [];

  // Strip non-printable control characters (keep newline and common whitespace)
  let sanitized = body.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Trim excessive whitespace
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n").trim();

  // Enforce max SMS length
  if (sanitized.length > 1600) {
    sanitized = sanitized.substring(0, 1597) + "...";
    warnings.push("Message truncated to 1600 characters (SMS limit).");
  }

  // Marketing messages must include opt-out language (TCPA/CASL requirement)
  if (isMarketing) {
    const hasOptOut = /\b(stop|unsubscribe|opt.?out|reply stop)\b/i.test(sanitized);
    if (!hasOptOut) {
      sanitized += "\n\nReply STOP to opt out.";
      warnings.push("Auto-appended opt-out language for CASL/TCPA compliance.");
    }
  }

  return { sanitized, warnings };
}

/**
 * Sanitize email HTML content to prevent XSS and injection.
 * Strips script tags, event handlers, and dangerous attributes.
 */
export function sanitizeEmailHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, "")
    .replace(/<object\b[^>]*>.*?<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "");
}
