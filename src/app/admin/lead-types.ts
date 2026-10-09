import type { LeadStage } from "@/types/exhibitor";

export type LeadKind = "exhibitor" | "visitor" | "contact";

export type LeadTypeLabel = "Exhibitor" | "Visitor" | "Contact";

export interface AdminLead {
  id: string;
  reference: string;
  type: LeadTypeLabel;
  title: string;
  subtitle: string;
  stage: LeadStage;
  notes: string;
  createdAt: string;
  updatedAt?: string;
  fields: Record<string, string | number | string[]>;
}
