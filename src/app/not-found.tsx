import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Section } from "@/components/ui/Section";
import { mainNav, primaryCta, secondaryCta } from "@/config/navigation";
import { whatsappLinks } from "@/lib/whatsapp";

export default function NotFound() {
  const quickLinks = mainNav.filter((item) => item.href !== "/");

  return (
    <Section className="relative isolate overflow-hidden py-20 sm:py-28">
      <div className="grid-surface-dark absolute inset-0 -z-10 opacity-40" />
      <div className="hatch-surface absolute inset-x-0 top-0 -z-10" />

      <div className="mx-auto max-w-3xl text-center">
        <span className="display tabular block text-[clamp(5rem,16vw,10rem)] leading-none text-signal-500">
          404
        </span>
        <span className="eyebrow eyebrow-dark mt-4 inline-flex">Page Not Found</span>
        <h1 className="display mt-4 text-[clamp(2rem,4.5vw,3.25rem)] text-navy-900">
          This Aisle Doesn&apos;t Exist
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-steel-600">
          The page you were looking for has been moved, renamed or was never on
          the floor plan. Everything else is one step away.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button href="/" variant="primary" size="lg" withArrow>
            Back to Home
          </Button>
          <Button href={secondaryCta.href} variant="gold" size="lg">
            {secondaryCta.label}
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-4xl">
        <h2 className="display-sm text-center text-sm tracking-[0.18em] text-steel-500">
          EXPLORE THE SITE
        </h2>
        <nav aria-label="Site sections" className="mt-6">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {quickLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="card card-hover flex h-full flex-col items-center justify-center gap-2 px-4 py-5 text-center"
                >
                  <span className="display-sm text-base text-navy-900">
                    {item.label}
                  </span>
                  {item.children ? (
                    <span className="text-[11px] uppercase tracking-[0.12em] text-steel-500">
                      {item.children.length} sections
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 border-t border-steel-200 pt-8">
          <span className="text-sm text-steel-500">Looking to exhibit?</span>
          <Button href={primaryCta.href} variant="secondary" size="sm" withArrow>
            {primaryCta.label}
          </Button>
          <Button href={whatsappLinks.support} variant="outline" size="sm">
            <Icon name="whatsapp" size={15} className="mr-1.5 text-success-500" />
            WhatsApp Support
          </Button>
        </div>
      </div>
    </Section>
  );
}
