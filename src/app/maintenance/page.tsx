import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMaintenanceSettings } from "@/lib/db";
import { contactConfig, siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import { Countdown } from "@/components/ui/Countdown";

/**
 * The page every public visitor sees while maintenance mode is on.
 *
 * Reached through the redirect in proxy.ts, but it renders standalone too so an
 * admin can preview it with /maintenance?preview=1 before switching on.
 */

export const metadata: Metadata = buildMetadata({
  title: "Temporarily under maintenance",
  description:
    "INDTEC EXPO is briefly offline while we carry out scheduled work. Our team is reachable on phone, WhatsApp and email in the meantime.",
  path: "/maintenance",
  card: "brand",
  ogTitle: "INDTEC EXPO is briefly offline",
  ogEyebrow: "Scheduled maintenance",
  noIndex: true,
});

/** Social links shown as "stay in touch" while the site is dark. */
const socialLinks = [
  { label: "LinkedIn", href: siteConfig.social.linkedin },
  { label: "Facebook", href: siteConfig.social.facebook },
  { label: "Instagram", href: siteConfig.social.instagram },
  { label: "X", href: siteConfig.social.x },
  { label: "YouTube", href: siteConfig.social.youtube },
] as const;

const editionHighlights = [
  { city: "Bengaluru", dates: "24–26 December 2026" },
  { city: "Coimbatore", dates: "23–25 January 2027" },
  { city: "Hosur", dates: "19–21 February 2027" },
] as const;

const whatsAppHref = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
  "Hello INDTEC EXPO, I understand the site is under maintenance. I would like to enquire in the meantime.",
)}`;

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const settings = await getMaintenanceSettings();
  const { preview } = await searchParams;

  // With maintenance off this page has no reason to exist, so send visitors
  // back to the real site. ?preview=1 lets an admin check the layout first.
  if (!settings.enabled && preview !== "1") {
    redirect("/");
  }

  const headline = settings.headline || "We'll be back shortly";
  const message =
    settings.message ||
    "INDTEC EXPO is briefly offline while we carry out scheduled maintenance. Our team is fully reachable in the meantime — for stall bookings, visitor passes or anything else, reach us on any of the channels below.";

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-navy-950 text-white">
      {/* Ambient brand wash + grid so the page reads as INDTEC, not a browser error. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-brand-900)_0%,transparent_55%)] opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-10 sm:px-8 sm:py-16">
        <header className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/brand/indtec-expo-2026-white.png"
            alt={siteConfig.name}
            width={220}
            height={48}
            className="h-11 w-auto sm:h-14"
          />

          <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold-300/30 bg-gold-300/10 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.2em] text-gold-300 uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-300 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-300" />
            </span>
            Scheduled maintenance
          </span>

          <h1 className="font-display mt-5 text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl">
            {headline}
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-balance text-steel-300 sm:text-base">
            {message}
          </p>
        </header>

        {settings.resumeAt && (
          <section className="mt-10">
            <Countdown
              target={settings.resumeAt}
              size="md"
              label="Time until the site returns"
              completeLabel="We should be back shortly. Thank you for your patience."
            />
            <p className="mt-3 text-center text-xs text-steel-500">
              Scheduled to return{" "}
              <time dateTime={settings.resumeAt}>
                {new Date(settings.resumeAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Kolkata",
                })}
              </time>{" "}
              IST
            </p>
          </section>
        )}

        <section className="mt-12">
          <h2 className="text-center text-[0.65rem] font-semibold tracking-[0.2em] text-steel-400 uppercase">
            We&rsquo;re still here — reach us directly
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a
              href={whatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-4 transition hover:border-emerald-400/50 hover:bg-emerald-400/15"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.25 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24m4.52 10.13c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.49-.4-.42-.55-.43h-.47c-.16 0-.42.06-.64.31s-.84.82-.84 2c0 1.18.86 2.32.98 2.48.12.17 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.57.19 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.15.2-.56.2-1.04.14-1.14-.06-.1-.23-.16-.48-.28" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold tracking-wide text-emerald-300/80 uppercase">
                  Fastest
                </span>
                <span className="block truncate text-sm font-medium text-white">
                  Chat on WhatsApp
                </span>
              </span>
            </a>

            <a
              href={`tel:+91${siteConfig.primaryPhone}`}
              className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-4 transition hover:border-white/25 hover:bg-white/10"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293a.9.9 0 0 1-1.086.293 13.2 13.2 0 0 1-6.135-6.135.9.9 0 0 1 .293-1.086l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5z"
                  />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold tracking-wide text-steel-400 uppercase">
                  Call our desk
                </span>
                <span className="block truncate text-sm font-medium text-white">
                  +91 {contactConfig.phones[0].display}
                </span>
              </span>
            </a>

            <a
              href={`mailto:${siteConfig.email}?subject=${encodeURIComponent(
                "Enquiry during scheduled maintenance",
              )}`}
              className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-4 transition hover:border-white/25 hover:bg-white/10"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold tracking-wide text-steel-400 uppercase">
                  General enquiries
                </span>
                <span className="block truncate text-sm font-medium text-white">
                  {siteConfig.email}
                </span>
              </span>
            </a>

            <a
              href={`mailto:${siteConfig.exhibitorEmail}?subject=${encodeURIComponent(
                "Stall booking during scheduled maintenance",
              )}`}
              className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-4 transition hover:border-white/25 hover:bg-white/10"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold tracking-wide text-steel-400 uppercase">
                  Stall bookings
                </span>
                <span className="block truncate text-sm font-medium text-white">
                  {siteConfig.exhibitorEmail}
                </span>
              </span>
            </a>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs text-steel-500">
            <span>All desk lines:</span>
            {contactConfig.phones.map((phone, index) => (
              <span key={phone.number}>
                {index > 0 && <span className="px-1.5">·</span>}
                <a
                  href={`tel:${phone.tel}`}
                  className="transition hover:text-white hover:underline"
                >
                  {phone.display}
                </a>
              </span>
            ))}
            <span className="px-1">·</span>
            <span>{contactConfig.hours}</span>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-center text-[0.65rem] font-semibold tracking-[0.2em] text-steel-400 uppercase">
            What you&rsquo;re waiting for
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {editionHighlights.map((edition) => (
              <li
                key={edition.city}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center"
              >
                <p className="font-display text-sm font-bold tracking-wide text-white uppercase">
                  {edition.city}
                </p>
                <p className="mt-0.5 text-xs text-steel-400">
                  {edition.dates}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 text-center">
          <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-steel-500 uppercase">
            Follow the build-up
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-steel-300 transition hover:border-white/25 hover:text-white"
              >
                {social.label}
              </a>
            ))}
          </div>
        </section>

        <footer className="mt-auto pt-12 text-center">
          <p className="text-xs text-steel-500">
            {siteConfig.name} · {contactConfig.address.line2}
          </p>
          <p className="mt-1 text-xs text-steel-600">
            Organised by {siteConfig.organizer.name}
          </p>
        </footer>
      </div>
    </main>
  );
}