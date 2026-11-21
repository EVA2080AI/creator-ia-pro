// La presentación como archivo de PowerPoint (.pptx) real, hecho en el navegador con
// pptxgenjs. Sale del mismo modelo que la vista (slides.ts → Deck), con la misma
// distribución: portada, sección, cifra, cita, y título + contenido.
//
// pptxgenjs se importa solo al descargar: quien no baja un PowerPoint no lo carga.
import type PptxGenJS from "pptxgenjs";
import { readableOn, runsText, type Block, type Deck, type Run, type Slide } from "./slides";

// Lienzo 16:9 de PowerPoint ("LAYOUT_WIDE"), en pulgadas.
const W = 13.333;
const H = 7.5;
const MX = 0.8;
const CW = W - MX * 2;
const FONT = "Calibri";

const hex = (c: string) => c.replace("#", "").toUpperCase();

interface Palette { bg: string; ink: string; muted: string; line: string; tint: string; accent: string; on: string }

function palette(deck: Deck): Palette {
  const base = deck.dark
    ? { bg: "15171C", ink: "F3F4F6", muted: "A4A8B4", line: "2C2F37", tint: "22252D" }
    : { bg: "FFFFFF", ink: "1B1C21", muted: "5D606B", line: "DCDDE3", tint: "F2F2F6" };
  return { ...base, accent: hex(deck.accent), on: hex(readableOn(deck.accent)) };
}

type TextRun = PptxGenJS.TextProps;
type RunOptions = NonNullable<TextRun["options"]>;

/**
 * Un párrafo hecho de trozos con formato. Las opciones de párrafo (viñeta, sangría, espacio)
 * van SOLO en el primer trozo: para pptxgenjs un trozo con `bullet` abre un párrafo nuevo, y
 * repetirlo partía "no crecen: **8 por semana** desde marzo" en tres viñetas. Solo el último corta la línea.
 */
function paragraph(runs: Run[], para: RunOptions, p: Palette): TextRun[] {
  const list = runs.length ? runs : [{ text: " " }];
  const { bullet, indentLevel, paraSpaceAfter, ...inline } = para;
  return list.map((r, i) => ({
    text: r.text,
    options: {
      ...inline,
      ...(i === 0 ? { bullet, indentLevel, paraSpaceAfter } : {}),
      ...(r.bold ? { bold: true } : {}),
      ...(r.italic ? { italic: true } : {}),
      ...(r.code ? { fontFace: "Consolas" } : {}),
      ...(r.href ? { hyperlink: { url: r.href }, color: p.accent } : {}),
      breakLine: i === list.length - 1,
    },
  }));
}

/** Los bloques de texto (todo menos las tablas) como una sola caja. */
function textRuns(blocks: Block[], size: number, p: Palette): TextRun[] {
  const out: TextRun[] = [];
  const gap = Math.round(size * 0.45);
  for (const b of blocks) {
    if (b.type === "bullets") {
      // El número va explícito en cada punto (numberStartAt): con "empieza en 1" repetido,
      // LibreOffice y Google Slides numeraban 1. 1. 1.
      let n = 0;
      for (const item of b.items) {
        const bullet = b.ordered && item.level === 0 ? { type: "number" as const, numberStartAt: ++n } : true;
        out.push(...paragraph(item.runs, {
          bullet, indentLevel: item.level, paraSpaceAfter: gap,
          ...(item.level ? { fontSize: Math.round(size * 0.88), color: p.muted } : {}),
        }, p));
      }
    } else if (b.type === "heading") {
      out.push(...paragraph(b.runs, { bold: true, color: p.accent, paraSpaceAfter: gap }, p));
    } else if (b.type === "para") {
      out.push(...paragraph(b.runs, { paraSpaceAfter: gap }, p));
    } else if (b.type === "quote") {
      out.push(...paragraph(b.runs, { italic: true, paraSpaceAfter: gap }, p));
      if (b.author) out.push(...paragraph([{ text: `— ${b.author}` }], { color: p.muted, fontSize: Math.round(size * 0.8), paraSpaceAfter: gap }, p));
    }
  }
  return out;
}

function footer(slide: PptxGenJS.Slide, deck: Deck, color: string, showTitle: boolean) {
  if (showTitle) slide.addText(deck.title, { x: MX, y: H - 0.55, w: CW - 1.2, h: 0.35, fontSize: 10, color, fontFace: FONT, valign: "middle" });
  slide.slideNumber = { x: W - MX - 0.8, y: H - 0.55, w: 0.8, h: 0.35, fontSize: 10, color, fontFace: FONT, align: "right" };
}

function addSlide(pptx: PptxGenJS, deck: Deck, s: Slide, p: Palette) {
  const slide = pptx.addSlide();
  const solid = s.layout === "cover" || s.layout === "section";
  slide.background = { color: solid ? p.accent : p.bg };
  if (s.notes) slide.addNotes(s.notes);

  if (solid) {
    const cover = s.layout === "cover";
    const sub = textRuns(s.blocks, 22, p);
    slide.addText(s.title, {
      x: MX, y: sub.length ? 1.9 : 2.4, w: CW, h: 2.4, fontSize: cover ? 48 : 40, bold: true, color: p.on, fontFace: FONT,
      valign: sub.length ? "bottom" : "middle", fit: "shrink",
    });
    if (sub.length) slide.addText(sub, { x: MX, y: 4.45, w: CW, h: 1.7, fontSize: 22, color: p.on, fontFace: FONT, valign: "top", fit: "shrink" });
    footer(slide, deck, p.on, false);
    return;
  }

  if (s.layout === "stat") {
    slide.addText(s.title, { x: MX, y: 1.2, w: CW, h: 2.9, fontSize: 130, bold: true, color: p.accent, fontFace: FONT, valign: "bottom", fit: "shrink" });
    slide.addText(textRuns(s.blocks, 26, p), { x: MX, y: 4.25, w: CW * 0.8, h: 2.2, fontSize: 26, color: p.ink, fontFace: FONT, valign: "top", fit: "shrink" });
    footer(slide, deck, p.muted, true);
    return;
  }

  if (s.layout === "quote") {
    if (s.title) slide.addText(s.title.toUpperCase(), { x: 1.6, y: 0.9, w: W - 3.2, h: 0.5, fontSize: 14, bold: true, color: p.muted, fontFace: FONT, charSpacing: 2 });
    slide.addText("“", { x: 0.75, y: 1.3, w: 1, h: 1.3, fontSize: 96, bold: true, color: p.accent, fontFace: "Georgia" });
    slide.addText(textRuns(s.blocks, 30, p).map((r) => ({ ...r, options: { ...r.options, italic: false, bold: r.options?.color ? false : true } })), {
      x: 1.6, y: 1.6, w: W - 3.2, h: 4.4, fontSize: 30, color: p.ink, fontFace: FONT, valign: "middle", fit: "shrink",
    });
    footer(slide, deck, p.muted, true);
    return;
  }

  // Título + contenido
  const size = [24, 20, 17][s.density];
  slide.addShape(pptx.ShapeType.rect, { x: MX, y: 0.62, w: 1.1, h: 0.07, fill: { color: p.accent }, line: { color: p.accent, width: 0 } });
  let top = 0.85;
  if (s.title) {
    slide.addText(s.title, { x: MX, y: top, w: CW, h: 1.05, fontSize: [36, 32, 28][s.density], bold: true, color: p.ink, fontFace: FONT, valign: "middle", fit: "shrink" });
    top += 1.25;
  }
  const bottom = H - 0.8;
  const table = s.blocks.find((b): b is Extract<Block, { type: "table" }> => b.type === "table");
  const text = textRuns(s.blocks.filter((b) => b.type !== "table"), size, p);

  if (text.length) {
    // Con tabla, el texto ocupa lo justo arriba (una línea ≈ 1,5 × el tamaño de letra, en pulgadas).
    const lines = text.filter((r) => r.options?.breakLine).length;
    const h = table ? Math.min(bottom - top - 1.6, Math.max(0.6, lines * size * 1.6 / 72)) : bottom - top;
    slide.addText(text, { x: MX, y: top, w: CW, h, fontSize: size, color: p.ink, fontFace: FONT, valign: "top", fit: "shrink", lineSpacingMultiple: 1.1 });
    top += h + 0.15;
  }
  if (table) {
    const cols = Math.max(...table.rows.map((r) => r.length));
    const fontSize = table.rows.length > 8 ? 12 : table.rows.length > 6 ? 14 : table.rows.length > 4 ? 16 : 18;
    const rows = table.rows.map((row, i) =>
      Array.from({ length: cols }, (_, c) => ({
        text: runsText(row[c] ?? []),
        options: {
          bold: i === 0, color: p.ink, fontFace: FONT, fontSize, valign: "middle" as const,
          fill: { color: i === 0 ? p.tint : p.bg },
          border: [{ type: "none" as const }, { type: "none" as const }, { type: "solid" as const, pt: i === 0 ? 1.5 : 0.75, color: i === 0 ? p.accent : p.line }, { type: "none" as const }],
          margin: [0.06, 0.12, 0.06, 0.12],
        },
      })),
    );
    slide.addTable(rows as PptxGenJS.TableRow[], { x: MX, y: top, w: CW, colW: Array(cols).fill(CW / cols) });
  }
  footer(slide, deck, p.muted, true);
}

const PPR = /<a:pPr\b[^>]*?(?:\/>|>[\s\S]*?<\/a:pPr>)/g;

/**
 * pptxgenjs 4 escribe un `<a:pPr>` por CADA trozo de un párrafo; el formato solo admite uno,
 * y al principio. PowerPoint es estricto con eso ("encontró un problema con el contenido"),
 * así que se deja solo el primero de cada párrafo.
 */
export function fixParagraphs(xml: string): string {
  return xml.replace(/<a:p>([\s\S]*?)<\/a:p>/g, (_m, inner: string) => {
    const head = inner.startsWith("<a:pPr") ? (inner.match(PPR)?.[0] ?? "") : "";
    return `<a:p>${head}${inner.slice(head.length).replace(PPR, "")}</a:p>`;
  });
}

const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

/** Arma el .pptx. `outputType` es "blob" en el navegador y "nodebuffer" en las pruebas. */
export async function deckToPptx(deck: Deck, outputType: "blob" | "nodebuffer" = "blob"): Promise<Blob | Uint8Array> {
  const [{ default: Pptx }, { default: JSZip }] = await Promise.all([import("pptxgenjs"), import("jszip")]);
  const pptx = new Pptx();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = deck.title;
  pptx.author = "Basalt — Creator IA";
  pptx.company = "Creator IA";
  const p = palette(deck);
  deck.slides.forEach((s) => addSlide(pptx, deck, s, p));
  if (!deck.slides.length) pptx.addSlide().addText(deck.title, { x: MX, y: 2.6, w: CW, h: 2, fontSize: 40, bold: true, fontFace: FONT });

  const zip = await JSZip.loadAsync((await pptx.write({ outputType: "arraybuffer" })) as ArrayBuffer);
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
    zip.file(name, fixParagraphs(await zip.file(name)!.async("string")));
  }
  return outputType === "blob"
    ? zip.generateAsync({ type: "blob", mimeType: PPTX_MIME, compression: "DEFLATE" })
    : zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
