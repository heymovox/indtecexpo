import "server-only";

/**
 * Notification layer.
 *
 * With NOTIFICATION_WEBHOOK_URL configured, notifications are POSTed to your
 * email provider (Resend, SendGrid, SMTP2JSON, a Zapier hook, etc).
 * Without it the notification is written to the server log so no lead is
 * ever silently dropped.
 */

import { siteConfig } from "@/config/site";

export interface NotificationPayload {
  to: string | string[];
  subject: string;
  text: string;
  /** Optional HTML body; providers that support it will prefer this. */
  html?: string;
  replyTo?: string;
}

interface QueuedNotification extends NotificationPayload {
  queuedAt: string;
  delivered: boolean;
}

const log: QueuedNotification[] = [];

function recipients(to: string | string[]): string[] {
  return Array.isArray(to) ? to : [to];
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
        from: process.env.NOTIFICATION_FROM ?? siteConfig.email,
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
): Promise<{ delivered: boolean; channel: "webhook" | "log" }> {
  const delivered = await deliverViaWebhook(payload);
  log.push({
    ...payload,
    queuedAt: new Date().toISOString(),
    delivered,
  });
  if (log.length > 200) log.splice(0, log.length - 200);

  if (!delivered) {
    console.info("[notification]", payload.subject, "->", recipients(payload.to).join(", "));
    console.info(payload.text);
  }

  return { delivered, channel: delivered ? "webhook" : "log" };
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
}): string {
  return [
    `New visitor registration — ${input.reference}`,
    "",
    `Name     : ${input.name}`,
    `Company  : ${input.company}`,
    `Email    : ${input.email}`,
    `Expos    : ${input.expos}`,
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

/**
 * Branded single-column email shell. Deliberately table-free and inline-styled
 * so it survives Outlook and Gmail's HTML sanitiser.
 */
function emailShell(options: {
  heading: string;
  intro: string;
  reference: string;
  rows: { label: string; value: string }[];
  closing: string;
}): string {
  const rowHtml = options.rows
    .map(
      (row) => `
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(row.label)}</td>
          <td style="padding:6px 0 6px 16px;color:#071427;font-size:13px;font-weight:600;">${escapeHtml(row.value)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #dce3eb;">
        <tr>
          <td style="background:#071427;padding:20px 24px;">
            <span style="color:#ffffff;font-size:19px;font-weight:700;letter-spacing:0.06em;">INDTEC EXPO</span>
            <span style="display:block;color:#f5b301;font-size:11px;letter-spacing:0.14em;margin-top:4px;">${escapeHtml(siteConfig.fullName)}</span>
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
        </tr>
        <tr>
          <td style="padding:22px 24px 28px;">
            <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.6;">${escapeHtml(options.closing)}</p>
            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
              Questions? Reply to this email or call
              <a href="tel:+917406213220" style="color:#0f5fbf;">+91 74062 13220</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f4f6f9;padding:16px 24px;border-top:1px solid #dce3eb;">
            <span style="color:#64748b;font-size:11px;">
              ${escapeHtml(siteConfig.organizer.name)} · ${escapeHtml(siteConfig.organizer.descriptor)} ·
              <a href="https://www.indtcexpo.com" style="color:#0f5fbf;">www.indtcexpo.com</a>
            </span>
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
}): { subject: string; text: string; html: string } {
  const subject = `Your INDTEC EXPO visitor pass — ${input.reference}`;
  const text = [
    `Hello ${input.name},`,
    "",
    `Your visitor registration for ${input.expos} is confirmed.`,
    `Keep your reference handy — the INDTEC EXPO team will use it when issuing your e-pass.`,
    "",
    `Reference : ${input.reference}`,
    `Company   : ${input.company}`,
    `Editions  : ${input.expos}`,
    "",
    `Your digital e-pass will be issued by our team shortly. Entry is free for trade visitors.`,
    "",
    `— ${siteConfig.name}, ${siteConfig.organizer.name}`,
  ].join("\n");

  const html = emailShell({
    heading: "Your visitor registration is confirmed",
    intro: `Hello ${input.name}, thank you for registering to visit ${input.expos}. Keep the reference below — our team will use it when issuing your e-pass.`,
    reference: input.reference,
    rows: [
      { label: "Name", value: input.name },
      { label: "Company", value: input.company },
      { label: "Editions", value: input.expos },
      { label: "Entry", value: "Free for trade visitors" },
    ],
    closing:
      "Your digital e-pass will be issued by our team shortly. Reply to this email if you need to add an edition or update your details.",
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
}): { subject: string; text: string; html: string } {
  const subject = `We have received your stall enquiry — ${input.reference}`;
  const text = [
    `Hello ${input.contact},`,
    "",
    `Thank you for your interest in exhibiting at INDTEC EXPO.`,
    `Your enquiry has been registered with our exhibitions desk.`,
    "",
    `Reference    : ${input.reference}`,
    `Company      : ${input.company}`,
    `Editions     : ${input.expos}`,
    `Stalls       : ${input.stalls}`,
    ...(input.stallCodes?.length ? [`Preferred     : ${input.stallCodes.join(", ")}`] : []),
    ...(input.powerLoad ? [`Power load    : ${input.powerLoad} kW`] : []),
    ...(input.sponsorship ? [`Sponsorship   : ${input.sponsorship}`] : []),
    "",
    `An account manager will contact you within one working day with live`,
    `availability, final pricing and the best aisle position for your product line.`,
    `Your stall preference is recorded but not confirmed until you accept the proforma.`,
    "",
    `— ${siteConfig.name}, ${siteConfig.organizer.name}`,
  ].join("\n");

  const html = emailShell({
    heading: "Your stall enquiry is registered",
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
    closing:
      "An account manager will contact you within one working day with availability and pricing. Your preference is recorded but not held until you accept the proforma.",
  });

  return { subject, text, html };
}
