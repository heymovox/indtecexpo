import type { Industry, IndustrySector } from "@/types/industry";

export const industries: Industry[] = [
  {
    id: "ind-machine-tools",
    slug: "machine-tools-cnc",
    name: "Machine Tools & CNC",
    shortName: "Machine Tools",
    description:
      "CNC machining centres, lathes, milling machines, grinding machines, presses, sheet metal working equipment and precision tooling.",
    icon: "machine",
    image: "/images/industries/machine-tools.svg",
    sectors: [
      "CNC Machining Centres",
      "Lathes & Turning Centres",
      "Milling & Grinding Machines",
      "Presses & Sheet Metal",
      "Cutting Tools & Tooling Systems",
      "Workholding & Fixtures",
    ],
    featured: true,
  },
  {
    id: "ind-automation",
    slug: "automation-robotics",
    name: "Automation & Robotics",
    shortName: "Automation",
    description:
      "Industrial robots, cobots, PLC & SCADA systems, servo drives, conveyors and turnkey line automation for smart factories.",
    icon: "robot",
    image: "/images/industries/automation.svg",
    sectors: [
      "Industrial Robots & Cobots",
      "PLC, HMI & SCADA",
      "Servo & Drives",
      "Vision Inspection Systems",
      "Line & Cell Automation",
      "Smart Factory Solutions",
    ],
    featured: true,
  },
  {
    id: "ind-industrial-tech",
    slug: "industrial-technology",
    name: "Industrial Technology",
    shortName: "Industrial Tech",
    description:
      "Industry 4.0 platforms, IIoT, digital twins, MES, predictive maintenance and connected manufacturing technologies.",
    icon: "chip",
    image: "/images/industries/industrial-technology.svg",
    sectors: [
      "Industry 4.0 & IIoT",
      "MES & ERP Integration",
      "Digital Twin & Simulation",
      "Predictive Maintenance",
      "Cloud Manufacturing Platforms",
      "Cybersecurity for Industry",
    ],
    featured: true,
  },
  {
    id: "ind-electrical",
    slug: "electrical-electronics",
    name: "Electrical & Electronics",
    shortName: "Electrical",
    description:
      "Industrial electricals, switchgear, drives, panels, cables, sensors, semiconductors and power electronics.",
    icon: "bolt",
    image: "/images/industries/electrical.svg",
    sectors: [
      "Switchgear & Control Gear",
      "VFDs & Soft Starters",
      "Industrial Panels & Enclosures",
      "Cables, Wires & Connectors",
      "Sensors & Electronic Components",
      "Power Electronics & UPS",
    ],
  },
  {
    id: "ind-instrumentation",
    slug: "instrumentation-measuring",
    name: "Instrumentation & Measuring",
    shortName: "Instrumentation",
    description:
      "Metrology, CMM, gauges, calibrators, test benches, condition monitoring and quality assurance systems.",
    icon: "gauge",
    image: "/images/industries/instrumentation.svg",
    sectors: [
      "Metrology & CMM",
      "Precision Gauges",
      "Calibration Instruments",
      "Test & Measurement Benches",
      "Condition Monitoring",
      "Quality Assurance Systems",
    ],
  },
  {
    id: "ind-material-handling",
    slug: "material-handling",
    name: "Material Handling",
    shortName: "Handling",
    description:
      "Cranes, hoists, forklifts, AGV & AMR, racking systems, palletising and warehouse automation.",
    icon: "crane",
    image: "/images/industries/material-handling.svg",
    sectors: [
      "Cranes, Hoists & Winches",
      "Forklifts & Reach Trucks",
      "AGV & AMR",
      "Racking & Storage Systems",
      "Palletising & Depalletising",
      "Warehouse Automation",
    ],
  },
  {
    id: "ind-pneumatics",
    slug: "pneumatics-hydraulics",
    name: "Pneumatics & Hydraulics",
    shortName: "Pneumatics",
    description:
      "Cylinders, valves, FRL units, pumps, power packs, seals and fluid power components for heavy duty machinery.",
    icon: "pressure",
    image: "/images/industries/pneumatics.svg",
    sectors: [
      "Pneumatic Cylinders & Valves",
      "FRL Units & Air Preparation",
      "Hydraulic Power Packs",
      "Pumps & Motors",
      "Seals & Gaskets",
      "Fluid Power Systems",
    ],
  },
  {
    id: "ind-components",
    slug: "engineering-components",
    name: "Engineering Components",
    shortName: "Components",
    description:
      "Bearings, gears, fasteners, couplings, springs, machined parts and precision forged & cast components.",
    icon: "gear",
    image: "/images/industries/components.svg",
    sectors: [
      "Bearings & Linear Motion",
      "Gears & Gearboxes",
      "Fasteners & Fixings",
      "Couplings & Springs",
      "Machined Components",
      "Castings, Forgings & Stampings",
    ],
  },
  {
    id: "ind-manufacturing",
    slug: "manufacturing-solutions",
    name: "Manufacturing Solutions",
    shortName: "Manufacturing",
    description:
      "Additive manufacturing, welding, surface treatment, heat treatment, assembly lines and contract manufacturing.",
    icon: "factory",
    image: "/images/industries/manufacturing.svg",
    sectors: [
      "Additive Manufacturing",
      "Welding & Joining",
      "Surface & Heat Treatment",
      "Assembly Line Solutions",
      "Contract Manufacturing",
      "EPC & Turnkey Projects",
    ],
  },
  {
    id: "ind-services",
    slug: "industrial-services",
    name: "Industrial Services",
    shortName: "Services",
    description:
      "Engineering design, maintenance, logistics, finance, Industry 4.0 consulting and industrial training providers.",
    icon: "service",
    image: "/images/industries/services.svg",
    sectors: [
      "Engineering & Design (CAD/CAE)",
      "Maintenance & Reliability Services",
      "Industrial Logistics",
      "Machinery Finance & Leasing",
      "Consulting & Training",
      "Standards, Testing & Certification",
    ],
  },
];

export const featuredIndustries = industries.filter((item) => item.featured);

export const industryBySlug = (slug: string) =>
  industries.find((item) => item.slug === slug);

export const industrySectors: IndustrySector[] = industries.map((item) => ({
  id: item.id,
  name: item.name,
  description: item.description,
  image: item.image,
  icon: item.icon,
  exhibitorProfile: item.sectors,
}));

export const productCategories = industries.flatMap((item) => item.sectors);

export const interestAreas = [
  "Machine Tools & CNC",
  "Automation & Robotics",
  "Industry 4.0 & IIoT",
  "Electrical & Electronics",
  "Instrumentation & Measuring",
  "Material Handling",
  "Pneumatics & Hydraulics",
  "Engineering Components",
  "Manufacturing Solutions",
  "Industrial Services",
];
