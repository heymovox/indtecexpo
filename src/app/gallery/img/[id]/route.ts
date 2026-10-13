import { getObject } from "@/lib/r2";
import { getGalleryItem } from "@/lib/db";

/**
 * Serves an admin-uploaded gallery image to the public website.
 *
 * The R2 bucket is private and has no CORS policy, and presigned URLs expire
 * after an hour, so uploads are stored as object *keys* and streamed through
 * this same-origin route instead. Serving from our own origin also keeps the
 * page inside the existing `img-src 'self'` CSP without any config changes.
 *
 * Only published items are exposed. Drafts stay private and are previewed in
 * the admin via the authenticated /api/admin/object route.
 */

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const item = await getGalleryItem(id);
  if (!item || !item.published || !item.objectKey) {
    return new Response("Not found", { status: 404 });
  }

  // Reuse the stored timestamp so edits invalidate browser caches.
  const etag = `W/"${item.id}-${Date.parse(item.updatedAt ?? item.createdAt) || 0}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

  let body: Buffer;
  let contentType: string;
  try {
    const object = await getObject(item.objectKey);
    body = object.body;
    contentType = object.contentType;
  } catch {
    // The record exists but the object is gone from the bucket.
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}