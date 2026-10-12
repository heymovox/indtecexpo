import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";
import type { ExpoEvent } from "@/types/event";

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
}

export function buildMetadata({
  title,
  description,
  path,
  image = "/images/brand/og-default.svg",
  keywords,
  noIndex = false,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = title.includes(siteConfig.name)
    ? title
    : `${title} | ${siteConfig.name}`;

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
      images: [{ url: absoluteUrl(image), width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [absoluteUrl(image)],
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
    logo: absoluteUrl("/images/brand/logo-footer-white.png"),
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
    image: [absoluteUrl(event.image), absoluteUrl(event.heroImage)],
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
