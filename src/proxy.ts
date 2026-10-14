import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import {
  ADMIN_LANDING_PATH,
  POST_LOGIN_URL,
  isDevelopmentHost,
  resolveSiteHost,
} from "@/config/hosts";
import { readMaintenanceSettings } from "@/lib/maintenance-edge";

/**
 * Host routing and access control.
 *
 * Three hosts, three responsibilities:
 *   indtecexpo.com         public site; /admin and /api/admin do not exist
 *   secure.indtecexpo.com  login gateway only; the dashboard is not served
 *   app.indtecexpo.com     admin dashboard only
 *
 * Every decision below is made from the Host header, which the client cannot
 * forge for a different origin, so none of it is reachable by appending a
 * query string.
 */

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
 * Paths that stay reachable while maintenance mode is on.
 *
 * The dashboard hosts are always exempt. A public-site outage must never be
 * able to take the admin offline, or there would be no way to switch it back
 * off.
 */
function isMaintenanceExempt(pathname: string, site: string): boolean {
  if (site !== "public") return true;
  return (
    pathname === "/maintenance" ||
    isAdminPagePath(pathname) ||
    isAdminApiPath(pathname)
  );
}

/** Hide the admin surface from the public host instead of redirecting it. */
function refuse(): NextResponse {
  return new NextResponse("Not found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const site = resolveSiteHost(request.headers.get("host"));

  /* ---------------- gateway: login only ---------------- */
  if (site === "gateway") {
    // Anything that is not the login screen or the login endpoint does not
    // belong on the gateway. This keeps the dashboard off the gateway host
    // even for a staff member with a valid session.
    if (!isLoginPath(pathname)) {
      if (!isHtmlRequest(request)) return refuse();
      return NextResponse.redirect(
        new URL(
          hasAdminSession(request) ? POST_LOGIN_URL : `/admin/login`,
          request.url,
        ),
      );
    }
    // The gateway is not a maintenance surface; fall through.
    return NextResponse.next();
  }

  /* ---------------- admin host ---------------- */
  if (site === "admin") {
    if (isAdminApiPath(pathname)) {
      if (!isLoginPath(pathname) && !hasAdminSession(request)) {
        return NextResponse.json(
          { ok: false, message: "Unauthorized" },
          { status: 401 },
        );
      }
      return NextResponse.next();
    }

    if (isAdminPagePath(pathname)) {
      if (isLoginPath(pathname)) {
        // Logging in belongs on the gateway, so production sends it there.
        // Locally the dev host doubles as the gateway's stand-in and bouncing
        // to https://secure.indtecexpo.com would hand a developer a login form
        // against the live site.
        if (!isDevelopmentHost()) {
          if (!isHtmlRequest(request)) return refuse();
          return NextResponse.redirect(
            new URL("/admin/login", "https://secure.indtecexpo.com"),
          );
        }
        return NextResponse.next();
      }
      if (!hasAdminSession(request)) {
        // Bounce to the gateway, carrying the path so the user lands back
        // where they were aiming once authenticated.
        if (isHtmlRequest(request)) {
          return NextResponse.redirect(
            new URL(
              `/admin/login?next=${encodeURIComponent(pathname)}`,
              "https://secure.indtecexpo.com",
            ),
          );
        }
        return NextResponse.json(
          { ok: false, message: "Unauthorized" },
          { status: 401 },
        );
      }
      return NextResponse.next();
    }

    // Everything else on the admin host is not part of this application.
    if (!isHtmlRequest(request)) return refuse();
    return NextResponse.redirect(new URL(ADMIN_LANDING_PATH, request.url));
  }

  /* ---------------- public host ---------------- */
  // No admin surface here at all. A 404 is deliberate over a redirect so the
  // public site does not confirm that an admin exists.
  if (isAdminApiPath(pathname) || isAdminPagePath(pathname)) {
    return refuse();
  }

  if (!isMaintenanceExempt(pathname, site)) {
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