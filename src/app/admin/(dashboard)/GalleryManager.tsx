"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";

const CATEGORIES = [
  "Expo",
  "Exhibitors",
  "Visitors",
  "Machines",
  "Networking",
  "Events",
] as const;

type Category = (typeof CATEGORIES)[number];

interface GalleryItem {
  id: string;
  title: string;
  category: Category;
  objectKey?: string;
  /** Present on photographs imported from /public rather than uploaded. */
  src?: string;
  origin?: "upload" | "hosted";
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Preview source. Imported photographs live in /public and are already
 * reachable; uploads are private in R2 so they stream through the
 * authenticated admin object route.
 */
const previewSrc = (item: GalleryItem) =>
  item.src || `/api/admin/object?key=${encodeURIComponent(item.objectKey ?? "")}`;

/**
 * Reads intrinsic dimensions so the public page can size images with next/image
 * without a layout shift. SVGs often report 0, so callers must keep a fallback.
 */
function readImageSize(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = "image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml";

export function GalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState<"All" | Category>("All");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [importing, setImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/gallery", { cache: "no-store", credentials: "include" })
      .then((res) => res.json().catch(() => null))
      .then((data: { ok?: boolean; items?: GalleryItem[]; message?: string } | null) => {
        if (cancelled) return;
        if (data?.ok && data.items) setItems(data.items);
        else setMessage({ type: "error", text: data?.message ?? "Could not load images." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // How many of the photographs already hosted in /public are not yet managed.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/gallery/import", { cache: "no-store", credentials: "include" })
      .then((res) => res.json().catch(() => null))
      .then((data: { ok?: boolean; pending?: number } | null) => {
        if (!cancelled && data?.ok && typeof data.pending === "number") {
          setPendingImport(data.pending);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  /** Copies the hosted /public photographs into the gallery collection. */
  async function handleImport() {
    if (importing) return;
    setImporting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/gallery/import", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? "Import failed");
      }

      const listRes = await fetch("/api/admin/gallery", {
        cache: "no-store",
        credentials: "include",
      });
      const listData = await listRes.json().catch(() => null);
      if (listData?.ok && listData.items) {
        setItems(listData.items as GalleryItem[]);
      }

      setPendingImport(0);
      setMessage({
        type: "success",
        text:
          data.created > 0
            ? `Imported ${data.created} hosted photo${data.created === 1 ? "" : "s"}. Check the categories and adjust anything guessed wrong.`
            : "Every hosted photo is already imported.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Import failed",
      });
    } finally {
      setImporting(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || uploading) return;
    if (file.size > MAX_BYTES) {
      setMessage({ type: "error", text: "Image exceeds the 10 MB limit." });
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      const { width, height } = await readImageSize(file);

      const body = new FormData();
      body.append("file", file);
      body.append("folder", "gallery");
      const up = await fetch("/api/admin/upload", { method: "POST", body });
      const uploaded = await up.json().catch(() => null);
      if (!up.ok || !uploaded?.ok) {
        throw new Error(uploaded?.message ?? "Upload failed");
      }

      const created = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 160),
          category: "Expo",
          objectKey: uploaded.key,
          origin: "upload",
          caption: "",
          alt: "",
          width: width || 1600,
          height: height || 1067,
          published: false,
        }),
      });
      const saved = await created.json().catch(() => null);
      if (!created.ok || !saved?.ok) {
        throw new Error(saved?.message ?? "Could not save image");
      }

      setItems((current) =>
        [...current, saved.item as GalleryItem].sort(
          (a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt),
        ),
      );
      setMessage({
        type: "success",
        text: "Image added as a draft. Publish it when you are ready.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function patchItem(id: string, patch: Partial<GalleryItem>) {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? "Could not save");
      }
      setItems((current) =>
        current
          .map((item) => (item.id === id ? (data.item as GalleryItem) : item))
          .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt)),
      );
      return true;
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not save",
      });
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function togglePublish(item: GalleryItem) {
    const ok = await patchItem(item.id, { published: !item.published });
    if (ok) {
      setMessage({
        type: "success",
        text: item.published
          ? `"${item.title}" hidden from the public gallery.`
          : `"${item.title}" is now live on /gallery.`,
      });
    }
  }

  async function removeItem(item: GalleryItem) {
    if (!confirm(`Delete "${item.title}"? This removes it from the website too.`)) return;
    setBusyId(item.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/gallery?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? "Could not delete");
      }
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage({ type: "success", text: "Image deleted." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not delete",
      });
    } finally {
      setBusyId(null);
    }
  }

  /** Nudges an item up or down and rewrites the whole order sequence. */
  async function move(item: GalleryItem, direction: -1 | 1) {
    const ordered = [...items].sort(
      (a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt),
    );
    const index = ordered.findIndex((entry) => entry.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;

    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((entry, position) => ({ ...entry, order: position }));
    setItems(reordered);
    setBusyId(item.id);

    // Persist only the two entries whose order actually moved.
    try {
      await Promise.all(
        [ordered[index], ordered[target]].map((entry) =>
          fetch("/api/admin/gallery", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: entry.id,
              order: reordered.find((r) => r.id === entry.id)?.order ?? entry.order,
            }),
          }),
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  const visible = useMemo(
    () =>
      filter === "All"
        ? items
        : items.filter((item) => item.category === filter),
    [items, filter],
  );

  const publishedCount = items.filter((item) => item.published).length;

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    void handleFiles(e.dataTransfer.files);
  }

  if (loading) {
    return (
      <div className="card flex items-center gap-2 p-6 text-sm text-steel-600">
        <Icon name="refresh" size={16} className="animate-spin" />
        Loading gallery images…
      </div>
    );
  }

  return (
    <section aria-label="Gallery images" className="space-y-4">
      <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <span className="eyebrow mb-1.5">Gallery</span>
          <h2 className="display-sm text-lg text-navy-900 sm:text-xl">
            Website Images
          </h2>
          <p className="mt-1 text-xs text-steel-600 sm:text-sm">
            {items.length === 0
              ? "No images yet. Import the hosted photos or upload your own."
              : `${items.length} image${items.length === 1 ? "" : "s"} · ${publishedCount} live on the website · ${items.length - publishedCount} draft`}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {pendingImport !== null && pendingImport > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleImport()}
              disabled={importing}
            >
              <span className="flex items-center gap-2">
                <Icon name={importing ? "refresh" : "download"} size={15} className={importing ? "animate-spin" : undefined} />
                {importing
                  ? "Importing…"
                  : `Import ${pendingImport} hosted photo${pendingImport === 1 ? "" : "s"}`}
              </span>
            </Button>
          ) : null}
          <Button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <span className="flex items-center gap-2">
            <Icon name="upload" size={16} strokeWidth={2} />
            {uploading ? "Uploading…" : "Upload Image"}
          </span>
        </Button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <div
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        className={`rounded-xl border-2 border-dashed px-4 py-3 text-center text-xs transition-colors ${
          dragging
            ? "border-brand-500 bg-brand-50 text-navy-900"
            : "border-steel-300 bg-steel-50 text-steel-600"
        }`}
      >
        Drag an image here to upload it as a draft, or use the button above.
        <span className="mt-0.5 block text-[11px] text-steel-500">
          JPG, PNG, WebP, AVIF, GIF or SVG · up to 10 MB · landscape works best
        </span>
      </div>

      {message ? (
        <p
          role="status"
          className={`text-xs font-semibold ${message.type === "error" ? "text-signal-600" : "text-emerald-700"}`}
        >
          {message.text}
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {(["All", ...CATEGORIES] as const).map((value) => {
            const count =
              value === "All"
                ? items.length
                : items.filter((item) => item.category === value).length;
            if (value !== "All" && count === 0) return null;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  filter === value
                    ? "border-brand-500 bg-brand-50 text-navy-900"
                    : "border-steel-200 bg-white text-steel-600 hover:border-steel-300"
                }`}
              >
                {value} <span className="text-steel-400">{count}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-steel-300 bg-white/70 px-4 py-10 text-center shadow-sm ring-1 ring-black/5">
          <Icon name="image" size={20} className="text-steel-400" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-navy-900">
            {items.length === 0 ? "No images uploaded yet" : "Nothing in this category"}
          </p>
          <p className="mt-1 max-w-sm text-xs text-steel-600">
            {items.length === 0
              ? "Upload a photo and it will be available on the public gallery page."
              : "Choose a different category or upload another image."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
          {visible.map((item) => {
            const position = visible.findIndex((entry) => entry.id === item.id);
            const busy = busyId === item.id;
            return (
              <li
                key={item.id}
                className="flex flex-col overflow-hidden rounded-xl border border-steel-200 bg-white"
              >
                <div className="relative aspect-[4/3] border-b border-steel-200 bg-steel-50">
                  <img
                    src={previewSrc(item)}
                    alt={item.alt || item.title}
                    className="h-full w-full object-contain p-2"
                  />
                  <span
                    className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      item.published
                        ? "bg-emerald-600 text-white"
                        : "bg-steel-700/85 text-white"
                    }`}
                  >
                    {item.published ? "Live" : "Draft"}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy-900" title={item.title}>
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-steel-500">
                      {item.category}
                      {item.origin === "hosted" ? " · hosted" : ""}
                      {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
                    </p>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void togglePublish(item)}
                      disabled={busy}
                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-1 text-[11px] font-medium transition ${
                        item.published
                          ? "border-steel-200 text-steel-600 hover:border-steel-300"
                          : "border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      <Icon name={item.published ? "eye" : "check-circle"} size={11} />
                      {item.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded border border-steel-200 px-1.5 py-1 text-[11px] font-medium text-steel-700 transition hover:border-brand-400 hover:text-navy-900"
                    >
                      <Icon name="pen" size={11} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeItem(item)}
                      disabled={busy}
                      aria-label={`Delete ${item.title}`}
                      className="ml-auto inline-flex items-center rounded border border-steel-200 p-1 text-steel-500 transition hover:border-signal-300 hover:text-signal-600"
                    >
                      <Icon name="close" size={11} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 border-t border-steel-100 pt-1.5">
                    <button
                      type="button"
                      onClick={() => void move(item, -1)}
                      disabled={busy || position === 0}
                      aria-label="Move earlier"
                      className="rounded border border-steel-200 p-1 text-steel-500 transition hover:border-steel-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Icon name="chevron-down" size={11} className="rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void move(item, 1)}
                      disabled={busy || position === visible.length - 1}
                      aria-label="Move later"
                      className="rounded border border-steel-200 p-1 text-steel-500 transition hover:border-steel-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Icon name="chevron-down" size={11} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <EditModal
          item={editing}
          saving={busyId === editing.id}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            const ok = await patchItem(editing.id, patch);
            if (ok) setEditing(null);
          }}
        />
      ) : null}
    </section>
  );
}

function EditModal({
  item,
  saving,
  onClose,
  onSave,
}: {
  item: GalleryItem;
  saving: boolean;
  onClose: () => void;
  onSave: (patch: Partial<GalleryItem>) => Promise<void>;
}) {
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState<Category>(item.category);
  const [caption, setCaption] = useState(item.caption ?? "");
  const [alt, setAlt] = useState(item.alt ?? "");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSave({
      title: title.trim() || item.title,
      category,
      caption: caption.trim(),
      alt: alt.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Edit gallery image"
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy-950/55" />
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-steel-200 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="font-mono text-xs text-steel-500">{item.id}</p>
            <h3 className="display-sm mt-1 truncate text-lg text-navy-900">Edit image</h3>
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

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="flex items-center gap-3 rounded-xl border border-steel-200 bg-steel-50 p-2">
              <img
                src={previewSrc(item)}
                alt=""
                className="h-14 w-20 flex-shrink-0 rounded border border-steel-200 bg-white object-contain p-1"
              />
              <p className="text-[11px] leading-relaxed text-steel-600">
                {item.published ? (
                  <span className="font-semibold text-emerald-700">Live on /gallery.</span>
                ) : (
                  <span className="font-semibold text-steel-700">Draft — not on the website.</span>
                )}
                <span className="mt-0.5 block font-mono break-all">
                  {item.src || item.objectKey}
                </span>
              </p>
            </div>

            <Field label="Title" htmlFor="gal-title" required>
              <Input
                id="gal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={160}
              />
            </Field>

            <Field label="Category" htmlFor="gal-category">
              <Select
                id="gal-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Caption"
              htmlFor="gal-caption"
              hint="Optional line shown under the photo on the website."
            >
              <Textarea id="gal-caption" rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} />
            </Field>

            <Field
              label="Alt text"
              htmlFor="gal-alt"
              hint="Describes the photo for screen readers and when it fails to load."
            >
              <Textarea id="gal-alt" rows={2} value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} />
            </Field>
          </div>

          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-steel-200 bg-steel-50 px-4 py-3 sm:px-5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}