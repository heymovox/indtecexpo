"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatDateTime } from "@/lib/utils";
import { adminConfig } from "@/config/admin";
import { StageChip } from "./StageChip";
import type { LeadKind } from "@/app/admin/lead-types";
import type { LeadStage } from "@/types/exhibitor";

export interface RecordsTableRow {
  id: string;
  reference: string;
  title: string;
  subtitle: string;
  meta: string[];
  stage: LeadStage;
  createdAt: string;
}

export function RecordsTable({
  kind,
  label,
  rows,
  emptyMessage = "No records yet.",
}: {
  kind: LeadKind;
  label: string;
  rows: RecordsTableRow[];
  emptyMessage?: string;
}) {
  const [query, setQuery] = useState("");
  const [stages, setStages] = useState<Record<string, LeadStage>>({});
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!needle) return true;
      const haystack = [
        row.reference,
        row.title,
        row.subtitle,
        row.stage,
        ...row.meta,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, query]);

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

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-steel-200 px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="display-sm text-lg text-navy-900">{label}</h2>
          <p className="mt-0.5 text-xs text-steel-500">
            {filtered.length} of {rows.length} record{rows.length === 1 ? "" : "s"}
          </p>
        </div>
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
      </div>

      {error ? (
        <p role="alert" className="border-b border-signal-100 bg-signal-50 px-4 py-2.5 text-xs font-semibold text-signal-700 sm:px-5">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-[0.12em] text-steel-500">
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
                Reference
              </th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
                Lead
              </th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
                Details
              </th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
                Stage
              </th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
                Received
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-steel-500 sm:px-5">
                  {rows.length === 0 ? emptyMessage : "No records match your search."}
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const stage = stages[row.id] ?? row.stage;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-steel-100 align-top last:border-b-0 hover:bg-steel-25"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-steel-600 sm:px-5">
                      {row.reference}
                    </td>
                    <td className="px-4 py-3 sm:px-5">
                      <p className="font-medium text-navy-900">{row.title}</p>
                      <p className="mt-0.5 text-xs text-steel-500">{row.subtitle}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-steel-600 sm:px-5">
                      {row.meta.map((item, index) => (
                        <p key={`${item}-${index}`} className="break-words">
                          {item}
                        </p>
                      ))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                      <div className="flex flex-col gap-2">
                        <StageChip stage={stage} />
                        <select
                          value={stage}
                          aria-label={`Stage for ${row.reference}`}
                          disabled={savingId === row.id}
                          onChange={(event) =>
                            void changeStage(row.id, event.target.value as LeadStage)
                          }
                          className="field py-1.5 text-xs"
                        >
                          {adminConfig.kanbanColumns.map((column) => (
                            <option key={column.id} value={column.id}>
                              {column.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-steel-500 sm:px-5">
                      {formatDateTime(row.createdAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
