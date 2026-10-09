"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function HighlightGallery({
  images,
  label,
  className,
}: {
  images: { src: string; alt: string }[];
  label: string;
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  if (!current) return null;

  return (
    <div className={className}>
      <div className="relative bg-navy-900">
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt}
          width={1000}
          height={750}
          className="aspect-[4/3] w-full object-cover"
          sizes="(max-width: 1024px) 100vw, 560px"
          loading="lazy"
        />

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-navy-950/85 px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-500">
            {label}
          </span>
          <span className="tabular text-[11px] text-steel-400">
            {active + 1} / {images.length}
          </span>
        </div>

        {images.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() =>
                setActive((i) => (i - 1 + images.length) % images.length)
              }
              className="absolute left-0 top-0 flex h-full w-11 items-start justify-start bg-gradient-to-r from-navy-950/70 to-transparent pt-2 pl-1 text-white/80 transition hover:text-gold-500"
            >
              <Icon name="chevron-right" size={18} className="-rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => setActive((i) => (i + 1) % images.length)}
              className="absolute right-0 top-0 flex h-full w-11 items-start justify-end bg-gradient-to-l from-navy-950/70 to-transparent pt-2 pr-1 text-white/80 transition hover:text-gold-500"
            >
              <Icon name="chevron-right" size={18} />
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 border-x border-b border-steel-200 bg-white p-2">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === active}
              className={cn(
                "relative overflow-hidden border transition",
                index === active
                  ? "border-brand-600"
                  : "border-transparent hover:border-steel-300",
              )}
            >
              <Image
                src={image.src}
                alt=""
                width={1000}
                height={750}
                className="aspect-[4/3] w-full object-cover"
                sizes="140px"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
