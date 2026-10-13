/**
 * Shared shapes for the public gallery.
 *
 * Kept free of server-only imports so the client grid can import the types
 * without pulling in the database layer.
 */

export const GALLERY_FILTERS = [
  "Expo",
  "Exhibitors",
  "Visitors",
  "Machines",
  "Networking",
  "Events",
  "Archive",
] as const;

export type GalleryFilter = (typeof GALLERY_FILTERS)[number];

export interface GalleryDisplayItem {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  category: GalleryFilter;
  /** True for admin uploads, false for the curated set shipped in the repo. */
  live: boolean;
}

export function isGalleryFilter(value: string): value is GalleryFilter {
  return (GALLERY_FILTERS as readonly string[]).includes(value);
}