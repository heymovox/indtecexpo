import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading, Badge } from "@/components/ui/Section";
import { StallPlanView } from "@/components/exhibitors/StallPlanView";
import { getSortedEvents } from "@/data/events";
import {
  formatRupees,
  getStallPlan,
  listStallCodes,
} from "@/data/floorPlans";
import { buildMetadata } from "@/lib/seo";
import { whatsappLinks } from "@/lib/whatsapp";
import { listFloorPlanAssets, type FloorPlanAssets } from "@/lib/db";

export const metadata = buildMetadata({
  title: "Floor Plan & Stall Layout",
  description:
    "View the INDTEC EXPO 2026–2027 floor plans for Bengaluru, Coimbatore and Hosur. Every stall position, its dimensions and the pricing for each edition.",
  path: "/floor-plan",
    card: "floor-plan",
});

export const revalidate = 300;

const zoningNotes: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "map",
    title: "Sector-Based Zoning",
    text: "The floor is organised by product group — machine tools and automation occupy the primary halls, with components, electricals and services arranged along the connecting aisles so buyers can walk a complete procurement route.",
  },
  {
    icon: "stall",
    title: "Aisle Widths",
    text: "Main spine aisles run 4 m wide for machinery movement and heavy footfall; secondary cross aisles are 3 m. Premium corner stalls sit on the spine for maximum visibility.",
  },
  {
    icon: "layers",
    title: "Live Demonstration Bays",
    text: "Designated floor-strengthened bays along the northern edge of each hall support running machinery, coolant systems and live cutting demonstrations. Power and foundation requirements are scoped at booking.",
  },
  {
    icon: "ticket",
    title: "Entry & Registration",
    text: "The registration pavilion sits between the main entrance and the first hall, with fast-track lanes for pre-registered visitors, group delegation entry and exhibitor badge collection.",
  },
  {
    icon: "display",
    title: "Conference Theatre",
    text: "The Industry 4.0 conference theatre is placed adjacent to the automation zone, with seating for 150 and open access for all registered visitors.",
  },
  {
    icon: "service",
    title: "Support Facilities",
    text: "Exhibitor service desks, freight access gates, medical aid, food court and buyer lounges are marked on every plan. Freight movement is permitted outside show hours only.",
  },
];

export default async function FloorPlanPage() {
  const events = getSortedEvents();
  const bengaluruPlan = getStallPlan("bengaluru");

  // Uploaded artwork per city. A database outage must not take the page down,
  // since the interactive stall grid below is rendered from static data.
  let assets: Record<string, FloorPlanAssets> = {};
  try {
    const rows = await listFloorPlanAssets();
    assets = Object.fromEntries(rows.map((row) => [row.slug, row]));
  } catch (error) {
    console.error("[floor-plan] could not load uploaded assets", error);
  }

  return (
    <>
      <PageHero
        eyebrow="Floor Plan"
        title="Plan Your Stall. Plan Your Walk."
        description="Every INDTEC EXPO edition is laid out for business flow — sector zones, demonstration bays and buyer registration positioned so footfall reaches every aisle. View the plans below."
        image="/images/hero/hero-floorplan.svg"
        crumbs={[{ label: "Floor Plan" }]}
        compact
      >
        <div className="flex flex-wrap gap-3">
          <Button href="#plans" variant="primary" size="lg" withArrow>
            View Floor Plans
          </Button>
          <Button href="/exhibitors/book-your-stall" variant="gold" size="lg">
            Book a Stall
          </Button>
        </div>
      </PageHero>

      {/* Zoning notes */}
      <Section>
        <SectionHeading
          eyebrow="How the Floor Is Organised"
          title="Zoning & Aisle Notes"
          description="Consistent layout logic across all three editions means exhibitors and visitors navigate the same way — whichever city they walk."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {zoningNotes.map((note) => (
            <article key={note.title} className="card h-full p-6">
              <span className="flex h-11 w-11 items-center justify-center border border-brand-100 bg-brand-50 text-brand-600">
                <Icon name={note.icon} size={20} strokeWidth={1.5} />
              </span>
              <h3 className="display-sm mt-4 text-base text-navy-900">
                {note.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-steel-600">
                {note.text}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* Per-event plans */}
      {events.map((event, index) => {
        const plan = getStallPlan(event.slug);
        const stallCount = plan ? listStallCodes(plan).length : null;

        return (
          <Section
            key={event.slug}
            tone={index % 2 === 0 ? "light" : "white"}
            id={index === 0 ? "plans" : undefined}
          >
            <SectionHeading
              eyebrow={`${event.city} Edition · ${event.dateRangeShort}`}
              title={`${event.city} Floor Plan`}
              description={`${event.venue.name}, ${event.venue.locality}. ${
                stallCount
                  ? `${stallCount} stall positions shown below.`
                  : ""
              }`}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  {assets[event.slug]?.pdfKey ? (
                    <a
                      href={`/floor-plan/asset/${event.slug}/pdf`}
                      className="inline-flex items-center gap-2 border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-navy-900 hover:text-white"
                    >
                      <Icon name="download" size={15} />
                      {assets[event.slug]?.pdfLabel || "Download floor plan"}
                    </a>
                  ) : null}
                  <Button href={`/events/${event.slug}`} variant="outline" size="sm">
                    Event Details
                  </Button>
                </div>
              }
            />

            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div className="min-w-0 space-y-6">
                {/* Official artwork uploaded from the admin dashboard takes
                    precedence; the interactive stall grid always stays live
                    below it because it drives stall booking. */}
                {assets[event.slug]?.imageKey ? (
                  <figure className="overflow-hidden border border-steel-200 bg-white">
                    <Image
                      src={`/floor-plan/asset/${event.slug}/image`}
                      alt={
                        assets[event.slug]?.imageAlt ||
                        `${event.city} exhibition floor plan`
                      }
                      width={1600}
                      height={1100}
                      className="h-auto w-full bg-white object-contain"
                      sizes="(max-width: 1024px) 100vw, 52vw"
                    />
                    <figcaption className="border-t border-steel-200 px-4 py-2.5 text-xs text-steel-600">
                      Official {event.city} floor plan.
                    </figcaption>
                  </figure>
                ) : null}

                {plan ? (
                  <div className="min-w-0">
                    <h3 className="display-sm mb-3 text-base text-navy-900">
                      Bookable stalls
                    </h3>
                    <StallPlanView plan={plan} />
                  </div>
                ) : null}
              </div>

            <div className="min-w-0">
              <h3 className="display-sm text-lg text-navy-900 sm:text-xl">
                Stall Dimensions & Pricing
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-steel-600">
                All configurations below are available for the {event.city}{" "}
                edition. Customised inline and island layouts are quoted on
                request.
              </p>

              <div className="mt-5 overflow-x-auto border border-steel-200 bg-white">
                <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-navy-900 text-white">
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]">
                        Configuration
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]">
                        Size
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]">
                        Price
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]">
                        Includes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-steel-100">
                    {event.stallOptions.map((option) => (
                      <tr key={option.id} className="align-top">
                        <td className="px-4 py-3.5">
                          <span className="display-sm text-base text-navy-900">
                            {option.name}
                          </span>
                        </td>
                        <td className="tabular px-4 py-3.5 text-steel-600">
                          {option.size}
                        </td>
                        <td className="tabular px-4 py-3.5 font-semibold text-navy-800">
                          {option.price}
                        </td>
                        <td className="px-4 py-3.5">
                          <ul className="space-y-1 text-xs text-steel-600">
                            {option.includes.map((item) => (
                              <li key={item} className="flex items-start gap-1.5">
                                <Icon
                                  name="check"
                                  size={13}
                                  className="mt-0.5 shrink-0 text-success-500"
                                />
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

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button href="/exhibitors/book-your-stall" variant="primary" withArrow>
                  Book a Stall — {event.city}
                </Button>
                <Button href={whatsappLinks.floorPlan} variant="outline">
                  <Icon name="whatsapp" size={16} className="mr-1.5" />
                  Ask About Availability
                </Button>
              </div>

                <div className="mt-6 flex flex-wrap gap-2">
                {event.sectors.map((sector) => (
                  <Badge key={sector} tone="brand">
                    {sector}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Section>
        );
      })}

      {/* Footer CTA */}
      <Section tone="muted" className="grid-surface-dark">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <span className="eyebrow eyebrow-light mb-4">Ready to Exhibit</span>
            <h2 className="display text-[clamp(1.8rem,3.6vw,2.75rem)]">
              Pick Your Position on the Floor
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-steel-300">
              Corner spaces on the spine aisles and demonstration bays are
              allocated first. Submit an enquiry with your preferred edition and
              stall size — our team responds within one working day with an
              availability chart.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/exhibitors/book-your-stall" variant="primary" size="lg" withArrow>
                Book Your Stall
              </Button>
              <Button href={whatsappLinks.floorPlan} variant="gold" size="lg">
                <Icon name="whatsapp" size={18} className="mr-1.5" />
                WhatsApp for Plans
              </Button>
            </div>
          </div>

          {/* Derived from the Bengaluru plan and its space schemes rather than
              hardcoded, so this list cannot drift from the pricing above. */}
          <ul className="space-y-4 border-l border-white/10 lg:pl-10">
            {(bengaluruPlan
              ? [
                  ...Object.values(bengaluruPlan.types)
                    .filter((type) => !type.sponsorship)
                    .sort((a, b) => b.area - a.area)
                    .map((type) => ({
                      label: type.name,
                      value: `${type.dimensions} · ${type.area} m²`,
                    })),
                  ...bengaluruPlan.schemes.map((scheme) => ({
                    label: scheme.name,
                    value: `${formatRupees(scheme.pricePerSqM)} / m²`,
                  })),
                ]
              : []
            ).map((item) => (
              <li
                key={item.label}
                className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-3 last:border-0"
              >
                <span className="text-sm uppercase tracking-[0.14em] text-steel-400">
                  {item.label}
                </span>
                <span className="display-sm tabular text-lg text-gold-500">
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
