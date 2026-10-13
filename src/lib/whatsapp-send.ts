import "server-only";

/**
 * Outbound WhatsApp via the Meta WhatsApp Business Cloud API.
 *
 * Kept apart from `lib/whatsapp.ts`, which is imported by client components to
 * build wa.me links and therefore must stay free of "server-only".
 */

import {
  isWhatsAppConfigured,
  maskPhone,
  toE164,
  whatsappAccessToken,
  whatsappApiVersion,
  whatsappPhoneNumberId,
} from "@/lib/whatsapp-config";
import {
  WHATSAPP_TEMPLATES,
  formatEditions,
  type WhatsAppTemplateName,
} from "@/lib/whatsapp-templates";

export interface WhatsAppSendResult {
  delivered: boolean;
  /**
   * sent | skipped-unconfigured | skipped-consent | skipped-invalid-number |
   * error
   */
  outcome:
    | "sent"
    | "skipped-unconfigured"
    | "skipped-consent"
    | "skipped-invalid-number"
    | "error";
  detail?: string;
  /** E.164 recipient, present whenever the number parsed. */
  to?: string;
}

interface TemplateSend {
  to: string;
  template: WhatsAppTemplateName;
  params: string[];
}

/** Renders the body the way Meta would, for logging when unconfigured. */
function preview(templateName: WhatsAppTemplateName, params: string[]): string {
  return WHATSAPP_TEMPLATES[templateName].body.replace(
    /\{\{(\d)\}\}/g,
    (_, index) => params[Number(index) - 1] ?? "",
  );
}

/**
 * Sends one pre-approved template.
 *
 * Never throws. This runs after the booking is already stored and the email
 * receipt has been sent, so a failure here must never turn a successful
 * registration into an error. Problems are logged and reported instead.
 */
async function sendTemplate(input: TemplateSend): Promise<WhatsAppSendResult> {
  const e164 = toE164(input.to);
  if (!e164) {
    return {
      delivered: false,
      outcome: "skipped-invalid-number",
      detail: `Could not normalise "${input.to}".`,
    };
  }

  const phoneNumberId = whatsappPhoneNumberId();
  const accessToken = whatsappAccessToken();

  if (!isWhatsAppConfigured() || !phoneNumberId || !accessToken) {
    // Mirror the email layer: without credentials, record what would have been
    // sent rather than failing the submission.
    console.info(
      `[whatsapp] ${input.template} -> ${maskPhone(e164)}\n${preview(input.template, input.params)}`,
    );
    return { delivered: false, outcome: "skipped-unconfigured", to: e164 };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${whatsappApiVersion()}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: e164,
          type: "template",
          template: {
            name: input.template,
            language: { code: WHATSAPP_TEMPLATES[input.template].language },
            components: [
              {
                type: "body",
                parameters: input.params.map((text) => ({ type: "text", text })),
              },
            ],
          },
        }),
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        `[whatsapp] ${input.template} rejected (${response.status})`,
        detail.slice(0, 400),
      );
      return {
        delivered: false,
        outcome: "error",
        detail: `HTTP ${response.status}: ${detail.slice(0, 200)}`,
        to: e164,
      };
    }

    return { delivered: true, outcome: "sent", to: e164 };
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : "unknown error";
    console.error(`[whatsapp] ${input.template} failed:`, detail);
    return { delivered: false, outcome: "error", detail, to: e164 };
  }
}

/**
 * Visitor registration receipt.
 *
 * Only sent when the visitor explicitly opted in on the form. WhatsApp blocks
 * numbers that receive messages without consent, so this is enforced here
 * rather than assumed from the privacy-policy checkbox.
 */
export async function sendVisitorReceipt(input: {
  phone: string;
  consented: boolean;
  name: string;
  reference: string;
  editions: string;
  events: { city: string; dates: string }[];
}): Promise<WhatsAppSendResult> {
  if (!input.consented) {
    return { delivered: false, outcome: "skipped-consent" };
  }
  return sendTemplate({
    to: input.phone,
    template: "indtec_visitor_receipt",
    params: [
      input.name,
      input.reference,
      formatEditions(input.events, input.editions),
      "Your e-pass is issued by our team shortly.",
    ],
  });
}

/** Stall booking receipt. Same consent requirement as the visitor receipt. */
export async function sendExhibitorReceipt(input: {
  phone: string;
  consented: boolean;
  contact: string;
  reference: string;
  company: string;
  stalls: number;
  editions: string;
  events: { city: string; dates: string }[];
}): Promise<WhatsAppSendResult> {
  if (!input.consented) {
    return { delivered: false, outcome: "skipped-consent" };
  }
  return sendTemplate({
    to: input.phone,
    template: "indtec_exhibitor_receipt",
    params: [
      input.contact,
      input.reference,
      `${input.company} — ${input.stalls} stall${input.stalls === 1 ? "" : "s"} at ${input.editions}`,
      "An account manager will contact you within one working day.",
    ],
  });
}