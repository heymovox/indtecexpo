"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Input, Select } from "@/components/ui/Form";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    name: "",
    role: "staff",
    password: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          name: form.name.trim() || null,
          role: form.role,
          password: form.password,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setError(data?.message ?? "Could not create user. Please try again.");
        setSaving(false);
        return;
      }
      setSuccess("User created successfully.");
      setTimeout(() => router.push("/admin/users"), 1200);
    } catch {
      setError("Could not reach the server. Please try again.");
    }
    setSaving(false);
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
        <h1 className="display-sm text-lg text-navy-900 mb-6">Add New User</h1>

        {error ? (
          <FormAlert type="error">{error}</FormAlert>
        ) : success ? (
          <FormAlert type="success">{success}</FormAlert>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
              autoComplete="email"
            />
          </Field>

          <Field label="Display Name" htmlFor="name">
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              maxLength={80}
              autoComplete="name"
            />
          </Field>

          <Field label="Role" htmlFor="role" required>
            <Select
              id="role"
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              required
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </Select>
          </Field>

          <Field label="Password" htmlFor="password" required hint="Minimum 12 characters">
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              autoComplete="new-password"
              minLength={12}
            />
          </Field>

          <Field label="Confirm Password" htmlFor="confirmPassword" required>
            <Input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              required
              autoComplete="new-password"
            />
          </Field>

          <div className="flex justify-end gap-3 pt-4">
            <Link href="/admin/users" className="btn btn-outline">
              Cancel
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}