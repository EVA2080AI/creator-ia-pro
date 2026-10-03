// Fotos que el usuario sube al chat para que el modelo las MIRE (no para generarlas).
//
// 13 de los 21 modelos tienen `vision: true` y ese campo no lo leía nadie: el chat solo
// aceptaba documentos y el prompt mandaba al usuario a /tools, una ruta que ya redirige
// a Basalt. Acá se preparan en el navegador antes de que viajen:
//
//   - Se reescalan a 1400px de lado mayor y se recomprimen a JPEG: una foto de iPhone
//     son 4-8 MB, y el cuerpo de una función de Vercel tiene un tope de 4,5 MB (la
//     imagen viaja en base64, que además suma un tercio). Reescalada pesa ~200-400 KB
//     y el modelo ve exactamente lo mismo: ninguno mira más de ~1500px.
//   - La transparencia se aplana sobre blanco, porque JPEG no la tiene y si no el PNG
//     con fondo transparente llegaba con el fondo en negro.
//
// Como los documentos, la imagen NO se guarda en el historial: viaja en la petición y
// en la conversación queda solo la ficha con el nombre.
import { DocError } from "@/lib/doc-extract";

/** Tipos que aceptan los modelos con visión de OpenRouter. */
export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

const ACCEPTED = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);

/** Tope del archivo ORIGINAL: por encima ni se intenta abrir (el navegador se traba). */
const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Lado mayor después de reescalar. */
const MAX_SIDE = 1400;

const QUALITY = 0.85;

export interface PreparedImage {
  /** data URI listo para `image_url` de OpenRouter. */
  dataUrl: string;
  width: number;
  height: number;
  /** Bytes del data URI (lo que de verdad viaja). */
  bytes: number;
}

export const isImageFile = (file: File) => ACCEPTED.has(file.type.toLowerCase());

function loadBitmap(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new DocError(`No pude abrir «${file.name}»: ¿es una imagen válida?`)); };
    img.src = url;
  });
}

/** Reescala y recomprime una imagen para mandársela a un modelo con visión. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!isImageFile(file)) throw new DocError(`«${file.name}» no es un formato de imagen que pueda leer (PNG, JPG, WEBP o GIF).`);
  if (file.size > MAX_FILE_BYTES) throw new DocError(`«${file.name}» pesa demasiado (máximo 20 MB).`);

  const img = await loadBitmap(file);
  const escala = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * escala));
  const height = Math.max(1, Math.round(img.naturalHeight * escala));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new DocError("Este navegador no pudo procesar la imagen.");
  // Blanco debajo: JPEG no tiene transparencia y sin esto un PNG recortado llegaba negro.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
  if (!dataUrl.startsWith("data:image/jpeg")) throw new DocError(`No pude preparar «${file.name}».`);
  return { dataUrl, width, height, bytes: dataUrl.length };
}

/** Las imágenes de un portapapeles o de un arrastre, si las hay. */
export function imagesFromTransfer(items: DataTransferItemList | null | undefined): File[] {
  if (!items) return [];
  const out: File[] = [];
  for (const item of Array.from(items)) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (file && isImageFile(file)) out.push(file);
  }
  return out;
}

/**
 * Las fotos que todavía hacen falta: las del último mensaje del usuario que llevaba
 * alguna, si sigue en memoria. Sin esto, una pregunta de seguimiento ("¿y qué dice
 * abajo?") llegaba al modelo sin la imagen y la respondía a ciegas. Se mira solo en los
 * mensajes recientes porque cada foto vuelve a costar tokens.
 */
export function recentImages(
  history: { id: string; role: "user" | "model"; attachments?: { name: string; kind?: string }[] }[],
  byMsg: Map<string, string[]>,
  lookback = 6,
): { urls: string[]; names: string[] } {
  for (const m of history.slice(-lookback).reverse()) {
    if (m.role !== "user") continue;
    const urls = byMsg.get(m.id);
    if (urls?.length) {
      return { urls, names: (m.attachments ?? []).filter((a) => a.kind === "image").map((a) => a.name) };
    }
  }
  return { urls: [], names: [] };
}
