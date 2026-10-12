"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { adminConfig } from "@/config/admin";
import { Icon, type IconName } from "@/components/ui/Icon";

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Admin sections">
      {adminConfig.sections.map((section) => {
        const active =
          section.href === "/admin"
            ? pathname === "/admin"
            : pathname === section.href ||
              pathname.startsWith(`${section.href}/`);
        return (
          <Link
            key={section.id}
            href={section.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "flex items-center gap-3 border-l-2 border-gold-500 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white"
                : "flex items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-sm text-steel-400 transition hover:bg-white/5 hover:text-white"
            }
          >
            <Icon name={section.icon as IconName} size={18} strokeWidth={1.5} />
            <span className="truncate">{section.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  children,
  adminEmail,
}: {
  children: ReactNode;
  adminEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

  return (
    // Cancel the layout's fixed-header spacing: AdminShell supplies its own
    // sticky header, while the public Header/Footer return null under /admin.
    <div className="-mt-[var(--header-height)] min-h-[80vh] bg-steel-50">
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
              {adminEmail}
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
          <NavLinks pathname={pathname} />
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
                pathname={pathname}
                onNavigate={() => setDrawerOpen(false)}
              />
              <div className="mt-auto border-t border-navy-800 p-4">
                <p className="truncate text-xs text-steel-500">{adminEmail}</p>
              </div>
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
