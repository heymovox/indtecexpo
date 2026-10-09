import { notificationLog } from "@/lib/email";
import { requireAdmin, serverError } from "@/app/api/admin/_lib/auth";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    return Response.json({ ok: true, notifications: notificationLog() });
  } catch (error) {
    console.error("[api/admin/notifications]", error);
    return serverError();
  }
}
