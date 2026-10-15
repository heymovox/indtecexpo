"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Input, Select } from "@/components/ui/Form";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/admin/ToastProvider";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: "staff" | "admin" | "superadmin";
  disabledAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { confirm } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: "staff",
    password: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;
    params.then(({ id }) => {
      fetch(`/api/admin/admins?id=${id}`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled && data.ok && data.admin) {
            const u = data.admin;
            setUser(u);
            setForm({ name: u.name ?? "", role: u.role, password: "", confirmPassword: "" });
          }
        });
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !user) return;
    if (form.password && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password && form.password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const body: Record<string, string> = {
        name: form.name.trim() || "",
        role: form.role,
      };
      if (form.password) body.password = form.password;

      const response = await fetch(`/api/admin/admins?id=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setError(data?.message ?? "Could not save changes. Please try again.");
        setSaving(false);
        return;
      }
      setSuccess("Changes saved.");
      setTimeout(() => router.push("/admin/users"), 1200);
    } catch {
      setError("Could not reach the server. Please try again.");
    }
    setSaving(false);
  }

  async function handleDisable() {
    if (!user) return;
    const ok = await confirm({
      title: user.disabledAt ? "Re-enable user" : "Disable user",
      message: user.disabledAt
        ? "Re-enable this user? They will be able to sign in again."
        : "Disable this user? They will no longer be able to sign in.",
      confirmLabel: user.disabledAt ? "Re-enable" : "Disable",
      variant: user.disabledAt ? "primary" : "danger",
    });
    if (!ok) return;
    setError("");
    try {
      const response = await fetch(`/api/admin/admins?id=${user.id}`, {
        method: "PUT",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setError(data?.message ?? "Could not update user status. Please try again.");
        return;
      }
      router.push("/admin/users");
    } catch {
      setError("Could not reach the server. Please try again.");
    }
  }

  async function handleDelete() {
    if (!user) return;
    const ok = await confirm({
      title: "Delete user",
      message: "Permanently delete this user? This cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/admins?id=${user.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hard: true }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setError(data?.message ?? "Could not delete user. Please try again.");
        setDeleting(false);
        return;
      }
      router.push("/admin/users");
    } catch {
      setError("Could not reach the server. Please try again.");
    }
    setDeleting(false);
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card p-12 text-center text-steel-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/users" className="btn btn-outline btn-sm">
          <Icon name="arrow-left" size={15} />
          Back to Users
        </Link>
      </div>
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="display-sm text-lg text-navy-900">Edit User</h1>
            <p className="text-xs text-steel-500">{user.email}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${
              user.disabledAt
                ? "border-signal-200 bg-signal-50 text-signal-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {user.disabledAt ? "Disabled" : "Active"}
          </span>
        </div>

        {error ? <FormAlert type="error">{error}</FormAlert> : null}
        {success ? <FormAlert type="success">{success}</FormAlert> : null}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6" noValidate>
          <Field label="Display Name" htmlFor="name">
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              maxLength={80}
            />
          </Field>

          <Field label="Role" htmlFor="role" required>
            <Select
              id="role"
              value={form.role}
              onChange={(e) => update("role", e.target.value as "staff" | "admin" | "superadmin")}
              required
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </Select>
          </Field>

          <Field label="New Password" htmlFor="password" hint="Leave blank to keep current">
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              autoComplete="new-password"
              minLength={12}
            />
          </Field>

          <Field label="Confirm New Password" htmlFor="confirmPassword">
            <Input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              autoComplete="new-password"
            />
          </Field>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>

        <div className="border-t border-steel-200 pt-6 space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleDisable}
            className={user.disabledAt ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50" : "text-signal-700 border-signal-300 hover:bg-signal-50"}
          >
            {user.disabledAt ? "Enable User" : "Disable User"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            className="text-signal-700 border-signal-300 hover:bg-signal-50"
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete Permanently"}
          </Button>
        </div>
      </div>
    </div>
  );
}