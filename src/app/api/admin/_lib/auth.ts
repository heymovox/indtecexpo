import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  canAccess,
  resolveSession,
  type AdminIdentity,
  type AdminRole,
} from "@/lib/admin-auth";

export function unauthorized(): Response {
  return Response.json(
    { ok: false, message: "Unauthorized" },
    { status: 401 },
  );
}

export function forbidden(): Response {
  return Response.json(
    { ok: false, message: "Request blocked." },
    { status: 403 },
  );
}

export function tooManyRequests(): Response {
  return Response.json(
    { ok: false, message: "Too many requests. Please try again in a minute." },
    { status: 429 },
  );
}

export function serverError(): Response {
  return Response.json(
    { ok: false, message: "Something went wrong. Please try again." },
    { status: 500 },
  );
}

/**
 * Resolves the caller from the session cookie.
 *
 * Unlike the edge proxy, which only checks the signature, this consults the
 * database so revoked sessions and disabled accounts are rejected immediately.
 */
export async function getAdmin(): Promise<AdminIdentity | null> {
  try {
    const jar = await cookies();
    return await resolveSession(jar.get(ADMIN_SESSION_COOKIE)?.value);
  } catch (error) {
    console.error("[admin-auth] session lookup failed", error);
    return null;
  }
}

/**
 * Every /api/admin/* handler starts with this guard. Returns a ready-to-send
 * 401 response when there is no valid admin session, or `null` when the
 * request may proceed.
 */
export async function requireAdmin(): Promise<Response | null> {
  const admin = await getAdmin();
  return admin ? null : unauthorized();
}

/**
 * Role guard. `requireRole("admin")` admits admins and superadmins but not
 * editors. Returns a 403 when the caller is authenticated but under-privileged.
 */
export async function requireRole(minimum: AdminRole): Promise<Response | null> {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  return canAccess(admin, minimum) ? null : forbidden();
}
