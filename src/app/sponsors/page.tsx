import Image from "next/image";

import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading, Badge } from "@/components/ui/Section";
import { siteConfig } from "@/config/site";
import { sponsorTiers } from "@/data/sponsors";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Sponsors & Partners",
  description:
    "Title sponsors, industry partners, media partners and technology partners of INDTEC EXPO 2026–2027. Explore partnership tiers and become an INDTEC EXPO partner.",
  path: "/sponsors",
});

const partnershipBenefits: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "brand",
    title: "Brand presence across three editions",
    text: "Logo placement on stage, entrance arch, aisle branding, delegate bags and the digital property suite spanning all three cities.",
  },
  {
    icon: "users",
    title: "Access to a qualified industrial audience",
    text: "Direct engagement with factory owners, procurement heads, plant engineers and channel partners from South India's manufacturing belt.",
  },
  {
    icon: "display",
    title: "Speaking & demonstration slots",
    text: "Conference theatre sessions, product launch windows and live demonstration opportunities aligned with your technology story.",
  },
  {
    icon: "news",
    title: "Media & content coverage",
    text: "Co-branded press releases, interview slots with trade publications and features across INDTEC EXPO's owned media channels.",
  },
  {
    icon: "handshake",
    title: "Delegation & hosting privileges",
    text: "Hosted buyer delegations, private meeting rooms and invitation rights for your channel network across editions.",
  },
  {
    icon: "ticket",
    title: "Hospitality & passes",
    text: "Complimentary exhibitor and visitor passes, hospitality desk access and recognition at the inaugural ceremony.",
  },
];

export default function SponsorsPage() {
  return (
    <>
      <PageHero
        eyebrow="Partners & Supporters"
        title="The Brands Behind the Platform"
        description="INDTEC EXPO is supported by title sponsors, manufacturing associations, trade media and technology partners who share one belief: South India's industry deserves a world-class business floor."
        image="/images/hero/hero-about.svg"
        crumbs={[{ label: "Sponsors" }]}
        compact
      >
        <div className="flex flex-wrap gap-3">
          <Button
            href={`mailto:${siteConfig.exhibitorEmail}?subject=${encodeURIComponent("Partnership enquiry — INDTEC EXPO 2026–2027")}`}
            variant="primary"
            size="lg"
            withArrow
          >
            Become a Partner
          </Button>
          <Button href="#tiers" variant="outline-light" size="lg">
            View Current Partners
          </Button>
        </div>
      </PageHero>

      {/* Tiers */}
      <Section id="tiers">
        <SectionHeading
          eyebrow="Partner Directory"
          title="Our Current Partners"
          description="Five partnership tiers, each designed around a different kind of contribution to the INDTEC EXPO ecosystem."
        />

        <div className="space-y-14">
          {sponsorTiers.map((tier) => (
            <div key={tier.id}>
              <div className="mb-6 border-b border-steel-200 pb-5">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="display text-2xl text-navy-900 sm:text-3xl">
                    {tier.title}
                  </h3>
                  <Badge tone="gold">{tier.logos.length} Partners</Badge>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel-600">
                  {tier.description}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {tier.logos.map((logo) => (
                  <div
                    key={logo.id}
                    className="card flex h-28 flex-col items-center justify-center gap-2 px-5 py-4 transition hover:border-brand-300 hover:shadow-card"
                  >
                    <Image
                      src={logo.logo}
                      alt={logo.name}
                      width={180}
                      height={56}
                      className="max-h-12 w-auto object-contain"
                      loading="lazy"
                    />
                    <span className="text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-steel-500">
                      {logo.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Partnership benefits */}
      <Section tone="light">
        <SectionHeading
          eyebrow="Why Partner"
          title="Partnership Benefits"
          description="A partnership with INDTEC EXPO is not logo-on-a-board. Every tier is structured around measurable access to the industrial decision-makers you want to reach."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {partnershipBenefits.map((benefit) => (
            <article key={benefit.title} className="card h-full p-6">
              <span className="flex h-11 w-11 items-center justify-center border border-brand-100 bg-brand-50 text-brand-600">
                <Icon name={benefit.icon} size={20} strokeWidth={1.5} />
              </span>
              <h3 className="display-sm mt-4 text-lg text-navy-900">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-steel-600">
                {benefit.text}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* Become a partner CTA */}
      <Section tone="muted" className="grid-surface-dark">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <span className="eyebrow eyebrow-light mb-4">Partnership Enquiries</span>
            <h2 className="display text-[clamp(1.8rem,3.8vw,2.9rem)]">
              Put Your Brand on the Industrial Stage
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-steel-300">
              Title, industry, media, technology and association partnership
              slots are open for the 2026–2027 calendar. Write to us with your
              preferred tier and editions — our team responds within one working
              day with the partnership deck and commercial terms.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                href={`mailto:${siteConfig.exhibitorEmail}?subject=${encodeURIComponent("Partnership enquiry — INDTEC EXPO 2026–2027")}`}
                variant="primary"
                size="lg"
                withArrow
              >
                Email Partnership Desk
              </Button>
              <Button href="/contact" variant="outline-light" size="lg">
                Contact Form
              </Button>
            </div>
          </div>

          <ul className="space-y-4 border-l border-white/10 lg:pl-10">
            {[
              { label: "Title Sponsors", value: "All 3 editions" },
              { label: "Industry Partners", value: "Delegation host" },
              { label: "Media Partners", value: "Coverage rights" },
              { label: "Technology Partners", value: "Platform integration" },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-baseline justify-between border-b border-white/10 pb-3 last:border-0"
              >
                <span className="text-sm uppercase tracking-[0.14em] text-steel-400">
                  {item.label}
                </span>
                <span className="display-sm text-lg text-gold-500">
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
