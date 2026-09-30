// Revisión estática de un proyecto Vite/React generado por el modelo: ¿le falta algo para que
// "npm install && npm run dev" funcione? Visto en vivo: una app con `@tailwind base` sin
// tailwind.config.js ni postcss.config.js (los estilos no se aplican) y un script "build" con `tsc`
// sin tsconfig.json. No ejecuta nada: mira package.json, los imports y los archivos de configuración.
import type { ProjectFile } from "./project-preview";

const norm = (n: string) => n.replace(/^\.?\//, "");
const has = (files: ProjectFile[], re: RegExp) => files.some((f) => re.test(norm(f.name)));

// Módulos de Node y alias comunes que no salen de package.json.
const BUILTINS = new Set(["fs", "path", "url", "os", "crypto", "util", "stream", "http", "https", "child_process", "node:fs", "node:path", "node:url"]);

function packageOf(spec: string): string | null {
  if (spec.startsWith(".") || spec.startsWith("/") || spec.startsWith("@/") || spec.startsWith("~/") || spec.startsWith("#") || spec.startsWith("virtual:")) return null;
  if (BUILTINS.has(spec) || spec.startsWith("node:")) return null;
  const parts = spec.split("/");
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/** Problemas concretos, en español y accionables. Lista vacía = nada que señalar. */
export function findViteProblems(files: ProjectFile[]): string[] {
  const problems: string[] = [];
  const pkgFile = files.find((f) => norm(f.name) === "package.json");
  if (!pkgFile) return problems; // sin package.json no es un proyecto Vite todavía (o la respuesta se cortó antes)

  let pkg: { scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> } | null = null;
  try { pkg = JSON.parse(pkgFile.code); } catch { problems.push("package.json está incompleto o no es JSON válido (¿respuesta cortada?)"); }
  const deps = new Set(Object.keys({ ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) }));

  const css = files.filter((f) => /\.css$/i.test(f.name)).map((f) => f.code).join("\n");
  const viaPlugin = deps.has("@tailwindcss/vite") || deps.has("@tailwindcss/postcss");
  if (/@tailwind\s+(base|components|utilities)/.test(css) && !viaPlugin) {
    if (!has(files, /^tailwind\.config\.(js|cjs|mjs|ts)$/)) problems.push("falta tailwind.config.js (sin él Tailwind no encuentra tus clases)");
    if (!has(files, /^postcss\.config\.(js|cjs|mjs|ts)$/)) problems.push("falta postcss.config.js (sin él las directivas @tailwind no se procesan)");
    for (const d of ["tailwindcss", "postcss", "autoprefixer"]) if (pkg && !deps.has(d)) problems.push(`falta "${d}" en las dependencias de package.json`);
  }

  if (pkg?.scripts?.build && /\btsc\b/.test(pkg.scripts.build) && !has(files, /^tsconfig\.json$/)) problems.push("falta tsconfig.json (el script build usa tsc)");

  const html = files.find((f) => /^index\.html?$/i.test(norm(f.name)));
  const entry = html && /<script\b[^>]*\bsrc\s*=\s*["']\/?([^"']+\.(?:tsx?|jsx?))["']/i.exec(html.code)?.[1];
  if (entry && !files.some((f) => norm(f.name) === norm(entry))) problems.push(`index.html arranca ${entry} pero ese archivo no llegó`);

  if (pkg) {
    const missing = new Set<string>();
    for (const f of files) {
      if (!/\.(tsx?|jsx?|mjs)$/i.test(f.name) || /(^|\/)(vite|tailwind|postcss)\.config\./i.test(f.name)) continue;
      for (const m of f.code.matchAll(/(?:^|\n)\s*(?:import|export)\s[^'"\n]*?from\s*["']([^"']+)["']|(?:^|\n)\s*import\s*["']([^"']+)["']/g)) {
        const pk = packageOf(m[1] ?? m[2]);
        if (pk && !deps.has(pk)) missing.add(pk);
      }
    }
    if (missing.size) problems.push(`se importan paquetes que no están en package.json: ${[...missing].slice(0, 6).join(", ")}`);
  }
  return problems;
}
