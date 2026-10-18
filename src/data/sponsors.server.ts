import "server-only";

import { sponsorTiers as staticTiers } from "@/data/sponsors";
import {
  applySponsorTierOverrides,
  listSponsorTierOverrides,
  type ManagedSponsorTier,
} from "@/lib/db";

/**
 * The public sponsor directory.
 *
 * `data/sponsors` is the versioned source shipped in the repo, and the
 * dashboard saves its edits as overrides on top of it. /sponsors reads through
 * here, so a tier, logo or listing change made in the dashboard reaches the
 * website immediately instead of waiting for a deploy.
 *
 * Unpublished tiers are filtered out for the public site (the dashboard keeps
 * seeing them). A database outage falls back to the shipped tiers rather than
 * taking the marketing page down.
 */
export async function getPublicSponsorTiers(): Promise<ManagedSponsorTier[]> {
  try {
    const overrides = await listSponsorTierOverrides();
    return applySponsorTierOverrides(staticTiers, overrides)
      .filter((tier) => tier.published)
      // Logos saved without an image cannot render — next/image throws on an
      // empty src — so they are dropped here rather than crashing the page.
      .map((tier) => ({
        ...tier,
        logos: tier.logos.filter((logo) => Boolean(logo.logo)),
      }));
  } catch (error) {
    console.error("[sponsors] could not apply dashboard overrides", error);
    return applySponsorTierOverrides(staticTiers, []);
  }
}