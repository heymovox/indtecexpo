import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(10, "Enter a valid phone number")
  .max(15, "Enter a valid phone number")
  .regex(/^[+\d][\d\s-]{8,14}$/, "Enter a valid phone number");

const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || /^[+\d][\d\s-]{8,14}$/.test(value), {
    message: "Enter a valid phone number",
  });

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .regex(
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    "Enter a valid email address",
  );

const nameSchema = z
  .string()
  .trim()
  .min(2, "This field is required")
  .max(80, "This field is too long");

const companySchema = z
  .string()
  .trim()
  .min(2, "Company name is required")
  .max(120, "Company name is too long");

/**
 * Checkbox validators.
 *
 * `z.literal` is used rather than `z.string().refine()` because `.refine()`
 * never runs when the field is absent — the user then sees zod's raw
 * "expected string, received undefined" instead of the message written here.
 */
const consentSchema = z.literal("on", {
  error: "Please accept the privacy policy",
});

/**
 * Separate, explicit opt-in for WhatsApp messaging.
 *
 * This is deliberately not folded into the privacy-policy checkbox. The
 * WhatsApp Business Platform requires evidence of opt-in specific to the
 * channel, and messaging a number that has not agreed can get it blocked.
 */
const whatsappConsentSchema = z.literal("on", {
  error: "Please tick the WhatsApp box, or untick and we will email you instead",
});

export const waterRequirementSchema = z.enum([
  "",
  "Required",
  "Not required",
]);

export const sponsorshipInterestSchema = z.enum([
  "",
  "Title Sponsor",
  "Co Sponsor",
  "Royal Sponsor",
  "Not required",
]);

export const exhibitorEnquirySchema = z.object({
  eventSlugs: z
    .array(z.string())
    .min(1, "Select at least one expo location")
    .max(3, "Select up to 3 expo locations"),
  /** Stall positions picked from the interactive floor plan, e.g. ["B42", "K7"]. */
  stallCodes: z
    .array(z.string().max(12, "Stall code is too long"))
    .min(1, "Choose at least one stall position on the plan")
    .max(30, "Select up to 30 stalls"),
  companyName: companySchema,
  contactPerson: nameSchema,
  designation: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  website: z
    .string()
    .trim()
    .max(200, "Website is too long")
    .transform((value) => (value ? value.replace(/^https?:\/\//i, "") : "")),
  industry: z.string().min(1, "Select an industry"),
  productCategory: z.string().min(1, "Select a product category"),
  /** Derived from the selected stall codes rather than asked directly. */
  stallSize: z.string().max(200, "Stall size is too long").optional().default(""),
  /** Derived from the number of selected stall codes. */
  stalls: z.coerce.number().int().min(1).max(50).optional().default(1),

  /* Special requirements, captured in the final step. */
  /** Electrical load in kW, e.g. "15" or "15-20". */
  powerLoad: z
    .string()
    .trim()
    .max(20, "Power load is too long")
    .optional()
    .default(""),
  /** Machinery to be demonstrated, free text. */
  machinery: z
    .string()
    .trim()
    .max(1000, "Machinery details are too long")
    .optional()
    .default(""),
  water: waterRequirementSchema.optional().default(""),
  /** Branding needs: backdrop, signage, live branding, etc. */
  branding: z
    .string()
    .trim()
    .max(300, "Branding details are too long")
    .optional()
    .default(""),
  sponsorship: sponsorshipInterestSchema.optional().default(""),

  message: z
    .string()
    .trim()
    .max(1000, "Message is too long")
    .transform((value) => value ?? ""),
  consent: consentSchema,
  whatsappConsent: whatsappConsentSchema,
});

export type ExhibitorEnquiryInput = z.infer<typeof exhibitorEnquirySchema>;

export const visitorRegistrationSchema = z.object({
  fullName: nameSchema,
  companyName: companySchema,
  designation: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  city: z.string().min(2, "Select your city"),
  industry: z.string().min(1, "Select your industry"),
  interestedExpos: z
    .array(z.string())
    .min(1, "Select at least one expo")
    .max(3, "Select up to 3 expos"),
  /** e.g. ["Bengaluru · 24 Dec 2026 · 09:00 AM – 10:00 AM"]. */
  visitingSchedule: z
    .array(z.string().min(1).max(120, "Schedule entry is too long"))
    .min(1, "Choose at least one visiting date and time")
    .max(25, "Select up to 25 visiting times"),
  interests: z
    .array(z.string())
    .min(1, "Select at least one area of interest")
    .max(10, "Select up to 10 areas"),
  consent: consentSchema,
  whatsappConsent: whatsappConsentSchema,
});

export type VisitorRegistrationInput = z.infer<typeof visitorRegistrationSchema>;

export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: optionalPhoneSchema,
  company: z
    .string()
    .trim()
    .max(120)
    .transform((value) => value ?? ""),
  category: z.string().min(1, "Select a category"),
  subject: z
    .string()
    .trim()
    .min(4, "Add a short subject")
    .max(140, "Subject is too long"),
  message: z
    .string()
    .trim()
    .min(10, "Please tell us a bit more (10+ characters)")
    .max(2000, "Message is too long"),
  consent: consentSchema,
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

export const adminLoginSchema = z.object({
  email: z.string().trim().min(1, "Email is required"),
  password: z.string().min(6, "Minimum 6 characters"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const leadStageSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
]);

export const updateLeadSchema = z.object({
  id: z.string().min(1),
  stage: leadStageSchema,
  notes: z.string().max(2000).optional(),
});

export function flattenErrors(
  error: z.ZodError,
): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
