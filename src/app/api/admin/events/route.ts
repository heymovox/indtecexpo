import type { NextRequest } from "next/server";
import { z } from "zod";
import { listEventOverrides, upsertEventOverride } from "@/lib/db";
import { requireAdmin, serverError } from "@/app/api/admin/_lib/auth";

const eventOverrideSchema = z.object({
  id: z.string().min(1).optional(),
  slug: z.string().min(1),
  name: z.string().trim().min(1).max(160),
  dateLabel: z.string().trim().max(120),
  dateRangeShort: z.string().trim().max(60),
  positioning: z.string().trim().max(120),
  venueName: z.string().trim().max(160),
  summary: z.string().trim().max(600),
  published: z.boolean(),
});

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const events = await listEventOverrides();
    return Response.json({ ok: true, events });
  } catch (error) {
    console.error("[api/admin/events GET]", error);
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const raw: unknown = await request.json().catch(() => null);
    const result = eventOverrideSchema.safeParse(raw);
    if (!result.success) {
      return Response.json(
        { ok: false, message: "Invalid event data." },
        { status: 400 },
      );
    }

    const event = await upsertEventOverride(result.data);
    return Response.json({ ok: true, event });
  } catch (error) {
    console.error("[api/admin/events PUT]", error);
    return serverError();
  }
}
