// Una respuesta de Basalt como documento que se puede llevar: Word o impresión/PDF.
// Word abre HTML con extensión .doc tal cual (el mismo truco de `Propuesta.doc`), así que
// no hace falta ninguna librería: se arma el HTML de la respuesta y se le quita lo que
// solo sirve dentro del chat (botones, vistas previas, pestañas).
import { mdToHtml } from "./markdown";

const DOC_CSS =
  `body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;color:#1f1f1f;max-width:760px;margin:32px auto;padding:0 28px}` +
  `h1,h2,h3,h4{font-family:Calibri,Arial,sans-serif;line-height:1.25;margin:1.2em 0 .4em}h3{font-size:15pt}h4{font-size:12.5pt}` +
  `p,ul,ol{margin:0 0 .7em}table{border-collapse:collapse;width:100%;margin:0 0 1em}` +
  `th,td{border:1px solid #b8b8bc;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f1f1f3}` +
  `pre{background:#f6f6f7;padding:10px;white-space:pre-wrap;font-size:9.5pt}code{font-family:Consolas,Menlo,monospace}` +
  `blockquote{border-left:3px solid #c8c8cc;margin:0 0 .7em;padding-left:12px;color:#55585c}a{color:#5b21b6}` +
  `@media print{body{margin:0;max-width:none;padding:0}a{color:inherit;text-decoration:none}}`;

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** El cuerpo del documento: la respuesta ya dibujada, sin los controles del chat. */
export function docBodyHtml(markdown: string): string {
  const host = document.createElement("div");
  host.innerHTML = mdToHtml(markdown);
  host.querySelectorAll("button, iframe, details, .md-proj-tabs, .md-proj-toolbar, .md-proj-note, .md-codehead, .md-proj-filebar").forEach((n) => n.remove());
  return host.innerHTML;
}

export function wordDocument(title: string, markdown: string): string {
  return `<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${DOC_CSS}</style></head><body>${docBodyHtml(markdown)}</body></html>`;
}

/** Imprime (o guarda como PDF) SOLO el documento: un iframe oculto con su propio HTML, sin
 *  scripts (el contenido ya pasó por DOMPurify), para no imprimir la app entera. */
export function printDocument(title: string, markdown: string): void {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  // Mismo origen (para poder pedirle que imprima) pero SIN scripts: el contenido ya pasó por
  // DOMPurify, y si algo se colara igual no podría ejecutarse.
  frame.setAttribute("sandbox", "allow-same-origin allow-modals");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  frame.srcdoc = wordDocument(title, markdown);
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      setTimeout(() => frame.remove(), 60_000);
    }
  };
  document.body.appendChild(frame);
}
