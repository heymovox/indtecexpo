/**
 * Exhibition floor plans.
 *
 * Transcribed from the organiser's own floor plan documents
 * (BANGALORE_INDTEC_EXPO_FLOOR_PLAN_2026.docx, extracted 2026-10-11).
 *
 * Layouts are row-major grids. An empty string means aisle — those cells are
 * rendered as walkways so the plan keeps its published shape. Stall codes are
 * the organiser's own identifiers and must not be renumbered: enquiries
 * reference them verbatim.
 */

export interface StallTypeSpec {
  /** Organiser code prefix, e.g. "B" in "B42". */
  code: string;
  /** Plain-language label shown in the legend and selection summary. */
  name: string;
  dimensions: string;
  /** Area in square metres, used for indicative pricing. */
  area: number;
  /** Sponsorship stalls are sold as packages rather than per square metre. */
  sponsorship?: string;
  sponsorshipPrice?: string;
  /** Tailwind classes for the stall fill, chosen to stay legible in print. */
  tone: "sponsor" | "royal" | "premium" | "standard";
}

export interface SpaceScheme {
  name: string;
  pricePerSqM: number;
}

export interface StallPlan {
  slug: string;
  venue: string;
  address: string;
  dates: string;
  /** Row-major grid; "" is an aisle. */
  rows: string[][];
  types: Record<string, StallTypeSpec>;
  schemes: SpaceScheme[];
  /** Two-letter (or one) prefix used for grouping, e.g. "B" from "B42". */
  prefixOf: (code: string) => string;
}

const BENGALURU_TYPES: Record<string, StallTypeSpec> = {
  T: {
    code: "T",
    name: "Title Sponsor",
    dimensions: "9 m × 6 m",
    area: 54,
    sponsorship: "Title Sponsor",
    sponsorshipPrice: "₹20 lakh",
    tone: "sponsor",
  },
  C: {
    code: "C",
    name: "Co Sponsor",
    dimensions: "6 m × 6 m",
    area: 36,
    sponsorship: "Co Sponsor",
    sponsorshipPrice: "₹10 lakh",
    tone: "royal",
  },
  R: {
    code: "R",
    name: "Royal Sponsor",
    dimensions: "9 m × 3 m",
    area: 27,
    sponsorship: "Royal Sponsor",
    sponsorshipPrice: "₹6 lakh",
    tone: "royal",
  },
  K: {
    code: "K",
    name: "Large Exhibition Stall",
    dimensions: "6 m × 3 m",
    area: 18,
    tone: "premium",
  },
  B: {
    code: "B",
    name: "Standard Exhibition Stall",
    dimensions: "3 m × 3 m",
    area: 9,
    tone: "standard",
  },
};

const BENGALURU_ROWS: string[][] = [
  ["", "R6", "B50", "B49", "B48", "B20", "B19", "B18", "", "K5", "R4", ""],
  ["", "", "", "", "", "", "", "", "", "", "", ""],
  ["B76", "", "K21", "K18", "", "K17", "K14", "", "K13", "K6", "", "K4"],
  ["B75", "", "", "", "", "", "", "", "", "", "", ""],
  ["B74", "", "B51", "B47", "", "B21", "B17", "", "K12", "K7", "", "K3"],
  ["B73", "", "B52", "B46", "", "B22", "B16", "", "", "", "", ""],
  ["B72", "", "B53", "B45", "", "B23", "B15", "", "K11", "K8", "", "K2"],
  ["B71", "", "B54", "B44", "", "B24", "B14", "", "", "", "", ""],
  ["B70", "", "B55", "B43", "", "B25", "B13", "", "K10", "K9", "", "K1"],
  ["B69", "", "B56", "B42", "", "B26", "B12", "", "", "", "", ""],
  ["B68", "", "B57", "B41", "", "B27", "B11", "", "B3", "B2", "", "B1"],
  ["B67", "", "B58", "B40", "", "B28", "B10", "", "", "C3", "", "R3"],
  ["B66", "", "B59", "B39", "", "B29", "B9", "", "", "", "", ""],
  ["B65", "", "B60", "B38", "", "B30", "B8", "", "", "C2", "", ""],
  ["B64", "", "B61", "B37", "", "B31", "B7", "", "", "", "", "R2"],
  ["B63", "", "B62", "B36", "", "B32", "B6", "", "", "C1", "", ""],
  ["K22", "", "K20", "B35", "", "K16", "K15", "", "", "", "", ""],
  ["", "", "", "B34", "", "", "", "", "", "T", "", "R1"],
  ["K23", "", "K19", "R5", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "B33", "B5", "B4", "", "", "", ""],
];

export const bengaluruStallPlan: StallPlan = {
  slug: "bengaluru",
  venue: "KLE Ground, Rajajinagar",
  address: "Rajajinagar, Bengaluru, Karnataka",
  dates: "24–26 December 2026",
  rows: BENGALURU_ROWS,
  types: BENGALURU_TYPES,
  schemes: [
    { name: "Shell Space Scheme", pricePerSqM: 10000 },
    { name: "Bare Space Scheme", pricePerSqM: 9000 },
  ],
  prefixOf: (code) => (code.match(/^[A-Z]+/)?.[0] ?? code),
};

export const stallPlans: Record<string, StallPlan> = {
  bengaluru: bengaluruStallPlan,
};

export function getStallPlan(slug: string): StallPlan | null {
  return stallPlans[slug] ?? null;
}

export function getStallType(
  plan: StallPlan,
  code: string,
): StallTypeSpec | null {
  return plan.types[plan.prefixOf(code)] ?? null;
}

/** Every stall code in the plan, in plan order. */
export function listStallCodes(plan: StallPlan): string[] {
  return plan.rows.flat().filter((code) => code !== "");
}

/** Indian-format rupees, e.g. 180000 -> "₹1,80,000". */
export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Indicative cost of a selection under the chosen space scheme. Sponsorship
 * stalls are sold as packages, so they are excluded and labelled separately.
 */
export function estimateSelectionCost(
  plan: StallPlan,
  codes: string[],
  schemePricePerSqM: number,
): { total: number; exhibitionArea: number; sponsorshipCount: number } {
  let total = 0;
  let exhibitionArea = 0;
  let sponsorshipCount = 0;
  for (const code of codes) {
    const type = getStallType(plan, code);
    if (!type) continue;
    if (type.sponsorship) {
      sponsorshipCount++;
      continue;
    }
    exhibitionArea += type.area;
    total += type.area * schemePricePerSqM;
  }
  return { total, exhibitionArea, sponsorshipCount };
}
