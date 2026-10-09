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

const consentSchema = z.string().refine((value) => value === "on", {
  message: "Please accept the privacy policy",
});

export const exhibitorEnquirySchema = z.object({
  eventSlugs: z
    .array(z.string())
    .min(1, "Select at least one expo location")
    .max(3, "Select up to 3 expo locations"),
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
  stallSize: z.string().min(1, "Select a stall size"),
  stalls: z.coerce
    .number()
    .int("Enter a whole number of stalls")
    .min(1, "Minimum 1 stall")
    .max(50, "Maximum 50 stalls"),
  message: z
    .string()
    .trim()
    .max(1000, "Message is too long")
    .transform((value) => value ?? ""),
  consent: consentSchema,
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
  interests: z
    .array(z.string())
    .min(1, "Select at least one area of interest")
    .max(10, "Select up to 10 areas"),
  consent: consentSchema,
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
