import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  authenticateAdmin,
  issueSession,
  sessionCookieOptions,
} from "@/lib/admin-auth";
import { clientIp, isSameOrigin, rateLimit } from "@/lib/protection";
import { POST_LOGIN_URL } from "@/config/hosts";
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
      const admin = await authenticateAdmin(email, password);
      if (!admin) {
        return Response.json(
          { ok: false, message: "Invalid email or password." },
          { status: 401 },
        );
      }

      const { token, expiresAt } = await issueSession(admin.id, {
        userAgent: request.headers.get("user-agent"),
        ip: clientIp(request),
      });

      const jar = await cookies();
      // Secure in production unconditionally, because the gateway and the
      // dashboard are separate HTTPS origins and the session cookie has to
      // survive that hop. The protocol check only relaxes it for a local
      // `next start` preview served over plain http.
      jar.set(ADMIN_SESSION_COOKIE, token, {
        ...sessionCookieOptions,
        secure:
          process.env.NODE_ENV === "production" ||
          request.nextUrl.protocol === "https:",
        expires: expiresAt,
      });

      return Response.json({
        ok: true,
        // Absolute, and not derived from the request: login runs on
        // secure.indtecexpo.com but the dashboard is on app.indtecexpo.com, so
        // a relative "/admin" would bounce the user back to the gateway. It is
        // a fixed constant rather than a query parameter so the response can
        // never be turned into an open redirect.
        redirect: POST_LOGIN_URL,
        admin: { email: admin.email, name: admin.name, role: admin.role },
      });
  } catch (error) {
    console.error("[api/admin/login]", error);
    return serverError();
  }
}
