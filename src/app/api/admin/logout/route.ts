import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { requireAdmin, serverError } from "@/app/api/admin/_lib/auth";

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const jar = await cookies();
    jar.delete(ADMIN_SESSION_COOKIE);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/logout]", error);
    return serverError();
  }
}
