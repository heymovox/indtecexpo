import "server-only";

/**
 * Admin authentication.
 *
 * Accounts live in Postgres (`admin_users`) with scrypt-hashed passwords, and
 * logins create a row in `admin_sessions`. The cookie carries a signed session
 * id so edge middleware can reject anonymous requests cheaply, while every API
 * handler re-checks the session row — that is what makes sign-out, account
 * disabling and password changes take effect immediately.
 *
 * Bootstrap: while `admin_users` is empty, the first successful login seeds a
 * superadmin from ADMIN_EMAIL / ADMIN_PASSWORD. After that the database is the
 * only source of truth and the password variable can be removed.
 */

import crypto from "node:crypto";

import {
  countAdminUsers,
  createAdmin,
  createSession,
  findActiveSession,
  findAdminByEmail,
  normalizeEmail,
  recordLogin,
  revokeSession,
  revokeSessionsForAdmin,
} from "@/lib/admin-db";
import { roleAtLeast, type AdminRole } from "@/lib/db-queries";

export type { AdminRole } from "@/lib/db-queries";

export const ADMIN_SESSION_COOKIE = "indtec_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

/** Identity attached to a valid session. */
export interface AdminIdentity {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
}

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

/* ----------------------------- passwords ------------------------------- */

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

/** Hashes a password as `scrypt$N$r$p$salt$hash` using a random 16-byte salt. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password.normalize("NFKC"), salt, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
    maxmem: 128 * SCRYPT.N * SCRYPT.r * 2,
  });
  return [
    "scrypt",
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

/** Constant-time verification. Returns false for malformed stored hashes. */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const N = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    const salt = Buffer.from(parts[4], "base64");
    const expected = Buffer.from(parts[5], "base64");
    if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;
    if (expected.length === 0) return false;

    const derived = crypto.scryptSync(password.normalize("NFKC"), salt, expected.length, {
      N,
      r,
      p,
      maxmem: 128 * N * r * 2,
    });
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/* ------------------------------ sessions ------------------------------- */

/**
 * Creates a session row and returns the opaque cookie value.
 *
 * The token is `sessionId.expiry.signature`; the session id is random, so the
 * cookie is not guessable and the signature blocks tampering.
 */
export async function issueSession(
  adminId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const sessionId = crypto.randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await createSession({
    id: sessionId,
    adminId,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    userAgent: meta.userAgent ?? null,
    ip: meta.ip ?? null,
  });

  const payload = `${sessionId}.${expiresAt.getTime()}`;
  const token = Buffer.from(`${payload}.${sign(payload)}`).toString("base64url");
  return { token, expiresAt };
}

/** Reads the session id out of a cookie without touching the database. */
export function readSessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [sessionId, expiresRaw, signature] = decoded.split(".");
    if (!sessionId || !expiresRaw || !signature) return null;
    const expected = sign(`${sessionId}.${expiresRaw}`);
    if (!safeEqual(signature, expected)) return null;
    const expires = Number(expiresRaw);
    if (!Number.isFinite(expires) || expires < Date.now()) return null;
    return sessionId;
  } catch {
    return null;
  }
}

/** Stateless check used by edge middleware, where no database call is made. */
export function verifySessionToken(token: string | undefined | null): boolean {
  return readSessionToken(token) !== null;
}

/** Full check: signature, then the session row and account state. */
export async function resolveSession(
  token: string | undefined | null,
): Promise<AdminIdentity | null> {
  const sessionId = readSessionToken(token);
  if (!sessionId) return null;

  const session = await findActiveSession(sessionId);
  if (!session) return null;

  const expires = new Date(session.expiresAt).getTime();
  if (!Number.isFinite(expires) || expires < Date.now()) {
    // Clean up rows that outlived their cookie.
    await revokeSession(sessionId, new Date().toISOString()).catch(() => {});
    return null;
  }

  return {
    id: session.admin.id,
    email: session.admin.email,
    name: session.admin.name,
    role: session.admin.role,
  };
}

export async function endSession(
  token: string | undefined | null,
): Promise<boolean> {
  const sessionId = readSessionToken(token);
  if (!sessionId) return false;
  return revokeSession(sessionId, new Date().toISOString()).catch(() => false);
}

export async function endAllSessions(adminId: string): Promise<number> {
  return revokeSessionsForAdmin(adminId, new Date().toISOString());
}

/* ------------------------------- login --------------------------------- */

/**
 * Seeds the first superadmin from the environment when no admins exist yet.
 * Safe to call on every login: it is a no-op once the table is populated.
 */
async function bootstrapFromEnv(): Promise<AdminIdentity | null> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return null;

  const admin = await createAdmin({
    id: crypto.randomUUID(),
    email,
    name: "Superadmin",
    role: "superadmin",
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  });

  if (!admin) return null;
  console.log(
    `[admin-auth] seeded superadmin ${admin.email} from ADMIN_EMAIL/ADMIN_PASSWORD`,
  );
  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
}

/**
 * Verifies credentials against the database.
 *
 * Falls back to the environment bootstrap only while the table is empty, so
 * the very first login after deploy works without a manual seed step.
 */
export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<AdminIdentity | null> {
  const normalized = normalizeEmail(email);
  if (!normalized || !password) return null;

  const total = await countAdminUsers();
  if (total === 0) {
    const seeded = await bootstrapFromEnv();
    if (!seeded) return null;
    // Verify the supplied password actually matches what we seeded.
    if (!safeEqual(normalized, normalizeEmail(seeded.email))) return null;
    if (!safeEqual(password, process.env.ADMIN_PASSWORD ?? "")) return null;
    return seeded;
  }

  const user = await findAdminByEmail(normalized);
  // Always run a verification so a missing account and a wrong password take
  // a comparable amount of time.
  const ok = user
    ? verifyPassword(password, user.passwordHash)
    : verifyPassword(password, DUMMY_HASH);
  if (!user || !ok) return null;
  if (user.disabledAt) return null;

  await recordLogin(user.id, new Date().toISOString());
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/** A valid hash of a random value, used to equalise timing on unknown emails. */
const DUMMY_HASH = (() => {
  try {
    return hashPassword(crypto.randomBytes(16).toString("base64"));
  } catch {
    return "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA";
  }
})();

/* ------------------------------- roles --------------------------------- */

export function canAccess(
  identity: AdminIdentity | null,
  minimum: AdminRole,
): boolean {
  return identity !== null && roleAtLeast(identity.role, minimum);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};
