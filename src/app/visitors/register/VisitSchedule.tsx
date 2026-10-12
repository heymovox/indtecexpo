"use client";

import { cn } from "@/lib/utils";
import {
  eventDays,
  MAX_VISIT_SLOTS,
  slotKey,
  visitSlots,
  VISIT_END_HOUR,
  VISIT_START_HOUR,
} from "@/lib/visit-slots";
import type { ExpoEvent } from "@/types/event";

function windowLabel(): string {
  const format = (hour: number) => {
    const period = hour < 12 ? "AM" : "PM";
    const display = hour % 12 === 0 ? 12 : hour % 12;
    return `${String(display).padStart(2, "0")}:00 ${period}`;
  };
  return `${format(VISIT_START_HOUR)} – ${format(VISIT_END_HOUR)}`;
}

export function VisitSchedule({
  events,
  selectedExpos,
  slots,
  onToggleExpo,
  onToggleSlot,
  expoError,
  scheduleError,
}: {
  events: ExpoEvent[];
  selectedExpos: string[];
  slots: string[];
  onToggleExpo: (slug: string) => void;
  onToggleSlot: (key: string) => void;
  expoError?: string;
  scheduleError?: string;
}) {
  const selected = new Set(slots);

  return (
    <fieldset aria-invalid={expoError || scheduleError ? true : undefined}>
      <legend className="field-label">
        Expos You Plan to Visit
        <span className="ml-1 text-signal-500">*</span>
      </legend>
      <p className="mt-1 text-xs leading-relaxed text-steel-500">
        Select the editions you plan to attend, then mark the days and one-hour
        slots that suit you. The exhibition floor is open{" "}
        {windowLabel()} on every show day.
      </p>
      <p className="mt-1 text-xs font-medium text-steel-500">
        {slots.length} of {MAX_VISIT_SLOTS} time slots selected
      </p>

      <div className="mt-3 space-y-3">
        {events.map((event) => {
          const isSelected = selectedExpos.includes(event.slug);
          const days = eventDays(event);
          return (
            <div
              key={event.slug}
              className={cn(
                "border transition",
                isSelected
                  ? "border-brand-500 bg-brand-50/40"
                  : "border-steel-200 bg-white",
              )}
            >
              <label className="flex cursor-pointer items-center gap-2.5 px-3 py-3 sm:px-4">
                <input
                  type="checkbox"
                  name="interestedExpos"
                  value={event.slug}
                  checked={isSelected}
                  onChange={() => onToggleExpo(event.slug)}
                  className="h-5 w-5 shrink-0 accent-[#0f5fbf]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-navy-900">
                    {event.city} — {event.dateRangeShort}
                  </span>
                  <span className="block text-xs text-steel-500">
                    {event.venue.name} · {event.days} day
                    {event.days === 1 ? "" : "s"}
                  </span>
                </span>
              </label>

              {isSelected ? (
                <div className="space-y-3 border-t border-brand-100 px-3 py-3 sm:px-4">
                  {days.map((day) => (
                    <div key={day.iso}>
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-steel-500">
                        {day.label}
                        <span className="ml-2 font-normal normal-case tracking-normal text-steel-400">
                          {day.weekday}
                        </span>
                      </p>
                      <div
                        role="group"
                        aria-label={`${event.city} ${day.label} time slots`}
                        className="mt-1.5 flex flex-wrap gap-1.5"
                      >
                        {visitSlots.map((slot) => {
                          const key = slotKey(event.slug, day.iso, slot.key);
                          const active = selected.has(key);
                          return (
                            <button
                              key={slot.key}
                              type="button"
                              aria-pressed={active}
                              onClick={() => onToggleSlot(key)}
                              className={cn(
                                "border px-2 py-1 text-[11px] font-medium transition",
                                active
                                  ? "border-brand-600 bg-brand-600 text-white"
                                  : "border-steel-200 bg-white text-steel-600 hover:border-brand-300 hover:text-brand-700",
                              )}
                            >
                              {slot.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {expoError ? <span className="field-error">{expoError}</span> : null}
      {scheduleError ? <span className="field-error">{scheduleError}</span> : null}
    </fieldset>
  );
}
