import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading, Badge } from "@/components/ui/Section";
import { mediaCategories } from "@/data/media";
import { getPublicArticles } from "@/data/articles.server";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Media & Press",
  description:
    "Press releases, expo updates and industry insights from INDTEC EXPO 2026–2027 — announcements, stall booking windows, association partnerships and South India manufacturing analysis.",
  path: "/media",
});

// Dashboard edits are merged over data/media.ts; a save reaches this page
// within the revalidation window (and immediately after the save itself).
export const revalidate = 60;

export default async function MediaPage() {
  const articles = await getPublicArticles();
  const featured = articles.find((article) => article.featured) ?? articles[0];
  const remaining = featured
    ? articles.filter((article) => article.slug !== featured.slug)
    : [];

  return (
    <>
      <PageHero
        eyebrow="Newsroom"
        title="Media & Press"
        description="Official announcements from the INDTEC EXPO desk, plus analysis of the industrial markets we serve. For press credentials, write to our media team."
        image="/images/hero/hero-media.svg"
        crumbs={[{ label: "Media" }]}
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

      {/* Featured article */}
      {featured ? (
        <Section>
          <Link
            href={`/media/${featured.slug}`}
            className="card card-hover group grid overflow-hidden lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="relative overflow-hidden bg-navy-900">
              <Image
                src={featured.image}
                alt=""
                width={880}
                height={500}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                sizes="(max-width: 1024px) 100vw, 55vw"
                priority
              />
              <span className="absolute left-0 top-0 bg-signal-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                Featured
              </span>
            </div>

            <div className="flex flex-col justify-center p-7 sm:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="brand">{featured.category}</Badge>
                <span className="text-[11px] uppercase tracking-[0.16em] text-steel-500">
                  {featured.dateLabel} · {featured.readTime}
                </span>
              </div>
              <h2 className="display mt-5 text-[clamp(1.5rem,2.8vw,2.25rem)] text-navy-900 group-hover:text-brand-700">
                {featured.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-steel-600">
                {featured.excerpt}
              </p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
                Read the Full Story
                <Icon name="arrow-right" size={13} />
              </span>
            </div>
          </Link>
        </Section>
      ) : null}

      {/* Article list */}
      <Section tone="light">
        <SectionHeading
          eyebrow="All Coverage"
          title="Press Releases & Updates"
          description="Every announcement, update and insight — chronologically, newest first."
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {remaining.map((article) => (
            <Link
              key={article.slug}
              href={`/media/${article.slug}`}
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

      {/* Press desk */}
      <Section tone="dark" className="overflow-hidden">
        <div className="hatch-surface absolute inset-x-0 top-0" />
        <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="eyebrow eyebrow-light mb-4">Press Desk</span>
            <h2 className="display text-[clamp(1.8rem,3.6vw,2.75rem)]">
              Covering INDTEC EXPO?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-steel-300">
              Journalists and trade publications can request press credentials,
              high-resolution media kits, interview slots and floor access for
              all three editions through the media desk.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button href="/contact" variant="primary" size="lg" withArrow>
              Request Press Credentials
            </Button>
            <Button href="/blog" variant="outline-light" size="lg">
              Insights &amp; News
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
