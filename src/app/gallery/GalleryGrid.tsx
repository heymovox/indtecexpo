"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  GALLERY_FILTERS,
  type GalleryDisplayItem,
  type GalleryFilter,
} from "./gallery-items";

/**
 * Masonry grid for the public gallery.
 *
 * Admin-uploaded images are served from /gallery/img/[id], which streams the
 * private R2 object through this same origin, so next/image can optimise them
 * like any local asset.
 */
export function GalleryGrid({ items }: { items: GalleryDisplayItem[] }) {
  const [filter, setFilter] = useState<GalleryFilter | "All">("All");

  const counts = useMemo(() => {
    const map = new Map<GalleryFilter, number>();
    for (const item of items) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    }
    return map;
  }, [items]);

  const visible = useMemo(
    () => (filter === "All" ? items : items.filter((item) => item.category === filter)),
    [items, filter],
  );

  const available = GALLERY_FILTERS.filter((value) => counts.get(value));

  if (items.length === 0) {
    return (
      <p className="text-sm text-steel-500" role="status">
        No photographs have been published yet. Please check back soon.
      </p>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-steel-500" role="status">
          Showing {visible.length} of {items.length} photographs
          {filter !== "All" ? ` in ${filter}` : ""}.
        </p>

        <div className="-mx-1 flex flex-wrap gap-1.5" role="group" aria-label="Filter photographs by category">
          {(["All", ...available] as const).map((value) => {
            const active = filter === value;
            const count = value === "All" ? items.length : (counts.get(value) ?? 0);
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-brand-500 bg-brand-50 text-navy-900"
                    : "border-steel-200 bg-white text-steel-600 hover:border-steel-300 hover:text-navy-900"
                }`}
              >
                {value} <span className="text-steel-400">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="columns-2 gap-3 sm:gap-4 lg:columns-3">
        {visible.map((item) => (
          <figure
            key={item.id}
            className="group relative mb-3 block break-inside-avoid overflow-hidden border border-steel-200 bg-navy-900 sm:mb-4"
          >
            <Image
              src={item.src}
              alt={item.alt}
              width={item.width}
              height={item.height}
              className="h-auto w-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
              loading="lazy"
            />
            {item.caption ? (
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-transparent px-3.5 pb-3 pt-10 text-[11px] font-semibold uppercase leading-snug tracking-[0.1em] text-white">
                {item.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </>
  );
}