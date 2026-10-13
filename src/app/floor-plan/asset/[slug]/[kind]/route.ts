import { getObject } from "@/lib/r2";
import { getFloorPlanAssets, isFloorPlanSlug } from "@/lib/db";

/**
 * Serves uploaded floor plan artwork and PDFs to the public site.
 *
 * Floor plans are inherently public content, so this route is unauthenticated
 * — unlike /api/admin/object. The R2 bucket stays private: the stored object
 * key is resolved per request rather than persisted as a presigned URL, which
 * would expire and leave a dead link behind.
 */

export const dynamic = "force-dynamic";

const IMAGE_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
};

function extensionOf(key: string): string {
  return key.split(".").pop()?.toLowerCase() ?? "";
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ slug: string; kind: string }> },
) {
  const { slug, kind } = await ctx.params;
  if (!isFloorPlanSlug(slug) || (kind !== "image" && kind !== "pdf")) {
    return new Response("Not found", { status: 404 });
  }

  const assets = await getFloorPlanAssets(slug);
  const objectKey = kind === "pdf" ? assets?.pdfKey : assets?.imageKey;
  if (!objectKey) {
    return new Response("Not found", { status: 404 });
  }

  // Reuse the stored timestamp so a re-upload invalidates cached copies.
  const etag = `W/"${slug}-${kind}-${Date.parse(assets?.updatedAt ?? assets?.createdAt ?? "") || 0}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

  let body: Buffer;
  let contentType: string;
  try {
    const object = await getObject(objectKey);
    body = object.body;
    contentType =
      object.contentType ||
      (kind === "pdf"
        ? "application/pdf"
        : (IMAGE_TYPES[extensionOf(objectKey)] ?? "application/octet-stream"));
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const fileName = `${slug}-floor-plan${kind === "pdf" ? "" : `.${extensionOf(objectKey) || "png"}`}`;

  return new Response(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}