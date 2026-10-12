/**
 * Builds legible compact INDTEC EXPO variants for small UI surfaces.
 *
 * The supplied logo-footer-white.png is a complete stacked lockup. Its
 * tagline becomes unreadably small in the site header, so this extracts only
 * the gear and INDTEC EXPO 2026-2027 wordmark, then saves white and navy
 * versions with identical shapes.
 */
import { statSync } from "node:fs";
import sharp from "sharp";

const SRC = "public/images/brand/logo-footer-white.png";
const WHITE_OUT = "public/images/brand/logo-indtec-compact-white.png";
const DARK_OUT = "public/images/brand/logo-indtec-compact-dark.png";
const NAVY = { r: 11, g: 31, b: 58 };
const COMPACT = { left: 40, top: 32, width: 539, height: 240 };

const cropped = sharp(SRC).extract(COMPACT);
await cropped.clone().png({ compressionLevel: 9 }).toFile(WHITE_OUT);

const { data, info } = await cropped
  .clone()
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const recoloured = Buffer.alloc(info.width * info.height * 4);
for (let i = 0; i < info.width * info.height; i++) {
  const alpha = data[i * 4 + 3];
  recoloured[i * 4 + 0] = NAVY.r;
  recoloured[i * 4 + 1] = NAVY.g;
  recoloured[i * 4 + 2] = NAVY.b;
  recoloured[i * 4 + 3] = alpha;
}

await sharp(recoloured, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png({ compressionLevel: 9 })
  .toFile(DARK_OUT);

console.log(
  `wrote ${WHITE_OUT} and ${DARK_OUT} (${info.width}x${info.height}, ${Math.round(statSync(DARK_OUT).size / 1024)} KB dark)`,
);
