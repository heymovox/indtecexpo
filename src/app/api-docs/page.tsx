import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "API Documentation | INDTEC EXPO",
  description:
    "Complete API reference for the INDTEC EXPO platform. Public form endpoints, admin management APIs, authentication, rate limits, and response formats.",
  robots: { index: true, follow: true },
};

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface ApiEndpoint {
  method: Method;
  path: string;
  auth: "public" | "admin" | "superadmin";
  description: string;
  body?: string;
  query?: string;
  response: string;
}

interface ApiGroup {
  title: string;
  description: string;
  endpoints: ApiEndpoint[];
}

const METHOD_COLORS: Record<Method, string> = {
  GET: "bg-emerald-50 text-emerald-700 border-emerald-200",
  POST: "bg-brand-50 text-brand-700 border-brand-200",
  PATCH: "bg-gold-50 text-gold-700 border-gold-300",
  PUT: "bg-gold-50 text-gold-700 border-gold-300",
  DELETE: "bg-signal-50 text-signal-700 border-signal-100",
};

const AUTH_BADGES: Record<string, { label: string; className: string }> = {
  public: { label: "Public", className: "bg-steel-50 text-steel-600 border-steel-200" },
  admin: { label: "Admin", className: "bg-brand-50 text-brand-700 border-brand-200" },
  superadmin: { label: "Superadmin", className: "bg-gold-50 text-gold-700 border-gold-300" },
};

const API_GROUPS: ApiGroup[] = [
  {
    title: "Public Forms",
    description:
      "Endpoints for website form submissions. All enforce same-origin checks and IP-based rate limiting.",
    endpoints: [
      {
        method: "POST",
        path: "/api/contact",
        auth: "public",
        description: "Submit a contact form message. Saves the record and sends a notification email to the desk.",
        body: `{
  "name": "string (required)",
  "email": "string (required)",
  "subject": "string (required)",
  "message": "string (required)"
}`,
        response: `{
  "ok": true,
  "id": "string",
  "reference": "string"
}`,
      },
      {
        method: "POST",
        path: "/api/exhibitor-enquiry",
        auth: "public",
        description:
          "Submit an exhibitor stall enquiry. Saves the record, sends a confirmation email to the enquirer, a notification to the desk, and a WhatsApp receipt.",
        body: `{
  "companyName": "string (required)",
  "contactPerson": "string (required)",
  "email": "string (required)",
  "phone": "string (required)",
  "eventSlugs": "string[] (required)",
  "stallSize": "string (required)",
  "stalls": "number (required)",
  "stallCodes": "string[] (optional)",
  "powerLoad": "string (optional)",
  "machinery": "string (optional)",
  "water": "string (optional)",
  "branding": "string (optional)",
  "sponsorship": "string (optional)",
  "productCategory": "string (required)",
  "whatsappConsent": "boolean (optional)"
}`,
        response: `{
  "ok": true,
  "id": "string",
  "reference": "string",
  "whatsapp": "string"
}`,
      },
      {
        method: "POST",
        path: "/api/visitor-registration",
        auth: "public",
        description:
          "Submit a visitor registration. Saves the record, sends a confirmation email, a notification to the desk, and a WhatsApp receipt.",
        body: `{
  "fullName": "string (required)",
  "email": "string (required)",
  "phone": "string (required)",
  "companyName": "string (optional)",
  "interestedExpos": "string[] (required)",
  "visitingSchedule": "string[] (optional)",
  "whatsappConsent": "boolean (optional)"
}`,
        response: `{
  "ok": true,
  "id": "string",
  "reference": "string",
  "whatsapp": "string"
}`,
      },
      {
        method: "POST",
        path: "/api/unsubscribe",
        auth: "public",
        description:
          "Apply an unsubscribe from a tokenised email link. POST-only by design so prefetchers cannot trigger it.",
        body: `{
  "token": "string (required, 1-600 chars)"
}`,
        response: `{
  "ok": true
}`,
      },
    ],
  },
  {
    title: "Admin Authentication",
    description:
      "Session-based authentication for the admin dashboard. Sessions expire after 8 hours and are stored in the database for immediate revocation.",
    endpoints: [
      {
        method: "POST",
        path: "/api/admin/login",
        auth: "public",
        description:
          "Authenticate an admin. Issues a session cookie and returns the redirect URL. Rate-limited to 5 attempts per 60 seconds per IP.",
        body: `{
  "email": "string (required)",
  "password": "string (required)"
}`,
        response: `{
  "ok": true,
  "redirect": "https://app.indtecexpo.com/admin",
  "admin": {
    "email": "string",
    "name": "string | null",
    "role": "staff | admin | superadmin"
  }
}`,
      },
      {
        method: "POST",
        path: "/api/admin/logout",
        auth: "admin",
        description: "Revoke the current admin session. Deletes the database session row and clears the cookie.",
        response: `{ "ok": true }`,
      },
      {
        method: "GET",
        path: "/api/admin/me",
        auth: "admin",
        description: "Returns the signed-in admin's identity so the dashboard can gate UI by role.",
        response: `{
  "ok": true,
  "admin": {
    "email": "string",
    "name": "string | null",
    "role": "staff | admin | superadmin"
  }
}`,
      },
      {
        method: "POST",
        path: "/api/admin/profile",
        auth: "admin",
        description: "Update an admin's display name. Users can only edit themselves unless they are a superadmin.",
        body: `{
  "id": "string (required)",
  "name": "string | null (optional, max 80)"
}`,
        response: `{
  "ok": true,
  "admin": { "id": "string", "email": "string", "name": "string | null", "role": "string" }
}`,
      },
    ],
  },
  {
    title: "Admin Users",
    description:
      "Full CRUD for admin user accounts. Creating, updating, and deleting users requires the superadmin role.",
    endpoints: [
      {
        method: "GET",
        path: "/api/admin/admins",
        auth: "admin",
        description: "List all admin users. Pass ?id= to fetch a single user.",
        query: "id (optional)",
        response: `{
  "ok": true,
  "admins": [{
    "id": "string",
    "email": "string",
    "name": "string | null",
    "role": "staff | admin | superadmin",
    "createdAt": "string",
    "lastLoginAt": "string | null",
    "disabledAt": "string | null"
  }]
}`,
      },
      {
        method: "POST",
        path: "/api/admin/admins",
        auth: "superadmin",
        description: "Create a new admin user. Returns 409 if the email is already registered.",
        body: `{
  "email": "string (required)",
  "name": "string (optional, max 80)",
  "role": "staff | admin | superadmin (default: staff)",
  "password": "string (required, 12-200 chars)"
}`,
        response: `{
  "ok": true,
  "admin": { "id": "string", "email": "string", "name": "string | null", "role": "string" }
}`,
      },
      {
        method: "PATCH",
        path: "/api/admin/admins",
        auth: "superadmin",
        description: "Update an admin's name, role, or password. Changing a password ends all existing sessions for that user.",
        query: "id (required)",
        body: `{
  "name": "string | null (optional)",
  "role": "staff | admin | superadmin (optional)",
  "password": "string (optional, 12-200)"
}`,
        response: `{
  "ok": true,
  "admin": { ... },
  "reauth": "boolean (true if password was changed)"
}`,
      },
      {
        method: "PUT",
        path: "/api/admin/admins",
        auth: "superadmin",
        description: "Enable or disable an admin account. Disabling revokes all sessions. Blocks self-disable and disabling the last superadmin.",
        query: "id (required)",
        response: `{
  "ok": true,
  "admin": { ... }
}`,
      },
      {
        method: "DELETE",
        path: "/api/admin/admins",
        auth: "superadmin",
        description: "Permanently delete an admin user. Blocks self-delete and deleting the last superadmin.",
        query: "id (required)",
        response: `{
  "ok": true,
  "deleted": "string (email of deleted user)"
}`,
      },
    ],
  },
  {
    title: "Admin Events",
    description:
      "Manage per-edition event overrides. Events are defined in source files; overrides let you edit dates, venues, images, and content without redeploying.",
    endpoints: [
      {
        method: "GET",
        path: "/api/admin/events",
        auth: "admin",
        description: "List all event overrides merged with the base event definitions.",
        response: `{
  "ok": true,
  "events": [{ ... }]
}`,
      },
      {
        method: "PUT",
        path: "/api/admin/events",
        auth: "admin",
        description: "Create or update an event override. The slug identifies which edition to override.",
        body: `{
  "slug": "string (required)",
  "name": "string (required)",
  "dateLabel": "string (required)",
  "dateRangeShort": "string (required)",
  "positioning": "string (required)",
  "venueName": "string (required)",
  "venueAddress": "string (optional)",
  "summary": "string (required)",
  "city": "string (optional)",
  "state": "string (optional)",
  "edition": "string (optional)",
  "status": "upcoming | live | completed",
  "days": "number (1-60, default 3)",
  "sectors": "string[] (optional)",
  "highlights": "string[] (optional)",
  "description": "string[] (optional)",
  "published": "boolean (required)"
}`,
        response: `{
  "ok": true,
  "event": { ... }
}`,
      },
      {
        method: "DELETE",
        path: "/api/admin/events",
        auth: "admin",
        description: "Delete an event override record.",
        query: "id (required)",
        response: `{ "ok": true }`,
      },
    ],
  },
  {
    title: "Admin Leads",
    description:
      "Manage exhibitor enquiries, visitor registrations, and contact messages. Leads are stored with PII encrypted at rest.",
    endpoints: [
      {
        method: "GET",
        path: "/api/admin/leads",
        auth: "admin",
        description: "List all leads with optional filtering by type and stage.",
        query: "type (exhibitor | visitor | contact), stage (new | contacted | qualified | proposal | won | lost)",
        response: `{
  "ok": true,
  "leads": [{
    "id": "string",
    "reference": "string",
    "type": "Exhibitor | Visitor | Contact",
    "title": "string",
    "subtitle": "string",
    "stage": "string",
    "notes": "string",
    "createdAt": "string",
    "fields": { ... }
  }]
}`,
      },
      {
        method: "GET",
        path: "/api/admin/leads/[id]",
        auth: "admin",
        description: "Fetch a single lead by ID. Searches across all three collections unless type is specified.",
        query: "type (exhibitor | visitor | contact, optional)",
        response: `{
  "ok": true,
  "lead": { ... }
}`,
      },
      {
        method: "PATCH",
        path: "/api/admin/leads/[id]",
        auth: "admin",
        description: "Update a lead's stage and/or notes.",
        body: `{
  "stage": "new | contacted | qualified | proposal | won | lost (required)",
  "notes": "string (optional, max 2000)",
  "type": "exhibitor | visitor | contact (required)"
}`,
        response: `{
  "ok": true,
  "lead": { ... }
}`,
      },
      {
        method: "DELETE",
        path: "/api/admin/leads/[id]",
        auth: "superadmin",
        description: "Permanently delete a lead record.",
        query: "type (exhibitor | visitor | contact, required)",
        response: `{ "ok": true }`,
      },
    ],
  },
  {
    title: "Admin Gallery",
    description:
      "Manage gallery image metadata. Images are uploaded via /api/admin/upload and stored in Cloudflare R2.",
    endpoints: [
      {
        method: "GET",
        path: "/api/admin/gallery",
        auth: "superadmin",
        description: "List all gallery items with their metadata.",
        response: `{
  "ok": true,
  "items": [{ ... }]
}`,
      },
      {
        method: "POST",
        path: "/api/admin/gallery",
        auth: "superadmin",
        description: "Create a gallery item. The image must already be uploaded to R2.",
        body: `{
  "title": "string (required)",
  "category": "Expo | Exhibitors | Visitors | Machines | Networking | Events",
  "objectKey": "string (required, must start with gallery/)",
  "caption": "string (optional)",
  "alt": "string (optional)",
  "width": "number (optional)",
  "height": "number (optional)",
  "order": "number (optional)",
  "published": "boolean (optional)"
}`,
        response: `{
  "ok": true,
  "item": { ... }
}`,
      },
      {
        method: "PATCH",
        path: "/api/admin/gallery",
        auth: "superadmin",
        description: "Update a gallery item's metadata.",
        body: `{ ...createSchema, "id": "string (required)" }`,
        response: `{
  "ok": true,
  "item": { ... }
}`,
      },
      {
        method: "DELETE",
        path: "/api/admin/gallery",
        auth: "superadmin",
        description: "Delete a gallery item and its associated R2 object.",
        query: "id (required)",
        response: `{ "ok": true }`,
      },
      {
        method: "GET",
        path: "/api/admin/gallery/import",
        auth: "superadmin",
        description: "Check how many hosted photos are available for import vs. already imported.",
        response: `{
  "ok": true,
  "total": "number",
  "imported": "number",
  "pending": "number"
}`,
      },
      {
        method: "POST",
        path: "/api/admin/gallery/import",
        auth: "superadmin",
        description: "Import all hosted photos from /public into the gallery collection. Idempotent.",
        response: `{
  "ok": true,
  "created": "number",
  "skipped": "number",
  "available": "number"
}`,
      },
    ],
  },
  {
    title: "Admin Floor Plans",
    description:
      "Manage floor-plan artwork and PDF records per edition. Files are uploaded via /api/admin/upload.",
    endpoints: [
      {
        method: "GET",
        path: "/api/admin/floor-plans",
        auth: "superadmin",
        description: "List all floor-plan records.",
        response: `{
  "ok": true,
  "items": [{ ... }]
}`,
      },
      {
        method: "PUT",
        path: "/api/admin/floor-plans",
        auth: "superadmin",
        description: "Create or update a floor-plan record. At least one of imageKey or pdfKey must be provided.",
        body: `{
  "slug": "bengaluru | coimbatore | hosur (required)",
  "imageKey": "string (optional, must start with floor-plans/)",
  "pdfKey": "string (optional, must start with floor-plans/)",
  "imageAlt": "string (optional)",
  "pdfLabel": "string (optional)"
}`,
        response: `{
  "ok": true,
  "item": { ... }
}`,
      },
      {
        method: "DELETE",
        path: "/api/admin/floor-plans",
        auth: "superadmin",
        description: "Remove a floor-plan record and delete associated R2 objects.",
        query: "slug (required)",
        response: `{ "ok": true }`,
      },
    ],
  },
  {
    title: "Admin Storage & Upload",
    description:
      "Upload files to Cloudflare R2 and manage stored objects. All uploads are authenticated and folder-scoped.",
    endpoints: [
      {
        method: "POST",
        path: "/api/admin/upload",
        auth: "admin",
        description:
          "Upload a file to Cloudflare R2 via multipart/form-data. Max 10 MB. Allowed types: jpeg, png, webp, avif, gif, svg, pdf.",
        body: `multipart/form-data:
  file: File (required)
  folder: media | gallery | floor-plans | posters | logos (default: media)`,
        response: `{
  "ok": true,
  "key": "string",
  "size": "number",
  "contentType": "string",
  "url": "string (presigned 1h URL)"
}`,
      },
      {
        method: "GET",
        path: "/api/admin/storage",
        auth: "admin",
        description: "List R2 objects, optionally filtered by prefix. Returns presigned URLs valid for 1 hour.",
        query: "prefix (optional)",
        response: `{
  "ok": true,
  "configured": "boolean",
  "objects": [{ "key": "string", "size": "number", "url": "string", ... }]
}`,
      },
      {
        method: "DELETE",
        path: "/api/admin/storage",
        auth: "admin",
        description: "Delete an R2 object by key.",
        query: "key (required)",
        response: `{
  "ok": true,
  "deleted": "string"
}`,
      },
      {
        method: "GET",
        path: "/api/admin/object",
        auth: "admin",
        description: "Stream a private R2 object through the app for same-origin admin previews.",
        query: "key (required)",
        response: "Binary stream with appropriate Content-Type",
      },
    ],
  },
  {
    title: "Admin System",
    description:
      "Site-wide settings, maintenance mode, metrics, and notification logs.",
    endpoints: [
      {
        method: "GET",
        path: "/api/admin/maintenance",
        auth: "superadmin",
        description: "Get the current maintenance mode settings.",
        response: `{
  "ok": true,
  "settings": {
    "enabled": "boolean",
    "headline": "string",
    "message": "string",
    "resumeAt": "string | null"
  }
}`,
      },
      {
        method: "PUT",
        path: "/api/admin/maintenance",
        auth: "superadmin",
        description: "Update maintenance mode settings. Changes propagate to the edge within seconds.",
        body: `{
  "enabled": "boolean (required)",
  "headline": "string (optional, max 160)",
  "message": "string (optional, max 1000)",
  "resumeAt": "string | null (optional)"
}`,
        response: `{
  "ok": true,
  "settings": { ... },
  "ttlMs": "number"
}`,
      },
      {
        method: "GET",
        path: "/api/admin/metrics",
        auth: "admin",
        description: "Get admin dashboard metrics (record counts, stage distribution, etc.).",
        response: `{
  "ok": true,
  "metrics": { ... }
}`,
      },
      {
        method: "GET",
        path: "/api/admin/notifications",
        auth: "admin",
        description: "Get the in-memory email notification log.",
        response: `{
  "ok": true,
  "notifications": [{ ... }]
}`,
      },
    ],
  },
];

function MethodBadge({ method }: { method: Method }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold ${METHOD_COLORS[method]}`}
    >
      {method}
    </span>
  );
}

function AuthBadge({ auth }: { auth: string }) {
  const badge = AUTH_BADGES[auth];
  if (!badge) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <div className="card border border-steel-200 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <MethodBadge method={endpoint.method} />
        <code className="font-mono text-sm font-semibold text-navy-900">
          {endpoint.path}
        </code>
        <AuthBadge auth={endpoint.auth} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-steel-600">
        {endpoint.description}
      </p>
      {endpoint.query ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel-500">
            Query Parameters
          </p>
          <code className="mt-1 block rounded-lg bg-steel-50 px-3 py-2 font-mono text-xs text-navy-800">
            {endpoint.query}
          </code>
        </div>
      ) : null}
      {endpoint.body ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel-500">
            Request Body
          </p>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-navy-950 px-3 py-2 font-mono text-xs leading-relaxed text-steel-300">
            {endpoint.body}
          </pre>
        </div>
      ) : null}
      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel-500">
          Response
        </p>
        <pre className="mt-1 overflow-x-auto rounded-lg bg-steel-50 px-3 py-2 font-mono text-xs leading-relaxed text-navy-800">
          {endpoint.response}
        </pre>
      </div>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <>
      <header className="relative isolate overflow-hidden bg-navy-950 py-20 text-white sm:py-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-900 via-navy-950 to-navy-950" />
        <div className="hatch-surface absolute inset-x-0 bottom-0 h-1.5" />
        <Container>
          <span className="eyebrow eyebrow-light mb-4">Developer Resources</span>
          <h1 className="display text-[clamp(2.1rem,5.5vw,4rem)]">API Documentation</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-steel-300 sm:text-lg">
            Complete reference for the INDTEC EXPO platform API. Public form
            endpoints, admin management APIs, authentication, rate limits, and
            response formats.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="btn btn-outline btn-sm border-white/20 text-white hover:border-white hover:bg-white hover:text-navy-950"
            >
              <Icon name="arrow-left" size={14} />
              Back to Website
            </Link>
          </div>
        </Container>
      </header>

      <Container className="py-16 sm:py-20">
        <div className="mb-12 max-w-3xl">
          <h2 className="display-sm text-2xl text-navy-900">Overview</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-steel-600">
            <p>
              The INDTEC EXPO API is organized around REST. All responses use
              a consistent JSON envelope with an <code className="rounded bg-steel-50 px-1.5 py-0.5 font-mono text-xs text-navy-800">ok</code> boolean
              field. Errors include a <code className="rounded bg-steel-50 px-1.5 py-0.5 font-mono text-xs text-navy-800">message</code> string
              and, for validation failures, an <code className="rounded bg-steel-50 px-1.5 py-0.5 font-mono text-xs text-navy-800">errors</code> object.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="card border border-steel-200 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel-500">Base URL</p>
                <code className="mt-1 block font-mono text-xs text-navy-800">https://www.indtecexpo.com</code>
              </div>
              <div className="card border border-steel-200 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel-500">Content Type</p>
                <code className="mt-1 block font-mono text-xs text-navy-800">application/json</code>
              </div>
              <div className="card border border-steel-200 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel-500">Rate Limit</p>
                <code className="mt-1 block font-mono text-xs text-navy-800">8 req / 60s per IP</code>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-16">
          {API_GROUPS.map((group) => (
            <section key={group.title}>
              <div className="mb-6">
                <h2 className="display-sm text-xl text-navy-900">{group.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel-600">
                  {group.description}
                </p>
                <span aria-hidden className="mt-3 block h-px w-10 bg-gold-500/70" />
              </div>
              <div className="grid gap-4">
                {group.endpoints.map((endpoint) => (
                  <EndpointCard
                    key={`${endpoint.method}-${endpoint.path}`}
                    endpoint={endpoint}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 card border border-steel-200 p-6">
          <h2 className="display-sm text-lg text-navy-900">Error Codes</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-steel-200 text-[11px] uppercase tracking-[0.12em] text-steel-500">
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold">Meaning</th>
                  <th className="py-2 font-semibold">When</th>
                </tr>
              </thead>
              <tbody className="text-steel-600">
                <tr className="border-b border-steel-100">
                  <td className="py-2.5 pr-4 font-mono text-xs font-bold text-emerald-700">200</td>
                  <td className="py-2.5 pr-4">OK</td>
                  <td className="py-2.5">Request succeeded</td>
                </tr>
                <tr className="border-b border-steel-100">
                  <td className="py-2.5 pr-4 font-mono text-xs font-bold text-emerald-700">201</td>
                  <td className="py-2.5 pr-4">Created</td>
                  <td className="py-2.5">Resource created (POST)</td>
                </tr>
                <tr className="border-b border-steel-100">
                  <td className="py-2.5 pr-4 font-mono text-xs font-bold text-signal-600">400</td>
                  <td className="py-2.5 pr-4">Bad Request</td>
                  <td className="py-2.5">Validation failure or missing parameters</td>
                </tr>
                <tr className="border-b border-steel-100">
                  <td className="py-2.5 pr-4 font-mono text-xs font-bold text-signal-600">401</td>
                  <td className="py-2.5 pr-4">Unauthorized</td>
                  <td className="py-2.5">No valid admin session</td>
                </tr>
                <tr className="border-b border-steel-100">
                  <td className="py-2.5 pr-4 font-mono text-xs font-bold text-signal-600">403</td>
                  <td className="py-2.5 pr-4">Forbidden</td>
                  <td className="py-2.5">Insufficient role or cross-origin request</td>
                </tr>
                <tr className="border-b border-steel-100">
                  <td className="py-2.5 pr-4 font-mono text-xs font-bold text-signal-600">404</td>
                  <td className="py-2.5 pr-4">Not Found</td>
                  <td className="py-2.5">Resource does not exist</td>
                </tr>
                <tr className="border-b border-steel-100">
                  <td className="py-2.5 pr-4 font-mono text-xs font-bold text-signal-600">405</td>
                  <td className="py-2.5 pr-4">Method Not Allowed</td>
                  <td className="py-2.5">Wrong HTTP method for endpoint</td>
                </tr>
                <tr className="border-b border-steel-100">
                  <td className="py-2.5 pr-4 font-mono text-xs font-bold text-signal-600">409</td>
                  <td className="py-2.5 pr-4">Conflict</td>
                  <td className="py-2.5">Email already registered</td>
                </tr>
                <tr className="border-b border-steel-100">
                  <td className="py-2.5 pr-4 font-mono text-xs font-bold text-signal-600">413</td>
                  <td className="py-2.5 pr-4">Payload Too Large</td>
                  <td className="py-2.5">Upload exceeds 10 MB</td>
                </tr>
                <tr className="border-b border-steel-100">
                  <td className="py-2.5 pr-4 font-mono text-xs font-bold text-signal-600">429</td>
                  <td className="py-2.5 pr-4">Too Many Requests</td>
                  <td className="py-2.5">Rate limit exceeded</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-mono text-xs font-bold text-signal-600">500</td>
                  <td className="py-2.5 pr-4">Server Error</td>
                  <td className="py-2.5">Unexpected server error</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 card border border-steel-200 p-6">
          <h2 className="display-sm text-lg text-navy-900">Authentication</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-steel-600">
            <p>
              Admin endpoints use session-based authentication. Call{" "}
              <code className="rounded bg-steel-50 px-1.5 py-0.5 font-mono text-xs text-navy-800">POST /api/admin/login</code>{" "}
              to receive an <code className="rounded bg-steel-50 px-1.5 py-0.5 font-mono text-xs text-navy-800">indtec_admin_session</code>{" "}
              cookie. Include this cookie in subsequent requests. Sessions expire after 8 hours
              and are stored in the database for immediate revocation.
            </p>
            <p>
              Public form endpoints do not require authentication but enforce same-origin checks
              and IP-based rate limiting (8 requests per 60 seconds).
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-steel-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel-500">Staff</p>
                <p className="mt-1 text-xs text-steel-600">View leads, manage profile</p>
              </div>
              <div className="rounded-lg bg-brand-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-600">Admin</p>
                <p className="mt-1 text-xs text-steel-600">Edit events, manage content</p>
              </div>
              <div className="rounded-lg bg-gold-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-700">Superadmin</p>
                <p className="mt-1 text-xs text-steel-600">Full access, user management</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
