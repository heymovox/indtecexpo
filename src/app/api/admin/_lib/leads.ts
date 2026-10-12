import {
  getRecordById,
  listContactMessages,
  listExhibitorEnquiries,
  listVisitorRegistrations,
  type Collection,
  type StoredRecord,
} from "@/lib/db";
import type {
  ContactMessage,
  ExhibitorEnquiry,
  VisitorRegistration,
} from "@/types/exhibitor";
import type { AdminLead, LeadKind } from "@/app/admin/lead-types";

export const leadCollections: Record<LeadKind, Collection> = {
  exhibitor: "exhibitorEnquiries",
  visitor: "visitorRegistrations",
  contact: "contactMessages",
};

function noteOf(record: StoredRecord): string {
  return typeof record.notes === "string" ? record.notes : "";
}

function exhibitorLead(record: ExhibitorEnquiry & StoredRecord): AdminLead {
  return {
    id: record.id,
    reference: record.reference,
    type: "Exhibitor",
    title: `${record.companyName} — ${record.contactPerson}`,
    subtitle: [
      record.productCategory,
      record.stallSize,
      `${record.stalls} stall${record.stalls === 1 ? "" : "s"}`,
      ...(record.stallCodes?.length ? [`wants ${record.stallCodes.join(", ")}`] : []),
      ...(record.powerLoad ? [`${record.powerLoad} kW`] : []),
      ...(record.sponsorship ? [record.sponsorship] : []),
    ].join(" · "),
    stage: record.stage ?? "new",
    notes: noteOf(record),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    fields: {
      companyName: record.companyName,
      contactPerson: record.contactPerson,
      designation: record.designation,
      phone: record.phone,
      email: record.email,
      website: record.website ?? "",
      industry: record.industry,
      productCategory: record.productCategory,
      stallSize: record.stallSize,
      stalls: record.stalls,
      stallCodes: (record.stallCodes ?? []).join(", "),
      powerLoad: record.powerLoad ?? "",
      machinery: record.machinery ?? "",
      water: record.water ?? "",
      branding: record.branding ?? "",
      sponsorship: record.sponsorship ?? "",
      eventSlugs: (record.eventSlugs ?? []).join(", ") || record.preferredLocation || "",
      message: record.message ?? "",
      source: record.source,
    },
  };
}

function visitorLead(record: VisitorRegistration & StoredRecord): AdminLead {
  return {
    id: record.id,
    reference: record.reference,
    type: "Visitor",
    title: `${record.fullName} — ${record.companyName}`,
    subtitle: `${record.city} · ${record.industry}`,
    stage: record.stage ?? "new",
    notes: noteOf(record),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    fields: {
      fullName: record.fullName,
      companyName: record.companyName,
      designation: record.designation,
      email: record.email,
      phone: record.phone,
      city: record.city,
      industry: record.industry,
      interestedExpos: record.interestedExpos,
      visitingSchedule: record.visitingSchedule ?? [],
      interests: record.interests,
    },
  };
}

function contactLead(record: ContactMessage & StoredRecord): AdminLead {
  return {
    id: record.id,
    reference: record.reference,
    type: "Contact",
    title: `${record.subject} — ${record.name}`,
    subtitle: record.company
      ? `${record.category} · ${record.company}`
      : record.category,
    stage: record.stage ?? "new",
    notes: noteOf(record),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    fields: {
      name: record.name,
      email: record.email,
      phone: record.phone ?? "",
      company: record.company ?? "",
      subject: record.subject,
      category: record.category,
      message: record.message,
    },
  };
}

export function shapeLead(kind: LeadKind, record: StoredRecord): AdminLead {
  if (kind === "exhibitor") {
    return exhibitorLead(record as ExhibitorEnquiry & StoredRecord);
  }
  if (kind === "visitor") {
    return visitorLead(record as VisitorRegistration & StoredRecord);
  }
  return contactLead(record as ContactMessage & StoredRecord);
}

function byNewestFirst(a: AdminLead, b: AdminLead): number {
  return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
}

export async function getAllLeads(): Promise<AdminLead[]> {
  const [exhibitors, visitors, contacts] = await Promise.all([
    listExhibitorEnquiries(),
    listVisitorRegistrations(),
    listContactMessages(),
  ]);
  const leads = [
    ...exhibitors.map(exhibitorLead),
    ...visitors.map(visitorLead),
    ...contacts.map(contactLead),
  ];
  return leads.sort(byNewestFirst);
}

export async function findLeadById(
  id: string,
  kind?: LeadKind,
): Promise<AdminLead | null> {
  const kinds: LeadKind[] = kind ? [kind] : ["exhibitor", "visitor", "contact"];
  for (const candidate of kinds) {
    const record = await getRecordById<StoredRecord>(leadCollections[candidate], id);
    if (record) return shapeLead(candidate, record);
  }
  return null;
}
