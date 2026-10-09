import "server-only";

import crypto from "node:crypto";

export const ADMIN_SESSION_COOKIE = "indtec_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. See .env.example.`,
    );
  }
  return value;
}

function secret(): Buffer {
  return crypto
    .createHash("sha256")
    .update(requiredEnv("ADMIN_SESSION_SECRET"))
    .digest();
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export function verifyCredentials(email: string, password: string): boolean {
  return (
    safeEqual(
      email.trim().toLowerCase(),
      requiredEnv("ADMIN_EMAIL").trim().toLowerCase(),
    ) && safeEqual(password, requiredEnv("ADMIN_PASSWORD"))
  );
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${expires}.${sign(String(expires))}`;
  return Buffer.from(payload).toString("base64url");
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [expiresRaw, signature] = decoded.split(".");
    if (!expiresRaw || !signature) return false;
    const expected = sign(expiresRaw);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    const expires = Number(expiresRaw);
    if (!Number.isFinite(expires) || expires < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};
