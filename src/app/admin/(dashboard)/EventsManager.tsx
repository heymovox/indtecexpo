"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/Form";
import { Icon, type IconName } from "@/components/ui/Icon";
import { formatDateTime } from "@/lib/utils";
import { UploadField } from "@/components/admin/UploadField";

export type EventStatus = "upcoming" | "live" | "completed";

export interface EventAdminItem {
  id: string | null;
  slug: string;
  name: string;
  city: string;
  state: string;
  edition: string;
  dateLabel: string;
  dateRangeShort: string;
  positioning: string;
  venueName: string;
  venueAddress: string;
  summary: string;
  description: string[];
  sectors: string[];
  highlights: string[];
  bannerImage: string;
  posterImage: string;
  floorPlanImage: string;
  floorPlanPdf: string;
  startDate: string;
  endDate: string;
  days: number;
  monthLabel: string;
  status: EventStatus;
  published: boolean;
  hasOverride: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live now" },
  { value: "completed", label: "Completed" },
];

const STATUS_STYLE: Record<EventStatus, { chip: string; icon: IconName }> = {
  upcoming: { chip: "bg-brand-50 text-brand-700 border-brand-200", icon: "calendar" },
  live: { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "bolt" },
  completed: { chip: "bg-steel-50 text-steel-600 border-steel-200", icon: "clock" },
};

function emptyItem(): EventAdminItem {
  return {
    id: null,
    slug: "",
    name: "",
    city: "",
    state: "",
    edition: "",
    dateLabel: "",
    dateRangeShort: "",
    positioning: "",
    venueName: "",
    venueAddress: "",
    summary: "",
    description: [],
    sectors: [],
    highlights: [],
    bannerImage: "",
    posterImage: "",
    floorPlanImage: "",
    floorPlanPdf: "",
    startDate: "",
    endDate: "",
    days: 3,
    monthLabel: "",
    status: "upcoming",
    published: true,
    hasOverride: false,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

interface SaveResponse {
  ok?: boolean;
  message?: string;
}

export function EventsManager({ items, readOnly = false }: { items: EventAdminItem[]; readOnly?: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<EventAdminItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && editing) setEditing(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);

  const counts = useMemo(() => {
    return {
      total: items.length,
      published: items.filter((item) => item.published).length,
      withFloorPlan: items.filter((item) => item.floorPlanImage || item.floorPlanPdf).length,
    };
  }, [items]);

  function openCreate() {
    setMessage(null);
    setEditing(emptyItem());
  }

  function openEdit(item: EventAdminItem) {
    setMessage(null);
    setEditing({ ...item });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || saving) return;
    const slug = slugify(editing.slug || editing.city || editing.name);
    if (!slug) {
      setMessage({ type: "error", text: "A slug is required — enter the city or event name first." });
      return;
    }
    setSaving(true);
    setMessage(null);
    const payload = {
      id: editing.id ?? undefined,
      slug,
      name: editing.name.trim(),
      city: editing.city.trim(),
      state: editing.state.trim(),
      edition: editing.edition.trim(),
      dateLabel: editing.dateLabel.trim(),
      dateRangeShort: editing.dateRangeShort.trim(),
      positioning: editing.positioning.trim(),
      venueName: editing.venueName.trim(),
      venueAddress: editing.venueAddress.trim(),
      summary: editing.summary.trim(),
      description: editing.description,
      sectors: editing.sectors,
      highlights: editing.highlights,
      bannerImage: editing.bannerImage.trim(),
      posterImage: editing.posterImage.trim(),
      floorPlanImage: editing.floorPlanImage.trim(),
      floorPlanPdf: editing.floorPlanPdf.trim(),
      startDate: editing.startDate,
      endDate: editing.endDate,
      days: editing.days,
      monthLabel: editing.monthLabel.trim(),
      status: editing.status,
      published: editing.published,
    };
    try {
      const response = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as SaveResponse | null;
      if (!response.ok || !data?.ok) {
        setMessage({
          type: "error",
          text: data?.message ?? "Could not save the event. Please try again.",
        });
        setSaving(false);
        return;
      }
      setEditing(null);
      setMessage({ type: "success", text: "Event saved." });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Could not reach the server. Please try again." });
    }
    setSaving(false);
  }

  async function handleDelete(item: EventAdminItem) {
    if (!item.id) {
      setMessage({
        type: "error",
        text: "This edition comes from the source files and has no saved override to delete.",
      });
      return;
    }
    if (typeof window !== "undefined") {
      const ok = window.confirm(`Delete ${item.name}? This removes the saved event record.`);
      if (!ok) return;
    }
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/events?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => null)) as SaveResponse | null;
      if (!response.ok || !data?.ok) {
        setMessage({
          type: "error",
          text: data?.message ?? "Could not delete the event. Please try again.",
        });
        return;
      }
      setMessage({ type: "success", text: "Event deleted." });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Could not reach the server. Please try again." });
    }
  }

  return (
    <section aria-label="Events" className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-steel-200 bg-white/95 p-3 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <span className="eyebrow mb-1.5">Editions</span>
          <h2 className="display-sm text-lg text-navy-900 sm:text-xl">Event Cards</h2>
          <p className="mt-1 text-xs text-steel-600 sm:text-sm">
            {counts.total} editions · {counts.published} published · {counts.withFloorPlan} with
            floor plans
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {message ? (
            <p
              role="status"
              className={`text-xs font-semibold ${
                message.type === "error" ? "text-signal-600" : "text-emerald-700"
              }`}
            >
              {message.text}
            </p>
          ) : null}
          {!readOnly ? (
            <Button type="button" onClick={openCreate} className="shrink-0">
              <span className="flex items-center gap-2">
                <Icon name="plus" size={16} strokeWidth={2} />
                Add Event
              </span>
            </Button>
          ) : null}
        </div>
      </div>

{items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-steel-300 bg-white/70 px-4 py-10 text-center shadow-sm ring-1 ring-black/5">
            <Icon name="calendar" size={20} className="text-steel-400" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-navy-900">No events yet</p>
            {!readOnly ? (
              <>
                <p className="mt-1 max-w-sm text-xs text-steel-600">
                  Press &ldquo;Add Event&rdquo; to create an edition card with banner, floor plan and full
                  details.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={openCreate} className="mt-4">
                  <span className="flex items-center gap-2">
                    <Icon name="plus" size={14} />
                    Add Event
                  </span>
                </Button>
              </>
            ) : (
              <p className="mt-1 max-w-sm text-xs text-steel-600">
                Contact your superadmin to create new event editions.
              </p>
            )}
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const style = STATUS_STYLE[item.status];
            const banner = item.bannerImage || item.posterImage;
            return (
              <article
                key={item.id ?? item.slug}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-steel-200 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
              >
                <div className="relative h-40 w-full shrink-0 overflow-hidden bg-steel-100">
                  {banner ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={banner}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-steel-100 to-steel-200">
                      <Icon name="image" size={22} className="text-steel-400" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-sm backdrop-blur-sm ${style.chip}`}
                    >
                      <Icon name={style.icon} size={12} />
                      {item.status}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold shadow-sm backdrop-blur-sm ${
                        item.published
                          ? "border-emerald-200 bg-emerald-50/90 text-emerald-700"
                          : "border-steel-200 bg-white/90 text-steel-600"
                      }`}
                    >
                      <Icon name={item.published ? "check" : "close"} size={11} />
                      {item.published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2.5 p-3.5 sm:p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-steel-200 bg-steel-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-steel-600">
                        /{item.slug}
                      </span>
                      {item.edition ? (
                        <span className="rounded-full border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                          {item.edition}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug text-navy-900 sm:text-base">
                      {item.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-steel-600">
                      <Icon name="map-pin" size={12} />
                      <span className="truncate">
                        {[item.venueName, item.city].filter(Boolean).join(" · ") || "Venue TBD"}
                      </span>
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-steel-500">
                      <Icon name="calendar" size={12} />
                      {item.dateRangeShort || item.dateLabel || "Dates TBD"}
                      <span className="text-steel-400">·</span>
                      {item.days} days
                    </p>
                  </div>

                  {item.summary ? (
                    <p className="line-clamp-2 text-xs leading-relaxed text-steel-600">
                      {item.summary}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-1.5">
                    {item.floorPlanImage ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-steel-200 bg-white px-2 py-0.5 text-[11px] text-steel-700 shadow-sm">
                        <Icon name="grid" size={11} /> Floor plan image
                      </span>
                    ) : null}
                    {item.floorPlanPdf ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-steel-200 bg-white px-2 py-0.5 text-[11px] text-steel-700 shadow-sm">
                        <Icon name="download" size={11} /> Floor plan PDF
                      </span>
                    ) : null}
                    {item.bannerImage ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-steel-200 bg-white px-2 py-0.5 text-[11px] text-steel-700 shadow-sm">
                        <Icon name="image" size={11} /> Banner
                      </span>
                    ) : null}
                  </div>

<footer className="mt-auto flex items-center justify-between gap-2 border-t border-steel-100 pt-3">
                      <span className="text-[11px] text-steel-500">
                        {item.hasOverride ? "Edited in admin" : "Source default"}
                      </span>
                      {!readOnly ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(item)}
                          >
                            <span className="flex items-center gap-1.5">
                              <Icon name="gear" size={13} />
                              Edit
                            </span>
                          </Button>
                          <button
                            type="button"
                            aria-label={`Delete ${item.name}`}
                            onClick={() => void handleDelete(item)}
                            className="border border-steel-200 p-1.5 text-steel-500 transition hover:border-signal-300 hover:text-signal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300"
                          >
                            <Icon name="close" size={13} />
                          </button>
                        </div>
                      ) : null}
                    </footer>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing ? (
        <EventFormModal
          item={editing}
          saving={saving}
          message={message}
          onChange={(next) => setEditing(next)}
          onClose={() => setEditing(null)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </section>
  );
}

function EventFormModal({
  item,
  saving,
  message,
  onChange,
  onClose,
  onSubmit,
}: {
  item: EventAdminItem;
  saving: boolean;
  message: { type: "success" | "error"; text: string } | null;
  onChange: (next: EventAdminItem) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const slugPreview = slugify(item.slug || item.city || item.name);
  const banner = item.bannerImage || item.posterImage;

  function set<K extends keyof EventAdminItem>(key: K, value: EventAdminItem[K]) {
    onChange({ ...item, [key]: value });
  }

  function toLines(value: string): string[] {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Event details"
    >
      <button
        type="button"
        aria-label="Close event form"
        onClick={onClose}
        className="absolute inset-0 bg-navy-950/55"
      />
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-steel-200 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="font-mono text-xs text-steel-500">
              {slugPreview ? `/${slugPreview}` : "/new-event"}
            </p>
            <h3 className="display-sm mt-1 truncate text-lg text-navy-900">
              {item.id ? "Edit event" : "Add event"}
            </h3>
            <p className="mt-0.5 text-xs text-steel-600">
              Banner, floor plan and the details shown on the event card & detail page.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close event form"
            className="shrink-0 border border-steel-200 p-2 text-steel-500 transition hover:text-navy-900"
          >
            <Icon name="close" size={16} />
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {message ? <FormAlert type={message.type}>{message.text}</FormAlert> : null}

            <div className="mb-5 overflow-hidden rounded-xl border border-steel-200 bg-steel-50">
              {banner ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={banner}
                  alt="Event banner preview"
                  className="h-36 w-full object-cover sm:h-40"
                />
              ) : (
                <div className="flex h-24 items-center justify-center text-xs text-steel-500 sm:h-28">
                  Banner preview appears here
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 border-t border-steel-200 px-3 py-2 text-[11px] text-steel-600">
                <span className="inline-flex items-center gap-1">
                  <Icon name="calendar" size={12} />
                  {item.dateRangeShort || item.dateLabel || "Dates TBD"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="map-pin" size={12} />
                  {item.venueName || item.city || "Venue TBD"}
                </span>
                {item.floorPlanImage || item.floorPlanPdf ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <Icon name="check" size={12} />
                    Floor plan attached
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event name" htmlFor="event-name" required>
                <Input
                  id="event-name"
                  value={item.name}
                  maxLength={160}
                  onChange={(event) => set("name", event.target.value)}
                  required
                />
              </Field>
              <Field label="Slug (URL)" htmlFor="event-slug" hint={slugPreview ? `/${slugPreview}` : "Auto-generated from name or city"}>
                <Input
                  id="event-slug"
                  value={item.slug}
                  maxLength={60}
                  onChange={(event) => set("slug", event.target.value)}
                  placeholder={slugPreview}
                />
              </Field>
              <Field label="City" htmlFor="event-city">
                <Input
                  id="event-city"
                  value={item.city}
                  maxLength={80}
                  onChange={(event) => set("city", event.target.value)}
                />
              </Field>
              <Field label="State" htmlFor="event-state">
                <Input
                  id="event-state"
                  value={item.state}
                  maxLength={80}
                  onChange={(event) => set("state", event.target.value)}
                />
              </Field>
              <Field label="Edition" htmlFor="event-edition" hint="e.g. 2026">
                <Input
                  id="event-edition"
                  value={item.edition}
                  maxLength={40}
                  onChange={(event) => set("edition", event.target.value)}
                />
              </Field>
              <Field label="Positioning" htmlFor="event-positioning" hint="e.g. Industrial Business Hub">
                <Input
                  id="event-positioning"
                  value={item.positioning}
                  maxLength={120}
                  onChange={(event) => set("positioning", event.target.value)}
                />
              </Field>

              <UploadField
                  label="Banner image"
                  value={item.bannerImage}
                  onChange={(url) => set("bannerImage", url)}
                  folder="posters"
                  guidelines={{
                    recommendedDimensions: "1200×675 px (16:9)",
                    acceptedTypes: "JPG, PNG, WebP, AVIF",
                    maxSizeMB: 10,
                  }}
                  htmlFor="event-banner"
                />
                <UploadField
                  label="Poster image"
                  value={item.posterImage}
                  onChange={(url) => set("posterImage", url)}
                  folder="posters"
                  guidelines={{
                    recommendedDimensions: "800×1200 px (portrait)",
                    acceptedTypes: "JPG, PNG, WebP, AVIF",
                    maxSizeMB: 10,
                  }}
                  htmlFor="event-poster"
                />
                <UploadField
                  label="Floor plan image"
                  value={item.floorPlanImage}
                  onChange={(url) => set("floorPlanImage", url)}
                  folder="floor-plans"
                  guidelines={{
                    recommendedDimensions: "SVG preferred, or 2000×2000 px PNG",
                    acceptedTypes: "SVG, PNG, JPG, WebP",
                    maxSizeMB: 10,
                  }}
                  htmlFor="event-floor-image"
                />
                <Field label="Floor plan PDF URL" htmlFor="event-floor-pdf" hint="Optional PDF download link">
                  <Input
                    id="event-floor-pdf"
                    value={item.floorPlanPdf}
                    onChange={(event) => set("floorPlanPdf", event.target.value)}
                    placeholder="/documents/floor-plan-bengaluru.pdf"
                  />
                </Field>

              <Field label="Start date" htmlFor="event-start">
                <Input
                  id="event-start"
                  type="date"
                  value={item.startDate}
                  onChange={(event) => set("startDate", event.target.value)}
                />
              </Field>
              <Field label="End date" htmlFor="event-end">
                <Input
                  id="event-end"
                  type="date"
                  value={item.endDate}
                  onChange={(event) => set("endDate", event.target.value)}
                />
              </Field>

              <Field label="Date label" htmlFor="event-date-label" hint="e.g. 24, 25, 26 December 2026">
                <Input
                  id="event-date-label"
                  value={item.dateLabel}
                  maxLength={120}
                  onChange={(event) => set("dateLabel", event.target.value)}
                />
              </Field>
              <Field label="Short date label" htmlFor="event-date-short" hint="e.g. 24-26 Dec 2026">
                <Input
                  id="event-date-short"
                  value={item.dateRangeShort}
                  maxLength={60}
                  onChange={(event) => set("dateRangeShort", event.target.value)}
                />
              </Field>

              <Field label="Month label" htmlFor="event-month" hint="e.g. Dec 2026">
                <Input
                  id="event-month"
                  value={item.monthLabel}
                  maxLength={40}
                  onChange={(event) => set("monthLabel", event.target.value)}
                />
              </Field>
              <Field label="Days" htmlFor="event-days">
                <Input
                  id="event-days"
                  type="number"
                  min={1}
                  max={14}
                  value={String(item.days)}
                  onChange={(event) => set("days", Number(event.target.value) || 1)}
                />
              </Field>

              <Field label="Venue name" htmlFor="event-venue">
                <Input
                  id="event-venue"
                  value={item.venueName}
                  maxLength={160}
                  onChange={(event) => set("venueName", event.target.value)}
                />
              </Field>
              <Field label="Venue address" htmlFor="event-venue-address">
                <Input
                  id="event-venue-address"
                  value={item.venueAddress}
                  maxLength={200}
                  onChange={(event) => set("venueAddress", event.target.value)}
                />
              </Field>

              <Field label="Status" htmlFor="event-status">
                <Select
                  id="event-status"
                  value={item.status}
                  onChange={(event) => set("status", event.target.value as EventStatus)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Visibility" htmlFor="event-published">
                <Select
                  id="event-published"
                  value={item.published ? "published" : "draft"}
                  onChange={(event) => set("published", event.target.value === "published")}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </Select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Summary" htmlFor="event-summary" hint="Short card description">
                  <Textarea
                    id="event-summary"
                    rows={3}
                    maxLength={600}
                    value={item.summary}
                    onChange={(event) => set("summary", event.target.value)}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field
                  label="About paragraphs"
                  htmlFor="event-description"
                  hint="One paragraph per line — shown on the event detail page"
                >
                  <Textarea
                    id="event-description"
                    rows={5}
                    value={item.description.join("\n")}
                    onChange={(event) => set("description", toLines(event.target.value))}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Sectors" htmlFor="event-sectors" hint="Comma separated">
                  <Input
                    id="event-sectors"
                    value={item.sectors.join(", ")}
                    onChange={(event) =>
                      set(
                        "sectors",
                        event.target.value
                          .split(",")
                          .map((entry) => entry.trim())
                          .filter((entry) => entry.length > 0),
                      )
                    }
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Highlights" htmlFor="event-highlights" hint="One highlight per line">
                  <Textarea
                    id="event-highlights"
                    rows={4}
                    value={item.highlights.join("\n")}
                    onChange={(event) => set("highlights", toLines(event.target.value))}
                  />
                </Field>
              </div>

              {item.createdAt ? (
                <p className="text-[11px] text-steel-500 sm:col-span-2">
                  Created {formatDateTime(item.createdAt)}
                  {item.updatedAt ? ` · Updated ${formatDateTime(item.updatedAt)}` : ""}
                </p>
              ) : null}
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-steel-200 bg-steel-25 px-4 py-3 sm:px-5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : item.id ? "Save changes" : "Create event"}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}
