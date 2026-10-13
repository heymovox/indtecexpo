import "server-only";

/**
 * WhatsApp Business Cloud API configuration.
 *
 * Meta will not let an application send free-form business-initiated messages.
 * Everything outside the 24-hour customer service window must go out through a
 * pre-approved message template, so a phone number id and access token are not
 * enough on their own — the template names must already exist and be APPROVED
 * on the WhatsApp Business Account, or Meta rejects the request.
 *
 * Setup: Meta Business Suite -> WhatsApp Manager -> Phone numbers -> API setup.
 * Templates are created under WhatsApp Manager -> Message templates and must
 * use the exact bodies exported from `lib/whatsapp-templates.ts`.
 */

const DEFAULT_API_VERSION = "v23.0";

export function whatsappApiVersion(): string {
  return process.env.WHATSAPP_API_VERSION?.trim() || DEFAULT_API_VERSION;
}

/** Numeric phone number id from the Cloud API setup panel. */
export function whatsappPhoneNumberId(): string | null {
  return process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || null;
}

/** Permanent (system user) or temporary access token for the Cloud API. */
export function whatsappAccessToken(): string | null {
  return process.env.WHATSAPP_ACCESS_TOKEN?.trim() || null;
}

/**
 * True only when both credentials are present. Templates are still required at
 * send time; this only tells us whether a network call is worth attempting.
 */
export function isWhatsAppConfigured(): boolean {
  return Boolean(whatsappPhoneNumberId() && whatsappAccessToken());
}

/** INDTEC is India-only, so a bare 10-digit number is assumed Indian. */
const DEFAULT_COUNTRY_CODE = "91";

/**
 * Normalises a user-entered phone number to E.164, which the Cloud API
 * requires. Handles the shapes the forms actually produce: "+91…", "0091…",
 * "91…" and bare 10-digit Indian mobiles.
 *
 * Returns null when no plausible number can be derived, so the caller can skip
 * the send rather than fail the whole submission.
 */
export function toE164(input: string, countryCode = DEFAULT_COUNTRY_CODE): string | null {
  if (!input) return null;

  const trimmed = input.trim();
  const plusForm = trimmed.startsWith("+") ? trimmed.slice(1) : trimmed;
  const zeroPrefixed = plusForm.startsWith("00") ? plusForm.slice(2) : plusForm;
  const digits = zeroPrefixed.replace(/\D/g, "");

  if (!digits) return null;

  // Already carries a country code.
  if (zeroPrefixed.startsWith(countryCode) && digits.length >= countryCode.length + 10) {
    return `+${digits}`;
  }

  // Bare national number. Indian mobiles never begin with 0, so a leading zero
  // means a landline written with its trunk prefix ("044 2822 0000"). We cannot
  // resolve that to a country code reliably, so it is rejected rather than sent
  // to a wrong number.
  if (digits.length === 10) {
    return digits.startsWith("0") ? null : `+${countryCode}${digits}`;
  }

  // Country code with no trunk zero, e.g. 91 + 10 digits.
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;

  return null;
}

/** Human-readable rendering for logs and template parameters. */
export function maskPhone(e164: string): string {
  const tail = e164.slice(-4);
  return `${e164.slice(0, 3)}•••••${tail}`;
}