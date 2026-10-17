import Image from "next/image";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading, Badge } from "@/components/ui/Section";
import { EventCard } from "@/components/events/EventCard";
import { getPublicEvents } from "@/data/events.server";
import { industries, industryBySlug } from "@/data/industries";
import {
  breadcrumbJsonLd,
  buildMetadata,
  JsonLd,
} from "@/lib/seo";

export function generateStaticParams() {
  return industries.map((industry) => ({ slug: industry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = industryBySlug(slug);
  if (!industry) {
    return buildMetadata({
      title: "Industry Not Found",
      description: "The requested industry sector could not be found.",
      path: `/industries/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${industry.name} — Industry Sector`,
    description: `${industry.description} Explore ${industry.name} exhibitors, product groups and editions at INDTEC EXPO 2026–2027.`,
path: `/industries/${industry.slug}`,
      card: "industries",
      ogTitle: industry.name,
  });
}

export default async function IndustryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = industryBySlug(slug);
  if (!industry) notFound();

  // Renders event cards, so the dashboard's edits apply here too.
  const events = await getPublicEvents();

  const relatedEvents = events.filter((event) =>
    event.sectors.includes(industry.name),
  );
  const displayEvents = relatedEvents.length > 0 ? relatedEvents : events;

  return (
    <>
      <PageHero
        eyebrow="Industry Sector"
        title={industry.name}
        description={industry.description}
        image="/images/hero/hero-industrial.svg"
        crumbs={[
          { label: "Industries", href: "/industries" },
          { label: industry.name },
        ]}
        compact
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="outline">{industry.sectors.length} Product Groups</Badge>
          {relatedEvents.length > 0 ? (
            <Badge tone="outline">
              Featured in {relatedEvents.length}{" "}
              {relatedEvents.length === 1 ? "Edition" : "Editions"}
            </Badge>
          ) : null}
        </div>
      </PageHero>

      {/* Overview */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Sector Overview"
              title={`What Exhibits Under ${industry.shortName ?? industry.name}`}
              description="INDTEC EXPO groups exhibitors by application, so buyers walking this zone see complementary technology side by side — from primary machines to the components and services that keep them running."
            />
            <p className="text-base leading-relaxed text-steel-600">
              South India&apos;s manufacturing base — pumps, motors, auto
              components, textile machinery, electricals and precision
              engineering — sources actively from this category. Exhibitors in
              this zone use the floor for live demonstrations, application
              clinics and structured buyer meetings rather than catalogue
              display.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/visitors/register" variant="primary" withArrow>
                Visit This Zone Free
              </Button>
              <Button href="/exhibitors/book-your-stall" variant="outline">
                Exhibit in This Sector
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="grid-surface absolute -inset-5 -z-10" />
            <Image
              src={industry.image}
              alt={`${industry.name} at INDTEC EXPO`}
              width={640}
              height={420}
              className="h-auto w-full border border-steel-200"
              sizes="(max-width: 1024px) 100vw, 480px"
              priority
            />
          </div>
        </div>
      </Section>

      {/* Product groups */}
      <Section tone="light">
        <SectionHeading
          eyebrow="Product Groups"
          title="Exhibited Categories"
          description="The product groups below are represented on the INDTEC EXPO floor by manufacturers, OEMs, channel partners and service providers."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {industry.sectors.map((sector, index) => (
            <div
              key={sector}
              className="flex items-start gap-4 border border-steel-200 bg-white p-5"
            >
              <span className="display tabular shrink-0 text-sm text-brand-600">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="display-sm text-base text-navy-900">{sector}</h3>
                <p className="mt-1 text-xs leading-relaxed text-steel-500">
                  Exhibited across the {industry.shortName ?? industry.name} zone
                  at every INDTEC EXPO edition.
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Related events */}
      <Section>
        <SectionHeading
          eyebrow={relatedEvents.length > 0 ? "Related Editions" : "All Editions"}
          title={
            relatedEvents.length > 0
              ? `See ${industry.shortName ?? industry.name} at These Expos`
              : "Where to Find This Sector"
          }
          description={
            relatedEvents.length > 0
              ? `${industry.name} is a highlighted sector at the editions below. Register free and walk straight to this zone.`
              : "This sector is represented across the full INDTEC EXPO calendar."
          }
          action={
            <Button href="/events" variant="outline" withArrow>
              All Events
            </Button>
          }
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayEvents.map((event) => (
            <EventCard key={event.slug} event={event} compact />
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section tone="dark" className="overflow-hidden">
        <div className="hatch-surface absolute inset-x-0 top-0" />
        <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="eyebrow eyebrow-light mb-4">
              {industry.name}
            </span>
            <h2 className="display text-[clamp(1.8rem,3.6vw,2.75rem)]">
              Source It. Supply It. Both Start Here.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-steel-300">
              Buyers register free. Suppliers book a stall. Either way, this
              sector is where the conversation begins.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button href="/visitors/register" variant="primary" size="lg" withArrow>
              Register as Visitor
            </Button>
            <Button href="/exhibitors/book-your-stall" variant="gold" size="lg">
              Book Your Stall
            </Button>
          </div>
        </div>
      </Section>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
          { name: industry.name, path: `/industries/${industry.slug}` },
        ])}
      />
    </>
  );
}
