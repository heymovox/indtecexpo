import type { NextRequest } from "next/server";
import { createRecord, type StoredRecord } from "@/lib/db";
import type { VisitorRegistration } from "@/types/exhibitor";
import { clientIp, isSameOrigin, rateLimit } from "@/lib/protection";
import { visitorRegistrationSchema, flattenErrors } from "@/lib/validations";
import { buildVisitorRegistrationEmail, sendNotification } from "@/lib/email";
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
    };

    await createRecord("visitorRegistrations", record);

    await sendNotification({
      to: [siteConfig.visitorEmail],
      subject: `New visitor registration — ${record.reference}`,
      text: buildVisitorRegistrationEmail({
        reference: record.reference,
        name: record.fullName,
        company: record.companyName,
        email: record.email,
        expos: record.interestedExpos.join(", "),
      }),
    });

    return Response.json({
      ok: true,
      id: record.id,
      reference: record.reference,
    });
  } catch (error) {
    console.error("[api/visitor-registration]", error);
    return Response.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
