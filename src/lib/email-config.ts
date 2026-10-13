import { siteConfig } from "@/config/site";

/**
 * Outbound email configuration.
 *
 * Kept separate from `lib/email.ts` so the template and the transport can be
 * reasoned about independently, and so a build never fails when delivery is
 * not configured yet — every accessor degrades to a safe default.
 */

/**
 * Public base URL used to build absolute links inside emails.
 *
 * Email clients have no notion of "current page", so every link must be
 * absolute. During the demo phase this points at demo.heymovox.com; set
 * EMAIL_SITE_URL=https://www.indtcexpo.com once the production domain serves
 * the logo and policy pages, then no code change is needed.
 */
export function emailSiteUrl(): string {
  const configured = process.env.EMAIL_SITE_URL?.trim();
  const base = configured || siteConfig.url;
  return base.replace(/\/+$/, "");
}

/** Absolute URL for a site-relative path, e.g. logo or /privacy-policy. */
export function emailUrl(path: string): string {
  return `${emailSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Verified sender. Falls back to the public info address when unset. */
export function emailFrom(): string {
  return process.env.NOTIFICATION_FROM?.trim() || siteConfig.email;
}

/** True when a real provider is wired up; used to skip work when it is not. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/**
 * White wordmark lockup, sized for a navy header. Reference is absolute so it
 * resolves from the mail client rather than the page.
 */
export function emailLogoUrl(): string {
  return emailUrl("/images/brand/logo-indtec-compact-white.png");
}

/** INDTEC EXPO wordmark in text, used as an alt-text and no-image fallback. */
export const EMAIL_WORDMARK = siteConfig.name;