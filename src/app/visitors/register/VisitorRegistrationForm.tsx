"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckboxGroup,
  Field,
  FormAlert,
  Input,
  Select,
} from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { industries, interestAreas } from "@/data/industries";
import {
  flattenErrors,
  visitorRegistrationSchema,
} from "@/lib/validations";
import {
  formatVisitEntry,
  MAX_VISIT_SLOTS,
  parseSlotKey,
  sortSlotKeys,
} from "@/lib/visit-slots";
import type { ExpoEvent } from "@/types/event";
import { VisitSchedule } from "./VisitSchedule";

const southIndianCities = [
  "Bengaluru",
  "Mysuru",
  "Mangaluru",
  "Belagavi",
  "Tumakuru",
  "Hosur",
  "Chennai",
  "Coimbatore",
  "Tiruchirappalli",
  "Tiruppur",
  "Salem",
  "Erode",
  "Madurai",
  "Hyderabad",
  "Vijayawada",
  "Visakhapatnam",
  "Kochi",
  "Thiruvananthapuram",
  "Other South Indian City",
];

const expoLabel = (event: ExpoEvent) =>
  `${event.city} — ${event.dateRangeShort}`;

type FormState = {
  fullName: string;
  companyName: string;
  designation: string;
  email: string;
  phone: string;
  city: string;
  industry: string;
};

const initialState: FormState = {
  fullName: "",
  companyName: "",
  designation: "",
  email: "",
  phone: "",
  city: "",
  industry: "",
};

/**
 * `events` arrives resolved from the server page, so the edition picker shows
 * the dates, labels and venues exactly as they are saved in the dashboard.
 */
export function VisitorRegistrationForm({ events }: { events: ExpoEvent[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [selectedExpos, setSelectedExpos] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const setField = (name: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggle = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    max: number,
  ) => {
    setter((prev) => {
      if (prev.includes(value)) return prev.filter((item) => item !== value);
      if (prev.length >= max) return prev;
      return [...prev, value];
    });
  };

  const toggleExpo = (slug: string) => {
    if (selectedExpos.includes(slug)) {
      setSelectedExpos((prev) => prev.filter((item) => item !== slug));
      setSlots((prev) => prev.filter((key) => !key.startsWith(`${slug}|`)));
    } else {
      setSelectedExpos((prev) => [...prev, slug]);
    }
  };

  const toggleSlot = (key: string) => {
    setSlots((prev) => {
      if (prev.includes(key)) return prev.filter((item) => item !== key);
      if (prev.length >= MAX_VISIT_SLOTS) return prev;
      return [...prev, key];
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setFormError(null);

    const chosenEvents = events.filter((item) =>
      selectedExpos.includes(item.slug),
    );

    const missingSchedule = chosenEvents.filter(
      (item) => !slots.some((key) => key.startsWith(`${item.slug}|`)),
    );
    if (missingSchedule.length > 0) {
      setErrors({
        visitingSchedule: `Pick at least one visiting date and time for ${missingSchedule
          .map((item) => item.city)
          .join(", ")}.`,
      });
      setFormError(
        "Please choose a visiting date and time for every expo you selected.",
      );
      return;
    }

    const interestedExpos = chosenEvents.map(expoLabel);
    const visitingSchedule = sortSlotKeys(slots, events).map((key) => {
      const parsed = parseSlotKey(key);
      const item = parsed
        ? events.find((candidate) => candidate.slug === parsed.slug)
        : undefined;
      return item && parsed
        ? formatVisitEntry(item.city, parsed.day, parsed.hour)
        : key;
    });

    const payload = {
      ...form,
      interestedExpos,
      visitingSchedule,
interests,
      consent: consent ? "on" : "",
      whatsappConsent: whatsappConsent ? "on" : "",
    };

    const parsed = visitorRegistrationSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(flattenErrors(parsed.error));
      setFormError("Please correct the highlighted fields and try again.");
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const res = await fetch("/api/visitor-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors(data.errors ?? {});
        // A 5xx message ("Something went wrong") gives the visitor nothing to
        // act on, so point them at a human instead.
        setFormError(
          res.status >= 500
            ? "We could not submit your registration just now. Please try again in a moment, or contact the team."
            : (data.message ?? "Something went wrong. Please try again."),
        );
        return;
      }

      router.push(
        `/thank-you?type=visitor&ref=${encodeURIComponent(data.reference)}`,
      );
    } catch {
      setFormError(
        "We could not reach the server. Please check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {formError ? <FormAlert type="error">{formError}</FormAlert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full Name" htmlFor="fullName" required error={errors.fullName}>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            placeholder="e.g. Rajesh Kumar"
            value={form.fullName}
            invalid={Boolean(errors.fullName)}
            onChange={(e) => setField("fullName", e.target.value)}
          />
        </Field>

        <Field label="Company Name" htmlFor="companyName" required error={errors.companyName}>
          <Input
            id="companyName"
            name="companyName"
            autoComplete="organization"
            placeholder="e.g. Precision Tools India Pvt Ltd"
            value={form.companyName}
            invalid={Boolean(errors.companyName)}
            onChange={(e) => setField("companyName", e.target.value)}
          />
        </Field>

        <Field label="Designation" htmlFor="designation" required error={errors.designation}>
          <Input
            id="designation"
            name="designation"
            autoComplete="organization-title"
            placeholder="e.g. Purchase Manager"
            value={form.designation}
            invalid={Boolean(errors.designation)}
            onChange={(e) => setField("designation", e.target.value)}
          />
        </Field>

        <Field label="Work Email" htmlFor="email" required error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={form.email}
            invalid={Boolean(errors.email)}
            onChange={(e) => setField("email", e.target.value)}
          />
        </Field>

        <Field
          label="Phone / WhatsApp"
          htmlFor="phone"
          required
          error={errors.phone}
          hint="Include the country code if outside India."
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="e.g. 98450 12345"
            value={form.phone}
            invalid={Boolean(errors.phone)}
            onChange={(e) => setField("phone", e.target.value)}
          />
        </Field>

        <Field label="City" htmlFor="city" required error={errors.city}>
          <Select
            id="city"
            name="city"
            value={form.city}
            invalid={Boolean(errors.city)}
            onChange={(e) => setField("city", e.target.value)}
          >
            <option value="">Select your city</option>
            {southIndianCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Industry" htmlFor="industry" required error={errors.industry}>
        <Select
          id="industry"
          name="industry"
          value={form.industry}
          invalid={Boolean(errors.industry)}
          onChange={(e) => setField("industry", e.target.value)}
        >
          <option value="">Select your industry</option>
          {industries.map((industry) => (
            <option key={industry.id} value={industry.name}>
              {industry.name}
            </option>
          ))}
          <option value="Other">Other</option>
        </Select>
      </Field>

      <VisitSchedule
        events={events}
        selectedExpos={selectedExpos}
        slots={slots}
        onToggleExpo={toggleExpo}
        onToggleSlot={toggleSlot}
        expoError={errors.interestedExpos}
        scheduleError={errors.visitingSchedule}
      />

      <CheckboxGroup
        legend="Areas of Interest"
        name="interests"
        options={interestAreas}
        selected={interests}
        onToggle={(value) => toggle(value, setInterests, 10)}
        error={errors.interests}
        columns={3}
      />

      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-steel-600">
          <input
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#0f5fbf]"
          />
          <span>
            I agree that Konnekt Globe may contact me about INDTEC EXPO and
            process my data as described in the{" "}
            <Link href="/privacy-policy" className="link-underline font-semibold text-brand-600">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.consent ? <span className="field-error">{errors.consent}</span> : null}
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-steel-600">
          <input
            type="checkbox"
            name="whatsappConsent"
            checked={whatsappConsent}
            onChange={(e) => {
              setWhatsappConsent(e.target.checked);
              setErrors((prev) => ({
                ...prev,
                whatsappConsent: undefined,
              }));
            }}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#0f5fbf]"
          />
          <span>
            Send my registration confirmation and expo updates on WhatsApp.
            Required, because your confirmation and e-pass are issued on this
            channel. You can opt out any time from any message we send.
          </span>
        </label>
        {errors.whatsappConsent ? (
          <span className="field-error">{errors.whatsappConsent}</span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-steel-100 pt-6">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={pending}
          withArrow
          className="w-full sm:w-auto"
        >
          {pending ? "Submitting…" : "Complete Registration"}
        </Button>
        <p className="flex items-center gap-2 text-xs text-steel-500">
          <Icon name="shield" size={15} className="text-success-500" />
          Free for trade visitors. Response within one working day.
        </p>
      </div>
    </form>
  );
}
