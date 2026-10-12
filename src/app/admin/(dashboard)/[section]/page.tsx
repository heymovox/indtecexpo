import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { adminConfig } from "@/config/admin";
import { getAdmin } from "@/app/api/admin/_lib/auth";
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
import { StorageManager } from "@/components/admin/StorageManager";
import { RecordsTable, type RecordsTableRow } from "../RecordsTable";
import { EventsManager, type EventAdminItem } from "../EventsManager";

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
  | "settings"
  | "users";

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
      ...(record.visitingSchedule ?? []).map((entry) => `Visiting: ${entry}`),
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

async function eventsPanel(readOnly = false) {
      const overrides = await listEventOverrides();
    const overrideSlugs = new Set(overrides.map((item) => item.slug));

    const items: EventAdminItem[] = events.map((event) => {
      const override = overrides.find((item) => item.slug === event.slug);
      return {
        id: override?.id ?? null,
        slug: event.slug,
        name: override?.name || event.name,
        city: override?.city || event.city,
        state: override?.state || event.state,
        edition: override?.edition || event.edition,
        dateLabel: override?.dateLabel || event.dateLabel,
        dateRangeShort: override?.dateRangeShort || event.dateRangeShort,
        positioning: override?.positioning || event.positioning,
        venueName: override?.venueName || event.venue.name,
        venueAddress: override?.venueAddress || event.venue.address,
        summary: override?.summary || event.summary,
        description: override?.description?.length
          ? override.description
          : [...event.description],
        sectors: override?.sectors?.length ? override.sectors : [...event.sectors],
        highlights: override?.highlights?.length
          ? override.highlights
          : [...event.highlights],
        bannerImage: override?.bannerImage || event.heroImage,
        posterImage: override?.posterImage || event.posterImage,
        floorPlanImage: override?.floorPlanImage || event.floorPlanImage,
        floorPlanPdf: override?.floorPlanPdf || event.floorPlanPdf,
        startDate: override?.startDate || event.startDate,
        endDate: override?.endDate || event.endDate,
        days: override?.days ?? event.days,
        monthLabel: override?.monthLabel || event.monthLabel,
        status: override?.status ?? event.status,
        published: override ? override.published : true,
        hasOverride: Boolean(override),
        createdAt: override?.createdAt,
        updatedAt: override?.updatedAt,
      };
    });

    for (const override of overrides) {
      if (overrideSlugs.has(override.slug)) continue;
      items.push({
        id: override.id,
        slug: override.slug,
        name: override.name,
        city: override.city ?? "",
        state: override.state ?? "",
        edition: override.edition ?? "",
        dateLabel: override.dateLabel,
        dateRangeShort: override.dateRangeShort,
        positioning: override.positioning,
        venueName: override.venueName,
        venueAddress: override.venueAddress ?? "",
        summary: override.summary,
        description: override.description ?? [],
        sectors: override.sectors ?? [],
        highlights: override.highlights ?? [],
        bannerImage: override.bannerImage ?? "",
        posterImage: override.posterImage ?? "",
        floorPlanImage: override.floorPlanImage ?? "",
        floorPlanPdf: override.floorPlanPdf ?? "",
        startDate: override.startDate ?? "",
        endDate: override.endDate ?? "",
        days: override.days ?? 3,
        monthLabel: override.monthLabel ?? "",
        status: override.status ?? "upcoming",
        published: override.published,
        hasOverride: true,
        createdAt: override.createdAt,
        updatedAt: override.updatedAt,
      });
    }

    return <EventsManager items={items} readOnly={readOnly} />;
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

function settingsPanel(identity: { id: string; email: string; name: string | null; role: string }) {
  return (
    <div className="card p-5">
      <h2 className="display-sm mb-4 text-lg text-navy-900">Your Profile</h2>
      <form action="/api/admin/profile" method="POST" className="space-y-4 max-w-md">
        <input type="hidden" name="id" value={identity.id} />
        <div>
          <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-[0.12em] text-steel-500 mb-1">
            Display Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={identity.name ?? ""}
            className="w-full rounded-xl border border-steel-200 bg-white px-3 py-2 text-sm text-navy-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200/60"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-[0.12em] text-steel-500 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={identity.email}
            disabled
            className="w-full rounded-xl border border-steel-200 bg-steel-50 px-3 py-2 text-sm text-steel-600"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-steel-500 mb-1">
            Role
          </label>
          <span className="inline-flex items-center rounded-full border border-steel-200 bg-steel-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-steel-600">
            {identity.role}
          </span>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}

async function usersPanel() {
  const { listAdmins } = await import("@/lib/admin-db");
  const admins = await listAdmins();
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow mb-2">User Management</span>
          <h2 className="display-sm text-lg text-navy-900 sm:text-xl">Admin Users</h2>
        </div>
<Link
            href="/admin/users/new"
            className="btn btn-primary shrink-0"
          >
            <span className="flex items-center gap-2">
              <Icon name="plus" size={16} strokeWidth={2} />
              Add User
            </span>
          </Link>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-[0.12em] text-steel-500">
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">Name</th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">Email</th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">Role</th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">Status</th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">Last Login</th>
              <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-steel-500 sm:px-5">
                  No admin users yet.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="border-b border-steel-100 last:border-b-0 hover:bg-steel-25">
                  <td className="px-4 py-3 font-medium text-navy-900 sm:px-5">
                    {admin.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-steel-600 sm:px-5">{admin.email}</td>
                  <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                      style={{
                        backgroundColor: admin.role === "superadmin" ? "#FEF3C7" : admin.role === "admin" ? "#DBEAFE" : "#F3F4F6",
                        borderColor: admin.role === "superadmin" ? "#F59E0B" : admin.role === "admin" ? "#3B82F6" : "#9CA3AF",
                        color: admin.role === "superadmin" ? "#92400E" : admin.role === "admin" ? "#1E40AF" : "#374151",
                      }}
                    >
                      {admin.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm sm:px-5">
                    <span className={admin.disabledAt ? "text-signal-600" : "text-emerald-700"}>
                      {admin.disabledAt ? "Disabled" : "Active"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-steel-500 sm:px-5">
                    {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    <a
                      href={`/admin/users/${admin.id}`}
                      className="text-brand-700 underline-offset-2 hover:underline text-sm"
                    >
                      Edit
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<SectionParam>;
}) {
  const identity = await getAdmin();
  if (!identity) {
    redirect("/admin/login");
  }

  const { section: slug } = await params;
  const section = resolveSection(slug);
  if (!section) notFound();

  // Role-based access control
  const allowedRoles = section.roles ?? [];
  if (allowedRoles.length > 0 && ![...allowedRoles].includes(identity.role)) {
    notFound();
  }

  const id = section.id as SectionId;

  let body: ReactNode;
  let description = "";

  switch (id) {
case "events":
        description = "Dates, venues and visibility for the three editions.";
        body = await eventsPanel(identity.role !== "superadmin");
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
          <StorageManager
            folder="gallery"
            title="Upload gallery images"
            hint="Images uploaded here are stored in Cloudflare R2 and listed below. The site gallery still uses the curated set; these are for review and future publishing."
          />
          {galleryPanel()}
        </div>
      );
      break;
    case "floor-plans":
      description = "Floor plan assets linked to each event.";
      body = (
        <div className="space-y-4">
          <StorageManager
            folder="floor-plans"
            title="Upload floor plan artwork"
            hint="Floor plans shown on the site are rendered from stall data. Upload source artwork or supporting drawings here."
          />
          {floorPlanPanel()}
        </div>
      );
      break;
    case "media":
      description = "News, press releases and industry coverage.";
      body = (
        <div className="space-y-4">
          <StorageManager
            folder="media"
            title="Upload media artwork"
            hint="Press images, posters and article artwork are stored in Cloudflare R2. Copy a link to use it anywhere on the site."
          />
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
        description = "Manage your profile and preferences.";
        body = settingsPanel(identity);
        break;
      case "users":
        description = "Manage admin users and their roles.";
        body = await usersPanel();
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
