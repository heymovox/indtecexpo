"use client";

import { useMemo, useState } from "react";

import {
  estimateSelectionCost,
  formatRupees,
  getStallType,
  listStallCodes,
  type StallPlan,
  type StallTypeSpec,
} from "@/data/floorPlans";
import { cn } from "@/lib/utils";

interface StallPlanPickerProps {
  plan: StallPlan;
  selected: string[];
  /**
   * Toggle a single stall. Takes the code rather than the next array so the
   * parent can compute the new list inside a functional state update — deriving
   * it here from the `selected` prop loses toggles when two clicks land in the
   * same render, because both would read the same stale array.
   */
  onToggle: (code: string) => void;
  /** Replace the whole selection (Select all / Clear). */
  onReplace: (codes: string[]) => void;
  /** Shown under the summary; set when selection is optional. */
  hint?: string;
}

const toneClasses: Record<StallTypeSpec["tone"], string> = {
  sponsor:
    "border-gold-600 bg-gold-100 text-gold-700 hover:border-gold-500 hover:bg-gold-50",
  royal:
    "border-brand-400 bg-brand-100 text-brand-700 hover:border-brand-500 hover:bg-brand-50",
  premium:
    "border-steel-300 bg-white text-navy-700 hover:border-brand-400 hover:bg-brand-50",
  standard:
    "border-steel-200 bg-steel-50 text-steel-600 hover:border-brand-300 hover:bg-brand-50",
};

const selectedToneClasses: Record<StallTypeSpec["tone"], string> = {
  sponsor: "border-gold-600 bg-gold-500 text-white",
  royal: "border-brand-600 bg-brand-600 text-white",
  premium: "border-brand-700 bg-brand-700 text-white",
  standard: "border-brand-800 bg-brand-800 text-white",
};

const legendOrder: StallTypeSpec["tone"][] = [
  "sponsor",
  "royal",
  "premium",
  "standard",
];

export function StallPlanPicker({
  plan,
  selected,
  onToggle,
  onReplace,
  hint,
}: StallPlanPickerProps) {
  const [schemeIndex, setSchemeIndex] = useState(0);
  const scheme = plan.schemes[schemeIndex];

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allCodes = useMemo(() => listStallCodes(plan), [plan]);

  const estimate = useMemo(
    () => estimateSelectionCost(plan, selected, scheme.pricePerSqM),
    [plan, selected, scheme],
  );

  const toggle = (code: string) => {
    onToggle(code);
  };

  return (
    <div className="min-w-0">
      {/* Legend ------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {legendOrder.map((tone) => {
          const type = Object.values(plan.types).find((t) => t.tone === tone);
          if (!type) return null;
          return (
              <span
                key={tone}
                className="flex items-center gap-1.5 text-[11px] font-medium text-steel-600"
              >
                <span
                  className={cn(
                    "h-3.5 w-3.5 border",
                    toneClasses[type.tone],
                  )}
                  aria-hidden="true"
                />
                {type.name}
                <span className="text-steel-400">
                  ({type.dimensions} · {type.area} m²)
                </span>
              </span>
            );
        })}
      </div>

      {/* The plan ------------------------------------------------------ */}
      <div className="mt-4 overflow-x-auto border border-steel-200 bg-white p-3">
        <div className="mx-auto w-max">
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-steel-400">
            {plan.venue} · {plan.dates}
          </p>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${plan.rows[0].length}, 3.25rem)` }}
            role="group"
            aria-label={`Stall layout for ${plan.venue}`}
          >
            {plan.rows.flatMap((row, r) =>
              row.map((code, c) => {
                if (!code) {
                  return (
                    <div
                      key={`${r}-${c}`}
                      className="h-11 rounded-sm bg-steel-100/70"
                      aria-hidden="true"
                    />
                  );
                }
                const type = getStallType(plan, code);
                if (!type) return null;
                const isSelected = selectedSet.has(code);
                const label = `${code} — ${type.name}, ${type.dimensions}, ${type.area} square metres`;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggle(code)}
                    aria-pressed={isSelected}
                    title={label}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-sm border text-[11px] font-semibold transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                      isSelected
                        ? selectedToneClasses[type.tone]
                        : toneClasses[type.tone],
                    )}
                  >
                    {code}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      </div>

      {/* Selection summary --------------------------------------------- */}
      <div className="mt-4 border border-steel-200 bg-steel-25 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="display-sm text-sm text-navy-900">
              {selected.length === 0
                ? "No stalls selected"
                : `${selected.length} stall${selected.length > 1 ? "s" : ""} selected`}
            </p>
            <p className="mt-0.5 text-xs text-steel-500">
              {selected.length === 0
                ? hint ??
                  "Tap any stall on the plan to add it to your preference list."
                : `${selected.join(", ")} · ${estimate.exhibitionArea} m² exhibition space`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selected.length > 0 ? (
              <button
                type="button"
                onClick={() => onReplace([])}
                className="text-[11px] font-semibold uppercase tracking-[0.12em] text-steel-500 underline underline-offset-4 hover:text-signal-600"
              >
                Clear
              </button>
            ) : null}
            <button
              type="button"
              onClick={() =>
                onReplace(selected.length === allCodes.length ? [] : allCodes)
              }
              className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600 underline underline-offset-4 hover:text-brand-700"
            >
              {selected.length === allCodes.length ? "Clear all" : `Select all ${allCodes.length}`}
            </button>
          </div>
        </div>

        {selected.length > 0 ? (
          <div className="mt-4 border-t border-steel-200 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-steel-500">
                Indicative pricing
              </span>
              <div className="flex gap-1.5">
                {plan.schemes.map((item, index) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSchemeIndex(index)}
                    aria-pressed={schemeIndex === index}
                    className={cn(
                      "border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                      schemeIndex === index
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-steel-300 bg-white text-steel-600 hover:border-brand-400",
                    )}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <span className="ml-auto font-display text-lg text-navy-900">
                {formatRupees(estimate.total)}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-steel-500">
              Indicative only, based on {scheme.name} at{" "}
              {formatRupees(scheme.pricePerSqM)} per m².
              {estimate.sponsorshipCount > 0
                ? ` ${estimate.sponsorshipCount} sponsorship stall${
                    estimate.sponsorshipCount > 1 ? "s are" : " is"
                  } quoted separately on request.`
                : ""}{" "}
              Final allocation and pricing are confirmed by our team.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
