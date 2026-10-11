import "server-only";

/**
 * Data protection layer for INDTEC EXPO.
 *
 * Responsibilities
 *  - Input sanitisation (HTML/script stripping, length clamping)
 *  - PII encryption at rest (AES-256-GCM, per-field)
 *  - Redaction helpers for logs
 *  - In-memory sliding-window rate limiting for public mutations
 *  - Origin / CSRF hardening for state-changing requests
 */

import crypto from "node:crypto";

const MAX_FIELD_LENGTH = 5000;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAGS = /<\/?[a-z][^>]*>/gi;
const DANGEROUS_ATTR = /(\son\w+\s*=|javascript:|data:text\/html)/gi;

export function sanitizeText(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  if (typeof value !== "string") return "";
  return value
    .replace(CONTROL_CHARS, "")
    .replace(DANGEROUS_ATTR, "")
    .replace(HTML_TAGS, "")
    .slice(0, maxLength)
    .trim();
}

export function sanitizeEmail(value: unknown) {
  return sanitizeText(value, 254).toLowerCase();
}

export function sanitizePhone(value: unknown) {
  return sanitizeText(value, 25).replace(/[^\d+\s-]/g, "");
}

export function sanitizeUrl(value: unknown) {
  const raw = sanitizeText(value, 300).replace(/^https?:\/\//i, "");
  return raw.replace(/[^a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]/g, "");
}

export function sanitizeObject<T extends Record<string, unknown>>(
  input: T,
  overrides: Partial<Record<keyof T, (value: unknown) => string>> = {},
): T {
  const output = {} as Record<string, unknown>;
  for (const [key, value] of Object.entries(input)) {
    const override = overrides[key as keyof T];
    if (override) {
      output[key] = override(value);
    } else if (typeof value === "string") {
      output[key] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      output[key] = value
        .slice(0, 25)
        .map((item) => (typeof item === "string" ? sanitizeText(item, 120) : item));
    } else {
      output[key] = value;
    }
  }
  return output as T;
}

/* ------------------------------------------------------------------ */
/* Encryption at rest                                                  */
/* ------------------------------------------------------------------ */

function resolveKey(): Buffer {
  const secret = process.env.DATA_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "Missing required environment variable DATA_ENCRYPTION_KEY. See .env.example.",
    );
  }
  return crypto
    .createHash("sha256")
    .update(secret)
    .digest();
}

let cachedKey: Buffer | null = null;

/** Resolved lazily so importing this module never throws during a build. */
function encryptionKey(): Buffer {
  cachedKey ??= resolveKey();
  return cachedKey;
}

const IV_LENGTH = 12;

export function encryptField(plaintext: string): string {
  if (!plaintext) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    encryptionKey(),
    iv,
  );
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${Buffer.concat([iv, tag, encrypted]).toString("base64url")}`;
}

export function decryptField(payload: string): string {
  if (!payload) return "";
  if (!payload.startsWith("enc:v1:")) return payload;
  try {
    const raw = Buffer.from(payload.slice(7), "base64url");
    const iv = raw.subarray(0, IV_LENGTH);
    const tag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
    const data = raw.subarray(IV_LENGTH + 16);
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      iv,
    );
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8",
    );
  } catch {
    return "[unreadable]";
  }
}

/** Fields that must never be written to disk in plain text. */
export const PII_FIELDS = [
  "email",
  "phone",
  "contactPerson",
  "fullName",
  "designation",
  "website",
  "message",
  // Free-text requirement fields: exhibitors often name people or include
  // contact details inside these, so treat them as PII too.
  "machinery",
  "branding",
] as const;

export function encryptPii<T extends Record<string, unknown>>(
  record: T,
  fields: readonly string[] = PII_FIELDS,
): T {
  const output: Record<string, unknown> = { ...record };
  for (const field of fields) {
    const value = output[field];
    // Idempotent: never encrypt an already-encrypted value.
    if (
      typeof value === "string" &&
      value &&
      !value.startsWith("enc:v1:")
    ) {
      output[field] = encryptField(value);
    }
  }
  return output as T;
}

export function decryptPii<T extends Record<string, unknown>>(
  record: T,
  fields: readonly string[] = PII_FIELDS,
): T {
  const output: Record<string, unknown> = { ...record };
  for (const field of fields) {
    const value = output[field];
    if (typeof value === "string" && value.startsWith("enc:v1:")) {
      output[field] = decryptField(value);
    }
  }
  return output as T;
}

export function redactForLog(value: string): string {
  if (value.includes("@")) {
    const [name = "", domain = ""] = value.split("@");
    return `${name.slice(0, 2)}***@${domain}`;
  }
  if (value.length > 4) return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
  return "***";
}

/* ------------------------------------------------------------------ */
/* Rate limiting                                                       */
/* ------------------------------------------------------------------ */

interface RateWindow {
  hits: number[];
}

const buckets = new Map<string, RateWindow>();

const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, window] of buckets) {
    window.hits = window.hits.filter((stamp) => now - stamp < 60_000);
    if (window.hits.length === 0) buckets.delete(key);
  }
}, 30_000) as unknown as { unref?: () => void };

sweeper.unref?.();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
}

export function rateLimit(
  key: string,
  limit = 8,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((stamp) => now - stamp < windowMs);
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return { ok: false, remaining: 0 };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: limit - bucket.hits.length };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/* ------------------------------------------------------------------ */
/* Request hardening                                                   */
/* ------------------------------------------------------------------ */

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    // Non-browser clients (curl, server-to-server) do not send Origin.
    const referer = request.headers.get("referer");
    if (!referer) return true;
    try {
      return new URL(referer).host === new URL(request.url).host;
    } catch {
      return false;
    }
  }
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export function securityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "X-DNS-Prefetch-Control": "on",
  };
}
