import type { NextRequest } from "next/server";
import { requireAdmin, serverError } from "@/app/api/admin/_lib/auth";
import { getObject, isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
};

function contentTypeFor(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

/**
 * Streams a stored object through the app so admin previews stay same-origin.
 *
 * The bucket is private and has no CORS policy, so thumbnails are served from
 * here instead of directly from R2. Presigned URLs remain available via
 * /api/admin/storage when a shareable link is needed.
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!isR2Configured()) {
    return Response.json({ message: "Storage is not configured." }, { status: 503 });
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return Response.json({ message: "Missing key." }, { status: 400 });
  }

  if (key.includes("..") || key.startsWith("/")) {
    return Response.json({ message: "Invalid key." }, { status: 400 });
  }

  try {
    const object = await getObject(key);

    return new Response(new Uint8Array(object.body), {
      headers: {
        "Content-Type": object.contentType || contentTypeFor(key),
        "Content-Length": String(object.body.byteLength),
        "Cache-Control": "private, max-age=900",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch (error) {
    console.error("[api/admin/object]", error);
    return serverError();
  }
}
