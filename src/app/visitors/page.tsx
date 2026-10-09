import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { ExhibitorCTA, StatStrip } from "@/components/ui/CTA";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading, Badge } from "@/components/ui/Section";
import { EventCard } from "@/components/events/EventCard";
import { contactConfig, siteConfig } from "@/config/site";
import { getSortedEvents } from "@/data/events";
import { faqsByGroup } from "@/data/faqs";
import { whyVisitBenefits, visitorPrerequisites } from "@/data/exhibitors";
import { buildMetadata } from "@/lib/seo";
import { whatsappLinks } from "@/lib/whatsapp";

export const metadata = buildMetadata({
  title: "Why Visit",
  description:
    "Free trade entry to INDTEC EXPO 2026–2027 — discover live machinery, meet 900+ exhibitors and connect with industrial decision-makers across Bengaluru, Coimbatore and Hosur.",
  path: "/visitors",
});

function sumStat(
  events: ReturnType<typeof getSortedEvents>,
  label: string,
): string {
  const total = events.reduce((sum, event) => {
    const stat = event.stats.find((item) => item.label === label);
    if (!stat) return sum;
    const digits = stat.value.replace(/\D/g, "");
    return sum + (digits ? parseInt(digits, 10) : 0);
  }, 0);
  return total > 0 ? `${total.toLocaleString("en-IN")}+` : "—";
}

export default function VisitorsPage() {
  const events = getSortedEvents();
  const visitingFaqs = faqsByGroup("Visiting");

  const attendanceStats = [
    { value: String(events.length), label: "Industrial Cities" },
    { value: sumStat(events, "Exhibitors"), label: "Exhibitors Across Series" },
    { value: sumStat(events, "Visitors"), label: "Qualified Visitors" },
    { value: String(events.reduce((sum, e) => sum + e.days, 0)), label: "Business Days" },
  ];

  return (
    <>
      <PageHero
        eyebrow="For Visitors"
        title="Where South India Comes to Source Technology"
        description="INDTEC EXPO brings the factory floor to you — running machinery, new releases and the engineers behind them, across three industrial hubs. Trade entry is free when you pre-register."
        image="/images/hero/hero-register.svg"
        crumbs={[{ label: "Visitors" }]}
      >
        <div className="flex flex-wrap gap-3">
          <Button href="/visitors/register" variant="primary" size="lg" withArrow>
            Register as Visitor
          </Button>
          <Button href="#expos" variant="outline-light" size="lg">
            See the Calendar
          </Button>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm text-steel-300">
          {[
            "Free entry for trade professionals",
            "E-pass — skip the on-site queue",
            "Conference sessions included",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Icon name="check-circle" size={17} className="text-success-500" />
              {item}
            </li>
          ))}
        </ul>
      </PageHero>

      {/* Why visit */}
      <Section>
        <SectionHeading
          eyebrow="Why Visit"
          title="One Day on the Floor. A Year of Advantage."
          description="Plant heads, purchase managers, business owners and engineering consultants use INDTEC EXPO to evaluate technology side by side — something no catalog or website can replicate."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {whyVisitBenefits.map((benefit) => (
            <article
              key={benefit.id}
              className="card card-hover flex h-full flex-col p-6"
            >
              <span className="flex h-12 w-12 items-center justify-center border border-brand-100 bg-brand-50 text-brand-600">
                <Icon name={benefit.icon as IconName} size={22} strokeWidth={1.5} />
              </span>
              <h3 className="display-sm mt-5 text-lg text-navy-900">
                {benefit.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-steel-600">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* Prerequisites + stats */}
      <Section tone="muted" className="grid-surface-dark">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <span className="eyebrow eyebrow-light mb-4">Before You Arrive</span>
            <h2 className="display text-[clamp(1.8rem,3.4vw,2.75rem)]">
              Visitor Essentials
            </h2>
            <p className="mt-4 text-base leading-relaxed text-steel-300">
              INDTEC EXPO is a working trade exhibition. A little preparation
              turns a floor walk into a sourcing session.
            </p>

            <ul className="mt-7 space-y-4">
              {visitorPrerequisites.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 border-b border-white/10 pb-4 text-sm text-steel-300 last:border-0"
                >
                  <Icon
                    name="check-circle"
                    size={18}
                    className="mt-0.5 shrink-0 text-success-500"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/visitors/register" variant="primary" withArrow>
                Get Your Free E-Pass
              </Button>
              <Button href={whatsappLinks.visitor} variant="outline-light">
                <Icon name="whatsapp" size={17} className="mr-1.5" />
                Chat With Us
              </Button>
            </div>
          </div>

          <div>
            <StatStrip items={attendanceStats} />
            <p className="mt-5 text-center text-xs leading-relaxed text-steel-500">
              Aggregated attendance across the {siteConfig.fullName} Bengaluru,
              Coimbatore and Hosur editions.
            </p>
          </div>
        </div>
      </Section>

      {/* Expo calendar */}
      <Section tone="light" id="expos">
        <SectionHeading
          eyebrow="2026–2027 Calendar"
          title="Choose Your Expo"
          description="Three editions. Three distinct industrial buyer pools. Register for one — or plan a circuit across all three."
          action={
            <Button href="/events" variant="outline" withArrow>
              Full Calendar
            </Button>
          }
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Visitor FAQ"
              title="Questions Before You Visit"
              description="Everything trade visitors ask before registering for INDTEC EXPO."
            />
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">Free Trade Entry</Badge>
              <Badge tone="gold">E-Pass on Email</Badge>
              <Badge tone="success">Students Welcome — Day 3</Badge>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/faq" variant="secondary" withArrow>
                All FAQs
              </Button>
              <Button href={`mailto:${contactConfig.visitorEmail}`} variant="outline">
                Email Visitor Desk
              </Button>
            </div>
          </div>

          <Accordion
            items={visitingFaqs.map((faq) => ({
              id: faq.id,
              question: faq.question,
              answer: faq.answer,
            }))}
            defaultOpenId={visitingFaqs[0]?.id}
          />
        </div>
      </Section>

      {/* Strong CTA */}
      <Section tone="dark" className="overflow-hidden">
        <div className="hatch-surface absolute inset-x-0 top-0" />
        <div className="grid-surface-dark absolute inset-0 opacity-60" />
        <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <span className="eyebrow eyebrow-light mb-4">Registration Open</span>
            <h2 className="display text-[clamp(2rem,4.4vw,3.25rem)]">
              Register Once. Walk Straight In.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-steel-300 sm:text-lg">
              Pre-registration takes under two minutes. You receive a
              confirmation email with your reference number and e-pass, and your
              badge is ready at the fast-track desk on arrival.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/visitors/register" variant="primary" size="lg" withArrow>
                Register as Visitor
              </Button>
              <Button href={whatsappLinks.visitor} variant="gold" size="lg">
                <Icon name="whatsapp" size={18} className="mr-1.5" />
                WhatsApp the Team
              </Button>
            </div>
          </div>

          <ul className="space-y-4 border-l border-white/10 lg:pl-10">
            {[
              { icon: "ticket", title: "Free e-pass", text: "Delivered to your inbox after verification." },
              { icon: "calendar", title: "All editions covered", text: "Select Bengaluru, Coimbatore or Hosur." },
              { icon: "users", title: "Peer-level floor", text: "A qualified trade audience — no retail noise." },
            ].map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold-500/35 bg-gold-500/10 text-gold-500">
                  <Icon name={item.icon as IconName} size={19} strokeWidth={1.5} />
                </span>
                <div>
                  <h3 className="display-sm text-base text-white">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-steel-400">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <ExhibitorCTA
        headline="Bring Your Team. Book a Stall Instead."
        supportingText="If you supply to this industry, the same floor that attracts buyers is your sales stage. Multi-city exhibitor packages are open."
        primaryLabel="Book Your Stall"
        primaryHref="/exhibitors/book-your-stall"
        secondaryLabel="Why Exhibit?"
        secondaryHref="/exhibitors/why-exhibit"
      />
    </>
  );
}
