"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { UploadField } from "@/components/admin/UploadField";
import { useToast } from "@/components/admin/ToastProvider";

/**
 * Sponsor tier editor.
 *
 * The tiers shipped in data/sponsors.ts are the base; saves go through
 * /api/admin/sponsors, which merges them over the source and revalidates the
 * public page — a tier, logo or listing change reaches /sponsors on the next
 * visit instead of waiting for a deploy.
 */

export interface SponsorLogo {
  id: string;
  name: string;
  logo: string;
}

/** One tier as the API returns it: source data with dashboard edits applied. */
export interface SponsorTier {
  id: string;
  title: string;
  description: string;
  logos: SponsorLogo[];
  order: number;
  published: boolean;
  /** "static" = shipped in data/sponsors.ts, "dashboard" = created in admin. */
  source: "static" | "dashboard";
}

type Message = { type: "success" | "error"; text: string };

function emptyTier(): SponsorTier {
  return {
    id: `tier-${Date.now().toString(36)}`,
    title: "",
    description: "",
    logos: [],
    order: 0,
    published: true,
    source: "dashboard",
  };
}

function emptyLogo(): SponsorLogo {
  return { id: `logo-${Date.now().toString(36)}`, name: "", logo: "" };
}

export function SponsorsManager({ readOnly = false }: { readOnly?: boolean }) {
  const { confirm } = useToast();
  const [tiers, setTiers] = useState<SponsorTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editingTier, setEditingTier] = useState<SponsorTier | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  /** Fetches the merged list without touching state, so an effect may call it. */
  const fetchTiers = useCallback(async (): Promise<SponsorTier[]> => {
    const res = await fetch("/api/admin/sponsors", {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      throw new Error(data?.message ?? "Could not load sponsor tiers.");
    }
    return (data.tiers ?? []) as SponsorTier[];
  }, []);

  // Initial load: state is only touched from the promise callbacks, never
  // synchronously in the effect body (matches the other dashboard managers).
  useEffect(() => {
    let cancelled = false;
    fetchTiers()
      .then((tiers) => {
        if (!cancelled) setTiers(tiers);
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage({
            type: "error",
            text:
              error instanceof Error
                ? error.message
                : "Could not load sponsor tiers.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchTiers]);

  /** Refresh after a mutation, from event handlers. */
  const load = useCallback(async () => {
    try {
      setTiers(await fetchTiers());
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Could not load sponsor tiers.",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchTiers]);

  /** Persists one tier and refreshes from the merged view (normalised URLs, order). */
  async function save(tier: SponsorTier, successText: string): Promise<boolean> {
    setBusy(tier.id);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/sponsors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tier),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? "Could not save the tier.");
      }
      await load();
      setMessage({ type: "success", text: successText });
      return true;
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not save the tier.",
      });
      return false;
    } finally {
      setBusy(null);
    }
  }

  function openCreateTier() {
    setMessage(null);
    setEditingTier(emptyTier());
  }

  function openEditTier(tier: SponsorTier) {
    setMessage(null);
    setEditingTier({ ...tier, logos: tier.logos.map((logo) => ({ ...logo })) });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTier || saving) return;
    const title = editingTier.title.trim();
    if (!title) {
      setMessage({ type: "error", text: "Give the tier a title first." });
      return;
    }
    setSaving(true);
    const tier = { ...editingTier, title };
    const ok = await save(
      tier,
      `“${title}” saved — it is live on /sponsors now.`,
    );
    setSaving(false);
    if (ok) setEditingTier(null);
  }

  async function togglePublish(tier: SponsorTier) {
    await save(
      { ...tier, published: !tier.published },
      tier.published
        ? `“${tier.title}” hidden from /sponsors.`
        : `“${tier.title}” shown on /sponsors again.`,
    );
  }

  async function handleDeleteTier(tier: SponsorTier) {
    const isShipped = tier.source === "static";
    const ok = await confirm(
      isShipped
        ? {
            title: "Revert tier",
            message: `Discard the dashboard edits on “${tier.title}” and restore the version shipped with the site?`,
            confirmLabel: "Revert",
            variant: "danger",
          }
        : {
            title: "Delete tier",
            message: `Delete “${tier.title}” from /sponsors? This cannot be undone.`,
            confirmLabel: "Delete",
            variant: "danger",
          },
    );
    if (!ok) return;

    setBusy(tier.id);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/sponsors?id=${encodeURIComponent(tier.id)}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => null);
      if (res.status === 404) {
        setMessage({
          type: "success",
          text: "No dashboard edits on that tier — the source version is already showing.",
        });
        return;
      }
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? "Could not update the tier.");
      }
      await load();
      setMessage({
        type: "success",
        text: isShipped
          ? `“${tier.title}” reverted to the source version.`
          : `“${tier.title}” deleted from /sponsors.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not update the tier.",
      });
    } finally {
      setBusy(null);
    }
  }

  function updateLogo(
    tierId: string,
    logoId: string,
    key: keyof SponsorLogo,
    value: string,
  ) {
    setTiers((current) =>
      current.map((tier) =>
        tier.id === tierId
          ? {
              ...tier,
              logos: tier.logos.map((logo) =>
                logo.id === logoId ? { ...logo, [key]: value } : logo,
              ),
            }
          : tier,
      ),
    );
  }

  function addLogo(tierId: string) {
    setTiers((current) =>
      current.map((tier) =>
        tier.id === tierId
          ? { ...tier, logos: [...tier.logos, { ...emptyLogo() }] }
          : tier,
      ),
    );
  }

  function removeLogo(tierId: string, logoId: string) {
    setTiers((current) =>
      current.map((tier) =>
        tier.id === tierId
          ? { ...tier, logos: tier.logos.filter((logo) => logo.id !== logoId) }
          : tier,
      ),
    );
  }

  if (loading) {
    return (
      <div className="card flex items-center gap-2 p-6 text-sm text-steel-600">
        <Icon name="refresh" size={16} className="animate-spin" />
        Loading sponsor tiers…
      </div>
    );
  }

  function renderEmptyState() {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-steel-300 bg-white/70 px-4 py-10 text-center shadow-sm ring-1 ring-black/5">
        <Icon name="award" size={20} className="text-steel-400" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-medium text-navy-900">No sponsor tiers yet</p>
        {!readOnly && (
          <>
            <p className="mt-1 max-w-sm text-xs text-steel-600">
              Press &ldquo;Add Tier&rdquo; to create a sponsorship level.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openCreateTier}
              className="mt-4"
            >
              <span className="flex items-center gap-2">
                <Icon name="plus" size={14} />
                Add Tier
              </span>
            </Button>
          </>
        )}
      </div>
    );
  }

  function renderTier(tier: SponsorTier) {
    const isBusy = busy === tier.id;
    return (
      <li key={tier.id} className="card p-4 border-steel-200 hover:border-brand-300 transition-colors">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="inline-flex items-center rounded-full border border-steel-200 bg-steel-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-steel-600">
                {tier.id}
              </span>
              <h3 className="display-sm font-semibold text-navy-900">{tier.title}</h3>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                  tier.published
                    ? "bg-emerald-600 text-white"
                    : "bg-steel-100 text-steel-600"
                }`}
              >
                {tier.published ? "Live" : "Hidden"}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                  tier.source === "static"
                    ? "bg-steel-100 text-steel-500"
                    : "bg-brand-50 text-brand-700"
                }`}
              >
                {tier.source === "static" ? "Source file" : "Dashboard"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-steel-500">{tier.description}</p>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openEditTier(tier)}
                disabled={isBusy}
              >
                <Icon name="gear" size={13} /> Edit
              </Button>
              <button
                type="button"
                onClick={() => void handleDeleteTier(tier)}
                disabled={isBusy}
                className="border border-steel-200 p-1.5 text-steel-500 transition hover:border-signal-300 hover:text-signal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300 disabled:opacity-40"
                aria-label={
                  tier.source === "static"
                    ? `Revert ${tier.title}`
                    : `Delete ${tier.title}`
                }
              >
                <Icon name="close" size={13} />
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tier.logos.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-steel-300 bg-steel-50 px-4 py-8 text-center">
              <Icon name="image" size={20} className="text-steel-400" strokeWidth={1.5} />
              <p className="mt-2 text-xs text-steel-500">No logos in this tier</p>
              {!readOnly && (
                <Button type="button" variant="outline" size="sm" onClick={() => addLogo(tier.id)} className="mt-2">
                  <Icon name="plus" size={13} /> Add Logo
                </Button>
              )}
            </div>
          ) : (
            tier.logos.map((logo) => (
              <div key={logo.id} className="flex flex-col overflow-hidden rounded-xl border border-steel-200 bg-white">
                <div className="relative flex aspect-[4/3] items-center justify-center border-b border-steel-200 bg-steel-50">
                  {logo.logo ? (
                    <img src={logo.logo} alt="" className="h-full w-full object-contain p-3" />
                  ) : (
                    <Icon name="image" size={22} className="text-steel-300" strokeWidth={1.5} />
                  )}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeLogo(tier.id, logo.id)}
                      className="absolute right-1.5 top-1.5 rounded border border-steel-200 bg-white/90 p-1 text-steel-500 transition hover:border-signal-300 hover:text-signal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300"
                      aria-label={`Remove ${logo.name || "logo"}`}
                    >
                      <Icon name="close" size={12} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2 p-2.5">
                  <label className="sr-only" htmlFor={`logo-name-${tier.id}-${logo.id}`}>
                    Partner name
                  </label>
                  <input
                    type="text"
                    id={`logo-name-${tier.id}-${logo.id}`}
                    value={logo.name}
                    onChange={(e) => updateLogo(tier.id, logo.id, "name", e.target.value)}
                    placeholder="Partner name"
                    disabled={readOnly}
                    className="w-full rounded-sm border border-steel-300 bg-white px-2 py-1.5 text-sm text-navy-900 outline-none transition focus:border-brand-400 disabled:bg-steel-50 disabled:text-steel-600"
                  />
                  {!readOnly && (
                    <UploadField
                      compact
                      label={`${logo.name || "Partner"} logo`}
                      value={logo.logo}
                      onChange={(url) => updateLogo(tier.id, logo.id, "logo", url)}
                      folder="logos"
                      htmlFor={`logo-logo-${tier.id}-${logo.id}`}
                    />
                  )}
                </div>
              </div>
            ))
          )}

          {!readOnly && (
            <button
              type="button"
              onClick={() => addLogo(tier.id)}
              className="flex min-h-[7rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-steel-300 bg-steel-50 px-3 py-4 text-xs font-medium text-steel-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-navy-900"
            >
              <Icon name="plus" size={16} />
              Add Logo
            </button>
          )}
        </div>

        {!readOnly && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-steel-100 pt-3">
            <span className="text-[11px] text-steel-500">
              {tier.published
                ? "Shown on the public /sponsors page."
                : "Hidden from the public /sponsors page."}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() => void save(tier, `${tier.title} saved — live on /sponsors now.`)}
              >
                <Icon name="refresh" size={13} /> Save changes
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() => void togglePublish(tier)}
              >
                {tier.published ? "Hide from site" : "Show on site"}
              </Button>
            </div>
          </div>
        )}
      </li>
    );
  }

  return (
    <section aria-label="Sponsors" className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-steel-200 bg-white/95 p-3 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <span className="eyebrow mb-1.5">Sponsors</span>
          <h2 className="display-sm text-lg text-navy-900 sm:text-xl">Sponsor Tiers</h2>
          <p className="mt-1 text-xs text-steel-600 sm:text-sm">
            Manage sponsorship tiers and partner logos — saves go live on the
            public site immediately.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/sponsors"
            target="_blank"
            className="inline-flex items-center gap-1.5 border border-steel-200 px-3 py-2 text-xs font-medium text-steel-700 transition hover:border-brand-400 hover:text-navy-900"
          >
            <Icon name="external" size={13} />
            View public page
          </Link>
          {!readOnly && (
            <Button type="button" onClick={openCreateTier} size="sm">
              <span className="flex items-center gap-2">
                <Icon name="plus" size={16} strokeWidth={2} />
                Add Tier
              </span>
            </Button>
          )}
        </div>
      </div>

      {message ? (
        <p role="status" className={`text-xs font-semibold ${message.type === "error" ? "text-signal-600" : "text-emerald-700"}`}>
          {message.text}
        </p>
      ) : null}

      <div className="space-y-4">
        {tiers.length === 0 ? renderEmptyState() : tiers.map((tier) => renderTier(tier))}
      </div>

      {editingTier ? (
        <TierFormModal
          tier={editingTier}
          saving={saving}
          message={message}
          onChange={(next) => setEditingTier(next)}
          onClose={() => setEditingTier(null)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </section>
  );
}

function TierFormModal({
  tier,
  saving,
  message,
  onChange,
  onClose,
  onSubmit,
}: {
  tier: SponsorTier;
  saving: boolean;
  message: Message | null;
  onChange: (next: SponsorTier) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function set<K extends keyof SponsorTier>(key: K, value: SponsorTier[K]) {
    onChange({ ...tier, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Sponsor tier details">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy-950/55" />
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-steel-200 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="font-mono text-xs text-steel-500">{tier.id}</p>
            <h3 className="display-sm mt-1 truncate text-lg text-navy-900">
              {tier.source === "static" ? "Edit tier" : "Add tier"}
            </h3>
            <p className="mt-0.5 text-xs text-steel-600">Tier title, description and display order.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 border border-steel-200 p-2 text-steel-500 transition hover:text-navy-900">
            <Icon name="close" size={16} />
          </button>
        </header>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {message ? <div className={`text-xs font-semibold ${message.type === "error" ? "text-signal-600" : "text-emerald-700"}`}>{message.text}</div> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tier title" htmlFor="tier-title" required>
                <Input id="tier-title" value={tier.title} onChange={(e) => set("title", e.target.value)} required maxLength={80} />
              </Field>
              <Field label="Display order" htmlFor="tier-order">
                <Input id="tier-order" type="number" min={0} value={String(tier.order)} onChange={(e) => set("order", Number(e.target.value) || 0)} />
              </Field>
            </div>
            <Field label="Description" htmlFor="tier-description">
              <Textarea id="tier-description" rows={3} value={tier.description} onChange={(e) => set("description", e.target.value)} placeholder="What this tier represents…" />
            </Field>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-steel-700">
              <input
                type="checkbox"
                checked={tier.published}
                onChange={(e) => set("published", e.target.checked)}
                className="h-4 w-4 accent-[#0f5fbf]"
              />
              Show this tier on the public /sponsors page
            </label>
          </div>
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-steel-200 bg-steel-25 px-4 py-3 sm:px-5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </footer>
        </form>
      </div>
    </div>
  );
}