"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FooterLogo } from "@/components/layout/Logo";
import { Icon } from "@/components/ui/Icon";
import { footerNav } from "@/config/navigation";
import { contactConfig, siteConfig } from "@/config/site";
import { getSortedEvents } from "@/data/events";
import { waLink } from "@/lib/whatsapp";

const events = getSortedEvents();

const socialIcons = [
  {
    label: "LinkedIn",
    href: siteConfig.social.linkedin,
    path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85V21h-4V9Z",
  },
  {
    label: "Facebook",
    href: siteConfig.social.facebook,
    path: "M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.29-.04-1.27-.13-2.41-.13-2.39 0-4.03 1.46-4.03 4.14V9.9H7.5V13h2.76v8h3.24Z",
  },
  {
    label: "Instagram",
    href: siteConfig.social.instagram,
    path: "M12 7.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2Zm0 7.6a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm5.9-7.8a1.07 1.07 0 1 1-2.14 0 1.07 1.07 0 0 1 2.14 0ZM21 8.9c-.05-1.4-.37-2.65-1.4-3.67C18.58 4.2 17.34 3.88 15.94 3.8 14.5 3.72 9.5 3.72 8.06 3.8c-1.4.07-2.63.39-3.66 1.42C3.37 6.25 3.05 7.5 2.98 8.9c-.08 1.44-.08 6.45 0 7.9.05 1.4.37 2.64 1.4 3.66 1.04 1.04 2.27 1.36 3.67 1.43 1.44.09 6.44.09 7.88 0 1.4-.06 2.64-.39 3.67-1.43 1.03-1.02 1.35-2.26 1.4-3.66.09-1.45.09-6.45 0-7.9Zm-1.93 9.45c-.31.77-.9 1.36-1.67 1.67-1.16.46-3.92.35-5.4.35s-4.25.1-5.4-.35a2.98 2.98 0 0 1-1.68-1.67c-.45-1.16-.35-3.92-.35-5.4s-.1-4.25.35-5.4A2.98 2.98 0 0 1 6.6 5.87C7.76 5.4 10.52 5.5 12 5.5s4.25-.1 5.4.35c.77.31 1.36.9 1.67 1.68.46 1.15.36 3.91.36 5.4s.1 4.24-.36 5.4Z",
  },
  {
    label: "X",
    href: siteConfig.social.x,
    path: "M17.53 3h3.02l-6.6 7.54L21.75 21h-5.9l-4.62-6.04L5.94 21H2.92l7.06-8.07L2.5 3h6.05l4.18 5.52L17.53 3Zm-1.06 16.2h1.67L7.6 4.7H5.8l10.67 14.5Z",
  },
  {
    label: "YouTube",
    href: siteConfig.social.youtube,
    path: "M21.6 7.2s-.2-1.4-.8-2c-.75-.8-1.6-.8-2-.85C16 4.2 12 4.2 12 4.2h-.01s-4 0-6.8.2c-.4.05-1.25.05-2 .85-.6.6-.8 2-.8 2S2.2 8.8 2.2 10.5v1.6c0 1.65.18 3.3.18 3.3s.2 1.4.8 2c.75.8 1.74.77 2.18.85 1.6.15 6.64.2 6.64.2s4 0 6.8-.21c.4-.05 1.25-.05 2-.85.6-.6.8-2 .8-2s.18-1.65.18-3.3v-1.6c0-1.65-.18-3.3-.18-3.3ZM9.95 14.1V8.6l5.15 2.76-5.15 2.74Z",
  },
];

export function Footer() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The button is useless once the footer is on screen, and it would sit on
  // top of the legal links — so hide it while the footer is in view.
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The admin dashboard renders its own shell — no public chrome.
  if (pathname.startsWith("/admin")) return null;

  const showTop = scrolled && !footerVisible;

  const linkList = (links: readonly { label: string; href: string }[]) =>
    links.map((link) => (
      <li key={link.href}>
        <Link
          href={link.href}
          className="group inline-flex items-center gap-2 py-0.5 text-sm text-steel-400 transition hover:text-gold-500"
        >
          <span
            aria-hidden
            className="h-px w-0 bg-gold-500 transition-all duration-200 group-hover:w-3"
          />
          {link.label}
        </Link>
      </li>
    ));

  return (
    <footer ref={footerRef} className="relative bg-navy-950 text-steel-300">
      <div className="hatch-surface h-1.5 w-full" />

      {/* ------------------------------------------------------ */}
      {/* Main grid                                              */}
      {/* ------------------------------------------------------ */}
      <div className="mx-auto w-full max-w-[1280px] px-5 py-14 sm:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.45fr_1fr_1fr_1.15fr_1.25fr] xl:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
            <FooterLogo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-steel-400">
              {siteConfig.tagline}. Three strategic industrial hubs. One
              powerful business network for machine tools, automation and
              engineering technology.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {socialIcons.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center border border-white/15 text-steel-300 transition hover:border-gold-500 hover:bg-gold-500 hover:text-navy-950"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>

            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="text-sm font-semibold text-white">
                {siteConfig.organizer.name}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-steel-500">
                {siteConfig.organizer.descriptor}
              </p>
              <p className="mt-2 text-xs text-gold-500">
                {siteConfig.organizer.mission}
              </p>
              <a
                href={siteConfig.organizer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline mt-2 inline-block text-xs text-steel-400 transition hover:text-gold-500"
              >
                {siteConfig.organizer.url.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </div>

          {/* Explore */}
          <nav aria-label="Explore">
            <h3 className="display-sm text-sm tracking-[0.2em] text-white">
              Explore
            </h3>
            <span aria-hidden className="mt-3 block h-px w-10 bg-gold-500/70" />
            <ul className="mt-4 space-y-1.5">{linkList(footerNav.explore)}</ul>
          </nav>

          {/* Participate */}
          <nav aria-label="Participate">
            <h3 className="display-sm text-sm tracking-[0.2em] text-white">
              Exhibit &amp; Visit
            </h3>
            <span aria-hidden className="mt-3 block h-px w-10 bg-gold-500/70" />
            <ul className="mt-4 space-y-1.5">{linkList(footerNav.participate)}</ul>
          </nav>

          {/* Events */}
          <nav aria-label="Events">
            <h3 className="display-sm text-sm tracking-[0.2em] text-white">
              Events
            </h3>
            <span aria-hidden className="mt-3 block h-px w-10 bg-gold-500/70" />
            <ul className="mt-4 space-y-3">
              {events.map((event) => (
                <li key={event.slug}>
                  <Link href={`/events/${event.slug}`} className="group block">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-steel-200 transition group-hover:text-gold-500">
                        {event.city}
                      </span>
                      <span className="tabular shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-success-500">
                        {event.status}
                      </span>
                    </span>
                    <span className="tabular mt-0.5 block text-xs text-steel-500">
                      {event.dateRangeShort} · {event.days} days
                    </span>
                    <span className="mt-0.5 block text-xs text-steel-500">
                      {event.venue.name}
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/events"
                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-500 transition hover:text-gold-400"
                >
                  Full calendar
                  <Icon name="arrow-right" size={13} />
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="display-sm text-sm tracking-[0.2em] text-white">
              Contact
            </h3>
            <span aria-hidden className="mt-3 block h-px w-10 bg-gold-500/70" />
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-500">
              {contactConfig.label}
            </p>

            <ul className="mt-3 space-y-2">
              {contactConfig.phones.map((phone) => (
                <li key={phone.number}>
                  <a
                    href={`tel:${phone.tel}`}
                    className="flex items-center gap-2.5 text-sm text-steel-300 transition hover:text-gold-500"
                  >
                    <Icon name="phone" size={14} className="shrink-0 text-brand-400" />
                    <span className="tabular">{phone.display}</span>
                  </a>
                </li>
              ))}
            </ul>

            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href={`mailto:${contactConfig.exhibitorEmail}`}
                  className="flex items-center gap-2.5 text-sm text-steel-300 transition hover:text-gold-500"
                >
                  <Icon name="mail" size={14} className="shrink-0 text-brand-400" />
                  {contactConfig.exhibitorEmail}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contactConfig.visitorEmail}`}
                  className="flex items-center gap-2.5 text-sm text-steel-300 transition hover:text-gold-500"
                >
                  <Icon name="ticket" size={14} className="shrink-0 text-brand-400" />
                  {contactConfig.visitorEmail}
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.url}
                  className="flex items-center gap-2.5 text-sm text-steel-300 transition hover:text-gold-500"
                >
                  <Icon name="globe" size={14} className="shrink-0 text-brand-400" />
                  {siteConfig.website}
                </a>
              </li>
            </ul>

            <p className="mt-4 flex items-start gap-2.5 text-xs leading-relaxed text-steel-400">
              <Icon name="clock" size={14} className="mt-0.5 shrink-0 text-brand-400" />
              {contactConfig.hours}
            </p>
            <p className="mt-2 flex items-start gap-2.5 text-xs leading-relaxed text-steel-400">
              <Icon name="map-pin" size={14} className="mt-0.5 shrink-0 text-brand-400" />
              <span>
                {contactConfig.address.line1}
                <br />
                {contactConfig.address.line2}
              </span>
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={contactConfig.phones[0].wa}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm group border border-success-500/45 bg-success-500/10 text-success-500 hover:bg-success-500 hover:text-white"
              >
                <Image
                  src="/images/icons/whatsapp.png"
                  alt=""
                  width={15}
                  height={15}
                  className="h-[15px] w-[15px] object-contain [filter:brightness(0)_invert(48%)_sepia(79%)_saturate(449%)_hue-rotate(86deg)_brightness(91%)_contrast(96%)] group-hover:[filter:brightness(0)_invert(1)]"
                />
                WhatsApp
              </a>
              <a
                href={waLink("Hello INDTEC EXPO, I would like the exhibitor kit and pricing details.")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm border border-white/20 text-white hover:border-white hover:bg-white hover:text-navy-950"
              >
                Get the Kit
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------ */}
      {/* Bottom bar                                           */}
      {/* ------------------------------------------------------ */}
      <div className="border-t border-white/10 bg-navy-900/60">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-5 py-6 text-xs text-steel-500 lg:flex-row lg:items-center lg:justify-between sm:px-8">
          <div className="flex flex-col gap-2 text-center lg:text-left">
            <p className="leading-relaxed">
              © {new Date().getFullYear()} {siteConfig.legalName} · Organised by{" "}
              {siteConfig.organizer.name}. All rights reserved.
            </p>
            <p className="leading-relaxed">
              Developed &amp; maintained by{" "}
              <a
                href="https://www.heymovox.com"
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline font-semibold text-steel-300 transition hover:text-gold-500"
              >
                MovoX Digital Growth
              </a>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 lg:justify-end lg:gap-x-5">
            {footerNav.legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[11px] uppercase tracking-[0.12em] transition hover:text-gold-500 lg:text-xs lg:tracking-[0.14em]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="text-[11px] uppercase tracking-[0.12em] transition hover:text-gold-500 lg:text-xs lg:tracking-[0.14em]"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Back to top */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`fixed bottom-24 right-4 z-30 hidden h-11 w-11 items-center justify-center border border-white/15 bg-navy-900/95 text-steel-300 backdrop-blur transition hover:border-gold-500 hover:text-gold-500 lg:bottom-8 lg:right-8 lg:inline-flex ${
          showTop ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <Icon name="arrow-right" size={18} className="-rotate-90" />
      </button>
    </footer>
  );
}
