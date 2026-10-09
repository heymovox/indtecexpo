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
import { events } from "@/data/events";
import { industries, interestAreas } from "@/data/industries";
import {
  flattenErrors,
  visitorRegistrationSchema,
} from "@/lib/validations";

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

const expoOptions = events.map((event) => `${event.city} — ${event.dateRangeShort}`);

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

export function VisitorRegistrationForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [interestedExpos, setInterestedExpos] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setFormError(null);

    const payload = {
      ...form,
      interestedExpos,
      interests,
      consent: consent ? "on" : "",
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
        setFormError(data.message ?? "Something went wrong. Please try again.");
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
        </Select>
      </Field>

      <CheckboxGroup
        legend="Expos You Plan to Visit"
        name="interestedExpos"
        options={expoOptions}
        selected={interestedExpos}
        onToggle={(value) => toggle(value, setInterestedExpos, 3)}
        error={errors.interestedExpos}
        columns={1}
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
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#0f5fbf]"
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
