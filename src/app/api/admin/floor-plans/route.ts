import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  FLOOR_PLAN_SLUGS,
  clearFloorPlanAssets,
  getFloorPlanAssets,
  listFloorPlanAssets,
  upsertFloorPlanAssets,
} from "@/lib/db";
import { deleteObject } from "@/lib/r2";
import { requireRole, serverError } from "@/app/api/admin/_lib/auth";

/**
 * Floor plan artwork and PDFs, one record per edition.
 *
 * Superadmin-only, matching the "Floor Plans" entry in config/admin.ts. The
 * bytes go up through /api/admin/upload; this route only records which R2
 * object belongs to which city so the public page can resolve it.
 */

const objectKey = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .refine((key) => key.startsWith("floor-plans/") && !key.includes(".."), {
    message: "Invalid floor plan object key.",
  });

const patchSchema = z
  .object({
    slug: z.enum(FLOOR_PLAN_SLUGS),
    imageKey: objectKey.nullish(),
    pdfKey: objectKey.nullish(),
    imageAlt: z.string().trim().max(300).nullish(),
    pdfLabel: z.string().trim().max(120).nullish(),
  })
  .refine(
    (data) =>
      (data.imageKey === undefined || data.imageKey !== null) ||
      (data.pdfKey === undefined || data.pdfKey !== null),
    { message: "Nothing to update." },
  );

export async function GET() {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const items = await listFloorPlanAssets();
    return Response.json({ ok: true, items });
  } catch (error) {
    console.error("[api/admin/floor-plans GET]", error);
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const raw: unknown = await request.json().catch(() => null);
    const result = patchSchema.safeParse(raw);
    if (!result.success) {
      return Response.json(
        { ok: false, message: "Invalid floor plan data." },
        { status: 400 },
      );
    }

    const { slug, ...patch } = result.data;

    // Replacing an asset removes the object it supersedes so the bucket does
    // not accumulate orphans. A failure here must not fail the save.
    const previous = await getFloorPlanAssets(slug);
    const superseded: string[] = [];
    if (previous?.imageKey && previous.imageKey !== patch.imageKey) {
      superseded.push(previous.imageKey);
    }
    if (previous?.pdfKey && previous.pdfKey !== patch.pdfKey) {
      superseded.push(previous.pdfKey);
    }

    const item = await upsertFloorPlanAssets(slug, patch);

    for (const key of superseded) {
      try {
        await deleteObject(key);
      } catch (error) {
        console.warn(`[api/admin/floor-plans] could not remove ${key}`, error);
      }
    }

    return Response.json({ ok: true, item });
  } catch (error) {
    console.error("[api/admin/floor-plans PUT]", error);
    return serverError();
  }
}

/** Reverts a city to the static plan shipped in the repository. */
export async function DELETE(request: NextRequest) {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const slug = request.nextUrl.searchParams.get("slug");
    const parsed = z.enum(FLOOR_PLAN_SLUGS).safeParse(slug ?? "");
    if (!parsed.success) {
      return Response.json(
        { ok: false, message: "A valid city is required." },
        { status: 400 },
      );
    }

    const previous = await getFloorPlanAssets(parsed.data);
    const cleared = await clearFloorPlanAssets(parsed.data);
    if (!cleared) {
      return Response.json(
        { ok: false, message: "No uploaded plan to clear for that city." },
        { status: 404 },
      );
    }

    for (const key of [previous?.imageKey, previous?.pdfKey]) {
      if (!key) continue;
      try {
        await deleteObject(key);
      } catch (error) {
        console.warn(`[api/admin/floor-plans DELETE] could not remove ${key}`, error);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/floor-plans DELETE]", error);
    return serverError();
  }
}