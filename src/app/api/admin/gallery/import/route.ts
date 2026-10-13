import { requireRole, serverError } from "@/app/api/admin/_lib/auth";
import { floorPhotos } from "@/data/floorPhotos";
import { listGalleryItems } from "@/lib/db";
import { importHostedGalleryPhotos } from "@/lib/gallery-import";

/**
 * Imports the photographs already hosted in /public into the gallery
 * collection so they become editable from the dashboard.
 *
 * Idempotent: the source photo id is reused as the record id, so re-running
 * only adds genuinely new photos and never duplicates or overwrites admin edits.
 */

/** How many hosted photos are still missing from the gallery collection. */
export async function GET() {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const existing = await listGalleryItems();
    const known = new Set(existing.map((item) => item.id));
    const imported = floorPhotos.filter((photo) => known.has(photo.id)).length;

    return Response.json({
      ok: true,
      total: floorPhotos.length,
      imported,
      pending: floorPhotos.length - imported,
    });
  } catch (error) {
    console.error("[api/admin/gallery/import GET]", error);
    return serverError();
  }
}

export async function POST() {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const result = await importHostedGalleryPhotos();
    return Response.json({
      ok: true,
      created: result.created.length,
      skipped: result.skipped.length,
      available: result.available,
    });
  } catch (error) {
    console.error("[api/admin/gallery/import POST]", error);
    return serverError();
  }
}