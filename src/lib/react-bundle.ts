// Monta un componente o un proyecto React/Vite DENTRO del iframe de vista previa, sin npm
// ni servidor: transpila cada archivo (TypeScript + JSX → JavaScript) y deja que el
// navegador resuelva los módulos con un import map —los archivos del proyecto viajan como
// data: URLs y los paquetes de npm salen de esm.sh—.
//
// Antes un proyecto así decía "el chat no puede ejecutarlo: ábrelo en StackBlitz". Es una
// vista previa APROXIMADA (sin el servidor de Vite, sin variables de entorno): StackBlitz
// y el ZIP siguen ahí para la versión exacta.
//
// Lógica pura: el transpilador entra por parámetro, así las pruebas no necesitan navegador.
// Medido en Chromium real (2026-11-21): dentro de un iframe `sandbox` sin allow-same-origin
// los módulos data: + import map + esm.sh cargan bien, pero `history.pushState` lanza
// SecurityError — por eso el enrutador se cambia por uno en memoria (ROUTER_SHIM).
import { PREVIEW_SHIM, type ProjectFile } from "./project-preview";

export const ESM_CDN = "https://esm.sh";
const LOCAL = "basalt-local/";
const DEFAULT_REACT = "18.3.1";
const TAILWIND_V3 = "https://cdn.tailwindcss.com";
const TAILWIND_V4 = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4";

type SucraseTransform = "jsx" | "typescript" | "imports";
export type Transform = (
  code: string,
  options: { transforms: SucraseTransform[]; jsxRuntime?: "automatic"; production?: boolean; filePath?: string },
) => { code: string };

export interface ReactBundle {
  html: string;
  /** Archivo desde el que arranca. */
  entry: string | null;
  /** Paquetes de npm que se piden a esm.sh. */
  externals: string[];
  /** Lo que el usuario debería saber (archivos que no llegaron, etc.). */
  warnings: string[];
}

const CODE_RE = /\.(tsx?|jsx?|mjs)$/i;
const ASSET_RE = /\.(svg|png|jpe?g|gif|webp|avif|ico|bmp)$/i;
const CODE_EXTS = [".tsx", ".ts", ".jsx", ".js", ".mjs"];

const norm = (p: string) => p.trim().replace(/\\/g, "/").replace(/^\.?\//, "");
const dirOf = (p: string) => (p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "");

function joinPath(dir: string, rel: string): string {
  const parts = dir ? dir.split("/") : [];
  for (const seg of rel.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

const isLocalSpec = (s: string) => s.startsWith(".") || s.startsWith("/") || s.startsWith("@/") || s.startsWith("~/");

/** A qué archivo del proyecto apunta un import local (con o sin extensión, alias `@/`). */
export function resolveLocal(spec: string, from: string, has: (path: string) => boolean): string | null {
  const clean = spec.split(/[?#]/)[0];
  const bases: string[] = [];
  if (clean.startsWith("@/") || clean.startsWith("~/")) bases.push("src/" + clean.slice(2), clean.slice(2));
  else if (clean.startsWith("/")) bases.push(clean.slice(1), "public/" + clean.slice(1));
  else bases.push(joinPath(dirOf(from), clean));

  for (const base of bases) {
    if (has(base)) return base;
    for (const ext of [...CODE_EXTS, ".json", ".css"]) if (has(base + ext)) return base + ext;
    for (const ext of CODE_EXTS) if (has(`${base}/index${ext}`)) return `${base}/index${ext}`;
    // TypeScript con `import "./util.js"` apuntando a util.ts
    const m = /^(.*)\.[mc]?jsx?$/.exec(base);
    if (m) for (const ext of [".ts", ".tsx"]) if (has(m[1] + ext)) return m[1] + ext;
  }
  return null;
}

/** "lucide-react/icons" → { name: "lucide-react", sub: "/icons" } (con alcance: "@radix-ui/react-dialog"). */
function splitPackage(spec: string): { name: string; sub: string } {
  const parts = spec.split("/");
  const n = spec.startsWith("@") ? 2 : 1;
  return { name: parts.slice(0, n).join("/"), sub: parts.length > n ? "/" + parts.slice(n).join("/") : "" };
}

const cleanVersion = (range: string | undefined) => /\d+(?:\.\d+){0,2}/.exec(range ?? "")?.[0];

function readDependencies(files: ProjectFile[]): Record<string, string> {
  const pkg = files.find((f) => norm(f.name) === "package.json");
  if (!pkg) return {};
  try {
    const json = JSON.parse(pkg.code) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    return { ...json.devDependencies, ...json.dependencies };
  } catch {
    return {};
  }
}

function packageUrl(spec: string, deps: Record<string, string>, external: boolean): string {
  const { name, sub } = splitPackage(spec);
  const v = cleanVersion(deps[name]);
  return `${ESM_CDN}/${name}${v ? "@" + v : ""}${sub}${external ? "?external=react,react-dom" : ""}`;
}

const dataModule = (code: string, name: string) =>
  "data:text/javascript;charset=utf-8," + encodeURIComponent(`${code}\n//# sourceURL=${name}`);

// `import … from "x"` / `export … from "x"` al inicio de una línea (la cláusula puede ocupar
// varias), `import "x"` suelto y `import("x")` dinámico. Corre sobre el código YA transpilado:
// ahí no queda JSX ni tipos, y el texto de la interfaz vive dentro de cadenas.
// (sucrase deja su import del runtime de JSX en la MISMA línea que el primero del archivo:
// por eso una sentencia puede empezar al inicio de la línea o después de un `;`).
const IMPORT_FROM = /((?:^|;)[ \t]*(?:import|export)\b[^;'"`]*?\bfrom\s*)(["'])([^"'\n]+)\2/gm;
const IMPORT_SIDE = /((?:^|;)[ \t]*import\s*)(["'])([^"'\n]+)\2;?/gm;
const IMPORT_DYNAMIC = /(\bimport\s*\(\s*)(["'])([^"'\n]+)\2(\s*\))/g;

const IDENT = /^[A-Za-z_$][\w$]*$/;

/** Qué nombres pide una cláusula de import/export (para fabricar un sustituto si el archivo no llegó). */
function requestedNames(clause: string): string[] {
  const inner = /\{([^}]*)\}/.exec(clause)?.[1] ?? "";
  return inner.split(",").map((p) => p.trim().split(/\s+as\s+/)[0].trim()).filter((n) => IDENT.test(n) && n !== "default");
}

const escapeScript = (code: string) => code.replace(/<\/script/gi, "<\\/script");
const escapeStyle = (code: string) => code.replace(/<\/style/gi, "<\\/style");
const jsonForScript = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const SELF_MOUNT = /\bcreateRoot\s*\(|\bhydrateRoot\s*\(|ReactDOM\.render\s*\(|\brender\s*\(\s*</;

function findEntry(files: ProjectFile[], has: (p: string) => boolean): { path: string; mounts: boolean } | null {
  const byPath = new Map(files.map((f) => [norm(f.name), f]));
  const html = files.find((f) => /(^|\/)index\.html?$/i.test(norm(f.name)));
  const fromHtml = html && /<script\b[^>]*\bsrc\s*=\s*["']([^"']+\.(?:tsx?|jsx?|mjs))["']/i.exec(html.code)?.[1];
  const linked = fromHtml ? resolveLocal(fromHtml.startsWith(".") || fromHtml.startsWith("/") ? fromHtml : "./" + fromHtml, norm(html!.name), has) : null;

  const mains = ["src/main", "src/index", "main", "index", "src/app/main"].flatMap((b) => CODE_EXTS.map((e) => b + e));
  const main = linked ?? mains.find((p) => has(p) && SELF_MOUNT.test(byPath.get(p)!.code));
  if (main) return { path: main, mounts: SELF_MOUNT.test(byPath.get(main)!.code) };

  const apps = ["src/App", "App", "src/app", "app"].flatMap((b) => [".tsx", ".jsx", ".js", ".ts"].map((e) => b + e));
  const components = files.map((f) => norm(f.name)).filter((p) => /\.(tsx|jsx)$/i.test(p));
  const component =
    apps.find(has) ??
    components.find((p) => /export\s+default\b/.test(byPath.get(p)!.code)) ??
    components[0] ??
    files.map((f) => norm(f.name)).find((p) => CODE_RE.test(p) && /from\s+["']react["']/.test(byPath.get(p)!.code));
  return component ? { path: component, mounts: SELF_MOUNT.test(byPath.get(component)!.code) } : null;
}

/** Un componente escrito sin `export default`: se exporta el que nadie más dibuja (la raíz);
 *  `App` gana si existe. Corre sobre el código transpilado, donde `<Hijo />` ya es `_jsx(Hijo`. */
function withDefaultExport(code: string): string {
  if (/export\s+default\b/.test(code) || /export\s*\{[^}]*\bas\s+default\b/.test(code)) return code;
  const names = [...code.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function|class|const|let)\s+([A-Z]\w*)/gm)]
    .map((m) => m[1])
    .filter((n) => !/^[A-Z][A-Z0-9_]*$/.test(n)); // ALL_CAPS = constante, no componente
  if (!names.length) return code;
  const roots = names.filter((n) => !new RegExp(`_jsxs?\\(\\s*${n}\\b`).test(code));
  const pick = names.includes("App") ? "App" : roots[roots.length - 1] ?? names[names.length - 1];
  return `${code}\nexport default ${pick};`;
}

function tailwindMode(files: ProjectFile[], deps: Record<string, string>): "v3" | "v4" | null {
  const css = files.filter((f) => /\.css$/i.test(f.name)).map((f) => f.code).join("\n");
  if (/@import\s+["']tailwindcss["']|@theme\b/.test(css) || /^\D*4/.test(deps.tailwindcss ?? "")) return "v4";
  if (deps.tailwindcss || /@tailwind\b|@apply\b/.test(css) || files.some((f) => /(^|\/)tailwind\.config\.[mc]?[jt]s$/.test(norm(f.name)))) return "v3";
  const utility = /class(?:Name)?\s*=\s*[{"'`][^\n]{0,300}?\b(?:p[xy]?-\d|gap-\d|text-(?:sm|lg|xl|[2-9]xl)|bg-[a-z]+-\d{2,3}|rounded-(?:md|lg|xl|2xl|3xl|full)|min-h-screen|items-center|justify-(?:center|between))\b/;
  return files.some((f) => CODE_RE.test(f.name) && utility.test(f.code)) ? "v3" : null;
}

/** tailwind.config.* → `tailwind.config = {…}` para el CDN. Si usa algo que acá no existe
 *  (un plugin, defaultTheme), se avisa y la vista previa sigue con la configuración de fábrica. */
function tailwindConfigScript(files: ProjectFile[], transform: Transform): string {
  const file = files.find((f) => /(^|\/)tailwind\.config\.[mc]?[jt]s$/.test(norm(f.name)));
  if (!file) return "";
  let code: string;
  try {
    code = transform(file.code, { transforms: ["typescript", "imports"], filePath: file.name }).code;
  } catch {
    return "";
  }
  return `<script>try{(function(){var any=new Proxy(function(){},{get:function(t,k){return k===Symbol.toPrimitive?function(){return ""}:any},apply:function(){return any}});var module={exports:{}},exports=module.exports,require=function(){return any};${escapeScript(code)}
;var c=(module.exports&&module.exports.default)||module.exports;if(c&&typeof c==="object"){c.plugins=[];delete c.content;tailwind.config=c}})()}catch(e){console.warn("No se pudo aplicar tailwind.config: "+e.message)}</script>`;
}

// react-router dentro del iframe: BrowserRouter llama a history.pushState, que acá lanza
// SecurityError. Se sirve el mismo paquete con los enrutadores "de URL" cambiados por el de memoria.
const routerShim = (url: string) => dataModule(
  `export * from ${JSON.stringify(url)};\nimport { MemoryRouter, createMemoryRouter } from ${JSON.stringify(url)};\n` +
  `export const BrowserRouter = MemoryRouter;\nexport const HashRouter = MemoryRouter;\n` +
  `export const createBrowserRouter = createMemoryRouter;\nexport const createHashRouter = createMemoryRouter;`,
  "react-router (vista previa)",
);

const FRAME_CSS = `html,body{min-height:100%}body{margin:0}` +
  `#basalt-loading{position:fixed;inset:0;display:grid;place-items:center;font:14px system-ui,sans-serif;color:#78797c;background:#fff}` +
  `#basalt-error{position:fixed;inset:0;z-index:2147483647;margin:0;padding:20px;overflow:auto;box-sizing:border-box;background:#fff;color:#b3261e;font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;overflow-wrap:anywhere}`;

const BOOT_HEAD = `const fail=(e)=>{const m=(e&&(e.stack||e.message))||String(e);let el=document.getElementById("basalt-error");if(!el){el=document.createElement("pre");el.id="basalt-error";document.body.appendChild(el)}el.textContent="No se pudo mostrar la vista previa\\n\\n"+m;const l=document.getElementById("basalt-loading");if(l)l.remove()};
let ready=false;
addEventListener("error",(e)=>{if(!ready)fail(e.error||e.message)});
addEventListener("unhandledrejection",(e)=>{if(!ready)fail(e.reason)});
const done=()=>{const l=document.getElementById("basalt-loading");if(l)l.remove();setTimeout(()=>{ready=true},1500)};`;

function errorDoc(title: string, detail: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">${PREVIEW_SHIM}<style>${FRAME_CSS}</style></head><body>` +
    `<pre id="basalt-error"></pre><script>var m=${jsonForScript(`${title}\n\n${detail}`)};document.getElementById("basalt-error").textContent=m;console.error(m)</script></body></html>`;
}

/**
 * Documento completo para el iframe. Nunca lanza: si un archivo no transpila, el documento
 * que devuelve muestra el error (y lo manda a la consola de la tarjeta).
 */
export function bundleReact(input: ProjectFile[], transform: Transform): ReactBundle {
  const files = input.map((f) => ({ ...f, name: norm(f.name) }));
  const byPath = new Map(files.map((f) => [f.name, f]));
  const has = (p: string) => byPath.has(p);
  const deps = readDependencies(files);
  const warnings: string[] = [];

  const entry = findEntry(files, has);
  if (!entry) {
    return { html: errorDoc("No encontré qué mostrar", "El proyecto no trae un componente de React (un archivo .tsx o .jsx)."), entry: null, externals: [], warnings };
  }

  const modules = new Map<string, string>();      // archivo → código listo
  const externals = new Set<string>();
  const cssFiles: string[] = [];
  const cssLinks = new Set<string>();
  const missing = new Map<string, Set<string>>(); // especificador sustituto → nombres pedidos
  const queue = [entry.path];

  const mapSpec = (spec: string, clause: string, from: string): string | null => {
    const binds = /\bfrom\s*$/.test(clause);
    if (!isLocalSpec(spec)) {
      if (/\.css$/i.test(spec)) {
        cssLinks.add(packageUrl(spec, deps, false));
        return binds ? LOCAL + "__estilos" : null;
      }
      externals.add(spec);
      return spec;
    }
    const target = resolveLocal(spec, from, has);
    if (!target) {
      const key = LOCAL + "__falta/" + joinPath(dirOf(from), spec.replace(/^[@~]\//, "src/"));
      const names = missing.get(key) ?? new Set<string>();
      requestedNames(clause).forEach((n) => names.add(n));
      missing.set(key, names);
      if (!ASSET_RE.test(spec)) warnings.push(`${from} importa ${spec}, que no llegó (¿respuesta cortada?)`);
      return key;
    }
    if (/\.css$/i.test(target)) {
      if (!cssFiles.includes(target)) cssFiles.push(target);
      return binds ? LOCAL + "__estilos" : null;
    }
    if (CODE_RE.test(target) && !modules.has(target) && !queue.includes(target)) queue.push(target);
    return LOCAL + target;
  };

  while (queue.length) {
    const path = queue.shift()!;
    if (modules.has(path)) continue;
    const file = byPath.get(path)!;
    const ts = /\.tsx?$/i.test(path);
    const transforms: SucraseTransform[] = /\.ts$/i.test(path) ? ["typescript"] : ts ? ["typescript", "jsx"] : ["jsx"];
    let code: string;
    try {
      code = transform(file.code, { transforms, jsxRuntime: "automatic", production: true, filePath: path }).code;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { html: errorDoc(`Error de sintaxis en ${path}`, msg), entry: entry.path, externals: [...externals], warnings };
    }
    if (path === entry.path && !entry.mounts) code = withDefaultExport(code);
    modules.set(path, ""); // reservado: un import circular no lo vuelve a encolar
    code = code
      .replace(IMPORT_FROM, (m, pre: string, q: string, spec: string) => {
        const to = mapSpec(spec, pre, path);
        return to === null ? "" : `${pre}${q}${to}${q}`;
      })
      .replace(IMPORT_SIDE, (m, pre: string, q: string, spec: string) => {
        const to = mapSpec(spec, "", path);
        return to === null ? (pre.startsWith(";") ? ";" : "") : `${pre}${q}${to}${q};`;
      })
      .replace(IMPORT_DYNAMIC, (m, pre: string, q: string, spec: string, post: string) => {
        const to = mapSpec(spec, "", path);
        return to === null ? "Promise.resolve({})" : `${pre}${q}${to}${q}${post}`;
      });
    modules.set(path, code);
  }

  // ── import map ────────────────────────────────────────────────────────────
  const reactV = cleanVersion(deps.react) ?? DEFAULT_REACT;
  const imports: Record<string, string> = {
    react: `${ESM_CDN}/react@${reactV}`,
    "react/": `${ESM_CDN}/react@${reactV}/`,
    "react-dom": `${ESM_CDN}/react-dom@${reactV}`,
    "react-dom/": `${ESM_CDN}/react-dom@${reactV}/`,
  };
  for (const spec of externals) {
    const { name } = splitPackage(spec);
    if (name === "react" || name === "react-dom") continue;
    const url = packageUrl(spec, deps, true);
    imports[spec] = name === "react-router-dom" || name === "react-router" ? routerShim(url) : url;
  }
  for (const [path, code] of modules) imports[LOCAL + path] = dataModule(code, path);
  for (const f of files) {
    const key = LOCAL + f.name;
    if (imports[key]) continue;
    if (/\.json$/i.test(f.name)) imports[key] = dataModule(`export default ${f.code.trim() || "null"};`, f.name);
    else if (/\.svg$/i.test(f.name)) imports[key] = dataModule(`export default ${JSON.stringify("data:image/svg+xml;charset=utf-8," + encodeURIComponent(f.code))};`, f.name);
    else if (!CODE_RE.test(f.name) && !/\.(css|html?)$/i.test(f.name)) imports[key] = dataModule(`export default ${JSON.stringify(f.code)};`, f.name);
  }
  // Módulos CSS (`import s from "./x.module.css"`): las clases quedan con su nombre tal cual.
  imports[LOCAL + "__estilos"] = dataModule(`export default new Proxy({}, { get: (_, k) => String(k) });`, "estilos");
  const BLANK = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><rect width="4" height="3" fill="#e5e5e7"/></svg>`);
  for (const [key, names] of missing) {
    const body = ASSET_RE.test(key)
      ? `export default ${JSON.stringify(BLANK)};`
      : `const Falta = () => null;\nexport default Falta;\n` + [...names].map((n) => `export const ${n} = Falta;`).join("\n");
    imports[key] = dataModule(body, key);
  }

  // ── estilos ───────────────────────────────────────────────────────────────
  const tw = tailwindMode(files, deps);
  const allCss = [...cssFiles, ...files.map((f) => f.name).filter((n) => /\.css$/i.test(n) && !cssFiles.includes(n))];
  const styleType = tw ? ` type="text/tailwindcss"` : "";
  const styles = allCss.map((n) => `<style${styleType} data-file="${escapeAttr(n)}">\n${escapeStyle(byPath.get(n)!.code)}\n</style>`).join("\n");
  const tailwind = tw === "v4"
    ? `<script src="${TAILWIND_V4}"></script>`
    : tw === "v3" ? `<script src="${TAILWIND_V3}"></script>${tailwindConfigScript(files, transform)}` : "";

  // ── lo que el index.html del proyecto aporta (título, fuentes, clase del body) ──
  const html = files.find((f) => /(^|\/)index\.html?$/i.test(f.name));
  const title = html && /<title[^>]*>([^<]{1,80})<\/title>/i.exec(html.code)?.[1];
  const headLinks = (html?.code.match(/<link\b[^>]*>/gi) ?? []).filter((t) => /href\s*=\s*["']https?:\/\//i.test(t)).join("");
  const bodyClass = html && /<body\b[^>]*\bclass\s*=\s*["']([^"']*)["']/i.exec(html.code)?.[1];
  const entryCode = byPath.get(entry.path)!.code;
  const rootId = (html && /<div\b[^>]*\bid\s*=\s*["']([\w-]+)["'][^>]*>\s*<\/div>/i.exec(html.code)?.[1])
    ?? /getElementById\(\s*["']([\w-]+)["']\s*\)/.exec(entryCode)?.[1] ?? "root";

  const entrySpec = JSON.stringify(LOCAL + entry.path);
  const boot = entry.mounts
    ? `${BOOT_HEAD}\ntry{await import(${entrySpec});done()}catch(e){console.error(e&&e.message||String(e));fail(e)}`
    : `${BOOT_HEAD}
try{
  const [RN,RD,M]=await Promise.all([import("react"),import("react-dom/client"),import(${entrySpec})]);
  const R=RN.default||RN;
  const App=M.default||Object.values(M).find((v)=>typeof v==="function");
  if(!App)throw new Error("No encontré un componente para mostrar: expórtalo con «export default».");
  class Limite extends R.Component{constructor(p){super(p);this.state={e:null}}static getDerivedStateFromError(e){return{e}}componentDidCatch(e){console.error(e&&e.message||String(e))}render(){return this.state.e?R.createElement("pre",{id:"basalt-error"},"El componente falló al dibujarse\\n\\n"+(this.state.e.stack||this.state.e.message||this.state.e)):this.props.children}}
  (RD.createRoot||RD.default.createRoot)(document.getElementById(${JSON.stringify(rootId)})).render(R.createElement(Limite,null,R.createElement(App)));
  done();
}catch(e){console.error(e&&e.message||String(e));fail(e)}`;

  const warn = warnings.length ? `<script>${escapeScript(warnings.map((w) => `console.warn(${JSON.stringify("⚠ " + w)})`).join(";"))}</script>` : "";

  const doc =
    `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
    PREVIEW_SHIM + warn +
    `<title>${escapeAttr(title ?? "Vista previa")}</title>` +
    headLinks +
    [...cssLinks].map((href) => `<link rel="stylesheet" href="${escapeAttr(href)}">`).join("") +
    tailwind +
    `<style>${FRAME_CSS}</style>` +
    styles +
    `<script type="importmap">${jsonForScript({ imports })}</script>` +
    `</head><body${bodyClass ? ` class="${escapeAttr(bodyClass)}"` : ""}>` +
    `<div id="${escapeAttr(rootId)}"></div><div id="basalt-loading">Cargando la vista previa…</div>` +
    `<script type="module">${escapeScript(boot)}</script>` +
    `</body></html>`;

  return { html: doc, entry: entry.path, externals: [...externals], warnings };
}
