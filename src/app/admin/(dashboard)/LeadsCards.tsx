"use client";

import { useMemo, useState } from "react";
import { adminConfig } from "@/config/admin";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";
import { LeadDrawer } from "./LeadDrawer";
import type { AdminLead, LeadKind } from "@/app/admin/lead-types";
import type { LeadStage } from "@/types/exhibitor";

function kindOf(lead: AdminLead): LeadKind {
  return lead.type.toLowerCase() as LeadKind;
}

function typeIcon(kind: LeadKind): IconName {
  if (kind === "exhibitor") return "building";
  if (kind === "visitor") return "users";
  return "inbox";
}

function typeGradient(kind: LeadKind): string {
  if (kind === "exhibitor") {
    return "from-brand-500/90 via-brand-600/90 to-indigo-600/90";
  }
  if (kind === "visitor") {
    return "from-emerald-500/90 via-emerald-600/90 to-teal-600/90";
  }
  return "from-slate-500/90 via-slate-600/90 to-navy-600/90";
}

function getStageColor(stage: LeadStage): string {
  const col = adminConfig.kanbanColumns.find((c) => c.id === stage);
  return col?.color ?? "#64748B";
}

function FieldPill({
  icon,
  label,
  value,
}: {
  icon?: IconName;
  label: string;
  value: string;
}) {
  if (!value || value.trim().length === 0) return null;
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-steel-200 bg-white/90 px-2 py-0.5 text-[11px] text-steel-700 shadow-sm ring-1 ring-white/60 backdrop-blur-sm">
      {icon ? (
        <Icon name={icon} size={12} strokeWidth={1.8} className="text-steel-500" />
      ) : null}
      <span className="truncate">
        <span className="mr-0.5 hidden text-steel-500 sm:inline">{label}:</span>
        {value}
      </span>
    </span>
  );
}

export function LeadsCards({ leads }: { leads: AdminLead[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | LeadKind>("all");
  const [stageFilter, setStageFilter] = useState<"all" | LeadStage>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const kind = kindOf(lead);
      if (typeFilter !== "all" && kind !== typeFilter) return false;
      if (stageFilter !== "all" && lead.stage !== stageFilter) return false;
      if (!q) return true;
      const haystack = [
        lead.reference,
        lead.title,
        lead.subtitle,
        lead.type,
        lead.stage,
        ...Object.values(lead.fields).flatMap((v) =>
          Array.isArray(v) ? v : [String(v)],
        ),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [leads, search, stageFilter, typeFilter]);

  const selected =
    selectedId === null ? null : (leads.find((lead) => lead.id === selectedId) ?? null);

  return (
    <section aria-label="Leads" className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-steel-200 bg-white/95 p-3 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <span className="eyebrow mb-1.5">Leads</span>
          <h2 className="display-sm text-lg text-navy-900 sm:text-xl">
            All Leads
          </h2>
          <p className="mt-1 text-xs text-steel-600 sm:text-sm">
            Click any card to view full lead details
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2.5">
          <div className="relative w-full sm:w-64">
            <Icon
              name="search"
              size={16}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-steel-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ref, name, company, email..."
              className="w-full rounded-xl border border-steel-200 bg-white pl-8 pr-2.5 py-2 text-sm text-navy-900 shadow-sm outline-none transition placeholder:text-steel-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200/60"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "all" | LeadKind)
              }
              className="rounded-xl border border-steel-200 bg-white px-2.5 py-2 text-xs font-medium text-navy-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200/60 sm:text-sm"
            >
              <option value="all">All Types</option>
              <option value="exhibitor">Exhibitors</option>
              <option value="visitor">Visitors</option>
              <option value="contact">Contacts</option>
            </select>

            <select
              value={stageFilter}
              onChange={(e) =>
                setStageFilter(e.target.value as "all" | LeadStage)
              }
              className="rounded-xl border border-steel-200 bg-white px-2.5 py-2 text-xs font-medium text-navy-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200/60 sm:text-sm"
            >
              <option value="all">All Stages</option>
              {adminConfig.kanbanColumns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            {(typeFilter !== "all" || stageFilter !== "all" || search) ? (
              <button
                type="button"
                onClick={() => {
                  setTypeFilter("all");
                  setStageFilter("all");
                  setSearch("");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-steel-200 bg-white px-2.5 py-2 text-xs font-medium text-steel-700 shadow-sm transition hover:bg-steel-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 sm:text-sm"
              >
                <Icon name="close" size={14} />
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-steel-300 bg-white/70 px-4 py-10 text-center shadow-sm ring-1 ring-black/5">
          <Icon
            name="inbox"
            size={20}
            className="text-steel-400"
            strokeWidth={1.5}
          />
          <p className="mt-3 text-sm font-medium text-navy-900">No leads found</p>
          <p className="mt-1 max-w-sm text-xs text-steel-600">
            Try adjusting your filters or search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((lead) => {
            const kind = kindOf(lead);
            const stageColor = getStageColor(lead.stage);
            const fields = lead.fields;

            return (
              <article
                key={lead.id}
                onClick={() => setSelectedId(lead.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(lead.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${lead.reference}`}
                className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-steel-200 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
              >
                <div
                  aria-hidden
                  className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${typeGradient(
                    kind,
                  )}`}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(120% 80% at 50% 0%, rgba(15,23,42,0.02) 0%, rgba(255,255,255,0) 70%)",
                  }}
                />

                <div className="flex flex-1 flex-col gap-3.5 p-3.5 sm:p-4">
                  <header className="flex items-start justify-between gap-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm ring-1 ring-white/70 backdrop-blur-sm sm:h-10 sm:w-10"
                        style={{
                          color: stageColor,
                          borderColor: `${stageColor}40`,
                          backgroundColor: `${stageColor}14`,
                        }}
                      >
                        <Icon
                          name={typeIcon(kind)}
                          size={16}
                          strokeWidth={1.9}
                        />
                        <span
                          aria-hidden
                          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: stageColor }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate font-mono text-[11px] text-steel-500 sm:text-xs">
                            {lead.reference}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-steel-200 bg-steel-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-steel-600 shadow-sm ring-1 ring-white/60">
                            {lead.type}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug text-navy-900 sm:text-base">
                          {lead.title}
                        </p>
                        {lead.subtitle ? (
                          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-steel-600 sm:text-[13px]">
                            {lead.subtitle}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full border border-steel-200 bg-white/95 px-2 py-0.5 text-[11px] font-medium text-steel-500 shadow-sm ring-1 ring-white/60 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                      View details
                      <Icon name="chevron-right" size={12} />
                    </span>
                  </header>

                  <div className="flex flex-wrap gap-1.5">
                    {kind === "exhibitor" ? (
                      <>
                        <FieldPill
                          icon="building"
                          label="Company"
                          value={String(fields.companyName ?? "")}
                        />
                        <FieldPill
                          icon="mail"
                          label="Email"
                          value={String(fields.email ?? "")}
                        />
                        <FieldPill
                          icon="phone"
                          label="Phone"
                          value={String(fields.phone ?? "")}
                        />
                        <FieldPill
                          label="Industry"
                          value={String(fields.industry ?? "")}
                        />
                        <FieldPill
                          label="Product"
                          value={String(fields.productCategory ?? "")}
                        />
                        <FieldPill
                          label="Stall"
                          value={
                            fields.stallSize
                              ? `${String(fields.stallSize)} • ${
                                  Number(fields.stalls) || 1
                                } stall${
                                  Number(fields.stalls) === 1 ? "" : "s"
                                }`
                              : ""
                          }
                        />
                      </>
                    ) : null}

                    {kind === "visitor" ? (
                      <>
                        <FieldPill
                          icon="building"
                          label="Company"
                          value={String(fields.companyName ?? "")}
                        />
                        <FieldPill
                          icon="mail"
                          label="Email"
                          value={String(fields.email ?? "")}
                        />
                        <FieldPill
                          icon="phone"
                          label="Phone"
                          value={String(fields.phone ?? "")}
                        />
                        <FieldPill
                          icon="map-pin"
                          label="City"
                          value={String(fields.city ?? "")}
                        />
                        <FieldPill
                          label="Industry"
                          value={String(fields.industry ?? "")}
                        />
                        <FieldPill
                          label="Interests"
                          value={Array.isArray(fields.interests)
                            ? fields.interests.join(", ")
                            : String(fields.interests ?? "")}
                        />
                      </>
                    ) : null}

                    {kind === "contact" ? (
                      <>
                        <FieldPill
                          icon="mail"
                          label="Email"
                          value={String(fields.email ?? "")}
                        />
                        <FieldPill
                          icon="phone"
                          label="Phone"
                          value={String(fields.phone ?? "")}
                        />
                        <FieldPill
                          icon="building"
                          label="Company"
                          value={String(fields.company ?? "")}
                        />
                        <FieldPill
                          label="Subject"
                          value={String(fields.subject ?? "")}
                        />
                        <FieldPill
                          label="Category"
                          value={String(fields.category ?? "")}
                        />
                      </>
                    ) : null}
                  </div>

                  <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-steel-100 pt-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm ring-1 ring-white/60"
                        style={{
                          color: stageColor,
                          backgroundColor: `${stageColor}14`,
                          border: `1px solid ${stageColor}33`,
                        }}
                      >
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: stageColor }}
                        />
                        {lead.stage.replace(/-/g, " ")}
                      </span>
                      <span
                        className="inline-flex items-center rounded-full border border-steel-200 bg-white/95 px-2 py-0.5 text-[11px] text-steel-600 shadow-sm ring-1 ring-white/60"
                        title={formatDateTime(lead.createdAt)}
                      >
                        {timeAgo(lead.createdAt)}
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-[11px] font-medium text-steel-500 group-hover:text-brand-700">
                      Open details
                      <Icon name="arrow-right" size={12} />
                    </span>
                  </footer>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selected ? (
        <LeadDrawer
          key={selected.id}
          lead={selected}
          onClose={() => setSelectedId(null)}
          onSaved={() => {}}
        />
      ) : null}
    </section>
  );
}