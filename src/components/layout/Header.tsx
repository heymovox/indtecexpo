"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  eventsNavChildren,
  mainNav,
  primaryCta,
  secondaryCta,
  type NavItem,
} from "@/config/navigation";
import { contactConfig, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import type { ExpoEvent } from "@/types/event";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Builds the mobile topbar booking strip — a repeating chain of the booking
 * headline and each edition's city + short date. `gold` items render in the
 * accent colour so the booking callout reads against the edition list.
 */
function bookingStrip(events: ExpoEvent[]) {
  const items = [{ text: "Bookings Open for Visitor & Exhibitor", gold: true }];
  for (const event of events) {
    items.push({ text: `${event.city} · ${event.dateRangeShort}`, gold: false });
  }
  items.push({ text: "Response within one working day", gold: true });
  return items;
}

/**
 * `events` comes resolved from the root layout so the Events dropdown shows the
 * live city dates; the static config list is only the fallback.
 */
export function Header({ events }: { events: ExpoEvent[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);
  // Measured height of the bars above the drawer (topbar + main bar), so the
  // drawer/backdrop always sit exactly under the header at every breakpoint.
  const barRef = useRef<HTMLDivElement>(null);
  const [barH, setBarH] = useState(100);

  // Close the mobile drawer when the route changes (adjust state during render,
  // https://react.dev/learn/you-might-not-need-an-effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
    setOpenSub(null);
  }

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      // Hysteresis: separate enter/exit thresholds so a scroll resting on the
      // boundary cannot flap the header between its two heights.
      setCompact((prev) => (prev ? y > 60 : y > 140));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const update = () => setBarH(Math.round(el.getBoundingClientRect().height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const navItems = useMemo<NavItem[]>(
    () =>
      mainNav.map((item) =>
        item.href === "/events" && events.length > 0
          ? { ...item, children: eventsNavChildren(events) }
          : item,
      ),
    [events],
  );

  // The admin dashboard renders its own shell — no public chrome.
  if (pathname.startsWith("/admin")) return null;

  return (
    // Fixed rather than sticky: a sticky header stays in the document flow, so
    // collapsing it reflowed the whole page and scroll anchoring then dragged
    // the scroll position backwards, making the header visibly wobble near the
    // threshold. Out of flow, its height change cannot move anything.
    <header className="fixed inset-x-0 top-0 z-50">
      <div ref={barRef}>
        {/* Utility bar — compact mobile variant (collapses on scroll) */}
        <div
          className={cn(
            "overflow-hidden bg-navy-950 text-steel-300 transition-[max-height,opacity] duration-300 ease-out motion-reduce:transition-none lg:hidden",
            compact ? "max-h-0 opacity-0" : "max-h-10 opacity-100",
          )}
        >
          <div className="mx-auto flex h-8 w-full max-w-[1280px] items-center overflow-hidden px-4 sm:px-8">
            {/* Auto-scrolling booking strip — pauses on touch, mirrors for a
                seamless loop. Duplicated once so the marquee never shows a gap. */}
            <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap text-[10px] uppercase tracking-[0.16em] sm:text-[11.5px]">
              {bookingStrip(events).map((item, i) => (
                <span key={`a-${i}`} className="flex items-center gap-2">
                  {item.gold ? (
                    <span className="font-semibold text-gold-500">{item.text}</span>
                  ) : (
                    <span className="text-steel-300">{item.text}</span>
                  )}
                  <span aria-hidden className="text-steel-600">•</span>
                </span>
              ))}
            </div>
            <div aria-hidden className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap text-[10px] uppercase tracking-[0.16em] sm:text-[11.5px]">
              {bookingStrip(events).map((item, i) => (
                <span key={`b-${i}`} className="flex items-center gap-2">
                  {item.gold ? (
                    <span className="font-semibold text-gold-500">{item.text}</span>
                  ) : (
                    <span className="text-steel-300">{item.text}</span>
                  )}
                  <span aria-hidden className="text-steel-600">•</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Utility bar — desktop */}
        <div className="hidden bg-navy-950 text-steel-300 lg:block">
        <div className="mx-auto flex h-9 w-full max-w-[1280px] items-center justify-between px-8 text-[11.5px] uppercase tracking-[0.16em]">
          <div className="flex items-center gap-6">
            <span className="text-gold-500">{siteConfig.organizer.mission}</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2">
              <Icon name="phone" size={13} />
              {contactConfig.phones.map((phone, index) => (
                <span key={phone.tel} className="flex items-center gap-2">
                  {index > 0 ? (
                    <span aria-hidden className="text-steel-600">
                      ·
                    </span>
                  ) : null}
                  <a
                    href={`tel:${phone.tel}`}
                    className="whitespace-nowrap transition hover:text-gold-500"
                  >
                    {phone.display}
                  </a>
                </span>
              ))}
            </span>
            <a
              href={`mailto:${siteConfig.email}`}
              className="hidden items-center gap-2 transition hover:text-gold-500 xl:flex"
            >
              <Icon name="mail" size={13} />
              {siteConfig.email}
            </a>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div
        className={cn(
          "border-b bg-white/95 backdrop-blur transition-shadow",
          scrolled
            ? "border-steel-200 shadow-[0_8px_30px_-18px_rgba(7,20,39,0.45)]"
            : "border-steel-200",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 px-4 transition-[height] duration-300 ease-out sm:gap-4 sm:px-8",
            compact ? "h-[56px]" : "h-[68px]",
          )}
        >
          <Logo
            className={cn(
              "origin-left transition-transform duration-300 motion-reduce:transition-none",
              compact && "scale-[0.88]",
            )}
          />

          <nav aria-label="Main" className="hidden items-center gap-0.5 xl:flex">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              if (!item.children) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "relative px-3 py-2 text-[13px] font-semibold uppercase tracking-[0.1em] transition",
                      active
                        ? "text-brand-600"
                        : "text-navy-800 hover:text-brand-600",
                    )}
                  >
                    {item.label}
                    {active ? (
                      <span className="absolute inset-x-3 -bottom-0.5 h-0.5 bg-signal-500" />
                    ) : null}
                  </Link>
                );
              }
              const subOpen = openSub === item.label;
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenSub(item.label)}
                  onMouseLeave={() => setOpenSub(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 text-[13px] font-semibold uppercase tracking-[0.1em] transition",
                      active
                        ? "text-brand-600"
                        : "text-navy-800 hover:text-brand-600",
                    )}
                    aria-expanded={subOpen}
                  >
                    {item.label}
                    <Icon
                      name="chevron-down"
                      size={13}
                      className={cn(
                        "transition-transform duration-200",
                        subOpen && "rotate-180",
                      )}
                    />
                    {active ? (
                      <span className="absolute inset-x-3 -bottom-0.5 h-0.5 bg-signal-500" />
                    ) : null}
                  </Link>

                  <div
                    className={cn(
                      "absolute left-0 top-full w-72 border border-steel-200 bg-white p-2 shadow-xl transition-all duration-200",
                      subOpen
                        ? "pointer-events-auto translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-1 opacity-0",
                    )}
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block rounded-[2px] px-3 py-2.5 transition",
                          pathname === child.href
                            ? "bg-brand-50 text-brand-700"
                            : "hover:bg-steel-50",
                        )}
                      >
                        <span className="block text-[13px] font-semibold uppercase tracking-[0.08em] text-navy-800">
                          {child.label}
                        </span>
                        {child.description ? (
                          <span className="mt-0.5 block text-xs text-steel-500">
                            {child.description}
                          </span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              href={secondaryCta.href}
              variant="outline"
              size="sm"
              className="hidden lg:inline-flex"
            >
              {secondaryCta.label}
            </Button>
            {/* Below lg the sticky bottom bar already carries the primary CTA. */}
            <Button
              href={primaryCta.href}
              variant="primary"
              size="sm"
              className="hidden sm:inline-flex"
            >
              {primaryCta.label}
            </Button>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className={cn(
                "ml-1 inline-flex h-11 w-11 items-center justify-center border transition xl:hidden",
                open
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-steel-200 text-navy-800 hover:border-navy-800",
              )}
            >
              <Icon name={open ? "close" : "menu"} size={22} />
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Mobile drawer */}
      <div
        aria-hidden={!open}
        style={{ top: barH }}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 bg-navy-950/60 backdrop-blur-sm transition-opacity motion-reduce:transition-none xl:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
      />
      <div
        id="mobile-menu"
        style={{
          top: barH,
          maxHeight: `calc(100dvh - ${barH}px)`,
        }}
        className={cn(
          "fixed inset-x-0 z-50 overflow-y-auto overscroll-contain border-t border-navy-700 bg-navy-900 text-white shadow-2xl transition-[transform,opacity,visibility] duration-300 ease-out motion-reduce:transition-none xl:hidden",
          open
            ? "visible translate-y-0"
            : "invisible -translate-y-[110%] pointer-events-none opacity-0",
        )}
      >
        <div className="px-5 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-5 sm:px-8">
          <div className="grid gap-2.5">
            <Button href={primaryCta.href} variant="primary" size="lg" className="w-full">
              {primaryCta.label}
            </Button>
            <Button href={secondaryCta.href} variant="gold" size="lg" className="w-full">
              {secondaryCta.label}
            </Button>
            <div className="grid grid-cols-2 gap-2.5">
              {contactConfig.phones.map((phone) => (
                <Button
                  key={phone.tel}
                  href={`tel:${phone.tel}`}
                  variant="outline-light"
                  size="sm"
                  className="w-full"
                >
                  <Icon name="phone" size={15} /> {phone.number}
                </Button>
              ))}
              <Button
                href={contactConfig.phones[0].wa}
                variant="outline-light"
                size="sm"
                className="w-full"
              >
                <Icon name="whatsapp" size={15} /> WhatsApp
              </Button>
            </div>
          </div>

          <nav aria-label="Mobile" className="mt-6 border-t border-white/10 pt-4">
            <span className="eyebrow eyebrow-light mb-2 block">Menu</span>
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                const subOpen = openSub === item.label;
                return (
                  <li key={item.label}>
                    <div className="flex items-stretch">
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex-1 border-b border-white/10 py-3.5 text-[15px] font-semibold uppercase tracking-[0.12em] transition",
                          active
                            ? "text-gold-500"
                            : "text-white hover:text-gold-500",
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            aria-hidden
                            className={cn(
                              "h-4 w-0.5 shrink-0 transition-colors",
                              active ? "bg-gold-500" : "bg-transparent",
                            )}
                          />
                          {item.label}
                        </span>
                      </Link>
                      {item.children ? (
                        <button
                          type="button"
                          aria-label={`Toggle ${item.label} submenu`}
                          aria-expanded={subOpen}
                          onClick={() =>
                            setOpenSub((current) =>
                              current === item.label ? null : item.label,
                            )
                          }
                          className={cn(
                            "flex w-12 items-center justify-center border-b border-white/10 transition",
                            subOpen
                              ? "bg-white/10 text-gold-500"
                              : "text-white/70 active:bg-white/10",
                          )}
                        >
                          <Icon
                            name="chevron-down"
                            size={18}
                            className={cn(
                              "transition-transform duration-200 motion-reduce:transition-none",
                              subOpen && "rotate-180",
                            )}
                          />
                        </button>
                      ) : null}
                    </div>
                    {item.children && subOpen ? (
                      <ul className="mb-1 ml-2 border-l border-gold-500/40 pl-4">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              aria-current={
                                pathname === child.href ? "page" : undefined
                              }
                              className={cn(
                                "block py-2.5 text-[15px] transition",
                                pathname === child.href
                                  ? "text-gold-500"
                                  : "text-steel-300 hover:text-gold-500",
                              )}
                            >
                              {child.label}
                              {child.description ? (
                                <span className="mt-0.5 block text-xs text-steel-500">
                                  {child.description}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-6 border-t border-white/10 pt-4 text-xs uppercase tracking-[0.14em] text-steel-400">
            <p className="text-gold-500">{siteConfig.organizer.mission}</p>
            <p className="mt-1">{siteConfig.organizer.name}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
