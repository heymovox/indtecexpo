"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatDateTime } from "@/lib/utils";
import { adminConfig } from "@/config/admin";
import { StageChip } from "./StageChip";
import { Button } from "@/components/ui/Button";
import { exportCSV, exportXLSX, exportPDF, downloadBlob, downloadText } from "@/lib/export";
import type { LeadKind } from "@/app/admin/lead-types";
import type { AdminLead } from "@/app/admin/lead-types";
import type { LeadStage } from "@/types/exhibitor";
import { LeadDrawer } from "./LeadDrawer";
import { useToast } from "@/components/admin/ToastProvider";

export interface RecordsTableRow {
  id: string;
  reference: string;
  title: string;
  subtitle: string;
  meta: string[];
  stage: LeadStage;
  createdAt: string;
  eventSlug?: string;
  /**
   * Kept separate from `meta` so email and phone can render as real
   * mailto:/tel: links in the list instead of plain text.
   */
  contact?: { email: string; phone: string };
  /** Full detail record, used to open the lead drawer from a row. */
  lead?: AdminLead;
}

interface ExportColumn {
  header: string;
  key: string;
}

export function RecordsTable({
  kind,
  label,
  rows,
  emptyMessage = "No records yet.",
  exportColumns = [] as ExportColumn[],
  events = [] as { slug: string; name: string }[],
  canDelete = false,
}: {
  kind: LeadKind;
  label: string;
  rows: RecordsTableRow[];
  emptyMessage?: string;
  exportColumns?: ExportColumn[];
  events?: { slug: string; name: string }[];
  canDelete?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [stages, setStages] = useState<Record<string, LeadStage>>({});
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [localRows, setLocalRows] = useState(rows);
  const { toast, confirm } = useToast();

  function openDetails(row: RecordsTableRow) {
    if (row.lead) setOpenLeadId(row.id);
  }

  function applyDrawerUpdate(lead: AdminLead) {
    setStages((current) => ({ ...current, [lead.id]: lead.stage }));
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return localRows.filter((row) => {
      if (!needle) return true;
      const haystack = [
        row.reference,
        row.title,
        row.subtitle,
        row.stage,
        ...row.meta,
        row.eventSlug ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [localRows, query]);

  const eventFiltered = useMemo(() => {
    if (eventFilter === "all") return filtered;
    return filtered.filter((row) => row.eventSlug === eventFilter);
  }, [filtered, eventFilter]);

  // Derived after the memos above, so it reflects the active search/filter.
  const openLead = eventFiltered.find((row) => row.id === openLeadId)?.lead;

  async function changeStage(id: string, stage: LeadStage) {
    setSavingId(id);
    setError("");
    const previous = stages[id];
    setStages((current) => ({ ...current, [id]: stage }));
    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, type: kind }),
      });
      if (!response.ok) throw new Error("bad-response");
    } catch {
      setStages((current) => {
        const next = { ...current };
        if (previous) next[id] = previous;
        else delete next[id];
        return next;
      });
      setError("Could not save the stage change. Please try again.");
    }
    setSavingId(null);
  }

  async function handleDelete(row: RecordsTableRow) {
    if (!canDelete) return;
    const title = row.lead?.fields.companyName ?? row.title;
    const ok = await confirm({
      title: "Delete record",
      message: `Delete "${title}"? This cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    setDeletingId(row.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/leads/${row.id}?type=${kind}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error("bad-response");
      setLocalRows((current) => current.filter((entry) => entry.id !== row.id));
      toast("success", "Record deleted", `"${title}" has been removed.`);
    } catch {
      setError("Could not delete the record. Please try again.");
    }
    setDeletingId(null);
  }

  function handleExport(format: "csv" | "xlsx" | "pdf") {
    if (exportColumns.length === 0 || eventFiltered.length === 0) return;
    const data = eventFiltered.map((row) => {
      const obj: Record<string, unknown> = {
        Reference: row.reference,
        Title: row.title,
        Subtitle: row.subtitle,
        Stage: row.stage,
        Received: formatDateTime(row.createdAt),
        Event: row.eventSlug ? events.find((e) => e.slug === row.eventSlug)?.name ?? row.eventSlug : "",
      };
      row.meta.forEach((m, i) => { obj[`Detail ${i + 1}`] = m; });
      return obj;
    });
    const columns: ExportColumn[] = [
      { header: "Reference", key: "Reference" },
      { header: "Title", key: "Title" },
      { header: "Subtitle", key: "Subtitle" },
      ...exportColumns.map((c) => ({ header: c.header, key: c.key })),
      { header: "Stage", key: "Stage" },
      { header: "Received", key: "Received" },
      { header: "Event", key: "Event" },
    ];
    if (format === "csv") {
      const csv = exportCSV({ columns, data });
      downloadText(csv, `${label.toLowerCase().replace(/\s+/g, "-")}-export.csv`);
    } else if (format === "xlsx") {
      const blob = exportXLSX({ columns, data });
      downloadBlob(blob, `${label.toLowerCase().replace(/\s+/g, "-")}-export.xlsx`);
    } else {
      const blob = exportPDF({ title: label, columns, data });
      downloadBlob(blob, `${label.toLowerCase().replace(/\s+/g, "-")}-export.pdf`);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-steel-200 px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="display-sm text-lg text-navy-900">{label}</h2>
          <p className="mt-0.5 text-xs text-steel-500">
            {eventFiltered.length} of {rows.length} record{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {events.length > 0 && (
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="field py-1.5 text-xs sm:w-48"
              aria-label="Filter by event"
            >
              <option value="all">All Events</option>
              {events.map((evt) => (
                <option key={evt.slug} value={evt.slug}>{evt.name}</option>
              ))}
            </select>
          )}
          <div className="relative w-full sm:w-72">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-steel-400">
              <Icon name="search" size={16} />
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              aria-label={`Search ${label}`}
              className="field pl-9"
            />
          </div>
          {exportColumns.length > 0 && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => handleExport("csv")} className="hidden sm:inline-flex">
                <Icon name="download" size={14} /> CSV
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleExport("xlsx")} className="hidden sm:inline-flex">
                <Icon name="download" size={14} /> Excel
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleExport("pdf")} className="hidden sm:inline-flex">
                <Icon name="download" size={14} /> PDF
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleExport("csv")} className="inline-flex sm:hidden" aria-label="Export CSV">
                <Icon name="download" size={14} />
              </Button>
            </>
          )}
        </div>
      </div>

      {error ? (
        <p role="alert" className="border-b border-signal-100 bg-signal-50 px-4 py-2.5 text-xs font-semibold text-signal-700 sm:px-5">
          {error}
        </p>
      ) : null}

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {eventFiltered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-steel-500">
            {rows.length === 0 ? emptyMessage : "No records match your search."}
          </div>
        ) : (
          <div className="grid gap-3 p-4">
            {eventFiltered.map((row) => {
                const stage = stages[row.id] ?? row.stage;
                return (
                <article
                  key={row.id}
                  className="card p-4 border-steel-200 transition-colors hover:border-brand-300"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-steel-500 truncate">{row.reference}</p>
                      {row.lead ? (
                        <button
                          type="button"
                          onClick={() => openDetails(row)}
                          className="mt-1 block text-left font-medium text-navy-900 hover:text-brand-700 hover:underline"
                        >
                          {row.title}
                        </button>
                      ) : (
                        <h4 className="mt-1 font-medium text-navy-900">{row.title}</h4>
                      )}
                      <p className="mt-0.5 text-xs text-steel-500">{row.subtitle}</p>
                    </div>
                    <StageChip stage={stage} />
                  </div>

                  {row.contact && (row.contact.email || row.contact.phone) ? (
                    <div className="mb-3 flex flex-col gap-1.5 text-xs">
                      {row.contact.email ? (
                        <a
                          href={`mailto:${row.contact.email}`}
                          onClick={(event) => event.stopPropagation()}
                          className="break-all text-brand-700 underline-offset-2 hover:underline"
                        >
                          {row.contact.email}
                        </a>
                      ) : null}
                      {row.contact.phone ? (
                        <a
                          href={`tel:${row.contact.phone.replace(/[^\d+]/g, "")}`}
                          onClick={(event) => event.stopPropagation()}
                          className="text-brand-700 underline-offset-2 hover:underline"
                        >
                          {row.contact.phone}
                        </a>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="space-y-1.5 mb-3 text-xs text-steel-600">
                    {row.meta.map((item, index) => (
                      <p key={`${item}-${index}`} className="break-words">{item}</p>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-steel-100">
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <StageChip stage={stage} />
                      <select
                        value={stage}
                        aria-label={`Stage for ${row.reference}`}
                        disabled={savingId === row.id}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => void changeStage(row.id, event.target.value as LeadStage)}
                        className="field py-1.5 text-xs w-full sm:w-auto"
                      >
                        {adminConfig.kanbanColumns.map((column) => (
                          <option key={column.id} value={column.id}>{column.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      {row.lead ? (
                        <button
                          type="button"
                          onClick={() => openDetails(row)}
                          className="text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
                        >
                          View details
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => void handleDelete(row)}
                          disabled={deletingId === row.id}
                          aria-label={`Delete ${row.title}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-signal-600 underline-offset-2 hover:underline disabled:opacity-40"
                        >
                          <Icon name="close" size={13} />
                          {deletingId === row.id ? "Deleting…" : "Delete"}
                        </button>
                      ) : null}
                      <time className="text-xs text-steel-500 whitespace-nowrap" dateTime={row.createdAt}>
                        {formatDateTime(row.createdAt)}
                      </time>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-[0.12em] text-steel-500">
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">Reference</th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">Lead</th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">Details</th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">Stage</th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">Received</th>
            </tr>
          </thead>
          <tbody>
            {eventFiltered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-steel-500 sm:px-5">
                  {rows.length === 0 ? emptyMessage : "No records match your search."}
                </td>
              </tr>
            ) : (
              eventFiltered.map((row) => {
                const stage = stages[row.id] ?? row.stage;
                return (
                  <tr key={row.id} className="border-b border-steel-100 align-top last:border-b-0 hover:bg-steel-25">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-steel-600 sm:px-5">{row.reference}</td>
                    <td className="px-4 py-3 sm:px-5">
                      {row.lead ? (
                        <button
                          type="button"
                          onClick={() => openDetails(row)}
                          className="text-left font-medium text-navy-900 hover:text-brand-700 hover:underline"
                        >
                          {row.title}
                        </button>
                      ) : (
                        <p className="font-medium text-navy-900">{row.title}</p>
                      )}
                      <p className="mt-0.5 text-xs text-steel-500">{row.subtitle}</p>

                      {row.contact && (row.contact.email || row.contact.phone) ? (
                        <div className="mt-1 flex flex-col gap-0.5 text-xs">
                          {row.contact.email ? (
                            <a
                              href={`mailto:${row.contact.email}`}
                              className="break-all text-brand-700 underline-offset-2 hover:underline"
                            >
                              {row.contact.email}
                            </a>
                          ) : null}
                          {row.contact.phone ? (
                            <a
                              href={`tel:${row.contact.phone.replace(/[^\d+]/g, "")}`}
                              className="text-brand-700 underline-offset-2 hover:underline"
                            >
                              {row.contact.phone}
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-steel-600 sm:px-5">
                      {row.meta.map((item, index) => (
                        <p key={`${item}-${index}`} className="break-words">{item}</p>
                      ))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                      <div className="flex flex-col gap-2">
                        <StageChip stage={stage} />
                        <select
                          value={stage}
                          aria-label={`Stage for ${row.reference}`}
                          disabled={savingId === row.id}
                          onChange={(event) => void changeStage(row.id, event.target.value as LeadStage)}
                          className="field py-1.5 text-xs"
                        >
{adminConfig.kanbanColumns.map((column) => (
                          <option key={column.id} value={column.id}>{column.label}</option>
                        ))}
                        </select>
                        {row.lead ? (
                          <button
                            type="button"
                            onClick={() => openDetails(row)}
                            className="text-left text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
                          >
                            View details
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => void handleDelete(row)}
                            disabled={deletingId === row.id}
                            aria-label={`Delete ${row.title}`}
                            className="inline-flex items-center gap-1 text-left text-xs font-medium text-signal-600 underline-offset-2 hover:underline disabled:opacity-40"
                          >
                            <Icon name="close" size={12} />
                            {deletingId === row.id ? "Deleting…" : "Delete"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-steel-500 sm:px-5">{formatDateTime(row.createdAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {openLead ? (
        <LeadDrawer lead={openLead} onClose={() => setOpenLeadId(null)} onSaved={applyDrawerUpdate} />
      ) : null}
    </div>
  );
}