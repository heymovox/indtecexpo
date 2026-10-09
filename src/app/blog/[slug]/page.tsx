import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Section, Badge } from "@/components/ui/Section";
import { mediaArticles, articleBySlug } from "@/data/media";
import { absoluteUrl } from "@/lib/utils";
import {
  breadcrumbJsonLd,
  buildMetadata,
  JsonLd,
} from "@/lib/seo";
import { waLink } from "@/lib/whatsapp";

export function generateStaticParams() {
  return mediaArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) {
    return buildMetadata({
      title: "Article Not Found",
      description: "The requested article could not be found.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/blog/${article.slug}`,
    image: article.image,
  });
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) notFound();

  const url = absoluteUrl(`/blog/${article.slug}`);
  const waShare = waLink(`Read “${article.title}” — ${url}`);
  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const xShare = `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(article.title)}`;
  const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  const related = [
    ...mediaArticles.filter(
      (item) => item.slug !== article.slug && item.category === article.category,
    ),
    ...mediaArticles.filter(
      (item) => item.slug !== article.slug && item.category !== article.category,
    ),
  ].slice(0, 3);

  return (
    <>
      <header className="relative isolate overflow-hidden bg-navy-950 text-white">
        <Image
          src={article.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/90 to-navy-950/50" />
        <div className="hatch-surface absolute inset-x-0 bottom-0 -z-10 h-1.5" />

        <div className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
          <nav aria-label="Breadcrumb" className="mb-7">
            <ol className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-steel-400">
              <li>
                <Link href="/" className="transition hover:text-gold-500">
                  Home
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="text-steel-600">/</span>
                <Link href="/blog" className="transition hover:text-gold-500">
                  Insights &amp; News
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="text-steel-600">/</span>
                <span className="text-steel-200">{article.category}</span>
              </li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="outline">{article.category}</Badge>
              <span className="text-[11px] uppercase tracking-[0.16em] text-steel-400">
                {article.dateLabel} · {article.readTime}
              </span>
            </div>
            <h1 className="display mt-5 text-[clamp(2rem,4.6vw,3.5rem)]">
              {article.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-steel-300 sm:text-lg">
              {article.excerpt}
            </p>
          </div>
        </div>
      </header>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <article className="max-w-3xl">
            <div className="space-y-6">
              {article.body.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-base leading-relaxed text-steel-700 sm:text-lg sm:leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-10 border-t border-steel-200 pt-7">
              <h2 className="display-sm text-sm tracking-[0.18em] text-navy-800">
                SHARE THIS ARTICLE
              </h2>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button href={waShare} variant="outline" size="sm">
                  <Icon name="whatsapp" size={15} className="mr-1.5 text-success-500" />
                  WhatsApp
                </Button>
                <Button href={linkedInShare} variant="outline" size="sm">
                  LinkedIn
                </Button>
                <Button href={xShare} variant="outline" size="sm">
                  X / Twitter
                </Button>
                <Button href={facebookShare} variant="outline" size="sm">
                  Facebook
                </Button>
              </div>
            </div>
          </article>

          <aside className="space-y-6">
            <div className="border border-steel-200 bg-steel-50 p-6">
              <h2 className="display-sm text-lg text-navy-900">
                Experience It Live
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-steel-600">
                The technologies discussed here are demonstrated live at every
                INDTEC EXPO edition. Trade entry is free.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button href="/visitors/register" variant="secondary" size="sm" withArrow>
                  Register as Visitor
                </Button>
                <Button href="/events" variant="outline" size="sm">
                  Explore Events
                </Button>
              </div>
            </div>

            <div className="border border-steel-200 p-6">
              <h2 className="display-sm text-lg text-navy-900">More Insights</h2>
              <ul className="mt-4 space-y-3.5">
                {mediaArticles
                  .filter((item) => item.slug !== article.slug)
                  .slice(0, 4)
                  .map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/blog/${item.slug}`}
                        className="link-underline block text-sm font-semibold leading-snug text-navy-800 transition hover:text-brand-600"
                      >
                        {item.title}
                      </Link>
                      <span className="mt-1 block text-[11px] uppercase tracking-[0.14em] text-steel-500">
                        {item.dateLabel}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="light">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="eyebrow eyebrow-dark mb-3">Keep Reading</span>
            <h2 className="display text-[clamp(1.6rem,3vw,2.25rem)] text-navy-900">
              Related Articles
            </h2>
          </div>
          <Button href="/blog" variant="outline" withArrow>
            All Insights
          </Button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {related.map((item) => (
            <Link
              key={item.slug}
              href={`/blog/${item.slug}`}
              className="card card-hover group flex h-full flex-col overflow-hidden"
            >
              <div className="relative overflow-hidden bg-navy-900">
                <Image
                  src={item.image}
                  alt=""
                  width={560}
                  height={315}
                  className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  loading="lazy"
                />
                <span className="absolute left-0 top-0 bg-navy-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-500">
                  {item.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="text-[11px] uppercase tracking-[0.16em] text-steel-500">
                  {item.dateLabel} · {item.readTime}
                </span>
                <h3 className="display-sm mt-3 text-base leading-snug text-navy-900 group-hover:text-brand-700 sm:text-lg">
                  {item.title}
                </h3>
                <span className="mt-auto flex items-center gap-1.5 pt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
                  Read More
                  <Icon name="arrow-right" size={13} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Insights & News", path: "/blog" },
          { name: article.title, path: `/blog/${article.slug}` },
        ])}
      />
    </>
  );
}
