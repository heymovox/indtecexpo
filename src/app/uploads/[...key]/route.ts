import { isUploadKey } from "@/lib/media";
import { getObject, isR2Configured } from "@/lib/r2";

/**
 * Serves admin-uploaded files (event banners, posters, floor-plan artwork and
 * PDFs) to every host, including the public site where `/api/admin/*` is a 404.
 *
 * The bucket is private and has no CORS policy, so uploads are stored as object
 * *keys* and streamed through this same-origin route — which also keeps them
 * inside the site's `img-src 'self'` CSP and inside next/image's local pattern
 * set, unlike the one-hour presigned URLs /api/admin/upload hands back.
 *
 * Only keys inside an upload folder are reachable; everything else 404s.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

const SEGMENT = /^[A-Za-z0-9._-]+$/;

function notFound(): Response {
  return new Response("Not found", { status: 404 });
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await ctx.params;

  if (
    !segments?.length ||
    segments.some(
      (segment) => !SEGMENT.test(segment) || segment === "." || segment === "..",
    )
  ) {
    return notFound();
  }

  const key = segments.join("/");
  if (!isUploadKey(key)) return notFound();

  const extension = key.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) return notFound();

  if (!isR2Configured()) {
    return new Response("Storage is not configured.", {
      status: 503,
      headers: { "retry-after": "60" },
    });
  }

  let body: Buffer;
  try {
    ({ body } = await getObject(key));
  } catch (error) {
    // A missing object is a 404; a bucket outage on a public marketing asset
    // should still log loudly before it looks like a content mistake.
    console.error("[uploads] could not read object", key, error);
    return notFound();
  }

  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Length": String(body.byteLength),
    // Keys carry an upload date, so a replacement upload writes a fresh key.
    // The long shared-cache window is safe and keeps posters off the Serverless
    // fetch path on repeat views.
    "Cache-Control":
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    "X-Content-Type-Options": "nosniff",
  });

  if (contentType === "image/svg+xml") {
    headers.set(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    );
  }

  return new Response(new Uint8Array(body), { status: 200, headers });
}