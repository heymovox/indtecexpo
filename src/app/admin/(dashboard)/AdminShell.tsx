"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { adminConfig } from "@/config/admin";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ToastProvider } from "@/components/admin/ToastProvider";

const STORAGE_KEY = "indtec-admin-nav-groups";

type Role = "staff" | "admin" | "superadmin";
type Counts = Partial<Record<keyof typeof adminConfig.sectionCount, number>>;

function isActive(currentPath: string, href: string): boolean {
  return href === adminConfig.basePath
    ? currentPath === href
    : currentPath === href || currentPath.startsWith(`${href}/`);
}

function NavLinks({
  currentPath,
  onNavigate,
  role,
  counts,
}: {
  currentPath: string;
  onNavigate?: () => void;
  role: Role;
  counts: Counts;
}) {
  const allowed = adminConfig.sections.filter((s) =>
    [...(s.roles ?? [])].includes(role),
  );

  const activeGroup = allowed.find((s) => isActive(currentPath, s.href))?.group;

  // Explicit operator choice per group. A group with no recorded choice
  // follows the active group, so navigating always reveals the current page
  // without needing an effect to force it open.
  const [choices, setChoices] = useState<Record<string, boolean>>({});

  // Hydrate preferences after mount so the server HTML and the first client
  // render agree; reading localStorage during render would mismatch.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setChoices(parsed as Record<string, boolean>);
        }
      } catch {
        /* a corrupt preference should never break the nav */
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // A group with no recorded choice follows the active group, so navigating
  // always reveals the current page without an effect forcing it open.
  const isCollapsed = (groupId: string) =>
    choices[groupId] ?? activeGroup !== groupId;

  function toggle(groupId: string) {
    setChoices((current) => {
      const next = {
        ...current,
        [groupId]: !(current[groupId] ?? activeGroup !== groupId),
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* preference persistence is best-effort */
      }
      return next;
    });
  }

  return (
    <nav aria-label="Admin sections">
      {adminConfig.navGroups.map((group) => {
        const items = allowed.filter((s) => s.group === group.id);
        if (items.length === 0) return null;

        const isGroupCollapsed = isCollapsed(group.id);

        return (
          <div key={group.id} className="border-b border-navy-900/60 last:border-b-0">
            <button
              type="button"
              onClick={() => toggle(group.id)}
              aria-expanded={!isGroupCollapsed}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-steel-500 transition-colors hover:text-steel-300"
            >
              <Icon
                name="chevron-down"
                size={12}
                className={`transition-transform duration-200 ${isGroupCollapsed ? "-rotate-90" : ""}`}
              />
              <span className="flex-1">{group.label}</span>
              <span className="tabular text-steel-600">{items.length}</span>
            </button>

            {!isGroupCollapsed ? (
              <ul className="flex flex-col pb-1">
                {items.map((section) => {
                  const active = isActive(currentPath, section.href);
                  const countKey = adminConfig.sectionCount[
                    section.id as keyof typeof adminConfig.sectionCount
                  ] as keyof Counts | undefined;
                  const count = countKey ? counts[countKey] : undefined;

                  return (
                    <li key={section.id}>
                      <Link
                        href={section.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={
                          active
                            ? "flex items-center gap-3 border-l-2 border-gold-500 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
                            : "flex items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-sm text-steel-400 transition hover:bg-white/5 hover:text-white"
                        }
                      >
                        <Icon
                          name={section.icon as IconName}
                          size={17}
                          strokeWidth={1.5}
                          className={active ? "text-gold-400" : undefined}
                        />
                        <span className="min-w-0 flex-1 truncate">{section.label}</span>
                        {typeof count === "number" ? (
                          <span
                            className={`tabular shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                              active
                                ? "bg-white/15 text-white"
                                : "bg-navy-800 text-steel-400"
                            }`}
                            title={`${count} record${count === 1 ? "" : "s"}`}
                          >
                            {count}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const [role, setRole] = useState<Role>("staff");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Counts>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.ok && data.admin) {
          setRole(data.admin.role);
          setEmail(data.admin.email);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Counts for the quiet nav pills. Refreshed whenever the route changes so
  // the numbers never drift from the page you are looking at.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/metrics", { credentials: "include", cache: "no-store" })
      .then((r) => r.json().catch(() => null))
      .then((data: { ok?: boolean; metrics?: Record<string, number> } | null) => {
        if (cancelled || !data?.ok || !data.metrics) return;
        const next: Counts = {};
        for (const [sectionId, metricKey] of Object.entries(
          adminConfig.sectionCount,
        )) {
          const value = data.metrics[metricKey];
          if (typeof value === "number") {
            (next as Record<string, number>)[sectionId] = value;
          }
        }
        setCounts(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function logout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* sign-out is best-effort */
    }
    router.push("/admin/login");
    router.refresh();
  }

if (loading) {
      return (
        <div className="-mt-[var(--header-height)] min-h-screen w-full bg-steel-50 max-lg:-mb-14">
          <header className="sticky top-0 z-30 border-b border-steel-200 bg-white">
            <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
              <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
                <img src="/images/brand/logo-indtec-compact-dark.png" alt="INDTEC EXPO" className="h-8 w-auto" />
                <span className="display-sm hidden text-sm uppercase tracking-[0.18em] text-navy-900 sm:inline">Admin</span>
              </Link>
            </div>
          </header>
        </div>
      );
    }

  return (
    // Cancel the layout's fixed-header and mobile-CTA spacing: AdminShell supplies its own
    // sticky header, while the public Header/Footer/MobileCTABar return null under /admin.
    <ToastProvider>
    <div className="-mt-[var(--header-height)] min-h-screen w-full bg-steel-50 max-lg:-mb-14">
      <header className="sticky top-0 z-30 border-b border-steel-200 bg-white">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open admin menu"
            className="inline-flex h-9 w-9 items-center justify-center border border-steel-200 text-steel-600 lg:hidden"
          >
            <Icon name="menu" size={18} />
          </button>

          <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brand/logo-indtec-compact-dark.png"
              alt="INDTEC EXPO"
              className="h-8 w-auto"
            />
            <span className="display-sm hidden text-sm uppercase tracking-[0.18em] text-navy-900 sm:inline">
              Admin
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[220px] truncate text-xs text-steel-500 md:inline">
{email}
            </span>
            <button
              type="button"
              onClick={logout}
              disabled={signingOut}
              className="btn btn-outline btn-sm"
            >
              <Icon name="logout" size={15} />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-navy-800 bg-navy-950 lg:block">
          <NavLinks currentPath={pathname} role={role} counts={counts} />
        </aside>

        {drawerOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close admin menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-navy-950/60"
            />
            <div className="absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col overflow-y-auto bg-navy-950">
              <div className="flex items-center justify-between border-b border-navy-800 px-4 py-3">
                <span className="text-xs uppercase tracking-[0.18em] text-steel-400">
                  Menu
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close admin menu"
                  className="text-steel-400 hover:text-white"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
<NavLinks
                  currentPath={pathname}
                  onNavigate={() => setDrawerOpen(false)}
                  role={role}
                  counts={counts}
                />
              <div className="mt-auto border-t border-navy-800 p-4">
                <p className="truncate text-xs text-steel-500">{email}</p>
              </div>
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
