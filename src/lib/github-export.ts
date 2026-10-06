// Reglas puras de "Subir a GitHub": nombre del repositorio y validación de los
// archivos ANTES de gastar una llamada a la API. Sin imports a propósito — las usa
// el navegador (diálogo) y la función de Vercel (api/github/export.ts), y con
// node16 cualquier import relativo sin ".js" rompería el typecheck de api/.

/** Permiso que se pide al vincular: crear repos y subir contenido en nombre del
 *  usuario. Se pide SOLO al exportar, nunca al iniciar sesión. */
export const GITHUB_REPO_SCOPE = "repo";

/** Evento que la tarjeta de proyecto dispara en `window` para abrir el diálogo. */
export const GITHUB_EXPORT_EVENT = "basalt:github-export";

/** Mismo tope que un proyecto guardado (api/projects: MAX_FILES). */
export const GH_MAX_ARCHIVOS = 100;
/** Por archivo y en total; los proyectos del chat son texto (código). */
export const GH_MAX_CHARS_ARCHIVO = 400_000;
export const GH_MAX_CHARS_TOTAL = 2_000_000;

export interface ArchivoExport {
  path: string;
  content: string;
}

/**
 * Nombre de repositorio válido para GitHub a partir del título del proyecto:
 * solo [A-Za-z0-9._-], sin acentos, sin puntos/guiones en los bordes, máx 100.
 */
export function sanitizeRepoName(titulo: string): string {
  const limpio = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/[-.]{2,}/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "")
    .slice(0, 100)
    .replace(/^[-._]+|[-._]+$/g, "");
  return limpio || "proyecto-creator-ia";
}

/** ¿El `scope` guardado en la cuenta incluye el permiso de repos? (GitHub lo
 *  devuelve separado por comas; better-auth a veces lo une con espacios.) */
export function tieneRepoScope(scope: string | null | undefined): boolean {
  if (!scope) return false;
  return scope.split(/[\s,]+/).includes(GITHUB_REPO_SCOPE);
}

/**
 * Revisa los archivos a subir. Devuelve `null` si están bien o el mensaje del
 * problema (en el idioma del usuario: va directo a la UI y a la respuesta 400).
 */
export function validarArchivos(archivos: ArchivoExport[]): string | null {
  if (!Array.isArray(archivos) || archivos.length === 0) return "No hay archivos para subir.";
  if (archivos.length > GH_MAX_ARCHIVOS) return `Máximo ${GH_MAX_ARCHIVOS} archivos por repositorio.`;
  const vistos = new Set<string>();
  let total = 0;
  for (const a of archivos) {
    if (!a || typeof a.path !== "string" || typeof a.content !== "string") return "Archivo mal formado.";
    const path = a.path;
    if (!path || path.length > 300) return `Nombre de archivo inválido: «${String(path).slice(0, 60)}».`;
    // Nada de rutas absolutas, escapes ni metacarpeta .git; GitHub además rechaza "\" y NUL.
    if (
      path.startsWith("/") ||
      path.includes("\\") ||
      path.includes("\0") ||
      path.split("/").some((seg) => seg === "" || seg === "." || seg === "..") ||
      path === ".git" ||
      path.startsWith(".git/")
    ) {
      return `Ruta de archivo inválida: «${path.slice(0, 60)}».`;
    }
    if (vistos.has(path)) return `Archivo repetido: «${path.slice(0, 60)}».`;
    vistos.add(path);
    if (a.content.length > GH_MAX_CHARS_ARCHIVO) return `«${path.slice(0, 60)}» supera los ${Math.round(GH_MAX_CHARS_ARCHIVO / 1000)} mil caracteres.`;
    total += a.content.length;
  }
  if (total > GH_MAX_CHARS_TOTAL) return "El proyecto supera el tamaño máximo para subirlo de una vez (2 MB de texto).";
  return null;
}

/** README que se añade solo si el proyecto no trae uno: un repo sin README se ve roto. */
export function readmePorDefecto(titulo: string): string {
  return `# ${titulo}\n\nProyecto generado con [Creator IA](https://creator-ia.com).\n\n## Cómo usarlo\n\nSi es HTML estático, abre \`index.html\` en el navegador. Si es un proyecto Vite/React:\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`;
}

/** ¿Ya hay un README en la raíz? (da igual mayúsculas o extensión). */
export function tieneReadme(archivos: ArchivoExport[]): boolean {
  return archivos.some((a) => /^readme(\.(md|txt|markdown))?$/i.test(a.path));
}
