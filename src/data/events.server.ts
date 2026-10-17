import "server-only";

import { events as staticEvents } from "@/data/events";
import { mergeEventOverrides } from "@/lib/db";
import { publicMediaUrl } from "@/lib/media";
import type { ExpoEvent } from "@/types/event";

/**
 * The public name for the edition list.
 *
 * `@/data/events` is the versioned source of truth shipped in the repo, and the
 * dashboard saves its edits as overrides on top of it. Every public surface —
 * event cards, comparison tables, the countdowns, the registration and stall
 * forms, the footer calendar — reads through here, so an edit made in the
 * dashboard (dates, labels, venue, banner, poster, floor plan, publishing)
 * reaches the website instead of waiting for a deploy.
 *
 * A database outage falls back to the static data rather than taking the
 * marketing site down.
 */

const MEDIA_FIELDS = [
  "heroImage",
  "posterImage",
  "floorPlanImage",
  "floorPlanPdf",
] as const;

async function mergedEvents(): Promise<ExpoEvent[]> {
  try {
    return await mergeEventOverrides<ExpoEvent>([...staticEvents]);
  } catch (error) {
    console.error("[events] could not merge admin overrides", error);
    return [...staticEvents];
  }
}

function withResolvedMedia(event: ExpoEvent): ExpoEvent {
  const resolved = { ...event };
  for (const field of MEDIA_FIELDS) {
    resolved[field] = publicMediaUrl(resolved[field]);
  }
  return resolved;
}

const byDateAsc = (a: ExpoEvent, b: ExpoEvent): number =>
  new Date(a.startDate).getTime() - new Date(b.startDate).getTime();

/**
 * Every published edition with dashboard edits applied, soonest first.
 * Unpublished editions stay visible in the admin and disappear from the
 * public site, exactly like flipping the toggle promises.
 */
export async function getPublicEvents(): Promise<ExpoEvent[]> {
  const all = await mergedEvents();
  return all
    .filter((event) => event.published !== false)
    .map(withResolvedMedia)
    .sort(byDateAsc);
}

/** One edition by slug, or null when it does not exist or is unpublished. */
export async function getPublicEvent(slug: string): Promise<ExpoEvent | null> {
  const event = (await getPublicEvents()).find(
    (candidate) => candidate.slug === slug,
  );
  return event ?? null;
}

/**
 * The soonest `count` editions that have not finished yet; falls back to the
 * latest editions once the whole series has run so the hero never renders
 * empty. Works on an already-resolved list so callers only hit the database
 * once per request.
 */
export function getUpcomingFrom(
  events: ExpoEvent[],
  count = 2,
  now: Date = new Date(),
): ExpoEvent[] {
  const timestamp = now.getTime();
  const upcoming = events.filter(
    (event) => new Date(event.endDate).getTime() > timestamp,
  );
  return upcoming.length > 0 ? upcoming.slice(0, count) : events.slice(-count);
}