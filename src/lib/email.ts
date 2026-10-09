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
  productCategory: string;
}): string {
  return [
    `New stall enquiry — ${input.reference}`,
    "",
    `Company      : ${input.company}`,
    `Contact      : ${input.contact}`,
    `Phone        : ${input.phone}`,
    `Email        : ${input.email}`,
    `Expos        : ${input.eventSlugs.join(", ")}`,
    `Product      : ${input.productCategory}`,
    `Stall size   : ${input.stallSize}`,
    `No. of stalls: ${input.stalls}`,
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
