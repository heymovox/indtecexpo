import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading, Badge } from "@/components/ui/Section";
import { contactConfig, siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import { waLink } from "@/lib/whatsapp";
import { ContactForm } from "./ContactForm";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Contact the INDTEC EXPO team — stall bookings, visitor registration, sponsorship and media enquiries. Call, WhatsApp or write to Konnekt Globe, Bengaluru.",
  path: "/contact",
});

const whatsappGeneral = waLink(
  "Hello INDTEC EXPO, I would like to get in touch with the exhibitions team.",
);

const desks: { icon: IconName; title: string; text: string; href: string; label: string }[] = [
  {
    icon: "stall",
    title: "Stall Bookings & Exhibitions",
    text: "Availability, pricing, multi-city packages and proforma invoices.",
    href: `mailto:${contactConfig.exhibitorEmail}`,
    label: contactConfig.exhibitorEmail,
  },
  {
    icon: "ticket",
    title: "Visitor Registration",
    text: "E-passes, group registrations and student day queries.",
    href: `mailto:${contactConfig.visitorEmail}`,
    label: contactConfig.visitorEmail,
  },
  {
    icon: "mail",
    title: "General Enquiries",
    text: "Partnerships, associations, press credentials and everything else.",
    href: `mailto:${contactConfig.email}`,
    label: contactConfig.email,
  },
  {
    icon: "whatsapp",
    title: "WhatsApp Desk",
    text: "Fastest response for availability checks and quick questions.",
    href: whatsappGeneral,
    label: "Message on WhatsApp",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to the Exhibitions Team"
        description="Stall bookings, visitor queries, sponsorship, media — every enquiry is routed to a dedicated coordinator and answered within one working day."
        image="/images/hero/hero-contact.svg"
        crumbs={[{ label: "Contact" }]}
        compact
      >
        <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm text-steel-300">
          <span className="flex items-center gap-2">
            <Icon name="clock" size={16} className="text-gold-500" />
            {contactConfig.hours}
          </span>
          <span className="flex items-center gap-2">
            <Icon name="map-pin" size={16} className="text-gold-500" />
            {contactConfig.address.line2}
          </span>
        </div>
      </PageHero>

      {/* Contact cards */}
      <Section>
        <SectionHeading
          eyebrow="Reach Us"
          title="Every Channel, One Team"
          description="Pick whichever is fastest for you — phone, email or WhatsApp. The same team handles all INDTEC EXPO editions."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {desks.map((desk) => (
            <a
              key={desk.title}
              href={desk.href}
              target={desk.href.startsWith("http") ? "_blank" : undefined}
              rel={desk.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="card card-hover group flex gap-4 p-6"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-brand-100 bg-brand-50 text-brand-600 transition group-hover:border-signal-500 group-hover:bg-signal-500 group-hover:text-white">
                <Icon name={desk.icon} size={20} strokeWidth={1.5} />
              </span>
              <div>
                <h3 className="display-sm text-base text-navy-900">{desk.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-steel-600">
                  {desk.text}
                </p>
                <span className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                  {desk.label}
                  <Icon name="arrow-right" size={13} />
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Phone numbers */}
        <div className="mt-8 border border-steel-200 bg-steel-50 p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="display-sm text-lg text-navy-900">{contactConfig.label}</h3>
              <p className="mt-1 text-sm text-steel-600">
                Direct lines to the {siteConfig.fullName} sales desk.
              </p>
            </div>
            <Badge tone="success">Answered {contactConfig.hours}</Badge>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {contactConfig.phones.map((phone) => (
              <a
                key={phone.number}
                href={`tel:${phone.tel}`}
                className="flex items-center gap-3 border border-steel-200 bg-white px-4 py-3.5 transition hover:border-brand-300 hover:shadow-card"
              >
                <Icon name="phone" size={17} className="shrink-0 text-brand-600" />
                <span className="tabular text-sm font-semibold text-navy-800">
                  {phone.display}
                </span>
              </a>
            ))}
          </div>
        </div>
      </Section>

      {/* Form + office */}
      <Section tone="light">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <div className="card p-6 sm:p-8">
            <h2 className="display-sm text-2xl text-navy-900">
              Send Us a Message
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-steel-600">
              The more specific your enquiry, the faster we can help. Include
              your preferred edition, stall size or product category where
              relevant.
            </p>
            <div className="mt-7">
              <ContactForm />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="border border-steel-200 bg-white p-6">
              <h3 className="display-sm text-lg text-navy-900">Office</h3>
              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <Icon name="building" size={17} className="mt-0.5 shrink-0 text-brand-600" />
                  <div className="text-sm leading-relaxed text-steel-600">
                    <p className="font-semibold text-navy-800">
                      {contactConfig.address.line1}
                    </p>
                    <p className="mt-0.5">{contactConfig.address.line2}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Icon name="clock" size={17} className="mt-0.5 shrink-0 text-brand-600" />
                  <p className="text-sm text-steel-600">{contactConfig.hours}</p>
                </div>
                <div className="flex gap-3">
                  <Icon name="globe" size={17} className="mt-0.5 shrink-0 text-brand-600" />
                  <a
                    href={siteConfig.url}
                    className="link-underline text-sm font-semibold text-brand-600"
                  >
                    {siteConfig.website}
                  </a>
                </div>
              </div>
            </div>

            <div className="border border-steel-200 bg-white p-6">
              <h3 className="display-sm text-lg text-navy-900">Follow INDTEC EXPO</h3>
              <ul className="mt-4 space-y-2.5">
                {Object.entries(siteConfig.social).map(([platform, href]) => (
                  <li key={platform}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-sm font-semibold capitalize text-navy-800 transition hover:text-brand-600"
                    >
                      {platform}
                      <Icon name="external" size={14} className="text-steel-400" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-brand-100 bg-brand-50 p-6">
              <h3 className="display-sm text-lg text-navy-900">
                Looking to Exhibit?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-steel-600">
                The fastest route to stall availability and pricing is the
                dedicated exhibitor enquiry form.
              </p>
              <a href="/exhibitors/book-your-stall" className="btn btn-secondary mt-4 inline-flex">
                Book Your Stall
              </a>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
