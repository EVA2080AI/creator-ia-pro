// Constancia de firma electrónica — estampa, al final del PDF original, una
// página con el trazo de cada firmante y su evidencia (fecha, IP, dispositivo,
// huella SHA-256 del documento). Función pura sobre pdf-lib: sin base de datos
// ni almacenamiento, para poderse probar sola (src/test/constancia.test.ts).
// La usa api/firmar/[token].ts cuando firma la última persona.
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";

export interface FirmanteConstancia {
  nombre: string;
  rol: string;
  documento: string | null;
  firmaUrl: string | null;
  firmadoAt: Date | null;
  ip: string | null;
  userAgent: string | null;
}

const fechaBogota = (d: Date) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" }).format(d) +
  " (hora de Colombia)";

// Las fuentes estándar de pdf-lib solo codifican WinAnsi (cp1252): un emoji en el
// título o un User-Agent exótico harían lanzar a encodeText y tumbarían TODO el
// estampado. Se reemplaza lo no representable por "?" y los saltos/controles por espacio.
const WINANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
export function winAnsiSeguro(texto: string): string {
  let out = "";
  for (const ch of texto) {
    const c = ch.codePointAt(0)!;
    if (c === 9 || c === 10 || c === 13) out += " ";
    else if ((c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || WINANSI_EXTRA.includes(ch)) out += ch;
    else out += "?";
  }
  return out;
}

// Un título de 200 caracteres o un nombre larguísimo no caben en una línea:
// se envuelve por palabras (y por caracteres si una sola palabra desborda).
function envolver(texto: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of texto.split(" ")) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (font.widthOfTextAtSize(candidata, size) <= maxWidth) {
      actual = candidata;
      continue;
    }
    if (actual) lineas.push(actual);
    let resto = palabra;
    while (font.widthOfTextAtSize(resto, size) > maxWidth) {
      let corte = resto.length;
      while (corte > 1 && font.widthOfTextAtSize(resto.slice(0, corte), size) > maxWidth) corte--;
      lineas.push(resto.slice(0, corte));
      resto = resto.slice(corte);
    }
    actual = resto;
  }
  if (actual) lineas.push(actual);
  return lineas.length ? lineas : [""];
}

/** Lee ancho y alto del IHDR sin descomprimir; null si no es un PNG. */
export function dimensionesPng(bytes: Uint8Array): { w: number; h: number } | null {
  const firma = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 24 || firma.some((b, i) => bytes[i] !== b)) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { w: dv.getUint32(16), h: dv.getUint32(20) };
}

// Tope de píxeles del trazo: evita que un PNG diminuto pero inflable (bomba de
// descompresión) consuma la memoria de la función al incrustarlo.
export const MAX_LADO_FIRMA_PX = 4000;

export async function estamparConstancia(
  pdfOriginal: Uint8Array,
  acuerdo: { titulo: string; id: string; hashSha256: string },
  firmantes: FirmanteConstancia[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfOriginal);
  const fuente = await doc.embedFont(StandardFonts.Helvetica);
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold);

  const A4: [number, number] = [595.28, 841.89];
  const margen = 56;
  const ancho = A4[0] - margen * 2;
  const tinta = rgb(0.07, 0.07, 0.07);
  const gris = rgb(0.38, 0.38, 0.38);

  let pagina = doc.addPage(A4);
  let y = A4[1] - margen;

  const texto = (t: string, opts: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> } = {}) => {
    const font = opts.bold ? negrita : fuente;
    const size = opts.size ?? 10;
    for (const linea of envolver(winAnsiSeguro(t), font, size, ancho)) {
      if (y < margen + size) {
        pagina = doc.addPage(A4);
        y = A4[1] - margen;
      }
      pagina.drawText(linea, { x: margen, y, size, font, color: opts.color ?? tinta });
      y -= size + 5;
    }
  };

  texto("CONSTANCIA DE FIRMA ELECTRÓNICA", { bold: true, size: 15 });
  y -= 2;
  texto(acuerdo.titulo, { size: 11 });
  texto(`Documento: ${acuerdo.id}`, { size: 8.5, color: gris });
  texto(`Huella SHA-256 del documento firmado: ${acuerdo.hashSha256}`, { size: 8.5, color: gris });
  texto("Las partes firmaron electrónicamente este documento mediante enlace individual y trazo manuscrito digital.", { size: 8.5, color: gris });
  y -= 10;
  pagina.drawLine({ start: { x: margen, y }, end: { x: margen + ancho, y }, thickness: 1, color: tinta });
  y -= 24;

  for (const f of firmantes) {
    // Cada bloque mide ~150 pt; si no cabe, nueva página.
    if (y < margen + 160) {
      pagina = doc.addPage(A4);
      y = A4[1] - margen;
    }
    if (f.firmaUrl) {
      try {
        const bytes = new Uint8Array(await (await fetch(f.firmaUrl)).arrayBuffer());
        const dims = dimensionesPng(bytes);
        if (!dims || dims.w > MAX_LADO_FIRMA_PX || dims.h > MAX_LADO_FIRMA_PX) {
          throw new Error(`Trazo inválido o desproporcionado (${dims ? `${dims.w}×${dims.h}` : "no es PNG"}).`);
        }
        const png = await doc.embedPng(bytes);
        // Trazo a lo sumo 210×70 pt, manteniendo proporción.
        const escala = Math.min(210 / png.width, 70 / png.height, 1);
        const w = png.width * escala, h = png.height * escala;
        pagina.drawImage(png, { x: margen, y: y - h, width: w, height: h });
        y -= h + 6;
      } catch (err) {
        // La constancia nunca se cae por una imagen: el bloque queda con los datos y sin trazo.
        console.error("[constancia] No se pudo incrustar una firma:", err);
        y -= 20;
      }
    }
    pagina.drawLine({ start: { x: margen, y }, end: { x: margen + 240, y }, thickness: 0.8, color: tinta });
    y -= 14;
    texto(f.nombre, { bold: true, size: 10.5 });
    texto(f.documento ? `${f.rol} — ${f.documento}` : f.rol, { size: 9.5 });
    if (f.firmadoAt) texto(`Firmó el ${fechaBogota(f.firmadoAt)}`, { size: 8.5, color: gris });
    const rastro = [f.ip ? `IP ${f.ip}` : null, f.userAgent ? f.userAgent.slice(0, 80) : null].filter(Boolean).join(" · ");
    if (rastro) texto(rastro, { size: 7.5, color: gris });
    y -= 18;
  }

  return doc.save();
}
