import "server-only";

/**
 * Lightweight file-backed data store.
 *
 * Every record is written to disk with PII fields encrypted (see lib/protection)
 * and decrypted on read. Swap this module for a real database by keeping the
 * exported surface identical.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  ContactMessage,
  ExhibitorEnquiry,
  VisitorRegistration,
  LeadStage,
} from "@/types/exhibitor";
import type { ExpoEvent } from "@/types/event";
import { encryptPii, decryptPii } from "@/lib/protection";

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

const DATA_DIR = path.join(process.cwd(), ".data");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function fileFor(collection: Collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

async function readCollection<T extends StoredRecord>(
  collection: Collection,
): Promise<T[]> {
  try {
    const raw = await fs.readFile(fileFor(collection), "utf8");
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeCollection<T extends StoredRecord>(
  collection: Collection,
  records: T[],
): Promise<void> {
  await ensureDir();
  const tmp = `${fileFor(collection)}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(records, null, 2), "utf8");
  await fs.rename(tmp, fileFor(collection));
}

function decryptRecord<T extends StoredRecord>(record: T): T {
  return decryptPii(record as unknown as Record<string, unknown>) as T;
}

/* ------------------------------------------------------------------ */
/* Generic CRUD                                                        */
/* ------------------------------------------------------------------ */

export async function listRecords<T extends StoredRecord>(
  collection: Collection,
): Promise<T[]> {
  const records = await readCollection<T>(collection);
  return records.map(decryptRecord<T>);
}

export async function getRecordById<T extends StoredRecord>(
  collection: Collection,
  id: string,
): Promise<T | null> {
  const records = await readCollection<T>(collection);
  const found = records.find((record) => record.id === id);
  return found ? decryptRecord(found) : null;
}

export async function createRecord<T extends StoredRecord>(
  collection: Collection,
  record: T,
): Promise<T> {
  const records = await readCollection<T>(collection);
  const stamped: T = {
    ...record,
    createdAt: record.createdAt ?? new Date().toISOString(),
    stage: record.stage ?? "new",
  };
  records.push(encryptPii(stamped as unknown as Record<string, unknown>) as T);
  await writeCollection(collection, records);
  return stamped;
}

export async function updateRecord<T extends StoredRecord>(
  collection: Collection,
  id: string,
  patch: Partial<T>,
): Promise<T | null> {
  const records = await readCollection<T>(collection);
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) return null;

  // Merge onto the DECRYPTED record so untouched PII stays single-encrypted
  // and any plaintext in the patch gets encrypted exactly once on write.
  const merged: T = {
    ...decryptRecord(records[index]),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  records[index] = encryptPii(merged as unknown as Record<string, unknown>) as T;
  await writeCollection(collection, records);
  return merged;
}

export async function deleteRecord(
  collection: Collection,
  id: string,
): Promise<boolean> {
  const records = await readCollection<StoredRecord>(collection);
  const next = records.filter((record) => record.id !== id);
  if (next.length === records.length) return false;
  await writeCollection(collection, next);
  return true;
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
}

export async function listEventOverrides(): Promise<EventOverride[]> {
  return listRecords<EventOverride>("events");
}

export async function upsertEventOverride(
  input: Omit<EventOverride, "id" | "createdAt"> & { id?: string },
): Promise<EventOverride> {
  const records = await readCollection<EventOverride>("events");
  const existingIndex = input.id
    ? records.findIndex((record) => record.id === input.id)
    : records.findIndex((record) => record.slug === input.slug);

  const stamp = new Date().toISOString();
  if (existingIndex >= 0) {
    const merged = {
      ...records[existingIndex],
      ...input,
      id: records[existingIndex].id,
      updatedAt: stamp,
    } as EventOverride;
    records[existingIndex] = merged;
    await writeCollection("events", records);
    return merged;
  }

  const created: EventOverride = {
    ...input,
    id: input.id ?? `evt-${Date.now().toString(36)}`,
    createdAt: stamp,
  } as EventOverride;
  records.push(created);
  await writeCollection("events", records);
  return created;
}

/** Merges admin-managed overrides on top of the versioned static event data. */
export async function mergeEventOverrides<T extends ExpoEvent>(
  defaults: T[],
): Promise<T[]> {
  const overrides = await listEventOverrides();
  if (overrides.length === 0) return defaults;
  return defaults.map((event) => {
    const override = overrides.find((item) => item.slug === event.slug);
    if (!override) return event;
    return {
      ...event,
      name: override.name || event.name,
      dateLabel: override.dateLabel || event.dateLabel,
      dateRangeShort: override.dateRangeShort || event.dateRangeShort,
      positioning: override.positioning || event.positioning,
      summary: override.summary || event.summary,
      venue: {
        ...event.venue,
        name: override.venueName || event.venue.name,
      },
    };
  });
}
