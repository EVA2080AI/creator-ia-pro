// Lógica pura (sin DOM) para los proyectos multi-archivo que Basalt escribe en
// el chat: detectar el nombre de cada archivo, armar el documento de vista
// previa combinando HTML + CSS + JS, y preparar el formulario de StackBlitz.
// Vive aparte de markdown.ts/los hooks para poder testearla sin navegador.

export interface ProjectFile {
  name: string;
  lang: string;
  code: string;
}

const FILE_RE = /^[\w@][\w@./-]*\.[A-Za-z][A-Za-z0-9]{0,9}$/;
const WEB_LANGS = new Set(["html", "css", "js", "javascript"]);

export const isWebLang = (lang: string) => WEB_LANGS.has(lang.toLowerCase());
export const isHtmlName = (name: string) => /\.html?$/i.test(name);
const isCssName = (name: string) => /\.css$/i.test(name);
const isJsName = (name: string) => /\.m?js$/i.test(name);

const normalizePath = (p: string) => p.trim().replace(/^\.?\//, "").split(/[?#]/)[0];
const baseName = (p: string) => normalizePath(p).split("/").pop() ?? p;

/**
 * Saca el nombre de archivo de un bloque de código, de cualquiera de las dos
 * formas en que un modelo suele indicarlo, y devuelve el código SIN esa línea
 * (un `// package.json` dentro de un JSON lo dejaría inválido al descargarlo):
 *   1) en la línea de la valla:  ```html index.html  /  ```jsx title="src/App.jsx"
 *      (mdToHtml solo captura el lenguaje, así que el resto llega como primera
 *      línea del código, empezando con espacio)
 *   2) como comentario en la primera línea no vacía:  <!-- index.html -->,
 *      /* styles.css *​/, // script.js, # main.py
 */
export function extractFilename(code: string): { name?: string; code: string } {
  const lines = code.split("\n");

  if (/^[ \t]/.test(lines[0] ?? "")) {
    const m = lines[0].trim().match(/^(?:(?:title|file|filename|name)\s*=\s*)?["']?([^"'\s]+)["']?$/i);
    if (m && FILE_RE.test(m[1])) return { name: normalizePath(m[1]), code: lines.slice(1).join("\n") };
  }

  const idx = lines.findIndex((l) => l.trim() !== "");
  if (idx !== -1) {
    const m = lines[idx].match(
      /^\s*(?:<!--|\/\*|\/\/|#|--|;)\s*(?:(?:file(?:name)?|archivo)\s*[:=]\s*)?([\w@][\w@./-]*\.[A-Za-z][A-Za-z0-9]{0,9})\s*(?:-->|\*\/)?\s*$/i,
    );
    if (m && FILE_RE.test(m[1])) {
      return { name: normalizePath(m[1]), code: [...lines.slice(0, idx), ...lines.slice(idx + 1)].join("\n") };
    }
  }

  return { code };
}

const DEFAULT_NAMES: Record<string, string> = {
  html: "index.html", css: "styles.css", js: "script.js", javascript: "script.js",
  ts: "index.ts", typescript: "index.ts", tsx: "App.tsx", jsx: "App.jsx", json: "data.json",
  py: "main.py", python: "main.py", sh: "script.sh", bash: "script.sh", sql: "query.sql", md: "README.md",
};

/** Nombre por defecto según el lenguaje, sin pisar los que ya están en uso. */
export function uniqueName(preferred: string | undefined, lang: string, taken: Set<string>): string {
  const base = preferred ?? DEFAULT_NAMES[lang.toLowerCase()] ?? `archivo.${lang || "txt"}`;
  if (!taken.has(base)) return base;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : "";
  for (let n = 2; ; n++) {
    const candidate = `${stem}-${n}${ext}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export const isPreviewable = (files: ProjectFile[]) => files.some((f) => isHtmlName(f.name));

// Se inyecta en el <head> del documento de vista previa: reenvía console.* y
// los errores al padre por postMessage (el iframe no tiene allow-same-origin,
// así que es la única vía). Sin JSON.stringify para valores raros: String().
const CONSOLE_SHIM = `<script>(function(){var s=function(x){try{return typeof x==="string"?x:(x instanceof Error?x.message:JSON.stringify(x))}catch(e){return String(x)}};var p=function(t,a){try{parent.postMessage({__basalt:1,t:t,m:Array.prototype.map.call(a,s).join(" ")},"*")}catch(e){}};["log","info","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){p(k,arguments);try{o.apply(console,arguments)}catch(e){}}});window.addEventListener("error",function(e){p("error",[e.message+(e.lineno?" (línea "+e.lineno+")":"")])});window.addEventListener("unhandledrejection",function(e){p("error",["Promesa rechazada: "+(e.reason&&e.reason.message||e.reason)])})})()</script>`;

const SKIP_JS = /(^|\/)(server|vite\.config|webpack\.config|tailwind\.config|postcss\.config|eslint\.config)\.[mc]?js$|\.(test|spec|config)\.[mc]?js$/i;

const escapeScript = (code: string) => code.replace(/<\/script/gi, "<\\/script");
const escapeStyle = (code: string) => code.replace(/<\/style/gi, "<\\/style");

/**
 * Documento completo para el iframe: el HTML principal con los <link
 * rel=stylesheet> y <script src> que apuntan a archivos del proyecto
 * reemplazados por su contenido inline (un srcdoc no puede resolver rutas
 * relativas). CSS/JS que el HTML no referencia igual se inyectan — es lo que
 * el usuario espera ver cuando el modelo escribe tres bloques sueltos.
 * Devuelve null si el proyecto no tiene ningún HTML.
 */
export function buildPreviewDoc(files: ProjectFile[]): string | null {
  const htmlFiles = files.filter((f) => isHtmlName(f.name));
  if (!htmlFiles.length) return null;
  const main = htmlFiles.find((f) => /^index\.html?$/i.test(baseName(f.name))) ?? htmlFiles[0];

  const byPath = new Map(files.map((f) => [normalizePath(f.name), f]));
  const byBase = new Map(files.map((f) => [baseName(f.name), f]));
  const lookup = (ref: string) => byPath.get(normalizePath(ref)) ?? byBase.get(baseName(ref));
  const used = new Set<string>();

  let doc = main.code;

  doc = doc.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) return tag;
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    const f = href ? lookup(href) : undefined;
    if (!f || f === main) return tag;
    used.add(f.name);
    return `<style data-file="${f.name}">\n${escapeStyle(f.code)}\n</style>`;
  });

  doc = doc.replace(/<script\b[^>]*>\s*<\/script>/gi, (tag) => {
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    const f = src ? lookup(src) : undefined;
    if (!f || f === main) return tag;
    used.add(f.name);
    const open = /^<script\b[^>]*>/i.exec(tag)![0].replace(/\s*\bsrc\s*=\s*["'][^"']*["']/i, "");
    return `${open}\n${escapeScript(f.code)}\n</script>`;
  });

  const looseCss = files.filter((f) => isCssName(f.name) && !used.has(f.name));
  const looseJs = files.filter((f) => isJsName(f.name) && !used.has(f.name) && !SKIP_JS.test(f.name));

  if (looseCss.length) {
    const styles = looseCss.map((f) => `<style data-file="${f.name}">\n${escapeStyle(f.code)}\n</style>`).join("\n");
    doc = /<\/head>/i.test(doc) ? doc.replace(/<\/head>/i, () => `${styles}\n</head>`) : `${styles}\n${doc}`;
  }
  if (looseJs.length) {
    const scripts = looseJs.map((f) => `<script data-file="${f.name}">\n${escapeScript(f.code)}\n</script>`).join("\n");
    doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, () => `${scripts}\n</body>`) : `${doc}\n${scripts}`;
  }

  if (/<head\b[^>]*>/i.test(doc)) return doc.replace(/<head\b[^>]*>/i, (m) => `${m}${CONSOLE_SHIM}`);
  if (/<html\b[^>]*>/i.test(doc)) return doc.replace(/<html\b[^>]*>/i, (m) => `${m}<head>${CONSOLE_SHIM}</head>`);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${CONSOLE_SHIM}</head><body>${doc}</body></html>`;
}

/**
 * Campos del formulario que StackBlitz espera en POST a /run. Hay dos
 * plantillas: "node" si el proyecto trae package.json (React/Vite/etc.,
 * StackBlitz instala y corre solo) y "html" para web estática. Devuelve null
 * si no hay nada que StackBlitz pueda ejecutar (ej. un proyecto Python).
 */
export function stackblitzFields(files: ProjectFile[], title: string): Record<string, string> | null {
  const hasPackageJson = files.some((f) => normalizePath(f.name) === "package.json");
  if (!hasPackageJson && !isPreviewable(files)) return null;
  const fields: Record<string, string> = {
    "project[title]": title,
    "project[description]": "Generado con Basalt — Creator IA",
    "project[template]": hasPackageJson ? "node" : "html",
  };
  for (const f of files) fields[`project[files][${normalizePath(f.name)}]`] = f.code;
  return fields;
}
