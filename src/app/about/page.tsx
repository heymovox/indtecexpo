import Image from "next/image";

import { Button } from "@/components/ui/Button";
import { ExhibitorCTA, StatStrip } from "@/components/ui/CTA";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading, Badge } from "@/components/ui/Section";
import { EventCard } from "@/components/events/EventCard";
import { siteConfig } from "@/config/site";
import { getSortedEvents } from "@/data/events";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About — Konnekt Globe",
  description:
    "INDTEC EXPO is organised by Konnekt Globe — Connecting Industries Globally. Our mission, values and the story behind South India's B2B industrial expo series across Bengaluru, Coimbatore and Hosur.",
  path: "/about",
});

const valueCopy: Record<(typeof siteConfig.values)[number], string> = {
  CONNECT: "Bring manufacturers, buyers, dealers and associations into the same room — and structure the conversation so it ends in business, not business cards.",
  INNOVATE: "Put live machinery, Industry 4.0 platforms and application-led demonstrations at the centre of the floor, so technology is evaluated the way it will be used.",
  GROW: "Measure success by the orders, dealer appointments and partnerships that start on the floor — and by the manufacturers who return for the next edition.",
};

const southIndiaPoints: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "factory",
    title: "India's densest MSME manufacturing belt",
    text: "Karnataka and Tamil Nadu hold one of the country's deepest concentrations of machine tool users, pump and motor manufacturers, auto component makers, foundries and textile engineering firms.",
  },
  {
    icon: "network",
    title: "Three hubs, one procurement circuit",
    text: "Bengaluru, Coimbatore and Hosur sit within a single industrial catchment. One season across three editions gives exhibitors repeated access to the same extended buyer network.",
  },
  {
    icon: "growth",
    title: "A market that invests in technology",
    text: "Retrofit automation, energy-efficient machinery and connected monitoring are being adopted faster here than the national average — driven by export quality requirements and skilled shopfloors.",
  },
  {
    icon: "handshake",
    title: "Association-backed buyer programmes",
    text: "Regional manufacturing associations, engineering clusters and MSME councils host curated delegations at every edition, raising the quality of floor traffic.",
  },
];

export default function AboutPage() {
  const events = getSortedEvents();

  const seriesStats = [
    { value: String(events.length), label: "Industrial Cities" },
    { value: "10", label: "Sectors Covered" },
    { value: String(events.reduce((sum, e) => sum + e.days, 0)), label: "Business Days" },
    { value: "40+", label: "Product Categories" },
  ];

  return (
    <>
      <PageHero
        eyebrow={`Organised by ${siteConfig.organizer.name}`}
        title={siteConfig.organizer.mission}
        description={`${siteConfig.organizer.name} — ${siteConfig.organizer.descriptor}. INDTEC EXPO is our industrial platform for South India: a three-city B2B exhibition series built for manufacturers who buy, sell and build with technology.`}
        image="/images/hero/hero-about.svg"
        crumbs={[{ label: "About" }]}
      >
        <div className="flex flex-wrap gap-3">
          <Button href="/events" variant="primary" size="lg" withArrow>
            Explore the Calendar
          </Button>
          <Button href="/contact" variant="outline-light" size="lg">
            Contact the Team
          </Button>
        </div>
      </PageHero>

      {/* Organizer story */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="The Organizer"
              title="Built by Exhibition People, for Industry People"
              description={`${siteConfig.organizer.name} plans trade fairs and business-connect platforms that put decision-makers in the same room. INDTEC EXPO is the industrial flagship of that portfolio.`}
            />
            <div className="space-y-4 text-base leading-relaxed text-steel-600">
              <p>
                Trade exhibitions work when they are specific. A general
                audience wastes an exhibitor&apos;s day; a curated industrial
                audience multiplies it. That principle shapes every decision at
                INDTEC EXPO — from sector zoning and aisle design to the
                delegation programmes and conference agenda.
              </p>
              <p>
                The {siteConfig.fullName} calendar was designed around the
                geography of South Indian manufacturing: three industrial hubs,
                each with a distinct buyer identity, reachable within a single
                season. Exhibitors get repeated, structured access to the same
                extended market. Visitors get a world-class technology floor
                within driving distance of their plant.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <Badge tone="brand">Exhibitions</Badge>
              <Badge tone="brand">Trade Fairs</Badge>
              <Badge tone="brand">Business Connect</Badge>
            </div>
          </div>

          <div className="relative">
            <div className="grid-surface absolute -inset-4 -z-10" />
            <Image
              src="/images/hero/hero-about.svg"
              alt="INDTEC EXPO exhibition floor"
              width={720}
              height={520}
              className="h-auto w-full border border-steel-200"
              sizes="(max-width: 1024px) 100vw, 560px"
              loading="lazy"
            />
            <div className="mt-4 grid grid-cols-3 gap-4">
              {siteConfig.values.map((value, index) => (
                <div
                  key={value}
                  className="border border-steel-200 bg-steel-50 px-3 py-4 text-center"
                >
                  <span className="display-sm block text-navy-900">{value}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-steel-500">
                    0{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Mission + values */}
      <Section tone="muted" className="grid-surface-dark">
        <div className="text-center">
          <span className="eyebrow eyebrow-light mb-4 inline-flex">Our Mission</span>
          <h2 className="display mx-auto max-w-4xl text-[clamp(1.9rem,4vw,3rem)]">
            {siteConfig.organizer.mission}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-steel-300">
            Every edition, every aisle and every scheduled meeting exists to
            serve one outcome: industries that connect, grow and compound.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {siteConfig.values.map((value, index) => (
            <article key={value} className="border border-white/12 bg-white/[0.04] p-7">
              <span className="display tabular text-sm text-gold-500">
                0{index + 1}
              </span>
              <h3 className="display mt-3 text-3xl text-white">{value}</h3>
              <p className="mt-4 text-sm leading-relaxed text-steel-400">
                {valueCopy[value]}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* What is INDTEC EXPO */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="What Is INDTEC EXPO"
              title="A Focused B2B Industrial Exhibition"
              description="INDTEC EXPO is a trade-only exhibition for machine tools, automation, engineering components and industrial technology — staged for the manufacturing belt of South India."
            />
            <div className="space-y-4 text-base leading-relaxed text-steel-600">
              <p>
                The floor is organised into ten sector zones covering the
                complete plant procurement list: primary machines, automation
                and controls, electricals, instrumentation, material handling,
                components, manufacturing services and Industry 4.0 software.
              </p>
              <p>
                What distinguishes INDTEC EXPO from a trade show is structure.
                Live machinery demonstrations, application clinics,
                pre-scheduled buyer–seller meetings, association delegations and
                a daily conference theatre turn three or four business days into
                concentrated commercial output.
              </p>
              <p>
                Entry is free for verified trade visitors. Exhibitors book raw
                space, shell scheme or premium corner configurations across one
                or more editions, with multi-city packages available.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/visitors/register" variant="primary" withArrow>
                Register as Visitor
              </Button>
              <Button href="/exhibitors/why-exhibit" variant="outline">
                Why Exhibit
              </Button>
            </div>
          </div>

          <div>
            <StatStrip items={seriesStats} />
            <div className="mt-6 grid gap-4">
              {[
                { icon: "ticket" as IconName, title: "Trade-only floor", text: "Verified business visitors — no retail footfall diluting your conversations." },
                { icon: "display" as IconName, title: "Live technology", text: "Running machinery and demonstration cells across every sector zone." },
                { icon: "users" as IconName, title: "Delegation programme", text: "Association-hosted buyer groups with pre-scheduled meeting slots." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 border border-steel-200 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-brand-100 bg-brand-50 text-brand-600">
                    <Icon name={item.icon} size={19} strokeWidth={1.5} />
                  </span>
                  <div>
                    <h3 className="display-sm text-base text-navy-900">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-steel-600">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Three editions */}
      <Section tone="light">
        <SectionHeading
          eyebrow="The Series"
          title="Three Editions. Three Industrial Identities."
          description="One calendar, purpose-built around how South Indian industry actually buys."
          action={
            <Button href="/events" variant="outline" withArrow>
              Full Calendar
            </Button>
          }
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      </Section>

      {/* Why South India */}
      <Section>
        <SectionHeading
          eyebrow="Why South India"
          title="Where the Machines Are, We Bring the Market"
          description="South India's manufacturing belt is not a emerging market to be tested — it is one of the country's most active capital equipment buying regions, and INDTEC EXPO is built inside it."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          {southIndiaPoints.map((point) => (
            <article key={point.title} className="card h-full p-6">
              <span className="flex h-11 w-11 items-center justify-center border border-signal-100 bg-signal-50 text-signal-500">
                <Icon name={point.icon} size={20} strokeWidth={1.5} />
              </span>
              <h3 className="display-sm mt-4 text-lg text-navy-900">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-steel-600">
                {point.text}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/industries" variant="secondary" withArrow>
            Explore Industries
          </Button>
          <Button href="/contact" variant="outline">
            Talk to the Team
          </Button>
        </div>
      </Section>

      <ExhibitorCTA
        headline="Join the Manufacturers Building This Platform"
        supportingText="Book across one, two or three editions and put your brand in front of South India's industrial buyers."
        primaryLabel="Book Your Stall"
        primaryHref="/exhibitors/book-your-stall"
        secondaryLabel="Download Floor Plan"
        secondaryHref="/floor-plan"
      />
    </>
  );
}
