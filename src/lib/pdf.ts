/**
 * Dependency-free PDF writer (single page, Latin-1 text only).
 *
 * Used to generate downloadable documents such as the per-event floor plan
 * PDFs directly from the versioned event data, so no binary assets need to
 * live in the repository.
 */

export interface PdfLine {
  text: string;
  size?: number;
  bold?: boolean;
  color?: "navy" | "body" | "muted" | "accent";
  spaceBefore?: number;
  rule?: boolean;
}

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 56;

const COLORS: Record<NonNullable<PdfLine["color"]>, string> = {
  navy: "0.027 0.078 0.153 rg",
  body: "0.2 0.25 0.32 rg",
  muted: "0.45 0.5 0.56 rg",
  accent: "0.88 0.145 0.106 rg",
};

const ASCII_MAP: Record<string, string> = {
  "–": "-",
  "—": "-",
  "‘": "'",
  "’": "'",
  "“": '"',
  "”": '"',
  "₹": "Rs ",
  "×": "x",
  "·": "-",
  "•": "-",
  "…": "...",
  "→": "->",
  "\u00a0": " ",
};

function sanitize(input: string): string {
  return input.replace(/[^\x20-\x7E]/g, (char) => ASCII_MAP[char] ?? "-");
}

function escape(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function contentStream(lines: PdfLine[]): string {
  const ops: string[] = [];
  let y = PAGE_H - MARGIN;

  for (const line of lines) {
    const size = line.size ?? 10.5;

    if (line.rule) {
      y -= 14;
      ops.push(`0.85 0.87 0.9 RG 0.8 w ${MARGIN} ${y} m ${PAGE_W - MARGIN} ${y} l S`);
      y -= 10;
    }

    y -= (line.spaceBefore ?? 0) + size * 1.45;
    if (y < MARGIN) break;

    const font = line.bold ? "/F2" : "/F1";
    const color = COLORS[line.color ?? "body"];
    ops.push(
      `${color} BT ${font} ${size} Tf ${MARGIN} ${y.toFixed(2)} Td (${escape(sanitize(line.text))}) Tj ET`,
    );
  }

  // Footer rule + page marker
  ops.push(`0.85 0.87 0.9 RG 0.8 w ${MARGIN} ${MARGIN + 8} m ${PAGE_W - MARGIN} ${MARGIN + 8} l S`);
  ops.push(
    `${COLORS.muted} BT /F1 8 Tf ${MARGIN} ${MARGIN - 6} Td (${escape(
      "INDTEC EXPO 2026-2027 - organised by Konnekt Globe - www.indtecexpo.com",
    )}) Tj ET`,
  );

  return ops.join("\n");
}

export function createTextPdf(lines: PdfLine[]): Buffer {
  const stream = contentStream(lines);

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`,
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body, "latin1"));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(body, "latin1");
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(body, "latin1");
}
