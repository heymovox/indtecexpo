/**
 * Site-wide maintenance mode.
 *
 * Kept in its own module so the edge middleware can import the shape without
 * pulling in db.ts, which reaches node:crypto through lib/protection and cannot
 * run on the edge runtime.
 */
export interface MaintenanceSettings {
  /** Master switch. When false the public site is served normally. */
  enabled: boolean;
  /** Optional override for the maintenance headline. */
  headline: string;
  /** Optional explanation shown under the headline. */
  message: string;
  /** ISO datetime the countdown ticks down to. Empty means no countdown. */
  resumeAt: string;
}

export const MAINTENANCE_RECORD_ID = "maintenance";

export const MAINTENANCE_COLLECTION = "siteSettings";

/** A site with maintenance off is indistinguishable from one with no record. */
export const MAINTENANCE_OFF: MaintenanceSettings = {
  enabled: false,
  headline: "",
  message: "",
  resumeAt: "",
};

/**
 * How long the middleware may serve a cached flag before re-reading the row.
 *
 * The admin toggle and the middleware run in separate isolates, so an in-process
 * cache clear on save cannot reach it. This TTL is the propagation window: a
 * switch takes effect across the edge within about this long.
 */
export const MAINTENANCE_CACHE_TTL_MS = 10_000;

export function normaliseMaintenanceSettings(
  raw: unknown,
): MaintenanceSettings {
  if (!raw || typeof raw !== "object") return MAINTENANCE_OFF;

  const data = raw as Record<string, unknown>;
  const text = (value: unknown, max: number): string =>
    typeof value === "string" ? value.trim().slice(0, max) : "";

  // Accept a datetime-local string as well as ISO; both parse to a valid Date
  // and anything unparseable simply means "no countdown".
  const resumeRaw = text(data.resumeAt, 64);
  const resumeParsed = resumeRaw ? Date.parse(resumeRaw) : Number.NaN;
  const resumeAt = Number.isFinite(resumeParsed)
    ? new Date(resumeParsed).toISOString()
    : "";

  return {
    enabled: data.enabled === true,
    headline: text(data.headline, 160),
    message: text(data.message, 1000),
    resumeAt,
  };
}