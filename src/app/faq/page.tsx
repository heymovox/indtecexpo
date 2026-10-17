import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";import { contactConfig } from "@/config/site";
import { faqGroups, faqs, withLiveCalendar } from "@/data/faqs";
import { getPublicEvents } from "@/data/events.server";
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  JsonLd,
} from "@/lib/seo";
import { whatsappLinks } from "@/lib/whatsapp";
import type { FaqItem } from "@/types/content";

export const metadata = buildMetadata({
  title: "Frequently Asked Questions",
  description:
    "Answers to the most common questions about INDTEC EXPO — stall booking, visitor registration, exhibition timings, venues across Bengaluru, Coimbatore and Hosur, and organizer details.",
  path: "/faq",
});

const groupMeta: Record<
  FaqItem["group"],
  { icon: IconName; blurb: string }
> = {
  Exhibiting: {
    icon: "stall",
    blurb: "Stall sizes, pricing, booking process and multi-city packages.",
  },
  Visiting: {
    icon: "ticket",
    blurb: "Free registration, e-passes, what to carry and student entry.",
  },
  Events: {
    icon: "calendar",
    blurb: "Venues, dates and daily timings for all three editions.",
  },
  General: {
    icon: "service",
    blurb: "Organizer details and how to reach the exhibitions team.",
  },
};

// The calendar answer is rebuilt from the dashboard's editions, so revalidate
// with the rest of the event surfaces.
export const revalidate = 60;

export default async function FaqPage() {
  // "Where and when" quotes city dates, so it is rebuilt from the live list.
  const items = withLiveCalendar(faqs, await getPublicEvents());
  const byGroup = (group: FaqItem["group"]) =>
    items.filter((faq) => faq.group === group);

  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Questions, Answered"
        description="Everything exhibitors, visitors and partners ask before joining INDTEC EXPO — grouped by topic, answered by the team that runs the floor."
        image="/images/hero/hero-contact.svg"
        crumbs={[{ label: "FAQ" }]}
        compact
      />

      <Section>
        <div className="space-y-14">
          {faqGroups.map((group) => {
            const groupItems = byGroup(group);
            if (groupItems.length === 0) return null;
            const meta = groupMeta[group];

            return (
              <div key={group} id={group.toLowerCase()} className="scroll-mt-24">
                <div className="mb-7 flex flex-wrap items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-brand-100 bg-brand-50 text-brand-600">
                    <Icon name={meta.icon} size={20} strokeWidth={1.5} />
                  </span>
                  <div>
                    <h2 className="display text-2xl text-navy-900 sm:text-3xl">
                      {group}
                    </h2>
                    <p className="mt-1 text-sm text-steel-600">{meta.blurb}</p>
                  </div>
                  <span className="tabular ml-auto border border-steel-200 px-2.5 py-1 text-xs text-steel-500">
                    {groupItems.length} {groupItems.length === 1 ? "answer" : "answers"}
                  </span>
                </div>

                <Accordion
                  items={groupItems.map((faq) => ({
                    id: faq.id,
                    question: faq.question,
                    answer: faq.answer,
                  }))}
                  defaultOpenId={groupItems[0]?.id}
                />
              </div>
            );
          })}
        </div>
      </Section>

      {/* Still need help */}
      <Section tone="muted" className="grid-surface-dark">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <span className="eyebrow eyebrow-light mb-4">Still Need Help?</span>
            <h2 className="display text-[clamp(1.8rem,3.6vw,2.75rem)]">
              Ask a Human.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-steel-300">
              The exhibitions team answers calls, WhatsApp and email{" "}
              {contactConfig.hours.toLowerCase()}. Stall and visitor queries are
              typically answered the same day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={contactConfig.phones[0].tel} variant="primary" size="lg">
                <Icon name="phone" size={17} className="mr-1.5" />
                Call {contactConfig.phones[0].display}
              </Button>
              <Button href={whatsappLinks.support} variant="gold" size="lg">
                <Icon name="whatsapp" size={18} className="mr-1.5" />
                WhatsApp Us
              </Button>
            </div>
          </div>

          <ul className="space-y-4 border-l border-white/10 lg:pl-10">
            {[
              { icon: "stall" as IconName, title: "Stall enquiries", href: "/exhibitors/book-your-stall", label: "Book Your Stall" },
              { icon: "ticket" as IconName, title: "Visitor registration", href: "/visitors/register", label: "Register Free" },
              { icon: "mail" as IconName, title: "Write to us", href: `mailto:${contactConfig.email}`, label: contactConfig.email },
            ].map((item) => (
              <li key={item.title}>
                <a
                  href={item.href}
                  className="flex items-center gap-4 border-b border-white/10 pb-4 transition hover:text-gold-500"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold-500/35 bg-gold-500/10 text-gold-500">
                    <Icon name={item.icon} size={19} strokeWidth={1.5} />
                  </span>
                  <div>
                    <h3 className="display-sm text-base text-white">{item.title}</h3>
                    <span className="text-sm text-steel-400">{item.label}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <JsonLd
        data={faqJsonLd(
          items.map((faq) => ({ question: faq.question, answer: faq.answer })),
        )}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ])}
      />
    </>
  );
}
