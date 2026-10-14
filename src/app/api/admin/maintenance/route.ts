import type { NextRequest } from "next/server";
import { z } from "zod";
import { getMaintenanceSettings, saveMaintenanceSettings } from "@/lib/db";
import { MAINTENANCE_CACHE_TTL_MS } from "@/types/maintenance";
import { requireRole, serverError } from "@/app/api/admin/_lib/auth";

/**
 * Site-wide maintenance mode.
 *
 * Superadmin-only even though the Settings section itself is open to staff: this
 * switch takes the entire public site down, which is not a settings-page level
 * decision.
 *
 * Writes are not instantly visible everywhere. The edge middleware memoises the
 * flag for MAINTENANCE_CACHE_TTL_MS, so the change lands across the edge within
 * that window; the response says so and the dashboard shows a countdown to it.
 */

const settingsSchema = z.object({
  enabled: z.boolean(),
  headline: z.string().trim().max(160),
  message: z.string().trim().max(1000),
  resumeAt: z.union([z.string().trim().max(64), z.null()]).optional(),
});

export async function GET() {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const settings = await getMaintenanceSettings();
    return Response.json({ ok: true, settings, ttlMs: MAINTENANCE_CACHE_TTL_MS });
  } catch (error) {
    console.error("[api/admin/maintenance GET]", error);
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const raw: unknown = await request.json().catch(() => null);
    const result = settingsSchema.safeParse(raw);
    if (!result.success) {
      return Response.json(
        { ok: false, message: "Invalid maintenance settings." },
        { status: 400 },
      );
    }

    const { resumeAt, ...rest } = result.data;
    const settings = await saveMaintenanceSettings({
      ...rest,
      resumeAt: resumeAt ?? "",
    });

    return Response.json({
      ok: true,
      settings,
      ttlMs: MAINTENANCE_CACHE_TTL_MS,
    });
  } catch (error) {
    console.error("[api/admin/maintenance PUT]", error);
    return serverError();
  }
}