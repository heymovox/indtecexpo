"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Horizontal list that advances itself on narrow screens.
 *
 * Used by the mobile hero so the edition cards step through one at a time.
 * It only scrolls when the list is actually overflowing, so the desktop grid
 * layout is untouched. Any touch, wheel or key interaction pauses the timer
 * for a while so it never fights the visitor.
 */
export function AutoSlideList({
  children,
  className = "",
  intervalMs = 5200,
}: {
  children: ReactNode;
  className?: string;
  intervalMs?: number;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const pausedUntilRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const pause = () => {
      pausedUntilRef.current = Date.now() + 10000;
    };
    el.addEventListener("pointerdown", pause, { passive: true });
    el.addEventListener("wheel", pause, { passive: true });
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("keydown", pause);

    const step = () => {
      if (document.hidden) return;
      if (Date.now() < pausedUntilRef.current) return;

      const overflow = el.scrollWidth - el.clientWidth;
      if (overflow <= 4) return;

      const items = Array.from(el.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement,
      );
      if (items.length < 2) return;

      const containerLeft = el.getBoundingClientRect().left;
      const current = items.findIndex(
        (item) => Math.abs(item.getBoundingClientRect().left - containerLeft) < 6,
      );
      const next = current === -1 ? 0 : (current + 1) % items.length;

      if (next === 0) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const target = items[next];
        const left =
          target.getBoundingClientRect().left - containerLeft + el.scrollLeft;
        el.scrollTo({ left, behavior: "smooth" });
      }
    };

    const timer = window.setInterval(step, intervalMs);

    return () => {
      window.clearInterval(timer);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("wheel", pause);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("keydown", pause);
    };
  }, [intervalMs]);

  return (
    <ul ref={ref} className={className}>
      {children}
    </ul>
  );
}
