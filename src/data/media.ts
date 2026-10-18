import { ARTICLE_CATEGORIES, type MediaArticle } from "@/types/content";

export const mediaArticles: MediaArticle[] = [
  {
    slug: "indtec-expo-2026-2027-three-city-calendar-announced",
    title:
      "INDTEC EXPO 2026–2027 three-city industrial calendar announced",
    category: "Press Releases",
    date: "2026-08-18",
    dateLabel: "18 August 2026",
    image: "/images/media/press-1.svg",
    excerpt:
      "Konnekt Globe confirms Bengaluru, Coimbatore and Hosur editions, extending INDTEC EXPO across South India's key industrial hubs.",
    body: [
      "Konnekt Globe today announced the INDTEC EXPO 2026–2027 calendar, covering three strategic industrial hubs over a four-month window.",
      "The series opens at KLE Ground, Rajajinagar, Bengaluru from 24–26 December 2026, followed by the Coimbatore edition at Codessia Road from 12–14 February 2027 and the four-day Hosur edition at Hills Exhibition Center from 12–15 March 2027.",
      "Each edition is positioned around a specific industrial identity — the Industrial Business Hub, the Manufacturing Hub and the Industrial Growth Corridor — giving exhibitors a differentiated route into three distinct buyer pools.",
      "Stall bookings for all three editions are now open. Exhibitors can submit an enquiry through the official website to receive availability and pricing within one working day.",
    ],
    readTime: "3 min read",
    featured: true,
  },
  {
    slug: "stall-bookings-open-bengaluru-edition",
    title: "Stall bookings open for the Bengaluru season opener",
    category: "Expo Updates",
    date: "2026-09-02",
    dateLabel: "2 September 2026",
    image: "/images/media/press-2.svg",
    excerpt:
      "Raw space, shell scheme and premium configurations released for the KLE Ground edition with early-bird exhibitor offers.",
    body: [
      "Registrations for stall bookings are now open for the INDTEC EXPO Bengaluru edition at KLE Ground, Rajajinagar.",
      "Exhibitors can choose from raw space starting at 6 m × 3 m, standard 3 m × 3 m shell scheme stalls and premium 6 m × 6 m corner spaces with priority aisle access.",
      "Early-bird, association-member and multi-city booking offers are available for a limited period. All enquiries submitted through the website receive a response within one working day.",
      "The floor plan for Bengaluru is available to download from the Floor Plan page, along with stall-wise dimensions and aisle access details.",
    ],
    readTime: "2 min read",
  },
  {
    slug: "machine-tool-demand-south-india-2026",
    title:
      "Machine tool demand in South India: what buyers are evaluating in 2026",
    category: "Industry Insights",
    date: "2026-07-21",
    dateLabel: "21 July 2026",
    image: "/images/media/insight-1.svg",
    excerpt:
      "Automation readiness, energy efficiency and service response time are now the top three evaluation criteria for capital equipment buyers.",
    body: [
      "Capital equipment procurement across Karnataka and Tamil Nadu is being reshaped by three consistent criteria: automation readiness, energy efficiency and after-sales service response time.",
      "Buyers across pumps, auto components and textile engineering are increasingly specifying retrofit automation and connected monitoring alongside the machine itself.",
      "For exhibitors, this shifts the sales conversation from unit price to total cost of ownership — a case that is far easier to make in person, with a running demonstration.",
      "INDTEC EXPO is structured around exactly this: live demonstrations, application clinics and scheduled meetings with buyers who arrived to evaluate technology.",
    ],
    readTime: "4 min read",
  },
  {
    slug: "hospur-four-day-edition-extended-format",
    title: "Hosur edition extended to four days for corridor manufacturers",
    category: "Expo Updates",
    date: "2026-09-15",
    dateLabel: "15 September 2026",
    image: "/images/media/press-3.svg",
    excerpt:
      "The Hills Exhibition Center edition runs 12–15 March 2027, giving exhibitors the longest showcase window in the series.",
    body: [
      "The INDTEC EXPO Hosur edition will run for four business days, from 12 to 15 March 2027 at Hills Exhibition Center.",
      "The extended format responds to demand from corridor manufacturers in automotive, EV and precision engineering who require longer evaluation windows for live equipment.",
      "Four days allow exhibitors to run deeper demonstrations, host multi-day delegations and conduct structured buyer meetings without compressing the schedule.",
      "Exhibitors booking across multiple editions can request a corridor package covering both Coimbatore and Hosur.",
    ],
    readTime: "2 min read",
  },
  {
    slug: "association-partnerships-delegation-programme",
    title:
      "Association partnerships expand the INDTEC visitor delegation programme",
    category: "Latest News",
    date: "2026-06-30",
    dateLabel: "30 June 2026",
    image: "/images/media/insight-2.svg",
    excerpt:
      "Trade associations across Karnataka and Tamil Nadu will host curated buyer delegations at all three editions.",
    body: [
      "INDTEC EXPO has entered into collaboration agreements with regional manufacturing associations to host curated buyer delegations across all three editions.",
      "Delegations will include plant heads, purchase managers and engineering consultants from member units, with pre-scheduled meeting slots available for exhibitors.",
      "The programme is designed to raise the quality of floor traffic and give exhibitors predictable access to qualified industrial buyers.",
      "Associations interested in participating can reach the team through the contact page.",
    ],
    readTime: "3 min read",
  },
  {
    slug: "industry-40-conference-track-announced",
    title: "Industry 4.0 conference track added across all editions",
    category: "Press Releases",
    date: "2026-05-12",
    dateLabel: "12 May 2026",
    image: "/images/media/insight-3.svg",
    excerpt:
      "A daily conference theatre will host sessions on connected manufacturing, energy efficiency and shopfloor automation.",
    body: [
      "A daily conference theatre will run alongside the exhibition floor at every INDTEC EXPO edition.",
      "Sessions cover connected manufacturing, shopfloor automation, energy efficiency, predictive maintenance and quality systems — all delivered by practising engineers and industry leaders.",
      "Conference access is included with visitor registration, and the full agenda will be published four weeks before each edition.",
      "Technology partners interested in speaking slots can submit a proposal through the media contact.",
    ],
    readTime: "3 min read",
  },
];

export const mediaCategories = ARTICLE_CATEGORIES;

export const articleBySlug = (slug: string) =>
  mediaArticles.find((article) => article.slug === slug);

export const featuredArticle =
  mediaArticles.find((article) => article.featured) ?? mediaArticles[0];
