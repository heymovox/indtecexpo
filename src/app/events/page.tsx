import Link from "next/link";

import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/Button";
import { ExhibitorCTA } from "@/components/ui/CTA";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading } from "@/components/ui/Section";
import { getSortedEvents } from "@/data/events";
import { JsonLd, buildMetadata, collectionJsonLd } from "@/lib/seo";
import type { StallOption } from "@/types/event";

export const metadata = buildMetadata({
  title: "Events | INDTEC EXPO 2026–2027 Industrial Expo Calendar",
  description:
    "The complete INDTEC EXPO 2026–2027 calendar — Bengaluru, Coimbatore and Hosur. Compare dates, venues, positioning and stall pricing across three South India B2B industrial expos.",
  path: "/events",
  keywords: [
    "INDTEC Expo calendar",
    "industrial expo South India 2026",
    "machine tools expo 2027",
    "B2B exhibition Bengaluru",
    "manufacturing expo Coimbatore",
    "industrial expo Hosur",
  ],
});

const priceValue = (price: string): number => {
  const digits = price.replace(/[^\d]/g, "");
  return digits ? Number(digits) : Number.MAX_SAFE_INTEGER;
};

const stallsFrom = (options: StallOption[]): string => {
  const sorted = [...options].sort(
    (a, b) => priceValue(a.price) - priceValue(b.price),
  );
  return sorted[0]?.price ?? "On request";
};

export default function EventsPage() {
  const events = getSortedEvents();
  const totalDays = events.reduce((total, event) => total + event.days, 0);

  return (
    <>
      <PageHero
        eyebrow="2026–2027 Calendar"
        title="Three Editions. One Industrial Network."
        description="INDTEC EXPO runs across South India's three most productive industrial belts — each edition positioned for a distinct buyer pool, each built for serious B2B outcomes."
        image="/images/hero/hero-industrial.svg"
      >
        <ul className="flex flex-wrap gap-3">
          {events.map((event) => (
            <li key={event.slug}>
              <Link
                href={`/events/${event.slug}`}
                className="inline-flex items-center gap-3 border border-white/20 bg-white/5 px-4 py-2.5 backdrop-blur-sm transition hover:border-gold-500/60 hover:bg-white/10"
              >
                <span className="display-sm text-sm tracking-[0.14em] text-white">
                  {event.city}
                </span>
                <span className="tabular text-xs font-semibold uppercase tracking-[0.14em] text-gold-500">
                  {event.dateRangeShort}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PageHero>

      {/* Intro + event grid */}
      <Section>
        <SectionHeading
          eyebrow="The Season"
          title="Plan Your Exhibitor Year in One Calendar"
          description="Every INDTEC EXPO edition is designed around a specific industrial identity — an industrial business hub, a manufacturing heartland and a fast-growing industrial corridor. Pick one city or run the full circuit."
        />

        <div className="mb-12 grid gap-6 border-y border-steel-200 py-8 sm:grid-cols-3">
          {[
            { value: String(events.length), label: "Industrial editions" },
            { value: String(totalDays), label: "Business days on floor" },
            { value: "1", label: "Shared exhibitor network" },
          ].map((item) => (
            <div key={item.label} className="flex items-baseline gap-4">
              <span className="display tabular text-4xl text-signal-500">
                {item.value}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-steel-500">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      </Section>

      {/* Comparison table */}
      <Section tone="light">
        <SectionHeading
          eyebrow="Compare Editions"
          title="Dates, Venues & Entry Pricing at a Glance"
          description="A side-by-side view of the three editions so your team can align budgets, travel and stall requirements before the first enquiry goes out."
        />

        <div className="card overflow-x-auto">
          <table className="w-full min-w-[940px] border-collapse text-left">
            <thead>
              <tr className="bg-navy-900 text-white">
                {[
                  "City",
                  "Dates",
                  "Days",
                  "Venue",
                  "Positioning",
                  "Stalls from",
                ].map((head) => (
                  <th
                    key={head}
                    scope="col"
                    className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-steel-300"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.slug}
                  className="border-t border-steel-200 bg-white transition hover:bg-steel-25"
                >
                  <th scope="row" className="px-5 py-5 font-normal">
                    <Link
                      href={`/events/${event.slug}`}
                      className="link-underline inline-flex items-center gap-2 text-navy-900 transition hover:text-brand-600"
                    >
                      <span className="display-sm text-base">{event.city}</span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-500">
                        {event.state}
                      </span>
                      <Icon name="arrow-right" size={14} className="text-signal-500" />
                    </Link>
                  </th>
                  <td className="px-5 py-5 text-sm text-steel-600">
                    {event.dateLabel}
                  </td>
                  <td className="px-5 py-5">
                    <span className="tabular display-sm text-sm text-navy-800">
                      {event.days}
                    </span>
                  </td>
                  <td className="px-5 py-5 text-sm text-steel-600">
                    {event.venue.name}
                    <span className="mt-0.5 block text-xs text-steel-500">
                      {event.venue.locality}, {event.venue.city}
                    </span>
                  </td>
                  <td className="px-5 py-5">
                    <span className="inline-flex border border-signal-100 bg-signal-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-signal-600">
                      {event.positioning}
                    </span>
                  </td>
                  <td className="px-5 py-5">
                    <span className="tabular display-sm text-sm text-brand-700">
                      {stallsFrom(event.stallOptions)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-steel-500">
          Entry pricing shown is the lowest published configuration for each
          edition. Shell scheme, premium and raw space rates, along with
          multi-city package benefits, are confirmed in your enquiry response.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {events.map((event) => (
            <Button
              key={event.slug}
              href={`/events/${event.slug}`}
              variant="outline"
              size="sm"
              withArrow
            >
              {event.city} Details
            </Button>
          ))}
          <Button href="/exhibitors/book-your-stall" variant="primary" size="sm" withArrow>
            Request Rate Card
          </Button>
        </div>
      </Section>

      <ExhibitorCTA
        headline="Pick Your City. We'll Handle the Rest."
        supportingText="Stall availability opens edition by edition. Send your preferred city, stall size and product category — our team responds within one working day with pricing and floor options."
        secondaryLabel="Exhibitor Benefits"
        secondaryHref="/exhibitors/why-exhibit"
      />

      <JsonLd data={collectionJsonLd(events)} />
    </>
  );
}
