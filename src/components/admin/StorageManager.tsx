"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/admin/ToastProvider";

interface UploadedObject {
  key: string;
  size: number;
  lastModified: string;
  url: string;
}

interface StorageManagerProps {
  folder: "media" | "gallery" | "floor-plans" | "posters" | "logos";
  title: string;
  hint: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Admin uploader backed by Cloudflare R2.
 *
 * Files go to the bucket via /api/admin/upload; the grid below reads the
 * bucket back through /api/admin/storage using presigned URLs, so the bucket
 * itself can stay private.
 */
export function StorageManager({ folder, title, hint }: StorageManagerProps) {
  const { confirm } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [objects, setObjects] = useState<UploadedObject[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const apply = (data: { configured?: boolean; objects?: UploadedObject[] }) => {
    setConfigured(Boolean(data.configured));
    setObjects(data.objects ?? []);
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/storage?prefix=${folder}/`);
      if (!res.ok) return;
      apply(await res.json());
    } catch {
      setError("Could not reach the storage service.");
    }
  }, [folder]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/storage?prefix=${folder}/`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setConfigured(Boolean(data.configured));
        setObjects(data.objects ?? []);
      } catch {
        if (!cancelled) setError("Could not reach the storage service.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [folder]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setBusy(true);

    for (const file of Array.from(files)) {
      setProgress(`Uploading ${file.name}…`);
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.message ?? "Upload failed.");
          break;
        }
      } catch {
        setError("Upload failed — check your connection.");
        break;
      }
    }

    setBusy(false);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
    await load();
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Clipboard is unavailable in this browser.");
    }
  };

  const remove = async (key: string) => {
    const ok = await confirm({
      title: "Delete file",
      message: `Delete ${key.split("/").pop()} from storage?`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/storage?key=${encodeURIComponent(key)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        setError("Delete failed.");
        return;
      }
      setObjects((current) => current.filter((o) => o.key !== key));
    } catch {
      setError("Delete failed — check your connection.");
    }
  };

  if (configured === false) {
    return (
      <div className="card border-signal-100 bg-signal-50 p-5">
        <p className="text-sm font-semibold text-navy-900">Storage not configured</p>
        <p className="mt-1 text-sm text-steel-600">
          Set <code className="font-mono text-[12px]">R2_ACCOUNT_ID</code>,{" "}
          <code className="font-mono text-[12px]">R2_BUCKET</code>,{" "}
          <code className="font-mono text-[12px]">R2_ACCESS_KEY_ID</code> and{" "}
          <code className="font-mono text-[12px]">R2_SECRET_ACCESS_KEY</code>, then
          restart the server.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="display text-base text-navy-900">{title}</h3>
            <p className="mt-1 max-w-xl text-sm text-steel-600">{hint}</p>
          </div>
          <div className="flex items-center gap-2">
            <label
              className={cn(
                "btn btn-primary btn-sm cursor-pointer",
                busy && "pointer-events-none opacity-60",
              )}
            >
              <Icon name="upload" size={15} className="mr-1.5" />
              {busy ? "Uploading…" : "Choose files"}
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml"
                className="sr-only"
                onChange={(event) => void onFiles(event.target.files)}
              />
            </label>
            <button
              type="button"
              onClick={() => void load()}
              className="btn btn-outline btn-sm"
              disabled={busy}
            >
              <Icon name="refresh" size={15} className="mr-1.5" />
              Refresh
            </button>
          </div>
        </div>

        {progress ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-steel-600">
            <Icon name="refresh" size={14} className="animate-spin" />
            {progress}
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-4 border border-signal-100 bg-signal-50 px-4 py-3 text-sm text-signal-700"
          >
            {error}
          </p>
        ) : null}

        <p className="mt-4 text-xs text-steel-500">
          JPG, PNG, WebP, AVIF, GIF or SVG · up to 10 MB each · stored in{" "}
          <code className="font-mono">{folder}/</code>
        </p>
      </div>

      {objects.length === 0 ? (
        <p className="card p-6 text-sm text-steel-500">
          Nothing uploaded to <code className="font-mono">{folder}/</code> yet.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {objects.map((object) => (
            <li key={object.key} className="card overflow-hidden">
              <div className="relative aspect-[4/3] bg-steel-50">
                {/* Thumbnails stream through our own authenticated route so the
                    private bucket needs no CORS policy. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/admin/object?key=${encodeURIComponent(object.key)}`}
                  alt={object.key}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3">
                <p
                  className="truncate text-xs font-medium text-navy-900"
                  title={object.key}
                >
                  {object.key.split("/").pop()}
                </p>
                <p className="mt-0.5 text-[11px] text-steel-500">
                  {formatBytes(object.size)} ·{" "}
                  {new Date(object.lastModified).toLocaleDateString("en-IN")}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => void copyUrl(object.url)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-600 hover:text-brand-700"
                  >
                    <Icon name={copied === object.url ? "check" : "link"} size={12} />
                    {copied === object.url ? "Copied" : "Copy link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(object.key)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-steel-400 hover:text-signal-600"
                  >
                    <Icon name="close" size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
