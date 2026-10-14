import "server-only";

import { Resend } from "resend";
import { siteConfig } from "@/config/site";
import { isEmailSuppressed } from "@/lib/db";
import {
  EMAIL_WORDMARK,
  emailFrom,
  emailLogoUrl,
  emailSiteUrl,
  emailUrl,
} from "@/lib/email-config";
import { buildUnsubscribeToken } from "@/lib/unsubscribe";

/**
 * Outbound email.
 *
 * Delivery order: Resend when RESEND_API_KEY is set, then the generic
 * NOTIFICATION_WEBHOOK_URL escape hatch, then the server log. Nothing is ever
 * silently dropped — if no transport succeeds the subject and body are printed.
 */

export interface NotificationPayload {
  to: string | string[];
  subject: string;
  text: string;
  /** Optional HTML body; providers that support it will prefer this. */
  html?: string;
  replyTo?: string;
  /**
   * Transactional mail (a receipt for something the recipient just submitted)
   * ignores the suppression list. Leave unset for anything promotional.
   */
  transactional?: boolean;
}

interface QueuedNotification extends NotificationPayload {
  queuedAt: string;
  delivered: boolean;
}

const log: QueuedNotification[] = [];

function recipients(to: string | string[]): string[] {
  return Array.isArray(to) ? to : [to];
}

let resendClient: Resend | null = null;

/** Lazily constructed so importing this module never throws without a key. */
function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  resendClient ??= new Resend(key);
  return resendClient;
}

/**
 * RFC 8058 one-click unsubscribe. Gmail and Yahoo require this header on bulk
 * mail; without it a sending domain is at risk of being filtered.
 */
function unsubscribeHeaders(to: string[]): Record<string, string> | undefined {
  // Internal desk notifications go to our own addresses, so they opt out.
  const target =
    to.length === 1 && !isInternalAddress(to[0]!) ? to[0]! : undefined;
  if (!target) return undefined;

  const url = unsubscribeUrlFor(target);
  if (!url) return undefined;

  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

function isInternalAddress(address: string): boolean {
  const domain = address.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return domain === "indtecexpo.com" || domain.endsWith(".indtecexpo.com");
}

async function deliverViaResend(
  payload: NotificationPayload,
): Promise<{ delivered: boolean; reason?: string }> {
  const client = resend();
  if (!client) return { delivered: false, reason: "no-key" };

  const to = recipients(payload.to);

  try {
    const { error } = await client.emails.send({
      from: emailFrom(),
      to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      replyTo: payload.replyTo,
      headers: unsubscribeHeaders(to),
    });
    if (error) return { delivered: false, reason: error.message };
    return { delivered: true };
  } catch {
    return { delivered: false, reason: "send-failed" };
  }
}

async function deliverViaWebhook(payload: NotificationPayload): Promise<boolean> {
  const endpoint = process.env.NOTIFICATION_WEBHOOK_URL;
  const token = process.env.NOTIFICATION_WEBHOOK_TOKEN;
  if (!endpoint) return false;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        from: emailFrom(),
        to: recipients(payload.to),
        subject: payload.subject,
        text: payload.text,
        html: payload.html ?? null,
        replyTo: payload.replyTo ?? null,
        tags: ["indtec-expo"],
      }),
      signal: AbortSignal.timeout(6000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function sendNotification(
  payload: NotificationPayload,
): Promise<{ delivered: boolean; channel: "resend" | "webhook" | "log" }> {
  const to = recipients(payload.to);

  // Suppression only gates non-transactional mail. Blocking a booking receipt
  // would deny somebody the details of something they just submitted.
  if (!payload.transactional) {
    try {
      for (const address of to) {
        if (await isEmailSuppressed(address)) {
          log.push({
            ...payload,
            queuedAt: new Date().toISOString(),
            delivered: false,
          });
          return { delivered: false, channel: "log" };
        }
      }
    } catch (error) {
      // A suppression lookup failure must not silently swallow the email.
      console.error("[email] suppression check failed", error);
    }
  }

  const viaResend = await deliverViaResend(payload);
  const delivered = viaResend.delivered || (await deliverViaWebhook(payload));
  const channel = viaResend.delivered ? "resend" : delivered ? "webhook" : "log";

  if (viaResend.reason && viaResend.reason !== "no-key") {
    console.error("[email] resend rejected:", viaResend.reason);
  }

  log.push({
    ...payload,
    queuedAt: new Date().toISOString(),
    delivered,
  });
  if (log.length > 200) log.splice(0, log.length - 200);

  if (!delivered) {
    console.info("[notification]", payload.subject, "->", to.join(", "));
    console.info(payload.text);
  }

  return { delivered, channel };
}

export function notificationLog(): QueuedNotification[] {
  return [...log];
}

export function buildExhibitorEnquiryEmail(input: {
  reference: string;
  company: string;
  contact: string;
  phone: string;
  email: string;
  eventSlugs: string[];
  stallSize: string;
  stalls: number;
  stallCodes?: string[];
  powerLoad?: string;
  machinery?: string;
  water?: string;
  branding?: string;
  sponsorship?: string;
  productCategory: string;
}): string {
  const requirements = [
    input.powerLoad ? `Power load : ${input.powerLoad} kW` : "",
    input.water ? `Water      : ${input.water}` : "",
    input.branding ? `Branding   : ${input.branding}` : "",
    input.sponsorship ? `Sponsorship: ${input.sponsorship}` : "",
    input.machinery ? `Machinery  : ${input.machinery}` : "",
  ].filter(Boolean);

  return [
    `New stall enquiry — ${input.reference}`,
    "",
    `Company      : ${input.company}`,
    `Contact      : ${input.contact}`,
    `Phone        : ${input.phone}`,
    `Email        : ${input.email}`,
    `Expos        : ${input.eventSlugs.join(", ")}`,
    `Product      : ${input.productCategory}`,
    `Stall size   : ${input.stallSize || "—"}`,
    `No. of stalls: ${input.stalls}`,
    ...(input.stallCodes?.length
      ? [
          `Positions   : ${input.stallCodes.join(", ")}`,
          "",
          `The exhibitor picked the above stalls from the interactive floor plan.`,
          `Treat this as a preference request and confirm actual availability.`,
        ]
      : []),
    ...(requirements.length
      ? ["", "Special requirements:", ...requirements.map((line) => `  ${line}`)]
      : []),
    "",
    `Contact the exhibitor as soon as possible with availability and pricing.`,
    `Reply directly to this enquiry within one working day.`,
    `— ${siteConfig.name}, ${siteConfig.organizer.name}`,
  ].join("\n");
}

export function buildVisitorRegistrationEmail(input: {
  reference: string;
  name: string;
  company: string;
  email: string;
  expos: string;
  schedule?: string;
}): string {
  return [
    `New visitor registration — ${input.reference}`,
    "",
    `Name     : ${input.name}`,
    `Company  : ${input.company}`,
    `Email    : ${input.email}`,
    `Expos    : ${input.expos}`,
    ...(input.schedule ? [`Schedule : ${input.schedule}`] : []),
    "",
    `Issue the digital e-pass and add to the visitor CRM list.`,
  ].join("\n");
}

export function buildContactEmail(input: {
  reference: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  return [
    `New contact message — ${input.reference}`,
    "",
    `Name    : ${input.name}`,
    `Email   : ${input.email}`,
    `Subject : ${input.subject}`,
    "",
    input.message,
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* Registrant confirmations                                            */
/* ------------------------------------------------------------------ */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** One edition summary rendered in the "What's next" block. */
export interface EmailEventSummary {
  name: string;
  city: string;
  dates: string;
  venue: string;
}

interface EmailShellOptions {
  preheader: string;
  heading: string;
  intro: string;
  reference: string;
  rows: { label: string; value: string }[];
  events?: EmailEventSummary[];
  cta?: { label: string; url: string }[];
  notes?: string[];
  closing: string;
  /** Address the unsubscribe link is signed for; omit for internal mail. */
  unsubscribeFor?: string;
}

/**
 * Branded single-column email shell, table-based and inline-styled because
 * Outlook and Gmail's sanitiser strips <style>, flex and grid.
 *
 * Colours mirror the `@theme` tokens in app/globals.css:
 * navy-900 #071427, gold-500 #f5b301, brand-600 #0f5fbf, brand-50 #eef5fd,
 * steel-50 #f4f6f9, steel-200 #dce3eb, steel-500 #64748b, steel-700 #334155.
 */
/**
 * Unsubscribe link for the recipient, or null when no signing secret is
 * configured. A missing secret must not throw: this runs inside the template,
 * so an exception here would fail the whole submission after the record was
 * already written. Degrading to "no link" is far safer than a 500.
 */
function unsubscribeUrlFor(email: string): string | null {
  try {
    return emailUrl(`/unsubscribe/${buildUnsubscribeToken(email)}`);
  } catch {
    console.warn(
      "[email] unsubscribe link omitted: no UNSUBSCRIBE_SECRET or ADMIN_SESSION_SECRET",
    );
    return null;
  }
}

function emailShell(options: EmailShellOptions): string {
  const rowHtml = options.rows
    .map(
      (row) => `
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(row.label)}</td>
          <td style="padding:6px 0 6px 16px;color:#071427;font-size:13px;font-weight:600;">${escapeHtml(row.value)}</td>
        </tr>`,
    )
    .join("");

  const eventHtml = options.events?.length
    ? `
        <tr>
          <td style="padding:22px 24px 0;">
            <p style="margin:0 0 10px;color:#64748b;font-size:11px;letter-spacing:0.14em;">EDITION DATES</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${options.events
                .map(
                  (event) => `
                <tr>
                  <td style="padding:10px 0;border-top:1px solid #dce3eb;">
                    <span style="color:#071427;font-size:14px;font-weight:700;">${escapeHtml(event.dates)}</span><br />
                    <span style="color:#334155;font-size:13px;">${escapeHtml(event.name)}</span><br />
                    <span style="color:#64748b;font-size:12px;">${escapeHtml(event.venue)}</span>
                  </td>
                </tr>`,
                )
                .join("")}
            </table>
          </td>
        </tr>`
    : "";

  const ctaHtml = options.cta?.length
    ? `
        <tr>
          <td style="padding:22px 24px 0;">
            ${options.cta
              .map(
                (button) => `
              <a href="${escapeHtml(button.url)}" style="display:inline-block;margin:0 8px 8px 0;padding:11px 20px;background:#071427;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${escapeHtml(button.label)}</a>`,
              )
              .join("")}
          </td>
        </tr>`
    : "";

  const notesHtml = options.notes?.length
    ? `
        <tr>
          <td style="padding:22px 24px 0;">
            <div style="background:#eef5fd;border-left:3px solid #0f5fbf;padding:12px 16px;">
              <p style="margin:0 0 6px;color:#0c4b99;font-size:11px;letter-spacing:0.14em;">GOOD TO KNOW</p>
              ${options.notes
                .map(
                  (note) =>
                    `<p style="margin:0 0 4px;color:#334155;font-size:13px;line-height:1.55;">&#8226;&nbsp;${escapeHtml(note)}</p>`,
                )
                .join("")}
            </div>
          </td>
        </tr>`
    : "";

  const unsubscribeUrl = options.unsubscribeFor
    ? unsubscribeUrlFor(options.unsubscribeFor)
    : null;

  const policyLinks = [
    ["Privacy Policy", "/privacy-policy"],
    ["Terms & Conditions", "/terms"],
    ["Visitor FAQ", "/faq"],
    ["Contact Us", "/contact"],
  ]
    .map(
      ([label, path]) =>
        `<a href="${emailUrl(path!)}" style="color:#0f5fbf;text-decoration:underline;">${escapeHtml(label!)}</a>`,
    )
    .join(" &nbsp;&middot;&nbsp; ");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(options.heading)}</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(options.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #dce3eb;">
        <tr>
          <td style="background:#071427;padding:22px 24px;border-bottom:3px solid #f5b301;">
            <img src="${emailLogoUrl()}" alt="${EMAIL_WORDMARK}" width="180" style="display:block;width:180px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" />
            <span style="display:block;margin-top:10px;color:#ffffff;font-size:15px;font-weight:700;letter-spacing:0.1em;">${EMAIL_WORDMARK}</span>
            <span style="display:block;margin-top:3px;color:#f5b301;font-size:11px;letter-spacing:0.14em;">${escapeHtml(siteConfig.fullName)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px 8px;">
            <h1 style="margin:0 0 10px;font-size:21px;line-height:1.3;color:#071427;">${escapeHtml(options.heading)}</h1>
            <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">${escapeHtml(options.intro)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 24px 0;">
            <div style="background:#eef5fd;border-left:3px solid #0f5fbf;padding:12px 16px;">
              <span style="color:#64748b;font-size:11px;letter-spacing:0.14em;">YOUR REFERENCE</span>
              <span style="display:block;margin-top:3px;color:#0c4b99;font-size:17px;font-weight:700;letter-spacing:0.03em;">${escapeHtml(options.reference)}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowHtml}</table>
          </td>
        </tr>${eventHtml}${ctaHtml}${notesHtml}
        <tr>
          <td style="padding:22px 24px 28px;">
            <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.6;">${escapeHtml(options.closing)}</p>
            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
              Questions? Reply to this email or call
              <a href="tel:+${siteConfig.whatsappNumber}" style="color:#0f5fbf;">+${siteConfig.primaryPhone.replace(/^(\d{5})(\d{5})$/, "$1 $2")}</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f4f6f9;padding:16px 24px;border-top:1px solid #dce3eb;">
            <p style="margin:0 0 8px;color:#64748b;font-size:12px;line-height:1.7;">${policyLinks}</p>
            <p style="margin:0;color:#64748b;font-size:11px;line-height:1.7;">
              ${escapeHtml(siteConfig.organizer.name)} &middot; ${escapeHtml(siteConfig.organizer.descriptor)} &middot;
              <a href="${emailUrl("/")}" style="color:#0f5fbf;">${escapeHtml(emailSiteUrl())}</a>
            </p>
            ${
              unsubscribeUrl
                ? `<p style="margin:8px 0 0;color:#64748b;font-size:11px;line-height:1.7;">
              You are receiving this because you submitted a registration or enquiry on ${escapeHtml(siteConfig.website)}.
              <a href="${unsubscribeUrl}" style="color:#0f5fbf;text-decoration:underline;">Unsubscribe from marketing email</a>.
            </p>`
                : `<p style="margin:8px 0 0;color:#94a3b8;font-size:11px;">Internal notification &middot; not for external distribution.</p>`
            }
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function buildVisitorConfirmationEmail(input: {
  reference: string;
  name: string;
  company: string;
  email: string;
  expos: string;
  schedule?: string;
  events?: EmailEventSummary[];
}): { subject: string; text: string; html: string } {
  const subject = `We've received your registration — ${input.reference}`;

  const text = [
    `Hello ${input.name},`,
    "",
    `We've received your visitor registration for ${input.expos}.`,
    `Keep your reference handy — the INDTEC EXPO team will use it when issuing your e-pass.`,
    "",
    `Reference : ${input.reference}`,
    `Company   : ${input.company}`,
    `Editions  : ${input.expos}`,
    ...(input.schedule ? [`Schedule  : ${input.schedule}`] : []),
    "",
    ...(input.events?.length
      ? [
          "EDITION DATES",
          ...input.events.map(
            (event) => `- ${event.dates} · ${event.name} · ${event.venue}`,
          ),
          "",
        ]
      : []),
    `Your digital e-pass will be issued by our team shortly. Entry is free for trade visitors.`,
    "",
    `What's next`,
    `- Keep this reference for your e-pass and on-site check-in.`,
    `- Carry a photo ID; the same pass works across every edition you registered for.`,
    `- Reply to this email to add an edition or correct your details.`,
    "",
    `Privacy Policy      : ${emailUrl("/privacy-policy")}`,
    `Terms & Conditions : ${emailUrl("/terms")}`,
    `Visitor FAQ        : ${emailUrl("/faq")}`,
    "",
    `— ${siteConfig.name}, ${siteConfig.organizer.name}`,
  ].join("\n");

  const html = emailShell({
    preheader: `We've received your visitor registration — reference ${input.reference}.`,
    heading: "We've received your registration",
    intro: `Hello ${input.name}, thank you for registering to visit ${input.expos}. Keep the reference below — our team will use it when issuing your e-pass.`,
    reference: input.reference,
    rows: [
      { label: "Name", value: input.name },
      { label: "Company", value: input.company },
      { label: "Editions", value: input.expos },
      ...(input.schedule ? [{ label: "Visiting", value: input.schedule }] : []),
      { label: "Entry", value: "Free for trade visitors" },
    ],
    events: input.events,
    cta: [
      { label: "View the floor plan", url: emailUrl("/floor-plan") },
      { label: "What's on", url: emailUrl("/events") },
    ],
    notes: [
      "Your e-pass is issued by our team shortly and emailed to this address.",
      "Carry a photo ID; one pass works across every edition you registered for.",
      "Entry is free for trade visitors. Reply to this email to add an edition or correct your details.",
    ],
    closing:
      "Your digital e-pass will be issued by our team shortly. Reply to this email if you need to add an edition or update your details.",
    unsubscribeFor: input.email,
  });

  return { subject, text, html };
}

export function buildExhibitorConfirmationEmail(input: {
  reference: string;
  contact: string;
  company: string;
  email: string;
  expos: string;
  stallCodes?: string[];
  stalls: number;
  powerLoad?: string;
  sponsorship?: string;
  events?: EmailEventSummary[];
}): { subject: string; text: string; html: string } {
  const subject = `We've received your stall enquiry — ${input.reference}`;

  const text = [
    `Hello ${input.contact},`,
    "",
    `We've received your stall enquiry for ${input.expos}.`,
    `It has reached our exhibitions desk and is now with an account manager.`,
    "",
    `Reference    : ${input.reference}`,
    `Company      : ${input.company}`,
    `Editions     : ${input.expos}`,
    `Stalls       : ${input.stalls}`,
    ...(input.stallCodes?.length ? [`Preferred    : ${input.stallCodes.join(", ")}`] : []),
    ...(input.powerLoad ? [`Power load   : ${input.powerLoad} kW`] : []),
    ...(input.sponsorship ? [`Sponsorship  : ${input.sponsorship}`] : []),
    "",
    ...(input.events?.length
      ? [
          "EDITION DATES",
          ...input.events.map(
            (event) => `- ${event.dates} · ${event.name} · ${event.venue}`,
          ),
          "",
        ]
      : []),
    `What happens next`,
    `- An account manager contacts you within one working day.`,
    `- You receive live availability, final pricing and the best aisle for your product line.`,
    `- Your preference is recorded but not held until you accept the proforma invoice.`,
    "",
    `Privacy Policy      : ${emailUrl("/privacy-policy")}`,
    `Terms & Conditions : ${emailUrl("/terms")}`,
    "",
    `— ${siteConfig.name}, ${siteConfig.organizer.name}`,
  ].join("\n");

  const html = emailShell({
    preheader: `We've received your stall enquiry — reference ${input.reference}.`,
    heading: "We've received your stall enquiry",
    intro: `Hello ${input.contact}, thank you for your interest in exhibiting at INDTEC EXPO. Your enquiry has reached our exhibitions desk.`,
    reference: input.reference,
    rows: [
      { label: "Company", value: input.company },
      { label: "Editions", value: input.expos },
      { label: "Stalls", value: String(input.stalls) },
      ...(input.stallCodes?.length
        ? [{ label: "Preferred", value: input.stallCodes.join(", ") }]
        : []),
      ...(input.powerLoad ? [{ label: "Power load", value: `${input.powerLoad} kW` }] : []),
      ...(input.sponsorship ? [{ label: "Sponsorship", value: input.sponsorship }] : []),
    ],
    events: input.events,
    cta: [
      { label: "View the floor plan", url: emailUrl("/floor-plan") },
      { label: "Why exhibit", url: emailUrl("/exhibitors/why-exhibit") },
    ],
    notes: [
      "An account manager will contact you within one working day.",
      "You will receive live availability, final pricing and the best aisle position for your product line.",
      "Your stall preference is recorded, not held — the position is yours once you accept the proforma invoice.",
    ],
    closing:
      "An account manager will contact you within one working day with availability and pricing. Your preference is recorded but not held until you accept the proforma.",
    unsubscribeFor: input.email,
  });

  return { subject, text, html };
}
