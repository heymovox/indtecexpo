import type { NextRequest } from "next/server";
import { requireAdmin, serverError } from "@/app/api/admin/_lib/auth";
import { buildObjectKey, getObjectUrl, isR2Configured, putObject } from "@/lib/r2";

/**
 * Admin file upload to Cloudflare R2.
 *
 * Accepts multipart/form-data with a `file` part and a `folder` field. Images
 * and PDFs are accepted and the body is capped before any bytes reach R2.
 */

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
};

const FOLDERS = ["media", "gallery", "floor-plans", "posters", "logos"] as const;

function badRequest(message: string, status = 400): Response {
  return Response.json({ ok: false, message }, { status });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!isR2Configured()) {
    return badRequest(
      "Storage is not configured. Set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.",
      503,
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Expected multipart/form-data.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return badRequest("No file was uploaded.");
  }
  if (file.size === 0) {
    return badRequest("The file is empty.");
  }
  if (file.size > MAX_BYTES) {
    return badRequest(
      `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_BYTES / 1024 / 1024} MB.`,
      413,
    );
  }

  const type = ALLOWED[file.type];
  if (!type) {
    return badRequest(
      "Only JPG, PNG, WebP, AVIF, GIF, SVG images or PDF files are allowed.",
    );
  }

  const requested = String(form.get("folder") ?? "media");
  const folder = (FOLDERS as readonly string[]).includes(requested)
    ? requested
    : "media";

  const baseName = file.name.replace(/\.[^.]+$/, "") || "upload";
  const key = buildObjectKey(folder, `${baseName}${type}`);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await putObject(key, buffer, file.type);

    return Response.json({
      ok: true,
      key: stored.key,
      size: stored.size,
      contentType: file.type,
      // Presigned so the object stays private in the bucket; the URL is valid
      // for an hour, long enough to render in the admin UI.
      url: getObjectUrl(stored.key, 3600),
    });
  } catch (error) {
    console.error("[api/admin/upload]", error);
    return serverError();
  }
}
