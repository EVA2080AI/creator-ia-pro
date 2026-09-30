// Rúbrica programática para medir si lo que Basalt genera se ve contemporáneo
// (pedido: "css muy antiguo"). Se aplica al proyecto tal como lo vería el
// usuario — HTML principal con el CSS enlazado/inyectado y basalt.css ya
// resuelto (buildPreviewDoc) — así mide el producto, no solo el texto crudo
// del modelo. Es heurística de regex: detecta lo grueso (sin tokens, sin
// responsive, sin foco visible, layout con <table>/<center>...), no reemplaza
// mirar el resultado. Se usa desde scripts/css-benchmark.ts para comparar
// ciclos con números en vez de sensaciones.
import { buildPreviewDoc, findMissingRefs, isHtmlName, type ProjectFile } from "./project-preview";

export interface RubricCheck { id: string; label: string; pass: boolean }
export interface RubricResult { score: number; total: number; checks: RubricCheck[] }

const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

/** var(--x) sin fallback cuyo --x nunca se declara: falla en silencio (propiedad inválida). */
export function undefinedVars(css: string): string[] {
  const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const missing = new Set<string>();
  for (const m of css.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) if (!defined.has(m[1])) missing.add(m[1]);
  return [...missing];
}

export function scoreProject(files: ProjectFile[]): RubricResult {
  const doc = buildPreviewDoc(files) ?? "";
  const main = files.find((f) => isHtmlName(f.name));
  const css = (doc.match(/<style[\s\S]*?<\/style>/gi) ?? []).join("\n");
  const imgs = doc.match(/<img\b[^>]*>/gi) ?? [];
  const hasInputs = /<input\b|<select\b|<textarea\b/i.test(doc);

  const checks: RubricCheck[] = [
    { id: "tokens", label: "Tokens: ≥8 custom properties y ≥15 usos de var(--)", pass: count(css, /--[\w-]+\s*:/g) >= 8 && count(css, /var\(--/g) >= 15 },
    { id: "basics", label: "Documento: viewport, lang y <title>", pass: /<meta[^>]+name=["']viewport/i.test(doc) && /<html[^>]*\blang=/i.test(doc) && /<title>/i.test(doc) },
    { id: "legacy", label: "Sin marcado antiguo (<font>, <center>, bgcolor, align, tablas de layout)", pass: !/(<font\b|<center\b|<marquee\b|\sbgcolor=|\salign=)/i.test(doc) && !(/<table\b/i.test(doc) && !/<th\b/i.test(doc)) },
    { id: "fluid", label: "Fluido y responsive: clamp()/minmax() y @media/@container", pass: /clamp\(|minmax\(/.test(css) && /@media|@container/.test(css) },
    { id: "modern", label: "Modo oscuro y color moderno (light-dark/prefers-color-scheme + color-mix/oklch/hsl)", pass: /prefers-color-scheme|light-dark\(/.test(css) && /color-mix\(|oklch\(|hsl\(/.test(css) },
    { id: "a11y", label: "Accesible: :focus-visible, reduced-motion, alt en <img>, labels en formularios", pass: /:focus-visible/.test(css) && /prefers-reduced-motion/.test(css) && imgs.every((i) => /\balt=/.test(i)) && (!hasInputs || /<label\b|aria-label/i.test(doc)) },
    { id: "styled", label: "Con estilo propio: ≥1500 caracteres de CSS y font-family", pass: css.length >= 1500 && /font-family|font:/.test(css) },
    { id: "restraint", label: "Con mesura: ≤3 style=\"\" inline y ≤6 !important", pass: count(doc, /\sstyle=["']/g) <= 3 && count(css, /!important/g) <= 6 },
    { id: "images", label: "Sin fotos inventadas: nada de <img>/url() a Unsplash, placeholders o rutas inexistentes", pass: !/(unsplash\.com|picsum\.photos|placeholder\.com|placehold\.(co|it)|lorempixel|pexels\.com|pixabay\.com|dummyimage\.com)/i.test(doc) && !/<img\b[^>]*\bsrc=["'](?!data:)/i.test(doc) && !/url\(\s*["']?(?!data:|#)[^)"']*\.(jpe?g|png|webp|gif|avif)/i.test(css) },
    { id: "vars", label: "Variables definidas: toda var(--x) sin valor por defecto tiene su --x:", pass: undefinedVars(css).length === 0 },
    { id: "complete", label: "Completo: sin archivos enlazados faltantes y HTML cerrado", pass: !!main && findMissingRefs(files).length === 0 && /<\/(html|body)>/i.test(main.code) },
  ];
  // Sin HTML no hay nada que evaluar: los chequeos "negativos" (sin marcado
  // antiguo, con mesura) pasarían por vacío.
  const final = doc ? checks : checks.map((c) => ({ ...c, pass: false }));
  return { score: final.filter((c) => c.pass).length, total: final.length, checks: final };
}
