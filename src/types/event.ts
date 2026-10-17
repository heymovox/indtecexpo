export type EventSlug = "bengaluru" | "coimbatore" | "hosur";

export type EventStatus = "upcoming" | "live" | "completed";

export interface EventVenue {
  name: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  mapUrl: string;
  directionsUrl: string;
}

export interface StallOption {
  id: string;
  name: string;
  size: string;
  price: string;
  includes: string[];
}

export interface ExpoEvent {
  id: string;
  slug: EventSlug | string;
  city: string;
  state: string;
  edition: string;
  name: string;
  positioning: string;
  summary: string;
  description: string[];
  venue: EventVenue;
  startDate: string;
  endDate: string;
  days: number;
  dateLabel: string;
  dateRangeShort: string;
  monthLabel: string;
  heroImage: string;
  image: string;
  posterImage: string;
  floorPlanImage: string;
  floorPlanPdf: string;
  highlightImages?: { src: string; alt: string }[];
  status: EventStatus;
  /**
   * Publication state managed from the dashboard. Static editions carry no
   * override, so an edition is published unless an override says otherwise.
   */
  published?: boolean;
  sectors: string[];
  highlights: string[];
  stallOptions: StallOption[];
  /** Sponsorship packages, where the organiser publishes them per edition. */
  sponsorship?: { name: string; code: string; price: string }[];
  stats: { label: string; value: string }[];
  schedule: { day: string; date: string; label: string; detail: string }[];
}

export interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface CountdownTarget {
  event: ExpoEvent | null;
  complete: boolean;
}
