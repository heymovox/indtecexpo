import { getAdminMetrics } from "@/lib/db";
import { requireAdmin, serverError } from "@/app/api/admin/_lib/auth";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const metrics = await getAdminMetrics();
    return Response.json({ ok: true, metrics });
  } catch (error) {
    console.error("[api/admin/metrics]", error);
    return serverError();
  }
}
