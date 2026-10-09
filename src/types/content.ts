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

export interface MediaArticle {
  slug: string;
  title: string;
  category: "Latest News" | "Press Releases" | "Expo Updates" | "Industry Insights";
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
