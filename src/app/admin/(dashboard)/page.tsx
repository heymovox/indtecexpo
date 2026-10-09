import type { Metadata } from "next";
import { getAdminMetrics, type AdminMetrics } from "@/lib/db";
import { getAllLeads } from "@/app/api/admin/_lib/leads";
import { Icon, type IconName } from "@/components/ui/Icon";
import { timeAgo } from "@/lib/utils";
import { KanbanBoard } from "./KanbanBoard";
import { StageChip } from "./StageChip";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | INDTEC EXPO Admin",
  robots: { index: false, follow: false },
};

const metricCards: {
  key: keyof AdminMetrics;
  label: string;
  icon: IconName;
}[] = [
  { key: "exhibitorEnquiries", label: "Exhibitor Enquiries", icon: "stall" },
  { key: "stallBookings", label: "Stall Bookings", icon: "building" },
  { key: "visitorRegistrations", label: "Visitor Registrations", icon: "users" },
  { key: "contactEnquiries", label: "Contact Enquiries", icon: "inbox" },
  { key: "upcomingEvents", label: "Upcoming Events", icon: "calendar" },
];

function metricValue(metrics: AdminMetrics, key: keyof AdminMetrics): number {
  const value = metrics[key];
  return typeof value === "number" ? value : 0;
}

export default async function AdminDashboardPage() {
  const [metrics, leads] = await Promise.all([getAdminMetrics(), getAllLeads()]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow mb-2">Overview</span>
          <h1 className="display text-3xl text-navy-900 sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-steel-600">
            Live pipeline across the Bengaluru, Coimbatore and Hosur editions.
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.14em] text-steel-500">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </header>

      <section aria-label="Key metrics">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metricCards.map((card) => (
            <div key={card.key} className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-steel-500">
                  {card.label}
                </span>
                <Icon
                  name={card.icon}
                  size={18}
                  strokeWidth={1.5}
                  className="shrink-0 text-brand-600"
                />
              </div>
              <p className="display tabular mt-3 text-4xl text-navy-900">
                {metricValue(metrics, card.key)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Recent leads" className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-steel-200 px-4 py-3.5 sm:px-5">
          <h2 className="display-sm text-lg text-navy-900">Recent Leads</h2>
          <span className="text-xs text-steel-500">
            Latest {metrics.recentLeads.length} submissions
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-[0.12em] text-steel-500">
                <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
                  Reference
                </th>
                <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
                  Lead
                </th>
                <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
                  Type
                </th>
                <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
                  Stage
                </th>
                <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
                  Received
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-steel-500 sm:px-5"
                  >
                    No leads yet. Submissions from the website will appear here.
                  </td>
                </tr>
              ) : (
                metrics.recentLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-steel-100 last:border-b-0 hover:bg-steel-25"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-steel-600 sm:px-5">
                      {lead.reference}
                    </td>
                    <td className="px-4 py-3 font-medium text-navy-900 sm:px-5">
                      {lead.title}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-steel-600 sm:px-5">
                      {lead.type}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                      <StageChip stage={lead.stage} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-steel-500 sm:px-5">
                      {timeAgo(lead.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Kanban board">
        <KanbanBoard initialLeads={leads} />
      </section>
    </div>
  );
}
