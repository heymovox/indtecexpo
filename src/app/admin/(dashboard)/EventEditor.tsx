"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/Form";

export interface EventEditValues {
  slug: string;
  name: string;
  dateLabel: string;
  dateRangeShort: string;
  positioning: string;
  venueName: string;
  summary: string;
  published: boolean;
}

interface SaveResponse {
  ok?: boolean;
  message?: string;
}

export function EventEditor({
  values,
  hasOverride,
}: {
  values: EventEditValues;
  hasOverride: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<EventEditValues>(values);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function update<K extends keyof EventEditValues>(key: K, value: EventEditValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setState(null);
    try {
      const response = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json().catch(() => null)) as SaveResponse | null;
      if (!response.ok || !data?.ok) {
        setState({
          type: "error",
          text: data?.message ?? "Could not save the event. Please try again.",
        });
        setSaving(false);
        return;
      }
      setState({ type: "success", text: "Event override saved." });
      router.refresh();
    } catch {
      setState({
        type: "error",
        text: "Could not reach the server. Please try again.",
      });
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-steel-500">/{form.slug}</p>
          <p className="text-xs text-steel-500">
            {hasOverride
              ? "Admin override active — values below replace the static defaults."
              : "Editing creates an override on top of the static defaults."}
          </p>
        </div>
        {state ? <FormAlert type={state.type}>{state.text}</FormAlert> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Event name" htmlFor={`${form.slug}-name`} required>
          <Input
            id={`${form.slug}-name`}
            value={form.name}
            maxLength={160}
            onChange={(event) => update("name", event.target.value)}
            required
          />
        </Field>
        <Field label="Positioning" htmlFor={`${form.slug}-positioning`}>
          <Input
            id={`${form.slug}-positioning`}
            value={form.positioning}
            maxLength={120}
            onChange={(event) => update("positioning", event.target.value)}
          />
        </Field>
        <Field label="Full date label" htmlFor={`${form.slug}-dateLabel`}>
          <Input
            id={`${form.slug}-dateLabel`}
            value={form.dateLabel}
            maxLength={120}
            onChange={(event) => update("dateLabel", event.target.value)}
          />
        </Field>
        <Field label="Short date range" htmlFor={`${form.slug}-range`}>
          <Input
            id={`${form.slug}-range`}
            value={form.dateRangeShort}
            maxLength={60}
            onChange={(event) => update("dateRangeShort", event.target.value)}
          />
        </Field>
        <Field label="Venue name" htmlFor={`${form.slug}-venue`}>
          <Input
            id={`${form.slug}-venue`}
            value={form.venueName}
            maxLength={160}
            onChange={(event) => update("venueName", event.target.value)}
          />
        </Field>
        <Field label="Visibility" htmlFor={`${form.slug}-published`}>
          <Select
            id={`${form.slug}-published`}
            value={form.published ? "published" : "draft"}
            onChange={(event) => update("published", event.target.value === "published")}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Select>
        </Field>
      </div>

      <Field label="Summary" htmlFor={`${form.slug}-summary`}>
        <Textarea
          id={`${form.slug}-summary`}
          value={form.summary}
          maxLength={600}
          onChange={(event) => update("summary", event.target.value)}
        />
      </Field>

      <div>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Saving…" : "Save event"}
        </Button>
      </div>
    </form>
  );
}
