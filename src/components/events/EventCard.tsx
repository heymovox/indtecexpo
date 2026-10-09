import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { ExpoEvent } from "@/types/event";
import { cn } from "@/lib/utils";

export function EventCard({
  event,
  compact = false,
  className,
}: {
  event: ExpoEvent;
  compact?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "card card-hover group flex h-full flex-col overflow-hidden",
        className,
      )}
    >
      <Link
        href={`/events/${event.slug}`}
        className="relative block overflow-hidden bg-navy-900"
        tabIndex={-1}
        aria-hidden
      >
        <Image
          src={event.posterImage}
          alt=""
          width={1200}
          height={900}
          className={cn(
            "h-full w-full object-cover object-[50%_35%] transition-transform duration-500 group-hover:scale-[1.04]",
            compact ? "aspect-[16/9]" : "aspect-[4/3]",
          )}
          sizes="(max-width: 768px) 100vw, 400px"
          loading="lazy"
        />
        <span className="absolute left-0 top-0 bg-signal-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
          {event.positioning}
        </span>
        <span className="absolute bottom-0 right-0 bg-navy-950/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-500">
          {event.monthLabel}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="eyebrow eyebrow-dark text-[11px]">
              {event.city}, {event.state}
            </span>
            <h3 className="display-sm mt-3 text-xl text-navy-900 sm:text-2xl">
              {event.dateRangeShort}
            </h3>
          </div>
          <span className="display shrink-0 border border-steel-200 px-2 py-1 text-xs tracking-[0.1em] text-steel-500">
            {event.days} Days
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-steel-600">
          {event.summary}
        </p>

        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-steel-100 pt-4 text-xs text-steel-600">
          <li className="flex items-start gap-2">
            <Icon name="calendar" size={14} className="mt-0.5 shrink-0 text-brand-600" />
            {event.dateLabel}
          </li>
          <li className="flex items-start gap-2">
            <Icon name="map-pin" size={14} className="mt-0.5 shrink-0 text-brand-600" />
            {event.venue.name}
          </li>
        </ul>

        {!compact ? (
          <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-steel-100 pt-4">
            {event.stats.slice(0, 3).map((stat) => (
              <div key={stat.label}>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-steel-500">
                  {stat.label}
                </dt>
                <dd className="display-sm text-lg text-navy-900">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          <Button href={`/events/${event.slug}`} variant="secondary" size="sm" withArrow>
            View Details
          </Button>
          <Button href="/exhibitors/book-your-stall" variant="outline" size="sm">
            Book Stall
          </Button>
        </div>
      </div>
    </article>
  );
}
