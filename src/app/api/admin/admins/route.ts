import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";

import {
  createAdmin,
  deleteAdmin,
  disableAdmin,
  enableAdmin,
  findAdminById,
  listAdmins,
  normalizeEmail,
  setAdminPassword,
  setAdminProfile,
} from "@/lib/admin-db";
import { endAllSessions, hashPassword, type AdminRole } from "@/lib/admin-auth";
import { isAdminRole } from "@/lib/db-queries";
import { getAdmin, requireRole, serverError } from "@/app/api/admin/_lib/auth";
import { flattenErrors } from "@/lib/validations";

export const runtime = "nodejs";

const newAdminSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().max(80).optional(),
  role: z.enum(["staff", "admin", "superadmin"]).default("staff"),
  password: z
    .string()
    .min(12, "Use at least 12 characters.")
    .max(200),
});

const updateAdminSchema = z.object({
  name: z.string().trim().max(80).nullable().optional(),
  role: z.enum(["staff", "admin", "superadmin"]).optional(),
  password: z.string().min(12).max(200).optional(),
});

/** Lists admins or fetches a single admin by id. */
export async function GET(request: NextRequest) {
  const denied = await requireRole("admin");
  if (denied) return denied;

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const admin = await findAdminById(id);
      if (!admin) {
        return Response.json({ ok: false, message: "Admin not found." }, { status: 404 });
      }
      return Response.json({
        ok: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          createdAt: admin.createdAt,
          lastLoginAt: admin.lastLoginAt,
          disabledAt: admin.disabledAt,
        },
      });
    }

    const admins = await listAdmins();
    return Response.json({
      ok: true,
      admins: admins.map((a) => ({
        id: a.id,
        email: a.email,
        name: a.name,
        role: a.role,
        createdAt: a.createdAt,
        lastLoginAt: a.lastLoginAt,
        disabledAt: a.disabledAt,
      })),
    });
  } catch (error) {
    console.error("[api/admin/admins]", error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const result = newAdminSchema.safeParse(await request.json().catch(() => null));
    if (!result.success) {
      return Response.json(
        {
          ok: false,
          message: "Check the details and try again.",
          errors: flattenErrors(result.error),
        },
        { status: 400 },
      );
    }

    const { email, name, role, password } = result.data;
    const created = await createAdmin({
      id: crypto.randomUUID(),
      email,
      name: name ?? null,
      role: role as AdminRole,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    });

    if (!created) {
      return Response.json(
        { ok: false, message: "That email is already registered." },
        { status: 409 },
      );
    }

    return Response.json(
      {
        ok: true,
        admin: { id: created.id, email: created.email, name: created.name, role: created.role },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/admin/admins]", error);
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const actor = await getAdmin();
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return Response.json({ ok: false, message: "Missing id." }, { status: 400 });
    }

    const target = await findAdminById(id);
    if (!target) {
      return Response.json({ ok: false, message: "Admin not found." }, { status: 404 });
    }

    const result = updateAdminSchema.safeParse(await request.json().catch(() => null));
    if (!result.success) {
      return Response.json(
        {
          ok: false,
          message: "Check the details and try again.",
          errors: flattenErrors(result.error),
        },
        { status: 400 },
      );
    }

    const { name, role, password } = result.data;

    // Guard against locking the last superadmin out of their own system.
    const demotingSuperadmin =
      target.role === "superadmin" && role && role !== "superadmin";
    if (demotingSuperadmin && !(await hasAnotherSuperadmin(id))) {
      return Response.json(
        { ok: false, message: "This is the only superadmin — promote someone else first." },
        { status: 409 },
      );
    }

    let updated = target;

    if (name !== undefined) {
      updated =
        (await setAdminProfile(updated.id, name, updated.role, new Date().toISOString())) ?? updated;
    }

    if (role !== undefined && isAdminRole(role) && role !== updated.role) {
      updated =
        (await setAdminProfile(updated.id, updated.name, role, new Date().toISOString())) ?? updated;
    }

    if (password) {
      updated =
        (await setAdminPassword(updated.id, hashPassword(password), new Date().toISOString())) ??
        updated;
      // A password change signs the account out everywhere.
      await endAllSessions(updated.id);
      if (actor && actor.id === updated.id) {
        return Response.json(
          { ok: true, admin: publicAdmin(updated), reauth: true },
        );
      }
    }

    return Response.json({ ok: true, admin: publicAdmin(updated) });
  } catch (error) {
    console.error("[api/admin/admins]", error);
    return serverError();
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const actor = await getAdmin();
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return Response.json({ ok: false, message: "Missing id." }, { status: 400 });
    }
    if (actor && actor.id === id) {
      return Response.json(
        { ok: false, message: "You cannot delete your own account." },
        { status: 409 },
      );
    }

    const target = await findAdminById(id);
    if (!target) {
      return Response.json({ ok: false, message: "Admin not found." }, { status: 404 });
    }
    if (target.role === "superadmin" && !(await hasAnotherSuperadmin(id))) {
      return Response.json(
        { ok: false, message: "This is the only superadmin." },
        { status: 409 },
      );
    }

    await deleteAdmin(id);
    return Response.json({ ok: true, deleted: normalizeEmail(target.email) });
  } catch (error) {
    console.error("[api/admin/admins]", error);
    return serverError();
  }
}

/** PUT toggles the disabled flag, which also revokes live sessions. */
export async function PUT(request: NextRequest) {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const actor = await getAdmin();
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return Response.json({ ok: false, message: "Missing id." }, { status: 400 });
    }
    if (actor && actor.id === id) {
      return Response.json(
        { ok: false, message: "You cannot disable your own account." },
        { status: 409 },
      );
    }

    const target = await findAdminById(id);
    if (!target) {
      return Response.json({ ok: false, message: "Admin not found." }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (target.disabledAt) {
      const reEnabled = await enableAdmin(id, now);
      return Response.json({ ok: true, admin: reEnabled && publicAdmin(reEnabled) });
    }

    if (target.role === "superadmin" && !(await hasAnotherSuperadmin(id))) {
      return Response.json(
        { ok: false, message: "This is the only superadmin." },
        { status: 409 },
      );
    }

    const disabled = await disableAdmin(id, now);
    await endAllSessions(id);
    return Response.json({ ok: true, admin: disabled && publicAdmin(disabled) });
  } catch (error) {
    console.error("[api/admin/admins]", error);
    return serverError();
  }
}

async function hasAnotherSuperadmin(excludingId: string): Promise<boolean> {
  const admins = await listAdmins();
  return admins.some(
    (a) => a.id !== excludingId && a.role === "superadmin" && !a.disabledAt,
  );
}

function publicAdmin(a: {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  createdAt: string;
  lastLoginAt: string | null;
  disabledAt: string | null;
}) {
  return {
    id: a.id,
    email: a.email,
    name: a.name,
    role: a.role,
    createdAt: a.createdAt,
    lastLoginAt: a.lastLoginAt,
    disabledAt: a.disabledAt,
  };
}
