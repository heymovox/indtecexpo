import type { ExpoEvent } from "@/types/event";

export interface NavChild {
  label: string;
  href: string;
  description?: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavChild[];
}

/**
 * The edition links under "Events" in the header. Generated from the live
 * calendar instead of the static list above so the dates shown in the menu
 * always match the dashboard, whatever city or edition is saved there.
 */
export function eventsNavChildren(
  events: Pick<
    ExpoEvent,
    "city" | "slug" | "dateRangeShort" | "venue"
  >[],
): NavChild[] {
  return [
    ...events.map((event) => ({
      label: event.city,
      href: `/events/${event.slug}`,
      description: `${event.dateRangeShort} · ${event.venue.name}`,
    })),
    { label: "All Events", href: "/events", description: "Full 2026–2027 calendar" },
  ];
}

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    // The children here are only the fallback rendered when the live calendar
    // cannot be resolved; see `eventsNavChildren` above.
    label: "Events",
    href: "/events",
    children: [
      {
        label: "Bengaluru",
        href: "/events/bengaluru",
        description: "24–26 Dec 2026 · KLE Ground",
      },
      {
        label: "Coimbatore",
        href: "/events/coimbatore",
        description: "12–14 Feb 2027 · Codessia Road",
      },
      {
        label: "Hosur",
        href: "/events/hosur",
        description: "12–15 Mar 2027 · Hills Exhibition Center",
      },
      { label: "All Events", href: "/events", description: "Full 2026–2027 calendar" },
    ],
  },
  {
    label: "Exhibitors",
    href: "/exhibitors",
    children: [
      { label: "Why Exhibit?", href: "/exhibitors/why-exhibit" },
      { label: "Exhibitor Profile", href: "/exhibitors/exhibitor-profile" },
      { label: "Book Your Stall", href: "/exhibitors/book-your-stall" },
    ],
  },
  { label: "Industries", href: "/industries" },
  { label: "Floor Plan", href: "/floor-plan" },
];

export interface FooterGroup {
  title: string;
  links: { label: string; href: string }[];
}

export const footerNav = {
  explore: [
    { label: "Home", href: "/" },
    { label: "About INDTEC EXPO", href: "/about" },
    { label: "Industries", href: "/industries" },
    { label: "Floor Plan", href: "/floor-plan" },
    { label: "Gallery", href: "/gallery" },
    { label: "Media Centre", href: "/media" },
    { label: "Blog", href: "/blog" },
    { label: "FAQ", href: "/faq" },
  ],
  participate: [
    { label: "Why Exhibit?", href: "/exhibitors/why-exhibit" },
    { label: "Exhibitor Profile", href: "/exhibitors/exhibitor-profile" },
    { label: "Book Your Stall", href: "/exhibitors/book-your-stall" },
    { label: "Sponsorship", href: "/sponsors" },
    { label: "Our Clients", href: "/clients" },
    { label: "Why Visit?", href: "/visitors" },
    { label: "Register as Visitor", href: "/visitors/register" },
    { label: "Contact Us", href: "/contact" },
  ],
  legalLinks: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
} as const;

export const primaryCta = {
  label: "Book Your Stall",
  href: "/exhibitors/book-your-stall",
} as const;

export const secondaryCta = {
  label: "Register as Visitor",
  href: "/visitors/register",
} as const;
