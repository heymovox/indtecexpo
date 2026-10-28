import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // GTM and the MovoX branding widget load external scripts; 'unsafe-inline'
      // is kept for GTM snippet injection and the framework's runtime.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://movox-admin-api.srinaththedudes.workers.dev",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      // GTM's <noscript> fallback uses a tracking pixel from its own domain;
      // the MovoX wordmark is served from heymovox.com.
      "img-src 'self' data: blob: https://www.googletagmanager.com https://heymovox.com",
      // GTM / dataLayer pings and the branding widget both phone home.
      "connect-src 'self' https://www.googletagmanager.com https://movox-admin-api.srinaththedudes.workers.dev",
      "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  /**
   * The public site is normally exercised locally by pointing
   * indtecexpo.com at 127.0.0.1 (see src/config/hosts.ts). Next dev blocks
   * cross-origin dev resources such as HMR by default, which leaves the page
   * server-rendered but never hydrated. Allowlisting the real hostnames keeps
   * that workflow usable; it has no effect on a production build.
   */
  allowedDevOrigins: ["indtecexpo.com", "www.indtecexpo.com"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
    minimumCacheTTL: 14400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
