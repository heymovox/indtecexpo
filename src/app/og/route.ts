import type { NextRequest } from "next/server";
import { renderOgCard } from "@/lib/og-card";
import { OG_CARD_BY_SLUG } from "@/lib/og-cards";
import { getPublicEvents } from "@/data/events.server";

/**
 * Social share image endpoint.
 *
 * A plain route handler rather than the `opengraph-image.tsx` file convention.
 * The convention injects its own meta tags and, in this app, only the root
 * segment's card was being injected — nested cards were registered and served
 * but silently skipped for the page's <head>. Owning the URL means every page
 * gets exactly one og:image, which is always a PNG.
 *
 * Query parameters override the preset, so a dynamic route can put its own
 * title on the card:  /og?card=event&title=INDTEC%20EXPO%202026%20Bengaluru
 */

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const cardName = params.get("card") ?? "";
  const preset = OG_CARD_BY_SLUG[cardName] ?? OG_CARD_BY_SLUG.brand;

  // The events card headline follows the live edition count rather than the
  // static "Three Cities, Three Editions" preset.
  let presetTitle = preset.title;
  if (cardName === "events") {
    try {
      const events = await getPublicEvents();
      presetTitle = `${events.length} ${events.length === 1 ? "City" : "Cities"}, ${events.length} ${events.length === 1 ? "Edition" : "Editions"}`;
    } catch {
      /* fall back to the preset title if the database is unreachable */
    }
  }

  const chipsRaw = params.get("chips");
  const chips = chipsRaw
    ? chipsRaw.split(",").map((chip) => chip.trim()).filter(Boolean).slice(0, 4)
    : preset.chips;

  const title = (params.get("title") ?? presetTitle).slice(0, 90);
  const description = (params.get("description") ?? preset.description)?.slice(0, 240);
  const eyebrow = (params.get("eyebrow") ?? preset.eyebrow)?.slice(0, 40);

  return renderOgCard({ eyebrow, title, description, chips });
}