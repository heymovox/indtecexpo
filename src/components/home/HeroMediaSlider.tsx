"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export interface HeroSlide {
  src: string;
  alt: string;
}

/**
 * Auto-advancing image strip shown above the edition cards on the mobile hero.
 *
 * Crossfades rather than sliding so the tall hero does not jitter, and pauses
 * on hover/focus or when the visitor prefers reduced motion.
 */
export function HeroMediaSlider({
  slides,
  intervalMs = 4500,
  className = "",
}: {
  slides: HeroSlide[];
  intervalMs?: number;
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (slides.length < 2) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      if (pausedRef.current || document.hidden) return;
      setActive((current) => (current + 1) % slides.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [slides.length, intervalMs]);

  if (slides.length === 0) return null;

  return (
    <div
      className={`group relative isolate overflow-hidden border border-white/15 bg-navy-900 ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="INDTEC EXPO on the show floor"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative aspect-[16/10] w-full">
        {slides.map((slide, index) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={index === active ? slide.alt : ""}
            aria-hidden={index === active ? undefined : true}
            fill
            priority={index === 0}
            sizes="(max-width: 1024px) 100vw, 420px"
            className={`object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none ${
              index === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-3 pb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel-300">
            Live on the floor
          </span>

          <div className="flex items-center gap-1.5" role="tablist" aria-label="Choose slide">
            {slides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={`Show slide ${index + 1} of ${slides.length}`}
                onClick={() => setActive(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === active
                    ? "w-6 bg-gold-500"
                    : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
