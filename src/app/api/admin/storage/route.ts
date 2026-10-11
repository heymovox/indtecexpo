import type { NextRequest } from "next/server";
import { requireAdmin, serverError } from "@/app/api/admin/_lib/auth";
import { deleteObject, getObjectUrl, isR2Configured, listObjects } from "@/lib/r2";

export const runtime = "nodejs";

/** Lists stored objects so the admin can see what has been uploaded. */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!isR2Configured()) {
    return Response.json(
      { ok: true, configured: false, objects: [] },
      { status: 200 },
    );
  }

  const prefix = request.nextUrl.searchParams.get("prefix") ?? "";

  try {
    const items = await listObjects(prefix, 300);
    return Response.json({
      ok: true,
      configured: true,
      objects: items.map((item) => ({
        ...item,
        url: getObjectUrl(item.key, 3600),
      })),
    });
  } catch (error) {
    console.error("[api/admin/storage]", error);
    return serverError();
  }
}

/** Removes a stored object. Requires `?key=` with the full object key. */
export async function DELETE(request: NextRequest) {
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
    await deleteObject(key);
    return Response.json({ ok: true, deleted: key });
  } catch (error) {
    console.error("[api/admin/storage]", error);
    return serverError();
  }
}
