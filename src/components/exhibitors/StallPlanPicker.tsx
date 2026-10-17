"use client";

import { useMemo, useState } from "react";

import { StallPlanView } from "@/components/exhibitors/StallPlanView";
import {
  estimateSelectionCost,
  formatRupees,
  listStallCodes,
  type StallPlan,
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
  /** Live edition caption, overriding the plan's own venue and dates. */
  venue?: string;
  dates?: string;
}

/**
 * Selection UI for a floor plan. The plan itself is drawn by StallPlanView so
 * this and the public floor plan page always render the same layout.
 */
export function StallPlanPicker({
  plan,
  selected,
  onToggle,
  onReplace,
  hint,
  venue,
  dates,
}: StallPlanPickerProps) {
  const [schemeIndex, setSchemeIndex] = useState(0);
  const scheme = plan.schemes[schemeIndex];

  const allCodes = useMemo(() => listStallCodes(plan), [plan]);

  const estimate = useMemo(
    () => estimateSelectionCost(plan, selected, scheme.pricePerSqM),
    [plan, selected, scheme],
  );

  const allSelected = selected.length === allCodes.length;

  return (
    <div className="min-w-0">
      <StallPlanView
        plan={plan}
        selected={selected}
        onToggle={onToggle}
        venue={venue}
        dates={dates}
      />

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
                ? (hint ??
                  "Tap any stall on the plan to add it to your preference list.")
                : `${selected.join(", ")} · ${estimate.exhibitionArea} m² exhibition space`}
            </p>
          </div>
          <div className="flex items-center gap-3">
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
              onClick={() => onReplace(allSelected ? [] : allCodes)}
              className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600 underline underline-offset-4 hover:text-brand-700"
            >
              {allSelected
                ? "Clear all"
                : `Select all ${allCodes.length}`}
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
