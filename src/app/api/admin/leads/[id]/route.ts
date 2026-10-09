import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  getRecordById,
  updateRecord,
  type StoredRecord,
} from "@/lib/db";
import { leadStageSchema } from "@/lib/validations";
import { requireAdmin, serverError } from "@/app/api/admin/_lib/auth";
import { findLeadById, leadCollections, shapeLead } from "@/app/api/admin/_lib/leads";
import type { LeadKind } from "@/app/admin/lead-types";

const patchSchema = z.object({
  stage: leadStageSchema,
  notes: z.string().max(2000).optional(),
  type: z.enum(["exhibitor", "visitor", "contact"]),
});

const kinds: readonly string[] = ["exhibitor", "visitor", "contact"];

function leadKind(value: string | null): LeadKind | undefined {
  return value && kinds.includes(value) ? (value as LeadKind) : undefined;
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const kind = leadKind(request.nextUrl.searchParams.get("type"));
    const lead = await findLeadById(id, kind);
    if (!lead) {
      return Response.json(
        { ok: false, message: "Lead not found." },
        { status: 404 },
      );
    }
    return Response.json({ ok: true, lead });
  } catch (error) {
    console.error("[api/admin/leads/:id GET]", error);
    return serverError();
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const raw: unknown = await request.json().catch(() => null);
    const result = patchSchema.safeParse(raw);
    if (!result.success) {
      return Response.json(
        { ok: false, message: "Invalid update payload." },
        { status: 400 },
      );
    }

    const { stage, notes, type } = result.data;
    const collection = leadCollections[type];
    const current = await getRecordById<StoredRecord>(collection, id);
    if (!current) {
      return Response.json(
        { ok: false, message: "Lead not found." },
        { status: 404 },
      );
    }

    const patch: Partial<StoredRecord> = { stage };
    if (notes !== undefined) patch.notes = notes;

    const updated = await updateRecord<StoredRecord>(collection, id, patch);
    if (!updated) {
      return Response.json(
        { ok: false, message: "Lead not found." },
        { status: 404 },
      );
    }

    return Response.json({ ok: true, lead: shapeLead(type, updated) });
  } catch (error) {
    console.error("[api/admin/leads/:id PATCH]", error);
    return serverError();
  }
}
