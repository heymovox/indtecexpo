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
import {
  MAINTENANCE_OFF,
  MAINTENANCE_RECORD_ID,
  normaliseMaintenanceSettings,
  type MaintenanceSettings,
} from "@/types/maintenance";
import { encryptPii, decryptPii } from "@/lib/protection";
import { publicMediaUrl } from "@/lib/media";
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
  | "gallery"
  | "floorPlans"
  | "emailSuppressions"
  | "settings"
  | "siteSettings";

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
  // Uploaded files come in as presigned R2 URLs or admin-only object links;
  // store them under their same-origin /uploads path so the public site can
  // render them after the one-hour signature expires.
  input = {
    ...input,
    bannerImage: publicMediaUrl(input.bannerImage),
    posterImage: publicMediaUrl(input.posterImage),
    floorPlanImage: publicMediaUrl(input.floorPlanImage),
    floorPlanPdf: publicMediaUrl(input.floorPlanPdf),
  };

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
    if (!override) return { ...event, published: true };
    return {
      ...event,
      published: override.published !== false,
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
      published: override.published !== false,
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
/* ------------------------------------------------------------------ */
/* Gallery images uploaded from the admin dashboard                   */
/* ------------------------------------------------------------------ */

export const GALLERY_CATEGORIES = [
  "Expo",
  "Exhibitors",
  "Visitors",
  "Machines",
  "Networking",
  "Events",
] as const;

export type GalleryCategoryValue = (typeof GALLERY_CATEGORIES)[number];

/**
 * An admin-managed gallery image.
 *
 * Two sources are supported:
 *  - `objectKey` for admin uploads in Cloudflare R2. The key is never a
 *    presigned URL: those expire, so the public site resolves the key at
 *    request time through /gallery/img/[id] instead.
 *  - `src` for photographs already hosted in /public. These are copied in from
 *    `data/floorPhotos.ts` so they become editable alongside the uploads.
 */
export interface GalleryItem extends StoredRecord {
  title: string;
  category: GalleryCategoryValue;
  objectKey?: string;
  src?: string;
  /** "upload" = added from the dashboard, "hosted" = imported from /public. */
  origin: "upload" | "hosted";
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
  published: boolean;
  order: number;
}

/**
 * Resolves the public URL for a managed item. Hosted photographs keep their
 * /public path; uploads are streamed through the authenticated-free asset route.
 */
export function galleryItemSrc(item: GalleryItem): string {
  if (item.src) return item.src;
  if (item.objectKey) return `/gallery/img/${item.id}`;
  return "";
}

export async function listGalleryItems(): Promise<GalleryItem[]> {
  const items = await listRecords<GalleryItem>("gallery");
  return items.sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.createdAt.localeCompare(b.createdAt),
  );
}

export async function getGalleryItem(id: string): Promise<GalleryItem | null> {
  return getRecordById<GalleryItem>("gallery", id);
}

/** Published items only, ordered for display on the public gallery. */
export async function listPublishedGalleryItems(): Promise<GalleryItem[]> {
  const items = await listGalleryItems();
  return items.filter((item) => item.published === true);
}

export async function createGalleryItem(
  input: Omit<GalleryItem, "id" | "createdAt"> & { id?: string },
): Promise<GalleryItem> {
  const created = {
    ...input,
    id: input.id ?? `gal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  } as GalleryItem;

// `stage` is a lead-pipeline concept and is meaningless for gallery rows,
  // so this writes the row directly instead of going through createRecord.
  const columns = toColumns("gallery", { ...created, stage: undefined });
  await sql().query(INSERT, insertParams(columns));
  return created;
}

export async function updateGalleryItem(
  id: string,
  patch: Partial<GalleryItem>,
): Promise<GalleryItem | null> {
  return updateRecord<GalleryItem>("gallery", id, patch);
}

export async function deleteGalleryItem(id: string): Promise<boolean> {
  return deleteRecord("gallery", id);
}

/* ------------------------------------------------------------------ */
/* Floor plan artwork uploaded from the admin dashboard               */
/* ------------------------------------------------------------------ */

/** Slugs are fixed so a record always maps to one of the three editions. */
export const FLOOR_PLAN_SLUGS = ["bengaluru", "coimbatore", "hosur"] as const;

export type FloorPlanSlug = (typeof FLOOR_PLAN_SLUGS)[number];

export function isFloorPlanSlug(value: string): value is FloorPlanSlug {
  return (FLOOR_PLAN_SLUGS as readonly string[]).includes(value);
}

/**
 * Uploaded floor plan assets for one edition.
 *
 * As with GalleryItem, these hold Cloudflare R2 *keys* rather than presigned
 * URLs. The public site resolves the key per request through
 * /floor-plan/asset/[slug], so an upload never silently expires.
 */
export interface FloorPlanAssets extends StoredRecord {
  slug: FloorPlanSlug;
  imageKey?: string;
  pdfKey?: string;
  imageAlt?: string;
  pdfLabel?: string;
}

export async function listFloorPlanAssets(): Promise<FloorPlanAssets[]> {
  return listRecords<FloorPlanAssets>("floorPlans");
}

export async function getFloorPlanAssets(
  slug: string,
): Promise<FloorPlanAssets | null> {
  if (!isFloorPlanSlug(slug)) return null;
  return getRecordById<FloorPlanAssets>("floorPlans", slug);
}

/** Creates or updates the single record for a slug. */
export async function upsertFloorPlanAssets(
  slug: FloorPlanSlug,
  patch: Partial<Omit<FloorPlanAssets, "id" | "slug">>,
): Promise<FloorPlanAssets> {
  const stamp = new Date().toISOString();
  const existing = await getFloorPlanAssets(slug);

  if (existing) {
    return updateRecord<FloorPlanAssets>("floorPlans", slug, {
      ...patch,
      updatedAt: stamp,
    }) as Promise<FloorPlanAssets>;
  }

  const created = {
    ...patch,
    id: slug,
    slug,
    createdAt: stamp,
  } as FloorPlanAssets;

  await sql().query(INSERT, insertParams(toColumns("floorPlans", created)));
  return created;
}

/** Clears the uploaded assets for a slug so the static plan is used again. */
export async function clearFloorPlanAssets(slug: string): Promise<boolean> {
  if (!isFloorPlanSlug(slug)) return false;
  return deleteRecord("floorPlans", slug);
}

/* ------------------------------------------------------------------ */
/* Email suppression list                                               */
/* ------------------------------------------------------------------ */

/**
 * Addresses that have opted out of non-transactional email.
 *
 * Ids are the lower-cased address so the list is naturally unique and a repeat
 * unsubscribe is idempotent. Transactional receipts (a booking confirmation)
 * are NOT blocked by this list: suppressing those would deny a customer the
 * receipt for something they just paid attention to.
 */
export interface EmailSuppression extends StoredRecord {
  email: string;
  reason: string;
  createdAt: string;
}

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const id = email.trim().toLowerCase();
  if (!id) return false;
  const existing = await getRecordById<EmailSuppression>("emailSuppressions", id);
  return existing !== null;
}

export async function suppressEmail(
  email: string,
  reason = "unsubscribed",
): Promise<EmailSuppression> {
  const id = email.trim().toLowerCase();
  const existing = await getRecordById<EmailSuppression>("emailSuppressions", id);
  if (existing) return existing;

  const created: EmailSuppression = {
    id,
    email: id,
    reason,
    createdAt: new Date().toISOString(),
  };

  // `stage` is a lead-pipeline concept with no meaning here.
  await sql().query(INSERT, insertParams(toColumns("emailSuppressions", created)));
  return created;
}

export async function listEmailSuppressions(): Promise<EmailSuppression[]> {
  return listRecords<EmailSuppression>("emailSuppressions");
}

/* ------------------------------------------------------------------ */
/* Site-wide maintenance mode                                          */
/* ------------------------------------------------------------------ */

/**
 * A single row toggled from the admin dashboard.
 *
 * Read by the edge middleware through lib/maintenance-edge, which cannot import
 * this module, so the shape lives in types/maintenance and both sides agree.
 *
 * Writes bypass createRecord deliberately: that helper stamps a lead `stage` and
 * runs lib/protection's encryptPii, neither of which means anything here.
 */
export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  const existing = await getRecordById<StoredRecord>(
    "siteSettings",
    MAINTENANCE_RECORD_ID,
  );
  if (!existing) return MAINTENANCE_OFF;
  return normaliseMaintenanceSettings(existing);
}

export async function saveMaintenanceSettings(
  patch: MaintenanceSettings,
): Promise<MaintenanceSettings> {
  const settings = normaliseMaintenanceSettings(patch);
  const stamp = new Date().toISOString();

  const existing = await getRecordById<StoredRecord>(
    "siteSettings",
    MAINTENANCE_RECORD_ID,
  );

  if (existing) {
    // Deliberately not updateRecord: that runs encryptPii over the row, and
    // "message" is a PII_FIELDS key. This text is a public banner written by an
    // admin and rendered on the maintenance page, so storing it encrypted would
    // only make the raw row unreadable to the edge reader.
    await sql().query(
      UPDATE_BY_ID,
      updateParams(
        // Merged onto the stored record because UPDATE_BY_ID replaces the whole
        // data blob; id and createdAt are reasserted in case an older write
        // dropped them.
        toColumns("siteSettings", {
          ...existing,
          id: MAINTENANCE_RECORD_ID,
          createdAt:
            typeof existing.createdAt === "string" ? existing.createdAt : stamp,
          ...settings,
          updatedAt: stamp,
        }),
        MAINTENANCE_RECORD_ID,
      ),
    );
    return settings;
  }

  const created = {
    ...settings,
    id: MAINTENANCE_RECORD_ID,
    createdAt: stamp,
    updatedAt: stamp,
  };
  await sql().query(INSERT, insertParams(toColumns("siteSettings", created)));
  return settings;
}
