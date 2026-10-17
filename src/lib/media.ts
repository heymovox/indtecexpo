/**
 * Media references added through the admin dashboard come in four shapes:
 *
 *  - a static path already served from /public (`/images/events/x.webp`)
 *  - an R2 object key stored by mistake (`posters/2026-10-16-banner.webp`)
 *  - a presigned R2 URL from /api/admin/upload, which expires after an hour
 *  - the admin-only streamer (`/api/admin/object?key=…`), which 404s on the
 *    public host
 *
 * The public site runs on a host with no admin surface and a CSP of
 * `img-src 'self'`, so everything uploaded must be served through our own
 * origin. `publicMediaUrl` rewrites all four shapes onto `/uploads/<key>`,
 * which streams the object from R2 on every host.
 */

/** Folders /api/admin/upload accepts; also the only keys we ever expose. */
export const UPLOAD_FOLDERS = [
  "media",
  "gallery",
  "floor-plans",
  "posters",
  "logos",
] as const;

const ADMIN_OBJECT_PATH = "/api/admin/object";

const SEGMENT = /^[A-Za-z0-9._-]+$/;

/** `posters/x.webp` → `/uploads/posters/x.webp`, encoded segment by segment. */
export function uploadsUrl(key: string): string {
  const path = key
    .split("/")
    .filter((segment) => segment.length > 0 && segment !== "." && segment !== "..")
    .map(encodeURIComponent)
    .join("/");
  return `/uploads/${path}`;
}

/** True when `key` points inside one of the upload folders. */
export function isUploadKey(key: string): boolean {
  const segments = key.split("/");
  if (segments.length < 2) return false;
  if (!segments.every((segment) => SEGMENT.test(segment))) return false;
  return (UPLOAD_FOLDERS as readonly string[]).includes(segments[0]);
}

function fromAdminObject(raw: string): string {
  let key: string | null = null;
  try {
    key = new URL(raw, "https://local.invalid").searchParams.get("key");
  } catch {
    key = null;
  }
  return key && isUploadKey(key) ? uploadsUrl(key) : "";
}

/**
 * Normalises one stored media reference into a URL the browser can load.
 * `unknown` because records read back from the table carry `unknown` fields;
 * anything that is not a string simply has nothing to resolve.
 * Unknown values (external links, static assets) are returned untouched.
 */
export function publicMediaUrl(value: unknown): string {
  const raw = (typeof value === "string" ? value : "").trim();
  if (!raw) return "";

  if (raw.startsWith(ADMIN_OBJECT_PATH)) return fromAdminObject(raw);

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (url.pathname === ADMIN_OBJECT_PATH) return fromAdminObject(raw);
      const key = decodeURIComponent(
        url.pathname.replace(/^\/+/, "").split("?")[0],
      );
      // Any R2 domain (account endpoint, r2.dev, custom domain) serves the same
      // keys — prefer our own origin so the CSP stays satisfied.
      return isUploadKey(key) ? uploadsUrl(key) : raw;
    } catch {
      return raw;
    }
  }

  if (raw.startsWith("/")) return raw;

  // A bare object key; anything else is returned unchanged rather than blanked,
  // so a hand-typed value is never silently deleted on the next save.
  return isUploadKey(raw) ? uploadsUrl(raw) : raw;
}