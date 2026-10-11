import Image from "next/image";
import { Container } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { seriesStats } from "@/data/events";
import { cn } from "@/lib/utils";

export function ExhibitorCTA({
  headline = "Powering Industries for a Stronger Tomorrow",
  supportingText = "Showcase your products. Connect with decision-makers. Generate business opportunities.",
  highlight = "Special Exhibitor Offers Available",
  primaryLabel = "Book Your Stall Today",
  primaryHref = "/exhibitors/book-your-stall",
  secondaryLabel = "Download Floor Plan",
  secondaryHref = "/floor-plan",
  image = "/images/hero/hero-book-stall.svg",
}: {
  headline?: string;
  supportingText?: string;
  highlight?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  image?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 text-white">
      <Image
        src={image}
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover opacity-30"
        loading="lazy"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/92 to-navy-950/55" />
      <div className="hatch-surface absolute inset-x-0 top-0 -z-10 h-1.5" />

      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <span className="eyebrow eyebrow-light mb-5 inline-flex">
              Exhibitor Opportunity
            </span>
            <h2 className="display text-[clamp(2rem,4.6vw,3.5rem)]">
              {headline}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-steel-300 sm:text-lg">
              {supportingText}
            </p>

            <div className="mt-7 inline-flex items-center gap-3 border border-gold-500/45 bg-gold-500/10 px-4 py-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-500 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-500" />
              </span>
              <span className="display-sm text-sm tracking-[0.16em] text-gold-500">
                {highlight}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={primaryHref} variant="primary" size="lg" withArrow>
                {primaryLabel}
              </Button>
              <Button href={secondaryHref} variant="outline-light" size="lg">
                {secondaryLabel}
              </Button>
            </div>
          </div>

          <ul className="grid gap-3 border-l border-white/10 pl-0 lg:pl-10">
            {seriesStats.map(({ value, label }) => (
              <li
                key={label}
                className="flex items-baseline gap-4 border-b border-white/10 pb-3 last:border-0"
              >
                <span className="display tabular text-3xl text-gold-500">
                  {value}
                </span>
                <span className="text-sm uppercase tracking-[0.14em] text-steel-400">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

export function StatStrip({
  items,
  className,
}: {
  items: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 divide-white/10 border border-white/12 bg-white/5 sm:grid-cols-4 sm:divide-x",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="px-5 py-6 text-center">
          <div className="display tabular text-3xl text-gold-500 sm:text-4xl">
            {item.value}
          </div>
          <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-steel-400">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
