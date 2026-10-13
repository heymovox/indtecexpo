import "server-only";

import crypto from "node:crypto";

/**
 * Signed, self-describing unsubscribe tokens (RFC 8058 style).
 *
 * The token carries the address itself plus an HMAC, so validating an
 * unsubscribe needs no database round-trip and a forged address is rejected.
 * Format: base64url(email) + "." + base64url(hmac)
 */

function secret(): Buffer {
  const value =
    process.env.UNSUBSCRIBE_SECRET?.trim() || process.env.ADMIN_SESSION_SECRET;
  if (!value) {
    throw new Error(
      "Missing required environment variable UNSUBSCRIBE_SECRET. See .env.example.",
    );
  }
  return crypto.createHash("sha256").update(value).digest();
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function buildUnsubscribeToken(email: string): string {
  const payload = Buffer.from(email.trim().toLowerCase(), "utf8").toString(
    "base64url",
  );
  return `${payload}.${sign(payload)}`;
}

/**
 * Returns the address a token authorises, or null when the token is malformed
 * or the signature does not match. Never throws on bad input.
 */
export function readUnsubscribeToken(token: string): string | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  // Length check first: timingSafeEqual throws on a length mismatch.
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const email = Buffer.from(payload, "base64url").toString("utf8").trim();
    // Guard against a validly-signed but nonsensical value.
    return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) ? email : null;
  } catch {
    return null;
  }
}