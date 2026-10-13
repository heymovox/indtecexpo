export interface ExhibitorCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  products: string[];
}

export interface WhyExhibitBenefit {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface WhyVisitBenefit {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

export interface ExhibitorEnquiry {
  id: string;
  reference: string;
  createdAt: string;
  eventSlugs: string[];
  companyName: string;
  contactPerson: string;
  designation: string;
  phone: string;
  email: string;
  website?: string;
  industry: string;
  productCategory: string;
  stallSize: string;
  stalls: number;
  /** Stall positions chosen on the interactive floor plan, e.g. ["B42", "K7"]. */
  stallCodes?: string[];
  /** Approximate electrical load in kW. */
  powerLoad?: string;
  /** Machinery to be demonstrated on the stand. */
  machinery?: string;
  water?: string;
  branding?: string;
  sponsorship?: string;
  preferredLocation?: string;
  message?: string;
  source: string;
  stage: LeadStage;
  notes?: string;
  /** Explicit opt-in to WhatsApp messaging; stored as a boolean. */
  whatsappConsent: boolean;
}

export interface VisitorRegistration {
  id: string;
  reference: string;
  createdAt: string;
  fullName: string;
  companyName: string;
  designation: string;
  email: string;
  phone: string;
  city: string;
  industry: string;
  interestedExpos: string[];
  /** Planned one-hour visiting slots, e.g. "Bengaluru · 24 Dec 2026 · 09:00 AM – 10:00 AM". */
  visitingSchedule?: string[];
  interests: string[];
  stage: LeadStage;
  /** Explicit opt-in to WhatsApp messaging; stored as a boolean. */
  whatsappConsent: boolean;
}

export interface ContactMessage {
  id: string;
  reference: string;
  createdAt: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  category: string;
  message: string;
  stage: LeadStage;
}
