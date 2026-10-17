"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { UploadField, type UploadResult } from "@/components/admin/UploadField";
import { StallPlanView } from "@/components/exhibitors/StallPlanView";
import { useToast } from "@/components/admin/ToastProvider";
import {
  formatRupees,
  getStallPlan,
  listStallCodes,
  type StallPlan,
} from "@/data/floorPlans";

const SLUGS = ["bengaluru", "coimbatore", "hosur"] as const;
type Slug = (typeof SLUGS)[number];

interface Assets {
  slug: Slug;
  imageKey?: string;
  pdfKey?: string;
  imageAlt?: string;
  pdfLabel?: string;
  updatedAt?: string;
}

/**
 * What the form may send. `null` clears a field — JSON drops `undefined`, so a
 * cleared asset has to travel as `null` for the server to see the difference
 * between "remove it" and "leave it as it is".
 */
type AssetPatch = {
  imageKey?: string | null;
  pdfKey?: string | null;
  imageAlt?: string;
  pdfLabel?: string;
};

const CITY_LABEL: Record<Slug, string> = {
  bengaluru: "Bengaluru",
  coimbatore: "Coimbatore",
  hosur: "Hosur",
};

/** Authenticated preview so drafts are visible before they go live. */
const adminAsset = (key: string) =>
  `/api/admin/object?key=${encodeURIComponent(key)}`;

export function FloorPlansManager() {
  const { confirm } = useToast();
  const [assets, setAssets] = useState<Record<string, Assets>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Slug | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/floor-plans", { cache: "no-store", credentials: "include" })
      .then((res) => res.json().catch(() => null))
      .then((data: { ok?: boolean; items?: Assets[]; message?: string } | null) => {
        if (cancelled) return;
        if (data?.ok && data.items) {
          setAssets(Object.fromEntries(data.items.map((item) => [item.slug, item])));
        } else {
          setMessage({ type: "error", text: data?.message ?? "Could not load floor plans." });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(slug: Slug, patch: AssetPatch) {
    setBusy(slug);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/floor-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...patch }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? "Could not save");
      }
      setAssets((current) => ({ ...current, [slug]: data.item as Assets }));
      return true;
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not save",
      });
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function reset(slug: Slug) {
    const ok = await confirm({
      title: "Remove floor plan",
      message: `Remove the uploaded plan for ${CITY_LABEL[slug]}?`,
      confirmLabel: "Remove",
      variant: "danger",
    });
    if (!ok) return;
    setBusy(slug);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/floor-plans?slug=${encodeURIComponent(slug)}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? "Could not clear");
      }
      setAssets((current) => {
        const next = { ...current };
        delete next[slug];
        return next;
      });
      setMessage({
        type: "success",
        text: `${CITY_LABEL[slug]} reverted to the plan shipped with the site.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not clear",
      });
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="card flex items-center gap-2 p-6 text-sm text-steel-600">
        <Icon name="refresh" size={16} className="animate-spin" />
        Loading floor plans…
      </div>
    );
  }

  return (
    <section aria-label="Floor plans" className="space-y-4">
      <div className="card flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <span className="eyebrow mb-1.5">Floor Plans</span>
          <h2 className="display-sm text-lg text-navy-900 sm:text-xl">
            Bengaluru, Coimbatore &amp; Hosur
          </h2>
          <p className="mt-1 text-xs text-steel-600 sm:text-sm">
            The stall layout below is the live booking data. Upload official artwork or a
            PDF to replace the placeholder drawing on the public floor plan page.
          </p>
        </div>
        <Link
          href="/floor-plan"
          target="_blank"
          className="inline-flex shrink-0 items-center gap-1.5 border border-steel-200 px-3 py-2 text-xs font-medium text-steel-700 transition hover:border-brand-400 hover:text-navy-900"
        >
          <Icon name="external" size={13} />
          View public page
        </Link>
      </div>

      {message ? (
        <p
          role="status"
          className={`text-xs font-semibold ${message.type === "error" ? "text-signal-600" : "text-emerald-700"}`}
        >
          {message.text}
        </p>
      ) : null}

      {SLUGS.map((slug) => (
        <CityPlan
          key={slug}
          slug={slug}
          plan={getStallPlan(slug)}
          assets={assets[slug]}
          busy={busy === slug}
          onSave={(patch) => save(slug, patch)}
          onReset={() => reset(slug)}
        />
      ))}
    </section>
  );
}

function CityPlan({
  slug,
  plan,
  assets,
  busy,
  onSave,
  onReset,
}: {
  slug: Slug;
  plan: StallPlan | null;
  assets?: Assets;
  busy: boolean;
  onSave: (patch: AssetPatch) => Promise<boolean>;
  onReset: () => void;
}) {
  const hasUpload = Boolean(assets?.imageKey || assets?.pdfKey);
  const cols = plan ? Math.max(...plan.rows.map((row) => row.length)) : 0;
  const rows = plan?.rows.length ?? 0;
  const stalls = plan ? listStallCodes(plan).length : 0;

  return (
    <article className="card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-steel-200 p-4 sm:p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="display-sm text-lg text-navy-900">{CITY_LABEL[slug]}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                hasUpload
                  ? "bg-emerald-600 text-white"
                  : "bg-steel-100 text-steel-600"
              }`}
            >
              {hasUpload ? "Uploaded plan live" : "Built-in plan"}
            </span>
          </div>
          {plan ? (
            <p className="mt-1 text-xs text-steel-600">
              {plan.venue} · {plan.dates}
            </p>
          ) : null}
        </div>

        {hasUpload ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={busy}
          >
            <Icon name="refresh" size={13} /> Revert to built-in
          </Button>
        ) : null}
      </header>

      {plan ? (
        <>
          <dl className="grid grid-cols-2 gap-px border-b border-steel-200 bg-steel-200 sm:grid-cols-4">
            <Stat label="Bookable stalls" value={String(stalls)} />
            <Stat label="Grid" value={`${cols} × ${rows}`} />
            <Stat label="Stall types" value={String(Object.keys(plan.types).length)} />
            <Stat
              label="Space schemes"
              value={String(plan.schemes.length)}
              sub={plan.schemes
                .map((scheme) => `${scheme.name} ${formatRupees(scheme.pricePerSqM)}/m²`)
                .join(" · ")}
            />
          </dl>

          <div className="border-b border-steel-200 p-4 sm:p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-steel-500">
              Live stall layout
            </p>
            <div className="overflow-x-auto">
              <StallPlanView plan={plan} />
            </div>
            <dl className="mt-4 space-y-1.5">
              {Object.values(plan.types).map((type) => (
                <div key={type.code} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <dt className="font-mono font-semibold text-navy-900">{type.code}</dt>
                  <dd className="text-steel-600">
                    {type.name} · {type.dimensions} · {type.area} m²
                    {type.sponsorship ? ` · ${type.sponsorship}` : ""}
                    {type.sponsorshipPrice ? ` (${type.sponsorshipPrice})` : ""}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      ) : (
        <p className="border-b border-steel-200 p-4 text-xs text-steel-500 sm:p-5">
          No stall layout is defined for this city.
        </p>
      )}

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
        <UploadField
          label="Official floor plan artwork"
          value={assets?.imageKey ? adminAsset(assets.imageKey) : ""}
          onChange={(url) => {
            if (!url) void onSave({ imageKey: null, imageAlt: "" });
          }}
          onUploaded={(result: UploadResult) => void onSave({ imageKey: result.key })}
          folder="floor-plans"
          guidelines={{
            recommendedDimensions: "SVG preferred, or a 2000×2000 px image",
            acceptedTypes: "SVG, PNG, JPG, WebP",
            maxSizeMB: 10,
          }}
          hint={
            hasUpload && assets?.imageKey
              ? "Shown at the top of this city's section on /floor-plan."
              : "Replaces the placeholder drawing on /floor-plan. The stall grid stays live underneath."
          }
          htmlFor={`floor-image-${slug}`}
        />

        <UploadField
          kind="pdf"
          label="Floor plan PDF"
          value={assets?.pdfKey ? adminAsset(assets.pdfKey) : ""}
          onChange={(url) => {
            if (!url) void onSave({ pdfKey: null, pdfLabel: "" });
          }}
          onUploaded={(result: UploadResult) =>
            void onSave({ pdfKey: result.key, pdfLabel: `${CITY_LABEL[slug]} floor plan` })
          }
          folder="floor-plans"
          guidelines={{ acceptedTypes: "PDF", maxSizeMB: 10 }}
          hint="Offered as a download link on /floor-plan."
          htmlFor={`floor-pdf-${slug}`}
        />
      </div>
    </article>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white p-3">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-steel-500">
        {label}
      </dt>
      <dd className="display tabular mt-1 text-xl text-navy-900">{value}</dd>
      {sub ? <p className="mt-0.5 text-[10px] leading-snug text-steel-500">{sub}</p> : null}
    </div>
  );
}