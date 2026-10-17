"use client";

import { getStallType, type StallPlan, type StallTypeSpec } from "@/data/floorPlans";
import { cn } from "@/lib/utils";

/**
 * Presentational floor plan.
 *
 * Single source of truth for how a plan is drawn, used by both the exhibitor
 * picker and the public floor plan page so the two can never drift apart.
 * Without `onToggle` it renders read-only.
 */

export const stallToneClasses: Record<StallTypeSpec["tone"], string> = {
  sponsor:
    "border-gold-600 bg-gold-100 text-gold-700 hover:border-gold-500 hover:bg-gold-50",
  royal:
    "border-brand-400 bg-brand-100 text-brand-700 hover:border-brand-500 hover:bg-brand-50",
  premium:
    "border-steel-300 bg-white text-navy-700 hover:border-brand-400 hover:bg-brand-50",
  standard:
    "border-steel-200 bg-steel-50 text-steel-600 hover:border-brand-300 hover:bg-brand-50",
};

export const stallSelectedToneClasses: Record<StallTypeSpec["tone"], string> = {
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

interface StallPlanViewProps {
  plan: StallPlan;
  selected?: string[];
  /** Omit for a read-only plan. */
  onToggle?: (code: string) => void;
  /** Hide the legend when it is already shown nearby. */
  showLegend?: boolean;
  /**
   * Caption overrides. The static plan carries its own venue and dates; the
   * caller passes the live edition's values so an edited date is never
   * contradicted by the plan header.
   */
  venue?: string;
  dates?: string;
}

export function StallPlanView({
  plan,
  selected = [],
  onToggle,
  showLegend = true,
  venue,
  dates,
}: StallPlanViewProps) {
  const cols = plan.rows[0].length;
  const selectedSet = new Set(selected);

  // A narrow plan (Bengaluru, 12 columns) can scale to the screen. A dense one
  // (Coimbatore 20, Hosur 30) cannot: squeezing it makes the codes collide and
  // overlap, so it pans at a readable cell size instead.
  const fitsScreen = cols <= 14;

  return (
    <div className="min-w-0">
      {showLegend ? (
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
                  className={cn("h-3.5 w-3.5 border", stallToneClasses[type.tone])}
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
      ) : null}

      <div className={cn("mt-4 min-w-0 border border-steel-200 bg-white p-2 sm:p-3", !showLegend && "mt-0")}>
        <div className={cn(fitsScreen ? "mx-auto w-full max-w-[40rem]" : "overflow-x-auto")}>
          <div className={cn("mx-auto", fitsScreen ? "w-full" : "w-max")}>
            <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-steel-400">
              {venue ?? plan.venue} · {dates ?? plan.dates}
            </p>
            <div
              className={cn("grid", fitsScreen ? "gap-0.5 sm:gap-1" : "gap-1")}
              style={{
                gridTemplateColumns: fitsScreen
                  ? `repeat(${cols}, minmax(0, 1fr))`
                  : `repeat(${cols}, 2.75rem)`,
              }}
              role="group"
              aria-label={`Stall layout for ${venue ?? plan.venue}`}
            >
              {plan.rows.flatMap((row, r) =>
                row.map((code, c) => {
                  if (!code) {
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={cn(
                          "rounded-sm bg-steel-100/70",
                          fitsScreen ? "h-9 sm:h-11" : "h-11",
                        )}
                        aria-hidden="true"
                      />
                    );
                  }
                  const type = getStallType(plan, code);
                  if (!type) {
                    // ENTRY / EXIT are part of the published plan but are not
                    // bookable stalls.
                    return (
                      <div
                        key={code}
                        className="flex h-11 items-center justify-center text-[8px] font-bold uppercase tracking-[0.06em] text-steel-400"
                        title={code}
                      >
                        {code}
                      </div>
                    );
                  }
                  const isSelected = selectedSet.has(code);
                  const label = `${code} — ${type.name}, ${type.dimensions}, ${type.area} square metres`;
                  const shape = cn(
                    "flex items-center justify-center rounded-sm border font-semibold transition-colors",
                    fitsScreen
                      ? "h-9 text-[9px] sm:h-11 sm:text-[11px]"
                      : "h-11 text-[11px]",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                    isSelected
                      ? stallSelectedToneClasses[type.tone]
                      : stallToneClasses[type.tone],
                  );

                  if (!onToggle) {
                    return (
                      <div key={code} className={shape} title={label}>
                        {code}
                      </div>
                    );
                  }
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onToggle(code)}
                      aria-pressed={isSelected}
                      title={label}
                      className={shape}
                    >
                      {code}
                    </button>
                  );
                }),
              )}
            </div>
            {!fitsScreen ? (
              <p className="mt-2 text-center text-[10px] text-steel-400 sm:hidden">
                Swipe the plan sideways to see all stalls
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
