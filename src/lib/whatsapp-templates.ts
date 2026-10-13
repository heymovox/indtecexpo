import "server-only";

/**
 * Meta WhatsApp message template definitions.
 *
 * Meta matches a send against a template by exact name and exact body text.
 * These bodies are therefore the source of truth for what gets pasted into
 * WhatsApp Manager -> Message templates. Category UTILITY is the correct
 * classification for transactional receipts: approval is usually minutes, and
 * it is billed in the lower "utility" rate.
 *
 * {{1}}..{{n}} are positional and are filled from `params` in order. The order
 * here MUST match the order in which parameters are supplied at send time.
 */

export const WHATSAPP_TEMPLATE_NAMES = {
  visitorReceipt: "indtec_visitor_receipt",
  exhibitorReceipt: "indtec_exhibitor_receipt",
} as const;

export type WhatsAppTemplateName =
  (typeof WHATSAPP_TEMPLATE_NAMES)[keyof typeof WHATSAPP_TEMPLATE_NAMES];

export interface TemplateDefinition {
  name: WhatsAppTemplateName;
  category: "UTILITY";
  language: string;
  /** Paste this verbatim into Meta's template body field. */
  body: string;
  /** Count and order of {{n}} placeholders. */
  parameters: string[];
}

export const WHATSAPP_TEMPLATES: Record<
  WhatsAppTemplateName,
  TemplateDefinition
> = {
  [WHATSAPP_TEMPLATE_NAMES.visitorReceipt]: {
    name: WHATSAPP_TEMPLATE_NAMES.visitorReceipt,
    category: "UTILITY",
    language: "en",
    parameters: ["name", "reference", "editions", "nextStep"],
    body: [
      "Hi {{1}}, thank you for registering to visit INDTEC EXPO.",
      "",
      "Reference: {{2}}",
      "Editions: {{3}}",
      "",
      "{{4}}",
      "",
      "Please carry a photo ID. Entry is free for trade visitors.",
      "Reference the number above if you need to reach the visitor desk.",
      "",
      "Konnekt Globe — INDTEC EXPO 2026-2027",
    ].join("\n"),
  },
  [WHATSAPP_TEMPLATE_NAMES.exhibitorReceipt]: {
    name: WHATSAPP_TEMPLATE_NAMES.exhibitorReceipt,
    category: "UTILITY",
    language: "en",
    parameters: ["contact", "reference", "summary", "nextStep"],
    body: [
      "Hi {{1}}, thank you for your interest in exhibiting at INDTEC EXPO.",
      "",
      "Reference: {{2}}",
      "Enquiry: {{3}}",
      "",
      "{{4}}",
      "",
      "Your stall preference is recorded, not held. The position is confirmed",
      "once you accept the proforma invoice.",
      "",
      "Konnekt Globe — INDTEC EXPO 2026-2027",
    ].join("\n"),
  },
};

/** Flattens an edition summary into one compact line for a template body. */
export function formatEditions(
  events: { city: string; dates: string }[],
  fallback: string,
): string {
  if (!events.length) return fallback;
  return events.map((event) => `${event.city} (${event.dates})`).join(", ");
}

/**
 * Guards against Meta's 1024-character body limit after substitution.
 * Returns null when the message fits, or the rendered body when it does not.
 */
export function assertTemplateFits(
  template: TemplateDefinition,
  params: string[],
): null | { length: number; body: string } {
  let body = template.body;
  params.forEach((value, index) => {
    body = body.replace(`{{${index + 1}}}`, value ?? "");
  });
  return body.length <= 1024 ? null : { length: body.length, body };
}