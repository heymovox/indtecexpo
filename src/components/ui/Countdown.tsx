"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function diff(target: number) {
  const total = Math.max(0, target - Date.now());
  return {
    days: Math.floor(total / 86400000),
    hours: Math.floor((total / 3600000) % 24),
    minutes: Math.floor((total / 60000) % 60),
    seconds: Math.floor((total / 1000) % 60),
    complete: total === 0,
  };
}

export function Countdown({
  target,
  className,
  size = "md",
  label = "Countdown to next event",
}: {
  target: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const [time, setTime] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    const deadline = new Date(target).getTime();
    const tick = () => setTime(diff(deadline));
    // First paint shows the zero state for one frame, then the timer takes over.
    const initial = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(id);
    };
  }, [target]);

  const blocks =
    size === "lg"
      ? "min-w-[76px] px-3 py-3"
      : size === "sm"
        ? "min-w-[52px] px-2 py-2"
        : "min-w-[64px] px-2.5 py-2.5";
  const valueSize =
    size === "lg"
      ? "text-[2.4rem]"
      : size === "sm"
        ? "text-lg"
        : "text-2xl";

  const items = [
    { label: "Days", value: time?.days ?? 0 },
    { label: "Hours", value: time?.hours ?? 0 },
    { label: "Mins", value: time?.minutes ?? 0 },
    { label: "Secs", value: time?.seconds ?? 0 },
  ];

  return (
      <div
        className={cn("flex items-stretch gap-2", className)}
        role="timer"
        aria-label={label}
      >
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex flex-col items-center justify-center border border-white/15 bg-white/5 backdrop-blur",
            blocks,
          )}
        >
          <span
            className={cn(
              "display tabular text-white",
              valueSize,
            )}
          >
            {String(item.value).padStart(2, "0")}
          </span>
          <span className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-gold-500">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
