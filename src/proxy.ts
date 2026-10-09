import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-auth";

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

export function proxy(request: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)"],
};
