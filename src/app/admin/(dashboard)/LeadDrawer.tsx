"use client";

import { useEffect, useState, type FormEvent } from "react";
import { adminConfig } from "@/config/admin";
import { formatDateTime } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Select, Textarea } from "@/components/ui/Form";
import { StageChip } from "./StageChip";
import type { AdminLead, LeadKind } from "@/app/admin/lead-types";
import type { LeadStage } from "@/types/exhibitor";

interface SaveResponse {
  ok?: boolean;
  message?: string;
  lead?: AdminLead;
}

function labelFor(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

export function LeadDrawer({
  lead,
  onClose,
  onSaved,
}: {
  lead: AdminLead;
  onClose: () => void;
  onSaved: (lead: AdminLead) => void;
}) {
  const [stage, setStage] = useState<LeadStage>(lead.stage);
  const [notes, setNotes] = useState(lead.notes);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const kind = lead.type.toLowerCase() as LeadKind;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, notes, type: kind }),
      });
      const data = (await response.json().catch(() => null)) as SaveResponse | null;
      if (!response.ok || !data?.ok) {
        setMessage({
          type: "error",
          text: data?.message ?? "Could not save changes. Please try again.",
        });
        setSaving(false);
        return;
      }
      const updated = data.lead ?? { ...lead, stage, notes };
      onSaved(updated);
      setMessage({ type: "success", text: "Lead updated." });
    } catch {
      setMessage({
        type: "error",
        text: "Could not reach the server. Please try again.",
      });
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Lead ${lead.reference}`}>
      <button
        type="button"
        aria-label="Close lead details"
        onClick={onClose}
        className="absolute inset-0 bg-navy-950/55"
      />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-steel-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="font-mono text-xs text-steel-500">{lead.reference}</p>
            <h3 className="display-sm mt-1 truncate text-lg text-navy-900">
              {lead.title}
            </h3>
            <p className="mt-1 text-sm text-steel-600">{lead.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close lead details"
            className="shrink-0 border border-steel-200 p-2 text-steel-500 transition hover:text-navy-900"
          >
            <Icon name="close" size={16} />
          </button>
        </header>

        <div className="flex flex-col gap-6 px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <StageChip stage={lead.stage} />
            <span className="border border-steel-200 bg-steel-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-steel-600">
              {lead.type}
            </span>
            <span className="text-xs text-steel-500">
              Received {formatDateTime(lead.createdAt)}
            </span>
          </div>

          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 border-t border-steel-100 pt-4 sm:grid-cols-2">
            {Object.entries(lead.fields).map(([key, value]) => {
              const text = Array.isArray(value) ? value.join(", ") : String(value);
              const isEmail = key === "email";
              const isPhone = key === "phone";
              const isLink = (isEmail || isPhone) && text.trim().length > 0;
              return (
                <div key={key} className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-steel-500">
                    {labelFor(key)}
                  </dt>
                  <dd className="mt-0.5 break-words text-sm text-navy-900">
                    {text.length === 0 ? (
                      <span className="text-steel-400">—</span>
                    ) : isLink ? (
                      <a
                        href={isEmail ? `mailto:${text}` : `tel:${text.replace(/[^\d+]/g, "")}`}
                        className="text-brand-700 underline-offset-2 hover:underline"
                      >
                        {text}
                      </a>
                    ) : (
                      text
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>

          <form onSubmit={handleSave} className="flex flex-col gap-4 border-t border-steel-100 pt-4">
            {message ? <FormAlert type={message.type}>{message.text}</FormAlert> : null}

            <Field label="Stage" htmlFor={`stage-${lead.id}`}>
              <Select
                id={`stage-${lead.id}`}
                value={stage}
                onChange={(event) => setStage(event.target.value as LeadStage)}
              >
                {adminConfig.kanbanColumns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Internal notes"
              htmlFor={`notes-${lead.id}`}
              hint="Only visible to the admin team."
            >
              <Textarea
                id={`notes-${lead.id}`}
                value={notes}
                maxLength={2000}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Follow-up call done…"
              />
            </Field>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
