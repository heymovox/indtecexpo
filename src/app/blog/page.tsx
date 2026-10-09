import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading, Badge } from "@/components/ui/Section";
import { mediaArticles, mediaCategories } from "@/data/media";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Insights & News",
  description:
    "Manufacturing insights, market analysis and INDTEC EXPO updates — machine tool demand in South India, Industry 4.0 adoption, stall booking windows and association partnerships.",
  path: "/blog",
});

export default function BlogPage() {
  const [lead, ...rest] = mediaArticles;

  return (
    <>
      <PageHero
        eyebrow="Insights & News"
        title="Perspectives from the Shopfloor Up"
        description="Analysis of South India's manufacturing markets, technology trends shaping capital equipment purchases, and every INDTEC EXPO update — written for the people who buy, build and supply industry."
        image="/images/hero/hero-media.svg"
        crumbs={[{ label: "Blog" }]}
        compact
      >
        <div className="flex flex-wrap gap-2">
          {mediaCategories.map((category) => (
            <Badge key={category} tone="outline">
              {category}
            </Badge>
          ))}
        </div>
      </PageHero>

      {/* Lead article */}
      {lead ? (
        <Section>
          <Link
            href={`/blog/${lead.slug}`}
            className="card card-hover group grid overflow-hidden lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="relative overflow-hidden bg-navy-900">
              <Image
                src={lead.image}
                alt=""
                width={880}
                height={500}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                sizes="(max-width: 1024px) 100vw, 55vw"
                priority
              />
              <span className="absolute left-0 top-0 bg-signal-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                Latest
              </span>
            </div>

            <div className="flex flex-col justify-center p-7 sm:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="brand">{lead.category}</Badge>
                <span className="text-[11px] uppercase tracking-[0.16em] text-steel-500">
                  {lead.dateLabel} · {lead.readTime}
                </span>
              </div>
              <h2 className="display mt-5 text-[clamp(1.5rem,2.8vw,2.25rem)] text-navy-900 group-hover:text-brand-700">
                {lead.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-steel-600">
                {lead.excerpt}
              </p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
                Read the Article
                <Icon name="arrow-right" size={13} />
              </span>
            </div>
          </Link>
        </Section>
      ) : null}

      {/* All articles */}
      <Section tone="light">
        <SectionHeading
          eyebrow="All Articles"
          title="Every Insight & Update"
          description="Market analysis, expo announcements and technology commentary — newest first."
          action={
            <Button href="/media" variant="outline" withArrow>
              Press &amp; Media Desk
            </Button>
          }
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="card card-hover group flex h-full flex-col overflow-hidden"
            >
              <div className="relative overflow-hidden bg-navy-900">
                <Image
                  src={article.image}
                  alt=""
                  width={560}
                  height={315}
                  className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  loading="lazy"
                />
                <span className="absolute left-0 top-0 bg-navy-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-500">
                  {article.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="text-[11px] uppercase tracking-[0.16em] text-steel-500">
                  {article.dateLabel} · {article.readTime}
                </span>
                <h3 className="display-sm mt-3 text-base leading-snug text-navy-900 group-hover:text-brand-700 sm:text-lg">
                  {article.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-steel-600">
                  {article.excerpt}
                </p>
                <span className="mt-auto flex items-center gap-1.5 pt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
                  Read More
                  <Icon name="arrow-right" size={13} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section tone="muted" className="grid-surface-dark">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="eyebrow eyebrow-light mb-4">From Reading to Walking</span>
            <h2 className="display text-[clamp(1.8rem,3.6vw,2.75rem)]">
              The Best Insight Is a Running Machine.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-steel-300">
              Every trend written about here is on the INDTEC EXPO floor —
              live, in production, with the engineers who built it standing
              next to it. Register free and see for yourself.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button href="/visitors/register" variant="primary" size="lg" withArrow>
              Register as Visitor
            </Button>
            <Button href="/events" variant="outline-light" size="lg">
              Explore Events
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
