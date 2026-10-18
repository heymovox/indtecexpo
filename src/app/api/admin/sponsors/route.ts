import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sponsorTiers } from "@/data/sponsors";
import {
  applySponsorTierOverrides,
  deleteSponsorTier,
  listSponsorTierOverrides,
  upsertSponsorTier,
} from "@/lib/db";
import { requireRole, serverError } from "@/app/api/admin/_lib/auth";

/**
 * Sponsor tiers shown on the public /sponsors page.
 *
 * The shipped tiers live in data/sponsors.ts; the dashboard saves its edits
 * as rows in the `sponsors` collection, merged on top on read — the same
 * pattern the events section uses. Writes invalidate the page cache so a
 * saved tier reaches /sponsors on the next visit rather than after a deploy.
 */

const logoSchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().max(120).default(""),
  logo: z.string().trim().max(600).default(""),
});

const tierSchema = z.object({
  // Shipped ids are lowercase-with-hyphens; dashboard tiers generate
  // `tier-<base36>` ids, which the same pattern accepts.
  id: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9-]{0,79}$/, "Invalid tier id."),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(400).default(""),
  order: z.coerce.number().int().min(0).max(999).default(0),
  published: z.boolean().default(true),
  logos: z.array(logoSchema).max(60).default([]),
});

export async function GET() {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const tiers = applySponsorTierOverrides(
      sponsorTiers,
      await listSponsorTierOverrides(),
    );
    return Response.json({ ok: true, tiers });
  } catch (error) {
    console.error("[api/admin/sponsors GET]", error);
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const raw: unknown = await request.json().catch(() => null);
    const result = tierSchema.safeParse(raw);
    if (!result.success) {
      return Response.json(
        { ok: false, message: "Invalid sponsor tier data." },
        { status: 400 },
      );
    }

    const tier = await upsertSponsorTier(result.data);
    revalidatePath("/", "layout");

    return Response.json({ ok: true, tier });
  } catch (error) {
    console.error("[api/admin/sponsors PUT]", error);
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
        { ok: false, message: "Tier id is required." },
        { status: 400 },
      );
    }

    const deleted = await deleteSponsorTier(id);
    if (!deleted) {
      return Response.json(
        { ok: false, message: "No dashboard edits found for that tier." },
        { status: 404 },
      );
    }

    revalidatePath("/", "layout");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/sponsors DELETE]", error);
    return serverError();
  }
}