// Enlaces que el usuario pegó en el compositor.
//
// Un modelo no puede abrir una URL: si le pegas un enlace y le pides un resumen, o
// inventa el contenido o dice que no puede. /api/scrape ya existía (con guard SSRF,
// 512 KB, 15.000 caracteres y 10 s de timeout) pero solo lo usaba el Studio que ya no
// está enrutado. Acá se detectan los enlaces para ofrecer leerlos — nunca se lee solo:
// leer una página tarda segundos y el usuario puede estar pegando el enlace solo para
// mencionarlo.

/** Caracteres de cierre que suelen venir pegados al final de una URL en una frase. */
const TRAILING = /[.,;:!?)\]}>"'»]+$/;

const URL_RE = /\bhttps?:\/\/[^\s<>"']+/gi;

/** Las URLs http(s) del texto, sin repetir, en orden y como máximo `max`. */
export function findLinks(text: string, max = 3): string[] {
  const out: string[] = [];
  for (const match of text.match(URL_RE) ?? []) {
    const clean = match.replace(TRAILING, "");
    try {
      const url = new URL(clean);
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;
      // Sin host no hay nada que leer (http://, http:///ruta).
      if (!url.hostname.includes(".")) continue;
    } catch {
      continue;
    }
    if (!out.includes(clean)) out.push(clean);
    if (out.length >= max) break;
  }
  return out;
}

/** El dominio, que es lo que identifica el enlace para el usuario. */
export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
