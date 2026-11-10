"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { Icon, type IconName } from "@/components/ui/Icon";
import { UploadField } from "@/components/admin/UploadField";
import { useToast } from "@/components/admin/ToastProvider";

/**
 * Industry editor.
 *
 * The industries shipped in data/industries.ts are the base; saves go through
 * /api/admin/industries, which merges them over the source and revalidates the
 * public page — a name, description, image or sectors change reaches
 * /industries on the next visit instead of waiting for a deploy.
 */

export interface ManagedIndustry {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  image: string;
  sectors: string[];
  featured: boolean;
  source: "static" | "dashboard";
}

type Message = { type: "success" | "error"; text: string };

function emptyIndustry(): ManagedIndustry {
  return {
    id: `ind-${Date.now().toString(36)}`,
    slug: "",
    name: "",
    shortName: "",
    description: "",
    icon: "factory",
    image: "",
    sectors: [],
    featured: false,
    source: "dashboard",
  };
}

const ICON_OPTIONS = [
  "factory",
  "machine",
  "robot",
  "chip",
  "bolt",
  "gauge",
  "crane",
  "pressure",
  "gear",
  "service",
] as const;

export function IndustriesManager({ readOnly = false }: { readOnly?: boolean }) {
  const { toast, confirm } = useToast();
  const [items, setItems] = useState<ManagedIndustry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<ManagedIndustry | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const fetchIndustries = useCallback(async (): Promise<ManagedIndustry[]> => {
    const res = await fetch("/api/admin/industries", {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      throw new Error(data?.message ?? "Could not load industries.");
    }
    return (data.industries ?? []) as ManagedIndustry[];
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchIndustries()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage({
            type: "error",
            text:
              error instanceof Error ? error.message : "Could not load industries.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchIndustries]);

  const load = useCallback(async () => {
    try {
      setItems(await fetchIndustries());
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not load industries.",
      });
    }
  }, [fetchIndustries]);

  const sectorsInputRef = useRef<HTMLTextAreaElement>(null);

  function parseSectors(value: string): string[] {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function openCreate() {
    setEditing(emptyIndustry());
  }

  function openEdit(item: ManagedIndustry) {
    setEditing({ ...item });
  }

  function closeEdit() {
    setEditing(null);
  }

  async function save(item: ManagedIndustry, e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage(null);

    const payload = {
      id: item.id,
      slug: item.slug.trim(),
      name: item.name.trim(),
      shortName: item.shortName.trim() || item.name.trim(),
      description: item.description.trim(),
      icon: item.icon || "factory",
      image: item.image.trim(),
      sectors: item.sectors,
      featured: item.featured,
    };

    try {
      const res = await fetch("/api/admin/industries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? "Could not save industry.");
      }
      closeEdit();
      await load();
      toast("success", "Industry saved", `"${item.name}" has been updated.`);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not save industry.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: ManagedIndustry) {
    if (
      !confirm({
        title: "Delete industry",
        message: `Delete "${item.name}"? This removes it from the /industries directory and sector pages.`,
        confirmLabel: "Delete",
        variant: "danger",
      })
    )
      return;
    setBusy(item.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/industries?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? "Could not delete industry.");
      }
      await load();
      toast("success", "Industry deleted", `"${item.name}" has been removed.`);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not delete industry.",
      });
    } finally {
      setBusy(null);
    }
  }

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow mb-2 flex items-center gap-2">
            <Icon name="factory" size={14} strokeWidth={1.8} />
            Admin section
          </span>
          <h1 className="display text-3xl text-navy-900 sm:text-4xl">
            Industries
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-steel-600">
            Edit industry sectors, descriptions and images. Changes reach
            /industries on the next visit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={openCreate}
              disabled={saving}
            >
              <Icon name="plus" size={14} strokeWidth={2} />
              Add Industry
            </Button>
          )}
          <Link
            href="/industries"
            className="btn btn-outline btn-sm"
          >
            View on Website
          </Link>
        </div>
      </div>

      {message ? (
        <div
          className={`rounded-xl border p-4 ${
            message.type === "error"
              ? "border-signal-100 bg-signal-50 text-signal-700"
              : "border-success-500/35 bg-success-50 text-success-500"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="card overflow-hidden border border-steel-200">
        {items.length === 0 ? (
          <div className="px-6 py-12 text-center text-steel-500">
            <Icon name="factory" size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No industries yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-steel-100">
            {items.map((industry) => (
              <li key={industry.id} className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 sm:flex-1">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                      industry.featured ? "border-gold-500 bg-gold-500/10 text-gold-600" : "border-steel-200 bg-steel-50 text-steel-600"
                    }`}
                  >
                    <Icon
                      name={industry.icon as IconName}
                      size={17}
                      strokeWidth={1.5}
                    />
                  </span>
                  <div>
                    <h3 className="font-semibold text-navy-900">{industry.name}</h3>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-steel-500">
                      {industry.slug}{" "}
                      <span className="ml-1 inline-flex items-center gap-1 rounded bg-[color:var(--color-steel-100)] px-1.5 py-0 text-[9px]">
                        {industry.source === "dashboard" ? "Dashboard" : "Static"}
                      </span>
                      {industry.featured ? (
                        <span className="ml-2 inline-flex items-center gap-1 rounded bg-gold-500/10 px-1.5 py-0 text-[9px] text-gold-600">
                          Featured
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:ml-auto sm:flex-shrink-0">
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(industry)}
                      disabled={busy === industry.id || saving}
                      className="shrink-0"
                    >
                      <Icon name="pen" size={13} strokeWidth={2} />
                      Edit
                    </Button>
                  )}
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(industry)}
                      disabled={busy === industry.id || saving}
                      className="text-signal-600 hover:border-signal-300 hover:text-signal-600 shrink-0"
                    >
                      <Icon name="close" size={13} strokeWidth={2} />
                      Delete
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <div className="card border border-steel-200 p-6 sm:p-8 max-w-2xl">
          <h2 className="display-sm text-lg text-navy-900 mb-5">
            {editing.source === "dashboard" ? "Add Industry" : "Edit Industry"}
          </h2>
          <form onSubmit={(e) => save(editing, e)} className="space-y-4">
            <Field
              label="Slug"
              hint="URL-friendly identifier, e.g. machine-tools-cnc"
              required
            >
              <Input
                value={editing.slug}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  })}
                disabled={editing.source === "static" || saving}
                placeholder="machine-tools-cnc"
              />
            </Field>

            <Field label="Name" required>
              <Input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })}
                disabled={saving}
              />
            </Field>

            <Field label="Short name (displayed on cards)">
              <Input
                value={editing.shortName}
                onChange={(e) =>
                  setEditing({ ...editing, shortName: e.target.value })}
                disabled={saving}
              />
            </Field>

            <Field label="Description">
              <Textarea
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })}
                rows={3}
                disabled={saving}
                ref={sectorsInputRef}
              />
            </Field>

            <Field label="Icon name">
              <Select
                value={editing.icon}
                onChange={(e) =>
                  setEditing({ ...editing, icon: e.target.value })}
                disabled={saving}
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-[10px] text-steel-500">
                Icon rendered on industry cards. Use one of the available icon
                names.
              </p>
            </Field>

            <Field label="Sectors (comma-separated)">
              <Textarea
                value={editing.sectors.join(", ")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    sectors: parseSectors(e.target.value),
                  })}
                rows={3}
                disabled={saving}
              />
              <p className="mt-1 text-[10px] text-steel-500">
                Product groups shown under this industry, separated by commas.
              </p>
            </Field>

            <Field label="Featured">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(e) =>
                    setEditing({ ...editing, featured: e.target.checked })}
                  disabled={saving}
                  className="rounded border-steel-300 text-gold-600 focus:ring-gold-500"
                />
                <span>Featured on industry directory</span>
              </label>
            </Field>

            <UploadField
              label="Industry image"
              value={editing.image}
              onChange={(url) =>
                setEditing({ ...editing, image: url })}
              folder="industries"
              guidelines={{
                recommendedDimensions: "640 × 420 px",
                acceptedTypes: "JPG, PNG, WebP, AVIF, GIF, SVG",
                maxSizeMB: 10,
              }}
              hint="Uploaded to Cloudflare R2 and served from your own domain."
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-steel-100">
              <Button
                type="button"
                variant="outline"
                onClick={closeEdit}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving || !editing.name || !editing.slug}
              >
                {saving ? "Saving…" : "Save Industry"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
