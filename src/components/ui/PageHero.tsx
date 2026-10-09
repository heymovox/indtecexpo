import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  crumbs,
  children,
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  image: string;
  crumbs?: Crumb[];
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <header
      className={cn(
        "relative isolate overflow-hidden bg-navy-950 text-white",
        compact ? "py-16 sm:py-20" : "py-20 sm:py-28 lg:py-32",
      )}
    >
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover opacity-60"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-950/30" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-navy-950 to-transparent" />

      <Container>
        {crumbs && crumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-7">
            <ol className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-steel-400">
              <li>
                <Link href="/" className="transition hover:text-gold-500">
                  Home
                </Link>
              </li>
              {crumbs.map((crumb) => (
                <li key={crumb.label} className="flex items-center gap-2">
                  <span aria-hidden className="text-steel-600">
                    /
                  </span>
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="transition hover:text-gold-500"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-steel-200">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="max-w-3xl">
          {eyebrow ? <span className="eyebrow eyebrow-light mb-4">{eyebrow}</span> : null}
          <h1 className="display text-[clamp(2.1rem,5.5vw,4rem)]">{title}</h1>
          {description ? (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-steel-300 sm:text-lg">
              {description}
            </p>
          ) : null}
        </div>

        {children ? <div className="mt-10">{children}</div> : null}
      </Container>
    </header>
  );
}
