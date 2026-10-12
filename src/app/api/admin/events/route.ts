import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  deleteRecord,
  listEventOverrides,
  upsertEventOverride,
} from "@/lib/db";
import { requireAdmin, serverError } from "@/app/api/admin/_lib/auth";

const eventOverrideSchema = z.object({
  id: z.string().min(1).optional(),
  slug: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(160),
  dateLabel: z.string().trim().max(120),
  dateRangeShort: z.string().trim().max(60),
  positioning: z.string().trim().max(120),
  venueName: z.string().trim().max(160),
  venueAddress: z.string().trim().max(200).optional().default(""),
  summary: z.string().trim().max(600),
  city: z.string().trim().max(80).optional().default(""),
  state: z.string().trim().max(80).optional().default(""),
  edition: z.string().trim().max(40).optional().default(""),
  monthLabel: z.string().trim().max(40).optional().default(""),
  status: z.enum(["upcoming", "live", "completed"]).optional().default("upcoming"),
  startDate: z.string().trim().max(40).optional().default(""),
  endDate: z.string().trim().max(40).optional().default(""),
  days: z.coerce.number().int().min(1).max(60).optional().default(3),
  bannerImage: z.string().trim().max(500).optional().default(""),
  posterImage: z.string().trim().max(500).optional().default(""),
  floorPlanImage: z.string().trim().max(500).optional().default(""),
  floorPlanPdf: z.string().trim().max(500).optional().default(""),
  sectors: z.array(z.string().trim().max(80)).max(30).optional().default([]),
  highlights: z.array(z.string().trim().max(200)).max(40).optional().default([]),
  description: z.array(z.string().trim().max(1200)).max(20).optional().default([]),
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

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return Response.json(
        { ok: false, message: "Event id is required." },
        { status: 400 },
      );
    }
    const deleted = await deleteRecord("events", id);
    if (!deleted) {
      return Response.json(
        { ok: false, message: "Event not found." },
        { status: 404 },
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/events DELETE]", error);
    return serverError();
  }
}
