import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  verifySessionToken,
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

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_SESSION_COOKIE)?.value);
}

/**
 * Every /api/admin/* handler starts with this guard. Returns a ready-to-send
 * 401 response when there is no valid admin session, or `null` when the
 * request may proceed.
 */
export async function requireAdmin(): Promise<Response | null> {
  const authed = await isAdminAuthenticated();
  return authed ? null : unauthorized();
}
