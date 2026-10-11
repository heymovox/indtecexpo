import type { ExpoEvent } from "@/types/event";

export const events: ExpoEvent[] = [
  {
    id: "evt-bengaluru-2026",
    slug: "bengaluru",
    city: "Bengaluru",
    state: "Karnataka",
    edition: "2026",
    name: "INDTEC EXPO 2026 – Bengaluru",
    positioning: "Industrial Business Hub",
    summary:
      "India's technology capital hosts the season opener of INDTEC EXPO, bringing together machine tool, automation and engineering buyers from across Karnataka and beyond.",
    description: [
      "Bengaluru opens the INDTEC EXPO 2026–2027 calendar at KLE Ground, Rajajinagar — a well-connected venue at the centre of one of India's most dynamic industrial markets.",
      "The edition is positioned as the Industrial Business Hub of the series, designed for exhibitors who want direct access to OEMs, tier-1 suppliers, engineering buyers, factory owners and procurement teams from Karnataka, Andhra Pradesh, Telangana and Kerala.",
      "Three focused business days combine a concentrated exhibition floor with scheduled buyer meetings, live machinery demonstrations and networking sessions engineered for serious B2B outcomes.",
    ],
    venue: {
      name: "KLE Ground",
      address: "KLE Ground, Rajajinagar",
      locality: "Rajajinagar",
      city: "Bengaluru",
      state: "Karnataka",
      mapUrl:
        "https://www.google.com/maps/search/?api=1&query=KLE+Ground+Rajajinagar+Bengaluru",
      directionsUrl:
        "https://www.google.com/maps/dir/?api=1&destination=KLE+Ground+Rajajinagar+Bengaluru",
    },
    startDate: "2026-12-24T09:00:00+05:30",
    endDate: "2026-12-26T18:00:00+05:30",
    days: 3,
    dateLabel: "24, 25, 26 December 2026",
    dateRangeShort: "24–26 Dec 2026",
    monthLabel: "Dec 2026",
    heroImage: "/images/events/bengaluru.svg",
    image: "/images/events/bengaluru.svg",
    posterImage: "/images/events/bengaluru-poster.webp",
    floorPlanImage: "/images/floor-plans/bengaluru.svg",
    highlightImages: [
      {
        src: "/images/events/highlight-cnc.webp",
        alt: "CNC machining centre cutting a component on the INDTEC EXPO floor",
      },
      {
        src: "/images/events/highlight-robotics.webp",
        alt: "Robotic arm cell with visitors walking the exhibition aisle",
      },
      {
        src: "/images/events/highlight-automation.webp",
        alt: "Industrial automation stand with robotic arms and CNC machines",
      },
      {
        src: "/images/events/highlight-precision.webp",
        alt: "Precision engineering components and machined parts on display",
      },
    ],
    floorPlanPdf: "/documents/floor-plan-bengaluru.pdf",
    status: "upcoming",
    sectors: [
      "Machine Tools & CNC",
      "Automation & Robotics",
      "Industrial Technology",
      "Engineering Components",
    ],
    highlights: [
      "3 focused business days at KLE Ground",
      "Pre-scheduled buyer–seller meetings",
      "Live machinery and process demonstrations",
      "Delegations from Karnataka, Telangana & Andhra Pradesh",
      "Conference sessions on Industry 4.0 and smart manufacturing",
    ],
    stallOptions: [
      {
        id: "b-shell",
        name: "Shell Space Scheme",
        size: "Per sq m",
        price: "₹10,000 / m²",
        includes: ["Shell structure", "Carpet", "Fascia name panel", "Table & chairs", "Power point"],
      },
      {
        id: "b-bare",
        name: "Bare Space Scheme",
        size: "Per sq m",
        price: "₹9,000 / m²",
        includes: ["Space only", "Common area maintenance", "Exhibitor passes"],
      },
      {
        id: "b-custom",
        name: "Custom / Island",
        size: "On request",
        price: "On request",
        includes: ["Bespoke layout", "Corner & island options", "Priority allocation"],
      },
    ],
    sponsorship: [
      { name: "Title Sponsor", code: "T", price: "₹20 lakh" },
      { name: "Co Sponsor", code: "C", price: "₹10 lakh" },
      { name: "Royal Sponsor", code: "R", price: "₹6 lakh" },
    ],
    stats: [
      { label: "Exhibitors", value: "350+" },
      { label: "Visitors", value: "25,000+" },
      { label: "Product Categories", value: "40+" },
      { label: "Business Days", value: "3" },
    ],
    schedule: [
      {
        day: "Day 01",
        date: "24 Dec 2026",
        label: "Inauguration & Open Floor",
        detail:
          "Opening ceremony, ribbon cut, press meet and the first full floor business day.",
      },
      {
        day: "Day 02",
        date: "25 Dec 2026",
        label: "Buyer–Seller Connect",
        detail:
          "Pre-scheduled meetings, sector conferences and live machine demonstrations.",
      },
      {
        day: "Day 03",
        date: "26 Dec 2026",
        label: "Delegations & Closing",
        detail:
          "State delegation visits, dealer meets and closing networking hour.",
      },
    ],
  },
  {
    id: "evt-coimbatore-2027",
    slug: "coimbatore",
    city: "Coimbatore",
    state: "Tamil Nadu",
    edition: "2027",
    name: "INDTEC EXPO 2027 – Coimbatore",
    positioning: "Manufacturing Hub",
    summary:
      "The engineering capital of South India hosts the manufacturing edition of INDTEC EXPO, built for machine tool users, foundries, textile engineering and auto component makers.",
    description: [
      "Coimbatore is one of India's densest manufacturing clusters — pumps, motors, foundries, textile machinery, auto components and precision engineering all operate within a compact radius.",
      "The INDTEC EXPO Coimbatore edition at Codessia Road is positioned as the Manufacturing Hub of the series, giving exhibitors concentrated access to MSME factory owners, production heads and purchase managers.",
      "Four business days are structured around live equipment demos, application-led presentations and structured networking with the region's engineering buyer community.",
    ],
    venue: {
      name: "Codessia Road Ground",
      address: "Codessia Road, Coimbatore",
      locality: "Coimbatore",
      city: "Coimbatore",
      state: "Tamil Nadu",
      mapUrl:
        "https://www.google.com/maps/search/?api=1&query=Codessia+Road+Coimbatore",
      directionsUrl:
        "https://www.google.com/maps/dir/?api=1&destination=Codessia+Road+Coimbatore",
    },
    startDate: "2027-02-12T09:00:00+05:30",
    endDate: "2027-02-14T18:00:00+05:30",
    days: 3,
    dateLabel: "12, 13, 14 February 2027",
    dateRangeShort: "12–14 Feb 2027",
    monthLabel: "Feb 2027",
    heroImage: "/images/events/coimbatore.svg",
    image: "/images/events/coimbatore.svg",
    posterImage: "/images/events/coimbatore-poster.webp",
    floorPlanImage: "/images/floor-plans/coimbatore.svg",
    highlightImages: [
      {
        src: "/images/events/highlight-cnc.webp",
        alt: "CNC machining centre cutting a component on the INDTEC EXPO floor",
      },
      {
        src: "/images/events/highlight-robotics.webp",
        alt: "Robotic arm cell with visitors walking the exhibition aisle",
      },
      {
        src: "/images/events/highlight-automation.webp",
        alt: "Industrial automation stand with robotic arms and CNC machines",
      },
      {
        src: "/images/events/highlight-precision.webp",
        alt: "Precision engineering components and machined parts on display",
      },
    ],
    floorPlanPdf: "/documents/floor-plan-coimbatore.pdf",
    status: "upcoming",
    sectors: [
      "Machine Tools & CNC",
      "Pneumatics & Hydraulics",
      "Material Handling",
      "Manufacturing Solutions",
    ],
    highlights: [
      "3 business days in the heart of Tamil Nadu's engineering belt",
      "Strong MSME and factory-owner visitor profile",
      "Application-led product demonstrations",
      "Auto component & pump sector buyer delegations",
      "Networking sessions with regional trade associations",
    ],
    stallOptions: [
      {
        id: "c-shell",
        name: "Shell Space Scheme",
        size: "Per sq m",
        price: "₹10,000 / m²",
        includes: ["Shell structure", "Carpet", "Fascia name panel", "Table & chairs", "Power point"],
      },
      {
        id: "c-bare",
        name: "Bare Space Scheme",
        size: "Per sq m",
        price: "₹9,000 / m²",
        includes: ["Space only", "Common area maintenance", "Exhibitor passes"],
      },
      {
        id: "c-custom",
        name: "Custom / Island",
        size: "On request",
        price: "On request",
        includes: ["Bespoke layout", "Corner & island options", "Priority allocation"],
      },
    ],
    sponsorship: [
      { name: "Title Sponsor", code: "T", price: "₹25 lakh" },
      { name: "Co Sponsor", code: "C", price: "₹15 lakh" },
      { name: "Royal Sponsor", code: "R", price: "₹10 lakh" },
    ],
    stats: [
      { label: "Exhibitors", value: "300+" },
      { label: "Visitors", value: "20,000+" },
      { label: "Product Categories", value: "35+" },
      { label: "Business Days", value: "3" },
    ],
    schedule: [
      {
        day: "Day 01",
        date: "12 Feb 2027",
        label: "Floor Opens",
        detail: "Inauguration, association briefings and first business day.",
      },
      {
        day: "Day 02",
        date: "13 Feb 2027",
        label: "Live Demonstrations",
        detail:
          "Machinery demonstrations, application clinics and buyer–seller meetings.",
      },
      {
        day: "Day 03",
        date: "14 Feb 2027",
        label: "Dealer Connect",
        detail:
          "Distributor and dealer programme followed by closing networking hour.",
      },
    ],
  },
  {
    id: "evt-hosur-2027",
    slug: "hosur",
    city: "Hosur",
    state: "Tamil Nadu",
    edition: "2027",
    name: "INDTEC EXPO 2027 – Hosur",
    positioning: "Industrial Growth Corridor",
    summary:
      "The four-day Hosur edition plugs into the Bengaluru–Hosur industrial corridor, one of India's fastest growing belts for auto, EV and precision engineering.",
    description: [
      "Hosur sits on the Bengaluru–Hosur industrial growth corridor, home to a dense concentration of automotive, EV, electrical and precision engineering manufacturers.",
      "The INDTEC EXPO Hosur edition at Hills Exhibition Center runs for four days — the longest in the series — and is positioned as the Industrial Growth Corridor edition.",
      "The extended format supports deeper product showcases, longer buyer meetings and multi-day delegations from corridor manufacturers and investors.",
    ],
    venue: {
      name: "Hills Exhibition Center",
      address: "Hills Exhibition Center, Hosur",
      locality: "Hosur",
      city: "Hosur",
      state: "Tamil Nadu",
      mapUrl:
        "https://www.google.com/maps/search/?api=1&query=Hills+Exhibition+Center+Hosur",
      directionsUrl:
        "https://www.google.com/maps/dir/?api=1&destination=Hills+Exhibition+Center+Hosur",
    },
    startDate: "2027-03-12T09:00:00+05:30",
    endDate: "2027-03-15T18:00:00+05:30",
    days: 4,
    dateLabel: "12, 13, 14, 15 March 2027",
    dateRangeShort: "12–15 Mar 2027",
    monthLabel: "Mar 2027",
    heroImage: "/images/events/hosur.svg",
    image: "/images/events/hosur.svg",
    posterImage: "/images/events/hosur-poster.webp",
    floorPlanImage: "/images/floor-plans/hosur.svg",
    highlightImages: [
      {
        src: "/images/events/highlight-robotics.webp",
        alt: "Robotic arm cell with visitors walking the exhibition aisle",
      },
      {
        src: "/images/events/highlight-automation.webp",
        alt: "Industrial automation stand with robotic arms and CNC machines",
      },
      {
        src: "/images/events/highlight-precision.webp",
        alt: "Precision engineering components and machined parts on display",
      },
      {
        src: "/images/events/highlight-cnc.webp",
        alt: "CNC machining centre cutting a component on the INDTEC EXPO floor",
      },
    ],
    floorPlanPdf: "/documents/floor-plan-hosur.pdf",
    status: "upcoming",
    sectors: [
      "Electrical & Electronics",
      "Automation & Robotics",
      "Instrumentation & Measuring",
      "Engineering Components",
    ],
    highlights: [
      "4 full business days — the longest INDTEC edition",
      "Bengaluru–Hosur industrial corridor buyer access",
      "Auto, EV and precision engineering focus",
      "Extended showcase window for live equipment",
      "Corridor industry delegation programme",
    ],
    stallOptions: [
      {
        id: "h-shell",
        name: "Shell Space Scheme",
        size: "Per sq m",
        price: "₹8,000 / m²",
        includes: ["Shell structure", "Carpet", "Fascia name panel", "Table & chairs", "Power point"],
      },
      {
        id: "h-bare",
        name: "Bare Space Scheme",
        size: "Per sq m",
        price: "₹7,000 / m²",
        includes: ["Space only", "Common area maintenance", "Exhibitor passes"],
      },
      {
        id: "h-custom",
        name: "Custom / Island",
        size: "On request",
        price: "On request",
        includes: ["Bespoke layout", "Corner & island options", "Priority allocation"],
      },
    ],
    sponsorship: [
      { name: "Title Sponsor", code: "T", price: "₹15 lakh" },
      { name: "Co Sponsor", code: "C", price: "₹10 lakh" },
      { name: "Royal Sponsor", code: "R", price: "₹6 lakh" },
    ],
    stats: [
      { label: "Exhibitors", value: "320+" },
      { label: "Visitors", value: "22,000+" },
      { label: "Product Categories", value: "38+" },
      { label: "Business Days", value: "4" },
    ],
    schedule: [
      {
        day: "Day 01",
        date: "12 Mar 2027",
        label: "Opening Day",
        detail: "Inauguration, press meet and first full exhibition day.",
      },
      {
        day: "Day 02",
        date: "13 Mar 2027",
        label: "Technology Showcase",
        detail: "Automation, electronics and instrumentation focus day.",
      },
      {
        day: "Day 03",
        date: "14 Mar 2027",
        label: "Buyer–Seller Connect",
        detail: "Structured meetings with corridor manufacturers and OEMs.",
      },
      {
        day: "Day 04",
        date: "15 Mar 2027",
        label: "Delegation & Closing",
        detail: "Delegation visits, partner meets and closing ceremony.",
      },
    ],
  },
];

export const eventBySlug = (slug: string): ExpoEvent | undefined =>
  events.find((event) => event.slug === slug);

export const eventSlugs = events.map((event) => event.slug);

export function getSortedEvents(): ExpoEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
}

export function getNextEvent(now: Date = new Date()): ExpoEvent | null {
  const sorted = getSortedEvents();
  return (
    sorted.find((event) => new Date(event.endDate).getTime() > now.getTime()) ??
    sorted[sorted.length - 1] ??
    null
  );
}

export function getEventStatus(event: ExpoEvent, now: Date = new Date()) {
  const start = new Date(event.startDate).getTime();
  const end = new Date(event.endDate).getTime();
  if (now.getTime() > end) return "completed" as const;
  if (now.getTime() >= start) return "live" as const;
  return "upcoming" as const;
}
