import "server-only";

/**
 * Admin accounts and sessions backed by Neon.
 *
 * Passwords are stored as scrypt hashes (never plaintext) and sessions are
 * rows in `admin_sessions`, which makes a login revocable server-side: signing
 * out, disabling an account or changing a password all take effect on the next
 * request rather than waiting for a cookie to expire.
 */

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

import {
  COUNT_ADMIN_USERS,
  DELETE_ADMIN_USER,
  DELETE_EXPIRED_SESSIONS,
  DISABLE_ADMIN_USER,
  ENABLE_ADMIN_USER,
  INSERT_ADMIN_SESSION,
  INSERT_ADMIN_USER,
  REVOKE_SESSION,
  REVOKE_SESSIONS_FOR_ADMIN,
  SELECT_ACTIVE_SESSION,
  SELECT_ADMIN_USERS,
  SELECT_ADMIN_USER_BY_EMAIL,
  SELECT_ADMIN_USER_BY_ID,
  TOUCH_ADMIN_LAST_LOGIN,
  UPDATE_ADMIN_USER_PASSWORD,
  UPDATE_ADMIN_USER_PROFILE,
  isAdminRole,
  rowToAdminUser,
  type AdminRole,
  type AdminUserRow,
} from "@/lib/db-queries";

export type { AdminRole } from "@/lib/db-queries";

let cachedSql: NeonQueryFunction<false, false> | null = null;

function sql(): NeonQueryFunction<false, false> {
  if (!cachedSql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. See .env.example. Run: node scripts/migrate.mjs",
      );
    }
    cachedSql = neon(url);
  }
  return cachedSql;
}

export function isAdminDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function countAdminUsers(): Promise<number> {
  const rows = await sql().query(COUNT_ADMIN_USERS, []);
  const total = rows[0]?.total;
  return typeof total === "number" ? total : Number(total ?? 0);
}

export async function findAdminByEmail(email: string): Promise<AdminUserRow | null> {
  const rows = await sql().query(SELECT_ADMIN_USER_BY_EMAIL, [normalizeEmail(email)]);
  return rowToAdminUser(rows[0]);
}

export async function findAdminById(id: string): Promise<AdminUserRow | null> {
  const rows = await sql().query(SELECT_ADMIN_USER_BY_ID, [id]);
  return rowToAdminUser(rows[0]);
}

export async function listAdmins(): Promise<AdminUserRow[]> {
  const rows = await sql().query(SELECT_ADMIN_USERS, []);
  return rows
    .map(rowToAdminUser)
    .filter((row): row is AdminUserRow => row !== null);
}

/** Inserts an admin. Returns null when the email is already taken. */
export async function createAdmin(input: {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  passwordHash: string;
  createdAt: string;
}): Promise<AdminUserRow | null> {
  const rows = await sql().query(INSERT_ADMIN_USER, [
    input.id,
    normalizeEmail(input.email),
    input.name,
    input.role,
    input.passwordHash,
    input.createdAt,
    input.createdAt,
  ]);
  return rowToAdminUser(rows[0]);
}

export async function setAdminPassword(
  id: string,
  passwordHash: string,
  updatedAt: string,
): Promise<AdminUserRow | null> {
  const rows = await sql().query(UPDATE_ADMIN_USER_PASSWORD, [
    passwordHash,
    updatedAt,
    id,
  ]);
  return rowToAdminUser(rows[0]);
}

export async function setAdminProfile(
  id: string,
  name: string | null,
  role: AdminRole,
  updatedAt: string,
): Promise<AdminUserRow | null> {
  const rows = await sql().query(UPDATE_ADMIN_USER_PROFILE, [
    name,
    role,
    updatedAt,
    id,
  ]);
  return rowToAdminUser(rows[0]);
}

export async function enableAdmin(
  id: string,
  updatedAt: string,
): Promise<AdminUserRow | null> {
  const rows = await sql().query(ENABLE_ADMIN_USER, [updatedAt, id]);
  return rowToAdminUser(rows[0]);
}

export async function disableAdmin(
  id: string,
  updatedAt: string,
): Promise<AdminUserRow | null> {
  const rows = await sql().query(DISABLE_ADMIN_USER, [updatedAt, id]);
  return rowToAdminUser(rows[0]);
}

export async function deleteAdmin(id: string): Promise<boolean> {
  const rows = await sql().query(DELETE_ADMIN_USER, [id]);
  return rows.length > 0;
}

export async function recordLogin(adminId: string, at: string): Promise<void> {
  await sql().query(TOUCH_ADMIN_LAST_LOGIN, [at, adminId]);
}

export async function createSession(input: {
  id: string;
  adminId: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string | null;
  ip: string | null;
}): Promise<{ id: string; expiresAt: string } | null> {
  const rows = await sql().query(INSERT_ADMIN_SESSION, [
    input.id,
    input.adminId,
    input.createdAt,
    input.expiresAt,
    input.userAgent,
    input.ip,
  ]);
  const row = rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    expiresAt: String(row.expires_at ?? input.expiresAt),
  };
}

/**
 * Resolves a session id to its admin, or null when the session is unknown,
 * revoked, expired, or belongs to a disabled account.
 */
export async function findActiveSession(sessionId: string): Promise<{
  sessionId: string;
  expiresAt: string;
  admin: {
    id: string;
    email: string;
    name: string | null;
    role: AdminRole;
    lastLoginAt: string | null;
  };
} | null> {
  const rows = await sql().query(SELECT_ACTIVE_SESSION, [sessionId]);
  const row = rows[0];
  if (!row) return null;
  return {
    sessionId: String(row.session_id),
    expiresAt: String(row.session_expires_at ?? ""),
    admin: {
      id: String(row.admin_id),
      email: String(row.email),
      name:
        row.name === null || row.name === undefined ? null : String(row.name),
      role: isAdminRole(row.role) ? row.role : "editor",
      lastLoginAt:
        row.last_login_at === null || row.last_login_at === undefined
          ? null
          : String(row.last_login_at),
    },
  };
}

export async function revokeSession(sessionId: string, at: string): Promise<boolean> {
  const rows = await sql().query(REVOKE_SESSION, [at, sessionId]);
  return rows.length > 0;
}

/** Signs an admin out everywhere. Used on password change and disable. */
export async function revokeSessionsForAdmin(
  adminId: string,
  at: string,
): Promise<number> {
  const rows = await sql().query(REVOKE_SESSIONS_FOR_ADMIN, [at, adminId]);
  return rows.length;
}

export async function purgeExpiredSessions(before: string): Promise<number> {
  const rows = await sql().query(DELETE_EXPIRED_SESSIONS, [before]);
  return rows.length;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
