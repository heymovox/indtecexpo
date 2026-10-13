"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/Form";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StallPlanPicker } from "@/components/exhibitors/StallPlanPicker";
import { contactConfig } from "@/config/site";
import { getSortedEvents } from "@/data/events";
import { getStallPlan, getStallType } from "@/data/floorPlans";
import { industries, productCategories } from "@/data/industries";
import { cn } from "@/lib/utils";
import { exhibitorEnquirySchema, flattenErrors } from "@/lib/validations";
import { waLinkForEnquiry } from "@/lib/whatsapp";

type FormState = {
  companyName: string;
  contactPerson: string;
  designation: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  productCategory: string;
  eventSlugs: string[];
  /** Stall positions chosen on the interactive floor plan. */
  stallCodes: string[];
  powerLoad: string;
  machinery: string;
  water: string;
  branding: string;
  sponsorship: string;
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
  { label: "Company & Contact", short: "Details", icon: "building" },
  { label: "Event Location", short: "Location", icon: "map-pin" },
  { label: "Stall Position", short: "Position", icon: "map" },
  { label: "Special Requirements", short: "Needs", icon: "list" },
  { label: "Registration Done", short: "Done", icon: "check-circle" },
];

/* Step-scoped schemas — each Continue validates only the visible fields. */
const stepSchemas = [
  exhibitorEnquirySchema.pick({
    companyName: true,
    contactPerson: true,
    designation: true,
    phone: true,
    email: true,
    website: true,
    industry: true,
    productCategory: true,
  }),
  exhibitorEnquirySchema.pick({ eventSlugs: true }),
  exhibitorEnquirySchema.pick({ stallCodes: true }),
  exhibitorEnquirySchema.pick({
    powerLoad: true,
    machinery: true,
    water: true,
    branding: true,
    sponsorship: true,
    message: true,
    consent: true,
  }),
] as const;

const initialState: FormState = {
  companyName: "",
  contactPerson: "",
  designation: "",
  phone: "",
  email: "",
  website: "",
  industry: "",
  productCategory: "",
  eventSlugs: [],
  stallCodes: [],
  powerLoad: "",
  machinery: "",
  water: "",
  branding: "",
  sponsorship: "",
  message: "",
};

const fallbackError = `We could not submit your enquiry. Please try again or call ${contactConfig.phones[0].display}.`;

const waterOptions = ["Required", "Not required"];
const sponsorshipOptions = [
  "Title Sponsor",
  "Co Sponsor",
  "Royal Sponsor",
  "Not required",
];

const fieldId = (name: string) => `exhibitor-${name}`;

/**
 * `initialEvent` lets a card on another page deep-link straight into this form
 * with that edition already ticked, e.g.
 * /exhibitors/book-your-stall?event=bengaluru
 */
export function StallEnquiryForm({ initialEvent }: { initialEvent?: string }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    ...initialState,
    eventSlugs:
      initialEvent && events.some((event) => event.slug === initialEvent)
        ? [initialEvent]
        : initialState.eventSlugs,
  });
  const [consent, setConsent] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState("");

  const selectedEvents = useMemo(
    () => events.filter((event) => form.eventSlugs.includes(event.slug)),
    [form.eventSlugs],
  );

  const planEvent =
    selectedEvents.find((event) => event.slug === activePlan) ?? selectedEvents[0];

  const plan = planEvent ? getStallPlan(planEvent.slug) : null;

  /**
   * Stall size and count are derived from the positions picked on the plan
   * rather than asked separately, so the two can never disagree.
   */
  const derivedStallSize = useMemo(() => {
    if (!plan || form.stallCodes.length === 0) return "";
    const names = new Set<string>();
    for (const code of form.stallCodes) {
      const type = getStallType(plan, code);
      if (type) names.add(type.name);
    }
    return [...names].join(", ");
  }, [plan, form.stallCodes]);

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
    const result = schema.safeParse({
      ...form,
      consent: consent ? "on" : "",
      whatsappConsent: whatsappConsent ? "on" : "",
    });
    if (result.success) {
      setErrors((prev) => ({ ...prev, _form: undefined }));
      return true;
    }
    const fieldErrors = flattenErrors(result.error);
    setErrors(fieldErrors);
    setFormError(
      index === 2
        ? "Choose at least one stall position on the plan to continue."
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

    const payload = {
      ...form,
      stallSize: derivedStallSize,
      stalls: String(form.stallCodes.length || 1),
      consent: consent ? "on" : "",
      whatsappConsent: whatsappConsent ? "on" : "",
    };

    try {
      const res = await fetch("/api/exhibitor-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: EnquiryResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors(data.errors ?? {});
        // For validation failures (4xx) the server's field errors are useful.
        // For server failures (5xx) the generic "Something went wrong" tells
        // the visitor nothing actionable, so surface the contact route instead.
        setFormError(res.status >= 500 ? fallbackError : (data.message ?? fallbackError));
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
    setWhatsappConsent(false);
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
                  className="mt-1 h-5 w-5 shrink-0 accent-[#0f5fbf]"
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="display-sm text-base text-navy-900">
                      {event.city}
                    </span>
                    <span className="tabular text-[11px] font-semibold uppercase tracking-[0.12em] text-steel-500">
                      {event.dateRangeShort}
                    </span>
                  </span>
                  <span className="mt-1 flex items-start gap-1.5 text-xs text-steel-600">
                    <Icon name="map-pin" size={13} className="mt-0.5 shrink-0 text-brand-600" />
                    <span className="min-w-0">{event.venue.name}</span>
                  </span>
                  {/* Indented to match the venue text so the card reads as one
                      aligned column rather than a ragged left edge. */}
                  <span className="mt-2 block pl-[19px] text-xs leading-relaxed text-steel-500">
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
          {/* Every edition has a plan, so there is no static-image fallback:
              the plan is shown rather than offered as a download. */}
          {plan ? (
            <StallPlanPicker
              plan={plan}
              selected={form.stallCodes}
              onToggle={(code) =>
                setForm((prev) => {
                  const has = prev.stallCodes.includes(code);
                  const next = has
                    ? prev.stallCodes.filter((item) => item !== code)
                    : [...prev.stallCodes, code];
                  return { ...prev, stallCodes: next };
                })
              }
              onReplace={(codes) =>
                setForm((prev) => ({ ...prev, stallCodes: codes }))
              }
            />
          ) : null}

          <p className="mt-4 text-xs text-steel-500">
            {planEvent.venue.name} · {planEvent.venue.address}
          </p>

          <div className="mt-5 overflow-x-auto border border-steel-200 bg-white">
            {/* No min-width: the three columns compress to fit any phone so
                the Price column is never pushed off screen. */}
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <thead>
                <tr className="bg-navy-900 text-white">
                  <th className="w-[42%] px-2 py-3 text-[9px] font-semibold uppercase leading-tight tracking-[0.06em] sm:px-4 sm:text-[11px] sm:tracking-[0.14em]">
                    Configuration
                  </th>
                  <th className="w-[24%] px-2 py-3 text-[9px] font-semibold uppercase leading-tight tracking-[0.06em] sm:px-4 sm:text-[11px] sm:tracking-[0.14em]">
                    Size
                  </th>
                  <th className="w-[34%] px-2 py-3 text-[9px] font-semibold uppercase leading-tight tracking-[0.06em] sm:px-4 sm:text-[11px] sm:tracking-[0.14em]">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-100">
                {planEvent.stallOptions.map((option) => (
                  <tr key={option.id}>
                    <td className="px-2 py-3 sm:px-4">
                      <span className="display-sm text-[11px] text-navy-900 sm:text-sm">
                        {option.name}
                      </span>
                    </td>
                    <td className="tabular px-2 py-3 text-[11px] text-steel-600 sm:px-4 sm:text-sm">
                      {option.size}
                    </td>
                    <td className="tabular px-2 py-3 text-[11px] font-semibold text-navy-800 sm:px-4 sm:text-sm">
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
            <option value="Other">Other</option>
          </Select>
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
            <option value="Other">Other</option>
          </Select>
        </Field>
      </div>
    </div>
  );

  /* --------------------------------------------------------------- */
  /* Step 3 — Special requirements                                   */
  /* --------------------------------------------------------------- */
  const stepSpecial = (
    <div>
      <h3 className="display-sm text-lg text-navy-900">
        Any special requirements?
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-steel-600">
        Tell us what your stand needs so our production team can plan power,
        water and rigging. Everything here is optional.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field
          label="Power load"
          htmlFor={fieldId("powerLoad")}
          hint="Optional — approximate load in kW"
          error={errors.powerLoad}
        >
          <Input
            id={fieldId("powerLoad")}
            name="powerLoad"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 15 or 15-20"
            value={form.powerLoad}
            onChange={(event) => update("powerLoad", event.target.value)}
            invalid={Boolean(errors.powerLoad)}
          />
        </Field>

        <Field
          label="Water supply"
          htmlFor={fieldId("water")}
          hint="Optional"
          error={errors.water}
        >
          <Select
            id={fieldId("water")}
            name="water"
            value={form.water}
            onChange={(event) => update("water", event.target.value)}
            invalid={Boolean(errors.water)}
          >
            <option value="">Select</option>
            {waterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Sponsorship"
          htmlFor={fieldId("sponsorship")}
          hint="Optional"
          error={errors.sponsorship}
        >
          <Select
            id={fieldId("sponsorship")}
            name="sponsorship"
            value={form.sponsorship}
            onChange={(event) => update("sponsorship", event.target.value)}
            invalid={Boolean(errors.sponsorship)}
          >
            <option value="">Select</option>
            {sponsorshipOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Branding"
          htmlFor={fieldId("branding")}
          hint="Optional — backdrop, signage or live branding"
          error={errors.branding}
        >
          <Input
            id={fieldId("branding")}
            name="branding"
            type="text"
            maxLength={300}
            placeholder="e.g. 3 m backwall with logo"
            value={form.branding}
            onChange={(event) => update("branding", event.target.value)}
            invalid={Boolean(errors.branding)}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field
          label="Machinery to be demonstrated"
          htmlFor={fieldId("machinery")}
          hint="Optional — machine names, dimensions and weight"
          error={errors.machinery}
        >
          <Textarea
            id={fieldId("machinery")}
            name="machinery"
            rows={3}
            maxLength={1000}
            placeholder="e.g. 1 × CNC machining centre, 4.2 m × 2.6 m, approx. 6 tonnes"
            value={form.machinery}
            onChange={(event) => update("machinery", event.target.value)}
            invalid={Boolean(errors.machinery)}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field
          label="Anything else"
          htmlFor={fieldId("message")}
          hint="Optional"
          error={errors.message}
        >
          <Textarea
            id={fieldId("message")}
            name="message"
            rows={3}
            maxLength={1000}
            placeholder="Corner preference, rigging, accessibility or any other note…"
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
            only to process this booking as described in the{" "}
            <Link href="/terms#stall-bookings" className="link-underline font-semibold text-brand-600">
              Stall Booking Policy
            </Link>
            .
          </span>
        </label>
        {errors.consent ? (
          <span className="field-error">{errors.consent}</span>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="exhibitor-whatsapp-consent"
          className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-steel-600"
        >
          <input
            id="exhibitor-whatsapp-consent"
            name="whatsappConsent"
            type="checkbox"
            checked={whatsappConsent}
            onChange={(event) => {
              setWhatsappConsent(event.target.checked);
              setErrors((prev) => ({
                ...prev,
                whatsappConsent: undefined,
                _form: undefined,
              }));
            }}
            className="mt-1 h-4 w-4 shrink-0 accent-[#e1251b]"
            required
          />
          <span>
            Send my enquiry confirmation and availability updates on WhatsApp.
            Required, because your proforma and booking updates are issued on
            this channel. You can opt out any time from any message we send.
          </span>
        </label>
        {errors.whatsappConsent ? (
          <span className="field-error">{errors.whatsappConsent}</span>
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
          { label: "Stall size", value: derivedStallSize || "—" },
          { label: "No. of stalls", value: String(form.stallCodes.length || 1) },
          { label: "Product category", value: form.productCategory || "—" },
          { label: "Industry", value: form.industry || "—" },
          { label: "Company", value: form.companyName || "—" },
          { label: "Contact", value: `${form.contactPerson} · ${form.phone}` },
          ...(form.powerLoad ? [{ label: "Power load", value: `${form.powerLoad} kW` }] : []),
          ...(form.water ? [{ label: "Water", value: form.water }] : []),
          ...(form.sponsorship ? [{ label: "Sponsorship", value: form.sponsorship }] : []),
          ...(form.branding ? [{ label: "Branding", value: form.branding }] : []),
          ...(form.machinery ? [{ label: "Machinery", value: form.machinery }] : []),
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
          {step === 0 ? stepDetails : null}
          {step === 1 ? stepLocation : null}
          {step === 2 ? stepFloorPlan : null}
          {step === 3 ? stepSpecial : null}

          <div className="mt-8 flex flex-col gap-3 border-t border-steel-100 pt-6 sm:flex-row sm:flex-wrap sm:items-center">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={handleBack}
              >
                <Icon name="arrow-left" size={16} className="mr-1.5" />
                Back
              </Button>
            ) : null}

            {step < 3 ? (
              <Button
                type="button"
                variant="primary"
                size="lg"
                withArrow
                className="w-full sm:w-auto"
                onClick={handleNext}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="lg"
                withArrow
                className="w-full sm:w-auto"
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Register My Stall"}
              </Button>
            )}

            <span className="text-center text-xs text-steel-500 sm:ml-auto sm:text-left">
              Step {step + 1} of {steps.length} · {steps[step].label}
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
