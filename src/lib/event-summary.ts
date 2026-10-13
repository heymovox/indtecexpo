import "server-only";

import { events } from "@/data/events";
import { mergeEventOverrides } from "@/lib/db";
import type { ExpoEvent } from "@/types/event";

/**
 * Turns the editions a submission refers to into the compact summary rendered
 * in the confirmation email.
 *
 * The two forms disagree about how they identify an edition: the stall enquiry
 * posts slugs ("bengaluru"), while the visitor form posts a human label
 * ("Bengaluru - 24–26 Dec 2026"). Both are accepted here so neither route has
 * to know the difference.
 */

function matches(event: ExpoEvent, value: string): boolean {
  const needle = value.trim().toLowerCase();
  if (!needle) return false;
  if (needle === event.slug.toLowerCase()) return true;
  const city = event.city.toLowerCase();
  return needle === city || needle.startsWith(city);
}

/**
 * Resolves the event list, preferring admin-managed overrides so a date edited
 * in the dashboard reaches the email. A database outage falls back to the
 * static data rather than dropping the section from the email.
 */
async function resolveEvents(): Promise<ExpoEvent[]> {
  try {
    return await mergeEventOverrides<ExpoEvent>([...events]);
  } catch (error) {
    console.error("[email] could not merge event overrides", error);
    return [...events];
  }
}

export interface EventSummary {
  name: string;
  city: string;
  dates: string;
  venue: string;
}

export async function summariseEvents(
  references: string[] | undefined,
): Promise<EventSummary[]> {
  if (!references?.length) return [];

  const all = await resolveEvents();
  const out: EventSummary[] = [];
  const seen = new Set<string>();

  for (const reference of references) {
    const event = all.find((candidate) => matches(candidate, reference));
    if (!event || seen.has(event.slug)) continue;
    seen.add(event.slug);
    out.push({
      name: event.name,
      city: event.city,
      dates: event.dateRangeShort || event.dateLabel,
      venue: `${event.venue.name}, ${event.venue.locality}`,
    });
  }

  return out;
}