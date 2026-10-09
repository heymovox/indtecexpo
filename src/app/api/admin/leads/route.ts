import type { NextRequest } from "next/server";
import { leadStageSchema } from "@/lib/validations";
import { requireAdmin, serverError } from "@/app/api/admin/_lib/auth";
import { getAllLeads } from "@/app/api/admin/_lib/leads";
import type { LeadKind } from "@/app/admin/lead-types";

const kinds: readonly string[] = ["exhibitor", "visitor", "contact"];

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const params = request.nextUrl.searchParams;
    const type = params.get("type");
    const stage = params.get("stage");

    if (type && !kinds.includes(type)) {
      return Response.json(
        { ok: false, message: "Invalid lead type." },
        { status: 400 },
      );
    }
    if (stage && !leadStageSchema.safeParse(stage).success) {
      return Response.json(
        { ok: false, message: "Invalid stage." },
        { status: 400 },
      );
    }

    let leads = await getAllLeads();
    if (type) {
      const wanted = type as LeadKind;
      leads = leads.filter((lead) => lead.type.toLowerCase() === wanted);
    }
    if (stage) {
      leads = leads.filter((lead) => lead.stage === stage);
    }

    return Response.json({ ok: true, leads });
  } catch (error) {
    console.error("[api/admin/leads]", error);
    return serverError();
  }
}
