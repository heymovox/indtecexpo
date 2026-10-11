import Image from "next/image";
import Link from "next/link";

import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Countdown } from "@/components/ui/Countdown";
import { ExhibitorCTA, StatStrip } from "@/components/ui/CTA";
import { HeroSlider } from "@/components/ui/HeroSlider";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { EventCard } from "@/components/events/EventCard";
import { contactConfig, siteConfig } from "@/config/site";
import { industries } from "@/data/industries";
import {
  whyExhibitBenefits,
  whyVisitBenefits,
} from "@/data/exhibitors";
import { faqs } from "@/data/faqs";
import { getSortedEvents, getUpcomingEvents, seriesStats } from "@/data/events";
import { floorPhotos } from "@/data/floorPhotos";
import { faqJsonLd, JsonLd } from "@/lib/seo";

const heroStats = seriesStats;

const marqueeItems = [
  "Machine Tools & CNC",
  "Automation & Robotics",
  "Industry 4.0 & IIoT",
  "Electrical & Electronics",
  "Instrumentation & Measuring",
  "Material Handling",
  "Pneumatics & Hydraulics",
  "Engineering Components",
  "Manufacturing Solutions",
  "Industrial Services",
];

export default function HomePage() {
  const events = getSortedEvents();
  const upcomingEvents = getUpcomingEvents(events.length);
  const featuredFaqs = faqs.filter((item) => item.group === "Exhibiting").slice(0, 5);

  return (
    <>
      {/* ---------------------------------------------------------- */}
      {/* Hero                                                        */}
      {/* ---------------------------------------------------------- */}
      <section className="noise-dark relative isolate overflow-hidden text-white">
        <div className="grid-surface-dark absolute inset-0 opacity-70" />
        <HeroSlider />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-950/40" />
        <div className="hatch-surface absolute inset-x-0 bottom-0 h-1.5" />

        <div className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 sm:py-20 lg:py-28">
          {/* On mobile the editions lead, so a visitor sees what/when/where
              before the brand statement. Desktop keeps copy left, cards right. */}
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="animate-rise order-2 lg:order-1">
              <span className="eyebrow eyebrow-light mb-6">
                {siteConfig.fullName}
              </span>

              <h1 className="display text-[clamp(2.5rem,7vw,5.25rem)]">
                India&apos;s B2B Industrial
                <span className="mt-1 block text-gold-500">&amp; Engineering Expo</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-steel-300 sm:text-lg">
                Three strategic industrial hubs. One powerful business network.
                Meet 500+ exhibitors, see live machinery and connect with the
                buyers who move manufacturing forward.
              </p>

              {/* Two equal columns on mobile so the CTAs sit on one row;
                  flex again once there is room to breathe. */}
              <div className="mt-9 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                <Button
                  href="/exhibitors/book-your-stall"
                  variant="primary"
                  size="lg"
                  withArrow
                  className="px-3 text-[0.95rem] sm:px-8 sm:text-base"
                >
                  Book Your Stall
                </Button>
                <Button
                  href="/visitors/register"
                  variant="gold"
                  size="lg"
                  className="px-3 text-[0.95rem] sm:px-8 sm:text-base"
                >
                  Register as Visitor
                </Button>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm text-steel-300">
                {[
                  "Free trade visitor entry",
                  "Response within one working day",
                  "Early-bird & multi-city offers",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Icon name="check-circle" size={17} className="text-success-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* All three editions as cards */}
            <aside className="order-1 min-w-0 lg:order-2">
              <div className="flex items-center justify-between gap-3">
                <span className="eyebrow eyebrow-light mb-0 text-[11px]">
                  Three Editions · 2026–2027
                </span>
                <span className="border border-success-500/45 bg-success-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-success-500">
                  Bookings Open
                </span>
              </div>

              <ul className="mt-4 grid gap-3">
                {events.map((event) => {
                  // Every edition that has not finished yet gets a live
                  // countdown; once one has run, the next takes over the "Next"
                  // badge automatically.
                  const upcomingIndex = upcomingEvents.findIndex(
                    (upcoming) => upcoming.slug === event.slug,
                  );
                  const isNext = upcomingIndex === 0;
                  const hasCountdown = upcomingIndex > -1;
                  const badge =
                    upcomingIndex === 0
                      ? "Next"
                      : upcomingIndex === 1
                        ? "Then"
                        : "Later";
                  return (
                    <li key={event.slug}>
                      {/* A plain container, not a Link: the card now holds two
                          separate links (view edition + book a stall) and
                          anchors cannot be nested. */}
                      <div className="group border border-white/15 bg-white/[0.06] p-4 backdrop-blur-sm transition hover:border-gold-500/60 hover:bg-white/[0.10] sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="display text-2xl leading-none sm:text-[1.75rem]">
                              {event.city}
                            </h2>
                            <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-gold-500">
                              {event.dateRangeShort} · {event.days} Days
                            </p>
                          </div>
                          {hasCountdown ? (
                            <span
                              className={`shrink-0 border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${
                                isNext
                                  ? "border-gold-500/50 bg-gold-500/15 text-gold-500"
                                  : "border-white/25 bg-white/10 text-steel-300"
                              }`}
                            >
                              {badge}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2.5 flex items-start gap-1.5 text-xs leading-relaxed text-steel-300">
                          <Icon
                            name="map-pin"
                            size={14}
                            className="mt-0.5 shrink-0 text-brand-400"
                          />
                          <span className="min-w-0">
                            {event.venue.name}, {event.venue.locality}
                          </span>
                        </p>

                        {hasCountdown ? (
                          <div className="mt-4 border-t border-white/10 pt-4">
                            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-steel-400">
                              {isNext ? "Countdown" : "Also coming up"}
                            </p>
                            <Countdown
                              target={event.startDate}
                              size="sm"
                              label={`Countdown to INDTEC EXPO ${event.city}`}
                            />
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                          <Button
                            href={`/exhibitors/book-your-stall?event=${event.slug}`}
                            variant="gold"
                            size="sm"
                            className="btn-shine"
                          >
                            Book a Stall
                          </Button>
                          <Link
                            href={`/events/${event.slug}`}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-steel-300 transition hover:text-gold-500"
                          >
                            View edition
                            <Icon name="arrow-right" size={13} />
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Marquee                                                     */}
      {/* ---------------------------------------------------------- */}
      <div className="overflow-hidden border-b border-steel-200 bg-steel-50 py-4">
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="display-sm flex items-center gap-3 text-sm tracking-[0.2em] text-steel-500"
            >
              <span className="h-1.5 w-1.5 bg-signal-500" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Series stats                                                */}
      {/* ---------------------------------------------------------- */}
      <section className="bg-white">
        <Container>
          <StatStrip items={heroStats} />
        </Container>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* About / brand story                                         */}
      {/* ---------------------------------------------------------- */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="About INDTEC EXPO"
              title={
                <>
                  A Business Platform Built for
                  <span className="text-signal-500"> Serious Industry</span>
                </>
              }
              description={siteConfig.shortDescription}
            />

            <ul className="grid gap-5 sm:grid-cols-2">
              {[
                { icon: "/images/about/icons/factory.png", title: "Three Industrial Hubs", text: "Bengaluru, Coimbatore and Hosur editions across one focused season." },
                { icon: "/images/about/icons/decision-makers.png", title: "Decision-Maker Audience", text: "Factory owners, procurement heads, plant engineers and dealers." },
                { icon: "/images/about/icons/technology.png", title: "Live Technology on Floor", text: "Running machinery, demonstrations and new product releases." },
                { icon: "/images/about/icons/outcomes.png", title: "Structured B2B Outcomes", text: "Pre-scheduled buyer meetings, delegations and networking sessions." },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-brand-100 bg-brand-50 p-2">
                    <Image
                      src={item.icon}
                      alt=""
                      width={22}
                      height={22}
                      className="h-full w-auto object-contain"
                    />
                  </span>
                  <div>
                    <h3 className="display-sm text-base text-navy-900">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-steel-600">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="/about" variant="secondary" withArrow>
                About Konnekt Globe
              </Button>
              <Button href="/contact" variant="outline">
                Contact Us
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="grid-surface absolute -inset-4 -z-10" />
            <Image
              src="/images/about/about-floor.webp"
              alt="Visitors and exhibitors on the INDTEC EXPO floor, with an industrial stand and product displays"
              width={1400}
              height={935}
              className="h-auto w-full border border-steel-200"
              sizes="(max-width: 1024px) 100vw, 560px"
              loading="lazy"
            />
            <div className="mt-4 grid grid-cols-3 gap-4">
              {siteConfig.values.map((value, index) => (
                <div
                  key={value}
                  className="border border-steel-200 bg-steel-50 px-3 py-4 text-center"
                >
                  <span className="display-sm block text-navy-900">{value}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-steel-500">
                    0{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Events calendar                                             */}
      {/* ---------------------------------------------------------- */}
      <Section tone="light">
        <SectionHeading
          eyebrow="2026–2027 Calendar"
          title="Three Editions. One Industrial Network."
          description="Each INDTEC EXPO edition is positioned around a specific industrial identity, giving exhibitors a differentiated route into three distinct buyer pools."
          action={
            <Button href="/events" variant="outline" withArrow>
              View All Events
            </Button>
          }
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Industries                                                  */}
      {/* ---------------------------------------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="Industries We Serve"
          title="10 Sectors. 40+ Product Categories."
          description="From CNC machine tools to Industry 4.0 platforms, INDTEC EXPO covers the full industrial value chain."
          align="center"
          action={
            <Button href="/industries" variant="outline" withArrow>
              All Industries
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {industries.map((industry) => (
            <Link
              key={industry.id}
              href={`/industries/${industry.slug}`}
              className="card card-hover group flex flex-col p-5"
            >
              <span className="flex h-12 w-12 items-center justify-center border border-brand-100 bg-brand-50 text-brand-600 transition group-hover:border-signal-500 group-hover:bg-signal-500 group-hover:text-white">
                <Icon name={industry.icon as IconName} size={23} strokeWidth={1.5} />
              </span>
              <h3 className="display-sm mt-4 text-base leading-tight text-navy-900">
                {industry.name}
              </h3>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-steel-600">
                {industry.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
                Explore
                <Icon name="arrow-right" size={13} />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Why exhibit / why visit                                     */}
      {/* ---------------------------------------------------------- */}
      <Section tone="muted" className="grid-surface-dark">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <span className="eyebrow eyebrow-light mb-4">For Exhibitors</span>
            <h2 className="display text-[clamp(1.8rem,3.4vw,2.75rem)]">
              Why Exhibit at INDTEC EXPO
            </h2>

            <ul className="mt-8 space-y-5">
              {whyExhibitBenefits.map((benefit) => (
                <li key={benefit.id} className="flex gap-4 border-b border-white/10 pb-5 last:border-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold-500/35 bg-gold-500/10 text-gold-500">
                    <Icon name={benefit.icon as IconName} size={19} strokeWidth={1.5} />
                  </span>
                  <div>
                    <h3 className="display-sm text-base text-white">{benefit.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-steel-400">
                      {benefit.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <Button href="/exhibitors/why-exhibit" variant="gold" size="lg" withArrow className="mt-8">
              Explore Exhibitor Benefits
            </Button>
          </div>

          <div>
            <span className="eyebrow eyebrow-light mb-4">For Visitors</span>
            <h2 className="display text-[clamp(1.8rem,3.4vw,2.75rem)]">
              Why Visit the Expo
            </h2>

            <ul className="mt-8 space-y-5">
              {whyVisitBenefits.map((benefit) => (
                <li key={benefit.id} className="flex gap-4 border-b border-white/10 pb-5 last:border-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-brand-400/35 bg-brand-500/15 text-brand-300">
                    <Icon name={benefit.icon as IconName} size={19} strokeWidth={1.5} />
                  </span>
                  <div>
                    <h3 className="display-sm text-base text-white">{benefit.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-steel-400">
                      {benefit.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <Button href="/visitors/register" variant="primary" size="lg" withArrow className="mt-8">
              Register as Visitor
            </Button>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Clients                                                    */}
      {/* ---------------------------------------------------------- */}
      <Section tone="light">
        <SectionHeading
          eyebrow="Our Clients"
          title="Our Prestigious Clients"
          description="Machinery builders, automation specialists and engineering enterprises that have exhibited and partnered with the INDTEC EXPO series."
          align="center"
        />

        <div className="border border-steel-200 bg-white p-4 sm:p-6 lg:p-8">
          <Image
            src="/images/clients/client-logos.webp"
            alt="Logos of companies that have exhibited at INDTEC EXPO — including machine tool builders, automation suppliers and engineering component manufacturers"
            width={1600}
            height={873}
            className="h-auto w-full"
            sizes="(max-width: 1280px) 100vw, 1184px"
            loading="lazy"
          />
        </div>

        <div className="mt-10 text-center">
          <Button href="/exhibitors/why-exhibit" variant="outline" withArrow>
            Why Exhibit With Us
          </Button>
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Floor photos                                                */}
      {/* ---------------------------------------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="Expo Gallery"
          title="Inside the INDTEC EXPO Floor"
          description="Live machinery, busy aisles and real conversations from previous editions."
          action={
            <Button href="/gallery" variant="outline" withArrow>
              Open Gallery
            </Button>
          }
        />

        <div className="columns-2 gap-3 sm:gap-4 lg:columns-4">
          {floorPhotos.map((photo) => (
            <figure
              key={photo.id}
              className="group relative mb-3 block break-inside-avoid overflow-hidden border border-steel-200 bg-navy-900 sm:mb-4"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                className="h-auto w-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
              />
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-transparent px-3 pb-2.5 pt-8 text-[11px] font-semibold uppercase leading-snug tracking-[0.1em] text-white">
                {photo.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Testimonials                                               */}
      {/* ---------------------------------------------------------- */}
      {/* FAQ preview                                                 */}
      {/* ---------------------------------------------------------- */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="FAQ"
              title="Questions, Answered"
              description="Everything exhibitors and visitors ask before booking a stall or registering for the expo."
            />
            <ul className="space-y-3 border-t border-steel-200 pt-6">
              {[
                { icon: "phone", label: contactConfig.phones[0].display, href: `tel:${contactConfig.phones[0].tel}` },
                { icon: "mail", label: contactConfig.exhibitorEmail, href: `mailto:${contactConfig.exhibitorEmail}` },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="flex items-center gap-3 text-sm font-semibold text-navy-800 transition hover:text-brand-600"
                  >
                    <span className="flex h-9 w-9 items-center justify-center border border-steel-200 text-brand-600">
                      <Icon name={item.icon as IconName} size={17} />
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <Button href="/faq" variant="secondary" className="mt-6" withArrow>
              All FAQs
            </Button>
          </div>

          <Accordion
            items={featuredFaqs.map((faq) => ({
              id: faq.id,
              question: faq.question,
              answer: faq.answer,
            }))}
            defaultOpenId={featuredFaqs[0]?.id}
          />
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Exhibitor CTA                                               */}
      {/* ---------------------------------------------------------- */}
      <ExhibitorCTA />

      <JsonLd data={faqJsonLd(featuredFaqs.map((f) => ({ question: f.question, answer: f.answer })))} />
    </>
  );
}
