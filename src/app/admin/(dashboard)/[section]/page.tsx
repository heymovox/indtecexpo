import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { adminConfig } from "@/config/admin";
import {
  listContactMessages,
  listEventOverrides,
  listExhibitorEnquiries,
  listVisitorRegistrations,
} from "@/lib/db";
import { events } from "@/data/events";
import { sponsorTiers } from "@/data/sponsors";
import { galleryImages, galleryCategories } from "@/data/gallery";
import { mediaArticles } from "@/data/media";
import { Icon, type IconName } from "@/components/ui/Icon";
import { RecordsTable, type RecordsTableRow } from "../RecordsTable";
import { EventEditor, type EventEditValues } from "../EventEditor";

export const dynamic = "force-dynamic";

type SectionId =
  | "events"
  | "exhibitors"
  | "bookings"
  | "visitors"
  | "enquiries"
  | "sponsors"
  | "gallery"
  | "floor-plans"
  | "media"
  | "blog"
  | "messages"
  | "settings";

interface SectionParam {
  section: string;
}

function hrefSegment(href: string): string {
  return href.replace(/^\/admin\/?/, "");
}

function resolveSection(slug: string) {
  const section = adminConfig.sections.find(
    (item) => item.id === slug || hrefSegment(item.href) === slug,
  );
  if (!section || section.id === "dashboard") return null;
  return section;
}

export function generateStaticParams(): SectionParam[] {
  return adminConfig.sections
    .filter((section) => section.id !== "dashboard")
    .flatMap((section) => [
      { section: section.id },
      { section: hrefSegment(section.href) },
    ]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<SectionParam>;
}): Promise<Metadata> {
  const { section } = await params;
  const resolved = resolveSection(section);
  return {
    title: `${resolved?.label ?? "Section"} | INDTEC EXPO Admin`,
    robots: { index: false, follow: false },
  };
}

function compact(items: Array<string | undefined | null>): string[] {
  return items.filter((item): item is string => Boolean(item && item.length));
}

function SectionHeading({
  section,
  description,
}: {
  section: { label: string; icon: string };
  description: string;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="eyebrow mb-2 flex items-center gap-2">
          <Icon name={section.icon as IconName} size={14} strokeWidth={1.8} />
          Admin section
        </span>
        <h1 className="display text-3xl text-navy-900 sm:text-4xl">
          {section.label}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-steel-600">{description}</p>
      </div>
      <span className="text-xs uppercase tracking-[0.14em] text-steel-500">
        INDTEC EXPO 2026–2027
      </span>
    </header>
  );
}

function ReadOnlyNote() {
  return (
    <p className="border border-steel-200 bg-white px-4 py-3 text-xs text-steel-500">
      Read-only section — content is maintained in the source files.
    </p>
  );
}

async function exhibitorRows(): Promise<RecordsTableRow[]> {
  const records = await listExhibitorEnquiries();
  return records.map((record) => ({
    id: record.id,
    reference: record.reference,
    title: `${record.companyName} — ${record.contactPerson}`,
    subtitle: record.email,
    meta: compact([
      (record.eventSlugs ?? []).join(", "),
      record.industry,
      `${record.stallSize} · ${record.stalls} stall${record.stalls === 1 ? "" : "s"}`,
      record.designation,
    ]),
    stage: record.stage ?? "new",
    createdAt: record.createdAt,
  }));
}

async function visitorRows(): Promise<RecordsTableRow[]> {
  const records = await listVisitorRegistrations();
  return records.map((record) => ({
    id: record.id,
    reference: record.reference,
    title: `${record.fullName} — ${record.companyName}`,
    subtitle: record.email,
    meta: compact([
      record.designation,
      record.city,
      record.industry,
      record.interests.length
        ? `Interests: ${record.interests.join(", ")}`
        : undefined,
      record.interestedExpos.length
        ? `Expos: ${record.interestedExpos.join(", ")}`
        : undefined,
    ]),
    stage: record.stage ?? "new",
    createdAt: record.createdAt,
  }));
}

async function contactRows(): Promise<RecordsTableRow[]> {
  const records = await listContactMessages();
  return records.map((record) => ({
    id: record.id,
    reference: record.reference,
    title: `${record.subject} — ${record.name}`,
    subtitle: record.email,
    meta: compact([
      record.category,
      record.company,
      record.phone,
      record.message.length > 90 ? `${record.message.slice(0, 90)}…` : record.message,
    ]),
    stage: record.stage ?? "new",
    createdAt: record.createdAt,
  }));
}

async function eventsPanel() {
  const overrides = await listEventOverrides();
  return (
    <div className="grid gap-5">
      {events.map((event) => {
        const override = overrides.find((item) => item.slug === event.slug);
        const values: EventEditValues = {
          slug: event.slug,
          name: override?.name || event.name,
          dateLabel: override?.dateLabel || event.dateLabel,
          dateRangeShort: override?.dateRangeShort || event.dateRangeShort,
          positioning: override?.positioning || event.positioning,
          venueName: override?.venueName || event.venue.name,
          summary: override?.summary || event.summary,
          published: override ? override.published : true,
        };
        return (
          <section key={event.slug} className="card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-steel-100 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-steel-500">
                  {event.edition} · {event.status}
                </p>
                <h2 className="display-sm mt-1 text-xl text-navy-900">
                  {event.name}
                </h2>
              </div>
              <span className="border border-steel-200 bg-steel-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-steel-600">
                {event.dateRangeShort}
              </span>
            </div>
            <EventEditor values={values} hasOverride={Boolean(override)} />
          </section>
        );
      })}
    </div>
  );
}

function sponsorsPanel() {
  return (
    <div className="grid gap-4">
      {sponsorTiers.map((tier) => (
        <section key={tier.id} className="card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="display-sm text-lg text-navy-900">{tier.title}</h2>
            <span className="text-xs text-steel-500">
              {tier.logos.length} partner{tier.logos.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-1 text-sm text-steel-600">{tier.description}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {tier.logos.map((logo) => (
              <li
                key={logo.id}
                className="flex items-center gap-3 border border-steel-200 bg-steel-50 px-3 py-2.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.logo} alt="" className="h-7 w-auto max-w-24 object-contain" />
                <span className="min-w-0 truncate text-sm font-medium text-navy-900">
                  {logo.name}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function galleryPanel() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {galleryCategories.map((category) => {
          const count = galleryImages.filter(
            (image) => image.category === category,
          ).length;
          return (
            <div key={category} className="card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-steel-500">
                {category}
              </p>
              <p className="display tabular mt-2 text-2xl text-navy-900">
                {count}
              </p>
            </div>
          );
        })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {galleryImages.map((image) => (
          <figure key={image.id} className="card overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.image}
              alt={image.title}
              className="h-36 w-full object-cover"
            />
            <figcaption className="px-3 py-2.5">
              <p className="truncate text-sm font-medium text-navy-900">
                {image.title}
              </p>
              <p className="text-xs text-steel-500">{image.category}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function floorPlanPanel() {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-[0.12em] text-steel-500">
            <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
              Event
            </th>
            <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
              Plan Image
            </th>
            <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
              PDF
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.slug}
              className="border-b border-steel-100 last:border-b-0"
            >
              <td className="px-4 py-3 font-medium text-navy-900 sm:px-5">
                {event.name}
                <span className="block text-xs font-normal text-steel-500">
                  /{event.slug}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-steel-600 sm:px-5">
                {event.floorPlanImage}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-steel-600 sm:px-5">
                {event.floorPlanPdf}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function articlesPanel() {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-[0.12em] text-steel-500">
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
                Title
              </th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
                Category
              </th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
                Date
              </th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
                Read time
              </th>
            </tr>
          </thead>
          <tbody>
            {mediaArticles.map((article) => (
              <tr
                key={article.slug}
                className="border-b border-steel-100 last:border-b-0"
              >
                <td className="px-4 py-3 font-medium text-navy-900 sm:px-5">
                  {article.title}
                  <span className="block max-w-xl truncate text-xs font-normal text-steel-500">
                    {article.excerpt}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-steel-600 sm:px-5">
                  {article.category}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-steel-500 sm:px-5">
                  {article.dateLabel}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-steel-500 sm:px-5">
                  {article.readTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function settingsPanel() {
  const rows: Array<{ label: string; value: string }> = [
    {
      label: "Admin sign-in",
      value: process.env.ADMIN_EMAIL ?? adminConfig.defaultEmail,
    },
    { label: "Session lifetime", value: "8 hours" },
    { label: "Login rate limit", value: "5 attempts / minute" },
    { label: "Public form rate limit", value: "8 submissions / minute / IP" },
    { label: "Storage", value: "File-backed store in /.data (JSON)" },
    { label: "Notifications", value: "Email dispatch with in-app log" },
  ];
  return (
    <div className="card p-5">
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="border-b border-steel-100 pb-3">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-steel-500">
              {row.label}
            </dt>
            <dd className="mt-1 text-sm text-navy-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<SectionParam>;
}) {
  const { section: slug } = await params;
  const section = resolveSection(slug);
  if (!section) notFound();

  const id = section.id as SectionId;

  let body: ReactNode;
  let description = "";

  switch (id) {
    case "events":
      description = "Dates, venues and visibility for the three editions.";
      body = await eventsPanel();
      break;
    case "exhibitors":
      description = "Exhibitor enquiries submitted through the website forms.";
      body = (
        <RecordsTable
          kind="exhibitor"
          label="Exhibitor Enquiries"
          rows={await exhibitorRows()}
          emptyMessage="No exhibitor enquiries yet."
        />
      );
      break;
    case "bookings":
      description = "Stall booking pipeline — proposals sent and deals won.";
      body = (
        <RecordsTable
          kind="exhibitor"
          label="Stall Bookings"
          rows={(await exhibitorRows()).filter((row) =>
            row.stage === "proposal" || row.stage === "won",
          )}
          emptyMessage="No bookings in the proposal or won stages yet."
        />
      );
      break;
    case "visitors":
      description = "Visitor pre-registrations across the expo editions.";
      body = (
        <RecordsTable
          kind="visitor"
          label="Visitor Registrations"
          rows={await visitorRows()}
          emptyMessage="No visitor registrations yet."
        />
      );
      break;
    case "enquiries":
      description = "General enquiries captured from the website.";
      body = (
        <RecordsTable
          kind="contact"
          label="Enquiries"
          rows={await contactRows()}
          emptyMessage="No enquiries yet."
        />
      );
      break;
    case "messages":
      description = "Messages received through the contact page.";
      body = (
        <RecordsTable
          kind="contact"
          label="Contact Messages"
          rows={await contactRows()}
          emptyMessage="No contact messages yet."
        />
      );
      break;
    case "sponsors":
      description = "Sponsorship tiers and partners.";
      body = (
        <div className="space-y-4">
          <ReadOnlyNote />
          {sponsorsPanel()}
        </div>
      );
      break;
    case "gallery":
      description = "Published gallery images by category.";
      body = (
        <div className="space-y-4">
          <ReadOnlyNote />
          {galleryPanel()}
        </div>
      );
      break;
    case "floor-plans":
      description = "Floor plan assets linked to each event.";
      body = (
        <div className="space-y-4">
          <ReadOnlyNote />
          {floorPlanPanel()}
        </div>
      );
      break;
    case "media":
      description = "News, press releases and industry coverage.";
      body = (
        <div className="space-y-4">
          <ReadOnlyNote />
          {articlesPanel()}
        </div>
      );
      break;
    case "blog":
      description = "Articles and expo updates.";
      body = (
        <div className="space-y-4">
          <ReadOnlyNote />
          {articlesPanel()}
        </div>
      );
      break;
    case "settings":
      description = "Platform configuration overview.";
      body = (
        <div className="space-y-4">
          <ReadOnlyNote />
          {settingsPanel()}
        </div>
      );
      break;
    default:
      notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeading section={section} description={description} />
      {body}
    </div>
  );
}
