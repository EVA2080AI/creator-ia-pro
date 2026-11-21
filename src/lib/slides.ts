// Presentaciones. El modelo escribe un bloque ```slides —markdown con las diapositivas
// separadas por `---`— y de ese ÚNICO modelo salen la vista (deckHtml, un documento que
// corre en el iframe de vista previa y también sirve suelto) y el PowerPoint
// (slides-pptx.ts). Pedido de Sebastián (2026-11-21): "debe poder hacer presentaciones,
// así que pon un visualizador de ppt".
//
// Lógica pura, sin DOM. El formato es markdown a propósito: los modelos gratuitos lo
// escriben bien, y si la respuesta se corta lo que llegó sigue siendo una presentación.
import { PREVIEW_SHIM } from "./project-preview";

export interface Run { text: string; bold?: boolean; italic?: boolean; code?: boolean; href?: string }
export interface ListItem { level: number; runs: Run[] }
export type Block =
  | { type: "bullets"; ordered: boolean; items: ListItem[] }
  | { type: "para"; runs: Run[] }
  | { type: "heading"; runs: Run[] }
  | { type: "table"; rows: Run[][][] }
  | { type: "quote"; runs: Run[]; author?: string };

/** cover: portada · section: solo un título · stat: una cifra grande · quote · content: el resto. */
export type SlideLayout = "cover" | "section" | "stat" | "quote" | "content";

export interface Slide {
  layout: SlideLayout;
  title: string;
  blocks: Block[];
  notes: string;
  /** 0 holgada · 1 cargada · 2 muy cargada: baja el tamaño de letra para que quepa. */
  density: 0 | 1 | 2;
}

export interface Deck {
  title: string;
  /** Color de marca, `#rrggbb`. */
  accent: string;
  dark: boolean;
  slides: Slide[];
}

export const DEFAULT_ACCENT = "#7c3aed";
/** Lenguajes de bloque que son una presentación. */
export const SLIDES_LANGS = /^(slides?|presentaci[oó]n|presentation|diapositivas|ppt|pptx|deck|marp)$/i;

const SEPARATOR = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const DIRECTIVE = /^\s*(color|tema|theme|t[ií]tulo|title|marp|paginate|size|author|autor|lang|backgroundColor|class|style|header|footer)\s*:\s*(.*)$/i;
/** Las únicas claves que valen sueltas, sin front-matter (una línea "Autor: Ana" es contenido). */
const LOOSE_DIRECTIVE = /^\s*(color|tema|theme|t[ií]tulo|title)\s*:/i;
const NOTES = /^\s*(?:notas?(?:\s+del\s+orador)?|notes?|speaker\s+notes?)\s*:\s*(.*)$/i;
const BULLET = /^(\s*)(?:[-*+•]|(\d+)[.)])\s+(.*)$/;
const TABLE_ROW = /^\s*\|(.+)\|\s*$/;
const TABLE_RULE = /^:?-{2,}:?$/;
const IMAGE_ONLY = /^\s*!\[[^\]]*\]\([^)]*\)\s*$/;
const STAT = /^[\s$€£%.,+\-–—×xX<>≈~/:]*\d[\d\s$€£%.,+\-–—×xX<>≈~/:kKmMbB]*$/;

/** `**negrita**`, `*cursiva*`, `` `código` `` y `[texto](url)` → trozos con formato. */
export function parseRuns(text: string): Run[] {
  const runs: Run[] = [];
  const re = /\*\*(.+?)\*\*|__(.+?)__|\*([^*\n]+?)\*|(?<![\w])_([^_\n]+?)_(?![\w])|`([^`\n]+?)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) runs.push({ text: text.slice(last, m.index) });
    if (m[1] ?? m[2]) runs.push({ text: m[1] ?? m[2], bold: true });
    else if (m[3] ?? m[4]) runs.push({ text: m[3] ?? m[4], italic: true });
    else if (m[5]) runs.push({ text: m[5], code: true });
    else runs.push({ text: m[6], href: m[7] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last) });
  return runs.filter((r) => r.text !== "");
}

export const runsText = (runs: Run[]) => runs.map((r) => r.text).join("");

function blockChars(b: Block): number {
  if (b.type === "bullets") return b.items.reduce((n, i) => n + runsText(i.runs).length, 0);
  if (b.type === "table") return b.rows.flat().reduce((n, c) => n + runsText(c).length, 0);
  return runsText(b.runs).length;
}

function densityOf(blocks: Block[]): 0 | 1 | 2 {
  const chars = blocks.reduce((n, b) => n + blockChars(b), 0);
  const lines = blocks.reduce((n, b) => n + (b.type === "bullets" ? b.items.length : b.type === "table" ? b.rows.length : 1.5), 0);
  if (chars > 640 || lines > 10) return 2;
  if (chars > 360 || lines > 6.5) return 1;
  return 0;
}

function parseSlide(lines: string[], index: number): Slide | null {
  let title = "";
  let notes = "";
  const blocks: Block[] = [];
  let para: string[] = [];
  const flushPara = () => { if (para.length) { blocks.push({ type: "para", runs: parseRuns(para.join(" ")) }); para = []; } };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) { flushPara(); continue; }

    const comment = /^<!--\s*([\s\S]*?)\s*-->$/.exec(line);
    if (comment) { flushPara(); if (!/^_?(class|paginate|backgroundColor|color|footer|header)\s*:/i.test(comment[1])) notes += (notes ? "\n" : "") + comment[1]; continue; }

    const note = NOTES.exec(line);
    if (note) {
      flushPara();
      notes += (notes ? "\n" : "") + [note[1], ...lines.slice(i + 1)].map((l) => l.trim()).filter(Boolean).join("\n");
      break;
    }
    if (IMAGE_ONLY.test(line)) { flushPara(); continue; } // sin fotos externas: se rompen siempre

    const heading = /^(#{1,6})\s+(.*?)\s*#*$/.exec(line);
    if (heading) {
      flushPara();
      if (!title && !blocks.length) title = runsText(parseRuns(heading[2]));
      else blocks.push({ type: "heading", runs: parseRuns(heading[2]) });
      continue;
    }

    if (TABLE_ROW.test(line)) {
      flushPara();
      const rows: Run[][][] = [];
      for (; i < lines.length && TABLE_ROW.test(lines[i]); i++) {
        const cells = TABLE_ROW.exec(lines[i])![1].split("|").map((c) => c.trim());
        if (!cells.every((c) => TABLE_RULE.test(c))) rows.push(cells.map(parseRuns));
      }
      i--;
      if (rows.length) blocks.push({ type: "table", rows });
      continue;
    }

    if (line.startsWith(">")) {
      flushPara();
      const quoted: string[] = [];
      for (; i < lines.length && lines[i].trim().startsWith(">"); i++) quoted.push(lines[i].trim().replace(/^>\s?/, ""));
      i--;
      const last = quoted[quoted.length - 1] ?? "";
      const author = quoted.length > 1 && /^[—–-]\s*\S/.test(last) ? last.replace(/^[—–-]\s*/, "") : undefined;
      const body = (author ? quoted.slice(0, -1) : quoted).filter(Boolean).join(" ");
      if (body) blocks.push({ type: "quote", runs: parseRuns(body.replace(/^["“«]\s*|\s*["”»]$/g, "")), author });
      continue;
    }

    const bullet = BULLET.exec(raw);
    if (bullet) {
      flushPara();
      const ordered = bullet[2] !== undefined;
      const level = Math.min(2, Math.floor(bullet[1].replace(/\t/g, "  ").length / 2));
      const prev = blocks[blocks.length - 1];
      const item = { level, runs: parseRuns(bullet[3]) };
      if (prev?.type === "bullets" && (prev.ordered === ordered || level > 0)) prev.items.push(item);
      else blocks.push({ type: "bullets", ordered, items: [{ ...item, level: 0 }] });
      continue;
    }

    para.push(line);
  }
  flushPara();

  if (!title && !blocks.length) return null;
  const only = blocks.length === 1 ? blocks[0] : undefined;
  const shortBody = blocks.every((b) => b.type === "para") && blocks.length <= 2;
  let layout: SlideLayout = "content";
  if (!blocks.length) layout = index === 0 ? "cover" : "section";
  else if (index === 0 && title && shortBody) layout = "cover";
  else if (blocks[0].type === "quote" && blocks.every((b) => b.type === "quote" || b.type === "para")) layout = "quote";
  else if (title.length <= 14 && STAT.test(title) && shortBody) layout = "stat";
  else if (!title && only?.type === "para" && runsText(only.runs).length <= 60) {
    // Una sola frase corta sin título: es un separador, no una diapositiva vacía con un párrafo.
    title = runsText(only.runs);
    return { layout: index === 0 ? "cover" : "section", title, blocks: [], notes, density: 0 };
  }
  return { layout, title, blocks, notes, density: layout === "content" ? densityOf(blocks) : 0 };
}

const HEX = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;
function normalizeColor(v: string): string | null {
  const m = HEX.exec(v.trim().replace(/["';]/g, ""));
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  return "#" + h.toLowerCase();
}

/** Markdown de un bloque ```slides → presentación. Nunca lanza: lo que no entiende lo trata como texto. */
export function parseDeck(source: string): Deck {
  let lines = source.replace(/\r\n?/g, "\n").split("\n");
  let accent = DEFAULT_ACCENT;
  let dark = false;
  let named = "";

  const apply = (line: string): boolean => {
    const d = DIRECTIVE.exec(line);
    if (!d) return false;
    const key = d[1].toLowerCase();
    const value = d[2].trim();
    if (key === "color") accent = normalizeColor(value) ?? accent;
    else if (key === "tema" || key === "theme") dark = /oscuro|dark|negro|noche/i.test(value);
    else if (/^t[ií]tulo$|^title$/.test(key)) named = value.replace(/^["']|["']$/g, "");
    return true;
  };

  // Cabecera opcional. Dos formas: el front-matter de Marp (`---` … `---` con pares clave: valor)
  // o líneas sueltas `color:` / `tema:` / `título:` antes de la primera diapositiva.
  let start = lines.findIndex((l) => l.trim());
  if (start < 0) start = lines.length;
  if (SEPARATOR.test(lines[start] ?? "")) {
    const end = lines.findIndex((l, k) => k > start && SEPARATOR.test(l));
    const inner = end > start ? lines.slice(start + 1, end) : [];
    if (inner.some((l) => DIRECTIVE.test(l)) && inner.every((l) => !l.trim() || DIRECTIVE.test(l))) {
      inner.forEach(apply);
      start = end + 1;
    }
  }
  for (; start < lines.length; start++) {
    const line = lines[start];
    if (!line.trim()) continue;
    if (!LOOSE_DIRECTIVE.test(line) || !apply(line)) break;
  }
  lines = lines.slice(start);

  let groups: string[][] = [[]];
  for (const line of lines) {
    if (SEPARATOR.test(line)) groups.push([]);
    else groups[groups.length - 1].push(line);
  }
  // Sin ningún separador (el modelo los olvidó): cada título abre una diapositiva.
  if (groups.length === 1) {
    groups = [[]];
    for (const line of lines) {
      if (/^#{1,3}\s+\S/.test(line.trim()) && groups[groups.length - 1].some((l) => l.trim())) groups.push([]);
      groups[groups.length - 1].push(line);
    }
  }

  const slides: Slide[] = [];
  for (const g of groups) {
    const slide = parseSlide(g, slides.length);
    if (slide) slides.push(slide);
  }
  return { title: named || slides.find((s) => s.title)?.title || "Presentación", accent, dark, slides };
}

/** Blanco o casi negro, el que mejor se lea sobre el color (luminancia relativa WCAG). */
export function readableOn(hex: string): "#ffffff" | "#111318" {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.42 ? "#111318" : "#ffffff";
}

// ── HTML ─────────────────────────────────────────────────────────────────────

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function runsHtml(runs: Run[]): string {
  return runs.map((r) => {
    let h = esc(r.text);
    if (r.code) h = `<code>${h}</code>`;
    if (r.bold) h = `<b>${h}</b>`;
    if (r.italic) h = `<i>${h}</i>`;
    if (r.href) h = `<a href="${esc(r.href)}" target="_blank" rel="noopener">${h}</a>`;
    return h;
  }).join("");
}

function listHtml(b: Extract<Block, { type: "bullets" }>): string {
  const tag = b.ordered ? "ol" : "ul";
  let html = `<${tag}>`;
  let depth = 0;
  b.items.forEach((item, i) => {
    while (depth < item.level) { html += "<ul>"; depth++; }
    while (depth > item.level) { html += "</li></ul>"; depth--; }
    if (i > 0 && depth === item.level) html += "</li>";
    html += `<li>${runsHtml(item.runs)}`;
  });
  while (depth > 0) { html += "</li></ul>"; depth--; }
  return `${html}</li></${tag}>`;
}

function blockHtml(b: Block): string {
  switch (b.type) {
    case "bullets": return listHtml(b);
    case "para": return `<p>${runsHtml(b.runs)}</p>`;
    case "heading": return `<h3>${runsHtml(b.runs)}</h3>`;
    case "quote": return `<blockquote><p>${runsHtml(b.runs)}</p>${b.author ? `<cite>${esc(b.author)}</cite>` : ""}</blockquote>`;
    case "table":
      return `<table>${b.rows.map((row, i) => `<tr>${row.map((c) => `<${i ? "td" : "th"}>${runsHtml(c)}</${i ? "td" : "th"}>`).join("")}</tr>`).join("")}</table>`;
  }
}

function slideHtml(s: Slide, n: number, total: number, deckTitle: string): string {
  const body = s.blocks.map(blockHtml).join("");
  const inner = s.layout === "stat"
    ? `<div class="num">${esc(s.title)}</div><div class="body">${body}</div>`
    : `${s.title ? `<h2>${esc(s.title)}</h2>` : ""}${body ? `<div class="body">${body}</div>` : ""}`;
  return (
    `<section class="slide ${s.layout} d${s.density}" aria-roledescription="diapositiva" aria-label="${n} de ${total}${s.title ? ": " + esc(s.title) : ""}">` +
      `<div class="in">${inner}</div>` +
      `<footer><span>${esc(deckTitle)}</span><span>${n}</span></footer>` +
    `</section>` +
    (s.notes ? `<aside class="notes"><b>Notas</b> ${esc(s.notes).replace(/\n/g, "<br>")}</aside>` : "")
  );
}

// Todo se mide en `cqw` (centésimas del ancho de la diapositiva): la misma diapositiva se ve
// igual en la tarjeta del chat, en el Canvas, a pantalla completa y al imprimir.
const DECK_CSS = `
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{font-family:Inter,"Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;background:var(--page);color:var(--ink);-webkit-font-smoothing:antialiased}
.deck{display:flex;flex-direction:column;align-items:center;gap:18px;padding:18px 14px 76px}
.slide{position:relative;width:min(100%,1100px);aspect-ratio:16/9;container-type:inline-size;background:var(--bg);color:var(--ink);border-radius:10px;box-shadow:0 1px 2px rgba(0,0,0,.08),0 10px 30px -14px rgba(0,0,0,.35);overflow:hidden;scroll-margin:18px;outline:2px solid transparent;outline-offset:3px}
.slide.current{outline-color:var(--accent)}
.in{position:absolute;inset:0;padding:5.4cqw 6cqw 6.4cqw;display:flex;flex-direction:column;justify-content:center;gap:2.4cqw;font-size:2.5cqw;line-height:1.38}
.d1 .in{font-size:2.1cqw;gap:1.9cqw}.d2 .in{font-size:1.74cqw;gap:1.5cqw;line-height:1.32}
h2{margin:0;font-size:4.1cqw;line-height:1.12;font-weight:700;letter-spacing:-.02em;text-wrap:balance}
.d1 h2{font-size:3.5cqw}.d2 h2{font-size:3.1cqw}
.content .in{justify-content:flex-start}
.content h2{padding-top:1.5cqw;border-top:.55cqw solid var(--accent);align-self:flex-start;max-width:100%}
.body{display:flex;flex-direction:column;gap:.9em;min-height:0}
p,ul,ol,h3,blockquote,table{margin:0}
ul,ol{padding-left:1.25em;display:flex;flex-direction:column;gap:.5em}
li>ul{margin-top:.45em;font-size:.88em;color:var(--muted)}
li::marker{color:var(--accent);font-weight:700}
h3{font-size:1.08em;font-weight:700;color:var(--accent)}
code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.9em;background:var(--tint);padding:.08em .3em;border-radius:.25em}
a{color:var(--accent)}
table{width:100%;border-collapse:collapse;font-size:.86em}
th,td{text-align:left;padding:.5em .7em;border-bottom:.12cqw solid var(--line);vertical-align:top}
th{background:var(--tint);font-weight:700;border-bottom-color:var(--accent)}
footer{position:absolute;left:6cqw;right:6cqw;bottom:2.4cqw;display:flex;justify-content:space-between;gap:2cqw;font-size:1.3cqw;color:var(--muted)}
footer span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cover,.section{background:var(--accent);color:var(--on)}
.cover .in,.section .in{gap:2cqw}
.cover h2{font-size:6.3cqw;line-height:1.05}.section h2{font-size:5.2cqw}
.cover .body{font-size:1.12em;opacity:.92}
.cover footer,.section footer{color:var(--on);opacity:.7}.cover footer span:first-child{visibility:hidden}
.cover a,.section a{color:inherit}
.stat .in{align-items:flex-start}
.num{font-size:15cqw;line-height:.95;font-weight:800;letter-spacing:-.04em;color:var(--accent)}
.stat .body{font-size:1.2em;max-width:30em}
.quote .in{padding-left:9cqw;padding-right:9cqw}
.quote h2{font-size:2cqw;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
blockquote{position:relative;font-size:1.5em;line-height:1.3;font-weight:600;text-wrap:balance}
blockquote::before{content:"“";position:absolute;left:-.62em;top:-.18em;font-size:2.6em;line-height:1;color:var(--accent)}
cite{display:block;margin-top:1em;font-size:.56em;font-style:normal;font-weight:500;color:var(--muted)}
.notes{width:min(100%,1100px);margin-top:-8px;padding:10px 14px;border-radius:8px;background:var(--bg);color:var(--muted);font-size:13px;line-height:1.5}
.notes b{color:var(--ink);margin-right:6px}
.bar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);display:flex;align-items:center;gap:4px;padding:5px;border-radius:999px;background:var(--bg);color:var(--ink);box-shadow:0 2px 6px rgba(0,0,0,.14),0 12px 30px -10px rgba(0,0,0,.4);font-size:13px;z-index:5}
.bar button{font:inherit;border:0;background:transparent;color:inherit;height:32px;min-width:32px;padding:0 10px;border-radius:999px;cursor:pointer}
.bar button:hover{background:var(--tint)}
.bar #play{background:var(--accent);color:var(--on);font-weight:600;padding:0 14px}
.bar #n{min-width:58px;text-align:center;font-variant-numeric:tabular-nums}
.empty{margin:auto;padding:40px;text-align:center;color:var(--muted);font-size:15px}
body.presenting{background:#000;overflow:hidden}
body.presenting .deck{padding:0;gap:0;height:100%;justify-content:center}
body.presenting .slide{display:none;width:min(100vw,177.78vh);border-radius:0;box-shadow:none;outline:0;cursor:pointer}
body.presenting .slide.current{display:block}
body.presenting .notes{display:none}
body.presenting .bar{opacity:0;transition:opacity .2s}
body.presenting .bar:hover,body.presenting .bar:focus-within{opacity:1}
@media print{
  @page{size:13.333in 7.5in;margin:0}
  body{background:#fff}
  .deck{display:block;padding:0}
  .slide{width:100%;height:100vh;aspect-ratio:auto;border-radius:0;box-shadow:none;outline:0;break-after:page;break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .notes,.bar{display:none}
}`;

const DECK_JS = `(function(){
var s=[].slice.call(document.querySelectorAll(".slide")),i=0,b=document.body,n=document.getElementById("n");
if(!s.length)return;
var on=function(){return b.classList.contains("presenting")};
var mark=function(){s.forEach(function(e,k){e.classList.toggle("current",k===i)});n.textContent=(i+1)+" / "+s.length};
var go=function(k){i=Math.max(0,Math.min(s.length-1,k));mark();if(!on())s[i].scrollIntoView({block:"center",behavior:"smooth"})};
var present=function(v){b.classList.toggle("presenting",v);mark();if(!v)s[i].scrollIntoView({block:"center"});document.getElementById("play").textContent=v?"Salir":"Presentar";try{parent.postMessage({__basaltSlides:v?"presenting":"list"},"*")}catch(e){}};
document.getElementById("prev").onclick=function(){go(i-1)};
document.getElementById("next").onclick=function(){go(i+1)};
document.getElementById("play").onclick=function(){present(!on())};
s.forEach(function(e,k){e.addEventListener("click",function(ev){if(ev.target.closest("a"))return;if(!on()){i=k;mark();return}var r=e.getBoundingClientRect();go(i+((ev.clientX-r.left)<r.width/3?-1:1))})});
addEventListener("keydown",function(e){var k=e.key,p=on();
if(k==="ArrowRight"||(p&&(k==="ArrowDown"||k==="PageDown"||k===" "||k==="Enter"))){e.preventDefault();go(i+1)}
else if(k==="ArrowLeft"||(p&&(k==="ArrowUp"||k==="PageUp"||k==="Backspace"))){e.preventDefault();go(i-1)}
else if(p&&k==="Home"){go(0)}else if(p&&k==="End"){go(s.length-1)}
else if(p&&k==="Escape"){present(false)}});
addEventListener("message",function(e){var d=e.data;if(!d||!d.__basaltSlides)return;if(d.__basaltSlides==="present"&&!on())present(true);if(d.__basaltSlides==="list"&&on())present(false)});
if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){if(on())return;es.forEach(function(x){if(x.isIntersecting&&x.intersectionRatio>.6){i=s.indexOf(x.target);mark()}})},{threshold:[.6]});s.forEach(function(e){io.observe(e)})}
mark();
})();`;

/**
 * La presentación como documento HTML completo: en lista (todas las diapositivas, una
 * debajo de otra) y, con «Presentar», de a una a pantalla llena con flechas. Sirve dentro
 * del iframe de vista previa y también guardada como archivo, sin depender de nada externo.
 */
export function deckHtml(deck: Deck, opts: { dark?: boolean } = {}): string {
  const dark = deck.dark;
  const vars = dark
    ? `--bg:#15171c;--ink:#f3f4f6;--muted:#a4a8b4;--line:#2c2f37;--tint:#22252d;`
    : `--bg:#ffffff;--ink:#1b1c21;--muted:#5d606b;--line:#dcdde3;--tint:#f2f2f6;`;
  const page = opts.dark ? "#0b0c0f" : "#e9eaee";
  const total = deck.slides.length;
  const slides = deck.slides.map((s, i) => slideHtml(s, i + 1, total, deck.title)).join("\n");
  return (
    `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
    PREVIEW_SHIM +
    `<title>${esc(deck.title)}</title>` +
    `<style>:root{--accent:${deck.accent};--on:${readableOn(deck.accent)};--page:${page};${vars}}${DECK_CSS}</style></head><body>` +
    `<main class="deck">${slides || `<p class="empty">La presentación todavía no tiene diapositivas.</p>`}</main>` +
    (total
      ? `<nav class="bar" aria-label="Diapositivas"><button id="prev" aria-label="Anterior">‹</button><span id="n">1 / ${total}</span>` +
        `<button id="next" aria-label="Siguiente">›</button><button id="play">Presentar</button></nav><script>${DECK_JS}</script>`
      : "") +
    `</body></html>`
  );
}
