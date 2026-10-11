import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  authenticateAdmin,
  issueSession,
  sessionCookieOptions,
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
      // Mark the cookie Secure only when the request actually arrived over TLS,
      // so a local `next start` preview on http://localhost still works.
      jar.set(ADMIN_SESSION_COOKIE, token, {
        ...sessionCookieOptions,
        secure: request.nextUrl.protocol === "https:",
        expires: expiresAt,
      });

      return Response.json({
        ok: true,
        redirect: "/admin",
        admin: { email: admin.email, name: admin.name, role: admin.role },
      });
  } catch (error) {
    console.error("[api/admin/login]", error);
    return serverError();
  }
}
