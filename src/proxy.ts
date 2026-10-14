import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { readMaintenanceSettings } from "@/lib/maintenance-edge";

function hasAdminSession(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

function isHtmlRequest(request: NextRequest): boolean {
  return (request.headers.get("accept") ?? "").includes("text/html");
}

function isAdminApiPath(pathname: string): boolean {
  return pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

function isAdminPagePath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isLoginPath(pathname: string): boolean {
  return pathname === "/admin/login" || pathname === "/api/admin/login";
}

/**
 * Paths that stay reachable while maintenance is on.
 *
 * /admin and /api/admin must stay open or the switch could not be turned off
 * again once the site is down. The maintenance page itself obviously has to
 * load. Static files are already excluded by the matcher.
 */
function isMaintenanceExempt(pathname: string): boolean {
  return (
    pathname === "/maintenance" ||
    isAdminPagePath(pathname) ||
    isAdminApiPath(pathname)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAdminApiPath(pathname)) {
    if (isLoginPath(pathname)) return NextResponse.next();
    if (!hasAdminSession(request)) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  if (isAdminPagePath(pathname) && !isLoginPath(pathname)) {
    if (!hasAdminSession(request)) {
      if (isHtmlRequest(request)) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
  }

  if (!isMaintenanceExempt(pathname)) {
    const settings = await readMaintenanceSettings();

    if (settings.enabled) {
      // Browsers get the countdown page; everything else (fetch, RSC payloads,
      // form posts) gets a 503 so it fails loudly instead of receiving HTML it
      // cannot parse.
      if (isHtmlRequest(request)) {
        const target = new URL("/maintenance", request.url);
        target.searchParams.set("from", pathname);
        return NextResponse.redirect(target);
      }

      return new NextResponse("Site is temporarily under maintenance.", {
        status: 503,
        headers: { "retry-after": "3600", "content-type": "text/plain" },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)"],
};
