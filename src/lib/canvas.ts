// Canvas: qué partes de una respuesta se pueden ABRIR Y VER (no solo leer como código).
// Lógica pura — sin DOM — para que el render del chat (markdown.ts), el panel
// (CanvasPanel.tsx) y las pruebas decidan exactamente lo mismo.
//
// Pedido de Sebastián (2026-11-21): "implementa un visualizador tipo canvas, porque el que
// hay es solo html". Hasta ese día solo un ```html tenía vista previa; un componente React,
// un SVG o un diagrama se quedaban como un bloque de código, y un proyecto Vite mostraba
// "el chat no puede ejecutarlo".
import {
  extractFilename, isHtmlName, isOfficeHtmlName, isPreviewable, isWebLang, looksRenderable, uniqueName, withBasaltBase,
  type ProjectFile,
} from "./project-preview";
import { SLIDES_LANGS, parseDeck } from "./slides";

/** web: HTML(+CSS+JS) · react: componente o proyecto Vite/React · svg · mermaid: diagrama ·
 *  slides: presentación · code: varios archivos que el navegador no puede ejecutar ·
 *  doc: una respuesta leída como documento. */
export type CanvasKind = "web" | "react" | "svg" | "mermaid" | "slides" | "code" | "doc";

export interface CanvasArtifact {
  kind: CanvasKind;
  title: string;
  files: ProjectFile[];
}

export interface CodeBlock { lang: string; code: string }

/** Qué se abrió en el Canvas: el artefacto número `index` del mensaje, o el mensaje entero
 *  como documento (`WHOLE_MESSAGE`). */
export interface CanvasTarget { msgId: string; index: number }
export const WHOLE_MESSAGE = -1;

/** Las tarjetas del chat son HTML crudo: el botón «Abrir en Canvas» avisa por `window`
 *  (mismo patrón que GITHUB_EXPORT_EVENT) y la página que tiene el panel lo abre. */
export const CANVAS_OPEN_EVENT = "basalt:canvas-open";
/** La página avisa qué quedó abierto, para que la tarjeta del chat no pinte OTRA vista
 *  previa del mismo artefacto (dos apps React corriendo a la vez). */
export const CANVAS_CHANGED_EVENT = "basalt:canvas-changed";

let openTarget: CanvasTarget | null = null;
export const getCanvasTarget = () => openTarget;
export function setCanvasTarget(t: CanvasTarget | null) {
  openTarget = t;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CANVAS_CHANGED_EVENT));
}

/** La misma expresión que parte un mensaje en bloques de código en mdToHtml: una sola
 *  fuente, porque el artefacto N del Canvas tiene que ser la tarjeta N del chat. */
export const fenceRe = () => /```([\p{L}\p{N}+#_-]*)\n?([\s\S]*?)(?:```|$)/gu;

// Visto en producción (Nemotron 3.5 Super, 2026-11-21): el modelo abrió el bloque con las
// comillas solas y escribió `slides` en la PRIMERA LÍNEA — y la presentación salió como un
// bloque de código gris. Para los lenguajes que cambian cómo se muestra un bloque, vale igual.
const FIRST_LINE_LANG = /^[ \t]*(slides?|presentaci[oó]n|diapositivas|pptx?|deck|mermaid|svg|html|tsx|jsx)[ \t]*\n/i;

/** Un bloque tal como salió de la valla → su lenguaje y su código (compartido con mdToHtml). */
export function normalizeFence(lang: string, code: string): CodeBlock {
  if (!lang) {
    const m = FIRST_LINE_LANG.exec(code);
    if (m) return { lang: m[1].toLowerCase(), code: code.slice(m[0].length) };
  }
  return { lang: lang || "código", code };
}

export function codeBlocks(md: string): CodeBlock[] {
  return [...md.matchAll(fenceRe())].map((m) => normalizeFence(m[1], m[2]));
}

const isChart = (lang: string) => /^(chart|grafico|gráfico)$/.test(lang);
const SVG_START = /^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)?<svg\b/i;

/** ¿Este bloque es un componente de React que se puede montar? Pide las dos cosas: algo
 *  que parezca JSX y una declaración de componente (o que se monte solo). */
export function looksLikeComponent(code: string): boolean {
  if (!/<[A-Za-z][\w.]*(?:\s[^<>]*)?\/?>/.test(code) && !/createElement\s*\(/.test(code)) return false;
  return /export\s+default\b|createRoot\s*\(|ReactDOM\.render\s*\(|(?:function|class)\s+[A-Z]\w*|(?:const|let)\s+[A-Z]\w*\s*[:=]/.test(code);
}

const NOT_REACT = /"(?:next|nuxt|astro|vue|svelte|@angular\/core|@sveltejs\/kit|solid-js|preact)"\s*:/;

/** Proyecto de varios archivos que el Canvas sabe montar: React sin un framework de servidor. */
export function isReactProject(files: ProjectFile[]): boolean {
  const pkg = files.find((f) => /(^|\/)package\.json$/.test(f.name));
  if (pkg && NOT_REACT.test(pkg.code)) return false;
  return files.some((f) => /\.(tsx|jsx)$/i.test(f.name)) || (!!pkg && /"react"\s*:/.test(pkg.code) && files.some((f) => /\.[mc]?js$/i.test(f.name)));
}

export function projectKind(files: ProjectFile[]): CanvasKind {
  if (isPreviewable(files)) return "web";
  return isReactProject(files) ? "react" : "code";
}

/** Los tipos que tienen algo que VER (los demás solo muestran sus archivos). */
export const hasPreview = (kind: CanvasKind) => kind === "web" || kind === "react" || kind === "svg" || kind === "mermaid" || kind === "slides";

function htmlTitle(files: ProjectFile[]): string | undefined {
  const html = files.find((f) => isHtmlName(f.name));
  return (html && /<title[^>]*>([^<]{1,60})<\/title>/i.exec(html.code)?.[1]?.trim()) || undefined;
}

function projectTitle(kind: CanvasKind, files: ProjectFile[]): string {
  if (files.length === 1 && isOfficeHtmlName(files[0].name)) return files[0].name;
  const named = htmlTitle(files);
  if (named) return named;
  if (kind === "web") return "Página web";
  if (kind === "react") return files.length === 1 ? "Componente React" : "App React";
  return `Proyecto · ${files.length} archivos`;
}

interface Member { i: number; lang: string; name?: string; code: string }

/** Un bloque suelto que por sí solo es un artefacto: componente React, SVG o diagrama. */
function soloArtifact(b: CodeBlock): CanvasArtifact | null {
  const lang = b.lang.toLowerCase();
  if (isChart(lang)) return null;
  const { name, code: body } = extractFilename(b.code);
  const code = body.replace(/\n$/, "");
  if (!code.trim()) return null;

  // Presentación: un bloque ```slides (o el markdown de Marp, que los modelos también conocen).
  const marp = (lang === "md" || lang === "markdown") && /^\s*---\s*\n(?:[^\n]*\n){0,8}?marp\s*:\s*true/i.test(code);
  if (SLIDES_LANGS.test(lang) || marp) {
    return { kind: "slides", title: parseDeck(code).title, files: [{ name: name ?? "presentacion.md", lang: "markdown", code }] };
  }

  if (lang === "mermaid") return { kind: "mermaid", title: "Diagrama", files: [{ name: name ?? "diagrama.mmd", lang: "mermaid", code }] };

  const svgName = !!name && /\.svg$/i.test(name);
  if ((lang === "svg" || lang === "xml" || svgName) && SVG_START.test(code)) {
    return { kind: "svg", title: "Imagen SVG", files: [{ name: name ?? "imagen.svg", lang: "svg", code }] };
  }

  const jsx = /^(jsx|tsx|react)$/.test(lang) || (!!name && /\.(jsx|tsx)$/i.test(name));
  const jsReact = /^(js|javascript|ts|typescript)$/.test(lang) && /from\s+["']react["']/.test(code);
  if ((jsx || jsReact) && looksLikeComponent(code)) {
    const fallback = lang === "jsx" || lang === "js" || lang === "javascript" ? "App.jsx" : "App.tsx";
    return { kind: "react", title: "Componente React", files: [{ name: name ?? fallback, lang: lang === "react" ? "tsx" : lang, code }] };
  }
  return null;
}

/**
 * Mirando TODOS los bloques del mensaje, decide cuáles forman un artefacto. La clave es el
 * índice del bloque; `null` = el bloque quedó absorbido por el proyecto que aparece en el
 * primero de sus archivos.
 */
export function planArtifacts(blocks: CodeBlock[]): Map<number, CanvasArtifact | null> {
  const plan = new Map<number, CanvasArtifact | null>();

  const members: Member[] = [];
  blocks.forEach((b, i) => {
    const lang = b.lang.toLowerCase();
    if (isChart(lang)) return;
    const { name, code } = extractFilename(b.code);
    if (name || isWebLang(lang)) members.push({ i, lang, name, code });
  });

  const isHtml = (m: Member) => m.lang === "html" || (!!m.name && isHtmlName(m.name));
  const isCssJs = (m: Member) => ["css", "js", "javascript"].includes(m.lang) || (!!m.name && /\.(css|m?js)$/i.test(m.name));
  const namedCount = members.filter((m) => m.name).length;
  const multi = members.length >= 2 && (namedCount >= 2 || (members.some(isHtml) && members.some(isCssJs)));

  if (multi) {
    const taken = new Set<string>();
    const files = withBasaltBase(members.map((m) => {
      const name = uniqueName(m.name, m.lang, taken);
      taken.add(name);
      return { name, lang: m.lang || name.split(".").pop() || "", code: m.code.replace(/\n$/, "") };
    }));
    const kind = projectKind(files);
    plan.set(members[0].i, { kind, title: projectTitle(kind, files), files });
    members.slice(1).forEach((m) => plan.set(m.i, null));
  } else {
    members.filter((m) => isHtml(m) && (m.name || looksRenderable(m.code))).forEach((m) => {
      const files = withBasaltBase([{ name: m.name ?? "index.html", lang: "html", code: m.code.replace(/\n$/, "") }]);
      plan.set(m.i, { kind: "web", title: projectTitle("web", files), files });
    });
  }

  blocks.forEach((b, i) => {
    if (plan.has(i)) return;
    const solo = soloArtifact(b);
    if (solo) plan.set(i, solo);
  });
  return plan;
}

/** Los artefactos de un mensaje, en el orden en que aparecen. El número de cada uno es el
 *  `data-canvas` de su tarjeta en el chat. */
export function extractArtifacts(md: string): CanvasArtifact[] {
  if (!md.includes("```")) return [];
  const plan = planArtifacts(codeBlocks(md));
  return [...plan.entries()].sort((a, b) => a[0] - b[0]).flatMap(([, a]) => (a ? [a] : []));
}

/** ¿Vale la pena leer esta respuesta como documento? Un plan o una parrilla sí; un "claro,
 *  dime más" no. */
export function isDocLike(text: string): boolean {
  // Solo cuenta la prosa: una respuesta que es casi toda un bloque (una página, una
  // presentación) ya tiene su tarjeta, y los `#` de adentro no la vuelven un documento.
  const prose = text.includes("```") ? text.replace(fenceRe(), "") : text;
  if (prose.length < 500) return false;
  return /^#{1,6}\s/m.test(prose) || /^\|.+\|\s*$/m.test(prose) || prose.split(/\n{2,}/).length >= 5;
}

export function docTitle(text: string): string {
  const heading = /^#{1,6}\s+(.+)$/m.exec(text)?.[1];
  const first = heading ?? text.split("\n").find((l) => l.trim())?.trim() ?? "";
  const clean = first.replace(/[*_`#>|]/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim();
  if (!clean) return "Documento";
  return clean.length > 60 ? clean.slice(0, 57).trimEnd() + "…" : clean;
}

/** La respuesta entera como documento (las etiquetas de imagen y de memoria ya vienen fuera). */
export function docArtifact(text: string): CanvasArtifact {
  const title = docTitle(text);
  return { kind: "doc", title, files: [{ name: `${fileSlug(title)}.md`, lang: "markdown", code: text }] };
}

export const fileSlug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "documento";

export const KIND_LABEL: Record<CanvasKind, string> = {
  web: "Página web", react: "React", svg: "SVG", mermaid: "Diagrama", slides: "Presentación", code: "Código", doc: "Documento",
};
