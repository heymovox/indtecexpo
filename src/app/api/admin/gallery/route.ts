import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  GALLERY_CATEGORIES,
  createGalleryItem,
  deleteGalleryItem,
  getGalleryItem,
  listGalleryItems,
  updateGalleryItem,
} from "@/lib/db";
import { deleteObject } from "@/lib/r2";
import { requireRole, serverError } from "@/app/api/admin/_lib/auth";

/**
 * Gallery images uploaded from the admin dashboard.
 *
 * Access is superadmin-only to match the "Gallery" nav item in
 * config/admin.ts. The upload itself happens in /api/admin/upload; this route
 * only manages the metadata record that decides whether an image is published
 * to the public site and where it sits in the order.
 */

const idSchema = z
  .string()
  .trim()
  .min(1)
  // Object keys are not accepted here, only record ids.
  .regex(/^[a-zA-Z0-9_-]{1,64}$/);

const createSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.enum(GALLERY_CATEGORIES),
  objectKey: z
    .string()
    .trim()
    .min(1)
    .max(300)
    // Must be a gallery object key: this is what gets streamed publicly.
    .refine((key) => key.startsWith("gallery/") && !key.includes(".."), {
      message: "Invalid gallery object key.",
    }),
  caption: z.string().trim().max(300).optional().default(""),
  alt: z.string().trim().max(300).optional().default(""),
  width: z.coerce.number().int().min(1).max(20000).optional(),
  height: z.coerce.number().int().min(1).max(20000).optional(),
  order: z.coerce.number().int().min(0).max(100000).optional().default(0),
  published: z.boolean().optional().default(false),
  origin: z.enum(["upload", "hosted"]).optional().default("upload"),
});

const patchSchema = createSchema.partial();

/** Gallery is superadmin-only, matching the "Gallery" entry in config/admin.ts. */
async function requireSuperadmin(): Promise<Response | null> {
  return requireRole("superadmin");
}

export async function GET() {
  const denied = await requireSuperadmin();
  if (denied) return denied;

  try {
    const items = await listGalleryItems();
    return Response.json({ ok: true, items });
  } catch (error) {
    console.error("[api/admin/gallery GET]", error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireSuperadmin();
  if (denied) return denied;

  try {
    const raw: unknown = await request.json().catch(() => null);
    const result = createSchema.safeParse(raw);
    if (!result.success) {
      return Response.json(
        { ok: false, message: "Invalid gallery image data." },
        { status: 400 },
      );
    }

    const item = await createGalleryItem(result.data);
    return Response.json({ ok: true, item }, { status: 201 });
  } catch (error) {
    console.error("[api/admin/gallery POST]", error);
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireSuperadmin();
  if (denied) return denied;

  try {
    const raw: unknown = await request.json().catch(() => null);
    const parsed = z
      .object({ id: idSchema })
      .passthrough()
      .safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        { ok: false, message: "Gallery image id is required." },
        { status: 400 },
      );
    }

    const { id, ...rest } = parsed.data as { id: string } & Record<string, unknown>;
    const result = patchSchema.safeParse(rest);
    if (!result.success) {
      return Response.json(
        { ok: false, message: "Invalid gallery image data." },
        { status: 400 },
      );
    }

    const item = await updateGalleryItem(id, result.data);
    if (!item) {
      return Response.json(
        { ok: false, message: "Gallery image not found." },
        { status: 404 },
      );
    }
    return Response.json({ ok: true, item });
  } catch (error) {
    console.error("[api/admin/gallery PATCH]", error);
    return serverError();
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireSuperadmin();
  if (denied) return denied;

  try {
    const id = request.nextUrl.searchParams.get("id");
    const parsed = idSchema.safeParse(id ?? "");
    if (!parsed.success) {
      return Response.json(
        { ok: false, message: "Gallery image id is required." },
        { status: 400 },
      );
    }

    const item = await getGalleryItem(parsed.data);

    const deleted = await deleteGalleryItem(parsed.data);
    if (!deleted) {
      return Response.json(
        { ok: false, message: "Gallery image not found." },
        { status: 404 },
      );
    }

    // Drop the orphaned object so the bucket does not accumulate dead files.
    // A failure here must not fail the delete: the record is already gone.
    if (item?.objectKey) {
      try {
        await deleteObject(item.objectKey);
      } catch (error) {
        console.warn(
          `[api/admin/gallery DELETE] could not remove ${item.objectKey}`,
          error,
        );
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/gallery DELETE]", error);
    return serverError();
  }
}