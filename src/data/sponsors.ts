import type { SponsorTier } from "@/types/content";

export const sponsorTiers: SponsorTier[] = [
  {
    id: "title-sponsors",
    title: "Title Sponsors",
    description:
      "Flagship partners who anchor the INDTEC EXPO stage across all three editions.",
    logos: [
      { id: "ts-1", name: "Prime MachineTools", logo: "/images/sponsors/prime-machinetools.svg" },
      { id: "ts-2", name: "Axis Automation", logo: "/images/sponsors/axis-automation.svg" },
      { id: "ts-3", name: "Bharat Industrial", logo: "/images/sponsors/bharat-industrial.svg" },
    ],
  },
  {
    id: "industry-partners",
    title: "Industry Partners",
    description:
      "Manufacturing bodies and cluster associations driving visitor delegations.",
    logos: [
      { id: "ip-1", name: "South India Mfg Association", logo: "/images/sponsors/sima.svg" },
      { id: "ip-2", name: "Coimbatore Engineering Cluster", logo: "/images/sponsors/cec.svg" },
      { id: "ip-3", name: "Hosur Industries Forum", logo: "/images/sponsors/hif.svg" },
      { id: "ip-4", name: "Karnataka MSME Council", logo: "/images/sponsors/kmc.svg" },
    ],
  },
  {
    id: "media-partners",
    title: "Media Partners",
    description:
      "Trade publications and industrial media covering the INDTEC EXPO calendar.",
    logos: [
      { id: "mp-1", name: "Engineering Review", logo: "/images/sponsors/engineering-review.svg" },
      { id: "mp-2", name: "Manufacturing Today", logo: "/images/sponsors/manufacturing-today.svg" },
      { id: "mp-3", name: "Industrial Digest", logo: "/images/sponsors/industrial-digest.svg" },
      { id: "mp-4", name: "TechFab Journal", logo: "/images/sponsors/techfab.svg" },
    ],
  },
  {
    id: "technology-partners",
    title: "Technology Partners",
    description:
      "Digital and platform partners supporting the expo's technology experience.",
    logos: [
      { id: "tp-1", name: "GridWorks Cloud", logo: "/images/sponsors/gridworks.svg" },
      { id: "tp-2", name: "Metrica Analytics", logo: "/images/sponsors/metrica.svg" },
      { id: "tp-3", name: "Nexa Digital", logo: "/images/sponsors/nexa.svg" },
    ],
  },
  {
    id: "association-partners",
    title: "Association Partners",
    description:
      "Trade associations and chambers collaborating on industry participation.",
    logos: [
      { id: "ap-1", name: "Machine Tools Association", logo: "/images/sponsors/mta.svg" },
      { id: "ap-2", name: "Automation Council of India", logo: "/images/sponsors/aci.svg" },
      { id: "ap-3", name: "Indian Engineering Chamber", logo: "/images/sponsors/iec.svg" },
    ],
  },
];

export const sponsorTierById = (id: string) =>
  sponsorTiers.find((tier) => tier.id === id);
