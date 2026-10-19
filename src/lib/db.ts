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
  isArticleCategory,
  type ArticleCategory,
  type MediaArticle,
  type SponsorLogo,
  type SponsorTier,
} from "@/types/content";
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
  | "sponsors"
  | "articles"
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
    // An admin-created edition has no static base to inherit locality, city,
    // state or map links from — only the override's own values describe it.
    // Rebuilding the venue (instead of spreading `base.venue`) stops a new
    // edition from displaying another city's locality and map links.
    const city = override.city ?? "";
    const state = override.state ?? "";
    const venueQuery = [override.venueName, override.venueAddress, city, state]
      .filter(Boolean)
      .join(" ");
    const synthetic = {
      ...base,
      id: override.id,
      slug: override.slug,
      published: override.published !== false,
      name: override.name,
      city,
      state,
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
        name: override.venueName,
        address: override.venueAddress ?? "",
        locality: "",
        city,
        state,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueQuery)}`,
        directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venueQuery)}`,
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
/* Sponsor tiers managed from the admin dashboard                      */
/* ------------------------------------------------------------------ */

/**
 * An edit saved on top of one tier in `data/sponsors.ts`, or a whole tier
 * created in the dashboard (which has no static counterpart).
 *
 * Rows are written with the full tier payload, but every field stays optional
 * so a row created only to flip `published` still merges cleanly onto the
 * shipped tier underneath it.
 */
export interface SponsorTierOverride extends StoredRecord {
  id: string;
  title?: string;
  description?: string;
  logos?: SponsorLogo[];
  order?: number;
  published?: boolean;
}

/** One tier as the public site and the dashboard see it after merging. */
export interface ManagedSponsorTier {
  id: string;
  title: string;
  description: string;
  logos: SponsorLogo[];
  order: number;
  published: boolean;
  /** "static" = shipped in data/sponsors.ts, "dashboard" = created in admin. */
  source: "static" | "dashboard";
}

export async function listSponsorTierOverrides(): Promise<SponsorTierOverride[]> {
  return listRecords<SponsorTierOverride>("sponsors");
}

/**
 * Applies dashboard overrides on top of the shipped sponsor tiers.
 *
 * Fields fall back to the static tier with `??` rather than `||`, so an
 * explicit empty value typed in the dashboard (a cleared description, an
 * emptied logo list) survives the merge while a flag-only row — one written
 * just to unpublish a tier — inherits everything else from the source file.
 * Tiers with no static counterpart are appended after the shipped ones, then
 * everything is ordered by the editable display order.
 */
export function applySponsorTierOverrides(
  defaults: SponsorTier[],
  overrides: SponsorTierOverride[],
): ManagedSponsorTier[] {
  const pending = new Map(overrides.map((item) => [item.id, item]));

  const merged: ManagedSponsorTier[] = defaults.map((tier, index) => {
    const override = pending.get(tier.id);
    pending.delete(tier.id);
    return {
      id: tier.id,
      title: override?.title ?? tier.title,
      description: override?.description ?? tier.description,
      logos: override?.logos ?? tier.logos,
      order: override?.order ?? index,
      published: override?.published !== false,
      source: "static",
    };
  });

  const created = [...pending.values()]
    // Partial rows written only to flag a shipped tier are already merged above.
    .filter((override) => Boolean(override.title))
    .map((override, index): ManagedSponsorTier => ({
      id: override.id,
      title: override.title as string,
      description: override.description ?? "",
      logos: override.logos ?? [],
      order: override.order ?? defaults.length + index,
      published: override.published !== false,
      source: "dashboard",
    }));

  return [...merged, ...created].sort((a, b) => a.order - b.order);
}

/**
 * Write payload for a tier save. Deliberately not derived from
 * SponsorTierOverride with Omit: that interface carries StoredRecord's
 * `[key: string]: unknown` index signature, which Pick would spread over the
 * specific fields and erase them back to `unknown`.
 */
export interface SponsorTierInput {
  id: string;
  title?: string;
  description?: string;
  logos?: SponsorLogo[];
  order?: number;
  published?: boolean;
}

export async function upsertSponsorTier(
  input: SponsorTierInput,
): Promise<SponsorTierOverride> {
  // Logos uploaded in the dashboard arrive as presigned R2 URLs (1 hour).
  // Store them under the same-origin /uploads path so /sponsors renders them
  // long after the signature expires.
  input = {
    ...input,
    logos: (input.logos ?? []).map((logo) => ({
      ...logo,
      logo: publicMediaUrl(logo.logo),
    })),
  };

  const existing = await getRecordById<SponsorTierOverride>("sponsors", input.id);
  const stamp = new Date().toISOString();

  if (existing) {
    const merged = {
      ...existing,
      ...input,
      id: input.id,
      updatedAt: stamp,
    } as SponsorTierOverride;
    const encrypted = encryptPii(merged as unknown as Record<string, unknown>);
    await sql().query(
      UPDATE_BY_ID,
      updateParams(toColumns("sponsors", encrypted), input.id),
    );
    return merged;
  }

  const created = { ...input, createdAt: stamp } as SponsorTierOverride;
  await createRecord<SponsorTierOverride>("sponsors", created);
  return created;
}

/**
 * Removes the dashboard row for a tier. For a shipped tier that reverts it to
 * data/sponsors.ts; for a dashboard-created tier it deletes it outright.
 */
export async function deleteSponsorTier(id: string): Promise<boolean> {
  return deleteRecord("sponsors", id);
}

/* ------------------------------------------------------------------ */
/* Blog & media articles managed from the admin dashboard              */
/* ------------------------------------------------------------------ */

/**
 * An edit saved on top of an article in `data/media.ts`, or a whole article
 * written in the dashboard. As with sponsor tiers every field is optional so
 * a row created only to un-feature or unpublish an article still merges onto
 * the shipped article underneath it.
 */
export interface ArticleOverride extends StoredRecord {
  slug: string;
  title?: string;
  category?: string;
  date?: string;
  dateLabel?: string;
  image?: string;
  excerpt?: string;
  body?: string[];
  readTime?: string;
  featured?: boolean;
  published?: boolean;
}

/** One article with dashboard edits applied — the shape every page renders. */
export interface ManagedArticle {
  slug: string;
  title: string;
  category: ArticleCategory;
  date: string;
  dateLabel: string;
  image: string;
  excerpt: string;
  body: string[];
  readTime: string;
  featured: boolean;
  published: boolean;
  /** "static" = shipped in data/media.ts, "dashboard" = written in admin. */
  source: "static" | "dashboard";
}

export async function listArticleOverrides(): Promise<ArticleOverride[]> {
  return listRecords<ArticleOverride>("articles");
}

/**
 * Applied when a dashboard article has no header image — next/image throws on
 * an empty src, and an image-less post should still render everywhere.
 */
const DEFAULT_ARTICLE_IMAGE = "/images/hero/hero-media.svg";

/**
 * Applies dashboard overrides on top of the shipped articles.
 *
 * Shipped articles keep their source order (it is what both public listings
 * treat as editorial order); articles created in the dashboard are appended
 * after them, newest first. `??` fallbacks keep a flag-only row — one written
 * to unpublish an article — inheriting the shipped copy underneath it.
 */
export function applyArticleOverrides(
  defaults: MediaArticle[],
  overrides: ArticleOverride[],
): ManagedArticle[] {
  const pending = new Map(overrides.map((item) => [item.slug, item]));

  const merged: ManagedArticle[] = defaults.map((article) => {
    const override = pending.get(article.slug);
    pending.delete(article.slug);
    return {
      slug: article.slug,
      title: override?.title ?? article.title,
      category: isArticleCategory(override?.category)
        ? override.category
        : article.category,
      date: override?.date ?? article.date,
      dateLabel: override?.dateLabel ?? article.dateLabel,
      // `||` (not `??`) for the image, plus a floor: next/image throws on an
      // empty src, so a cleared or missing header image must never surface.
      image: publicMediaUrl(override?.image || article.image) || DEFAULT_ARTICLE_IMAGE,
      excerpt: override?.excerpt ?? article.excerpt,
      body: override?.body ?? article.body,
      readTime: override?.readTime ?? article.readTime,
      featured: override?.featured ?? article.featured ?? false,
      published: override?.published !== false,
      source: "static",
    };
  });

  const created: ManagedArticle[] = [...pending.values()]
    .filter((override) => Boolean(override.title))
    .map((override): ManagedArticle => ({
      slug: override.slug,
      title: override.title as string,
      category: isArticleCategory(override.category)
        ? override.category
        : "Latest News",
      date: override.date ?? "",
      dateLabel: override.dateLabel ?? override.date ?? "",
      image: publicMediaUrl(override.image ?? "") || DEFAULT_ARTICLE_IMAGE,
      excerpt: override.excerpt ?? "",
      body: override.body ?? [],
      readTime: override.readTime ?? "",
      featured: override.featured ?? false,
      published: override.published !== false,
      source: "dashboard",
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return [...merged, ...created];
}

export async function mergeArticles(
  defaults: MediaArticle[],
): Promise<ManagedArticle[]> {
  return applyArticleOverrides(defaults, await listArticleOverrides());
}

/**
 * Write payload for an article save. As with SponsorTierInput this is spelled
 * out rather than derived from ArticleOverride, whose StoredRecord index
 * signature would erase the field types through Omit.
 */
export interface ArticleInput {
  slug: string;
  title?: string;
  category?: string;
  date?: string;
  dateLabel?: string;
  image?: string;
  excerpt?: string;
  body?: string[];
  readTime?: string;
  featured?: boolean;
  published?: boolean;
}

export async function upsertArticle(
  input: ArticleInput,
): Promise<ArticleOverride> {
  // Same presigned-URL trap as sponsor logos: store uploads under the
  // same-origin /uploads path so /blog and /media render them permanently.
  input = { ...input, image: publicMediaUrl(input.image ?? "") };

  const existing = await getRecordById<ArticleOverride>("articles", input.slug);
  const stamp = new Date().toISOString();

  if (existing) {
    const merged = {
      ...existing,
      ...input,
      // The slug is the row id — without this the stored id would be blank
      // and every article would collide into one row (and be undeletable).
      id: input.slug,
      slug: input.slug,
      updatedAt: stamp,
    } as ArticleOverride;
    const encrypted = encryptPii(merged as unknown as Record<string, unknown>);
    await sql().query(
      UPDATE_BY_ID,
      updateParams(toColumns("articles", encrypted), input.slug),
    );
    return merged;
  }

  const created = { ...input, id: input.slug, createdAt: stamp } as ArticleOverride;
  await createRecord<ArticleOverride>("articles", created);
  return created;
}

/**
 * Removes the dashboard row for an article. For a shipped article that reverts
 * every field to data/media.ts; for a dashboard-written one it deletes it.
 */
export async function deleteArticle(slug: string): Promise<boolean> {
  return deleteRecord("articles", slug);
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
