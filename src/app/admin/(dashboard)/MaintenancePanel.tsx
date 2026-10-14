"use client";

import { useCallback, useEffect, useState } from "react";
import type { MaintenanceSettings } from "@/types/maintenance";

/**
 * Maintenance mode switch for the Settings section.
 *
 * The save is deliberately two-step: flipping the switch only marks the form
 * dirty, so taking the whole public site offline is never one stray click.
 */

const DEFAULTS: MaintenanceSettings = {
  enabled: false,
  headline: "",
  message: "",
  resumeAt: "",
};

interface MaintenancePayload {
  ok: boolean;
  settings: MaintenanceSettings;
  ttlMs?: number;
  message?: string;
}

/** ISO instant -> value for <input type="datetime-local">, in the viewer's zone. */
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function MaintenancePanel({ readOnly }: { readOnly: boolean }) {
  const [settings, setSettings] = useState<MaintenanceSettings>(DEFAULTS);
  const [resumeLocal, setResumeLocal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ttl, setTtl] = useState(10_000);

  // Counts down the window in which the edge middleware may still be serving a
  // cached value, so the operator knows when the site actually flips.
  const [propagateIn, setPropagateIn] = useState(0);

  const apply = useCallback((payload: MaintenancePayload) => {
    setSettings(payload.settings);
    setResumeLocal(toLocalInput(payload.settings.resumeAt));
    setTtl(payload.ttlMs ?? 10_000);
    setDirty(false);
  }, []);

  // Used by the Discard button only. Mount loading goes through the effect
  // below, which follows the same fetch().then() shape as the other managers
  // so the setState calls are not synchronous within the effect body.
  const reload = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/maintenance", {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message ?? "Could not load");
      apply(payload);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load settings",
      );
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/maintenance", { cache: "no-store" })
      .then((res) => res.json().catch(() => null))
      .then((payload: MaintenancePayload | null) => {
        if (cancelled) return;
        if (payload?.ok) apply(payload);
        else setError("Could not load settings");
      })
      .catch(() => {
        if (!cancelled) setError("Could not load settings");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apply]);

  useEffect(() => {
    if (propagateIn <= 0) return;
    const id = window.setInterval(() => {
      setPropagateIn((value) => Math.max(0, value - 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [propagateIn]);

  function update<K extends keyof MaintenanceSettings>(
    key: K,
    value: MaintenanceSettings[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setNotice(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      // An empty datetime field must clear the stored value, not send "" as a
      // string that would fail to parse back into a countdown.
      const resumeAt = resumeLocal
        ? new Date(resumeLocal).toISOString()
        : "";

      const response = await fetch("/api/admin/maintenance", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...settings, resumeAt }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message ?? "Could not save");

      setSettings(payload.settings);
      setResumeLocal(toLocalInput(payload.settings.resumeAt));
      setTtl(payload.ttlMs ?? ttl);
      setDirty(false);
      setPropagateIn((payload.ttlMs ?? ttl) / 1000);
      setNotice(
        payload.settings.enabled
          ? "Maintenance mode is on. The public site is now offline."
          : "Maintenance mode is off. The public site is live again.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save settings",
      );
    } finally {
      setSaving(false);
    }
  }

  if (readOnly) {
    return (
      <div className="card p-5">
        <h2 className="display-sm mb-1 text-lg text-navy-900">
          Maintenance Mode
        </h2>
        <p className="text-sm text-steel-600">
          Only a superadmin can take the public site offline. Ask{" "}
          <code className="rounded bg-steel-100 px-1 py-0.5 text-xs">
            admin@heymovox.com
          </code>{" "}
          if the site needs to be switched.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-5">
        <p className="text-sm text-steel-500">Loading maintenance settings…</p>
      </div>
    );
  }

  const isOn = settings.enabled;
  const propagateSoon = propagateIn > 0;

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="display-sm text-lg text-navy-900">Maintenance Mode</h2>
          <p className="mt-1 max-w-md text-sm text-steel-600">
            Takes the entire public site offline and serves a countdown page
            with contact details instead.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-[0.1em] uppercase ${
              isOn
                ? "border-signal-500/30 bg-signal-50 text-signal-700"
                : "border-steel-200 bg-steel-50 text-steel-600"
            }`}
          >
            {isOn ? "Site offline" : "Site live"}
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={isOn}
            aria-label="Maintenance mode"
            onClick={() => update("enabled", !isOn)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              isOn ? "bg-signal-500" : "bg-steel-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                isOn ? "left-[1.5rem]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {isOn && (
        <div className="mb-4 rounded-xl border border-signal-500/25 bg-signal-50 px-4 py-3 text-sm text-signal-700">
          <p className="font-semibold">
            Every public visitor will see the maintenance page.
          </p>
          <p className="mt-1 text-signal-700/90">
            The admin dashboard stays reachable, so you can always switch this
            back off. Turn it off when the work is done &mdash; the countdown
            reaching zero does not bring the site back on its own.
          </p>
        </div>
      )}

      <div className="space-y-4 max-w-xl">
        <div>
          <label
            htmlFor="mt-headline"
            className="mb-1 block text-xs font-semibold tracking-[0.12em] text-steel-500 uppercase"
          >
            Headline <span className="font-normal normal-case">(optional)</span>
          </label>
          <input
            id="mt-headline"
            type="text"
            value={settings.headline}
            maxLength={160}
            placeholder="We'll be back shortly"
            onChange={(event) => update("headline", event.target.value)}
            className="w-full rounded-xl border border-steel-200 bg-white px-3 py-2 text-sm text-navy-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200/60"
          />
        </div>

        <div>
          <label
            htmlFor="mt-message"
            className="mb-1 block text-xs font-semibold tracking-[0.12em] text-steel-500 uppercase"
          >
            Message <span className="font-normal normal-case">(optional)</span>
          </label>
          <textarea
            id="mt-message"
            value={settings.message}
            rows={3}
            maxLength={1000}
            placeholder="Scheduled server migration — back online tonight."
            onChange={(event) => update("message", event.target.value)}
            className="w-full rounded-xl border border-steel-200 bg-white px-3 py-2 text-sm text-navy-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200/60"
          />
        </div>

        <div>
          <label
            htmlFor="mt-resume"
            className="mb-1 block text-xs font-semibold tracking-[0.12em] text-steel-500 uppercase"
          >
            Back online by{" "}
            <span className="font-normal normal-case">
              (optional, drives the countdown)
            </span>
          </label>
          <input
            id="mt-resume"
            type="datetime-local"
            value={resumeLocal}
            onChange={(event) => {
              setResumeLocal(event.target.value);
              setDirty(true);
              setNotice(null);
            }}
            className="w-full rounded-xl border border-steel-200 bg-white px-3 py-2 text-sm text-navy-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>

          {dirty && !saving && (
            <button
              type="button"
              onClick={reload}
              className="btn btn-ghost"
            >
              Discard
            </button>
          )}

          <a
            href="/maintenance?preview=1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-brand-600 underline-offset-2 hover:underline"
          >
            Preview the page
          </a>
        </div>

        {notice && (
          <p className="text-sm font-medium text-brand-700">
            {notice}
            {propagateSoon && (
              <span className="ml-1 font-normal text-steel-500">
                Changes reach every visitor within{" "}
                {Math.ceil(propagateIn)}s.
              </span>
            )}
          </p>
        )}

        {error && (
          <p className="text-sm font-medium text-signal-600">{error}</p>
        )}

        <p className="text-xs text-steel-500">
          The site checks this flag on every request and may serve a cached
          value for up to {Math.round(ttl / 1000)} seconds, so a change takes a
          few seconds to apply everywhere.
        </p>
      </div>
    </div>
  );
}