import { Button } from "@/components/ui/Button";
import { ExhibitorCTA } from "@/components/ui/CTA";
import { HighlightGallery } from "@/components/events/HighlightGallery";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading } from "@/components/ui/Section";
import { industries } from "@/data/industries";
import { floorPhotos } from "@/data/floorPhotos";
import { exhibitableCategories, exhibitorCategories, visitorPrerequisites } from "@/data/exhibitors";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Exhibitor Profile | What's Exhibited & Who Visits INDTEC EXPO",
  description:
    "The INDTEC EXPO exhibitor profile — 10 industry sectors from machine tools to Industry 4.0, plus the buyer personas on floor: factory owners, procurement heads, plant engineers, dealers and consultants.",
  path: "/exhibitors/exhibitor-profile",
  keywords: [
    "exhibitor profile industrial expo",
    "industrial expo exhibitor categories",
    "who visits machine tools expo",
    "B2B industrial buyer audience India",
  ],
});

const gallerySlides = floorPhotos.map((item) => ({
  src: item.src,
  alt: item.alt,
}));

const buyerPersonas: { icon: IconName; title: string; detail: string }[] = [
  {
    icon: "factory",
    title: "Factory Owners & MSME Promoters",
    detail:
      "Decision-makers from small and mid-sized plants across pumps, motors, foundries, textiles, auto components and fabrication — people who approve capital purchases directly.",
  },
  {
    icon: "target",
    title: "Heads of Procurement & Purchase",
    detail:
      "Category managers and purchase heads running vendor evaluations for machines, consumables, components and automation — visiting the floor to compare suppliers side by side.",
  },
  {
    icon: "settings",
    title: "Plant & Maintenance Engineers",
    detail:
      "Production, maintenance and quality engineers who specify the technology, test applications on the stand and carry the technical recommendation back to their teams.",
  },
  {
    icon: "network",
    title: "Dealers & Distributors",
    detail:
      "Channel partners representing industrial brands across South India, actively looking for new lines, territories and agencies to add to their portfolio each season.",
  },
  {
    icon: "search",
    title: "Consultants & Specifiers",
    detail:
      "Design, EPC and turnkey consultants who write equipment specifications into project tenders — and re-specify brands they have seen running in person.",
  },
];

export default function ExhibitorProfilePage() {
  return (
    <>
      <PageHero
        eyebrow="Exhibitor Profile"
        title="What Gets Exhibited — and Who Comes to Buy"
        description="INDTEC EXPO covers the industrial value chain end to end: 10 sectors, 40+ product categories, and a verified trade audience that specifies, buys and supplies them."
        image="/images/gallery/exhibitors-1.svg"
        crumbs={[
          { label: "Exhibitors", href: "/exhibitors" },
          { label: "Exhibitor Profile" },
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <Button href="/exhibitors/book-your-stall" variant="primary" size="lg" withArrow>
            Book Your Stall
          </Button>
          <Button href="/industries" variant="outline-light" size="lg">
            Explore Industries
          </Button>
        </div>
      </PageHero>

      {/* ---------------------------------------------------------- */}
      {/* What gets exhibited                                         */}
      {/* ---------------------------------------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="What Gets Exhibited"
          title="10 Sectors. The Full Industrial Value Chain."
          description="Exhibitors are grouped into ten industry categories, so buyers can find you by walking the zones — and so your stand sits beside the complementary technology it is specified with."
          action={
            <Button href="/exhibitors/book-your-stall" variant="primary" withArrow>
              Claim Your Category
            </Button>
          }
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {exhibitorCategories.map((category) => (
            <article key={category.id} className="card card-hover flex h-full flex-col p-6">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-brand-100 bg-brand-50 text-brand-600">
                  <Icon name={category.icon as IconName} size={23} strokeWidth={1.5} />
                </span>
                <div>
                  <h3 className="display-sm text-base leading-tight text-navy-900">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-signal-500">
                    {category.products.length} product lines
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-steel-600">
                {category.description}
              </p>

              <ul className="mt-4 grid gap-2 border-t border-steel-100 pt-4">
                {category.products.map((product) => (
                  <li
                    key={product}
                    className="flex items-start gap-2 text-[13px] leading-snug text-steel-600"
                  >
                    <Icon
                      name="chevron-right"
                      size={13}
                      className="mt-0.5 shrink-0 text-brand-500"
                    />
                    {product}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-steel-600">
          Don&apos;t see your exact category? INDTEC EXPO regularly accommodates
          adjacent industrial products — mention your application in the enquiry
          form and we will place you in the zone where your buyers walk.
        </p>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Who visits                                                  */}
      {/* ---------------------------------------------------------- */}
      <Section tone="muted" className="grid-surface-dark">
        <div className="mb-12 max-w-3xl">
          <span className="eyebrow eyebrow-light mb-4">Who Visits</span>
          <h2 className="display text-[clamp(1.9rem,4vw,3rem)]">
            Five Buyer Personas on Every Floor
          </h2>
          <p className="mt-4 text-base leading-relaxed text-steel-300 sm:text-lg">
            Entry is free but verified — trade visitors register with their
            company details and are checked at the desk. That keeps the floor
            populated by the people who specify, approve and channel industrial
            products.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {buyerPersonas.map((persona, index) => (
            <article
              key={persona.title}
              className="border border-white/12 bg-white/[0.04] p-6 backdrop-blur transition hover:border-gold-500/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-gold-500/35 bg-gold-500/10 text-gold-500">
                  <Icon name={persona.icon} size={23} strokeWidth={1.5} />
                </span>
                <span className="display tabular text-2xl text-white/15">
                  0{index + 1}
                </span>
              </div>
              <h3 className="display-sm mt-5 text-lg leading-tight text-white">
                {persona.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-steel-400">
                {persona.detail}
              </p>
            </article>
          ))}

          <article className="flex flex-col justify-between border border-gold-500/45 bg-gold-500/10 p-6">
            <div>
              <span className="flex h-12 w-12 items-center justify-center border border-gold-500/45 bg-gold-500/15 text-gold-500">
                <Icon name="ticket" size={23} strokeWidth={1.5} />
              </span>
              <h3 className="display-sm mt-5 text-lg leading-tight text-white">
                Free Trade Entry
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gold-100">
                Visitors register online for a free e-pass, which keeps the
                audience volume high without diluting its quality.
              </p>
            </div>
            <Button href="/visitors/register" variant="gold" size="sm" withArrow className="mt-6">
              Register as Visitor
            </Button>
          </article>
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Who can exhibit                                              */}
      {/* ---------------------------------------------------------- */}
      <Section tone="light">
        <div className="mb-12 max-w-3xl">
          <span className="eyebrow eyebrow-dark mb-4">Who Can Exhibit</span>
          <h2 className="display text-[clamp(1.9rem,4vw,3rem)] text-navy-900">
            {exhibitableCategories.length} Product Categories. One Floor.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-steel-600 sm:text-lg">
            INDTEC EXPO is built for manufacturers, OEM suppliers and
            specialist solution providers. Pick the category closest to what you
            build — we allocate your stand in the zone where your buyers walk.
          </p>
        </div>

        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {exhibitableCategories.map((category) => (
            <li
              key={category}
              className="flex items-start gap-2.5 border border-steel-200 bg-white px-3.5 py-3 text-[13px] leading-snug text-steel-700 transition hover:border-brand-300 hover:text-navy-900"
            >
              <Icon
                name="check"
                size={14}
                strokeWidth={2.2}
                className="mt-0.5 shrink-0 text-brand-600"
              />
              {category}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col gap-6 border border-steel-200 bg-white p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="display-sm text-lg text-navy-900">
              Not listed, but you still build for industry?
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel-600">
              Adjacent industrial products are accommodated every season.
              Describe your application in the enquiry form and we will place you
              alongside the technology your stand is specified with.
            </p>
          </div>
          <Button
            href="/exhibitors/book-your-stall"
            variant="primary"
            size="lg"
            withArrow
            className="shrink-0"
          >
            Book Your Stall
          </Button>
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      {/* Visitor prerequisites                                       */}
      {/* ---------------------------------------------------------- */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Before You Send Your Team"
              title="Visitor Prerequisites at the Gate"
              description="Share this checklist with the buyers, partners and colleagues you invite to the show — it keeps their entry fast and hassle-free."
            />

            <ul className="space-y-4">
              {visitorPrerequisites.map((item) => (
                <li
                  key={item}
                  className="flex gap-4 border-b border-steel-200 pb-4 last:border-0 last:pb-0"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-success-500/30 bg-success-50 text-success-500">
                    <Icon name="check" size={17} strokeWidth={2.2} />
                  </span>
                  <span className="text-sm leading-relaxed text-steel-700 sm:text-base">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/visitors/register" variant="primary" withArrow>
                Register a Visitor
              </Button>
              <Button href="/events" variant="outline">
                See Event Dates
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="grid-surface absolute -inset-4 -z-10" />
            <HighlightGallery
              images={gallerySlides}
              label="Expo highlights"
              autoplay
              intervalMs={4500}
              thumbnails={false}
              className="relative border border-steel-200"
            />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="border border-steel-200 bg-white px-4 py-4 text-center">
                <span className="display block text-2xl text-navy-900">
                  {industries.length}
                </span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-steel-500">
                  Industry Sectors
                </span>
              </div>
              <div className="border border-steel-200 bg-white px-4 py-4 text-center">
                <span className="display block text-2xl text-navy-900">
                  {exhibitableCategories.length}
                </span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-steel-500">
                  Product Categories
                </span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <ExhibitorCTA
        headline="Meet the Buyers Described Above — In Person"
        supportingText="Tell us your product category and preferred city, and we will place your stand where these buyer personas walk."
        secondaryLabel="Why Exhibit"
        secondaryHref="/exhibitors/why-exhibit"
      />
    </>
  );
}
