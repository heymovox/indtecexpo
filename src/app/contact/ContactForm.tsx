"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Field,
  FormAlert,
  Input,
  Select,
  Textarea,
} from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  contactFormSchema,
  flattenErrors,
} from "@/lib/validations";

const categories = [
  "Stall Booking",
  "Visitor Registration",
  "Sponsorship",
  "Media & Press",
  "General Enquiry",
  "Feedback",
];

const initialValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  category: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const setField = (name: keyof typeof initialValues, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setFormError(null);

    const payload = {
      ...values,
      consent: consent ? "on" : "",
    };

    const parsed = contactFormSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(flattenErrors(parsed.error));
      setFormError("Please correct the highlighted fields and try again.");
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const res = await fetch("/api/contact", {
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
            ? "We could not send your message just now. Please try again in a moment, or contact the team."
            : (data.message ?? "Something went wrong. Please try again."),
        );
        return;
      }

      router.push(
        `/thank-you?type=contact&ref=${encodeURIComponent(data.reference)}`,
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
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      {formError ? <FormAlert type="error">{formError}</FormAlert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full Name" htmlFor="name" required error={errors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="e.g. Anita Sharma"
            value={values.name}
            invalid={Boolean(errors.name)}
            onChange={(e) => setField("name", e.target.value)}
          />
        </Field>

        <Field label="Work Email" htmlFor="email" required error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={values.email}
            invalid={Boolean(errors.email)}
            onChange={(e) => setField("email", e.target.value)}
          />
        </Field>

        <Field label="Phone" htmlFor="phone" error={errors.phone} hint="Optional — for a faster response.">
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="e.g. 98450 12345"
            value={values.phone}
            invalid={Boolean(errors.phone)}
            onChange={(e) => setField("phone", e.target.value)}
          />
        </Field>

        <Field label="Company" htmlFor="company" error={errors.company} hint="Optional.">
          <Input
            id="company"
            name="company"
            autoComplete="organization"
            placeholder="e.g. Acme Engineering Pvt Ltd"
            value={values.company}
            invalid={Boolean(errors.company)}
            onChange={(e) => setField("company", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Enquiry Category" htmlFor="category" required error={errors.category}>
        <Select
          id="category"
          name="category"
          value={values.category}
          invalid={Boolean(errors.category)}
          onChange={(e) => setField("category", e.target.value)}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Subject" htmlFor="subject" required error={errors.subject}>
        <Input
          id="subject"
          name="subject"
          placeholder="e.g. Stall availability for Coimbatore edition"
          value={values.subject}
          invalid={Boolean(errors.subject)}
          onChange={(e) => setField("subject", e.target.value)}
        />
      </Field>

      <Field label="Message" htmlFor="message" required error={errors.message}>
        <Textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Tell us what you need — preferred edition, stall size, product category, or your question."
          value={values.message}
          invalid={Boolean(errors.message)}
          onChange={(e) => setField("message", e.target.value)}
        />
      </Field>

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
            I agree that Konnekt Globe may contact me about my enquiry and
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
        <Button type="submit" variant="primary" size="lg" disabled={pending} withArrow>
          {pending ? "Sending…" : "Send Message"}
        </Button>
        <p className="flex items-center gap-2 text-xs text-steel-500">
          <Icon name="clock" size={15} className="text-brand-600" />
          Response within one working day, Mon–Sat.
        </p>
      </div>
    </form>
  );
}
