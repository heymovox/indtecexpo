import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

/**
 * robots.txt.
 *
 * The admin dashboard is excluded: it has no public content to rank, and
 * leaving it crawlable invites indexing of login and manager URLs.
 *
 * Unsubscribe links are disallowed because they are one-time, signed and
 * POST-confirmed; a crawler fetching them would only ever see the landing
 * page, and a prefetcher that POSTs would suppress a real address.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/unsubscribe/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}