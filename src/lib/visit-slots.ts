import type { ExpoEvent } from "@/types/event";

/**
 * Visitor planning helpers.
 *
 * A registrant picks which editions they plan to attend and, for each edition,
 * one or more one-hour visiting slots across the show days. Everything here is
 * derived from the event's own date data so the three editions stay in sync
 * automatically — no per-city slot lists to maintain.
 */

/** The exhibition floor opens and closes at the same hours for every edition. */
export const VISIT_START_HOUR = 9;
export const VISIT_END_HOUR = 18;

/**
 * Safety cap so a single registration cannot store an unbounded list.
 * Matches `sanitizeObject`'s 25-item array ceiling so nothing is silently
 * dropped between validation and persistence.
 */
export const MAX_VISIT_SLOTS = 25;

const SLOT_HOURS = Array.from(
  { length: VISIT_END_HOUR - VISIT_START_HOUR },
  (_, index) => VISIT_START_HOUR + index,
);

function hourLabel(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(display).padStart(2, "0")}:00 ${period}`;
}

export interface VisitSlot {
  /** Stable key stored in the form payload, e.g. "09:00". */
  key: string;
  /** Human label, e.g. "09:00 AM – 10:00 AM". */
  label: string;
}

/** One-hour slots spanning the daily visiting window. */
export const visitSlots: VisitSlot[] = SLOT_HOURS.map((hour) => ({
  key: `${String(hour).padStart(2, "0")}:00`,
  label: `${hourLabel(hour)} – ${hourLabel(hour + 1)}`,
}));

const slotByKey = new Map(visitSlots.map((slot) => [slot.key, slot]));

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface EventDay {
  /** ISO date, e.g. "2026-12-24". */
  iso: string;
  /** Day of month, e.g. "24". */
  short: string;
  /** e.g. "24 Dec 2026". */
  label: string;
  /** e.g. "Thu". */
  weekday: string;
}

function parseIso(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return { year, month, day };
}

function addDays(iso: string, offset: number): string {
  const { year, month, day } = parseIso(iso);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return date.toISOString().slice(0, 10);
}

/** The individual show days of an edition, derived from its start date. */
export function eventDays(event: ExpoEvent): EventDay[] {
  const start = event.startDate.slice(0, 10);
  return Array.from({ length: event.days }, (_, index) => {
    const iso = addDays(start, index);
    const { year, month, day } = parseIso(iso);
    const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
    return {
      iso,
      short: String(day),
      label: `${day} ${MONTHS[month - 1]} ${year}`,
      weekday,
    };
  });
}

export function slotKey(slug: string, dayIso: string, hour: string): string {
  return `${slug}|${dayIso}|${hour}`;
}

export interface ParsedSlot {
  slug: string;
  day: string;
  hour: string;
}

export function parseSlotKey(key: string): ParsedSlot | null {
  const [slug, day, hour] = key.split("|");
  if (!slug || !day || !hour) return null;
  return { slug, day, hour };
}

/** "24 Dec 2026" for an ISO date. */
export function formatDayLabel(iso: string): string {
  const { year, month, day } = parseIso(iso);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** "09:00 AM – 10:00 AM" for a slot key. Falls back to the raw key. */
export function formatSlotLabel(hour: string): string {
  return slotByKey.get(hour)?.label ?? hour;
}

/** "Bengaluru · 24 Dec 2026 · 09:00 AM – 10:00 AM" for storage and admin. */
export function formatVisitEntry(
  city: string,
  dayIso: string,
  hour: string,
): string {
  return `${city} · ${formatDayLabel(dayIso)} · ${formatSlotLabel(hour)}`;
}

/**
 * Orders slot keys by edition (in the given order), then day, then hour, so the
 * stored schedule reads like a timetable rather than selection order.
 */
export function sortSlotKeys(keys: string[], events: ExpoEvent[]): string[] {
  const order = new Map(events.map((event, index) => [event.slug, index]));
  return [...keys].sort((a, b) => {
    const left = parseSlotKey(a);
    const right = parseSlotKey(b);
    if (!left || !right) return a.localeCompare(b);
    const leftOrder = order.get(left.slug) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = order.get(right.slug) ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    if (left.day !== right.day) return left.day.localeCompare(right.day);
    return left.hour.localeCompare(right.hour);
  });
}
