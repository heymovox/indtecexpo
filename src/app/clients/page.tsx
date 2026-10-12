import Image from "next/image";

import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading } from "@/components/ui/Section";
import { StatStrip } from "@/components/ui/CTA";
import { seriesStats } from "@/data/events";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Our Clients",
  description:
    "Corporate clients, exhibitors and industry partners of INDTEC EXPO — machine tool builders, automation suppliers and engineering technology companies across South India.",
  path: "/clients",
});

const clientValues: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "users",
    title: "A qualified industrial audience",
    text: "Factory owners, plant heads, procurement teams and channel partners — the people who actually specify, source and buy machinery.",
  },
  {
    icon: "globe",
    title: "Three hubs, one network",
    text: "Bengaluru, Coimbatore and Hosur put your brand in front of South India's manufacturing belt within a single exhibition season.",
  },
  {
    icon: "growth",
    title: "Visibility beyond the floor",
    text: "Exhibitors and partners stay visible across the digital property suite, trade media coverage and the editions that follow.",
  },
];

export default function ClientsPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Clients"
        title="The Brands That Build With Us"
        description="INDTEC EXPO is where South India's machine tool, automation and engineering brands meet their buyers. Explore the corporate clients and partners who put their trust in the platform."
        image="/images/hero/hero-industrial.svg"
        crumbs={[{ label: "Our Clients" }]}
        compact
      >
        <div className="flex flex-wrap gap-3">
          <Button href="/exhibitors/book-your-stall" variant="primary" size="lg" withArrow>
            Book Your Stall
          </Button>
          <Button href="/sponsors" variant="outline-light" size="lg">
            Become a Partner
          </Button>
        </div>
      </PageHero>

      {/* Showcase */}
      <Section>
        <SectionHeading
          eyebrow="Partner Showcase"
          title="Companies on the INDTEC EXPO Floor"
          description="A cross-section of the machine tool builders, automation suppliers, component manufacturers and engineering brands that exhibit and partner with us."
        />

        <div className="border border-steel-200 bg-white p-4 sm:p-6 lg:p-8">
          <Image
            src="/images/clients/client-partner-showcase.webp"
            alt="Logos of corporate clients and partner companies that exhibit at INDTEC EXPO, spanning machine tools, automation, electrical, instrumentation and engineering component manufacturers"
            width={1698}
            height={926}
            className="h-auto w-full"
            sizes="(max-width: 1280px) 100vw, 1184px"
            loading="lazy"
          />
        </div>

        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-steel-600">
          From global machine tool names to regional engineering specialists,
          these are the companies that exhibit, sponsor and partner with INDTEC
          EXPO across its three editions.
        </p>
      </Section>

      {/* Why clients return */}
      <Section tone="light">
        <SectionHeading
          eyebrow="Why Brands Return"
          title="Built for Real Business"
          description="Every edition is engineered around qualified footfall and measurable outcomes, not footfall for its own sake."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clientValues.map((item) => (
            <article key={item.title} className="card h-full p-6">
              <span className="flex h-11 w-11 items-center justify-center border border-brand-100 bg-brand-50 text-brand-600">
                <Icon name={item.icon} size={20} strokeWidth={1.5} />
              </span>
              <h3 className="display-sm mt-4 text-lg text-navy-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-steel-600">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section tone="muted" className="grid-surface-dark">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <span className="eyebrow eyebrow-light mb-4">Join Them</span>
            <h2 className="display text-[clamp(1.8rem,3.8vw,2.9rem)]">
              Put Your Brand in Front of Industry
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-steel-300">
              Stall bookings, sponsorship slots and partnership tiers are open
              for the 2026–2027 calendar across Bengaluru, Coimbatore and Hosur.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/exhibitors/book-your-stall" variant="primary" size="lg" withArrow>
                Book Your Stall
              </Button>
              <Button href="/contact" variant="outline-light" size="lg">
                Talk to Our Team
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.14em] text-steel-400">
              By the numbers
            </p>
            <StatStrip
              items={seriesStats}
              columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-2"
            />
          </div>
        </div>
      </Section>
    </>
  );
}
