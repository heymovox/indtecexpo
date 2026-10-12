import "server-only";

/**
 * Postgres-backed data store.
 *
 * Every record is stored with PII fields encrypted (see lib/protection) and
 * decrypted on read. Built for serverless deployments (Vercel), where the
 * previous file-backed store could not write to its filesystem.
 *
 * All SQL lives in `lib/db-queries.ts` so it can be executed against a real
 * Postgres engine by `scripts/verify-db.mjs`.
 */

import { neon } from "@neondatabase/serverless";
import type {
  ContactMessage,
  ExhibitorEnquiry,
  VisitorRegistration,
  LeadStage,
} from "@/types/exhibitor";
import type { ExpoEvent } from "@/types/event";
import { encryptPii, decryptPii } from "@/lib/protection";
import {
  DELETE_BY_ID,
  INSERT,
  SELECT_ALL,
  SELECT_BY_ID,
  SELECT_BY_SLUG,
  UPDATE_BY_ID,
  insertParams,
  rowToRecord,
  rowsToRecords,
  toColumns,
  updateParams,
  type SqlExecutor,
} from "@/lib/db-queries";

export type Collection =
  | "exhibitorEnquiries"
  | "visitorRegistrations"
  | "contactMessages"
  | "events"
  | "settings";

export interface StoredRecord {
  id: string;
  createdAt: string;
  updatedAt?: string;
  stage?: LeadStage;
  [key: string]: unknown;
}

let cached: SqlExecutor | null = null;

function sql(): SqlExecutor {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing required environment variable DATABASE_URL. See .env.example.",
    );
  }
  cached = neon(url) as unknown as SqlExecutor;
  return cached;
}

function decryptRecord<T>(record: T): T {
  return decryptPii(record as unknown as Record<string, unknown>) as T;
}

/* ------------------------------------------------------------------ */
/* Generic CRUD                                                        */
/* ------------------------------------------------------------------ */

export async function listRecords<T extends StoredRecord>(
  collection: Collection,
): Promise<T[]> {
  const rows = await sql().query(SELECT_ALL, [collection]);
  return rowsToRecords<T>(rows).map(decryptRecord<T>);
}

export async function getRecordById<T extends StoredRecord>(
  collection: Collection,
  id: string,
): Promise<T | null> {
  const rows = await sql().query(SELECT_BY_ID, [collection, id]);
  const record = rowToRecord<T>(rows[0]);
  return record ? decryptRecord<T>(record) : null;
}

export async function createRecord<T extends StoredRecord>(
  collection: Collection,
  record: T,
): Promise<T> {
  const stamped = {
    ...record,
    createdAt: record.createdAt ?? new Date().toISOString(),
    stage: record.stage ?? ("new" as LeadStage),
  };
  const encrypted = encryptPii(stamped as unknown as Record<string, unknown>);
  await sql().query(INSERT, insertParams(toColumns(collection, encrypted)));
  return stamped;
}

export async function updateRecord<T extends StoredRecord>(
  collection: Collection,
  id: string,
  patch: Partial<T>,
): Promise<T | null> {
  const rows = await sql().query(SELECT_BY_ID, [collection, id]);
  const existing = rowToRecord<T>(rows[0]);
  if (!existing) return null;

  // Merge onto the DECRYPTED record so untouched PII stays single-encrypted
  // and any plaintext in the patch gets encrypted exactly once on write.
  const merged = {
    ...decryptRecord<T>(existing),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  const encrypted = encryptPii(merged as unknown as Record<string, unknown>);
  await sql().query(
    UPDATE_BY_ID,
    updateParams(toColumns(collection, encrypted), id),
  );
  return merged;
}

export async function deleteRecord(
  collection: Collection,
  id: string,
): Promise<boolean> {
  const rows = await sql().query(DELETE_BY_ID, [collection, id]);
  return rows.length > 0;
}

/* ------------------------------------------------------------------ */
/* Domain helpers                                                      */
/* ------------------------------------------------------------------ */

export const listExhibitorEnquiries = () =>
  listRecords<ExhibitorEnquiry & StoredRecord>("exhibitorEnquiries");

export const listVisitorRegistrations = () =>
  listRecords<VisitorRegistration & StoredRecord>("visitorRegistrations");

export const listContactMessages = () =>
  listRecords<ContactMessage & StoredRecord>("contactMessages");

export interface AdminMetrics {
  exhibitorEnquiries: number;
  stallBookings: number;
  visitorRegistrations: number;
  contactEnquiries: number;
  upcomingEvents: number;
  recentLeads: {
    id: string;
    reference: string;
    title: string;
    type: "Exhibitor" | "Visitor" | "Contact";
    createdAt: string;
    stage: LeadStage;
  }[];
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const [exhibitors, visitors, contacts, overrides] = await Promise.all([
    listExhibitorEnquiries(),
    listVisitorRegistrations(),
    listContactMessages(),
    listEventOverrides(),
  ]);

  const all = [
    ...exhibitors.map((record) => ({
      id: record.id,
      reference: record.reference,
      title: `${record.companyName} — ${record.contactPerson}`,
      type: "Exhibitor" as const,
      createdAt: record.createdAt,
      stage: record.stage ?? ("new" as LeadStage),
    })),
    ...visitors.map((record) => ({
      id: record.id,
      reference: record.reference,
      title: `${record.fullName} — ${record.companyName}`,
      type: "Visitor" as const,
      createdAt: record.createdAt,
      stage: record.stage ?? ("new" as LeadStage),
    })),
    ...contacts.map((record) => ({
      id: record.id,
      reference: record.reference,
      title: `${record.subject} — ${record.name}`,
      type: "Contact" as const,
      createdAt: record.createdAt,
      stage: record.stage ?? ("new" as LeadStage),
    })),
  ];

  all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    exhibitorEnquiries: exhibitors.length,
    stallBookings: exhibitors.filter(
      (record) => record.stage === "proposal" || record.stage === "won",
    ).length,
    visitorRegistrations: visitors.length,
    contactEnquiries: contacts.length,
    upcomingEvents: overrides.length || 3,
    recentLeads: all.slice(0, 8),
  };
}

/* ------------------------------------------------------------------ */
/* Event overrides managed from the admin dashboard                    */
/* ------------------------------------------------------------------ */

export interface EventOverride extends StoredRecord {
  slug: string;
  name: string;
  dateLabel: string;
  dateRangeShort: string;
  positioning: string;
  venueName: string;
  summary: string;
  published: boolean;
  city?: string;
  state?: string;
  edition?: string;
  status?: "upcoming" | "live" | "completed";
  startDate?: string;
  endDate?: string;
  days?: number;
  monthLabel?: string;
  bannerImage?: string;
  posterImage?: string;
  floorPlanImage?: string;
  floorPlanPdf?: string;
  venueAddress?: string;
  sectors?: string[];
  highlights?: string[];
  description?: string[];
  order?: number;
}

export async function listEventOverrides(): Promise<EventOverride[]> {
  return listRecords<EventOverride>("events");
}

export async function upsertEventOverride(
  input: Omit<EventOverride, "id" | "createdAt"> & { id?: string },
): Promise<EventOverride> {
  const existing = input.id
    ? await getRecordById<EventOverride>("events", input.id)
    : await findEventOverrideBySlug(String(input.slug));

  const stamp = new Date().toISOString();

  if (existing) {
    const merged = {
      ...existing,
      ...input,
      id: existing.id,
      updatedAt: stamp,
    } as EventOverride;
    const encrypted = encryptPii(merged as unknown as Record<string, unknown>);
    await sql().query(
      UPDATE_BY_ID,
      updateParams(toColumns("events", encrypted), existing.id),
    );
    return merged;
  }

  const created = {
    ...input,
    id: input.id ?? `evt-${Date.now().toString(36)}`,
    createdAt: stamp,
  } as EventOverride;
  await createRecord<EventOverride>("events", created);
  return created;
}

async function findEventOverrideBySlug(
  slug: string,
): Promise<EventOverride | null> {
  const rows = await sql().query(SELECT_BY_SLUG, ["events", slug]);
  const record = rowToRecord<EventOverride>(rows[0]);
  return record ? decryptRecord<EventOverride>(record) : null;
}

/** Merges admin-managed overrides on top of the versioned static event data. */
export async function mergeEventOverrides<T extends ExpoEvent>(
  defaults: T[],
): Promise<T[]> {
  const overrides = await listEventOverrides();
  if (overrides.length === 0) return defaults;

  const staticSlugs = new Set(defaults.map((event) => event.slug));

  const merged = defaults.map((event) => {
    const override = overrides.find((item) => item.slug === event.slug);
    if (!override) return event;
    return {
      ...event,
      name: override.name || event.name,
      dateLabel: override.dateLabel || event.dateLabel,
      dateRangeShort: override.dateRangeShort || event.dateRangeShort,
      positioning: override.positioning || event.positioning,
      summary: override.summary || event.summary,
      city: override.city || event.city,
      state: override.state || event.state,
      edition: override.edition || event.edition,
      status: override.status ?? event.status,
      startDate: override.startDate || event.startDate,
      endDate: override.endDate || event.endDate,
      days: override.days ?? event.days,
      monthLabel: override.monthLabel || event.monthLabel,
      heroImage: override.bannerImage || event.heroImage,
      posterImage: override.posterImage || event.posterImage,
      floorPlanImage: override.floorPlanImage || event.floorPlanImage,
      floorPlanPdf: override.floorPlanPdf || event.floorPlanPdf,
      sectors: override.sectors?.length ? override.sectors : event.sectors,
      highlights: override.highlights?.length ? override.highlights : event.highlights,
      description: override.description?.length ? override.description : event.description,
      venue: {
        ...event.venue,
        name: override.venueName || event.venue.name,
        address: override.venueAddress || event.venue.address,
      },
    };
  });

  // Editions created in the admin (no static counterpart) are appended so the
  // public event list shows them too.
  const created: T[] = [];
  for (const override of overrides) {
    if (staticSlugs.has(override.slug)) continue;
    const base = defaults[0];
    if (!base) break;
    const synthetic = {
      ...base,
      id: override.id,
      slug: override.slug,
      name: override.name,
      city: override.city ?? "",
      state: override.state ?? "",
      edition: override.edition ?? "",
      positioning: override.positioning,
      summary: override.summary,
      dateLabel: override.dateLabel,
      dateRangeShort: override.dateRangeShort,
      monthLabel: override.monthLabel ?? "",
      startDate: override.startDate ?? base.startDate,
      endDate: override.endDate ?? base.endDate,
      days: override.days ?? base.days,
      status: override.status ?? "upcoming",
      heroImage: override.bannerImage ?? base.heroImage,
      posterImage: override.posterImage ?? base.posterImage,
      floorPlanImage: override.floorPlanImage ?? base.floorPlanImage,
      floorPlanPdf: override.floorPlanPdf ?? base.floorPlanPdf,
      sectors: override.sectors?.length ? override.sectors : [],
      highlights: override.highlights?.length ? override.highlights : [],
      description: override.description?.length ? override.description : [],
      venue: {
        ...base.venue,
        name: override.venueName,
        address: override.venueAddress ?? base.venue.address,
      },
    } as unknown as T;
    created.push(synthetic);
  }

  return [...merged, ...created];
}