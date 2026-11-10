import "server-only";

import { industries as staticIndustries } from "@/data/industries";
import { applyIndustryOverrides, listIndustryOverrides } from "@/lib/db";
import { publicMediaUrl } from "@/lib/media";
import type { Industry } from "@/types/industry";

/**
 * Every published industry with dashboard edits applied, ordered by name.
 *
 * `@/data/industries` is the versioned source of truth shipped in the repo,
 * and the dashboard saves its edits as overrides on top of it. The public
 * industries page reads through here, so an edit made in the dashboard
 * (name, description, image, sectors, featured flag) reaches the website
 * instead of waiting for a deploy.
 *
 * A database outage falls back to the static data rather than taking the
 * marketing site down.
 */
export async function getPublicIndustries(): Promise<Industry[]> {
  try {
    const merged = applyIndustryOverrides(
      staticIndustries,
      await listIndustryOverrides(),
    );
    return merged.map((item) => ({
      ...item,
      image: publicMediaUrl(item.image),
    }));
  } catch (error) {
    console.error("[industries] could not merge admin overrides", error);
    return [...staticIndustries].map((item) => ({
      ...item,
      image: publicMediaUrl(item.image),
    }));
  }
}

/** One industry by slug, or null when it does not exist. */
export async function getPublicIndustry(slug: string): Promise<Industry | null> {
  const industry = (await getPublicIndustries()).find(
    (candidate) => candidate.slug === slug,
  );
  return industry ?? null;
}
