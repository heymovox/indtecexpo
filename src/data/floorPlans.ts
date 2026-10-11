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
}

/**
 * Stall type prefix for a code, e.g. "B" from "B42".
 *
 * A standalone function rather than a member on StallPlan: these objects are
 * passed into client components, and a function property cannot cross the
 * server/client boundary.
 */
export function stallPrefix(code: string): string {
  return code.match(/^[A-Z]+/)?.[0] ?? code;
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
};

const COIMBATORE_TYPES: Record<string, StallTypeSpec> = {
  T: {
    code: "T",
    name: "Title Sponsor",
    dimensions: "6 m × 12 m",
    area: 72,
    sponsorship: "Title Sponsor",
    sponsorshipPrice: "₹25 lakh",
    tone: "sponsor",
  },
  C: {
    code: "C",
    name: "Co Sponsor",
    dimensions: "6 m × 9 m",
    area: 54,
    sponsorship: "Co Sponsor",
    sponsorshipPrice: "₹15 lakh",
    tone: "royal",
  },
  R: {
    code: "R",
    name: "Royal Sponsor",
    dimensions: "6 m × 6 m",
    area: 36,
    sponsorship: "Royal Sponsor",
    sponsorshipPrice: "₹10 lakh",
    tone: "royal",
  },
  V: {
    code: "V",
    name: "Large Exhibition Stall",
    dimensions: "6 m × 3 m",
    area: 18,
    tone: "premium",
  },
  D: {
    code: "D",
    name: "Standard Exhibition Stall",
    dimensions: "3 m × 3 m",
    area: 9,
    tone: "standard",
  },
};

/**
 * Machine-generated from the organiser's document, then checked cell-by-cell
 * against it — see the note on D143 below.
 */
const COIMBATORE_ROWS: string[][] = [
  ["", "R7", "", "V1", "", "V2", "", "V31", "", "D1", "", "V47", "", "D49", "D50", "D98", "D99", "D100", "D150", ""],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "D149"],
  ["", "R6", "", "R8", "", "", "V3", "V30", "", "V32", "", "V46", "", "V48", "V51", "", "V52", "V55", "", "D148"],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "D147"],
  ["", "R5", "", "R9", "", "", "V4", "V29", "", "V33", "", "D2", "", "D48", "D51", "", "D97", "D101", "", "D146"],
  ["", "", "", "", "", "", "", "", "", "", "", "D3", "", "D47", "D52", "", "D96", "D102", "", "D145"],
  ["", "R4", "", "R10", "", "", "V5", "V28", "", "V34", "", "D4", "", "D46", "D53", "", "D95", "D103", "", "D144"],
  ["", "", "", "", "", "", "", "", "", "", "", "D5", "", "D45", "D54", "", "D94", "D104", "", "D142"],
  ["", "R3", "", "R11", "", "", "V6", "V27", "", "V35", "", "D6", "", "D44", "D55", "", "D93", "D105", "", "D141"],
  ["", "", "", "", "", "", "", "", "", "", "", "D7", "", "D43", "D56", "", "D92", "D106", "", "D140"],
  ["", "R2", "", "R12", "", "", "V7", "V26", "", "V36", "", "D8", "", "D42", "D57", "", "D91", "D107", "", "D139"],
  ["", "", "", "", "", "", "", "", "", "", "", "D9", "", "D41", "D58", "", "D90", "D108", "", "D138"],
  ["", "R1", "", "R13", "", "", "V8", "V25", "", "V37", "", "D10", "", "D40", "D59", "", "D89", "D109", "", "D137"],
  ["", "", "", "", "", "", "", "", "", "", "", "D11", "", "D39", "D60", "", "D88", "D110", "", "D136"],
  ["", "C4", "", "C5", "", "", "V9", "V24", "", "V38", "", "D12", "", "D38", "D61", "", "D87", "D111", "", "D135"],
  ["", "", "", "", "", "", "", "", "", "", "", "D13", "", "D37", "D62", "", "D86", "D112", "", "D134"],
  ["", "", "", "", "", "", "V10", "V23", "", "V39", "", "D14", "", "D36", "D63", "", "D85", "D113", "", "D133"],
  ["", "C3", "", "C6", "", "", "", "", "", "", "", "D15", "", "D35", "D64", "", "D84", "D114", "", "D132"],
  ["", "", "", "", "", "", "V11", "V22", "", "V40", "", "D16", "", "D34", "D65", "", "D83", "D115", "", "D131"],
  ["", "", "", "", "", "", "", "", "", "", "", "D17", "", "D33", "D66", "", "D82", "D116", "", "D130"],
  ["", "C2", "", "C7", "", "", "V12", "V21", "", "V41", "", "D18", "", "D32", "D67", "", "D81", "D117", "", "D129"],
  ["", "", "", "", "", "", "", "", "", "", "", "D19", "", "D31", "D68", "", "D80", "D118", "", "D128"],
  ["", "", "", "", "", "", "V13", "V20", "", "V42", "", "D20", "", "D30", "D69", "", "D79", "D119", "", "D127"],
  ["", "C1", "", "C8", "", "", "", "", "", "", "", "D21", "", "D29", "D70", "", "D78", "D120", "", "D126"],
  ["", "", "", "", "", "", "V14", "V19", "", "V43", "", "D22", "", "D28", "D71", "", "D77", "D121", "", "D125"],
  ["", "", "", "", "", "", "", "", "", "", "", "D23", "", "D27", "D72", "", "D76", "D122", "", "D124"],
  ["", "T1", "", "T2", "", "", "V15", "V18", "", "V44", "", "V45", "", "V49", "V50", "", "V53", "V54", "", "V56"],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "EXIT"],
  ["", "", "ENTRY", "", "", "", "V16", "", "V17", "", "", "D24", "D25", "D26", "D73", "D74", "D75", "D123", "V57", ""],
];

export const coimbatoreStallPlan: StallPlan = {
  slug: "coimbatore",
  venue: "Codessia Road Ground",
  address: "Codessia Road, Coimbatore, Tamil Nadu",
  dates: "12–14 February 2027",
  rows: COIMBATORE_ROWS,
  types: COIMBATORE_TYPES,
  schemes: [
    { name: "Shell Space Scheme", pricePerSqM: 10000 },
    { name: "Bare Space Scheme", pricePerSqM: 9000 },
  ],
};

const HOSUR_TYPES: Record<string, StallTypeSpec> = {
  T: {
    code: "T",
    name: "Title Sponsor",
    dimensions: "6 m × 12 m",
    area: 72,
    sponsorship: "Title Sponsor",
    sponsorshipPrice: "₹15 lakh",
    tone: "sponsor",
  },
  C: {
    code: "C",
    name: "Co Sponsor",
    dimensions: "6 m × 9 m",
    area: 54,
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
  V: {
    code: "V",
    name: "Large Exhibition Stall",
    dimensions: "6 m × 6 m",
    area: 36,
    tone: "premium",
  },
  H: {
    code: "H",
    name: "Standard Exhibition Stall",
    dimensions: "3 m × 6 m",
    area: 18,
    tone: "premium",
  },
  Y: {
    code: "Y",
    name: "Compact Exhibition Stall",
    dimensions: "3 m × 3 m",
    area: 9,
    tone: "standard",
  },
};

/**
 * Machine-generated from the organiser's document, then checked cell-by-cell
 * against it. Note Y166 is absent from the source (Y165 is followed by Y167).
 */
const HOSUR_ROWS: string[][] = [
  ["R6", "", "Y142", "Y143", "Y144", "Y145", "Y146", "Y147", "Y148", "Y149", "Y150", "Y151", "Y152", "Y153", "Y154", "Y155", "Y156", "Y157", "Y158", "Y159", "Y160", "Y161", "Y162", "Y163", "Y164", "Y165", "Y167", "Y168", "R5", ""],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["Y141", "", "H30", "", "Y140", "Y139", "Y138", "Y137", "Y136", "Y135", "Y134", "Y133", "Y132", "Y131", "Y130", "Y129", "Y128", "Y127", "Y126", "Y125", "Y124", "Y123", "Y122", "Y121", "Y120", "Y119", "H29", "", "", "Y118"],
  ["Y93", "", "H27", "", "Y94", "Y95", "Y96", "Y97", "Y98", "Y99", "Y100", "Y101", "Y102", "Y103", "Y104", "Y105", "Y106", "Y107", "Y108", "Y109", "Y110", "Y111", "Y112", "Y113", "Y114", "Y115", "H28", "", "", "Y117"],
  ["Y92", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "Y116"],
  ["Y91", "", "H26", "", "Y90", "Y89", "Y88", "Y87", "Y86", "Y85", "Y84", "Y83", "Y82", "Y81", "Y80", "Y79", "Y78", "Y77", "Y76", "Y75", "Y74", "Y73", "Y72", "Y71", "Y70", "Y69", "H25", "", "", "H24"],
  ["H21", "", "H22", "", "Y47", "Y48", "Y49", "Y50", "Y51", "Y52", "Y53", "Y54", "Y55", "Y56", "Y57", "Y58", "Y59", "Y60", "Y61", "Y62", "Y63", "Y64", "Y65", "Y66", "Y67", "Y68", "H23", "", "", ""],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["", "", "H20", "", "Y46", "Y45", "Y44", "Y43", "Y42", "Y41", "Y40", "Y39", "Y38", "Y37", "Y36", "Y35", "Y34", "Y33", "Y32", "Y31", "Y30", "Y29", "Y28", "Y27", "Y26", "Y25", "H19", "", "", ""],
  ["H15", "", "H16", "", "Y3", "Y4", "Y5", "Y6", "Y7", "Y8", "Y9", "Y10", "Y11", "Y12", "Y13", "Y14", "Y15", "Y16", "Y17", "Y18", "Y19", "Y20", "Y21", "Y22", "Y23", "Y24", "H17", "", "", "H18"],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["H14", "", "H13", "", "Y2", "H12", "", "H11", "", "V4", "", "V3", "", "V2", "", "V1", "", "C3", "", "", "C2", "", "", "C1", "", "", "T", "", "", ""],
  ["", "", "H8", "", "Y1", "H9", "", "H10", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["H7", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["", "EXIT", "", "H6", "", "H5", "", "H4", "", "H3", "", "H2", "", "H1", "", "R4", "", "", "R3", "", "", "R2", "", "", "R1", "", "", "ENTRY", "", ""],
];

export const hosurStallPlan: StallPlan = {
  slug: "hosur",
  venue: "Hills Exhibition Center",
  address: "Hosur, Tamil Nadu",
  dates: "12–15 March 2027",
  rows: HOSUR_ROWS,
  types: HOSUR_TYPES,
  schemes: [
    { name: "Shell Space Scheme", pricePerSqM: 8000 },
    { name: "Bare Space Scheme", pricePerSqM: 7000 },
  ],
};

export const stallPlans: Record<string, StallPlan> = {
  bengaluru: bengaluruStallPlan,
  coimbatore: coimbatoreStallPlan,
  hosur: hosurStallPlan,
};

export function getStallPlan(slug: string): StallPlan | null {
  return stallPlans[slug] ?? null;
}

export function getStallType(
  plan: StallPlan,
  code: string,
): StallTypeSpec | null {
  return plan.types[stallPrefix(code)] ?? null;
}

/**
 * Every bookable stall code, in plan order.
 *
 * Filters on a known type so layout labels such as ENTRY and EXIT are never
 * treated as bookable plots.
 */
export function listStallCodes(plan: StallPlan): string[] {
  return plan.rows
    .flat()
    .filter((code) => code !== "" && getStallType(plan, code) !== null);
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
