import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifyCredentials,
} from "@/lib/admin-auth";
import { clientIp, isSameOrigin, rateLimit } from "@/lib/protection";
import { adminLoginSchema, flattenErrors } from "@/lib/validations";
import { forbidden, serverError, tooManyRequests } from "@/app/api/admin/_lib/auth";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden();

  const limit = rateLimit(`admin-login:${clientIp(request)}`, 5, 60000);
  if (!limit.ok) return tooManyRequests();

  try {
    const raw: unknown = await request.json().catch(() => null);
    const result = adminLoginSchema.safeParse(raw);
    if (!result.success) {
      return Response.json(
        {
          ok: false,
          errors: flattenErrors(result.error),
          message: "Enter your email and password.",
        },
        { status: 400 },
      );
    }

    const { email, password } = result.data;
    if (!verifyCredentials(email, password)) {
      return Response.json(
        { ok: false, message: "Invalid email or password." },
        { status: 401 },
      );
    }

    const jar = await cookies();
    // Mark the cookie Secure only when the request actually arrived over TLS,
    // so a local `next start` preview on http://localhost still works.
    jar.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
      ...sessionCookieOptions,
      secure: request.nextUrl.protocol === "https:",
    });

    return Response.json({ ok: true, redirect: "/admin" });
  } catch (error) {
    console.error("[api/admin/login]", error);
    return serverError();
  }
}
