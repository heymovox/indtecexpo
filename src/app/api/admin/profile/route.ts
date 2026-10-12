import type { NextRequest } from "next/server";
import { z } from "zod";
import { setAdminProfile, findAdminById } from "@/lib/admin-db";
import { getAdmin, serverError } from "@/app/api/admin/_lib/auth";
import { flattenErrors } from "@/lib/validations";

export const runtime = "nodejs";

const profileSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().max(80).nullable().optional(),
});

export async function POST(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = profileSchema.safeParse(await request.json().catch(() => null));
    if (!result.success) {
      return Response.json(
        {
          ok: false,
          message: "Invalid input.",
          errors: flattenErrors(result.error),
        },
        { status: 400 },
      );
    }

    const { id, name } = result.data;

    // Users can only update their own profile unless they're superadmin
    if (admin.id !== id && admin.role !== "superadmin") {
      return Response.json({ ok: false, message: "Forbidden." }, { status: 403 });
    }

    const target = await findAdminById(id);
    if (!target) {
      return Response.json({ ok: false, message: "User not found." }, { status: 404 });
    }

    const updated = await setAdminProfile(id, name ?? null, target.role, new Date().toISOString());
    if (!updated) {
      return Response.json({ ok: false, message: "User not found." }, { status: 404 });
    }

    return Response.json({
      ok: true,
      admin: { id: updated.id, email: updated.email, name: updated.name, role: updated.role },
    });
  } catch (error) {
    console.error("[api/admin/profile]", error);
    return serverError();
  }
}