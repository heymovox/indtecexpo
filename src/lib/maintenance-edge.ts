import { neon } from "@neondatabase/serverless";
import {
  MAINTENANCE_CACHE_TTL_MS,
  MAINTENANCE_COLLECTION,
  MAINTENANCE_OFF,
  MAINTENANCE_RECORD_ID,
  normaliseMaintenanceSettings,
  type MaintenanceSettings,
} from "@/types/maintenance";

/**
 * Reads the maintenance flag from the edge.
 *
 * This module deliberately does NOT import lib/db: that reaches node:crypto
 * through lib/protection and would fail to bundle for the middleware runtime.
 * Only the HTTP driver and the shared type are used, both of which are
 * edge-safe.
 *
 * Every public request passes through here, so the result is memoised for
 * MAINTENANCE_CACHE_TTL_MS. The dashboard and the middleware live in different
 * isolates, which is why a save cannot invalidate this cache directly and the
 * TTL is the propagation window.
 */

const SELECT_FLAG = `
  SELECT data FROM records
  WHERE collection = $1 AND id = $2
  LIMIT 1
`;

let cache: { at: number; settings: MaintenanceSettings } | null = null;

/**
 * Resolves the current maintenance state.
 *
 * Fails open: any missing env var or database error returns "not in
 * maintenance" so a database blip can never take the whole public site down.
 * A stale cached value is preferred over a failure, since it is at worst a few
 * seconds old.
 */
export async function readMaintenanceSettings(): Promise<MaintenanceSettings> {
  const now = Date.now();
  if (cache && now - cache.at < MAINTENANCE_CACHE_TTL_MS) {
    return cache.settings;
  }

  const url = process.env.DATABASE_URL;
  if (!url) return cache?.settings ?? MAINTENANCE_OFF;

  let settings: MaintenanceSettings;
  try {
    const rows = (await neon(url).query(SELECT_FLAG, [
      MAINTENANCE_COLLECTION,
      MAINTENANCE_RECORD_ID,
    ])) as { data: unknown }[];
    settings = normaliseMaintenanceSettings(rows?.[0]?.data);
  } catch (error) {
    console.warn("[maintenance] could not read flag, serving the site", error);
    return cache?.settings ?? MAINTENANCE_OFF;
  }

  cache = { at: now, settings };
  return settings;
}