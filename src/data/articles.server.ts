import "server-only";

import { mediaArticles as staticArticles } from "@/data/media";
import {
  applyArticleOverrides,
  listArticleOverrides,
  type ManagedArticle,
} from "@/lib/db";

/**
 * Articles behind /blog and /media.
 *
 * `data/media` is the versioned source shipped in the repo, and the dashboard
 * saves its edits as overrides on top of it — plus whole articles written in
 * the dashboard, which have no shipped counterpart. Every public surface (the
 * two listings, both detail routes and the sitemap) reads through here, so an
 * edit, a new post or an unpublish reaches the website right away.
 *
 * Drafts are filtered out for the public site (the dashboard keeps seeing
 * them). A database outage falls back to the shipped articles rather than
 * taking the newsroom down.
 */
async function mergedArticles(): Promise<ManagedArticle[]> {
  try {
    const overrides = await listArticleOverrides();
    return applyArticleOverrides(staticArticles, overrides);
  } catch (error) {
    console.error("[articles] could not apply dashboard overrides", error);
    return applyArticleOverrides(staticArticles, []);
  }
}

/**
 * Published articles: shipped ones first in their editorial order, then
 * dashboard-written posts newest first.
 */
export async function getPublicArticles(): Promise<ManagedArticle[]> {
  return (await mergedArticles()).filter((article) => article.published);
}

/** One published article, or null when the slug is unknown or a draft. */
export async function getPublicArticle(
  slug: string,
): Promise<ManagedArticle | null> {
  const article = (await getPublicArticles()).find(
    (candidate) => candidate.slug === slug,
  );
  return article ?? null;
}