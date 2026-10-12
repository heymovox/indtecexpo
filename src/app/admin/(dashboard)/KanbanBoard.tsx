"use client";

import { useRef, useState } from "react";
import { adminConfig } from "@/config/admin";
import { timeAgo } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";
import { LeadDrawer } from "./LeadDrawer";
import type { AdminLead, LeadKind } from "@/app/admin/lead-types";
import type { LeadStage } from "@/types/exhibitor";

type LoadState = "loading" | "ready" | "error";

interface LeadsResponse {
  ok?: boolean;
  leads?: AdminLead[];
}

function kindOf(lead: AdminLead): LeadKind {
  return lead.type.toLowerCase() as LeadKind;
}

function typeIcon(kind: LeadKind): IconName {
  if (kind === "exhibitor") return "building";
  if (kind === "visitor") return "users";
  return "inbox";
}

export function KanbanBoard({ initialLeads }: { initialLeads: AdminLead[] }) {
  const [leads, setLeads] = useState<AdminLead[]>(initialLeads);
  const [state, setState] = useState<LoadState>("ready");
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; kind: LeadKind } | null>(null);

  async function load() {
    setState("loading");
    try {
      const response = await fetch("/api/admin/leads", {
        headers: { Accept: "application/json" },
      });
      const data = (await response.json().catch(() => null)) as LeadsResponse | null;
      if (!response.ok || !data?.ok || !Array.isArray(data.leads)) {
        throw new Error("bad-response");
      }
      setLeads(data.leads);
      setError("");
      setState("ready");
    } catch {
      setState("error");
    }
  }

  async function moveLead(id: string, kind: LeadKind, stage: LeadStage) {
    const previous = leads;
    setLeads((current) =>
      current.map((lead) =>
        lead.id === id && kindOf(lead) === kind ? { ...lead, stage } : lead,
      ),
    );
    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, type: kind }),
      });
      if (!response.ok) throw new Error("bad-response");
      setError("");
    } catch {
      setLeads(previous);
      setError("Could not save that stage change. Please try again.");
    }
  }

  const selected =
    selectedId === null ? null : (leads.find((lead) => lead.id === selectedId) ?? null);

  const byStage = new Map<LeadStage, AdminLead[]>();
  for (const column of adminConfig.kanbanColumns) byStage.set(column.id, []);
  for (const lead of leads) {
    const bucket = byStage.get(lead.stage);
    if (bucket) bucket.push(lead);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="eyebrow mb-2">Pipeline</span>
          <h2 className="display-sm text-xl text-navy-900">Lead Kanban</h2>
        </div>
        <div className="flex items-center gap-3">
          {error ? (
            <p role="alert" className="text-xs font-semibold text-signal-600">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void load()}
            className="btn btn-outline btn-sm"
          >
            <Icon name="refresh" size={15} />
            Refresh
          </button>
        </div>
      </div>

      {state === "loading" ? (
        <div className="card flex min-h-[200px] items-center justify-center p-8 text-sm text-steel-500">
          Loading leads…
        </div>
      ) : null}

      {state === "error" ? (
        <div className="card flex min-h-[200px] flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm text-steel-600">
            Leads could not be loaded right now.
          </p>
          <button type="button" onClick={() => void load()} className="btn btn-primary btn-sm">
            Retry
          </button>
        </div>
      ) : null}

      {state === "ready" ? (
        <div className="overflow-x-auto pb-3">
          <div className="grid min-w-[1040px] grid-cols-6 gap-3">
            {adminConfig.kanbanColumns.map((column) => {
              const items = byStage.get(column.id) ?? [];
              const isOver = dragOver === column.id;
              return (
                <section
                  key={column.id}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(column.id);
                  }}
                  onDragLeave={() => setDragOver((current) => (current === column.id ? null : current))}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragOver(null);
                    const dragging = dragRef.current;
                    dragRef.current = null;
                    if (dragging) moveLead(dragging.id, dragging.kind, column.id);
                  }}
                  className={`flex min-h-[260px] flex-col border bg-white transition ${
                    isOver ? "border-brand-400 ring-2 ring-brand-200" : "border-steel-200"
                  }`}
                >
                  <header className="flex items-center justify-between gap-2 rounded-t-xl border-b border-steel-100 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                      <span className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-navy-800">
                        {column.label}
                      </span>
                    </div>
                    <span className="tabular rounded-full bg-steel-50 px-1.5 py-0.5 text-[11px] font-bold text-steel-600">
                      {items.length}
                    </span>
                  </header>

                  <div className="flex flex-1 flex-col gap-2.5 p-2.5">
                    {items.length === 0 ? (
                      <p className="px-1 py-6 text-center text-xs text-steel-400">
                        Drop leads here
                      </p>
                    ) : null}
                    {items.map((lead) => {
                      const kind = kindOf(lead);
                      return (
                        <article
                          key={lead.id}
                          draggable
                          onDragStart={() => {
                            dragRef.current = { id: lead.id, kind };
                          }}
                          onDragEnd={() => {
                            dragRef.current = null;
                            setDragOver(null);
                          }}
                          onClick={() => setSelectedId(lead.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedId(lead.id);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`View lead details for ${lead.reference}`}
                          className="group relative cursor-grab overflow-hidden rounded-xl border border-steel-200 bg-white shadow-sm transition-all duration-150 ease-out active:cursor-grabbing hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
                        >
                          <span
                            aria-hidden
                            className="absolute inset-y-0 left-0 w-1"
                            style={{ backgroundColor: column.color }}
                          />
                          <div className="flex h-full flex-col gap-2.5 p-3 pl-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border"
                                  style={{
                                    color: column.color,
                                    borderColor: `${column.color}40`,
                                    backgroundColor: `${column.color}14`,
                                  }}
                                >
                                  <Icon name={typeIcon(kind)} size={14} strokeWidth={1.8} />
                                </span>
                                <div className="flex flex-col">
                                  <span className="font-mono text-[11px] leading-none text-steel-500">
                                    {lead.reference}
                                  </span>
                                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-steel-500">
                                    {lead.type}
                                  </span>
                                </div>
                              </div>
                              <span className="hidden text-[11px] font-medium text-steel-400 group-hover:inline-flex group-focus-visible:inline-flex">
                                View details →
                              </span>
                            </div>

                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-semibold leading-snug text-navy-900">
                                {lead.title}
                              </p>
                              {lead.subtitle ? (
                                <p className="mt-1 line-clamp-2 text-xs leading-snug text-steel-600">
                                  {lead.subtitle}
                                </p>
                              ) : null}
                            </div>

                            <div className="mt-auto flex items-center justify-between">
                              <span className="text-[11px] text-steel-500">
                                {timeAgo(lead.createdAt)}
                              </span>
                              <span
                                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                                style={{
                                  color: column.color,
                                  backgroundColor: `${column.color}12`,
                                }}
                              >
                                {column.label}
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : null}

      {selected ? (
        <LeadDrawer
          key={selected.id}
          lead={selected}
          onClose={() => setSelectedId(null)}
          onSaved={(updated) =>
            setLeads((current) =>
              current.map((lead) => (lead.id === updated.id ? updated : lead)),
            )
          }
        />
      ) : null}
    </div>
  );
}
