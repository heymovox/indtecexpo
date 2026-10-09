export interface FloorPhoto {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

const photo = (
  n: number,
  width: number,
  height: number,
  caption: string,
  alt: string,
): FloorPhoto => ({
  id: `fp-${String(n).padStart(2, "0")}`,
  src: `/images/floor-photos/floor-${String(n).padStart(2, "0")}.webp`,
  width,
  height,
  caption,
  alt,
});

/* Documentation photography from previous INDTEC EXPO editions. */
export const floorPhotos: FloorPhoto[] = [
  photo(
    1,
    1000,
    563,
    "Electronics display systems on the exhibition floor",
    "Visitor evaluating display systems at the Textron Electronics stand",
  ),
  photo(
    2,
    1000,
    563,
    "Exhibitors discussing product specifications",
    "Group of exhibitors in conversation at the Woodon stand",
  ),
  photo(
    3,
    1000,
    563,
    "CNC machines on display",
    "Visitors walking past CNC machines at the GH Techno World stand",
  ),
  photo(
    4,
    1000,
    563,
    "One-to-one buyer discussions at the stand",
    "Two exhibitors discussing products across a display counter",
  ),
  photo(
    5,
    1000,
    563,
    "Instrumentation and control products",
    "Visitors browsing instrumentation products at the Invention Controls stand",
  ),
  photo(
    6,
    1000,
    563,
    "Konnekt Globe at the INDTEC EXPO opening",
    "Organisers under the Konnekt Globe presents INDTEC EXPO banner",
  ),
  photo(
    7,
    900,
    1600,
    "Edition badge issued to exhibitors",
    "Hand holding the INDTEC EXPO edition badge",
  ),
  photo(
    8,
    1000,
    563,
    "Power solutions and lighting buyers",
    "Exhibitors speaking with visitors at the power solutions stand",
  ),
  photo(
    9,
    1000,
    563,
    "Power systems on the show floor",
    "Visitors inspecting equipment at the Caliber power solutions stand",
  ),
  photo(
    10,
    1000,
    563,
    "Engineering component suppliers meeting buyers",
    "Group of exhibitors and buyers gathered around machinery",
  ),
  photo(
    11,
    1000,
    563,
    "Exhibitor team at their allocated stand",
    "Exhibitor team posing with recognition certificates",
  ),
  photo(
    12,
    738,
    1165,
    "Press coverage of the edition",
    "Newspaper clipping reporting on the INDTEC EXPO edition",
  ),
  photo(
    13,
    1000,
    563,
    "Visitors at an engineering component counter",
    "Group of visitors gathered at an exhibitor counter",
  ),
  photo(
    14,
    1000,
    563,
    "Industrial automation on display",
    "Visitors at the Panasonic industrial automation stand",
  ),
  photo(
    15,
    1000,
    1447,
    "Trade press feature on the show",
    "Newspaper page featuring INDTEC EXPO coverage",
  ),
  photo(
    16,
    1000,
    1018,
    "Machinery trade press coverage",
    "Global Machinery newspaper clipping on the exhibition",
  ),
  photo(
    17,
    730,
    1280,
    "Regional press coverage",
    "Newspaper article published about the expo",
  ),
  photo(
    18,
    801,
    1248,
    "Lamp lighting at the inauguration",
    "Traditional lamp being lit during the inauguration ceremony",
  ),
  photo(
    19,
    1000,
    666,
    "Ribbon cutting at the venue entrance",
    "Guests cutting the ribbon at the exhibition entrance",
  ),
  photo(
    20,
    1000,
    666,
    "Main exhibition aisle",
    "Wide view of the exhibition hall aisle with booths on both sides",
  ),
  photo(
    21,
    1000,
    666,
    "Opening day at the venue",
    "Guests gathered at the inaugural lamp lighting ceremony",
  ),
];
