import { getAdmin, serverError, unauthorized } from "@/app/api/admin/_lib/auth";

/** Reports the signed-in admin so the dashboard can gate UI by role. */
export async function GET() {
  try {
    const admin = await getAdmin();
    if (!admin) return unauthorized();
    return Response.json({
      ok: true,
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("[api/admin/me]", error);
    return serverError();
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
