"use client";

import { useEffect } from "react";

/**
 * MovoX branding widget — loads the remote branding script and initialises it.
 * Replaces the static "Developed & maintained by MovoX" footer credit.
 */
export function MovoXBranding() {
  useEffect(() => {
    if (document.getElementById("movox-branding-script")) return;

    const cfg = { position: "bottom-right", size: "md", showLabel: true };
    const s = document.createElement("script");
    s.id = "movox-branding-script";
    s.src = "https://movox-admin-api.srinaththedudes.workers.dev/branding.js";
    s.async = true;
    s.onload = () => {
      const w = window as unknown as { MovoXBranding?: { init: (cfg: unknown) => void } };
      if (w.MovoXBranding) w.MovoXBranding.init(cfg);
    };
    document.head.appendChild(s);
  }, []);

  return null;
}
