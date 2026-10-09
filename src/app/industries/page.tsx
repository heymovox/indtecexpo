import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading, Badge } from "@/components/ui/Section";
import { industries, productCategories } from "@/data/industries";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Industries We Serve",
  description:
    "Explore the 10 industrial sectors at INDTEC EXPO 2026–2027 — machine tools, automation, Industry 4.0, electricals, instrumentation, material handling, components and more.",
  path: "/industries",
});

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Industries We Serve"
        title="The Full Industrial Value Chain, Under One Roof"
        description="10 sectors. 40+ product categories. From CNC machine tools to connected-factory platforms, INDTEC EXPO maps the complete procurement list of a modern manufacturing plant."
        image="/images/hero/hero-industrial.svg"
        crumbs={[{ label: "Industries" }]}
        compact
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="outline">10 Sectors</Badge>
          <Badge tone="outline">{productCategories.length} Product Categories</Badge>
          <Badge tone="outline">3 Industrial Hubs</Badge>
        </div>
      </PageHero>

      <Section>
        <SectionHeading
          eyebrow="Sector Directory"
          title="Find Your Sector"
          description="Every category below maps to a dedicated exhibitor zone on the INDTEC EXPO floor. Open a sector to see the exact product groups exhibited."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {industries.map((industry) => (
            <article
              key={industry.id}
              className="card card-hover group flex h-full flex-col overflow-hidden sm:flex-row"
            >
              <div className="relative w-full shrink-0 overflow-hidden bg-navy-900 sm:w-44">
                <Image
                  src={industry.image}
                  alt={industry.name}
                  width={352}
                  height={280}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  sizes="(max-width: 640px) 100vw, 176px"
                  loading="lazy"
                />
              </div>

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-brand-100 bg-brand-50 text-brand-600">
                    <Icon name={industry.icon as IconName} size={19} strokeWidth={1.5} />
                  </span>
                  <h2 className="display-sm text-lg text-navy-900 sm:text-xl">
                    {industry.name}
                  </h2>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-steel-600">
                  {industry.description}
                </p>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {industry.sectors.map((sector) => (
                    <li
                      key={sector}
                      className="border border-steel-200 bg-steel-50 px-2 py-0.5 text-[11px] font-medium text-steel-600"
                    >
                      {sector}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-5">
                  <Button
                    href={`/industries/${industry.slug}`}
                    variant="outline"
                    size="sm"
                    withArrow
                  >
                    Explore Sector
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="muted" className="grid-surface-dark">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <span className="eyebrow eyebrow-light mb-4">Not Sure Where You Fit?</span>
            <h2 className="display text-[clamp(1.8rem,3.6vw,2.75rem)]">
              Every Supplier Has a Place on This Floor
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-steel-300">
              Whether you build machines, supply components, or sell the
              software that runs them — INDTEC EXPO places you in front of the
              buyers who need exactly that. Talk to our team about the right
              edition and zone for your products.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/exhibitors/book-your-stall" variant="primary" size="lg" withArrow>
                Book Your Stall
              </Button>
              <Button href="/visitors/register" variant="gold" size="lg">
                Register as Visitor
              </Button>
            </div>
          </div>

          <ul className="space-y-4 border-l border-white/10 lg:pl-10">
            {[
              { icon: "stall", title: "Dedicated sector zones", text: "Buyers can navigate straight to your product group." },
              { icon: "search", title: "40+ product categories", text: "Cross-category exposure without diluting your message." },
              { icon: "growth", title: "Live demos welcome", text: "Running machinery and application cells are encouraged on the floor." },
            ].map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold-500/35 bg-gold-500/10 text-gold-500">
                  <Icon name={item.icon as IconName} size={19} strokeWidth={1.5} />
                </span>
                <div>
                  <h3 className="display-sm text-base text-white">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-steel-400">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <div className="flex flex-wrap items-center justify-between gap-5 border border-steel-200 bg-steel-50 p-7">
          <div>
            <h2 className="display-sm text-xl text-navy-900 sm:text-2xl">
              Ready to walk the floor?
            </h2>
            <p className="mt-1.5 text-sm text-steel-600">
              Trade entry is free. Pre-register once and your e-pass covers all
              business days of your chosen edition.
            </p>
          </div>
          <Link
            href="/visitors/register"
            className="btn btn-secondary"
          >
            Register as Visitor
          </Link>
        </div>
      </Section>
    </>
  );
}
