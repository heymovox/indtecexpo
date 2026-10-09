import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { floorPhotos } from "@/data/floorPhotos";
import { buildMetadata } from "@/lib/seo";
import { GalleryGrid } from "./GalleryGrid";

export const metadata = buildMetadata({
  title: "Gallery",
  description:
    "Inside INDTEC EXPO — live machinery, busy aisles, buyer–seller sessions, inaugurations and networking from previous editions across South India.",
  path: "/gallery",
});

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Expo Gallery"
        title="The Floor, As It Actually Looks"
        description="No stock photography. These are the aisles, machines, demonstrations and conversations that define an INDTEC EXPO business day."
        image="/images/floor-photos/floor-20.webp"
        crumbs={[{ label: "Gallery" }]}
        compact
      >
        <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm text-steel-300">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-gold-500" />
            {floorPhotos.length} exhibition photographs
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-gold-500" />
            Exhibitor stands &amp; buyer meetings
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-gold-500" />
            Inaugurations &amp; trade press
          </span>
        </div>
      </PageHero>

      <Section>
        <GalleryGrid />
      </Section>

      <Section tone="muted" className="grid-surface-dark">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="eyebrow eyebrow-light mb-4">See It Live</span>
            <h2 className="display text-[clamp(1.8rem,3.6vw,2.75rem)]">
              Photos Tell Half the Story.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-steel-300">
              The other half happens when a running machine, a specification
              sheet and a purchase decision meet on the same aisle. Register
              free and walk the floor yourself.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button href="/visitors/register" variant="primary" size="lg" withArrow>
              Register as Visitor
            </Button>
            <Button href="/exhibitors/book-your-stall" variant="gold" size="lg">
              Book Your Stall
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
