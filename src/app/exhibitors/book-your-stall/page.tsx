import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { contactConfig } from "@/config/site";
import { getSortedEvents } from "@/data/events";
import { buildMetadata } from "@/lib/seo";
import type { StallOption } from "@/types/event";

import { StallEnquiryForm } from "./StallEnquiryForm";

export const metadata = buildMetadata({
  title: "Book Your Stall | INDTEC EXPO 2026–2027 Exhibitor Enquiry",
  description:
    "Book your stall at INDTEC EXPO 2026–2027 — Bengaluru, Coimbatore or Hosur. Send your city, stall size and product category; receive availability, pricing and a proforma within one working day.",
  path: "/exhibitors/book-your-stall",
  keywords: [
    "book stall industrial expo",
    "INDTEC Expo stall booking",
    "exhibition stall price India",
    "machine tools expo stall enquiry",
  ],
});

const lowestPrice = (options: StallOption[]): string => {
  const value = (price: string) => {
    const digits = price.replace(/[^\d]/g, "");
    return digits ? Number(digits) : Number.MAX_SAFE_INTEGER;
  };
  const sorted = [...options].sort((a, b) => value(a.price) - value(b.price));
  return sorted[0]?.price ?? "On request";
};

const nextSteps = [
  {
    title: "Registration received",
    detail:
      "Your registration lands with the exhibitor desk and is reviewed the same working day.",
    icon: "inbox",
  },
  {
    title: "Team contact",
    detail:
      "As soon as possible an account manager contacts you to confirm your preferred edition, stall size and product category.",
    icon: "phone",
  },
  {
    title: "Availability & pricing",
    detail:
      "Within one working day you receive live stall availability, final pricing and any applicable package benefits.",
    icon: "mail",
  },
  {
    title: "Proforma & confirmation",
    detail:
      "Accept the proforma to lock your stall number, aisle position and inclusion list.",
    icon: "check-circle",
  },
] as const;

const trustPoints = [
  "Response within one working day",
  "Raw, shell and premium configurations in every city",
  "Multi-city volume benefits across all three editions",
  "Early-bird and association offers available",
] as const;

export default function BookYourStallPage() {
  const events = getSortedEvents();
  const phone = contactConfig.phones[0];

  return (
    <>
      <PageHero
        eyebrow="Book Your Stall"
        title="Start Your Exhibitor Enquiry"
        description="Register in four steps — share your company details, choose the expo location, pick your stall position on the floor plan, and tell us any special requirements. Your enquiry is registered instantly and our exhibitions team contacts you as soon as possible."
        image="/images/hero/hero-book-stall.svg"
        crumbs={[
          { label: "Exhibitors", href: "/exhibitors" },
          { label: "Book Your Stall" },
        ]}
      >
        <ul className="flex flex-wrap gap-x-7 gap-y-3 text-sm text-steel-300">
          {[
            "One registration covers all three cities",
            "Free consultation on stall size & position",
            "Enquiry registered instantly",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Icon name="check-circle" size={17} className="text-success-500" />
              {item}
            </li>
          ))}
        </ul>
      </PageHero>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          {/* ------------------------------------------------------ */}
          {/* Form                                                    */}
          {/* ------------------------------------------------------ */}
          <div className="card min-w-0 p-5 sm:p-8">
            <span className="eyebrow eyebrow-dark">Exhibitor Registration</span>
            <h2 className="display mt-4 text-[clamp(1.6rem,3vw,2.25rem)] text-navy-900">
              Reserve Your Space
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-steel-600">
              Four short steps: share your company and contact details, pick the
              edition you want to exhibit in, choose your stall position on the
              floor plan, then tell us any special requirements. Your enquiry is
              registered instantly and our team gets back to you with
              availability and pricing.
            </p>

            <div className="mt-7">
              <StallEnquiryForm />
            </div>
          </div>

          {/* ------------------------------------------------------ */}
          {/* Side panel                                              */}
          {/* ------------------------------------------------------ */}
          <aside className="flex flex-col gap-5 lg:sticky lg:top-28">
            <div className="card min-w-0 p-6">
              <span className="eyebrow eyebrow-dark">What Happens Next</span>
              <ol className="mt-5 space-y-5">
                {nextSteps.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-brand-100 bg-brand-50 text-brand-600">
                      <Icon name={step.icon} size={17} strokeWidth={1.6} />
                    </span>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="tabular text-[11px] font-bold uppercase tracking-[0.16em] text-signal-500">
                          0{index + 1}
                        </span>
                        <h3 className="display-sm text-sm text-navy-900">
                          {step.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-steel-600">
                        {step.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="card min-w-0 p-6">
              <span className="eyebrow eyebrow-dark">Talk to the Team</span>
              <ul className="mt-5 space-y-3">
                <li>
                  <a
                    href={`tel:${phone.tel}`}
                    className="flex items-center gap-3 text-sm font-semibold text-navy-800 transition hover:text-brand-600"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-steel-200 text-brand-600">
                      <Icon name="phone" size={17} />
                    </span>
                    <span className="tabular">{phone.display}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={phone.wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm font-semibold text-navy-800 transition hover:text-brand-600"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-steel-200 text-success-500">
                      <Icon name="whatsapp" size={17} />
                    </span>
                    WhatsApp the exhibitor desk
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${contactConfig.exhibitorEmail}`}
                    className="flex items-center gap-3 text-sm font-semibold text-navy-800 transition hover:text-brand-600"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-steel-200 text-brand-600">
                      <Icon name="mail" size={17} />
                    </span>
                    {contactConfig.exhibitorEmail}
                  </a>
                </li>
              </ul>
              <p className="mt-4 border-t border-steel-100 pt-4 text-xs text-steel-500">
                {contactConfig.hours}
              </p>
            </div>

            <div className="card min-w-0 p-6">
              <span className="eyebrow eyebrow-dark">Stall Prices From</span>
              <ul className="mt-5 divide-y divide-steel-100">
                {events.map((event) => (
                  <li key={event.slug} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <span className="display-sm block text-sm text-navy-900">
                        {event.city}
                      </span>
                      <span className="tabular mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-500">
                        {event.dateRangeShort} · {event.days} days
                      </span>
                    </div>
                    <span className="tabular shrink-0 text-sm font-semibold text-brand-700">
                      {lowestPrice(event.stallOptions)}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                href="/exhibitors/exhibitor-profile"
                variant="outline"
                size="sm"
                withArrow
                className="mt-4 w-full"
              >
                What Gets Exhibited
              </Button>
            </div>

            <div className="border border-gold-500/45 bg-gold-500/10 p-6">
              <span className="display-sm text-sm tracking-[0.16em] text-gold-700">
                Why Exhibitors Trust INDTEC EXPO
              </span>
              <ul className="mt-4 space-y-2.5">
                {trustPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-sm leading-snug text-steel-700"
                  >
                    <Icon
                      name="check-circle"
                      size={16}
                      className="mt-0.5 shrink-0 text-success-500"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
