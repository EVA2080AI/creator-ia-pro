// Extrae el texto de un documento adjunto (PDF, Word .docx, texto plano) EN EL NAVEGADOR: el archivo no
// se sube a ningún servidor nuestro; solo el texto extraído viaja al modelo cuando el usuario envía el
// mensaje (pedido urgente: "subir documentos para analizar contratos", 2026-09-30).
import type JSZipType from "jszip";

export const MAX_FILE_BYTES = 15 * 1024 * 1024;
/** ≈ 50-60 páginas de contrato por documento (~50k tokens). Más que eso se corta y se avisa. */
export const MAX_DOC_CHARS = 200_000;
export const MAX_PDF_PAGES = 300;
export const DOC_ACCEPT = ".pdf,.docx,.txt,.md,.markdown,.csv";

export interface ExtractedDoc {
  name: string;
  text: string;
  /** Caracteres del documento completo (antes de cortar). */
  chars: number;
  pages?: number;
  truncated: boolean;
  warning?: string;
}

/** Error con mensaje listo para mostrarle al usuario. */
export class DocError extends Error {}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function normalizeText(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Blob.text()/arrayBuffer() no existen en navegadores viejos ni en jsdom: FileReader sirve en todos.
export function readBuffer(f: Blob): Promise<ArrayBuffer> {
  if (typeof f.arrayBuffer === "function") return f.arrayBuffer();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(f);
  });
}
function readText(f: Blob): Promise<string> {
  if (typeof f.text === "function") return f.text();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(f);
  });
}

function finish(name: string, raw: string, extra: { pages?: number; warning?: string } = {}): ExtractedDoc {
  const text = normalizeText(raw);
  if (!text) throw new DocError(`«${name}» no tiene texto que pueda leer.`);
  const truncated = text.length > MAX_DOC_CHARS;
  return {
    name,
    text: truncated ? `${text.slice(0, MAX_DOC_CHARS)}\n\n[… documento truncado: se incluyen los primeros ${MAX_DOC_CHARS.toLocaleString("es-CO")} de ${text.length.toLocaleString("es-CO")} caracteres …]` : text,
    chars: text.length,
    truncated,
    ...extra,
  };
}

// ── Word (.docx) ──────────────────────────────────────────────────────────────
// Un .docx es un zip: el cuerpo está en word/document.xml. Se recorre en orden y se conservan párrafos,
// tabulaciones, saltos y tablas (celdas separadas por " | "). El texto borrado con control de cambios
// (w:delText) se ignora: solo entra lo que hoy dice el documento.
function runsText(el: Element): string {
  let out = "";
  for (const c of Array.from(el.children)) {
    switch (c.localName) {
      case "t": out += c.textContent ?? ""; break;
      case "tab": out += "\t"; break;
      case "br": case "cr": out += "\n"; break;
      case "delText": break;
      default: out += runsText(c);
    }
  }
  return out;
}

function blocks(el: Element): string[] {
  const lines: string[] = [];
  for (const c of Array.from(el.children)) {
    if (c.localName === "p") lines.push(runsText(c));
    else if (c.localName === "tbl") {
      for (const tr of Array.from(c.children).filter((x) => x.localName === "tr")) {
        const cells = Array.from(tr.children).filter((x) => x.localName === "tc").map((tc) => blocks(tc).join(" ").trim());
        lines.push(cells.join(" | "));
      }
    } else if (c.localName === "sdt" || c.localName === "sdtContent" || c.localName === "body") lines.push(...blocks(c));
  }
  return lines;
}

export async function docxToText(buffer: ArrayBuffer): Promise<string> {
  // JSZip son ~97 KB que viajaban en el chunk del chat para leer UN tipo de archivo
  // (.docx). Se carga al abrir uno, igual que ya se hacía con pdfjs más abajo.
  let zip: JSZipType;
  try {
    const { default: JSZip } = await import("jszip");
    zip = await JSZip.loadAsync(buffer);
  } catch { throw new DocError("El archivo no parece un .docx válido (¿está dañado?)."); }
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new DocError("El archivo no parece un .docx válido: no encontré el cuerpo del documento.");
  const dom = new DOMParser().parseFromString(xml, "application/xml");
  if (dom.getElementsByTagName("parsererror").length) throw new DocError("No pude leer el contenido del .docx.");
  const body = Array.from(dom.documentElement.children).find((c) => c.localName === "body") ?? dom.documentElement;
  return blocks(body).join("\n");
}

// ── PDF ───────────────────────────────────────────────────────────────────────
interface PdfItem { str?: string; hasEOL?: boolean }

/** Une los fragmentos de texto de cada página en líneas y marca las páginas ("--- Página N ---") para que
 *  el modelo pueda citarlas. Función pura para poder probarla sin pdf.js. */
export function pdfPagesToText(pages: PdfItem[][]): string {
  return pages
    .map((items, i) => {
      let out = "";
      for (const it of items) {
        if (typeof it.str !== "string") continue;
        out += it.str;
        if (it.hasEOL) out += "\n";
      }
      return `--- Página ${i + 1} ---\n${out}`;
    })
    .join("\n\n");
}

async function pdfToText(buffer: ArrayBuffer, name: string): Promise<{ text: string; pages: number; warning?: string }> {
  const [pdfjs, worker] = await Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url")]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  // En pdf.js ≥ 5 el documento ya no tiene destroy(): se libera desde la tarea de carga.
  const task = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  let doc;
  try {
    doc = await task.promise;
  } catch (e) {
    if (e instanceof Error && /password/i.test(`${e.name} ${e.message}`)) throw new DocError(`«${name}» está protegido con contraseña: quítale la clave y vuelve a adjuntarlo.`);
    throw new DocError(`No pude abrir «${name}» (¿PDF dañado?).`);
  }
  try {
    const total = doc.numPages;
    const limit = Math.min(total, MAX_PDF_PAGES);
    const pages: PdfItem[][] = [];
    let chars = 0;
    for (let n = 1; n <= limit; n++) {
      const content = await (await doc.getPage(n)).getTextContent();
      const items = content.items as PdfItem[];
      pages.push(items);
      chars += items.reduce((a, it) => a + (it.str?.length ?? 0), 0);
      if (chars > MAX_DOC_CHARS * 1.3) break; // ya alcanza de sobra: no seguir leyendo 300 páginas
    }
    const warnings: string[] = [];
    if (limit < total) warnings.push(`solo se leyeron las primeras ${pages.length} de ${total} páginas`);
    else if (pages.length < total) warnings.push(`se leyeron ${pages.length} de ${total} páginas (el resto excede el límite de texto)`);
    if (chars / Math.max(1, pages.length) < 80) warnings.push("parece un PDF escaneado (casi no tiene texto): el resultado puede estar incompleto — pásalo a texto o usa una versión digital");
    return { text: pdfPagesToText(pages), pages: total, warning: warnings.length ? warnings.join("; ") : undefined };
  } finally {
    void task.destroy();
  }
}

// ── Entrada ───────────────────────────────────────────────────────────────────
export async function extractDocument(file: File): Promise<ExtractedDoc> {
  const name = file.name;
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  if (file.size > MAX_FILE_BYTES) throw new DocError(`«${name}» pesa ${formatBytes(file.size)}: el máximo es ${formatBytes(MAX_FILE_BYTES)}.`);
  if (file.size === 0) throw new DocError(`«${name}» está vacío.`);

  if (["txt", "md", "markdown", "csv"].includes(ext)) return finish(name, await readText(file));
  if (ext === "docx") return finish(name, await docxToText(await readBuffer(file)));
  if (ext === "doc") throw new DocError("Los .doc antiguos no se pueden leer: guárdalo como .docx o PDF y vuelve a adjuntarlo.");
  if (ext === "pdf") {
    const r = await pdfToText(await readBuffer(file), name);
    if (!normalizeText(r.text.replace(/--- Página \d+ ---/g, ""))) {
      throw new DocError(`«${name}» parece un PDF escaneado (solo imágenes, sin texto). Conviértelo a texto o adjunta una versión digital.`);
    }
    return finish(name, r.text, { pages: r.pages, warning: r.warning });
  }
  throw new DocError(`No puedo leer archivos .${ext || "sin extensión"}. Adjunta un PDF, .docx o .txt.`);
}
