"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { UploadField } from "@/components/admin/UploadField";
import { useToast } from "@/components/admin/ToastProvider";
import { mediaCategories } from "@/data/media";
import { isArticleCategory } from "@/types/content";
import type { ManagedArticle } from "@/lib/db";

/**
 * Blog & Media article editor.
 *
 * The same collection feeds both public listings (/blog and /media), so one
 * editor powers both dashboard sections. Saves go through
 * /api/admin/articles, which merges them over data/media.ts and revalidates
 * the public pages — an edit, a new post or an unpublish reaches the website
 * on the next visit instead of waiting for a deploy.
 */

type Message = { type: "success" | "error"; text: string };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function labelFor(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function blankArticle(): ManagedArticle {
  return {
    slug: "",
    title: "",
    category: mediaCategories[0],
    date: todayIso(),
    dateLabel: labelFor(todayIso()),
    image: "",
    excerpt: "",
    body: [""],
    readTime: "3 min read",
    featured: false,
    published: true,
    source: "dashboard",
  };
}

export function ArticlesManager() {
  const { confirm } = useToast();
  const [items, setItems] = useState<ManagedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [editing, setEditing] = useState<ManagedArticle | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  /** Fetches the merged list without touching state, so an effect may call it. */
  const fetchArticles = useCallback(async (): Promise<ManagedArticle[]> => {
    const res = await fetch("/api/admin/articles", {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      throw new Error(data?.message ?? "Could not load articles.");
    }
    return (data.items ?? []) as ManagedArticle[];
  }, []);

  // Initial load: state is only touched from the promise callbacks, never
  // synchronously in the effect body (matches the other dashboard managers).
  useEffect(() => {
    let cancelled = false;
    fetchArticles()
      .then((items) => {
        if (!cancelled) setItems(items);
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage({
            type: "error",
            text:
              error instanceof Error ? error.message : "Could not load articles.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchArticles]);

  /** Refresh after a mutation, from event handlers. */
  const load = useCallback(async () => {
    try {
      setItems(await fetchArticles());
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Could not load articles.",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchArticles]);

  async function put(payload: ManagedArticle, successText: string) {
    setBusy(payload.slug || "saving");
    try {
      const res = await fetch("/api/admin/articles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? "Could not save the article.");
      }
      await load();
      setMessage({ type: "success", text: successText });
      return true;
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not save the article.",
      });
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function save(editorial: ManagedArticle, creating: boolean) {
    const title = editorial.title.trim();
    if (!title) {
      setMessage({ type: "error", text: "Give the article a title first." });
      return;
    }
    const slug = creating ? slugify(editorial.slug || title) : editorial.slug;
    if (slug.length < 3) {
      setMessage({
        type: "error",
        text: "The permalink needs at least 3 characters.",
      });
      return;
    }
    setSaving(true);
    setMessage(null);
    const ok = await put(
      {
        ...editorial,
        title,
        slug,
        // Blank rows are just "add paragraph" placeholders, not copy.
        body: editorial.body.map((paragraph) => paragraph.trim()).filter(Boolean),
      },
      creating
        ? `“${title}” is published — it is on /blog and /media now.`
        : `“${title}” saved — the public pages refresh immediately.`,
    );
    setSaving(false);
    if (ok) {
      setEditing(null);
      setIsNew(false);
    }
  }

  function openNew() {
    setMessage(null);
    setIsNew(true);
    setEditing(blankArticle());
  }

  function openEdit(article: ManagedArticle) {
    setMessage(null);
    setIsNew(false);
    setEditing({ ...article, body: [...article.body] });
  }

  async function togglePublish(article: ManagedArticle) {
    await put(
      { ...article, published: !article.published },
      article.published
        ? `“${article.title}” is now a draft — hidden from /blog and /media.`
        : `“${article.title}” is live on /blog and /media again.`,
    );
  }

  async function remove(article: ManagedArticle) {
    const isShipped = article.source === "static";
    const ok = await confirm(
      isShipped
        ? {
            title: "Revert article",
            message: `Discard the dashboard edits on “${article.title}” and restore the version shipped with the site?`,
            confirmLabel: "Revert",
            variant: "danger",
          }
        : {
            title: "Delete article",
            message: `Delete “${article.title}”? It disappears from /blog and /media. This cannot be undone.`,
            confirmLabel: "Delete",
            variant: "danger",
          },
    );
    if (!ok) return;

    setBusy(article.slug);
    try {
      const res = await fetch(
        `/api/admin/articles?id=${encodeURIComponent(article.slug)}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? "Could not remove the article.");
      }
      await load();
      setMessage({
        type: "success",
        text: isShipped
          ? `“${article.title}” reverted to the source version.`
          : `“${article.title}” deleted.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not remove the article.",
      });
    } finally {
      setBusy(null);
    }
  }

  const live = items.filter((article) => article.published).length;
  const drafts = items.length - live;

  if (loading) {
    return (
      <div className="card flex items-center gap-2 p-6 text-sm text-steel-600">
        <Icon name="refresh" size={16} className="animate-spin" />
        Loading articles…
      </div>
    );
  }

  return (
    <section aria-label="Articles" className="space-y-4">
      <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <span className="eyebrow mb-1.5">Blog &amp; Media</span>
          <h2 className="display-sm text-lg text-navy-900 sm:text-xl">
            Articles
          </h2>
          <p className="mt-1 text-xs text-steel-600 sm:text-sm">
            News, press releases and industry insights. Saves go live on
            &nbsp;/blog and&nbsp;/media immediately
            {items.length ? ` · ${live} live, ${drafts} draft${drafts === 1 ? "" : "s"}` : ""}.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/blog"
            target="_blank"
            className="inline-flex items-center gap-1.5 border border-steel-200 px-3 py-2 text-xs font-medium text-steel-700 transition hover:border-brand-400 hover:text-navy-900"
          >
            <Icon name="external" size={13} />
            /blog
          </Link>
          <Link
            href="/media"
            target="_blank"
            className="inline-flex items-center gap-1.5 border border-steel-200 px-3 py-2 text-xs font-medium text-steel-700 transition hover:border-brand-400 hover:text-navy-900"
          >
            <Icon name="external" size={13} />
            /media
          </Link>
          <Button type="button" size="sm" onClick={openNew}>
            <span className="flex items-center gap-2">
              <Icon name="plus" size={14} strokeWidth={2} />
              New article
            </span>
          </Button>
        </div>
      </div>

      {message ? (
        <p
          role="status"
          className={`text-xs font-semibold ${
            message.type === "error" ? "text-signal-600" : "text-emerald-700"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="card flex flex-col items-center px-4 py-10 text-center">
          <Icon name="news" size={20} className="text-steel-400" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-navy-900">No articles yet</p>
          <p className="mt-1 max-w-sm text-xs text-steel-600">
            The articles shipped with the site load from the database on first
            visit — if this stays empty, check the DATABASE_URL configuration.
          </p>
        </div>
      ) : (
        <ul role="list" className="space-y-3">
          {items.map((article) => (
            <li key={article.slug} className="card flex flex-col gap-4 p-4 sm:flex-row">
              <div className="relative h-20 w-full shrink-0 overflow-hidden border border-steel-200 bg-navy-900 sm:w-36">
                {article.image ? (
                  <Image
                    src={article.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 144px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <Icon name="image" size={18} className="text-steel-500" strokeWidth={1.5} />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-navy-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-500">
                    {article.category}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      article.published
                        ? "bg-emerald-600 text-white"
                        : "bg-steel-100 text-steel-600"
                    }`}
                  >
                    {article.published ? "Live" : "Draft"}
                  </span>
                  {article.featured ? (
                    <span className="rounded-full border border-gold-500/50 bg-gold-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-500">
                      Featured
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      article.source === "static"
                        ? "bg-steel-100 text-steel-500"
                        : "bg-brand-50 text-brand-700"
                    }`}
                  >
                    {article.source === "static" ? "Source file" : "Dashboard"}
                  </span>
                </div>
                <h3 className="display-sm mt-2 text-base text-navy-900">
                  {article.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-steel-600">
                  {article.excerpt || article.body[0] || "No excerpt yet."}
                </p>
                <p className="mt-1.5 text-[11px] uppercase tracking-[0.12em] text-steel-500">
                  {[article.dateLabel, article.readTime, `/blog/${article.slug}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-start gap-2 sm:flex-col">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(article)}
                >
                  <Icon name="pen" size={13} /> Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy === article.slug}
                  onClick={() => void togglePublish(article)}
                >
                  <Icon name="refresh" size={13} />
                  {article.published ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy === article.slug}
                  onClick={() => void remove(article)}
                  className="text-signal-600 hover:border-signal-300"
                >
                  <Icon name="close" size={13} />
                  {article.source === "static" ? "Revert" : "Delete"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <ArticleEditor
          article={editing}
          isNew={isNew}
          saving={saving}
          onChange={setEditing}
          onClose={() => {
            setEditing(null);
            setIsNew(false);
          }}
          onSubmit={(event) => {
            event.preventDefault();
            void save(editing, isNew);
          }}
        />
      ) : null}
    </section>
  );
}

function ArticleEditor({
  article,
  isNew,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  article: ManagedArticle;
  isNew: boolean;
  saving: boolean;
  onChange: (next: ManagedArticle) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function set<K extends keyof ManagedArticle>(
    key: K,
    value: ManagedArticle[K],
  ) {
    onChange({ ...article, [key]: value });
  }

  function setParagraph(index: number, value: string) {
    onChange({
      ...article,
      body: article.body.map((paragraph, i) => (i === index ? value : paragraph)),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? "New article" : "Edit article"}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-navy-950/55"
      />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-steel-200 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="font-mono text-xs text-steel-500">
              {isNew ? "new-article" : `/blog/${article.slug}`}
            </p>
            <h3 className="display-sm mt-1 truncate text-lg text-navy-900">
              {isNew ? "Write an article" : "Edit article"}
            </h3>
            <p className="mt-0.5 text-xs text-steel-600">
              Saved changes appear on /blog and /media straight away.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 border border-steel-200 p-2 text-steel-500 transition hover:text-navy-900"
          >
            <Icon name="close" size={16} />
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Title"
                htmlFor="article-title"
                required
                className="sm:col-span-2"
              >
                <Input
                  id="article-title"
                  value={article.title}
                  onChange={(e) => set("title", e.target.value)}
                  required
                  maxLength={180}
                />
              </Field>

              <Field
                label="Permalink"
                htmlFor="article-slug"
                hint={
                  isNew
                    ? "Lower-case words for the URL — leave blank to build it from the title."
                    : "Fixed after saving so shared links keep working."
                }
              >
                <Input
                  id="article-slug"
                  value={article.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  disabled={!isNew}
                  placeholder="my-article-slug"
                  maxLength={140}
                />
              </Field>

              <Field label="Category" htmlFor="article-category">
                <Select
                  id="article-category"
                  value={article.category}
                  onChange={(e) => {
                    const value: unknown = e.target.value;
                    if (isArticleCategory(value)) set("category", value);
                  }}
                >
                  {mediaCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Publish date" htmlFor="article-date">
                <Input
                  id="article-date"
                  type="date"
                  value={article.date}
                  onChange={(e) => {
                    const date = e.target.value;
                    onChange({
                      ...article,
                      date,
                      // Keep the printed label in step unless it was personalised.
                      dateLabel: labelFor(date),
                    });
                  }}
                />
              </Field>

              <Field
                label="Date label"
                htmlFor="article-date-label"
                hint="Shown on the cards, e.g. 18 August 2026."
              >
                <Input
                  id="article-date-label"
                  value={article.dateLabel}
                  onChange={(e) => set("dateLabel", e.target.value)}
                  maxLength={60}
                />
              </Field>

              <Field label="Read time" htmlFor="article-read-time">
                <Input
                  id="article-read-time"
                  value={article.readTime}
                  onChange={(e) => set("readTime", e.target.value)}
                  placeholder="3 min read"
                  maxLength={40}
                />
              </Field>

              <Field label="Excerpt" htmlFor="article-excerpt">
                <Textarea
                  id="article-excerpt"
                  rows={2}
                  value={article.excerpt}
                  onChange={(e) => set("excerpt", e.target.value)}
                  placeholder="One or two sentences shown on the listing cards…"
                  maxLength={600}
                />
              </Field>
            </div>

            <UploadField
              label="Header image"
              value={article.image}
              onChange={(url) => set("image", url)}
              folder="media"
              htmlFor="article-image"
              guidelines={{
                recommendedDimensions: "1600×900 px",
                acceptedTypes: "JPG, PNG, WebP, SVG",
                maxSizeMB: 10,
              }}
              hint="Lead image on the cards and at the top of the article."
            />

            <div>
              <span className="field-label">Body</span>
              <div className="space-y-2">
                {article.body.map((paragraph, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Textarea
                      rows={3}
                      value={paragraph}
                      onChange={(e) => setParagraph(index, e.target.value)}
                      placeholder={`Paragraph ${index + 1}…`}
                      className="min-h-[72px]"
                    />
                    <button
                      type="button"
                      aria-label={`Remove paragraph ${index + 1}`}
                      disabled={article.body.length === 1}
                      onClick={() =>
                        onChange({
                          ...article,
                          body: article.body.filter((_, i) => i !== index),
                        })
                      }
                      className="mt-1 shrink-0 border border-steel-200 p-2 text-steel-500 transition hover:border-signal-300 hover:text-signal-600 disabled:opacity-40"
                    >
                      <Icon name="close" size={13} />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onChange({ ...article, body: [...article.body, ""] })
                  }
                >
                  <Icon name="plus" size={13} /> Add paragraph
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-2.5 border border-steel-200 px-3 py-2.5 text-sm text-steel-700 transition hover:border-brand-400">
                <input
                  type="checkbox"
                  checked={article.published}
                  onChange={(e) => set("published", e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#0f5fbf]"
                />
                <span>
                  <span className="block font-semibold text-navy-900">Live</span>
                  <span className="block text-xs text-steel-500">
                    Visible on /blog and /media. Off keeps it as a draft.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 border border-steel-200 px-3 py-2.5 text-sm text-steel-700 transition hover:border-brand-400">
                <input
                  type="checkbox"
                  checked={article.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#0f5fbf]"
                />
                <span>
                  <span className="block font-semibold text-navy-900">
                    Feature this article
                  </span>
                  <span className="block text-xs text-steel-500">
                    Leads both listings — only one can be featured at a time.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-steel-200 bg-steel-25 px-4 py-3 sm:px-5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving
                ? "Saving…"
                : isNew
                  ? "Create article"
                  : "Save changes"}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}