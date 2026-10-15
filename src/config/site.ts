export const siteConfig = {
  name: "INDTEC EXPO",
  fullName: "INDTEC EXPO 2026–2027",
  legalName: "INDTEC Expo",
  tagline:
    "Industrial Machine Tools and Engineering Technology Trade Fairs",
  shortDescription:
    "INDTEC EXPO 2026–2027 is a three-city industrial machine tools and engineering technology trade fair across Bengaluru, Coimbatore and Hosur, connecting machine tool, automation and engineering manufacturers with buyers, dealers and decision-makers.",
  url: "https://www.indtecexpo.com",
  email: "info@indtecexpo.com",
  exhibitorEmail: "exhibit@indtecexpo.com",
  visitorEmail: "visit@indtecexpo.com",
  phoneNumbers: [
    "7406213220",
    "7406213221",
    "7406213222",
    "7406213223",
  ] as const,
  primaryPhone: "7406213220",
  whatsappNumber: "917406213220",
  website: "www.indtecexpo.com",
  organizer: {
    name: "Konnekt Globe",
    descriptor: "Exhibitions | Trade Fairs | Business Connect",
    mission: "Connecting Industries Globally",
    url: "https://www.konnektglobe.com",
  },
  social: {
    linkedin: "https://www.linkedin.com/company/indtec-expo",
    facebook: "https://www.facebook.com/indtecexpo",
    instagram: "https://www.instagram.com/indtecexpo",
    x: "https://x.com/indtecexpo",
    youtube: "https://www.youtube.com/@indtecexpo",
  },
  keywords: [
    "INDTEC Expo",
    "INDTEC Expo 2026",
    "INDTEC Expo 2027",
    "Industrial Expo India",
    "Machine Tools Expo",
    "Engineering Expo India",
    "Industrial Technology Expo",
    "Industrial Machine Tools Trade Fair",
    "Manufacturing Expo",
    "Automation Expo",
    "Machine Tools Exhibition",
    "CNC Expo India",
  ],
  values: ["CONNECT", "INNOVATE", "GROW"] as const,
} as const;

export type SiteConfig = typeof siteConfig;

export const contactConfig = {
  label: "For Stall Bookings & Enquiries",
  phones: siteConfig.phoneNumbers.map((n) => ({
    number: n,
    display: `+91 ${n.slice(0, 5)} ${n.slice(5)}`,
    tel: `+91${n}`,
    wa: `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
      "Hello INDTEC EXPO, I would like to enquire about exhibiting.",
    )}`,
  })),
  email: siteConfig.email,
  exhibitorEmail: siteConfig.exhibitorEmail,
  visitorEmail: siteConfig.visitorEmail,
  website: siteConfig.url,
  address: {
    line1: "Konnekt Globe – Exhibitions | Trade Fairs | Business Connect",
    line2: "Bengaluru, Karnataka, India",
  },
  hours: "Mon – Sat · 10:00 – 19:00 IST",
} as const;
