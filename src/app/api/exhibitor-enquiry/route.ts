import type { NextRequest } from "next/server";
import { createRecord, type StoredRecord } from "@/lib/db";
import type { ExhibitorEnquiry } from "@/types/exhibitor";
import { clientIp, isSameOrigin, rateLimit } from "@/lib/protection";
import { exhibitorEnquirySchema, flattenErrors } from "@/lib/validations";
import { buildExhibitorConfirmationEmail, buildExhibitorEnquiryEmail, sendNotification } from "@/lib/email";
import { referenceNumber, uniqueId } from "@/lib/utils";
import { siteConfig } from "@/config/site";
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
    };

    await createRecord("exhibitorEnquiries", record);

    const expos = record.eventSlugs.join(", ");

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
    });
    await sendNotification({
      to: [record.email],
      replyTo: siteConfig.exhibitorEmail,
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

    return Response.json({
      ok: true,
      id: record.id,
      reference: record.reference,
    });
  } catch (error) {
    console.error("[api/exhibitor-enquiry]", error);
    return Response.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
