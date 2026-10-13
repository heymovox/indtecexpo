import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { OG_LOGO_DATA_URI } from "@/lib/og-logo";

/**
 * Social share card.
 *
 * Rendered by `next/og`, which is Satori under the hood. Satori supports only a
 * narrow subset of CSS: flexbox (no grid), no CSS variables, no shorthand gaps,
 * and every element with more than one child must declare `display: flex`.
 * Colours therefore appear as literals rather than the @theme tokens used by
 * the site CSS, because that file is not available in this runtime.
 */

const NAVY_950 = "#040b16";
const NAVY_900 = "#071427";
const NAVY_800 = "#0a1e38";
const NAVY_700 = "#0f2b4d";
const GOLD_500 = "#f5b301";
const STEEL_300 = "#c2ccd9";
const STEEL_400 = "#94a3b8";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export interface OgCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Chips along the bottom, e.g. the three host cities. */
  chips?: string[];
  footer?: string;
}

export function renderOgCard({
  eyebrow,
  title,
  description,
  chips,
  footer = siteConfig.website,
}: OgCardProps) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "54px 72px",
          backgroundImage: `linear-gradient(135deg, ${NAVY_950} 0%, ${NAVY_900} 45%, ${NAVY_700} 100%)`,
          position: "relative",
        }}
      >
        {/* Accent rule down the left edge. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 10,
            display: "flex",
            backgroundImage: `linear-gradient(180deg, ${GOLD_500} 0%, #e1251b 100%)`,
          }}
        />

        {/* Wordmark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={OG_LOGO_DATA_URI} width={296} height={130} alt="" />

        <div style={{ display: "flex", flexDirection: "column" }}>
          {eyebrow ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                border: `2px solid ${GOLD_500}`,
                color: GOLD_500,
                fontSize: 22,
                letterSpacing: 4,
                padding: "7px 18px",
                textTransform: "uppercase",
              }}
            >
              {eyebrow}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              marginTop: eyebrow ? 26 : 0,
              color: "#ffffff",
              fontSize: title.length > 46 ? 68 : 78,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: -1,
            }}
          >
            {title}
          </div>

          {description ? (
            <div
              style={{
                display: "flex",
                marginTop: 20,
                color: STEEL_300,
                fontSize: 31,
                lineHeight: 1.32,
                maxWidth: 960,
              }}
            >
              {description}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `2px solid ${NAVY_800}`,
            paddingTop: 22,
          }}
        >
          <div style={{ display: "flex" }}>
            {(chips ?? []).map((chip) => (
              <div
                key={chip}
                style={{
                  display: "flex",
                  border: `2px solid ${STEEL_400}`,
                  color: STEEL_300,
                  fontSize: 22,
                  letterSpacing: 3,
                  padding: "7px 16px",
                  marginRight: 14,
                  textTransform: "uppercase",
                }}
              >
                {chip}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", color: GOLD_500, fontSize: 24 }}>
            {footer}
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}