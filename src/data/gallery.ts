import type { GalleryCategory, GalleryImage } from "@/types/content";

export const galleryCategories: GalleryCategory[] = [
  "Expo",
  "Exhibitors",
  "Visitors",
  "Machines",
  "Networking",
  "Events",
];

const image = (id: string, category: string, n: number) =>
  `/images/gallery/${category.toLowerCase()}-${n}.svg`;

export const galleryImages: GalleryImage[] = [
  {
    id: "g-1",
    title: "Main exhibition aisle on opening day",
    category: "Expo",
    image: image("g-1", "expo", 1),
    span: "wide",
    caption: "INDTEC EXPO floor, Bengaluru edition",
  },
  {
    id: "g-2",
    title: "CNC turning centre showcase",
    category: "Machines",
    image: image("g-2", "machines", 1),
    span: "tall",
    caption: "Live cutting demonstration",
  },
  {
    id: "g-3",
    title: "Exhibitor meeting a plant buyer",
    category: "Exhibitors",
    image: image("g-3", "exhibitors", 1),
    caption: "Buyer–seller connect session",
  },
  {
    id: "g-4",
    title: "Registration and welcome desk",
    category: "Visitors",
    image: image("g-4", "visitors", 1),
    caption: "Pre-registered visitor fast track",
  },
  {
    id: "g-5",
    title: "Automation cell in operation",
    category: "Machines",
    image: image("g-5", "machines", 2),
    caption: "Robotic handling cell",
  },
  {
    id: "g-6",
    title: "Inaugural ceremony",
    category: "Events",
    image: image("g-6", "events", 1),
    span: "wide",
    caption: "Day 1 inauguration",
  },
  {
    id: "g-7",
    title: "Industry leaders in discussion",
    category: "Networking",
    image: image("g-7", "networking", 1),
    caption: "Leadership roundtable",
  },
  {
    id: "g-8",
    title: "Exhibitor stall with live demo",
    category: "Exhibitors",
    image: image("g-8", "exhibitors", 2),
    caption: "Premium corner stall",
  },
  {
    id: "g-9",
    title: "Visitor delegation tour",
    category: "Visitors",
    image: image("g-9", "visitors", 2),
    span: "tall",
    caption: "Association delegation walk-through",
  },
  {
    id: "g-10",
    title: "Precision metrology bench",
    category: "Machines",
    image: image("g-10", "machines", 3),
    caption: "Measurement and calibration zone",
  },
  {
    id: "g-11",
    title: "Conference session in progress",
    category: "Events",
    image: image("g-11", "events", 2),
    caption: "Industry 4.0 conference theatre",
  },
  {
    id: "g-12",
    title: "Evening networking hour",
    category: "Networking",
    image: image("g-12", "networking", 2),
    caption: "Business networking hour",
  },
  {
    id: "g-13",
    title: "Wide view of the expo floor",
    category: "Expo",
    image: image("g-13", "expo", 2),
    caption: "Full floor overview",
  },
  {
    id: "g-14",
    title: "Dealer and distributor meet",
    category: "Networking",
    image: image("g-14", "networking", 3),
    caption: "Channel partner programme",
  },
  {
    id: "g-15",
    title: "Exhibitor product presentation",
    category: "Exhibitors",
    image: image("g-15", "exhibitors", 3),
    caption: "Application-led presentation",
  },
  {
    id: "g-16",
    title: "Visitor enquiry at the counter",
    category: "Visitors",
    image: image("g-16", "visitors", 3),
    caption: "Information desk",
  },
  {
    id: "g-17",
    title: "Award and recognition ceremony",
    category: "Events",
    image: image("g-17", "events", 3),
    caption: "Excellence awards",
  },
  {
    id: "g-18",
    title: "Expo entrance and branding",
    category: "Expo",
    image: image("g-18", "expo", 3),
    caption: "Expo entrance arch",
  },
];

export const galleryByCategory = (category: GalleryCategory | "All") =>
  category === "All"
    ? galleryImages
    : galleryImages.filter((item) => item.category === category);
