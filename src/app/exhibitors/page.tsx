import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { ExhibitorCTA, StatStrip } from "@/components/ui/CTA";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading } from "@/components/ui/Section";
import { contactConfig } from "@/config/site";
import { getSortedEvents } from "@/data/events";
import { whyExhibitBenefits } from "@/data/exhibitors";
import { faqsByGroup } from "@/data/faqs";
import { faqJsonLd, JsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Exhibitors | Exhibit at INDTEC EXPO 2026–2027",
  description:
    "Exhibit at INDTEC EXPO 2026–2027 across Bengaluru, Coimbatore and Hosur. Stall configurations, four-step booking process, qualified industrial visitor profile and exhibitor FAQs.",
  path: "/exhibitors",
  keywords: [
    "exhibit at industrial expo India",
    "book stall INDTEC Expo",
    "B2B expo exhibitor South India",
    "machine tools exhibition stall",
  ],
});

const sumStatValue = (events: ReturnType<typeof getSortedEvents>, label: string): number =>
  events.reduce((total, event) => {
    const stat = event.stats.find((item) => item.label === label);
    if (!stat) return total;
    return total + Number(stat.value.replace(/[^\d]/g, ""));
  }, 0);

const bookingSteps = [
  {
    title: "Enquiry",
    detail:
      "Submit the stall enquiry form with your preferred city, stall size, product category and the number of stalls you need.",
    icon: "pen",
  },
  {
    title: "Confirmation & Proforma",
    detail:
      "Our team responds within one working day with live availability, final pricing, multi-city benefits and a proforma invoice.",
    icon: "mail",
  },
  {
    title: "Stall Allocation",
    detail:
      "Confirm the proforma to lock your stall number, aisle position and inclusion list — corner and premium slots go first.",
    icon: "stall",
  },
  {
    title: "Participate",
    detail:
      "Receive the exhibitor kit, complete build-up and run demonstrations, buyer meetings and delegation visits across the show days.",
    icon: "rocket",
  },
] as const;

export default function ExhibitorsPage() {
  const events = getSortedEvents();
  const exhibitingFaqs = faqsByGroup("Exhibiting");

  const totalDays = events.reduce((total, event) => total + event.days, 0);
  const totalVisitors = sumStatValue(events, "Visitors");
  const totalExhibitors = sumStatValue(events, "Exhibitors");

  const audienceStats = [
    { value: String(events.length), label: "Industrial Editions" },
    { value: `${totalVisitors.toLocaleString("en-IN")}+`, label: "Qualified Visitors" },
    { value: `${totalExhibitors.toLocaleString("en-IN")}+`, label: "Exhibitors Across Series" },
    { value: String(totalDays), label: "Business Days" },
  ];

  return (
    <>
      <PageHero
        eyebrow="Exhibitor Programme"
        title="Put Your Products in Front of the Buyers Who Matter"
        description="INDTEC EXPO connects machine tool, automation, electrical and engineering manufacturers with factory owners, procurement heads and channel partners across three South India industrial hubs — in person, over focused business days."
        image="/images/hero/hero-about.svg"
        crumbs={[{ label: "Exhibitors" }]}
      >
        <div className="flex flex-wrap gap-3">
          <Button href="/exhibitors/book-your-stall" variant="primary" size="lg" withArrow>
            Book Your Stall
          </Button>
          <Button href="/exhibitors/why-exhibit" variant="outline-light" size="lg">
            Why Exhibit
          </Button>
          <Button href="/floor-plan" variant="outline-light" size="lg">
            View Floor Plan
          </Button>
        </div>
      </PageHero>

      {/* ---------------------------------------------------------- */}
      {/* Why exhibit — six benefits                                  */}
      {/* ---------------------------------------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="The Exhibitor Case"
          title="Six Reasons Industrial Brands Exhibit With Us"
          description="Every edition is built around decision-makers with purchasing authority — so your floor time converts into enquiries, orders and channel relationships."
          action={
            <Button href="/exhibitors/why-exhibit" variant="outline" withArrow>
              Full Benefit Breakdown
            </Button>
          }
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {whyExhibitBenefits.map((benefit, index) => (
            <article key={benefit.id} className="card card-hover flex h-full flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-brand-100 bg-brand-50 text-brand-600">
                  <Icon name={benefit.icon as IconName} size={23} strokeWidth={1.5} />
                </span>
                <span className="display tabular text-2xl text-steel-200">
                  0{index + 1}
                </span>
              </div>
              <h3 className="display-sm mt-5 text-lg leading-tight text-navy-900">
                {benefit.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-steel-600">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Stall configurations across the three cities                */}
      {/* ---------------------------------------------------------- */}
      <Section tone="light">
        <SectionHeading
          eyebrow="Stall Configurations"
          title="Raw, Shell or Premium — Across Three Cities"
          description="Every edition offers the same three build formats, priced for that city's market. Choose the format that matches your machinery, display and budget."
          action={
            <Button href="/exhibitors/book-your-stall" variant="primary" withArrow>
              Request Availability
            </Button>
          }
        />

        <div className="grid gap-6 md:grid-cols-3">
          {events.map((event) => (
            <article key={event.slug} className="card flex h-full flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-3 bg-navy-900 px-5 py-4">
                <div>
                  <h3 className="display-sm text-lg text-white">{event.city}</h3>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-400">
                    {event.positioning}
                  </p>
                </div>
                <span className="tabular text-xs font-semibold uppercase tracking-[0.14em] text-gold-500">
                  {event.dateRangeShort}
                </span>
              </div>

              <ul className="flex-1 divide-y divide-steel-100 px-5">
                {event.stallOptions.map((option) => (
                  <li
                    key={option.id}
                    className="flex items-start justify-between gap-4 py-4"
                  >
                    <div>
                      <span className="display-sm block text-sm text-navy-900">
                        {option.name}
                      </span>
                      <span className="tabular mt-1 block text-xs text-steel-500">
                        {option.size} · {option.includes.length} inclusions
                      </span>
                    </div>
                    <span className="tabular shrink-0 text-sm font-semibold text-brand-700">
                      {option.price}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-steel-100 px-5 py-4">
                <Button href={`/events/${event.slug}`} variant="outline" size="sm" withArrow className="w-full">
                  {event.city} Details
                </Button>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-steel-500">
          Custom inline and island configurations are quoted separately.
          Multi-city participants receive volume benefits — mention your city
          combination in the enquiry form.
        </p>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Booking process                                             */}
      {/* ---------------------------------------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="How Booking Works"
          title="Four Steps From Enquiry to Exhibition Floor"
          description="A short, transparent path — no auction, no hidden allocation rules. Your stall is confirmed as soon as the proforma is accepted."
          align="center"
        />

        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {bookingSteps.map((step, index) => (
            <li key={step.title} className="relative">
              <div className="card h-full p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center border border-signal-100 bg-signal-50 text-signal-500">
                    <Icon name={step.icon as IconName} size={20} strokeWidth={1.5} />
                  </span>
                  <span className="display tabular text-3xl text-gold-500">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="display-sm mt-5 text-base text-navy-900">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-steel-600">
                  {step.detail}
                </p>
              </div>
              {index < bookingSteps.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute -right-3 top-1/2 hidden h-px w-6 -translate-y-1/2 bg-steel-300 lg:block"
                />
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="max-w-2xl text-sm leading-relaxed text-steel-600">
            Ready to start? Send your requirements once — the same enquiry can
            cover all three editions.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/exhibitors/book-your-stall" variant="primary" size="lg" withArrow>
              Start Your Enquiry
            </Button>
            <Button href={`tel:${contactConfig.phones[0].tel}`} variant="outline" size="lg">
              Call {contactConfig.phones[0].display}
            </Button>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Visitor profile                                             */}
      {/* ---------------------------------------------------------- */}
      <Section tone="muted" className="grid-surface-dark">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <span className="eyebrow eyebrow-light mb-4">Visitor Profile</span>
            <h2 className="display text-[clamp(1.8rem,3.4vw,2.75rem)]">
              An Audience That Signs Cheques
            </h2>
            <p className="mt-4 text-base leading-relaxed text-steel-300">
              INDTEC EXPO is a trade-only exhibition. Entry is free for verified
              industry professionals, which keeps the floor focused on people
              who specify, buy, install and supply industrial technology.
            </p>

            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                "Factory owners & MSME promoters",
                "Heads of procurement & purchase",
                "Plant & maintenance engineers",
                "Dealers and distributors",
                "Design & consulting engineers",
                "Production and quality heads",
              ].map((persona) => (
                <li
                  key={persona}
                  className="flex items-center gap-3 border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-steel-200"
                >
                  <Icon name="check-circle" size={17} className="shrink-0 text-success-500" />
                  {persona}
                </li>
              ))}
            </ul>

            <Button href="/exhibitors/exhibitor-profile" variant="gold" size="lg" withArrow className="mt-8">
              Who Visits &amp; What&apos;s Exhibited
            </Button>
          </div>

          <StatStrip items={audienceStats} />
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Exhibitor FAQs                                              */}
      {/* ---------------------------------------------------------- */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Exhibitor FAQ"
              title="Questions Before You Book"
              description="The answers exhibitors ask for most often — stall sizes, inclusions, multi-city participation and offers."
            />
            <div className="flex flex-col gap-3 border-t border-steel-200 pt-6">
              <Button href="/exhibitors/book-your-stall" variant="primary" withArrow>
                Ask Your Question
              </Button>
              <Button href={`mailto:${contactConfig.exhibitorEmail}`} variant="outline">
                {contactConfig.exhibitorEmail}
              </Button>
            </div>
          </div>

          <Accordion
            items={exhibitingFaqs.map((faq) => ({
              id: faq.id,
              question: faq.question,
              answer: faq.answer,
            }))}
            defaultOpenId={exhibitingFaqs[0]?.id}
          />
        </div>
      </Section>

      <ExhibitorCTA
        headline="Three Cities. One Exhibitor Relationship."
        supportingText="Book Bengaluru, Coimbatore and Hosur through a single enquiry and our team will structure availability, pricing and package benefits for the full season."
        secondaryLabel="Why Exhibit"
        secondaryHref="/exhibitors/why-exhibit"
      />

      <JsonLd
        data={faqJsonLd(
          exhibitingFaqs.map((faq) => ({
            question: faq.question,
            answer: faq.answer,
          })),
        )}
      />
    </>
  );
}
