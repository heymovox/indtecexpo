"use client";

import { useRef, useState } from "react";
import { adminConfig } from "@/config/admin";
import { timeAgo } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
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
                  <header
                    className="border-t-2 border-b border-b-steel-200 px-3 py-2.5"
                    style={{ borderTopColor: column.color }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: column.color }}
                        />
                        <span className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-navy-800">
                          {column.label}
                        </span>
                      </span>
                      <span className="tabular text-xs font-bold text-steel-500">
                        {items.length}
                      </span>
                    </div>
                  </header>

                  <div className="flex flex-1 flex-col gap-2.5 p-2.5">
                    {items.length === 0 ? (
                      <p className="px-1 py-6 text-center text-xs text-steel-400">
                        Drop leads here
                      </p>
                    ) : null}
                    {items.map((lead) => (
                      <article
                        key={lead.id}
                        draggable
                        onDragStart={() => {
                          dragRef.current = { id: lead.id, kind: kindOf(lead) };
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
                        aria-label={`Open lead ${lead.reference}`}
                        className="card cursor-pointer p-3 transition hover:border-brand-300 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-[11px] text-steel-500">
                            {lead.reference}
                          </span>
                          <span
                            className="shrink-0 border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                            style={{
                              color: column.color,
                              borderColor: `${column.color}55`,
                              backgroundColor: `${column.color}14`,
                            }}
                          >
                            {lead.type}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-navy-900">
                          {lead.title}
                        </p>
                        <p className="mt-1.5 text-[11px] text-steel-500">
                          {timeAgo(lead.createdAt)}
                        </p>
                      </article>
                    ))}
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
