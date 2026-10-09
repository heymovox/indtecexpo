import type { NextRequest } from "next/server";
import { createRecord, type StoredRecord } from "@/lib/db";
import type { ContactMessage } from "@/types/exhibitor";
import { clientIp, isSameOrigin, rateLimit } from "@/lib/protection";
import { contactFormSchema, flattenErrors } from "@/lib/validations";
import { buildContactEmail, sendNotification } from "@/lib/email";
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

  const limit = rateLimit(`contact:${clientIp(request)}`, 8, 60000);
  if (!limit.ok) {
    return Response.json(
      { ok: false, message: "Too many requests. Please try again in a minute." },
      { status: 429 },
    );
  }

  try {
    const raw: unknown = await request.json().catch(() => null);
    const result = contactFormSchema.safeParse(sanitizeBody(raw));
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
    const record: ContactMessage & StoredRecord = {
      id: uniqueId("MSG"),
      reference: referenceNumber("CON"),
      createdAt: new Date().toISOString(),
      stage: "new",
      ...data,
    };

    await createRecord("contactMessages", record);

    await sendNotification({
      to: [siteConfig.email],
      subject: `New contact message — ${record.reference}`,
      text: buildContactEmail({
        reference: record.reference,
        name: record.name,
        email: record.email,
        subject: record.subject,
        message: record.message,
      }),
    });

    return Response.json({
      ok: true,
      id: record.id,
      reference: record.reference,
    });
  } catch (error) {
    console.error("[api/contact]", error);
    return Response.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
