// Descargar una conversación como Markdown.
//
// Lo que sale de acá no es un adorno: un análisis de contrato son siete secciones que
// el usuario necesita pegar en un correo, guardarlo con el expediente o mandárselo a su
// abogado. Hasta ahora la única forma de sacarlo era copiar mensaje por mensaje, y al
// borrar la conversación se perdía.
//
// Markdown y no PDF a propósito: el chat ya responde en Markdown (tablas incluidas), se
// abre en cualquier editor, se pega en Word o Notion conservando el formato, y no hace
// falta ninguna librería nueva en el cliente.
import type { StoredMsg } from "./basalt";

const FECHA = new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeStyle: "short" });

/** Nombre de archivo seguro en Windows, macOS y Linux. */
export function safeFileName(title: string, fecha = new Date()): string {
  const base = title
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim().replace(/\s+/g, "-")
    .slice(0, 60)
    .toLowerCase() || "conversacion";
  return `${base}-${fecha.toISOString().slice(0, 10)}.md`;
}

interface Opciones {
  /** Quién respondía: "Basalt" o el nombre del Experto. */
  assistantName?: string;
  fecha?: Date;
}

/**
 * La conversación completa en Markdown. Incluye lo que el usuario adjuntó (solo el
 * nombre: el texto de un documento no se guarda en el historial, ver doc-context.ts),
 * las imágenes generadas y las fuentes web de cada respuesta.
 */
export function toMarkdown(title: string, messages: StoredMsg[], opts: Opciones = {}): string {
  const asistente = opts.assistantName || "Basalt";
  const partes: string[] = [`# ${title.trim() || "Conversación"}`, "", `_${asistente} · ${FECHA.format(opts.fecha ?? new Date())}_`, ""];

  for (const m of messages) {
    if (m.role === "user") {
      partes.push("## Tú", "");
      if (m.attachments?.length) {
        const fichas = m.attachments.map((a) => (a.kind === "image" ? `🖼️ ${a.name}` : a.kind === "web" ? `🌐 ${a.name}` : `📄 ${a.name}`));
        partes.push(`> Adjuntó: ${fichas.join(" · ")}`, "");
      }
    } else {
      partes.push(`## ${asistente}`, "");
    }

    if (m.text.trim()) partes.push(m.text.trim(), "");

    for (const img of m.images ?? []) {
      // La url de una imagen generada vive en /api/assets/<id>/raw y pide sesión: se
      // deja el enlace y la descripción, no un ![]() que se vería roto fuera de la app.
      if (img.url) partes.push(`🖼️ Imagen generada (${img.format}): ${img.url}`, "");
      else if (img.error) partes.push(`🖼️ Imagen que no se pudo generar: ${img.error}`, "");
    }

    if (m.sources?.length) {
      partes.push("**Fuentes:**", ...m.sources.map((s, i) => `${i + 1}. [${s.title || s.url}](${s.url})`), "");
    }
  }

  return partes.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** Dispara la descarga en el navegador. */
export function downloadMarkdown(fileName: string, contenido: string) {
  const blob = new Blob([contenido], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Sin esto el blob se queda en memoria hasta recargar la página.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
