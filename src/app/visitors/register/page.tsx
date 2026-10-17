import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { contactConfig } from "@/config/site";
import { getPublicEvents } from "@/data/events.server";
import { interestAreas } from "@/data/industries";
import { buildMetadata } from "@/lib/seo";
import { whatsappLinks } from "@/lib/whatsapp";
import { VisitorRegistrationForm } from "./VisitorRegistrationForm";

export const metadata = buildMetadata({
  title: "Register as Visitor",
  description:
    "Register free for INDTEC EXPO 2026–2027 in Bengaluru, Coimbatore or Hosur. Get your trade visitor e-pass, skip the queue and access live machinery demos and the Industry 4.0 conference.",
  path: "/visitors/register",
});

export const revalidate = 60;

export default async function VisitorRegisterPage() {
  const events = await getPublicEvents();

  return (
    <>
      <PageHero
        eyebrow="Visitor Registration"
        title="Claim Your Free Trade E-Pass"
        description="Two minutes now saves you the queue at the gate. Register once per edition — your confirmation and reference number arrive by email within minutes."
        image="/images/hero/hero-register.svg"
        crumbs={[
          { label: "Visitors", href: "/visitors" },
          { label: "Register" },
        ]}
        compact
      >
        <ul className="flex flex-wrap gap-x-7 gap-y-3 text-sm text-steel-300">
          {[
            "Free for trade professionals",
            "Valid for all business days",
            "Conference access included",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Icon name="check-circle" size={17} className="text-success-500" />
              {item}
            </li>
          ))}
        </ul>
      </PageHero>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <div className="card p-6 sm:p-8">
            <h2 className="display-sm text-2xl text-navy-900">
              Visitor Registration Form
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-steel-600">
              Fill in your professional details so we can route your e-pass and
              notify you about sessions relevant to your industry.
            </p>
            <div className="mt-7">
              <VisitorRegistrationForm events={events} />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="border border-steel-200 bg-steel-50 p-6">
              <h3 className="display-sm text-lg text-navy-900">
                What You Get
              </h3>
              <ul className="mt-4 space-y-3.5">
                {[
                  { icon: "ticket", text: "Digital e-pass for the edition(s) you select" },
                  { icon: "calendar", text: "Entry on all business days of the expo" },
                  { icon: "users", text: "Access to buyer–seller networking sessions" },
                  { icon: "display", text: "Conference theatre sessions, included free" },
                ].map((item) => (
                  <li key={item.text} className="flex gap-3 text-sm text-steel-600">
                    <Icon
                      name={item.icon as IconName}
                      size={17}
                      className="mt-0.5 shrink-0 text-brand-600"
                    />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-steel-200 p-6">
              <h3 className="display-sm text-lg text-navy-900">
                Choose Your Edition
              </h3>
              <ul className="mt-4 space-y-3">
                {events.map((event) => (
                  <li
                    key={event.slug}
                    className="flex items-center justify-between border-b border-steel-100 pb-3 text-sm last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold text-navy-800">{event.city}</p>
                      <p className="text-xs text-steel-500">{event.venue.name}</p>
                    </div>
                    <span className="tabular text-xs uppercase tracking-[0.12em] text-brand-600">
                      {event.dateRangeShort}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-steel-200 p-6">
              <h3 className="display-sm text-lg text-navy-900">
                Popular Interest Areas
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {interestAreas.slice(0, 8).map((area) => (
                  <span
                    key={area}
                    className="border border-steel-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-steel-600"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div className="border border-brand-100 bg-brand-50 p-6">
              <h3 className="display-sm text-lg text-navy-900">
                Need Help Registering?
              </h3>
              <p className="mt-2 text-sm text-steel-600">
                Call the visitor desk or message us on WhatsApp — we can
                complete the registration with you over the phone.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href={`tel:${contactConfig.phones[1].tel}`}
                  className="flex items-center gap-2.5 text-sm font-semibold text-navy-800 transition hover:text-brand-600"
                >
                  <Icon name="phone" size={16} className="text-brand-600" />
                  {contactConfig.phones[1].display}
                </a>
                <a
                  href={whatsappLinks.visitor}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm font-semibold text-navy-800 transition hover:text-brand-600"
                >
                  <Icon name="whatsapp" size={16} className="text-success-500" />
                  WhatsApp the visitor desk
                </a>
              </div>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
