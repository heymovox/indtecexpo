"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { UploadField } from "@/components/admin/UploadField";
import { sponsorTiers as defaultSponsorTiers } from "@/data/sponsors";
import { useToast } from "@/components/admin/ToastProvider";

export interface SponsorLogo {
  id: string;
  name: string;
  logo: string;
}

export interface SponsorTier {
  id: string;
  title: string;
  description: string;
  logos: SponsorLogo[];
  order: number;
}

const defaultTiers: SponsorTier[] = defaultSponsorTiers.map((t, i) => ({
  ...t,
  order: i,
}));

function emptyTier(): SponsorTier {
  return {
    id: "",
    title: "",
    description: "",
    logos: [],
    order: 0,
  };
}

function emptyLogo(): SponsorLogo {
  return { id: "", name: "", logo: "" };
}

export function SponsorsManager({ readOnly = false }: { readOnly?: boolean }) {
  const { confirm } = useToast();
  const [tiers, setTiers] = useState<SponsorTier[]>(() => [...defaultTiers].sort((a, b) => a.order - b.order));
  const [editingTier, setEditingTier] = useState<SponsorTier | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function openCreateTier() {
    const newTier = { ...emptyTier(), id: `tier-${Date.now()}`, order: tiers.length };
    setEditingTier(newTier);
  }

  function openEditTier(tier: SponsorTier) {
    setEditingTier({ ...tier });
  }

  function updateLogo(tierId: string, logoId: string, key: keyof SponsorLogo, value: string) {
    setTiers((current) =>
      current.map((tier) =>
        tier.id === tierId
          ? { ...tier, logos: tier.logos.map((l) => (l.id === logoId ? { ...l, [key]: value } : l)) }
          : tier,
      ),
    );
  }

  function addLogo(tierId: string) {
    setTiers((current) =>
      current.map((tier) =>
        tier.id === tierId
          ? { ...tier, logos: [...tier.logos, { ...emptyLogo(), id: `logo-${Date.now()}` }] }
          : tier,
      ),
    );
  }

  function removeLogo(tierId: string, logoId: string) {
    setTiers((current) =>
      current.map((tier) =>
        tier.id === tierId ? { ...tier, logos: tier.logos.filter((l) => l.id !== logoId) } : tier,
      ),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTier || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      setTiers((current) => {
        const exists = current.some((t) => t.id === editingTier.id);
        if (exists) {
          return current.map((t) => (t.id === editingTier.id ? { ...editingTier, order: t.order } : t));
        } else {
          return [...current, { ...editingTier, order: current.length }].sort((a, b) => a.order - b.order);
        }
      });
      setEditingTier(null);
      setMessage({ type: "success", text: "Sponsor tier saved." });
    } catch {
      setMessage({ type: "error", text: "Could not save. Please try again." });
    }
    setSaving(false);
  }

  async function handleDeleteTier(tier: SponsorTier) {
    const ok = await confirm({
      title: "Delete tier",
      message: `Delete "${tier.title}" tier? This cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      setTiers((current) => current.filter((t) => t.id !== tier.id).map((t, i) => ({ ...t, order: i })));
      setMessage({ type: "success", text: "Tier deleted." });
    } catch {
      setMessage({ type: "error", text: "Could not delete." });
    }
  }

  function renderEmptyState() {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-steel-300 bg-white/70 px-4 py-10 text-center shadow-sm ring-1 ring-black/5">
        <Icon name="award" size={20} className="text-steel-400" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-medium text-navy-900">No sponsor tiers yet</p>
        {!readOnly && (
          <>
            <p className="mt-1 max-w-sm text-xs text-steel-600">Press &ldquo;Add Tier&rdquo; to create a sponsorship level.</p>
            <Button type="button" variant="outline" size="sm" onClick={openCreateTier} className="mt-4">
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
    return (
      <li key={tier.id} className="card p-4 border-steel-200 hover:border-brand-300 transition-colors">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="inline-flex items-center rounded-full border border-steel-200 bg-steel-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-steel-600">
                {tier.id}
              </span>
              <h3 className="display-sm font-semibold text-navy-900">{tier.title}</h3>
            </div>
            <p className="mt-0.5 text-xs text-steel-500">{tier.description}</p>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={() => openEditTier(tier)}>
                <Icon name="gear" size={13} /> Edit
              </Button>
              <button
                type="button"
                onClick={() => handleDeleteTier(tier)}
                className="border border-steel-200 p-1.5 text-steel-500 transition hover:border-signal-300 hover:text-signal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300"
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
      </li>
    );
  }

  function renderTiersList() {
    return (
      <ul className="space-y-4" role="list">
        {tiers.map((tier) => renderTier(tier))}
      </ul>
    );
  }

  return (
    <section aria-label="Sponsors" className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-steel-200 bg-white/95 p-3 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <span className="eyebrow mb-1.5">Sponsors</span>
          <h2 className="display-sm text-lg text-navy-900 sm:text-xl">Sponsor Tiers</h2>
          <p className="mt-1 text-xs text-steel-600 sm:text-sm">
            Manage sponsorship tiers and partner logos
          </p>
        </div>
        {!readOnly && (
          <Button type="button" onClick={openCreateTier} className="shrink-0">
            <span className="flex items-center gap-2">
              <Icon name="plus" size={16} strokeWidth={2} />
              Add Tier
            </span>
          </Button>
        )}
      </div>

      {message ? (
        <p role="status" className={`text-xs font-semibold ${message.type === "error" ? "text-signal-600" : "text-emerald-700"}`}>
          {message.text}
        </p>
      ) : null}

      <div className="space-y-4">
        {tiers.length === 0 ? renderEmptyState() : renderTiersList()}
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
  message: { type: "success" | "error"; text: string } | null;
  onChange: (next: SponsorTier) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function set<K extends keyof typeof tier>(key: K, value: typeof tier[K]) {
    onChange({ ...tier, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Sponsor tier details">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy-950/55" />
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-steel-200 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="font-mono text-xs text-steel-500">{tier.id || "New tier"}</p>
            <h3 className="display-sm mt-1 truncate text-lg text-navy-900">{tier.id ? "Edit tier" : "Add tier"}</h3>
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
          </div>
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-steel-200 bg-steel-25 px-4 py-3 sm:px-5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : tier.id ? "Save changes" : "Create tier"}</Button>
          </footer>
        </form>
      </div>
    </div>
  );
}