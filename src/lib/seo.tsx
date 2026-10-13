import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";
import type { ExpoEvent } from "@/types/event";

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  /**
   * Preset name for the generated share card, e.g. "about" or "floor-plan".
   * Ignored when ogTitle is supplied, which switches the card to dynamic mode.
   */
  card?: string;
  /** Overrides the card title; enables per-page dynamic cards. */
  ogTitle?: string;
  ogEyebrow?: string;
  keywords?: string[];
  noIndex?: boolean;
}

/**
 * Builds the absolute URL of the generated PNG share card.
 *
 * Always a raster image: every content asset on this site (event, blog, media
 * and industry artwork) is an SVG, and Facebook, WhatsApp, LinkedIn and X all
 * refuse to render SVG for og:image, so a shared link showed no preview at all.
 */
function ogImageUrl(input: {
  card?: string;
  ogTitle?: string;
  ogEyebrow?: string;
}): string {
  const params = new URLSearchParams();
  params.set("card", input.card ?? "brand");
  if (input.ogTitle) params.set("title", input.ogTitle);
  if (input.ogEyebrow) params.set("eyebrow", input.ogEyebrow);
  return absoluteUrl(`/og?${params.toString()}`);
}

export function buildMetadata({
  title,
  description,
  path,
  card,
  ogTitle,
  ogEyebrow,
  keywords,
  noIndex = false,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = title.includes(siteConfig.name)
    ? title
    : `${title} | ${siteConfig.name}`;
  const imageUrl = ogImageUrl({ card, ogTitle, ogEyebrow });

  return {
    title: fullTitle,
    description,
    keywords: keywords ?? [...siteConfig.keywords],
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      locale: "en_IN",
      url,
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
  };
}

/* ------------------------------------------------------------------ */
/* Structured data                                                     */
/* ------------------------------------------------------------------ */

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${absoluteUrl("/")}#organization`,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/images/brand/indtec-expo-2026-colored.png"),
    slogan: siteConfig.tagline,
    description: siteConfig.shortDescription,
    email: `mailto:${siteConfig.email}`,
    telephone: `+91${siteConfig.primaryPhone}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
    sameAs: Object.values(siteConfig.social),
    member: {
      "@type": "Organization",
      name: siteConfig.organizer.name,
      slogan: siteConfig.organizer.mission,
      description: siteConfig.organizer.descriptor,
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}#website`,
    url: absoluteUrl("/"),
    name: siteConfig.name,
    description: siteConfig.shortDescription,
    publisher: { "@id": `${absoluteUrl("/")}#organization` },
    inLanguage: "en-IN",
  };
}

export function eventJsonLd(event: ExpoEvent) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: event.summary,
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    // The static event artwork is SVG, which search engines and social
    // platforms will not render. Point Event schema at the generated PNG card
    // as well so the rich result always has a usable image.
    image: [
      ogImageUrl({ card: "event", ogTitle: event.name, ogEyebrow: `${event.city} · ${event.dateRangeShort}` }),
      absoluteUrl(event.image),
      absoluteUrl(event.heroImage),
    ],
    url: absoluteUrl(`/events/${event.slug}`),
    location: {
      "@type": "Place",
      name: event.venue.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.venue.address,
        addressLocality: event.venue.city,
        addressRegion: event.venue.state,
        addressCountry: "IN",
      },
    },
    organizer: {
      "@type": "Organization",
      name: siteConfig.organizer.name,
      url: siteConfig.organizer.url,
    },
    offers: {
      "@type": "Offer",
      name: "Exhibitor Stall Booking",
      priceCurrency: "INR",
      price: event.stallOptions[0]?.price ?? "0",
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/exhibitors/book-your-stall"),
      validFrom: new Date().toISOString(),
    },
    performer: { "@id": `${absoluteUrl("/")}#organization` },
  };
}

export function collectionJsonLd(
  events: ExpoEvent[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "INDTEC EXPO 2026–2027 Editions",
    numberOfItems: events.length,
    itemListElement: events.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: eventJsonLd(event),
    })),
  };
}

export function faqJsonLd(
  items: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
