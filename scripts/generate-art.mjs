/**
 * INDTEC EXPO — procedural industrial artwork generator.
 * Run: node scripts/generate-art.mjs
 * Writes premium geometric/industrial SVGs into public/images.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "images");

const P = {
  navy950: "#040b16",
  navy900: "#071427",
  navy800: "#0a1e38",
  navy700: "#0f2b4d",
  navy600: "#16395f",
  brand: "#1f74dd",
  brandDeep: "#0f5fbf",
  brandLight: "#4e93ea",
  steel: "#c2ccd9",
  steelDark: "#64748b",
  gold: "#f5b301",
  goldDeep: "#d89a00",
  red: "#e1251b",
  white: "#ffffff",
};

/* ---------------------------------- utils --------------------------------- */

function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const seedFrom = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

function write(rel, svg) {
  const file = path.join(OUT, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, svg.replace(/\n\s*\n/g, "\n").trim() + "\n", "utf8");
  return rel;
}

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/* --------------------------------- surfaces -------------------------------- */

function defs(id, opts = {}) {
  const { from = P.navy950, via = P.navy800, to = P.navy900, angle = 135 } = opts;
  const rad = (angle * Math.PI) / 180;
  const x1 = 50 - Math.cos(rad) * 50;
  const y1 = 50 - Math.sin(rad) * 50;
  const x2 = 50 + Math.cos(rad) * 50;
  const y2 = 50 + Math.sin(rad) * 50;
  return `
  <defs>
    <linearGradient id="bg-${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="55%" stop-color="${via}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <linearGradient id="glow-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${P.brand}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${P.brand}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="glowRed-${id}" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${P.red}" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="${P.red}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="steel-${id}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${P.steel}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${P.steelDark}" stop-opacity="0.65"/>
    </linearGradient>
    <linearGradient id="gold-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${P.gold}"/>
      <stop offset="100%" stop-color="${P.goldDeep}"/>
    </linearGradient>
    <pattern id="grid-${id}" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M44 0H0V44" fill="none" stroke="#ffffff" stroke-opacity="0.055" stroke-width="1"/>
    </pattern>
    <pattern id="dots-${id}" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1.6" cy="1.6" r="1.6" fill="#ffffff" fill-opacity="0.08"/>
    </pattern>
    <radialGradient id="vig-${id}" cx="50%" cy="45%" r="72%">
      <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.55"/>
    </radialGradient>
  </defs>`;
}

function frame(id, w, h) {
  return `
  <rect width="${w}" height="${h}" fill="url(#bg-${id})"/>
  <rect width="${w}" height="${h}" fill="url(#grid-${id})"/>
  <rect width="${w}" height="${h}" fill="url(#glow-${id})" opacity="0.55"/>
  <rect width="${w}" height="${h}" fill="url(#glowRed-${id})" opacity="0.5"/>`;
}

/* --------------------------------- motifs ---------------------------------- */

function gear(cx, cy, r, teeth, opts = {}) {
  const {
    stroke = P.steel,
    fill = "none",
    width = 2,
    opacity = 1,
    inner = r * 0.34,
    toothDepth = r * 0.18,
  } = opts;
  const step = (Math.PI * 2) / teeth;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.32;
    const a2 = a0 + step * 0.5;
    const a3 = a0 + step * 0.82;
    const rr = r + toothDepth;
    pts.push(
      `${(cx + Math.cos(a0) * r).toFixed(1)},${(cy + Math.sin(a0) * r).toFixed(1)}`,
      `${(cx + Math.cos(a1) * rr).toFixed(1)},${(cy + Math.sin(a1) * rr).toFixed(1)}`,
      `${(cx + Math.cos(a2) * rr).toFixed(1)},${(cy + Math.sin(a2) * rr).toFixed(1)}`,
      `${(cx + Math.cos(a3) * r).toFixed(1)},${(cy + Math.sin(a3) * r).toFixed(1)}`,
    );
  }
  return `<g opacity="${opacity}">
    <polygon points="${pts.join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="${(r * 0.66).toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="${width}"/>
    <circle cx="${cx}" cy="${cy}" r="${inner.toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="${width}"/>
  </g>`;
}

function circuitTraces(seed, w, h, count = 9) {
  const rand = rng(seed);
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const len = 80 + rand() * 260;
    const dir = rand() > 0.5 ? 1 : -1;
    const mid = 18 + rand() * 40;
    const d = `M${x.toFixed(0)} ${y.toFixed(0)} h${(len * 0.4).toFixed(0)} l${(mid * dir).toFixed(0)} ${(-mid * 0.7).toFixed(0)} h${(len * 0.5).toFixed(0)}`;
    const c = rand() > 0.78 ? P.gold : P.brandLight;
    out += `<path d="${d}" fill="none" stroke="${c}" stroke-opacity="0.34" stroke-width="1.6"/>`;
    out += `<circle cx="${(x + len).toFixed(0)}" cy="${(y - mid * 0.7).toFixed(0)}" r="3.4" fill="${c}" fill-opacity="0.75"/>`;
    out += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="2.4" fill="${c}" fill-opacity="0.55"/>`;
  }
  return out;
}

function blueprintTicks(w, h, opts = {}) {
  const { color = P.steel, opacity = 0.35, step = 40 } = opts;
  let out = "";
  for (let x = step; x < w; x += step) {
    out += `<line x1="${x}" y1="${h - 26}" x2="${x}" y2="${h - 16}" stroke="${color}" stroke-opacity="${opacity}" stroke-width="1"/>`;
  }
  for (let y = step; y < h; y += step) {
    out += `<line x1="26" y1="${y}" x2="16" y2="${y}" stroke="${color}" stroke-opacity="${opacity}" stroke-width="1"/>`;
  }
  return out;
}

function cncMachine(x, y, scale = 1, opts = {}) {
  const { body = P.steel, accent = P.brand, dark = P.navy800 } = opts;
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <rect x="0" y="0" width="240" height="150" rx="4" fill="${dark}" stroke="${body}" stroke-opacity="0.6" stroke-width="2"/>
    <rect x="16" y="16" width="146" height="102" fill="#0b2540" stroke="${accent}" stroke-opacity="0.55" stroke-width="1.5"/>
    <rect x="28" y="28" width="122" height="78" fill="${accent}" fill-opacity="0.12"/>
    <rect x="76" y="34" width="26" height="46" rx="2" fill="${body}" fill-opacity="0.85"/>
    <rect x="66" y="80" width="46" height="10" rx="2" fill="${P.gold}"/>
    <path d="M186 26 v78" stroke="${body}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="186" cy="116" r="14" fill="none" stroke="${body}" stroke-width="4"/>
    <rect x="170" y="128" width="56" height="16" rx="3" fill="${accent}" fill-opacity="0.85"/>
    <rect x="0" y="150" width="240" height="14" fill="${dark}"/>
    <rect x="18" y="164" width="34" height="16" fill="${dark}"/>
    <rect x="188" y="164" width="34" height="16" fill="${dark}"/>
    <rect x="16" y="128" width="60" height="6" fill="${P.red}" fill-opacity="0.9"/>
  </g>`;
}

function robotArm(x, y, scale = 1, opts = {}) {
  const { body = P.steel, accent = P.gold, dark = P.navy800 } = opts;
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cx="0" cy="196" rx="66" ry="16" fill="#000" fill-opacity="0.35"/>
    <path d="M-52 196 h104 l-12 -34 h-80 z" fill="${dark}" stroke="${body}" stroke-width="2"/>
    <rect x="-30" y="140" width="60" height="26" rx="4" fill="${dark}" stroke="${body}" stroke-width="2"/>
    <rect x="-14" y="46" width="28" height="98" rx="12" fill="${body}" fill-opacity="0.9" stroke="${dark}" stroke-width="2"/>
    <circle cx="0" cy="52" r="20" fill="${dark}" stroke="${body}" stroke-width="3"/>
    <rect x="4" y="30" width="104" height="26" rx="13" fill="${body}" fill-opacity="0.85" stroke="${dark}" stroke-width="2" transform="rotate(-24 4 43)"/>
    <g transform="rotate(-24 4 43)">
      <circle cx="104" cy="43" r="17" fill="${dark}" stroke="${body}" stroke-width="3"/>
      <rect x="112" y="32" width="66" height="20" rx="10" fill="${body}" fill-opacity="0.8" stroke="${dark}" stroke-width="2"/>
      <rect x="176" y="30" width="8" height="24" fill="${accent}"/>
      <rect x="190" y="34" width="8" height="16" fill="${accent}"/>
    </g>
    <circle cx="0" cy="52" r="7" fill="${accent}"/>
    <rect x="-46" y="150" width="14" height="8" fill="${accent}"/>
  </g>`;
}

function factoryLine(x, y, w, h, opts = {}) {
  const { roof = P.navy700, wall = P.navy800, accent = P.gold } = opts;
  const bays = Math.max(3, Math.floor(w / 90));
  const bw = w / bays;
  let windows = "";
  for (let i = 0; i < bays; i++) {
    windows += `<rect x="${(x + i * bw + bw * 0.18).toFixed(0)}" y="${y + h * 0.34}" width="${(bw * 0.64).toFixed(0)}" height="${h * 0.3}" fill="${P.brand}" fill-opacity="0.3"/>`;
    windows += `<line x1="${(x + i * bw + bw * 0.5).toFixed(0)}" y1="${y + h * 0.34}" x2="${(x + i * bw + bw * 0.5).toFixed(0)}" y2="${y + h * 0.64}" stroke="${wall}" stroke-width="3"/>`;
  }
  let roofSaw = "";
  const seg = w / 5;
  for (let i = 0; i < 5; i++) {
    const rx = x + i * seg;
    roofSaw += `<path d="M${rx} ${y + 34} L${rx + seg * 0.5} ${y} L${rx + seg * 0.5} ${y + 34} Z" fill="${roof}"/>`;
  }
  return `<g>
    <rect x="${x}" y="${y + 34}" width="${w}" height="${h}" fill="${wall}" fill-opacity="0.92"/>
    ${roofSaw}${windows}
    <rect x="${x}" y="${y + h}" width="${w}" height="8" fill="${P.navy950}"/>
    <rect x="${x + w * 0.06}" y="${y + h * 0.72}" width="${w * 0.16}" height="${h * 0.28}" fill="${P.navy950}" fill-opacity="0.8"/>
    <rect x="${x + w * 0.78}" y="${y + h * 0.72}" width="${w * 0.16}" height="${h * 0.28}" fill="${P.navy950}" fill-opacity="0.8"/>
    <line x1="${x + w * 0.12}" y1="${y + 34}" x2="${x + w * 0.12}" y2="${y - 40}" stroke="${P.steelDark}" stroke-width="7"/>
    <line x1="${x + w * 0.12}" y1="${y - 40}" x2="${x + w * 0.12 - 26}" y2="${y - 62}" stroke="${accent}" stroke-width="6"/>
    <rect x="${x + w * 0.42}" y="${y + h * 0.06}" width="${w * 0.3}" height="16" fill="${accent}" fill-opacity="0.85"/>
  </g>`;
}

function crane(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" stroke="${P.gold}" stroke-width="6" fill="none" stroke-linecap="round">
    <path d="M0 260 V0"/>
    <path d="M0 0 H240"/>
    <path d="M0 0 L64 62"/>
    <path d="M0 40 H40"/>
    <path d="M186 0 V86"/>
    <rect x="170" y="86" width="34" height="24" fill="${P.gold}" stroke="none"/>
    <path d="M187 110 V150"/>
    <path d="M-40 260 H40"/>
  </g>`;
}

function caliper(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <rect x="0" y="0" width="300" height="20" rx="4" fill="url(#steel-main)" stroke="${P.steelDark}" stroke-width="2"/>
    <rect x="0" y="0" width="70" height="76" rx="4" fill="${P.steel}" stroke="${P.steelDark}" stroke-width="2"/>
    <path d="M70 44 h34 l24 32 h-58 z" fill="${P.steel}" stroke="${P.steelDark}" stroke-width="2"/>
    <rect x="150" y="0" width="52" height="96" rx="4" fill="${P.steel}" stroke="${P.steelDark}" stroke-width="2"/>
    <path d="M150 64 h-30 l-22 32 h52 z" fill="${P.steel}" stroke="${P.steelDark}" stroke-width="2"/>
    ${Array.from({ length: 14 }, (_, i) => `<line x1="${86 + i * 14}" y1="4" x2="${86 + i * 14}" y2="${i % 2 ? 10 : 14}" stroke="${P.navy900}" stroke-width="2"/>`).join("")}
    <rect x="156" y="24" width="40" height="34" rx="3" fill="${P.navy900}"/>
    <text x="176" y="47" font-family="monospace" font-size="17" fill="${P.gold}" text-anchor="middle">125</text>
  </g>`;
}

function conveyor(x, y, w, opts = {}) {
  const { belt = P.navy700, box = P.gold } = opts;
  let rollers = "";
  for (let i = 0; i <= Math.floor(w / 34); i++) {
    rollers += `<circle cx="${x + 14 + i * 34}" cy="${y + 26}" r="12" fill="${P.navy800}" stroke="${P.steel}" stroke-width="3"/>`;
  }
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="34" rx="17" fill="${belt}" stroke="${P.steel}" stroke-opacity="0.5" stroke-width="2"/>
    ${rollers}
    <rect x="${x + w * 0.16}" y="${y - 44}" width="52" height="44" fill="${box}" fill-opacity="0.9"/>
    <rect x="${x + w * 0.16}" y="${y - 44}" width="52" height="10" fill="${P.navy900}" fill-opacity="0.25"/>
    <rect x="${x + w * 0.52}" y="${y - 66}" width="66" height="66" fill="${P.brandLight}" fill-opacity="0.85"/>
    <rect x="${x + w * 0.52}" y="${y - 66}" width="66" height="12" fill="${P.navy900}" fill-opacity="0.25"/>
    <path d="M${x + 20} ${y + 34} v42 M${x + w - 20} ${y + 34} v42" stroke="${P.steel}" stroke-width="6"/>
  </g>`;
}

function skyline(seed, w, baseY, height) {
  const rand = rng(seed);
  let out = "";
  let x = -20;
  while (x < w + 20) {
    const bw = 40 + rand() * 70;
    const bh = height * (0.35 + rand() * 0.65);
    out += `<rect x="${x.toFixed(0)}" y="${(baseY - bh).toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" fill="${P.navy700}" fill-opacity="${(0.4 + rand() * 0.4).toFixed(2)}"/>`;
    const cols = Math.max(1, Math.floor(bw / 22));
    const rows = Math.max(1, Math.floor(bh / 26));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rand() > 0.55) {
          out += `<rect x="${(x + 8 + c * 22).toFixed(0)}" y="${(baseY - bh + 12 + r * 26).toFixed(0)}" width="8" height="10" fill="${P.gold}" fill-opacity="0.5"/>`;
        }
      }
    }
    x += bw + 8;
  }
  return out;
}

function techBadge(x, y, label, color = P.gold) {
  return `<g transform="translate(${x} ${y})">
    <rect x="0" y="0" width="${label.length * 8.6 + 34}" height="30" fill="${P.navy950}" fill-opacity="0.72" stroke="${color}" stroke-opacity="0.65"/>
    <circle cx="17" cy="15" r="5" fill="${color}"/>
    <text x="30" y="20" fill="#ffffff" fill-opacity="0.92" font-family="'Arial Narrow',Arial,sans-serif" font-size="13" letter-spacing="1.6">${esc(label)}</text>
  </g>`;
}

function titleBlock(w, h, title, subtitle) {
  const bw = Math.min(w * 0.62, 560);
  return `
  <g>
    <rect x="56" y="${h - 168}" width="6" height="118" fill="${P.red}"/>
    <text x="84" y="${h - 116}" font-family="'Arial Narrow',Arial,sans-serif" font-weight="bold" font-size="${bw > 420 ? 58 : 44}" fill="#ffffff" letter-spacing="-1">${esc(title)}</text>
    <text x="86" y="${h - 74}" font-family="Arial,sans-serif" font-size="19" fill="${P.gold}" letter-spacing="4.5">${esc(subtitle)}</text>
  </g>`;
}

/* ------------------------------ compositions ------------------------------ */

function industrialScene(id, w, h, opts) {
  const {
    seed,
    title = "",
    subtitle = "",
    tags = [],
    variant = "machine",
    light = false,
  } = opts;
  const body = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
    ${defs(id, opts.gradient)}
    ${frame(id, w, h)}
    ${circuitTraces(seed, w, h * 0.72)}
    <rect x="0" y="${h * 0.72}" width="${w}" height="${h * 0.28}" fill="${P.navy950}" fill-opacity="0.55"/>
    ${blueprintTicks(w, h * 0.72)}
    ${renderVariant(variant, w, h, seed)}
    ${skyline(seed + 7, w, h * 0.74, h * 0.3)}
    <rect width="${w}" height="${h}" fill="url(#vig-${id})"/>
    ${title ? titleBlock(w, h, title, subtitle) : ""}
    ${tags.map((t, i) => techBadge(w - 60 - t.length * 8.6 - 34, 54 + i * 42, t)).join("")}
    <g transform="translate(56 46)">
      <rect width="176" height="34" fill="${P.red}"/>
      <text x="14" y="24" font-family="'Arial Narrow',Arial,sans-serif" font-weight="bold" font-size="17" fill="#fff" letter-spacing="3">INDTEC EXPO</text>
    </g>
    ${light ? "" : ""}
    <rect x="14" y="14" width="${w - 28}" height="${h - 28}" fill="none" stroke="#ffffff" stroke-opacity="0.12"/>
  </svg>`;
  return body;
}

function renderVariant(variant, w, h, seed) {
  switch (variant) {
    case "robot":
      return robotArm(w * 0.66, h * 0.24, Math.min(w, h) / 620) +
        cncMachine(w * 0.07, h * 0.42, Math.min(w, h) / 760);
    case "gear":
      return `
        ${gear(w * 0.26, h * 0.44, Math.min(w, h) * 0.17, 14, { stroke: P.steel, width: 3, opacity: 0.9 })}
        ${gear(w * 0.46, h * 0.62, Math.min(w, h) * 0.11, 11, { stroke: P.gold, width: 3, opacity: 0.9 })}
        ${gear(w * 0.72, h * 0.36, Math.min(w, h) * 0.13, 12, { stroke: P.brandLight, width: 3, opacity: 0.85 })}
        <rect x="${w * 0.06}" y="${h * 0.78}" width="${w * 0.88}" height="6" fill="${P.steel}" fill-opacity="0.35"/>`;
    case "caliper":
      return caliper(w * 0.1, h * 0.44, Math.min(w, h) / 420) +
        gear(w * 0.8, h * 0.3, Math.min(w, h) * 0.12, 12, { stroke: P.gold, width: 3 });
    case "conveyor":
      return conveyor(w * 0.06, h * 0.6, w * 0.6) +
        gear(w * 0.84, h * 0.5, Math.min(w, h) * 0.14, 14, { stroke: P.steel, width: 3 });
    case "crane":
      return crane(w * 0.62, h * 0.16, Math.min(w, h) / 640) +
        factoryLine(w * 0.04, h * 0.5, w * 0.5, h * 0.26);
    case "factory":
      return factoryLine(w * 0.06, h * 0.4, w * 0.88, h * 0.34) +
        conveyor(w * 0.1, h * 0.82, w * 0.5);
    case "circuit":
      return `
        ${gear(w * 0.78, h * 0.34, Math.min(w, h) * 0.15, 13, { stroke: P.brandLight, width: 3 })}
        <g transform="translate(${w * 0.08} ${h * 0.4})">
          <rect width="${w * 0.42}" height="${h * 0.3}" rx="6" fill="${P.navy800}" stroke="${P.brand}" stroke-width="2"/>
          <rect x="24" y="24" width="${w * 0.42 - 48}" height="${h * 0.3 - 48}" fill="${P.brand}" fill-opacity="0.14"/>
          ${Array.from({ length: 10 }, (_, i) => `<line x1="${16 + i * (w * 0.42 - 32) / 9}" y1="0" x2="${16 + i * (w * 0.42 - 32) / 9}" y2="-18" stroke="${P.gold}" stroke-width="4"/>`).join("")}
          ${Array.from({ length: 10 }, (_, i) => `<line x1="${16 + i * (w * 0.42 - 32) / 9}" y1="${h * 0.3}" x2="${16 + i * (w * 0.42 - 32) / 9}" y2="${h * 0.3 + 18}" stroke="${P.gold}" stroke-width="4"/>`).join("")}
        </g>`;
    case "city":
      return skyline(seed, w, h * 0.7, h * 0.42) +
        factoryLine(w * 0.06, h * 0.5, w * 0.34, h * 0.2) +
        crane(w * 0.78, h * 0.22, Math.min(w, h) / 700);
    default:
      return cncMachine(w * 0.08, h * 0.38, Math.min(w, h) / 700) +
        gear(w * 0.78, h * 0.4, Math.min(w, h) * 0.15, 14, { stroke: P.gold, width: 3 });
  }
}

/* ------------------------------- brand assets ------------------------------ */

function logoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 76" width="360" height="76" role="img">
  <defs>
    <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${P.red}"/><stop offset="100%" stop-color="${P.goldDeep}"/>
    </linearGradient>
  </defs>
  <rect x="2" y="10" width="56" height="56" fill="${P.navy800}"/>
  <rect x="2" y="10" width="56" height="8" fill="url(#lg)"/>
  <path d="M16 56 V26 h8 v10 h10 V26 h8 v30 h-8 V44 H24 v12 z" fill="#fff"/>
  <text x="74" y="46" font-family="'Arial Narrow',Arial,sans-serif" font-weight="bold" font-size="34" fill="${P.navy800}" letter-spacing="2.5">INDTEC</text>
  <text x="240" y="46" font-family="'Arial Narrow',Arial,sans-serif" font-weight="bold" font-size="34" fill="${P.red}" letter-spacing="6">EXPO</text>
  <text x="75" y="66" font-family="Arial,sans-serif" font-size="11.5" fill="${P.steelDark}" letter-spacing="3.4">MACHINE TOOLS · ENGINEERING · TECHNOLOGY</text>
</svg>`;
}

function logoLightSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 76" width="360" height="76" role="img">
  <defs>
    <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${P.red}"/><stop offset="100%" stop-color="${P.gold}"/>
    </linearGradient>
  </defs>
  <rect x="2" y="10" width="56" height="56" fill="#ffffff"/>
  <rect x="2" y="10" width="56" height="8" fill="url(#lg2)"/>
  <path d="M16 56 V26 h8 v10 h10 V26 h8 v30 h-8 V44 H24 v12 z" fill="${P.navy900}"/>
  <text x="74" y="46" font-family="'Arial Narrow',Arial,sans-serif" font-weight="bold" font-size="34" fill="#ffffff" letter-spacing="2.5">INDTEC</text>
  <text x="240" y="46" font-family="'Arial Narrow',Arial,sans-serif" font-weight="bold" font-size="34" fill="${P.gold}" letter-spacing="6">EXPO</text>
  <text x="75" y="66" font-family="Arial,sans-serif" font-size="11.5" fill="${P.steel}" letter-spacing="3.4">MACHINE TOOLS · ENGINEERING · TECHNOLOGY</text>
</svg>`;
}

function markSvg(color = P.navy800, accent = P.red) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" fill="${color}"/>
  <rect width="64" height="9" fill="${accent}"/>
  <path d="M16 54 V22 h9 v11 h14 V22 h9 v32 h-9 V41 H25 v13 z" fill="#ffffff"/>
</svg>`;
}

function ogSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  ${defs("og", { from: P.navy950, via: P.navy800, to: P.navy700 })}
  <rect width="1200" height="630" fill="url(#bg-og)"/>
  <rect width="1200" height="630" fill="url(#grid-og)"/>
  <rect width="1200" height="630" fill="url(#glow-og)" opacity="0.5"/>
  <rect width="1200" height="630" fill="url(#glowRed-og)" opacity="0.45"/>
  ${circuitTraces(99, 1200, 460, 16)}
  ${factoryLine(760, 300, 420, 190)}
  ${gear(960, 210, 96, 14, { stroke: P.gold, width: 4, opacity: 0.85 })}
  ${robotArm(700, 300, 0.9)}
  <rect x="0" y="0" width="1200" height="630" fill="url(#vig-og)"/>
  <g transform="translate(72 74)">
    <rect width="196" height="36" fill="${P.red}"/>
    <text x="16" y="26" font-family="'Arial Narrow',Arial,sans-serif" font-weight="bold" font-size="19" fill="#fff" letter-spacing="3.4">INVITATION</text>
  </g>
  <text x="72" y="300" font-family="'Arial Narrow',Arial,sans-serif" font-weight="bold" font-size="120" fill="#ffffff" letter-spacing="-2">INDTEC EXPO</text>
  <text x="72" y="392" font-family="'Arial Narrow',Arial,sans-serif" font-weight="bold" font-size="76" fill="${P.gold}" letter-spacing="4">2026 – 2027</text>
  <rect x="74" y="424" width="440" height="4" fill="${P.brand}"/>
  <text x="72" y="474" font-family="Arial,sans-serif" font-size="26" fill="#ffffff" fill-opacity="0.86">India's Leading B2B Industrial Machine Tools,</text>
  <text x="72" y="510" font-family="Arial,sans-serif" font-size="26" fill="#ffffff" fill-opacity="0.86">Engineering &amp; Technology Expo</text>
  <g font-family="'Arial Narrow',Arial,sans-serif" font-size="22" letter-spacing="3">
    <rect x="72" y="544" width="150" height="44" fill="none" stroke="${P.gold}" stroke-width="2"/>
    <text x="147" y="573" fill="${P.gold}" text-anchor="middle">BENGALURU</text>
    <rect x="236" y="544" width="176" height="44" fill="none" stroke="${P.gold}" stroke-width="2"/>
    <text x="324" y="573" fill="${P.gold}" text-anchor="middle">COIMBATORE</text>
    <rect x="426" y="544" width="120" height="44" fill="none" stroke="${P.gold}" stroke-width="2"/>
    <text x="486" y="573" fill="${P.gold}" text-anchor="middle">HOSUR</text>
  </g>
</svg>`;
}

/* -------------------------------- floor plans ------------------------------ */

function floorPlanSvg(id, w, h, seed) {
  const rand = rng(seed);
  const zones = [
    { label: "MACHINE TOOLS & CNC", w: 0.34, h: 0.42, tone: P.brand },
    { label: "AUTOMATION & ROBOTICS", w: 0.3, h: 0.42, tone: P.gold },
    { label: "ELECTRICAL & ELECTRONICS", w: 0.36, h: 0.42, tone: P.brandLight },
    { label: "ENGINEERING COMPONENTS", w: 0.46, h: 0.34, tone: P.red },
    { label: "MATERIAL HANDLING", w: 0.54, h: 0.34, tone: P.steelDark },
  ];
  let x = 70;
  let y = 130;
  let out = "";
  let stallNo = 1;
  const stall = 34;
  const drawStalls = (ox, oy, cols, rows, prefix) => {
    let s = "";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const filled = rand() > 0.42;
        s += `<rect x="${ox + c * stall}" y="${oy + r * stall}" width="${stall - 5}" height="${stall - 5}" fill="${filled ? P.brand : "#ffffff"}" fill-opacity="${filled ? 0.78 : 1}" stroke="${P.steelDark}" stroke-width="1.4"/>`;
        s += `<text x="${ox + c * stall + (stall - 5) / 2}" y="${oy + r * stall + (stall - 5) / 2 + 4}" font-family="monospace" font-size="9" fill="${filled ? "#fff" : P.steelDark}" text-anchor="middle">${prefix}${stallNo++}</text>`;
      }
    }
    return s;
  };

  zones.forEach((zone, i) => {
    const zw = zone.w * (w - 140);
    const zh = zone.h * (h - 260) * (i < 3 ? 1 : 0.92);
    out += `<g>
      <rect x="${x}" y="${y}" width="${zw}" height="${zh}" fill="#ffffff" stroke="${P.navy800}" stroke-width="2.5"/>
      <rect x="${x}" y="${y}" width="${zw}" height="26" fill="${zone.tone}" fill-opacity="0.9"/>
      <text x="${x + 10}" y="${y + 18}" font-family="'Arial Narrow',Arial,sans-serif" font-size="13" font-weight="bold" fill="#ffffff" letter-spacing="1.2">${zone.label}</text>
      ${drawStalls(x + 12, y + 40, Math.floor((zw - 24) / stall), Math.floor((zh - 52) / stall), ["A", "B", "C", "D", "E"][i])}
    </g>`;
    x += zw + 22;
    if (i === 1 || i === 3) {
      x = 70;
      y += zh + 26;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
  <rect width="${w}" height="${h}" fill="#f4f6f9"/>
  <rect x="40" y="40" width="${w - 80}" height="${h - 80}" fill="none" stroke="${P.navy800}" stroke-width="3"/>
  <text x="70" y="86" font-family="'Arial Narrow',Arial,sans-serif" font-size="34" font-weight="bold" fill="${P.navy800}" letter-spacing="1">INDTEC EXPO — FLOOR PLAN</text>
  <text x="70" y="112" font-family="Arial,sans-serif" font-size="15" fill="${P.steelDark}" letter-spacing="1.6">STALL LAYOUT · ZONES · ENTRY &amp; EXIT · REGISTRATION</text>
  <rect x="${w - 300}" y="62" width="230" height="52" fill="${P.navy800}"/>
  <text x="${w - 285}" y="94" font-family="'Arial Narrow',Arial,sans-serif" font-size="24" font-weight="bold" fill="${P.gold}" letter-spacing="2">${esc(id.toUpperCase())}</text>
  ${out}
  <g transform="translate(70 ${h - 150})">
    <rect width="${w - 140}" height="96" fill="#ffffff" stroke="${P.steelDark}" stroke-width="2"/>
    <text x="16" y="28" font-family="'Arial Narrow',Arial,sans-serif" font-size="15" font-weight="bold" fill="${P.navy800}" letter-spacing="2">LEGEND</text>
    <rect x="16" y="44" width="26" height="20" fill="${P.brand}" fill-opacity="0.78" stroke="${P.steelDark}"/>
    <text x="50" y="59" font-family="Arial,sans-serif" font-size="13" fill="${P.steelDark}">Booked stall</text>
    <rect x="180" y="44" width="26" height="20" fill="#fff" stroke="${P.steelDark}"/>
    <text x="214" y="59" font-family="Arial,sans-serif" font-size="13" fill="${P.steelDark}">Available stall</text>
    <rect x="344" y="44" width="26" height="20" fill="${P.red}" fill-opacity="0.8"/>
    <text x="378" y="59" font-family="Arial,sans-serif" font-size="13" fill="${P.steelDark}">Registration / help desk</text>
    <text x="${w - 190}" y="59" font-family="Arial,sans-serif" font-size="13" fill="${P.steelDark}">Scale 1:200</text>
    <text x="${w - 190}" y="78" font-family="Arial,sans-serif" font-size="13" fill="${P.steelDark}">Rev. 01</text>
  </g>
  <g transform="translate(${w - 190} ${h - 150})">
    <path d="M0 96 V16 M0 16 l-12 20 M0 16 l12 20" stroke="${P.navy800}" stroke-width="3" fill="none"/>
    <text x="0" y="10" font-family="'Arial Narrow',Arial,sans-serif" font-size="15" font-weight="bold" fill="${P.navy800}" text-anchor="middle">N</text>
  </g>
</svg>`;
}

/* --------------------------------- gallery --------------------------------- */

function gallerySvg(category, index, w = 900, h = 640) {
  const seed = seedFrom(`${category}-${index}`);
  const id = `g${seed.toString(36)}`;
  const variants = {
    Expo: ["factory", "conveyor"],
    Exhibitors: ["machine", "caliper"],
    Visitors: ["city", "circuit"],
    Machines: ["machine", "robot"],
    Networking: ["circuit", "city"],
    Events: ["gear", "factory"],
  };
  const list = variants[category] ?? ["machine"];
  const variant = list[index % list.length];
  const titles = {
    Expo: ["EXPO FLOOR", "HALL OVERVIEW", "EXHIBITION AXIS"],
    Exhibitors: ["EXHIBITOR", "STALL SHOWCASE", "PRODUCT DEMO"],
    Visitors: ["VISITORS", "DELEGATION", "TRADE VISITORS"],
    Machines: ["MACHINERY", "LIVE DEMO", "PRECISION"],
    Networking: ["NETWORKING", "BUSINESS CONNECT", "MEETUPS"],
    Events: ["EVENTS", "CONFERENCE", "CEREMONY"],
  };
  const label = (titles[category] ?? ["INDTEC"])[index % 3];
  return industrialScene(id, w, h, {
    seed,
    variant,
    title: label,
    subtitle: `${category.toUpperCase()} · 0${index + 1}`,
    tags: ["LIVE", category.toUpperCase()],
  });
}

/* --------------------------------- sponsor --------------------------------- */

function sponsorSvg(name, seed) {
  const id = `sp${seed.toString(36)}`;
  const mark = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const hue = [P.brand, P.gold, P.red, P.brandLight, P.navy600][seed % 5];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" width="320" height="120" role="img">
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${hue}"/><stop offset="100%" stop-color="${P.navy700}"/>
  </linearGradient></defs>
  <rect width="320" height="120" fill="#ffffff"/>
  <rect x="0" y="0" width="320" height="120" fill="none" stroke="${P.steel200 ?? "#dce3eb"}" stroke-width="1"/>
  <rect x="24" y="30" width="60" height="60" rx="3" fill="url(#${id})"/>
  <text x="54" y="70" font-family="'Arial Narrow',Arial,sans-serif" font-size="30" font-weight="bold" fill="#fff" text-anchor="middle">${esc(mark)}</text>
  <text x="100" y="58" font-family="'Arial Narrow',Arial,sans-serif" font-size="21" font-weight="bold" fill="${P.navy800}" letter-spacing="0.6">${esc(name.length > 22 ? name.slice(0, 21) + "…" : name)}</text>
  <text x="101" y="78" font-family="Arial,sans-serif" font-size="10.5" fill="${P.steelDark}" letter-spacing="2.4">PARTNER · INDTEC EXPO</text>
</svg>`;
}

/* --------------------------------- posters --------------------------------- */

function posterSvg() {
  const w = 1000;
  const h = 1400;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
  ${defs("poster", { from: P.navy950, via: P.navy800, to: P.navy700, angle: 120 })}
  <rect width="${w}" height="${h}" fill="url(#bg-poster)"/>
  <rect width="${w}" height="${h}" fill="url(#grid-poster)"/>
  <rect width="${w}" height="${h}" fill="url(#glow-poster)" opacity="0.5"/>
  <rect width="${w}" height="${h}" fill="url(#glowRed-poster)" opacity="0.42"/>
  ${circuitTraces(4242, w, 780, 14)}
  <rect x="0" y="740" width="${w}" height="660" fill="${P.navy950}" fill-opacity="0.45"/>
  ${skyline(88, w, 770, 250)}
  ${factoryLine(60, 560, 420, 180)}
  ${gear(790, 470, 150, 16, { stroke: P.gold, width: 5, opacity: 0.9 })}
  ${gear(640, 640, 92, 12, { stroke: P.steel, width: 4, opacity: 0.85 })}
  ${robotArm(700, 760, 1.5)}
  ${cncMachine(70, 780, 1.5)}
  <rect width="${w}" height="${h}" fill="url(#vig-poster)"/>

  <g transform="translate(64 66)">
    <rect width="250" height="46" fill="${P.red}"/>
    <text x="20" y="33" font-family="'Arial Narrow',Arial,sans-serif" font-weight="bold" font-size="25" fill="#fff" letter-spacing="4">INVITATION TO</text>
    <text x="262" y="33" font-family="'Arial Narrow',Arial,sans-serif" font-weight="bold" font-size="25" fill="${P.gold}" letter-spacing="4">EXHIBIT</text>
  </g>

  <text x="64" y="300" font-family="'Arial Narrow',Arial,sans-serif" font-weight="bold" font-size="132" fill="#ffffff" letter-spacing="-3">INDTEC</text>
  <text x="64" y="424" font-family="'Arial Narrow',Arial,sans-serif" font-weight="bold" font-size="132" fill="${P.gold}" letter-spacing="6">EXPO</text>
  <text x="70" y="504" font-family="'Arial Narrow',Arial,sans-serif" font-weight="bold" font-size="66" fill="#ffffff" fill-opacity="0.92" letter-spacing="10">2026 – 2027</text>
  <rect x="70" y="536" width="500" height="5" fill="${P.red}"/>
  <text x="70" y="600" font-family="Arial,sans-serif" font-size="26" fill="#ffffff" fill-opacity="0.9">India's Leading B2B Industrial Machine Tools,</text>
  <text x="70" y="638" font-family="Arial,sans-serif" font-size="26" fill="#ffffff" fill-opacity="0.9">Engineering &amp; Technology Expo</text>

  <g transform="translate(64 1010)">
    ${[
      ["BENGALURU", "24–26 DEC 2026", "KLE Ground, Rajajinagar"],
      ["COIMBATORE", "12–14 FEB 2027", "Codessia Road, Coimbatore"],
      ["HOSUR", "12–15 MAR 2027", "Hills Exhibition Center"],
    ]
      .map(
        (row, i) => `<g transform="translate(0 ${i * 92})">
      <rect width="872" height="76" fill="${P.navy950}" fill-opacity="0.72" stroke="${P.gold}" stroke-opacity="0.55"/>
      <rect width="8" height="76" fill="${[P.red, P.brand, P.gold][i]}"/>
      <text x="34" y="48" font-family="'Arial Narrow',Arial,sans-serif" font-size="32" font-weight="bold" fill="#ffffff" letter-spacing="2.5">${row[0]}</text>
      <text x="340" y="47" font-family="'Arial Narrow',Arial,sans-serif" font-size="26" font-weight="bold" fill="${P.gold}" letter-spacing="2">${row[1]}</text>
      <text x="620" y="46" font-family="Arial,sans-serif" font-size="15" fill="${P.steel}" letter-spacing="0.6">${row[2]}</text>
    </g>`,
      )
      .join("")}
  </g>

  <g transform="translate(64 1310)">
    <rect width="520" height="52" fill="none" stroke="${P.gold}" stroke-width="2"/>
    <text x="24" y="35" font-family="'Arial Narrow',Arial,sans-serif" font-size="24" font-weight="bold" fill="${P.gold}" letter-spacing="3">CONNECT · INNOVATE · GROW</text>
    <text x="640" y="34" font-family="Arial,sans-serif" font-size="19" fill="#ffffff" fill-opacity="0.85">Organised by Konnekt Globe</text>
  </g>
</svg>`;
}

/* --------------------------------- generate -------------------------------- */

const generated = [];

// brand
generated.push(write("brand/logo.svg", logoSvg()));
generated.push(write("brand/logo-light.svg", logoLightSvg()));
generated.push(write("brand/mark.svg", markSvg()));
generated.push(write("brand/mark-light.svg", markSvg("#ffffff", P.red)));
generated.push(write("brand/og-default.svg", ogSvg()));
generated.push(write("brand/hero-poster.svg", posterSvg()));

// hero + about
generated.push(
  write(
    "hero/hero-industrial.svg",
    industrialScene("hero", 1920, 1080, {
      seed: seedFrom("hero"),
      variant: "robot",
      title: "INDTEC EXPO",
      subtitle: "2026 – 2027 · CONNECT INNOVATE GROW",
      tags: ["MACHINE TOOLS", "AUTOMATION", "ENGINEERING"],
      gradient: { from: P.navy950, via: P.navy800, to: P.navy600 },
    }),
  ),
);
generated.push(
  write(
    "hero/hero-register.svg",
    industrialScene("hreg", 1600, 720, {
      seed: seedFrom("register"),
      variant: "circuit",
      title: "REGISTER",
      subtitle: "TRADE VISITOR ACCESS · FREE ENTRY",
      tags: ["E-PASS", "3 CITIES"],
    }),
  ),
);
generated.push(
  write(
    "hero/hero-book-stall.svg",
    industrialScene("hbook", 1600, 720, {
      seed: seedFrom("bookstall"),
      variant: "conveyor",
      title: "BOOK YOUR STALL",
      subtitle: "SPECIAL EXHIBITOR OFFERS AVAILABLE",
      tags: ["RAW SPACE", "SHELL SCHEME"],
    }),
  ),
);
generated.push(
  write(
    "hero/hero-about.svg",
    industrialScene("habout", 1600, 760, {
      seed: seedFrom("about"),
      variant: "factory",
      title: "KONNEKT GLOBE",
      subtitle: "EXHIBITIONS · TRADE FAIRS · BUSINESS CONNECT",
      tags: ["SINCE 2018"],
    }),
  ),
);
generated.push(
  write(
    "hero/hero-floorplan.svg",
    industrialScene("hfp", 1600, 640, {
      seed: seedFrom("floorplan"),
      variant: "circuit",
      title: "FLOOR PLAN",
      subtitle: "STALL LAYOUT · ZONES · ACCESS",
      tags: ["ZOOMABLE", "DOWNLOAD"],
    }),
  ),
);
generated.push(
  write(
    "hero/hero-media.svg",
    industrialScene("hmedia", 1600, 640, {
      seed: seedFrom("media"),
      variant: "gear",
      title: "MEDIA CENTRE",
      subtitle: "NEWS · PRESS RELEASES · INDUSTRY INSIGHTS",
      tags: ["PRESS"],
    }),
  ),
);
generated.push(
  write(
    "hero/hero-contact.svg",
    industrialScene("hcontact", 1600, 640, {
      seed: seedFrom("contact"),
      variant: "city",
      title: "CONTACT",
      subtitle: "STALL BOOKINGS & ENQUIRIES",
      tags: ["CALL", "WHATSAPP"],
    }),
  ),
);

// events
const eventData = [
  ["bengaluru", "BENGALURU", "24–26 DEC 2026 · KLE GROUND", "city"],
  ["coimbatore", "COIMBATORE", "12–14 FEB 2027 · CODESSIA ROAD", "factory"],
  ["hosur", "HOSUR", "12–15 MAR 2027 · HILLS EXHIBITION CENTER", "crane"],
];
for (const [slug, title, subtitle, variant] of eventData) {
  generated.push(
    write(
      `events/${slug}.svg`,
      industrialScene(`ev-${slug}`, 1400, 900, {
        seed: seedFrom(slug),
        variant,
        title,
        subtitle,
        tags: ["3-DAY EXPO", "B2B"],
      }),
    ),
  );
}

// venues
for (const [slug] of eventData) {
  generated.push(
    write(
      `venues/${slug}.svg`,
      industrialScene(`vn-${slug}`, 1200, 760, {
        seed: seedFrom(`venue-${slug}`),
        variant: "city",
        title: slug.toUpperCase() + " VENUE",
        subtitle: "EXHIBITION GROUND · MAP & DIRECTIONS",
        tags: ["VENUE"],
      }),
    ),
  );
}

// industries
const industryArt = [
  ["machine-tools", "MACHINE TOOLS", "CNC · LATHES · MILLING", "machine"],
  ["automation", "AUTOMATION", "ROBOTS · PLC · SCADA", "robot"],
  ["industrial-technology", "INDUSTRY 4.0", "IIOT · MES · DIGITAL TWIN", "circuit"],
  ["electrical", "ELECTRICAL", "DRIVES · PANELS · SENSORS", "circuit"],
  ["instrumentation", "INSTRUMENTATION", "METROLOGY · GAUGES", "caliper"],
  ["material-handling", "MATERIAL HANDLING", "CRANES · AGV · RACKING", "crane"],
  ["pneumatics", "PNEUMATICS", "CYLINDERS · VALVES · PUMPS", "gear"],
  ["components", "COMPONENTS", "BEARINGS · GEARS · FASTENERS", "gear"],
  ["manufacturing", "MANUFACTURING", "WELDING · ADDITIVE · EPC", "factory"],
  ["services", "INDUSTRIAL SERVICES", "DESIGN · LOGISTICS · FINANCE", "city"],
];
for (const [slug, title, subtitle, variant] of industryArt) {
  generated.push(
    write(
      `industries/${slug}.svg`,
      industrialScene(`in-${slug}`, 900, 640, {
        seed: seedFrom(slug),
        variant,
        title,
        subtitle,
      }),
    ),
  );
}

// gallery
for (const category of ["Expo", "Exhibitors", "Visitors", "Machines", "Networking", "Events"]) {
  for (let i = 0; i < 3; i++) {
    generated.push(
      write(`gallery/${category.toLowerCase()}-${i + 1}.svg`, gallerySvg(category, i)),
    );
  }
}

// media
const mediaArt = [
  ["press-1", "PRESS RELEASE", "THREE-CITY CALENDAR", "city"],
  ["press-2", "EXPO UPDATE", "STALL BOOKINGS OPEN", "conveyor"],
  ["press-3", "EXPO UPDATE", "HOSUR EXTENDED", "crane"],
  ["insight-1", "INDUSTRY INSIGHT", "MACHINE TOOL DEMAND", "gear"],
  ["insight-2", "LATEST NEWS", "DELEGATION PROGRAMME", "factory"],
  ["insight-3", "PRESS RELEASE", "INDUSTRY 4.0 TRACK", "circuit"],
];
for (const [slug, title, subtitle, variant] of mediaArt) {
  generated.push(
    write(
      `media/${slug}.svg`,
      industrialScene(`md-${slug}`, 1000, 640, {
        seed: seedFrom(slug),
        variant,
        title,
        subtitle,
      }),
    ),
  );
}

// sponsors
const sponsorNames = [
  "Prime MachineTools",
  "Axis Automation",
  "Bharat Industrial",
  "South India Mfg Association",
  "Coimbatore Engineering Cluster",
  "Hosur Industries Forum",
  "Karnataka MSME Council",
  "Engineering Review",
  "Manufacturing Today",
  "Industrial Digest",
  "TechFab Journal",
  "GridWorks Cloud",
  "Metrica Analytics",
  "Nexa Digital",
  "Machine Tools Association",
  "Automation Council of India",
  "Indian Engineering Chamber",
];
const sponsorFiles = [
  "prime-machinetools", "axis-automation", "bharat-industrial",
  "sima", "cec", "hif", "kmc",
  "engineering-review", "manufacturing-today", "industrial-digest", "techfab",
  "gridworks", "metrica", "nexa",
  "mta", "aci", "iec",
];
sponsorNames.forEach((name, i) => {
  generated.push(
    write(`sponsors/${sponsorFiles[i]}.svg`, sponsorSvg(name, seedFrom(name))),
  );
});

// floor plans
generated.push(write("floor-plans/bengaluru.svg", floorPlanSvg("Bengaluru", 1600, 1100, seedFrom("fp-blr"))));
generated.push(write("floor-plans/coimbatore.svg", floorPlanSvg("Coimbatore", 1600, 1100, seedFrom("fp-cbe"))));
generated.push(write("floor-plans/hosur.svg", floorPlanSvg("Hosur", 1600, 1100, seedFrom("fp-hsr"))));

// misc placeholders
generated.push(
  write(
    "exhibitors/exhibitor-placeholder.svg",
    industrialScene("exph", 800, 600, {
      seed: seedFrom("exhibitor"),
      variant: "machine",
      title: "EXHIBITOR",
      subtitle: "PROFILE SHOWCASE",
    }),
  ),
);
generated.push(
  write(
    "sponsors/placeholder.svg",
    sponsorSvg("Your Brand Here", seedFrom("placeholder")),
  ),
);

console.log(`Generated ${generated.length} SVG assets in public/images`);
