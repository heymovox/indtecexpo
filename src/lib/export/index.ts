import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

export type ExportFormat = "csv" | "xlsx" | "pdf";

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExportOptions {
  filename: string;
  title?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  format: ExportFormat;
}

function prepareRows(data: Record<string, unknown>[], columns: ExportColumn[]): (string | number)[][] {
  return data.map((row) => columns.map((col) => String(row[col.key] ?? "")));
}

function prepareHeaders(columns: ExportColumn[]): string[] {
  return columns.map((col) => col.header);
}

export function exportCSV({ columns, data }: Omit<ExportOptions, "format" | "filename">): string {
  const headers = prepareHeaders(columns);
  const rows = prepareRows(data, columns);
  const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
  return csv;
}

export function exportXLSX({ columns, data }: Omit<ExportOptions, "format" | "filename">): Blob {
  const headers = prepareHeaders(columns);
  const rows = prepareRows(data, columns);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Export");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

const NAVY: [number, number, number] = [7, 20, 39];
const STEEL: [number, number, number] = [100, 116, 139];
const STEEL_LIGHT: [number, number, number] = [226, 232, 240];
const GOLD: [number, number, number] = [245, 179, 1];
const WHITE: [number, number, number] = [255, 255, 255];
const CARD_BG: [number, number, number] = [248, 250, 252];

const STAGE_COLORS: Record<string, [number, number, number]> = {
  new: [20, 112, 220],
  contacted: [124, 58, 237],
  qualified: [245, 179, 1],
  proposal: [226, 113, 29],
  won: [15, 157, 88],
  lost: [217, 35, 46],
};

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function drawRoundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fill?: [number, number, number], stroke?: [number, number, number]): void {
  doc.setDrawColor(...(stroke ?? STEEL_LIGHT));
  if (fill) doc.setFillColor(...fill);
  doc.roundedRect(x, y, w, h, r, r, fill ? "FD" : "S");
}

function drawStageChip(doc: jsPDF, x: number, y: number, stage: string): number {
  const label = stage.charAt(0).toUpperCase() + stage.slice(1);
  const color = STAGE_COLORS[stage] ?? STEEL;
  doc.setFontSize(7);
  const textWidth = doc.getTextWidth(label);
  const chipW = textWidth + 10;
  const chipH = 7;
  doc.setFillColor(...color);
  doc.roundedRect(x, y, chipW, chipH, 3.5, 3.5, "F");
  doc.setTextColor(...WHITE);
  doc.text(label, x + 5, y + 5);
  doc.setTextColor(...NAVY);
  return chipW;
}

function drawFieldRow(doc: jsPDF, x: number, y: number, label: string, value: string, cardW: number): number {
  const labelW = 32;
  const valueX = x + labelW;
  const valueW = cardW - labelW - 4;

  doc.setFontSize(7);
  doc.setTextColor(...STEEL);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), x, y);

  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "normal");

  const lines = wrapText(doc, value || "—", valueW);
  const lineHeight = 3.8;
  lines.forEach((line, i) => {
    doc.text(line, valueX, y + i * lineHeight);
  });

  return Math.max(lines.length * lineHeight, 5) + 2;
}

export function exportPDF({ title, columns, data }: Omit<ExportOptions, "format" | "filename">): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const cardW = pageW - margin * 2;
  let y = margin;

  if (title) {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageW, 32, "F");

    doc.setFontSize(18);
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), margin, 16);

    doc.setFontSize(9);
    doc.setTextColor(180, 190, 210);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated ${new Date().toLocaleString()}  •  ${data.length} record${data.length === 1 ? "" : "s"}`, margin, 24);

    doc.setFillColor(...GOLD);
    doc.rect(margin, 28, 30, 1.2, "F");

    y = 40;
  }

  const baseKeys = ["Reference", "Type", "Stage", "Received", "Event"];
  const fieldKeys = columns
    .map((c) => c.key)
    .filter((k) => !baseKeys.includes(k));

  data.forEach((row, index) => {
    const fields: { label: string; value: string }[] = [];
    for (const key of fieldKeys) {
      const col = columns.find((c) => c.key === key);
      const val = String(row[key] ?? "");
      if (val) {
        fields.push({ label: col?.header ?? key, value: val });
      }
    }

    const fieldRows = Math.ceil(fields.length / 2);
    const fieldBlockH = fieldRows * 14 + 8;
    const cardH = 32 + fieldBlockH + 10;

    if (y + cardH > pageH - margin) {
      doc.addPage();
      y = margin;
    }

    drawRoundedRect(doc, margin, y, cardW, cardH, 3, CARD_BG, STEEL_LIGHT);

    doc.setFillColor(...NAVY);
    doc.roundedRect(margin, y, 4, cardH, 2, 2, "F");

    const innerX = margin + 8;
    const innerW = cardW - 16;

    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.text(String(row["Reference"] ?? `Record ${index + 1}`), innerX, y + 9);

    doc.setFontSize(7.5);
    doc.setTextColor(...STEEL);
    doc.setFont("helvetica", "normal");
    doc.text(String(row["Type"] ?? ""), innerX, y + 14);

    drawStageChip(doc, innerX + innerW - 30, y + 5, String(row["Stage"] ?? "new"));

    doc.setFontSize(7.5);
    doc.setTextColor(...STEEL);
    doc.setFont("helvetica", "normal");
    doc.text(String(row["Received"] ?? ""), innerX + innerW - 55, y + 14);

    doc.setDrawColor(...STEEL_LIGHT);
    doc.setLineWidth(0.2);
    doc.line(innerX, y + 18, innerX + innerW, y + 18);

    let fy = y + 22;
    const colW = (innerW - 6) / 2;

    for (let i = 0; i < fields.length; i++) {
      const col = i % 2;
      const fx = innerX + col * (colW + 6);
      const field = fields[i];
      drawFieldRow(doc, fx, fy, field.label, field.value, colW);
      if (col === 1 || i === fields.length - 1) {
        fy += 14;
      }
    }

    if (row["Event"]) {
      doc.setFontSize(7);
      doc.setTextColor(...STEEL);
      doc.setFont("helvetica", "italic");
      doc.text(`Event: ${String(row["Event"])}`, innerX, y + cardH - 5);
    }

    y += cardH + 5;
  });

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(160, 170, 190);
    doc.text(`INDTEC EXPO  •  Page ${p} of ${totalPages}`, pageW / 2, pageH - 6, { align: "center" });
  }

  return doc.output("blob");
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}
