import { Suspense } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { readUnsubscribeToken } from "@/lib/unsubscribe";
import { UnsubscribeForm } from "./UnsubscribeForm";

export const metadata = {
  title: "Email Preferences",
  description: "Manage INDTEC EXPO email preferences.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Landing page for the "unsubscribe" link in every email.
 *
 * The address is not accepted from the browser: it is decoded from a signed
 * token, so this page cannot be used to suppress somebody else's address.
 */
export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const email = readUnsubscribeToken(token);

  return (
    <main className="flex min-h-screen items-center justify-center bg-steel-50 px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="card p-6 sm:p-8">
          <span className="eyebrow mb-3">Email Preferences</span>

          {email ? (
            <>
              <h1 className="display text-2xl text-navy-900 sm:text-3xl">
                Stop non-essential emails
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-steel-600">
                You are unsubscribing{" "}
                <span className="font-semibold text-navy-900">{email}</span> from
                marketing and promotional email.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-steel-600">
                Confirmations for a registration or stall booking you have
                already submitted will still be delivered, because those carry
                details you asked for.
              </p>
              <Suspense fallback={null}>
                <UnsubscribeForm token={token} />
              </Suspense>
            </>
          ) : (
            <>
              <h1 className="display text-2xl text-navy-900 sm:text-3xl">
                This link is not valid
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-steel-600">
                The unsubscribe link is incomplete or has been tampered with.
                Open the most recent email from INDTEC EXPO and use the link in
                its footer.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-navy-900 hover:text-white"
              >
                Contact the team
              </Link>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-steel-500">
          <Link href="/" className="underline hover:text-navy-900">
            {siteConfig.website}
          </Link>
        </p>
      </div>
    </main>
  );
}