import type { NextRequest } from "next/server";
import { z } from "zod";
import { readUnsubscribeToken } from "@/lib/unsubscribe";
import { suppressEmail } from "@/lib/db";

/**
 * Applies an unsubscribe from the tokenised link in an email.
 *
 * POST-only on purpose: GET on this route would let a mail scanner prefetch the
 * link and suppress the address without the recipient ever clicking it.
 */
export async function POST(request: NextRequest) {
  try {
    const raw: unknown = await request.json().catch(() => null);
    const parsed = z
      .object({ token: z.string().trim().min(1).max(600) })
      .safeParse(raw);

    const token =
      parsed.success ? parsed.data.token : (request.nextUrl.searchParams.get("token") ?? "");

    const email = readUnsubscribeToken(token);
    if (!email) {
      return Response.json(
        { ok: false, message: "This unsubscribe link is not valid." },
        { status: 400 },
      );
    }

    await suppressEmail(email, "unsubscribed");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/unsubscribe]", error);
    return Response.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

/** Stated explicitly so a prefetcher cannot trigger it. */
export async function GET() {
  return Response.json(
    { ok: false, message: "Confirm the unsubscribe with a POST request." },
    { status: 405 },
  );
}