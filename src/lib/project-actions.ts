// Lo que se puede HACER con los archivos de un proyecto: descargarlos, llevarlos a
// StackBlitz o a GitHub. Lo usan la tarjeta del chat (useProjectCards) y el Canvas, para
// que el mismo botón haga lo mismo en los dos lados.
import { stackblitzFields, type ProjectFile } from "./project-preview";
import { GITHUB_EXPORT_EVENT } from "./github-export";
import { parseDeck } from "./slides";

export function projectTitle(files: ProjectFile[]): string {
  const html = files.find((f) => /\.html?$/i.test(f.name));
  const fromTitle = html && /<title[^>]*>([^<]{1,60})<\/title>/i.exec(html.code)?.[1]?.trim();
  return fromTitle || "Proyecto Basalt";
}

export const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "proyecto-basalt";

// El tipo correcto hace que macOS/Windows abran el archivo con Word/Excel
// directamente en vez de con el navegador.
const FILE_MIME: Record<string, string> = {
  xls: "application/vnd.ms-excel",
  doc: "application/msword",
  csv: "text/csv;charset=utf-8",
  html: "text/html;charset=utf-8",
  htm: "text/html;charset=utf-8",
  svg: "image/svg+xml;charset=utf-8",
  md: "text/markdown;charset=utf-8",
  json: "application/json;charset=utf-8",
};

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Descarga UN archivo con su nombre (solo el nombre: `src/App.tsx` baja como `App.tsx`). */
export function downloadFile(name: string, code: string) {
  const base = name.split("/").pop() || name;
  const ext = base.includes(".") ? base.split(".").pop()!.toLowerCase() : "";
  download(new Blob([code], { type: FILE_MIME[ext] ?? "text/plain;charset=utf-8" }), base);
}

export async function downloadZip(files: ProjectFile[], title = projectTitle(files)): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  files.forEach((f) => zip.file(f.name, f.code));
  download(await zip.generateAsync({ type: "blob" }), `${slug(title)}.zip`);
}

export const canStackblitz = (files: ProjectFile[]) => stackblitzFields(files, "x") !== null;

/** Abre el proyecto en StackBlitz (formulario POST a /run en otra pestaña). false = no hay nada que ejecutar. */
export function openStackblitz(files: ProjectFile[], title = projectTitle(files)): boolean {
  const fields = stackblitzFields(files, title);
  if (!fields) return false;
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://stackblitz.com/run";
  form.target = "_blank";
  form.style.display = "none";
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  form.remove();
  return true;
}

/** El diálogo (GitHubExportDialog, montado en la página) hace el resto: estado de
 *  vinculación, nombre del repo y subida. */
export function exportToGithub(files: ProjectFile[], title = projectTitle(files)) {
  window.dispatchEvent(new CustomEvent(GITHUB_EXPORT_EVENT, {
    detail: { titulo: title, archivos: files.map((f) => ({ path: f.name, content: f.code })) },
  }));
}

/** El bloque ```slides como archivo de PowerPoint. El generador se carga recién acá. */
export async function downloadPptx(source: string): Promise<void> {
  const { deckToPptx } = await import("./slides-pptx");
  const deck = parseDeck(source);
  download((await deckToPptx(deck)) as Blob, `${slug(deck.title).slice(0, 60) || "presentacion"}.pptx`);
}
