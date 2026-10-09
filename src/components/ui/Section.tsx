import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1280px] px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "white" | "light" | "dark" | "muted";
  containerless?: boolean;
}

const toneClass: Record<NonNullable<SectionProps["tone"]>, string> = {
  white: "bg-white",
  light: "bg-steel-50",
  dark: "bg-navy-900 text-white",
  muted: "bg-navy-950 text-white",
};

export function Section({
  children,
  className,
  id,
  tone = "white",
  containerless = false,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-16 sm:py-20 lg:py-24",
        toneClass[tone],
        className,
      )}
    >
      {containerless ? (
        children
      ) : (
        <Container>{children}</Container>
      )}
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
  action?: ReactNode;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
  className,
  action,
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "mb-10 sm:mb-14 flex flex-col gap-5",
        centered && "items-center text-center",
        Boolean(action) && "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-3xl", centered && "mx-auto")}>
        {eyebrow ? (
          <span
            className={cn(
              "eyebrow mb-4",
              tone === "dark" ? "eyebrow-dark" : "eyebrow-light",
            )}
          >
            {eyebrow}
          </span>
        ) : null}
        <h2
          className={cn(
            "display text-[clamp(1.9rem,4vw,3rem)]",
            tone === "light" ? "text-white" : "text-navy-900",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-4 text-base leading-relaxed sm:text-lg",
              tone === "light" ? "text-steel-300" : "text-steel-600",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "brand",
  className,
}: {
  children: ReactNode;
  tone?: "brand" | "gold" | "red" | "outline" | "success";
  className?: string;
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-700 border-brand-200",
    gold: "bg-gold-50 text-gold-700 border-gold-300",
    red: "bg-signal-50 text-signal-600 border-signal-100",
    outline: "bg-white/10 text-white border-white/25",
    success: "bg-success-50 text-success-500 border-success-500/30",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function IconTile({
  icon,
  tone = "brand",
  size = "md",
  className,
}: {
  icon: IconName;
  tone?: "brand" | "gold" | "red" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600 border-brand-100",
    gold: "bg-gold-50 text-gold-700 border-gold-100",
    red: "bg-signal-50 text-signal-600 border-signal-100",
    dark: "bg-navy-800 text-white border-navy-700",
  } as const;
  const sizes = {
    sm: "h-9 w-9",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  } as const;
  const iconSize = { sm: 18, md: 22, lg: 30 } as const;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border",
        tones[tone],
        sizes[size],
        className,
      )}
    >
      <Icon name={icon} size={iconSize[size]} strokeWidth={1.5} />
    </span>
  );
}
