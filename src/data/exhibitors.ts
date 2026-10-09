import type {
  ExhibitorCategory,
  WhyExhibitBenefit,
  WhyVisitBenefit,
} from "@/types/exhibitor";
import { industries } from "@/data/industries";

export const exhibitorCategories: ExhibitorCategory[] = industries.map(
  (industry) => ({
    id: `cat-${industry.id}`,
    slug: industry.slug,
    name: industry.name,
    description: industry.description,
    icon: industry.icon,
    image: industry.image,
    products: industry.sectors,
  }),
);

export const whyExhibitBenefits: WhyExhibitBenefit[] = [
  {
    id: "wb-1",
    title: "Meet Industrial Buyers & Decision-Makers",
    description:
      "Face-to-face access to factory owners, procurement heads, production managers and engineering decision-makers who buy capital equipment.",
    icon: "handshake",
  },
  {
    id: "wb-2",
    title: "Generate Business Enquiries & Quality Leads",
    description:
      "Every exhibition day produces qualified, intent-driven leads that convert far faster than cold outreach or digital campaigns.",
    icon: "target",
  },
  {
    id: "wb-3",
    title: "Expand Your Dealer & Distributor Network",
    description:
      "Three industrial hubs give you a structured platform to recruit, review and motivate channel partners across South India.",
    icon: "network",
  },
  {
    id: "wb-4",
    title: "Showcase Your Latest Products & Technologies",
    description:
      "Demonstrate live machinery, running applications and new releases to an audience that came specifically to evaluate technology.",
    icon: "display",
  },
  {
    id: "wb-5",
    title: "Explore New Business Partnerships",
    description:
      "Discover OEM tie-ups, subcontracting opportunities, technology collaborations and cross-industry alliances on the floor.",
    icon: "link",
  },
  {
    id: "wb-6",
    title: "Strengthen Your Brand Presence",
    description:
      "Position your brand alongside leading manufacturers in a premium, high-visibility B2B environment across three editions.",
    icon: "brand",
  },
];

export const whyVisitBenefits: WhyVisitBenefit[] = [
  {
    id: "vv-1",
    title: "Discover the latest industrial technologies",
    description:
      "See running machinery, new releases and Industry 4.0 solutions before they reach your plant floor.",
    icon: "rocket",
  },
  {
    id: "vv-2",
    title: "Meet manufacturers and suppliers",
    description:
      "Direct access to 300+ exhibitors across machine tools, automation, electricals and engineering components.",
    icon: "factory",
  },
  {
    id: "vv-3",
    title: "Find new industrial solutions",
    description:
      "Compare applications side by side and shortlist solutions for capacity, quality and cost challenges.",
    icon: "search",
  },
  {
    id: "vv-4",
    title: "Connect with decision-makers",
    description:
      "Network with peers, plant heads, consultants and industry associations across three industrial hubs.",
    icon: "users",
  },
  {
    id: "vv-5",
    title: "Build dealer and distributor relationships",
    description:
      "Discover new suppliers and channel partners to strengthen your own sourcing and distribution network.",
    icon: "network",
  },
  {
    id: "vv-6",
    title: "Explore new business opportunities",
    description:
      "Spot emerging categories, new technologies and partnership opportunities that open fresh revenue lines.",
    icon: "growth",
  },
];

export const visitorPrerequisites = [
  "Free entry for trade visitors and industry professionals",
  "Carry a valid business card or company ID for verification",
  "Register online to skip the on-site registration queue",
  "Open to students of engineering and technology on Day 3",
];

/* The official product-category list exhibitors are allotted against. */
export const exhibitableCategories = [
  "Abrasive and Polishing Tools",
  "Additive Manufacturing",
  "Assembling Systems & Industrial Robots",
  "Attachments, Accessories & Sub-systems",
  "Automation for Storage & Transport",
  "Bar, Section and Tube Working Machines",
  "Casting & Foundry",
  "CNC Machines and Spares",
  "CNC Tools Manufacturers",
  "Components for Robotics & Automation",
  "Controls, Drives and Systems",
  "Cutting Tools",
  "Die Casting",
  "Dies & Moulds",
  "Drilling and Boring Machines",
  "Electric Discharge Machines (EDM)",
  "Electrical & Electronic Equipment",
  "Engineering Machinery and Parts",
  "Engineering Measurement Devices",
  "Feeding Systems",
  "Fire Safety & Hardware Products",
  "Forging & Extrusion",
  "Forming Tools",
  "Foundry and Forging Machines",
  "Gear Cutting and Finishing Machines",
  "Hand Held Tools",
  "Hardening and Heating Machines",
  "Heat Exchangers",
  "Heat Treatment & Hardening",
  "Honing, Lapping and Polishing",
  "Hydraulic & Mechanical Products",
  "Hydraulic and Pneumatic Systems",
  "Joining & Welding",
  "Lubrication & Coolants",
  "Machine Tools",
  "Material Handling Equipment",
  "Measuring, Inspection & Quality Control",
  "Mechanical Elements and Components",
  "Metal Forming Machine Tools",
  "Plastic Products & Machinery",
  "Pollution Control Systems",
  "Power Tools & Hand Tools",
  "Printing & Packaging Machines",
  "Production Control & Networks",
  "Robotics & Manufacturing Automation",
  "Safety & Environment",
  "Sheet Metal Components",
  "Software",
  "Testing Machines",
  "Tooling Systems",
  "Warehousing Technologies",
  "Welding",
] as const;
