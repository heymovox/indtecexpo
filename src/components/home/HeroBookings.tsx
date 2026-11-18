"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { RecentBooking } from "@/data/bookings";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Live booking social-proof card for the top of the hero.
 *
 * Loops through the recent bookings, advancing every few seconds. Pauses on
 * hover and respects reduced-motion. Dots let a visitor jump to a booking.
 */
export function HeroBookings({ bookings }: { bookings: RecentBooking[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (bookings.length < 2) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      if (paused || document.hidden) return;
      setIndex((current) => (current + 1) % bookings.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [bookings.length, paused]);

  if (bookings.length === 0) return null;

  const booking = bookings[index];

  return (
    <div className="mb-8 border border-white/12 bg-white/5 backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-2.5 sm:px-6">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-steel-300">
          Live bookings
        </span>
      </div>

      <div
        className="flex items-center gap-4 px-5 py-6 sm:gap-5 sm:px-6"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* key remounts on change so the entrance animation replays */}
        <div key={index} className="flex min-w-0 flex-1 items-center gap-4 animate-rise">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/15 text-sm font-bold text-gold-400 sm:h-14 sm:w-14 sm:text-base">
            {initials(booking.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white sm:text-base">
              {booking.name}
              <span className="mx-2 text-steel-500">·</span>
              <span className="font-normal text-steel-300">
                {booking.company}
              </span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-steel-400 sm:text-sm">
              Booked a {booking.stall} stall in {booking.city}
              <span className="mx-2 text-steel-600">·</span>
              {booking.ago}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <span className="inline-flex items-center gap-1.5 border border-success-500/45 bg-success-500/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-success-500 sm:text-[11px]">
            <Icon name="check-circle" size={14} />
            Booked successfully
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 border-t border-white/10 px-5 py-2.5">
        {bookings.map((item, i) => (
          <button
            key={item.name}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show booking ${i + 1} of ${bookings.length}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index
                ? "w-5 bg-gold-500"
                : "w-1.5 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
