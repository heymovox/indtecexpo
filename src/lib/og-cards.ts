/**
 * Preset share cards.
 *
 * Every share card is generated as a PNG. The site's content images (event,
 * blog, media and industry artwork) are all SVG, and no major platform will
 * render an SVG for `og:image`, so cards are generated rather than reused.
 *
 * A card can also be customised per request through the `/og` route query
 * string, which lets dynamic pages (event, blog, media) put their real title
 * on the card instead of sharing one generic preset.
 */

export interface OgCardSpec {
  eyebrow?: string;
  title: string;
  description?: string;
  chips?: string[];
}

export const OG_CARDS = {
  brand: {
    eyebrow: "Invitation",
    title: "INDTEC EXPO 2026-2027",
    description:
      "India's leading B2B industrial machine tools, engineering and technology expo across Bengaluru, Coimbatore and Hosur.",
    chips: ["Bengaluru", "Coimbatore", "Hosur"],
  },
  about: {
    eyebrow: "Who We Are",
    title: "Built for the Industrial Buyer",
    description:
      "Three cities, 500+ exhibitors and one decision-making floor across South India.",
  },
  gallery: {
    eyebrow: "Photography",
    title: "The Floor, As It Actually Looks",
    description:
      "Aisles, machine demonstrations, inaugurations and buyer conversations from previous editions.",
  },
  "floor-plan": {
    eyebrow: "Stall Layout",
    title: "Plan Your Stall",
    description:
      "Every stall position, its dimensions and pricing for Bengaluru, Coimbatore and Hosur.",
  },
  exhibitors: {
    eyebrow: "For Exhibitors",
    title: "Meet the Buyers Who Sign",
    description:
      "Shell and bare space from INR 7,000 per square metre, across three industrial hubs.",
  },
  visitors: {
    eyebrow: "For Visitors",
    title: "Walk the Aisle",
    description:
      "Entry is free for trade visitors. Bring a specification sheet and meet the people who specify.",
  },
  sponsors: {
    eyebrow: "Partnership",
    title: "Put Your Brand on the Floor",
    description:
      "Title, Royal and Co Sponsor packages across all three editions.",
  },
  industries: {
    eyebrow: "Sectors",
    title: "Eight Industrial Sectors",
    description:
      "Machine tools, automation, pneumatics, electrical and more.",
  },
  events: {
    eyebrow: "Calendar",
    title: "Three Cities, Three Editions",
    description:
      "Bengaluru December 2026, Coimbatore February 2027 and Hosur March 2027.",
  },
  event: {
    eyebrow: "Edition",
    title: "INDTEC EXPO",
    description: "India's leading B2B industrial machine tools and engineering expo.",
    chips: ["Book a Stall", "Register as Visitor"],
  },
  article: {
    eyebrow: "INDTEC EXPO",
    title: "INDTEC EXPO",
    description: "News, insight and coverage from the INDTEC EXPO team.",
  },
} as const satisfies Record<string, OgCardSpec>;

export type OgCardName = keyof typeof OG_CARDS;

/** Presets are referenced by slug throughout the metadata helper. */
export const OG_CARD_BY_SLUG: Record<string, OgCardSpec> = OG_CARDS;