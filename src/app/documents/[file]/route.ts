import { siteConfig } from "@/config/site";
import { eventBySlug } from "@/data/events";
import { createTextPdf, type PdfLine } from "@/lib/pdf";

export const dynamic = "force-dynamic";

const FILE_PATTERN = /^floor-plan-([a-z0-9-]+)\.pdf$/i;

function buildLines(slug: string): PdfLine[] | null {
  const event = eventBySlug(slug.toLowerCase());
  if (!event) return null;

  const lines: PdfLine[] = [
    { text: "INDTEC EXPO 2026-2027", size: 20, bold: true, color: "navy" },
    {
      text: `${event.city} Edition - ${event.positioning}`,
      size: 13,
      bold: true,
      color: "accent",
      spaceBefore: 3,
    },
    { text: "", rule: true },

    { text: "VENUE & DATES", size: 9, bold: true, color: "muted" },
    { text: event.venue.name, size: 12.5, bold: true, color: "navy", spaceBefore: 3 },
    { text: event.venue.address },
    { text: `${event.venue.city}, ${event.venue.state}` },
    { text: `Dates: ${event.dateLabel} (${event.days} business days)`, spaceBefore: 4 },
    { text: "Exhibition hours: 09:00 - 18:00 IST", size: 9, color: "muted" },

    { text: "", rule: true },
    { text: "STALL CONFIGURATION", size: 9, bold: true, color: "muted" },
    ...event.stallOptions.flatMap((option, index): PdfLine[] => [
      {
        text: `${index + 1}. ${option.name} - ${option.size} - ${option.price}`,
        size: 11.5,
        bold: true,
        color: "navy",
        spaceBefore: index === 0 ? 3 : 7,
      },
      { text: `     Includes: ${option.includes.join(", ")}`, size: 9.5 },
    ]),

    { text: "", rule: true },
    { text: "FLOOR ZONING", size: 9, bold: true, color: "muted" },
    { text: "- Main aisles are 3.0 m wide; corner and island stalls get dual aisle access.", spaceBefore: 3 },
    { text: "- Registration and visitor help desk sit at the primary entrance." },
    { text: "- Conference zone, live demonstration area and buyer-seller meeting pods are marked on the interactive plan." },
    { text: "- Food court and exhibitor lounge are located at the rear of the hall." },
    { text: "- Machinery foundation and three-phase power are allotted separately on confirmation." },

    { text: "", rule: true },
    { text: "VISUAL PLAN & BOOKINGS", size: 9, bold: true, color: "muted" },
    { text: "The visual layout, aisle access and stall numbers are published at:", spaceBefore: 3 },
    { text: `${siteConfig.url}/floor-plan`, bold: true, color: "navy", size: 11 },
    { text: `Book a stall: ${siteConfig.url}/exhibitors/book-your-stall`, spaceBefore: 5 },
    {
      text: `Enquiries: +91 ${siteConfig.primaryPhone.slice(0, 5)} ${siteConfig.primaryPhone.slice(5)} | ${siteConfig.exhibitorEmail}`,
      size: 9.5,
      color: "muted",
    },
    { text: "Sector coverage: " + event.sectors.join(" | "), size: 9.5, color: "muted", spaceBefore: 5 },
  ];

  return lines;
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ file: string }> },
) {
  const { file } = await ctx.params;
  const match = FILE_PATTERN.exec(file);
  const lines = match ? buildLines(match[1]) : null;

  if (!lines) {
    return new Response("Not found", { status: 404 });
  }

  const pdf = createTextPdf(lines);

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${file}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
