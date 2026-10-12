import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

export function exportPDF({ title, columns, data }: Omit<ExportOptions, "format" | "filename">): Blob {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 14);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);
  }
  const headers = prepareHeaders(columns);
  const rows = prepareRows(data, columns);
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: title ? 26 : 14,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: columns.reduce((acc, col, i) => {
      if (col.width) acc[i] = { cellWidth: col.width };
      return acc;
    }, {} as Record<number, { cellWidth?: number }>),
  });
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