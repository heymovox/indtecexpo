export interface SponsorTier {
  id: string;
  title: string;
  description: string;
  logos: SponsorLogo[];
}

export interface SponsorLogo {
  id: string;
  name: string;
  logo: string;
  url?: string;
  category?: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  category: GalleryCategory;
  image: string;
  span?: "wide" | "tall" | "normal";
  caption?: string;
}

export type GalleryCategory =
  | "Expo"
  | "Exhibitors"
  | "Visitors"
  | "Machines"
  | "Networking"
  | "Events";

/**
 * Article categories, kept as a runtime value so the admin API schema, the
 * dashboard select and the public badges all agree on one list.
 */
export const ARTICLE_CATEGORIES = [
  "Latest News",
  "Press Releases",
  "Expo Updates",
  "Industry Insights",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export function isArticleCategory(value: unknown): value is ArticleCategory {
  return (
    typeof value === "string" &&
    (ARTICLE_CATEGORIES as readonly string[]).includes(value)
  );
}

export interface MediaArticle {
  slug: string;
  title: string;
  category: ArticleCategory;
  date: string;
  dateLabel: string;
  image: string;
  excerpt: string;
  body: string[];
  readTime: string;
  featured?: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  group: "Exhibiting" | "Visiting" | "Events" | "General";
}
