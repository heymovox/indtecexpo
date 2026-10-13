import "server-only";

/**
 * One-off import of the photographs already hosted in /public.
 *
 * `data/floorPhotos.ts` is the historical catalogue of the site gallery. The
 * import copies those entries into the `gallery` collection so they can be
 * recategorised, reordered, hidden and re-captioned from the admin dashboard
 * alongside new uploads, instead of living in a separate read-only array.
 *
 * Ids are reused from the source photo (fp-01, fp-02, ...) which makes the
 * import idempotent: re-running only adds photos that are genuinely new.
 */

import { floorPhotos, type FloorPhoto } from "@/data/floorPhotos";
import {
  createGalleryItem,
  listGalleryItems,
  type GalleryCategoryValue,
  type GalleryItem,
} from "@/lib/db";

/**
 * Keyword -> category, ordered by specificity and tuned against the real
 * captions in floorPhotos.ts.
 *
 * Matching is word-boundary based: substring matching produced false positives
 * (searching "press" for hydraulic presses swallowed every "press coverage"
 * caption). Ambiguous single words are deliberately absent.
 */
const KEYWORDS: { category: GalleryCategoryValue; words: readonly string[] }[] = [
  {
    category: "Events",
    words: ["inauguration", "ribbon cutting", "opening", "ceremony", "press", "coverage"],
  },
  {
    category: "Networking",
    words: [
      "discussion",
      "buyer",
      "meeting",
      "connect",
      "conversation",
      "konnekt",
      "session",
      "feature",
      "negotiation",
    ],
  },
  {
    category: "Visitors",
    words: ["visitor", "attendee", "crowd", "audience"],
  },
  {
    category: "Exhibitors",
    words: ["exhibitor", "stand", "counter", "supplier", "badge"],
  },
  {
    category: "Machines",
    words: [
      "machine",
      "cnc",
      "robot",
      "automation",
      "lathe",
      "equipment",
      "instrumentation",
      "electronics",
      "power system",
      "power solution",
      "lighting",
      "component",
    ],
  },
  {
    category: "Expo",
    words: ["aisle", "hall", "venue", "show floor", "exhibition floor", "entrance"],
  },
];

/** Word-boundary match, so "press" does not match "standard". */
function hasKeyword(haystack: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(haystack);
}

/**
 * Best-effort category for a photo.
 *
 * The caption is weighted three times the alt text. Without that, the alt
 * descriptions dominate: nearly every one of them contains the word "stand",
 * which filed CNC machines and automation under "Exhibitors". Caption and alt
 * are also scored additively so a caption hit always outranks an alt-only hit.
 */
export function guessGalleryCategory(photo: {
  caption: string;
  alt: string;
}): GalleryCategoryValue {
  const scores = new Map<GalleryCategoryValue, number>();

  for (const { category, words } of KEYWORDS) {
    let score = 0;
    if (words.some((word) => hasKeyword(photo.caption, word))) score += 3;
    if (words.some((word) => hasKeyword(photo.alt, word))) score += 1;
    if (score > 0) scores.set(category, score);
  }

  let best: GalleryCategoryValue = "Expo";
  let bestScore = 0;
  for (const [category, score] of scores) {
    // Strictly greater keeps the KEYWORDS ordering as the tie-breaker.
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }
  return best;
}

/** Short human title derived from the caption, used when no title is set. */
function titleFromCaption(caption: string): string {
  const trimmed = caption.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 160) return trimmed;
  return `${trimmed.slice(0, 157)}...`;
}

export interface ImportResult {
  created: GalleryItem[];
  skipped: string[];
  available: number;
}

/**
 * Imports any hosted photograph that has no gallery record yet. Existing
 * records are left untouched so admin edits are never overwritten.
 */
export async function importHostedGalleryPhotos(): Promise<ImportResult> {
  const existing = await listGalleryItems();
  const known = new Set(existing.map((item) => item.id));

  const created: GalleryItem[] = [];
  const skipped: string[] = [];

  // Continue past an existing order so a first import does not collide with
  // rows created by hand in the dashboard.
  let nextOrder = existing.reduce((max, item) => Math.max(max, item.order ?? 0), 0) + 1;

  for (const photo of floorPhotos) {
    if (known.has(photo.id)) {
      skipped.push(photo.id);
      continue;
    }
    created.push(await importPhoto(photo, nextOrder++));
  }

  return { created, skipped, available: floorPhotos.length };
}

async function importPhoto(photo: FloorPhoto, order: number): Promise<GalleryItem> {
  return createGalleryItem({
    // Reusing the source id is what makes re-running the import a no-op.
    id: photo.id,
    title: titleFromCaption(photo.caption),
    category: guessGalleryCategory(photo),
    src: photo.src,
    origin: "hosted",
    caption: photo.caption,
    alt: photo.alt,
    width: photo.width,
    height: photo.height,
    published: true,
    order,
  });
}