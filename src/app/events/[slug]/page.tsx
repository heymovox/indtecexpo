import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventCard } from "@/components/events/EventCard";
import { HighlightGallery } from "@/components/events/HighlightGallery";
import { Button } from "@/components/ui/Button";
import { Countdown } from "@/components/ui/Countdown";
import { ExhibitorCTA, StatStrip } from "@/components/ui/CTA";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Badge, Section, SectionHeading } from "@/components/ui/Section";
import { eventBySlug, eventSlugs, getSortedEvents } from "@/data/events";
import {
  JsonLd,
  breadcrumbJsonLd,
  buildMetadata,
  eventJsonLd,
} from "@/lib/seo";
import { formatDateTime } from "@/lib/utils";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return eventSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: EventPageProps) {
  const { slug } = await params;
  const event = eventBySlug(slug);

  if (!event) {
    return buildMetadata({
      title: "Event Not Found",
      description: "The requested INDTEC EXPO edition could not be found.",
      path: "/events",
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${event.name} | ${event.dateRangeShort} · ${event.venue.name}`,
    description: `${event.summary} ${event.city} edition, ${event.dateLabel} at ${event.venue.name} — explore highlights, schedule, stall options and the floor plan.`,
    path: `/events/${event.slug}`,
    image: event.image,
    keywords: [
      `${event.city} industrial expo`,
      `${event.city} machine tools exhibition`,
      `${event.name}`,
      "B2B industrial exhibition India",
    ],
  });
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = eventBySlug(slug);

  if (!event) notFound();

  const relatedEvents = getSortedEvents().filter(
    (item) => item.slug !== event.slug,
  );

  return (
    <>
      {/* ---------------------------------------------------------- */}
      {/* Hero + countdown + key dates                                */}
      {/* ---------------------------------------------------------- */}
      <PageHero
        eyebrow={`${event.edition} Edition · ${event.positioning}`}
        title={event.name}
        description={event.summary}
        image={event.heroImage}
        crumbs={[{ label: "Events", href: "/events" }, { label: event.city }]}
      >
        <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-end">
          <div>
            <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-steel-400">
              Countdown to {event.city}
            </p>
            <Countdown target={event.startDate} size="lg" />
          </div>

          <div className="border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="border border-success-500/45 bg-success-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-success-500">
                Bookings Open
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-steel-400">
                Key Dates & Venue
              </span>
            </div>

            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-steel-400">
                  Show Dates
                </dt>
                <dd className="display-sm mt-1 text-base text-white">
                  {event.dateLabel}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-steel-400">
                  Business Days
                </dt>
                <dd className="display-sm tabular mt-1 text-base text-white">
                  {event.days} Days
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-steel-400">
                  Venue
                </dt>
                <dd className="mt-1 text-sm text-steel-200">
                  {event.venue.name}, {event.venue.locality}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-steel-400">
                  Opens
                </dt>
                <dd className="tabular mt-1 text-sm text-steel-200">
                  {formatDateTime(event.startDate)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button href="/exhibitors/book-your-stall" variant="gold" size="sm" withArrow>
                Book Your Stall
              </Button>
              <Button href={`/events/${event.slug}#stall-options`} variant="outline-light" size="sm">
                Stall Options
              </Button>
            </div>
          </div>
        </div>
      </PageHero>

      {/* ---------------------------------------------------------- */}
      {/* About this edition                                          */}
      {/* ---------------------------------------------------------- */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="About the Edition"
              title={`${event.city}: ${event.positioning}`}
              description={`Why the ${event.city} edition matters for exhibitors targeting South India's industrial buyers.`}
            />
            <div className="space-y-5">
              {event.description.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="text-base leading-relaxed text-steel-600 sm:text-lg"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {event.sectors.map((sector) => (
                <Badge key={sector}>{sector}</Badge>
              ))}
            </div>
          </div>

          <aside className="card p-6 sm:p-7">
            <span className="eyebrow eyebrow-dark">Exhibitor Snapshot</span>
            <dl className="mt-5 divide-y divide-steel-100">
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-steel-500">
                  Edition
                </dt>
                <dd className="display-sm text-sm text-navy-900">
                  INDTEC EXPO {event.edition}
                </dd>
              </div>
              {event.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-baseline justify-between gap-4 py-3"
                >
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-steel-500">
                    {stat.label}
                  </dt>
                  <dd className="display-sm tabular text-sm text-navy-900">
                    {stat.value}
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-steel-500">
                  From
                </dt>
                <dd className="display-sm tabular text-sm text-brand-700">
                  {event.stallOptions[0]?.price ?? "On request"}
                </dd>
              </div>
            </dl>

            <Button
              href="/exhibitors/book-your-stall"
              variant="primary"
              size="sm"
              withArrow
              className="mt-5 w-full"
            >
              Enquire for {event.city}
            </Button>
          </aside>
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Official poster                                              */}
      {/* ---------------------------------------------------------- */}
      <Section tone="light" className="pt-0">
        <figure className="overflow-hidden border border-steel-200 bg-white">
          <Image
            src={event.posterImage}
            alt={`${event.name} official poster — ${event.dateRangeShort}, ${event.venue.name}`}
            width={1200}
            height={900}
            className="h-auto w-full"
            sizes="(max-width: 1280px) 100vw, 1184px"
            loading="lazy"
          />
          <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-steel-200 px-4 py-3 text-xs text-steel-500">
            <span>
              Official {event.city} edition poster · {event.dateRangeShort} ·{" "}
              {event.venue.name}
            </span>
            <span className="font-semibold uppercase tracking-[0.12em] text-navy-800">
              {event.edition} Edition
            </span>
          </figcaption>
        </figure>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Stats                                                       */}
      {/* ---------------------------------------------------------- */}
      <Section tone="muted" className="grid-surface-dark">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="eyebrow eyebrow-light mb-4">By the Numbers</span>
            <h2 className="display text-[clamp(1.8rem,3.4vw,2.75rem)]">
              The {event.city} Edition in Figures
            </h2>
            <p className="mt-4 text-base leading-relaxed text-steel-300">
              A concentrated trade audience of capital-equipment buyers, drawn
              from the {event.venue.state} industrial belt and neighbouring
              states, over {event.days} focused business days.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {event.sectors.map((sector) => (
                <Badge key={sector} tone="outline">
                  {sector}
                </Badge>
              ))}
            </div>
          </div>
          <StatStrip items={event.stats} />
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Highlights                                                  */}
      {/* ---------------------------------------------------------- */}
      <Section tone="light">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Show Highlights"
              title={`What ${event.city} Gives You on the Floor`}
              description="A programme engineered around meetings, demonstrations and delegation traffic — not passive footfall."
            />
            <ul className="space-y-4">
              {event.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex gap-4 border-b border-steel-200 pb-4 last:border-0 last:pb-0"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-brand-100 bg-brand-50 text-brand-600">
                    <Icon name="check" size={17} strokeWidth={2} />
                  </span>
                  <span className="text-sm leading-relaxed text-steel-700 sm:text-base">
                    {highlight}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card overflow-hidden">
            {event.highlightImages?.length ? (
              <HighlightGallery
                images={event.highlightImages}
                label={event.positioning}
              />
            ) : (
              <div className="relative bg-navy-900">
                <Image
                  src={event.image}
                  alt={`${event.city} INDTEC EXPO exhibition floor`}
                  width={720}
                  height={405}
                  className="aspect-[16/9] w-full object-cover"
                  sizes="(max-width: 1024px) 100vw, 560px"
                  loading="lazy"
                />
                <span className="absolute bottom-0 left-0 bg-navy-950/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-500">
                  {event.positioning}
                </span>
              </div>
            )}
            <div className="p-6">
              <h3 className="display-sm text-lg text-navy-900">
                Sectors on Show
              </h3>
              <ul className="mt-4 grid gap-3">
                {event.sectors.map((sector) => (
                  <li
                    key={sector}
                    className="flex items-center justify-between gap-3 border-b border-steel-100 pb-3 text-sm text-steel-600 last:border-0 last:pb-0"
                  >
                    <span>{sector}</span>
                    <Icon
                      name="chevron-right"
                      size={15}
                      className="shrink-0 text-signal-500"
                    />
                  </li>
                ))}
              </ul>
              <Button
                href="/exhibitors/exhibitor-profile"
                variant="outline"
                size="sm"
                withArrow
                className="mt-5"
              >
                Full Exhibitor Profile
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Day-by-day schedule                                         */}
      {/* ---------------------------------------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="Day-by-Day Programme"
          title={`${event.days} Days, Structured for Business`}
          description={`The running order for ${event.city} — inauguration, demonstration days, buyer connects and closing sessions.`}
        />

        <ol className="space-y-4">
          {event.schedule.map((item) => (
            <li key={item.day} className="card overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-steel-200 bg-steel-50 px-5 py-4 sm:w-40 sm:flex-col sm:items-start sm:justify-center sm:gap-1 sm:border-b-0 sm:border-r sm:px-5">
                  <span className="display-sm text-sm text-signal-500">
                    {item.day}
                  </span>
                  <span className="tabular text-xs font-semibold uppercase tracking-[0.14em] text-steel-500">
                    {item.date}
                  </span>
                </div>
                <div className="px-5 py-5 sm:px-7 sm:py-6">
                  <h3 className="display-sm text-lg text-navy-900 sm:text-xl">
                    {item.label}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-steel-600 sm:text-base">
                    {item.detail}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Stall options                                               */}
      {/* ---------------------------------------------------------- */}
      <Section id="stall-options" tone="light">
        <SectionHeading
          eyebrow="Stall Options"
          title={`Book ${event.city} Space in Three Configurations`}
          description="Raw space for custom builds, shell scheme for a fast turnkey setup, and premium corner space for high-visibility showcases."
          action={
            <Button href="/exhibitors/book-your-stall" variant="primary" withArrow>
              Get Availability
            </Button>
          }
        />

        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="bg-navy-900 text-white">
                {["Configuration", "Size", "Price", "What's included"].map(
                  (head) => (
                    <th
                      key={head}
                      scope="col"
                      className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-steel-300"
                    >
                      {head}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {event.stallOptions.map((option) => (
                <tr
                  key={option.id}
                  className="border-t border-steel-200 bg-white align-top transition hover:bg-steel-25"
                >
                  <th scope="row" className="px-5 py-5 font-normal">
                    <span className="display-sm text-base text-navy-900">
                      {option.name}
                    </span>
                  </th>
                  <td className="tabular px-5 py-5 text-sm text-steel-600">
                    {option.size}
                  </td>
                  <td className="px-5 py-5">
                    <span className="tabular display-sm text-base text-brand-700">
                      {option.price}
                    </span>
                  </td>
                  <td className="px-5 py-5">
                    <ul className="flex flex-wrap gap-2">
                      {option.includes.map((item) => (
                        <li
                          key={item}
                          className="border border-steel-200 bg-steel-50 px-2.5 py-1 text-xs text-steel-600"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button href="/exhibitors/book-your-stall" variant="primary" size="lg" withArrow>
            Book Your Stall in {event.city}
          </Button>
          <Button href="/floor-plan" variant="outline" size="lg">
            Download Floor Plan
          </Button>
        </div>

        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-steel-500">
          Machinery foundation, three-phase power and custom fabrication are
          quoted separately after stall allocation. Multi-city participants
          receive volume benefits across the {event.city} edition and the other
          two INDTEC EXPO cities.
        </p>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Venue + floor plan                                          */}
      {/* ---------------------------------------------------------- */}
      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card flex flex-col p-6 sm:p-8">
            <span className="eyebrow eyebrow-dark">Venue</span>
            <h2 className="display mt-4 text-[clamp(1.6rem,3vw,2.25rem)] text-navy-900">
              {event.venue.name}
            </h2>

            <address className="mt-4 not-italic text-sm leading-relaxed text-steel-600">
              {event.venue.address}
              <br />
              {event.venue.locality}, {event.venue.city}, {event.venue.state}
            </address>

            <dl className="mt-6 divide-y divide-steel-100 border-y border-steel-100">
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-steel-500">
                  Show Dates
                </dt>
                <dd className="tabular text-sm font-semibold text-navy-800">
                  {event.dateRangeShort}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-steel-500">
                  Duration
                </dt>
                <dd className="tabular text-sm font-semibold text-navy-800">
                  {event.days} business days
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-steel-500">
                  Edition
                </dt>
                <dd className="text-sm font-semibold text-navy-800">
                  {event.positioning}
                </dd>
              </div>
            </dl>

            <div className="mt-auto flex flex-wrap gap-3 pt-7">
              <Button href={event.venue.mapUrl} variant="secondary" size="sm" withArrow>
                View on Google Maps
              </Button>
              <Button href={event.venue.directionsUrl} variant="outline" size="sm">
                Get Directions
              </Button>
            </div>
          </div>

          <div className="card flex flex-col overflow-hidden">
            <div className="border-b border-steel-200 bg-steel-50 px-6 py-4">
              <span className="eyebrow eyebrow-dark text-[12px]">
                Floor Plan · {event.city}
              </span>
            </div>
            <div className="relative bg-white p-4 sm:p-6">
              <Image
                src={event.floorPlanImage}
                alt={`Floor plan of ${event.venue.name} for INDTEC EXPO ${event.city}`}
                width={960}
                height={600}
                className="h-auto w-full border border-steel-200"
                sizes="(max-width: 1024px) 100vw, 560px"
                loading="lazy"
              />
            </div>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-steel-200 px-6 py-5">
              <p className="text-xs leading-relaxed text-steel-500">
                Explore aisles, corner positions and zone allocation before you
                choose a stall.
              </p>
              <Button href="/floor-plan" variant="outline" size="sm" withArrow>
                Open Floor Plan
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Related editions                                            */}
      {/* ---------------------------------------------------------- */}
      <Section tone="light">
        <SectionHeading
          eyebrow="Continue the Circuit"
          title="Other INDTEC EXPO Editions"
          description="Two more industrial hubs, one exhibitor relationship. Compare the calendar and build a multi-city programme."
          action={
            <Button href="/events" variant="outline" withArrow>
              All Events
            </Button>
          }
        />

        <div className="grid gap-6 md:grid-cols-2">
          {relatedEvents.map((item) => (
            <EventCard key={item.slug} event={item} />
          ))}
        </div>

        <p className="mt-8 text-sm text-steel-600">
          Looking for cross-edition rates?{" "}
          <Link
            href="/exhibitors/book-your-stall"
            className="link-underline font-semibold text-brand-600"
          >
            Send one enquiry for all three cities
          </Link>{" "}
          and our team will structure a single package for you.
        </p>
      </Section>

      <ExhibitorCTA
        headline={`Showcase in ${event.city} — ${event.dateRangeShort}`}
        supportingText={`Stalls for the ${event.city} edition are allocated in order of enquiry. Share your stall size and product category to receive availability, pricing and a proforma within one working day.`}
        secondaryLabel="Exhibitor Profile"
        secondaryHref="/exhibitors/exhibitor-profile"
      />

      <JsonLd data={eventJsonLd(event)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Events", path: "/events" },
          { name: event.city, path: `/events/${event.slug}` },
        ])}
      />
    </>
  );
}
