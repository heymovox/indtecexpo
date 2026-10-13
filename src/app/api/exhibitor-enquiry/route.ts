import type { NextRequest } from "next/server";
import { createRecord, type StoredRecord } from "@/lib/db";
import type { ExhibitorEnquiry } from "@/types/exhibitor";
import { clientIp, isSameOrigin, rateLimit } from "@/lib/protection";
import { exhibitorEnquirySchema, flattenErrors } from "@/lib/validations";
import { buildExhibitorConfirmationEmail, buildExhibitorEnquiryEmail, sendNotification } from "@/lib/email";
import { referenceNumber, uniqueId } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { summariseEvents } from "@/lib/event-summary";
import { sendExhibitorReceipt } from "@/lib/whatsapp-send";
import { sanitizeBody } from "@/app/api/_lib/parse";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return Response.json(
      { ok: false, message: "Request blocked." },
      { status: 403 },
    );
  }

  const limit = rateLimit(`exhibitor:${clientIp(request)}`, 8, 60000);
  if (!limit.ok) {
    return Response.json(
      { ok: false, message: "Too many requests. Please try again in a minute." },
      { status: 429 },
    );
  }

  try {
    const raw: unknown = await request.json().catch(() => null);
    const result = exhibitorEnquirySchema.safeParse(sanitizeBody(raw));
    if (!result.success) {
      return Response.json(
        {
          ok: false,
          errors: flattenErrors(result.error),
          message: "Please correct the highlighted fields.",
        },
        { status: 400 },
      );
    }

    const data = result.data;
    const record: ExhibitorEnquiry & StoredRecord = {
      id: uniqueId("EXH"),
      reference: referenceNumber("INDTEC"),
      createdAt: new Date().toISOString(),
      source: "website",
      stage: "new",
      ...data,
      // The form sends the literal "on"; store a boolean so records are queryable.
      whatsappConsent: data.whatsappConsent === "on",
    };

    await createRecord("exhibitorEnquiries", record);

    // Resolve editions first: the summary gives both the readable city list and
    // the dates to render in the confirmation.
    const events = await summariseEvents(record.eventSlugs);
    const expos = events.length
      ? events.map((event) => event.city).join(", ")
      : record.eventSlugs.join(", ");

    // Confirm to the exhibitor before notifying the desk, so the enquiry is
    // acknowledged even if the internal notification fails.
    const confirmation = buildExhibitorConfirmationEmail({
      reference: record.reference,
      contact: record.contactPerson,
      company: record.companyName,
      email: record.email,
      expos,
      stallCodes: record.stallCodes,
      stalls: record.stalls,
      powerLoad: record.powerLoad,
      sponsorship: record.sponsorship,
      events,
    });
    await sendNotification({
      to: [record.email],
      replyTo: siteConfig.exhibitorEmail,
      transactional: true,
      ...confirmation,
    });

    await sendNotification({
      to: [siteConfig.exhibitorEmail],
      subject: `New stall enquiry — ${record.reference}`,
      text: buildExhibitorEnquiryEmail({
        reference: record.reference,
        company: record.companyName,
        contact: record.contactPerson,
        phone: record.phone,
        email: record.email,
        eventSlugs: record.eventSlugs,
        stallSize: record.stallSize,
        stalls: record.stalls,
        stallCodes: record.stallCodes,
        powerLoad: record.powerLoad,
        machinery: record.machinery,
        water: record.water,
        branding: record.branding,
        sponsorship: record.sponsorship,
        productCategory: record.productCategory,
      }),
    });

    // WhatsApp receipt last and outside the critical path: the email has
    // already been sent, so a template or credentials problem must not turn a
    // successful booking into an error.
    const whatsapp = await sendExhibitorReceipt({
      phone: record.phone,
      consented: record.whatsappConsent,
      contact: record.contactPerson,
      reference: record.reference,
      company: record.companyName,
      stalls: record.stalls,
      editions: expos,
      events,
    });
    if (whatsapp.outcome === "error") {
      console.error(
        `[api/exhibitor-enquiry] whatsapp failed for ${record.reference}`,
        whatsapp.detail,
      );
    }

    return Response.json({
      ok: true,
      id: record.id,
      reference: record.reference,
      whatsapp: whatsapp.outcome,
    });
  } catch (error) {
    console.error("[api/exhibitor-enquiry]", error);
    return Response.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
