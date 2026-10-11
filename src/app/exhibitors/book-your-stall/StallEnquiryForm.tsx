"use client";

import Image from "next/image";
import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/Form";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StallPlanPicker } from "@/components/exhibitors/StallPlanPicker";
import { contactConfig } from "@/config/site";
import { getSortedEvents } from "@/data/events";
import { getStallPlan } from "@/data/floorPlans";
import { industries, productCategories } from "@/data/industries";
import { cn } from "@/lib/utils";
import { exhibitorEnquirySchema, flattenErrors } from "@/lib/validations";
import { waLinkForEnquiry } from "@/lib/whatsapp";

type FormState = {
  eventSlugs: string[];
  /** Stall codes chosen on the interactive floor plan. */
  stallCodes: string[];
  companyName: string;
  contactPerson: string;
  designation: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  productCategory: string;
  stallSize: string;
  stalls: string;
  message: string;
};

type FieldErrors = Record<string, string | undefined>;

interface EnquiryResponse {
  ok?: boolean;
  reference?: string;
  errors?: FieldErrors;
  message?: string;
}

const events = getSortedEvents();

const steps: { label: string; short: string; icon: IconName }[] = [
  { label: "Choose Location", short: "Location", icon: "map-pin" },
  { label: "Review Floor Plan", short: "Floor Plan", icon: "map" },
  { label: "Your Details", short: "Details", icon: "building" },
  { label: "Stall Requirement", short: "Stall", icon: "stall" },
  { label: "Registration Done", short: "Done", icon: "check-circle" },
];

/* Step-scoped schemas — each Continue validates only the visible fields. */
const stepSchemas = [
  exhibitorEnquirySchema.pick({ eventSlugs: true }),
  null,
  exhibitorEnquirySchema.pick({
    companyName: true,
    contactPerson: true,
    designation: true,
    phone: true,
    email: true,
    website: true,
  }),
  exhibitorEnquirySchema.pick({
    industry: true,
    productCategory: true,
    stallSize: true,
    stalls: true,
    message: true,
    consent: true,
  }),
] as const;

const initialState: FormState = {
  eventSlugs: [],
  stallCodes: [],
  companyName: "",
  contactPerson: "",
  designation: "",
  phone: "",
  email: "",
  website: "",
  industry: "",
  productCategory: "",
  stallSize: "",
  stalls: "1",
  message: "",
};

const fallbackError = `We could not submit your enquiry. Please try again or call ${contactConfig.phones[0].display}.`;

const fieldId = (name: string) => `exhibitor-${name}`;

export function StallEnquiryForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState("");

  const selectedEvents = useMemo(
    () => events.filter((event) => form.eventSlugs.includes(event.slug)),
    [form.eventSlugs],
  );

  const stallSizeOptions = useMemo(() => {
    const names = new Set<string>();
    for (const event of selectedEvents) {
      for (const option of event.stallOptions) names.add(option.name);
    }
    // Fall back only when the selected editions publish no options; appending
    // unconditionally would duplicate an entry the data already provides.
    return names.size > 0 ? [...names] : ["Custom / Island"];
  }, [selectedEvents]);

  const planEvent =
    selectedEvents.find((event) => event.slug === activePlan) ?? selectedEvents[0];

  const plan = planEvent ? getStallPlan(planEvent.slug) : null;

  const update = (name: keyof FormState, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, eventSlugs: undefined, _form: undefined }));
    setFormError(null);
  };

  const toggleEvent = (slug: string) => {
    const next = form.eventSlugs.includes(slug)
      ? form.eventSlugs.filter((item) => item !== slug)
      : [...form.eventSlugs, slug];
    setForm((prev) => ({
      ...prev,
      eventSlugs: next,
      // Stall codes belong to a specific plan; drop them if that edition
      // is no longer selected.
      stallCodes: next.some((item) => getStallPlan(item)) ? prev.stallCodes : [],
    }));
    setErrors((prev) => ({ ...prev, eventSlugs: undefined }));
    setFormError(null);
    if (!next.includes(activePlan)) setActivePlan(next[0] ?? "");
  };

  const validateStep = (index: number): boolean => {
    const schema = stepSchemas[index];
    if (!schema) return true;
    const result = schema.safeParse({ ...form, consent: consent ? "on" : "" });
    if (result.success) {
      setErrors((prev) => ({ ...prev, _form: undefined }));
      return true;
    }
    const fieldErrors = flattenErrors(result.error);
    setErrors(fieldErrors);
    setFormError(
      index === 0
        ? "Select at least one expo location to continue."
        : "Please complete the highlighted fields to continue.",
    );
    const firstInvalid = Object.keys(fieldErrors).find((key) => Boolean(fieldErrors[key]));
    if (firstInvalid && firstInvalid !== "eventSlugs") {
      document.getElementById(fieldId(firstInvalid))?.focus();
    }
    return false;
  };

  const goTo = (next: number) => {
    setStep(next);
    setFormError(null);
  };

  const handleNext = () => {
    if (validateStep(step)) goTo(Math.min(step + 1, steps.length - 1));
  };

  const handleBack = () => goTo(Math.max(step - 1, 0));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateStep(3)) return;

    setErrors({});
    setSubmitting(true);
    setFormError(null);

    const payload = { ...form, consent: consent ? "on" : "" };

    try {
      const res = await fetch("/api/exhibitor-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: EnquiryResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors(data.errors ?? {});
        setFormError(data.message ?? fallbackError);
        return;
      }

      setReference(data.reference ?? "");
      goTo(steps.length - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError(fallbackError);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(initialState);
    setConsent(false);
    setErrors({});
    setFormError(null);
    setReference(null);
    setActivePlan("");
    setStep(0);
  };

  /* --------------------------------------------------------------- */
  /* Stepper                                                          */
  /* --------------------------------------------------------------- */
  const stepper = (
    <ol className="flex items-stretch gap-1.5 sm:gap-2">
      {steps.map((item, index) => {
        const state = index < step ? "done" : index === step ? "current" : "todo";
        return (
          <li key={item.label} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span
              className={cn(
                "h-1 w-full rounded-full transition-colors duration-300",
                state === "todo" ? "bg-steel-200" : "bg-brand-600",
                state === "current" && "bg-signal-500",
              )}
            />
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                className={cn(
                  "tabular flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-bold",
                  state === "done"
                    ? "bg-brand-600 text-white"
                    : state === "current"
                      ? "bg-signal-500 text-white"
                      : "bg-steel-100 text-steel-500",
                )}
              >
                {state === "done" ? <Icon name="check" size={11} strokeWidth={2.6} /> : index + 1}
              </span>
              <span
                className={cn(
                  "min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.1em] sm:text-[11px]",
                  state === "current" ? "text-navy-900" : "text-steel-400",
                )}
              >
                <span className="hidden xl:inline">{item.label}</span>
                <span className="hidden xl:hidden sm:inline">{item.short}</span>
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );

  /* --------------------------------------------------------------- */
  /* Step 0 — Event location                                         */
  /* --------------------------------------------------------------- */
  const stepLocation = (
    <div>
      <h3 className="display-sm text-lg text-navy-900">
        Which edition do you want to exhibit in?
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-steel-600">
        Select one location, or several to enquire across the full season. You
        will see the floor plan for each city you pick in the next step.
      </p>

      <fieldset className="mt-6" aria-invalid={Boolean(errors.eventSlugs)}>
        <legend className="sr-only">Select expo locations</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {events.map((event) => {
            const checked = form.eventSlugs.includes(event.slug);
            return (
              <label
                key={event.slug}
                className={cn(
                  "relative flex cursor-pointer gap-3.5 border p-4 transition",
                  checked
                    ? "border-brand-600 bg-brand-50"
                    : "border-steel-200 bg-white hover:border-brand-300",
                )}
              >
                <input
                  type="checkbox"
                  name="eventSlugs"
                  value={event.slug}
                  checked={checked}
                  onChange={() => toggleEvent(event.slug)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#0f5fbf]"
                />
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2">
                    <span className="display-sm text-base text-navy-900">
                      {event.city}
                    </span>
                    <span className="tabular text-[11px] font-semibold uppercase tracking-[0.12em] text-steel-500">
                      {event.dateRangeShort}
                    </span>
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-steel-600">
                    <Icon name="map-pin" size={13} className="shrink-0 text-brand-600" />
                    {event.venue.name}
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-steel-500">
                    {event.positioning} · {event.days} business days
                  </span>
                </span>
                {checked ? (
                  <span className="absolute right-3 top-3 text-brand-600">
                    <Icon name="check-circle" size={18} />
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
        {errors.eventSlugs ? (
          <span className="field-error">{errors.eventSlugs}</span>
        ) : null}
      </fieldset>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-steel-500">
        <Icon name="globe" size={14} className="mt-0.5 shrink-0 text-brand-600" />
        Multi-city bookings receive consolidated pricing and a single proforma
        across all selected editions.
      </p>
    </div>
  );

  /* --------------------------------------------------------------- */
  /* Step 1 — Floor plan                                             */
  /* --------------------------------------------------------------- */
  const stepFloorPlan = (
    <div>
      <h3 className="display-sm text-lg text-navy-900">
        Choose your {selectedEvents.length > 1 ? "preferred stalls" : "preferred stall"}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-steel-600">
        Tap the stalls you would like on the plan below. Your selection is recorded
        as a preference — our exhibitions team confirms availability, pricing and
        allocation when they contact you.
      </p>

      {selectedEvents.length > 1 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {selectedEvents.map((event) => (
            <button
              key={event.slug}
              type="button"
              onClick={() => setActivePlan(event.slug)}
              className={cn(
                "btn btn-sm",
                planEvent?.slug === event.slug
                  ? "btn-primary"
                  : "btn-outline",
              )}
            >
              {event.city}
            </button>
          ))}
        </div>
      ) : null}

      {planEvent ? (
        <div className="mt-5">
          {plan ? (
            <>
              <StallPlanPicker
                plan={plan}
                selected={form.stallCodes}
                onToggle={(code) =>
                  setForm((prev) => {
                    const has = prev.stallCodes.includes(code);
                    const next = has
                      ? prev.stallCodes.filter((item) => item !== code)
                      : [...prev.stallCodes, code];
                    return {
                      ...prev,
                      stallCodes: next,
                      // Keep the legacy stall count in step 3 aligned with the plan.
                      stalls: String(next.length || prev.stalls || "1"),
                    };
                  })
                }
                onReplace={(codes) =>
                  setForm((prev) => ({
                    ...prev,
                    stallCodes: codes,
                    stalls: String(codes.length || prev.stalls || "1"),
                  }))
                }
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-steel-500">
                <span>
                  {planEvent.venue.name} · {planEvent.venue.address}
                </span>
                <a
                  href={planEvent.floorPlanPdf}
                  className="link-underline font-semibold uppercase tracking-[0.12em] text-brand-600"
                  download
                >
                  Download PDF
                </a>
              </div>
            </>
          ) : (
            <figure className="min-w-0 border border-steel-200 bg-white p-3 sm:p-4">
              <Image
                src={planEvent.floorPlanImage}
                alt={`Floor plan of ${planEvent.name} at ${planEvent.venue.name}`}
                width={960}
                height={640}
                className="h-auto w-full"
                sizes="(max-width: 1024px) 100vw, 620px"
              />
              <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-steel-100 pt-3 text-xs text-steel-500">
                <span>
                  {planEvent.venue.name} · {planEvent.venue.address}
                </span>
                <a
                  href={planEvent.floorPlanPdf}
                  className="link-underline font-semibold uppercase tracking-[0.12em] text-brand-600"
                  download
                >
                  Download PDF
                </a>
              </figcaption>
            </figure>
          )}

          <div className="mt-5 overflow-x-auto border border-steel-200 bg-white">
            <table className="w-full min-w-[460px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-navy-900 text-white">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]">
                    Configuration
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]">
                    Size
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-100">
                {planEvent.stallOptions.map((option) => (
                  <tr key={option.id}>
                    <td className="px-4 py-3">
                      <span className="display-sm text-sm text-navy-900">
                        {option.name}
                      </span>
                    </td>
                    <td className="tabular px-4 py-3 text-steel-600">{option.size}</td>
                    <td className="tabular px-4 py-3 font-semibold text-navy-800">
                      {option.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {planEvent.sectors.map((sector) => (
              <span
                key={sector}
                className="border border-brand-100 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700"
              >
                {sector}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  /* --------------------------------------------------------------- */
  /* Step 2 — Company details                                        */
  /* --------------------------------------------------------------- */
  const stepDetails = (
    <div>
      <h3 className="display-sm text-lg text-navy-900">Tell us about your company</h3>
      <p className="mt-2 text-sm leading-relaxed text-steel-600">
        These details are used to issue your exhibitor ticket and to keep you
        updated on availability.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field
          label="Company name"
          htmlFor={fieldId("companyName")}
          required
          error={errors.companyName}
        >
          <Input
            id={fieldId("companyName")}
            name="companyName"
            autoComplete="organization"
            placeholder="Your company"
            value={form.companyName}
            onChange={(event) => update("companyName", event.target.value)}
            invalid={Boolean(errors.companyName)}
            required
          />
        </Field>

        <Field
          label="Contact person"
          htmlFor={fieldId("contactPerson")}
          required
          error={errors.contactPerson}
        >
          <Input
            id={fieldId("contactPerson")}
            name="contactPerson"
            autoComplete="name"
            placeholder="Full name"
            value={form.contactPerson}
            onChange={(event) => update("contactPerson", event.target.value)}
            invalid={Boolean(errors.contactPerson)}
            required
          />
        </Field>

        <Field
          label="Designation"
          htmlFor={fieldId("designation")}
          required
          error={errors.designation}
        >
          <Input
            id={fieldId("designation")}
            name="designation"
            autoComplete="organization-title"
            placeholder="Director, Purchase Head, Marketing…"
            value={form.designation}
            onChange={(event) => update("designation", event.target.value)}
            invalid={Boolean(errors.designation)}
            required
          />
        </Field>

        <Field label="Phone" htmlFor={fieldId("phone")} required error={errors.phone}>
          <Input
            id={fieldId("phone")}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91 XXXXX XXXXX"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            invalid={Boolean(errors.phone)}
            required
          />
        </Field>

        <Field label="Email" htmlFor={fieldId("email")} required error={errors.email}>
          <Input
            id={fieldId("email")}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            invalid={Boolean(errors.email)}
            required
          />
        </Field>

        <Field
          label="Website"
          htmlFor={fieldId("website")}
          hint="Optional"
          error={errors.website}
        >
          <Input
            id={fieldId("website")}
            name="website"
            type="text"
            autoComplete="url"
            placeholder="www.company.com"
            value={form.website}
            onChange={(event) => update("website", event.target.value)}
            invalid={Boolean(errors.website)}
          />
        </Field>
      </div>
    </div>
  );

  /* --------------------------------------------------------------- */
  /* Step 3 — Stall requirement                                      */
  /* --------------------------------------------------------------- */
  const stepStall = (
    <div>
      <h3 className="display-sm text-lg text-navy-900">
        Define your stall requirement
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-steel-600">
        Share the configuration you need. Our team confirms live availability,
        final pricing and the best aisle position for your product line.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field
          label="Stall size"
          htmlFor={fieldId("stallSize")}
          required
          error={errors.stallSize}
        >
          <Select
            id={fieldId("stallSize")}
            name="stallSize"
            value={form.stallSize}
            onChange={(event) => update("stallSize", event.target.value)}
            invalid={Boolean(errors.stallSize)}
            required
          >
            <option value="">Select a stall size</option>
            {stallSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Number of stalls"
          htmlFor={fieldId("stalls")}
          required
          hint="1 to 50 stalls"
          error={errors.stalls}
        >
          <Input
            id={fieldId("stalls")}
            name="stalls"
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            step={1}
            value={form.stalls}
            onChange={(event) => update("stalls", event.target.value)}
            invalid={Boolean(errors.stalls)}
            required
          />
        </Field>

        <Field
          label="Product category"
          htmlFor={fieldId("productCategory")}
          required
          error={errors.productCategory}
        >
          <Select
            id={fieldId("productCategory")}
            name="productCategory"
            value={form.productCategory}
            onChange={(event) => update("productCategory", event.target.value)}
            invalid={Boolean(errors.productCategory)}
            required
          >
            <option value="">Select a product category</option>
            {productCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Industry"
          htmlFor={fieldId("industry")}
          required
          error={errors.industry}
        >
          <Select
            id={fieldId("industry")}
            name="industry"
            value={form.industry}
            onChange={(event) => update("industry", event.target.value)}
            invalid={Boolean(errors.industry)}
            required
          >
            <option value="">Select an industry</option>
            {industries.map((industry) => (
              <option key={industry.id} value={industry.name}>
                {industry.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-5">
        <Field
          label="Message"
          htmlFor={fieldId("message")}
          hint="Optional — machinery requirements, power needs, corner preference or package details"
          error={errors.message}
        >
          <Textarea
            id={fieldId("message")}
            name="message"
            rows={4}
            maxLength={1000}
            placeholder="Tell us what you plan to exhibit and any stand requirements…"
            value={form.message}
            onChange={(event) => update("message", event.target.value)}
            invalid={Boolean(errors.message)}
          />
        </Field>
      </div>

      <div className="mt-5 border-t border-steel-100 pt-5">
        <label
          htmlFor="exhibitor-consent"
          className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-steel-600"
        >
          <input
            id="exhibitor-consent"
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked);
              setErrors((prev) => ({ ...prev, consent: undefined, _form: undefined }));
            }}
            className="mt-1 h-4 w-4 shrink-0 accent-[#e1251b]"
            required
          />
          <span>
            I consent to the INDTEC EXPO team contacting me about stall
            availability, pricing and exhibitor services. My details are used
            only to process this booking.
          </span>
        </label>
        {errors.consent ? (
          <span className="field-error">{errors.consent}</span>
        ) : null}
      </div>
    </div>
  );

  /* --------------------------------------------------------------- */
  /* Step 4 — Success                                                */
  /* --------------------------------------------------------------- */
  const stepSuccess = (
    <div className="text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center border border-success-500/30 bg-success-50 text-success-500">
        <Icon name="check-circle" size={30} strokeWidth={1.5} />
      </span>
      <span className="eyebrow eyebrow-dark mt-6 inline-flex">Registration Successful</span>
      <h3 className="display mt-4 text-[clamp(1.6rem,3.4vw,2.4rem)] text-navy-900">
        Your Stall Is Registered.
      </h3>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-steel-600 sm:text-base">
        Your enquiry on booking a stall has been registered with us. As soon as
        possible, our exhibitions team will contact you with availability,
        pricing and the proforma invoice.
      </p>

      {reference ? (
        <div className="mx-auto mt-7 inline-flex items-center gap-3 border border-brand-200 bg-brand-50 px-5 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-steel-500">
            Your Reference
          </span>
          <span className="display-sm tabular text-lg text-brand-700">{reference}</span>
        </div>
      ) : null}

      <dl className="mx-auto mt-8 grid max-w-2xl gap-px border border-steel-200 bg-steel-200 text-left sm:grid-cols-2">
        {[
          {
            label: "Expo location",
            value:
              selectedEvents.map((event) => `${event.city} (${event.dateRangeShort})`).join(", ") ||
              "—",
          },
          { label: "Venue", value: selectedEvents.map((event) => event.venue.name).join(", ") || "—" },
          ...(form.stallCodes.length > 0
            ? [
                {
                  label: "Selected stalls",
                  value: form.stallCodes.join(", "),
                },
              ]
            : []),
          { label: "Stall size", value: form.stallSize || "—" },
          { label: "No. of stalls", value: form.stalls },
          { label: "Product category", value: form.productCategory || "—" },
          { label: "Industry", value: form.industry || "—" },
          { label: "Company", value: form.companyName || "—" },
          { label: "Contact", value: `${form.contactPerson} · ${form.phone}` },
        ].map((row) => (
          <div key={row.label} className="bg-white px-4 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel-500">
              {row.label}
            </dt>
            <dd className="mt-1 text-sm text-navy-900">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/" variant="primary" size="lg" withArrow>
          Back to Home
        </Button>
        <Button
          href={waLinkForEnquiry(reference ?? "", form.companyName)}
          variant="outline"
          size="lg"
        >
          <Icon name="whatsapp" size={17} className="mr-1.5" />
          Follow Up on WhatsApp
        </Button>
        <Button href="/floor-plan" variant="gold" size="lg">
          View Floor Plan
        </Button>
      </div>

      <p className="mt-7 text-xs leading-relaxed text-steel-500">
        Need to add another city or change your stall configuration? Our team is
        available {contactConfig.hours} — quote your reference number.
      </p>

      <button
        type="button"
        onClick={reset}
        className="link-underline mt-5 inline-block text-xs font-semibold uppercase tracking-[0.14em] text-brand-600"
      >
        Start another booking
      </button>
    </div>
  );

  /* --------------------------------------------------------------- */
  /* Navigation                                                      */
  /* --------------------------------------------------------------- */
  const isLast = step === steps.length - 1;

  return (
    <div>
      {stepper}

      <div className="mt-8">{formError ? <FormAlert type="error">{formError}</FormAlert> : null}</div>

      {isLast ? (
        <div className="mt-2">{stepSuccess}</div>
      ) : (
        <form noValidate onSubmit={handleSubmit} className="mt-8">
          {step === 0 ? stepLocation : null}
          {step === 1 ? stepFloorPlan : null}
          {step === 2 ? stepDetails : null}
          {step === 3 ? stepStall : null}

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-steel-100 pt-6">
            {step > 0 ? (
              <Button type="button" variant="outline" size="lg" onClick={handleBack}>
                <Icon name="arrow-left" size={16} className="mr-1.5" />
                Back
              </Button>
            ) : null}

            {step < 3 ? (
              <Button type="button" variant="primary" size="lg" withArrow onClick={handleNext}>
                Continue
              </Button>
            ) : (
              <Button type="submit" variant="primary" size="lg" withArrow disabled={submitting}>
                {submitting ? "Submitting…" : "Register My Stall"}
              </Button>
            )}

            <span className="text-xs text-steel-500">
              Step {step + 1} of {steps.length} · {steps[step].label}
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
