import type { NextRequest } from "next/server";
import { createRecord, type StoredRecord } from "@/lib/db";
import type { VisitorRegistration } from "@/types/exhibitor";
import { clientIp, isSameOrigin, rateLimit } from "@/lib/protection";
import { visitorRegistrationSchema, flattenErrors } from "@/lib/validations";
import { buildVisitorConfirmationEmail, buildVisitorRegistrationEmail, sendNotification } from "@/lib/email";
import { referenceNumber, uniqueId } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { sanitizeBody } from "@/app/api/_lib/parse";
import { summariseEvents } from "@/lib/event-summary";
import { sendVisitorReceipt } from "@/lib/whatsapp-send";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return Response.json(
      { ok: false, message: "Request blocked." },
      { status: 403 },
    );
  }

  const limit = rateLimit(`visitor:${clientIp(request)}`, 8, 60000);
  if (!limit.ok) {
    return Response.json(
      { ok: false, message: "Too many requests. Please try again in a minute." },
      { status: 429 },
    );
  }

  try {
    const raw: unknown = await request.json().catch(() => null);
    const result = visitorRegistrationSchema.safeParse(sanitizeBody(raw));
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
    const record: VisitorRegistration & StoredRecord = {
      id: uniqueId("VIS"),
      reference: referenceNumber("VST"),
      createdAt: new Date().toISOString(),
      stage: "new",
      ...data,
      // The form sends the literal "on"; store a boolean so records are queryable.
      whatsappConsent: data.whatsappConsent === "on",
    };

    await createRecord("visitorRegistrations", record);

    const expos = record.interestedExpos.join(", ");
    const schedule = (record.visitingSchedule ?? []).join("; ");

    // Confirm to the registrant first so a provider hiccup cannot cost them
    // their receipt, then notify the desk. Event dates come from the merged
    // event data so admin date edits reach the email.
    const events = await summariseEvents(record.interestedExpos);

    const confirmation = buildVisitorConfirmationEmail({
      reference: record.reference,
      name: record.fullName,
      company: record.companyName,
      email: record.email,
      expos,
      schedule,
      events,
    });
    await sendNotification({
      to: [record.email],
      replyTo: siteConfig.visitorEmail,
      transactional: true,
      ...confirmation,
    });

    await sendNotification({
      to: [siteConfig.visitorEmail],
      subject: `New visitor registration — ${record.reference}`,
      text: buildVisitorRegistrationEmail({
        reference: record.reference,
        name: record.fullName,
        company: record.companyName,
        email: record.email,
        expos,
        schedule,
      }),
    });

    // WhatsApp receipt last, and deliberately outside the critical path: the
    // customer already has their email, so a template or credentials problem
    // must not turn a successful registration into an error.
    const whatsapp = await sendVisitorReceipt({
      phone: record.phone,
      consented: record.whatsappConsent,
      name: record.fullName,
      reference: record.reference,
      editions: expos,
      events,
    });
    if (whatsapp.outcome === "error") {
      console.error(
        `[api/visitor-registration] whatsapp failed for ${record.reference}`,
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
    console.error("[api/visitor-registration]", error);
    return Response.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
