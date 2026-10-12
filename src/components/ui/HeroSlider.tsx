"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  {
    src: "/images/hero/hero-precision-milling.webp",
    alt: "Precision CNC milling machine cutting a metal component on an industrial workshop floor",
  },
  {
    src: "/images/hero/hero-torch-sparks.webp",
    alt: "Fabricator using a torch on metal with sparks flying across a dark industrial workshop",
  },
  {
    src: "/images/hero/hero-robotic-welding.webp",
    alt: "Automated robotic welding cell welding metal components in a modern manufacturing plant",
  },
];

/* How long a slide is held before the crossfade starts. */
const HOLD_MS = 6000;
/* Crossfade length — deliberately well under HOLD_MS so there is a clear gap. */
const FADE_MS = 1400;

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      // Don't burn through the deck while the tab is in the background.
      if (document.hidden) return;
      setIndex((current) => (current + 1) % slides.length);
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="absolute inset-0 -z-10" aria-hidden={reduceMotion}>
      {slides.map((slide, slideIndex) => {
        const active = slideIndex === index;
        return (
          <Image
            key={slide.src}
            src={slide.src}
            alt={active ? slide.alt : ""}
            fill
            priority={slideIndex === 0}
            sizes="100vw"
            aria-hidden={!active}
            className={
              "object-cover transition-opacity ease-in-out motion-reduce:transition-none " +
              (active ? "opacity-100" : "opacity-0")
            }
            style={{ transitionDuration: `${FADE_MS}ms` }}
          />
        );
      })}
    </div>
  );
}
