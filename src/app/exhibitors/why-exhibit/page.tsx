import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { ExhibitorCTA } from "@/components/ui/CTA";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { IconTile, Section, SectionHeading } from "@/components/ui/Section";
import { getSortedEvents } from "@/data/events";
import { whyExhibitBenefits } from "@/data/exhibitors";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Why Exhibit | Exhibitor Benefits at INDTEC EXPO",
  description:
    "A detailed look at the six exhibitor benefits at INDTEC EXPO 2026–2027 — decision-maker access, quality leads, channel networks, live product showcases, partnerships and brand strength across three cities.",
  path: "/exhibitors/why-exhibit",
  keywords: [
    "why exhibit industrial expo",
    "exhibitor benefits B2B expo India",
    "ROI industrial trade show",
    "multi-city expo package India",
  ],
});

const benefitDetails: { lead: string; points: string[] }[] = [
  {
    lead: "Capital equipment is rarely bought from a banner ad. It is bought after a plant manager sees a machine run, asks a question and gets an answer from the person who built it. INDTEC EXPO puts you in that conversation for three to four consecutive days per city.",
    points: [
      "Pre-scheduled buyer–seller meetings arranged around your product category",
      "Delegation visits from state industry bodies and manufacturing associations",
      "A trade-only floor — entry is verified for industry professionals",
    ],
  },
  {
    lead: "Exhibition leads arrive with intent. Visitors walk the floor to solve a capacity, quality or cost problem, which means your team spends its time qualifying real requirements instead of chasing cold contact lists.",
    points: [
      "Enquiries captured at the stand are logged, tagged and follow-up ready",
      "Application-led demos convert walk-pasts into specification discussions",
      "Longer sales cycles compress into a few concentrated show days",
    ],
  },
  {
    lead: "South India's distributor network is relationship-driven and spread across three distinct markets. One season of INDTEC EXPO lets you recruit, review and motivate channel partners without planning three separate roadshows.",
    points: [
      "Bengaluru, Coimbatore and Hosur each carry a different dealer base",
      "Structured networking sessions with regional trade associations",
      "Existing partners can be hosted and re-energised on your stand",
    ],
  },
  {
    lead: "Nothing sells industrial technology like a machine in motion. INDTEC EXPO is built for live equipment — running cuttings, actuated cycles, inspection routines and control screens — in front of an audience that came specifically to evaluate it.",
    points: [
      "Raw space and power options sized for machinery and working demos",
      "Application clinics and demonstration slots across the show days",
      "Launch your new release to an audience already in buying mode",
    ],
  },
  {
    lead: "The floor works in both directions. Alongside buyers, you meet OEMs looking for component partners, factories seeking subcontract capacity and technology companies open to integration tie-ups.",
    points: [
      "Cross-industry traffic from auto, pumps, textiles, electronics and aerospace supply chains",
      "Co-exhibitor introductions arranged by the organiser's floor team",
      "Opportunities for service, finance and logistics partnerships",
    ],
  },
  {
    lead: "Brand strength in industrial markets comes from presence — being seen at the right shows, alongside the right names, season after season. Three editions in one calendar create that continuity across South India.",
    points: [
      "Premium, high-visibility stand positions in every edition",
      "Listing across the expo brochure, website and event collateral",
      "Consistent brand storytelling from Bengaluru through to Hosur",
    ],
  },
];

export default function WhyExhibitPage() {
  const events = getSortedEvents();

  const totalDays = events.reduce((total, event) => total + event.days, 0);
  const sumStat = (label: string) =>
    events.reduce((total, event) => {
      const stat = event.stats.find((item) => item.label === label);
      return total + (stat ? Number(stat.value.replace(/[^\d]/g, "")) : 0);
    }, 0);

  const roiStats = [
    { value: `${sumStat("Visitors").toLocaleString("en-IN")}+`, label: "Qualified Visitors" },
    { value: String(events.length), label: "Industrial Editions" },
    { value: String(totalDays), label: "Business Days" },
    { value: `${sumStat("Exhibitors").toLocaleString("en-IN")}+`, label: "Exhibitors Across Series" },
  ];

  return (
    <>
      <PageHero
        eyebrow="Why Exhibit"
        title="Six Compounding Reasons to Take a Stall"
        description="Exhibiting at INDTEC EXPO is not a line item — it is a season-long investment in meetings, market intelligence, channel growth and brand position across South India's manufacturing belt."
        image="/images/gallery/exhibitors-2.svg"
        crumbs={[
          { label: "Exhibitors", href: "/exhibitors" },
          { label: "Why Exhibit" },
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <Button href="/exhibitors/book-your-stall" variant="primary" size="lg" withArrow>
            Book Your Stall
          </Button>
          <Button href="#roi" variant="outline-light" size="lg">
            See the Numbers
          </Button>
        </div>
      </PageHero>

      {/* ---------------------------------------------------------- */}
      {/* Detailed benefit blocks                                     */}
      {/* ---------------------------------------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="Benefit Breakdown"
          title="What You Actually Get on the Floor"
          description="Each benefit, unpacked — the mechanism behind it and what it looks like in practice when the doors open."
        />

        <div className="space-y-14 sm:space-y-20">
          {whyExhibitBenefits.map((benefit, index) => {
            const detail = benefitDetails[index];
            if (!detail) return null;
            const reversed = index % 2 === 1;

            return (
              <article
                key={benefit.id}
                className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-14"
              >
                <div className={reversed ? "lg:order-2" : undefined}>
                  <div className="flex items-center justify-between gap-4">
                    <IconTile
                      icon={benefit.icon as IconName}
                      size="lg"
                      tone={index % 2 === 0 ? "brand" : "gold"}
                    />
                    <span className="display tabular text-4xl text-steel-200 sm:text-5xl">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="display mt-6 text-[clamp(1.5rem,3vw,2.25rem)] text-navy-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-steel-700 sm:text-lg">
                    {benefit.description}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-steel-600 sm:text-base">
                    {detail.lead}
                  </p>
                </div>

                <div className={`card p-6 sm:p-8 ${reversed ? "lg:order-1" : ""}`}>
                  <span className="eyebrow eyebrow-dark">In Practice</span>
                  <ul className="mt-5 space-y-4">
                    {detail.points.map((point) => (
                      <li key={point} className="flex gap-3.5">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-brand-100 bg-brand-50 text-brand-600">
                          <Icon name="check" size={13} strokeWidth={2.4} />
                        </span>
                        <span className="text-sm leading-relaxed text-steel-600">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 border-t border-steel-100 pt-5">
                    <Button
                      href="/exhibitors/book-your-stall"
                      variant="outline"
                      size="sm"
                      withArrow
                    >
                      Claim This for Your Brand
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* ROI stats                                                   */}
      {/* ---------------------------------------------------------- */}
      <Section id="roi" tone="muted" className="grid-surface-dark">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <span className="eyebrow eyebrow-light mb-4">Return on Floor Time</span>
            <h2 className="display text-[clamp(1.8rem,3.4vw,2.75rem)]">
              One Season. Three Markets. Measurable Return.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-steel-300">
              A single INDTEC EXPO edition puts your stand in front of a
              concentrated industrial audience for three to four days. Run the
              full circuit and you repeat that exposure in each of South
              India&apos;s
              three strongest manufacturing belts — without rebuilding your
              campaign for each market.
            </p>
            <p className="mt-4 text-base leading-relaxed text-steel-300">
              The practical return: fewer wasted meetings, a shorter path from
              demonstration to enquiry, and a channel pipeline that is built
              face to face rather than chased over months.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/exhibitors/book-your-stall" variant="gold" size="lg" withArrow>
                Start Your Enquiry
              </Button>
              <Button href="/exhibitors/exhibitor-profile" variant="outline-light" size="lg">
                Who You&apos;ll Meet
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {roiStats.map((stat) => (
              <div
                key={stat.label}
                className="border border-white/12 bg-white/5 p-6 text-center backdrop-blur"
              >
                <div className="display tabular text-4xl text-gold-500 sm:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-steel-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Multi-city package                                          */}
      {/* ---------------------------------------------------------- */}
      <Section tone="light">
        <SectionHeading
          eyebrow="Multi-City Package"
          title="Book the Circuit, Not Just a City"
          description="Exhibitors who take space in more than one INDTEC EXPO city work with one organiser, one proforma structure and one relationship — and receive volume benefits across the season."
        />

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="grid gap-4 sm:grid-cols-3">
            {events.map((event, index) => (
              <Link
                key={event.slug}
                href={`/events/${event.slug}`}
                className="card card-hover group flex h-full flex-col p-5"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-steel-500">
                  Stop {index + 1} of {events.length}
                </span>
                <h3 className="display-sm mt-3 text-xl text-navy-900 group-hover:text-brand-700">
                  {event.city}
                </h3>
                <p className="tabular mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold-600">
                  {event.dateRangeShort}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-steel-600">
                  {event.positioning} · {event.venue.name}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
                  Edition Details
                  <Icon name="arrow-right" size={13} />
                </span>
              </Link>
            ))}
          </div>

          <div className="card p-6 sm:p-8">
            <span className="eyebrow eyebrow-dark">How the Package Works</span>
            <ul className="mt-5 space-y-4">
              {[
                {
                  icon: "layers",
                  title: "One enquiry, all three cities",
                  detail:
                    "Select “Multi-city package” in the stall enquiry form and we quote Bengaluru, Coimbatore and Hosur together.",
                },
                {
                  icon: "growth",
                  title: "Volume benefits on space",
                  detail:
                    "Taking more space across the season attracts package benefits that single-city bookings do not receive.",
                },
                {
                  icon: "handshake",
                  title: "One point of contact",
                  detail:
                    "A single coordinator handles allocation, proforma, build-up and invoicing for every edition you participate in.",
                },
                {
                  icon: "brand",
                  title: "Continuous brand presence",
                  detail:
                    `Your stand travels the calendar — ${events
                      .map((item) => `${item.city} in ${item.monthLabel}`)
                      .join(", ")}.`,
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-4 border-b border-steel-100 pb-4 last:border-0 last:pb-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold-100 bg-gold-50 text-gold-700">
                    <Icon name={item.icon as IconName} size={19} strokeWidth={1.5} />
                  </span>
                  <div>
                    <h3 className="display-sm text-sm text-navy-900">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-steel-600">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <Button
              href="/exhibitors/book-your-stall"
              variant="primary"
              size="lg"
              withArrow
              className="mt-6 w-full"
            >
              Request a Multi-City Quote
            </Button>
          </div>
        </div>
      </Section>

      <ExhibitorCTA
        headline="Special Exhibitor Offers for the 2026–2027 Season"
        supportingText="Early bookings, multi-city participation and association members unlock special offers. Send your enquiry and ask the team what applies to your company."
        secondaryLabel="Exhibitor Profile"
        secondaryHref="/exhibitors/exhibitor-profile"
      />
    </>
  );
}
