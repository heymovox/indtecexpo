"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

export function Accordion({
  items,
  defaultOpenId,
  className,
  tone = "light",
}: {
  items: AccordionItem[];
  defaultOpenId?: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  const [open, setOpen] = useState<string | null>(defaultOpenId ?? items[0]?.id ?? null);

  return (
    <div className={cn("divide-y border", tone === "dark" ? "divide-white/10 border-white/12" : "divide-steel-100 border-steel-200", className)}>
      {items.map((item) => {
        const expanded = open === item.id;
        return (
          <div key={item.id} className={cn(tone === "dark" && "bg-white/[0.03]")}>
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : item.id)}
              aria-expanded={expanded}
              className={cn(
                "flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition sm:px-5",
                tone === "dark"
                  ? "text-white hover:bg-white/5"
                  : "text-navy-800 hover:bg-steel-25",
              )}
            >
              <span className="display-sm text-[0.95rem] leading-snug sm:text-base">
                {item.question}
              </span>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center border transition",
                  expanded
                    ? "border-signal-500 bg-signal-500 text-white"
                    : tone === "dark"
                      ? "border-white/25 text-white"
                      : "border-steel-300 text-steel-600",
                )}
              >
                <Icon name={expanded ? "minus" : "plus"} size={15} />
              </span>
            </button>
            <div
              className={cn(
                "grid transition-all duration-300",
                expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p
                  className={cn(
                    "px-4 pb-5 text-sm leading-relaxed sm:px-5",
                    tone === "dark" ? "text-steel-300" : "text-steel-600",
                  )}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
