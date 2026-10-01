// Subida de imágenes a Vercel Blob.
//
// Antes, una imagen generada volvía al navegador como data URI base64 y de ahí se
// guardaba TAL CUAL dentro de la fila de Postgres: medido en producción, cuatro
// imágenes pesaban 6 MB en una sola respuesta y una sola fila llegaba a 1,9 MB.
// Ahora la imagen se sube acá y en la base queda una URL de ~100 caracteres.
//
// El store es público con URL no adivinable (sufijo aleatorio que añade Blob), igual
// que las URLs temporales de Replicate que ya se usaban: así el navegador la pide
// directo al CDN, con caché, sin pasar por una función en cada miniatura.
import { put } from "@vercel/blob";

/** Tipos que se aceptan. Sin SVG: puede traer <script> y se serviría desde un origen propio. */
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const DATA_URI = /^data:([^;,]+);base64,(.*)$/s;

export function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Sube un data URI y devuelve su URL pública. Si no es un data URI (ya es una URL),
 * lo devuelve tal cual. Si el tipo no está permitido o Blob no está configurado,
 * devuelve null para que quien llama decida si sigue con el data URI de siempre:
 * una imagen que el usuario pagó no se pierde porque falle la subida.
 */
export async function uploadImage(dataUri: string, userId: string): Promise<string | null> {
  if (!dataUri.startsWith("data:")) return dataUri;
  if (!isBlobConfigured()) return null;

  const match = DATA_URI.exec(dataUri);
  if (!match) return null;
  const [, rawMime, base64] = match;
  const mime = rawMime.toLowerCase();
  if (!ALLOWED.has(mime)) return null;

  try {
    const body = Buffer.from(base64, "base64");
    // addRandomSuffix es lo que hace la URL no adivinable; el prefijo por usuario
    // solo sirve para poder mirar el store y entender de quién es cada cosa.
    const { url } = await put(`imagenes/${userId}/${Date.now()}.${EXT[mime] ?? "png"}`, body, {
      access: "public",
      contentType: mime,
      addRandomSuffix: true,
      cacheControlMaxAge: 31_536_000,
    });
    return url;
  } catch (err) {
    console.error("[blob] No se pudo subir la imagen:", err);
    return null;
  }
}
