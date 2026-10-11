// Utilitarios para descargar un conjunto de filas como .csv desde el admin.
// Lo usa FinanceTab (top clientes, renovaciones, breakdown por item) y UsersTab
// (lista completa de usuarios).

/** Serializa un valor como celda CSV: envuelve en comillas si tiene coma,
 *  comilla o salto de línea; escapa comillas duplicándolas (RFC 4180). */
export function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Arma un .csv con BOM U+FEFF al inicio (para que Excel abra bien el UTF-8 y
 *  los acentos y la "ñ" no se corrompan), lo mete en un Blob y dispara la
 *  descarga por el patrón del ancla <a download>. */
export function downloadCsv(
  filename: string,
  header: string[],
  rows: (string | number)[][],
) {
  const csv =
    "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
