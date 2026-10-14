/**
 * Which site is this?
 *
 * The deployment is split across three hosts so the public marketing site
 * exposes no admin surface at all:
 *
 *   indtecexpo.com          public site only
 *   secure.indtecexpo.com   login gateway only
 *   app.indtecexpo.com      admin dashboard only
 *
 * Request routing is decided from the Host header in proxy.ts, never from a
 * query parameter, so the split cannot be walked around from the browser.
 */

/** Production hostnames that serve the dashboard and the login gateway. */
const ADMIN_HOSTS = ["app.indtecexpo.com", "secure.indtecexpo.com"] as const;

/**
 * True only outside production, and only when the build also says so.
 *
 * Both checks matter: NODE_ENV alone is not enough, because a production build
 * that forgot NEXT_PUBLIC_APP_ENV would otherwise accept the development hosts
 * and strip the admin off the public site.
 */
function devHostAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_APP_ENV !== "production"
  );
}

/** Exported so the middleware can keep the local login form usable. */
export const isDevelopmentHost = devHostAllowed;

/**
 * Hostnames that stand in for the subdomains on localhost.
 *
 * localhost and 127.0.0.1 map to the admin host so the usual `next dev`
 * workflow keeps working untouched. The public site can still be exercised
 * locally by pointing indtecexpo.com at 127.0.0.1 in the hosts file.
 */
const DEV_ADMIN_HOSTS = [
  "localhost",
  "127.0.0.1",
  "admin.localhost",
  "app.localhost",
  "admin.indtecexpo.local",
  "app.indtecexpo.local",
] as const;

const DEV_GATEWAY_HOSTS = [
  "secure.localhost",
  "secure.indtecexpo.local",
] as const;

export type SiteHost = "public" | "admin" | "gateway";

export function resolveSiteHost(host: string | null): SiteHost {
  if (!host) return "public";

  // Compare with any port stripped so localhost works with or without one.
  const hostname = host.split(":")[0].toLowerCase();

  if (devHostAllowed()) {
    if ((DEV_GATEWAY_HOSTS as readonly string[]).includes(hostname)) {
      return "gateway";
    }
    if ((DEV_ADMIN_HOSTS as readonly string[]).includes(hostname)) {
      return "admin";
    }
  }

  if ((ADMIN_HOSTS as readonly string[]).includes(hostname)) {
    return hostname.startsWith("secure.") ? "gateway" : "admin";
  }

  return "public";
}

/**
 * Where the browser goes after a successful login.
 *
 * Hard-coded on purpose. Reading this from a query parameter would turn the
 * post-login navigation into an open redirect.
 */
export const POST_LOGIN_URL = "https://app.indtecexpo.com/admin";

/** Same-origin landing path used when a request arrives on the admin host. */
export const ADMIN_LANDING_PATH = "/admin";

/**
 * Cookies must span all three hosts for the gateway handover to work: the
 * session is issued on secure.indtecexpo.com and read on app.indtecexpo.com.
 *
 * Applied only in production. A cookie whose Domain does not match the current
 * host is discarded outright, which would log everyone out on localhost.
 */
export const ADMIN_COOKIE_DOMAIN = ".indtecexpo.com";