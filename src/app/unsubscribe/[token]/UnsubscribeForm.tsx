"use client";

import { useState } from "react";

/**
 * Confirms an unsubscribe by re-POSTing the token.
 *
 * A POST keeps the action off GET, so mail client prefetchers and link scanners
 * cannot silently unsubscribe somebody by merely fetching the link.
 */
export function UnsubscribeForm({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "busy" || state === "done") return;

    setState("busy");
    setError("");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message ?? "Could not update your preference.");
      }
      setState("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not update your preference.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div
        role="status"
        className="mt-6 border border-emerald-600 bg-emerald-50 p-4 text-sm text-emerald-800"
      >
        <p className="font-semibold">You have been unsubscribed.</p>
        <p className="mt-1">
          Marketing email to this address has stopped. Booking and registration
          confirmations still arrive.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6">
      <button
        type="submit"
        disabled={state === "busy"}
        className="inline-flex items-center gap-2 border border-navy-900 bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "busy" ? "Updating…" : "Confirm unsubscribe"}
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-signal-600">
          {error}
        </p>
      ) : null}
    </form>
  );
}