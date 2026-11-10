import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  applyIndustryOverrides,
  deleteIndustry,
  listIndustryOverrides,
  upsertIndustry,
} from "@/lib/db";
import { industries } from "@/data/industries";
import { requireRole, serverError } from "@/app/api/admin/_lib/auth";

/**
 * Industries shown on the public /industries page.
 *
 * The shipped industries live in data/industries.ts; the dashboard saves its
 * edits as rows in the `industries` collection, merged on top on read — the
 * same pattern the events and sponsors sections use. Writes invalidate the
 * page cache so a saved industry reaches /industries on the next visit rather
 * than after a deploy.
 */

const industrySchema = z.object({
  id: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9-]{0,79}$/, "Invalid industry slug."),
  name: z.string().trim().min(1).max(160),
  shortName: z.string().trim().max(80).optional(),
  description: z.string().trim().max(1000).default(""),
  icon: z.string().trim().max(80).default("factory"),
  image: z.string().trim().max(600).default(""),
  sectors: z.array(z.string().trim().max(80)).max(40).default([]),
  featured: z.boolean().default(false),
});

export async function GET() {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const items = applyIndustryOverrides(
      industries,
      await listIndustryOverrides(),
    );
    return Response.json({ ok: true, industries: items });
  } catch (error) {
    console.error("[api/admin/industries GET]", error);
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const raw: unknown = await request.json().catch(() => null);
    const result = industrySchema.safeParse(raw);
    if (!result.success) {
      return Response.json(
        { ok: false, message: "Invalid industry data." },
        { status: 400 },
      );
    }

    const industry = await upsertIndustry(result.data);
    revalidatePath("/", "layout");
    revalidatePath("/industries", "layout");

    return Response.json({ ok: true, industry });
  } catch (error) {
    console.error("[api/admin/industries PUT]", error);
    return serverError();
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return Response.json(
        { ok: false, message: "Industry id is required." },
        { status: 400 },
      );
    }

    const deleted = await deleteIndustry(id);
    if (!deleted) {
      return Response.json(
        { ok: false, message: "Industry not found." },
        { status: 404 },
      );
    }

    revalidatePath("/", "layout");
    revalidatePath("/industries", "layout");

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/industries DELETE]", error);
    return serverError();
  }
}
