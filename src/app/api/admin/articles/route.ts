import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ARTICLE_CATEGORIES } from "@/types/content";
import { mediaArticles } from "@/data/media";
import {
  deleteArticle,
  listArticleOverrides,
  mergeArticles,
  upsertArticle,
} from "@/lib/db";
import { requireRole, serverError } from "@/app/api/admin/_lib/auth";

/**
 * Articles shown on the public /blog and /media pages.
 *
 * The shipped articles live in data/media.ts; the dashboard saves its edits
 * as rows in the `articles` collection, merged on top on read — the same
 * pattern the events section uses. Writes invalidate the page cache so a save
 * reaches both listings and both detail routes on the next visit.
 */

const articleSchema = z.object({
  slug: z.string().trim().min(3).max(140),
  title: z.string().trim().min(1).max(180),
  category: z.enum(ARTICLE_CATEGORIES),
  date: z.string().trim().max(40).default(""),
  dateLabel: z.string().trim().max(60).default(""),
  image: z.string().trim().max(600).default(""),
  excerpt: z.string().trim().max(600).default(""),
  body: z.array(z.string().trim().max(4000)).max(80).default([]),
  readTime: z.string().trim().max(40).default(""),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const items = await mergeArticles(mediaArticles);
    return Response.json({ ok: true, items });
  } catch (error) {
    console.error("[api/admin/articles GET]", error);
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const raw: unknown = await request.json().catch(() => null);
    const parsed = articleSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        { ok: false, message: "Invalid article data." },
        { status: 400 },
      );
    }

    const slug = slugify(parsed.data.slug);
    if (!slug || slug.length < 3) {
      return Response.json(
        { ok: false, message: "Permalink must be at least 3 characters." },
        { status: 400 },
      );
    }

    // "Featured" is exclusive: only one article can lead the listings, so
    // flagging this one clears the flag everywhere else — including on the
    // shipped article that carries `featured: true` in data/media.ts (that
    // needs a flag-only row, because the source file itself never changes).
    if (parsed.data.featured) {
      const existing = await listArticleOverrides();
      for (const other of existing) {
        if (other.slug === slug || other.featured !== true) continue;
        await upsertArticle({ ...other, featured: false });
      }
      for (const source of mediaArticles) {
        if (!source.featured || source.slug === slug) continue;
        if (existing.some((item) => item.slug === source.slug)) continue;
        await upsertArticle({ slug: source.slug, featured: false });
      }
    }

    await upsertArticle({ ...parsed.data, slug });
    revalidatePath("/", "layout");

    const items = await mergeArticles(mediaArticles);
    const item = items.find((article) => article.slug === slug) ?? null;
    return Response.json({ ok: true, item });
  } catch (error) {
    console.error("[api/admin/articles PUT]", error);
    return serverError();
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireRole("superadmin");
  if (denied) return denied;

  try {
    const slug = request.nextUrl.searchParams.get("id");
    if (!slug) {
      return Response.json(
        { ok: false, message: "Article slug is required." },
        { status: 400 },
      );
    }

    const deleted = await deleteArticle(slug);
    if (!deleted) {
      return Response.json(
        { ok: false, message: "No dashboard edits found for that article." },
        { status: 404 },
      );
    }

    revalidatePath("/", "layout");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/articles DELETE]", error);
    return serverError();
  }
}