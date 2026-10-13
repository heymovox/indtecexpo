"use client";

import { useState, useCallback, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface UploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: "floor-plans" | "posters" | "gallery" | "media" | "logos";
  guidelines?: {
    recommendedDimensions?: string;
    acceptedTypes?: string;
    maxSizeMB?: number;
  };
  htmlFor?: string;
  hint?: string;
}

const DEFAULT_GUIDELINES = {
  acceptedTypes: "JPG, PNG, WebP, AVIF, GIF, SVG",
  maxSizeMB: 10,
};

export function UploadField({
  label,
  value,
  onChange,
  folder,
  guidelines,
  htmlFor,
  hint,
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
              <img
                src={displayUrl}
                alt="Preview"
                className="max-h-48 max-w-full object-contain rounded-lg shadow-sm"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onChange(displayUrl)}
                  className="bg-white/90"
                >
                  <Icon name="download" size={14} />
                </Button>
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
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml"
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