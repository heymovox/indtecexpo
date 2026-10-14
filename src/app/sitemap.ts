import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";
import { getSortedEvents } from "@/data/events";
import { mediaArticles } from "@/data/media";
import { industries } from "@/data/industries";

/**
 * Sitemap for the public site.
 *
 * Built from the same data the pages render, so a new edition, article or
 * industry is picked up automatically rather than having to be listed by hand.
 */

/** High-intent landing pages. */
const LANDING = [
  "/",
  "/events",
  "/exhibitors",
  "/exhibitors/book-your-stall",
  "/industries",
  "/visitors",
  "/visitors/register",
];

/** Supporting pages, still indexable. */
const SUPPORTING = [
  "/about",
  "/clients",
  "/contact",
  "/faq",
  "/floor-plan",
  "/gallery",
  "/sponsors",
  "/media",
  "/blog",
];

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entry = (
    path: string,
    priority: number,
    changeFrequency: "daily" | "weekly" | "monthly" | "yearly",
  ) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    ...LANDING.map((path) => entry(path, 1, "weekly" as const)),
    ...getSortedEvents().map((event) =>
      entry(`/events/${event.slug}`, 0.9, "monthly"),
    ),
    ...industries.map((industry) =>
      entry(`/industries/${industry.slug}`, 0.7, "monthly"),
    ),
    ...SUPPORTING.map((path) => entry(path, 0.6, "monthly")),
    ...mediaArticles.map((article) => entry(`/media/${article.slug}`, 0.6, "monthly")),
  ];
}

export const metadataBase = new URL(siteConfig.url);