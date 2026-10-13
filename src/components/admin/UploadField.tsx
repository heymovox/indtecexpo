"use client";

import { useState, useCallback, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/** What /api/admin/upload returns once the bytes are in the bucket. */
export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

interface UploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /**
   * Fired after a successful upload with the stored object metadata. Use this
   * instead of `onChange` when persisting: `onChange` receives a presigned URL
   * that expires in an hour, whereas `key` stays valid forever.
   */
  onUploaded?: (result: UploadResult) => void;
  folder: "floor-plans" | "posters" | "gallery" | "media" | "logos";
  guidelines?: {
    recommendedDimensions?: string;
    acceptedTypes?: string;
    maxSizeMB?: number;
  };
  htmlFor?: string;
  hint?: string;
  compact?: boolean;
  /** "pdf" swaps the image preview for a document tile and widens `accept`. */
  kind?: "image" | "pdf";
}

const IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml";
const PDF_ACCEPT = "application/pdf";

const DEFAULT_GUIDELINES = {
  acceptedTypes: "JPG, PNG, WebP, AVIF, GIF, SVG",
  maxSizeMB: 10,
};

export function UploadField({
  label,
  value,
  onChange,
  onUploaded,
  folder,
  guidelines,
  htmlFor,
  hint,
  compact = false,
  kind = "image",
}: UploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useCallback((el: HTMLInputElement | null) => {
    if (el && !uploading) el.value = "";
  }, [uploading]);

  const g = { ...DEFAULT_GUIDELINES, ...guidelines };

  async function handleUpload(file: File) {
    if (file.size > (g.maxSizeMB ?? 10) * 1024 * 1024) {
      setError(`File exceeds ${g.maxSizeMB} MB limit.`);
      return;
    }
    const allowed = (g.acceptedTypes ?? DEFAULT_GUIDELINES.acceptedTypes)
      .split(",")
      .map((t) => t.trim().toLowerCase());
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
    if (!allowed.some((t) => t === ext.replace(".", "") || t === file.type)) {
      setError(`Only ${g.acceptedTypes} files are allowed.`);
      return;
    }

    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? "Upload failed");
      }
      setPreview(data.url);
      onChange(data.url);
      onUploaded?.(data as UploadResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  function handleClear() {
    setPreview(null);
    onChange("");
  }

  const displayUrl = preview || value;
  const accept = kind === "pdf" ? PDF_ACCEPT : IMAGE_ACCEPT;

  if (compact) {
    return (
      <div className="min-w-0" onDrop={handleDrop} onDragOver={handleDragOver}>
        <label htmlFor={htmlFor} className="sr-only">
          {label}
        </label>
        <input
          ref={fileInputRef}
          id={htmlFor}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={uploading}
          className="sr-only"
        />
        {displayUrl ? (
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded border border-steel-200 bg-white">
              {kind === "pdf" ? (
                <span className="flex h-full w-full items-center justify-center text-signal-600">
                  <Icon name="news" size={16} />
                </span>
              ) : (
                <img src={displayUrl} alt="" className="h-full w-full object-contain p-0.5" />
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/75">
                  <Icon name="refresh" size={12} className="animate-spin text-steel-500" />
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <button
                type="button"
                onClick={() => document.getElementById(htmlFor ?? "")?.click()}
                className="inline-flex items-center gap-1 rounded border border-steel-200 px-1.5 py-1 text-[11px] font-medium text-steel-700 transition hover:border-brand-400 hover:text-navy-900"
              >
                <Icon name="refresh" size={11} />
                Replace
              </button>
              <button
                type="button"
                onClick={handleClear}
                aria-label={`Remove ${label}`}
                className="inline-flex items-center rounded border border-steel-200 p-1 text-steel-500 transition hover:border-signal-300 hover:text-signal-600"
              >
                <Icon name="close" size={11} />
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor={htmlFor}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded border border-dashed border-steel-300 bg-steel-50 px-2 py-2 text-[11px] font-medium text-steel-600 transition hover:border-brand-400 hover:bg-brand-50 hover:text-navy-900"
          >
            <Icon name="upload" size={12} />
            {uploading ? "Uploading…" : "Upload logo"}
          </label>
        )}
        {error && (
          <p className="mt-1 text-[11px] text-signal-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="field-label">
        {label}
      </label>
      {hint && !error && <span className="mt-1 block text-xs text-steel-500">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
      <div className="space-y-2">
        {/* Upload drop zone / preview */}
        <div
          className={`relative border-2 rounded-xl transition-colors ${
            displayUrl
              ? "border-transparent bg-steel-50"
              : "border-dashed border-steel-300 hover:border-brand-400"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {displayUrl ? (
            <div className="p-4 min-h-[120px] flex items-center justify-center">
              {kind === "pdf" ? (
                <span className="flex flex-col items-center gap-2 text-signal-600">
                  <Icon name="news" size={34} strokeWidth={1.5} />
                  <span className="text-xs font-medium">PDF attached</span>
                </span>
              ) : (
                <img
                  src={displayUrl}
                  alt="Preview"
                  className="max-h-48 max-w-full object-contain rounded-lg shadow-sm"
                />
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                {kind === "pdf" ? (
                  <a
                    href={displayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded border border-steel-300 bg-white/90 text-steel-700 transition hover:border-steel-400"
                    aria-label="Open PDF"
                  >
                    <Icon name="external" size={14} />
                  </a>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange(displayUrl)}
                    className="bg-white/90"
                  >
                    <Icon name="download" size={14} />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="bg-white/90 text-signal-600 border-signal-300 hover:bg-signal-50"
                >
                  <Icon name="close" size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <label className="cursor-pointer p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                disabled={uploading}
                className="sr-only"
              />
              <Icon name="upload" size={28} className="mx-auto text-steel-400" strokeWidth={1.5} />
              <p className="mt-2 text-sm font-medium text-navy-900">Click or drag to upload</p>
              <p className="mt-1 text-xs text-steel-500">
                {g.acceptedTypes} · up to {g.maxSizeMB} MB
              </p>
              {g.recommendedDimensions && (
                <p className="mt-1 text-xs text-steel-400">
                  Recommended: {g.recommendedDimensions}
                </p>
              )}
            </label>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
              <div className="flex items-center gap-2 text-sm text-steel-600">
                <Icon name="refresh" size={16} className="animate-spin" strokeWidth={2} />
                Uploading…
              </div>
            </div>
          )}
        </div>

        {/* Current URL (if any) */}
        {displayUrl && (
          <div className="text-[11px] text-steel-500 font-mono truncate">
            {displayUrl}
          </div>
        )}

        {/* Guidelines */}
        <details className="group">
          <summary className="cursor-pointer text-xs text-steel-500 flex items-center gap-1">
            <Icon name="chevron-down" size={12} className="transition-transform group-open:rotate-180" />
            Upload guidelines
          </summary>
          <ul className="mt-2 ml-4 space-y-1 text-[11px] text-steel-600 list-disc">
            <li>Format: {g.acceptedTypes}</li>
            <li>Maximum file size: {g.maxSizeMB} MB</li>
            {g.recommendedDimensions && (
              <li>Recommended dimensions: {g.recommendedDimensions}</li>
            )}
            <li>Files are stored in Cloudflare R2 (private bucket)</li>
            <li>Preview URLs are presigned for 1 hour</li>
          </ul>
        </details>

        {error && <p className="text-xs text-signal-600" role="alert">{error}</p>}
      </div>
    </div>
  );
}