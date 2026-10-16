// La constancia de firma: se añade al final del PDF sin tocar las páginas
// originales, incrusta el trazo PNG de cada firmante y no revienta cuando una
// firma falta o su descarga falla (el acuerdo nunca debe quedar sin PDF final
// por una imagen rota).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PDFDocument } from "pdf-lib";
import { dimensionesPng, estamparConstancia, winAnsiSeguro } from "../../api/_lib/constancia";

// PNG transparente de 1×1 — suficiente para embedPng.
const PNG_1PX = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));

async function pdfDePrueba(paginas = 3): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < paginas; i++) {
    const p = doc.addPage([595.28, 841.89]);
    p.drawText(`Página ${i + 1} del acuerdo`, { x: 56, y: 780, size: 12 });
  }
  return doc.save();
}

const FIRMANTES = [
  {
    nombre: "JUAN SEBASTIÁN MASMELA VELÁSQUEZ", rol: "Fundador / CEO", documento: "C.C. No. 81.717.626",
    firmaUrl: "https://blob.example/firma-juan.png", firmadoAt: new Date("2026-10-16T16:30:00Z"),
    ip: "181.49.0.10", userAgent: "Safari",
  },
  {
    nombre: "JOSE ELVER ARISTIZABAL DUARTE", rol: "Inversionista", documento: "C.C. No. 79.915.455",
    firmaUrl: "https://blob.example/firma-jose.png", firmadoAt: new Date("2026-10-16T17:00:00Z"),
    ip: "190.27.1.22", userAgent: "Chrome",
  },
];

const ACUERDO = { titulo: "Acuerdo de Participación Económica — Jose Aristizabal", id: "acu-123", hashSha256: "a".repeat(64) };

describe("estamparConstancia", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(PNG_1PX.slice().buffer, { status: 200 })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("añade la constancia al final sin alterar las páginas originales", async () => {
    const original = await pdfDePrueba(3);
    const sellado = await estamparConstancia(original, ACUERDO, FIRMANTES);
    const doc = await PDFDocument.load(sellado);
    expect(doc.getPageCount()).toBe(4);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("sobrevive a una firma que no se puede descargar", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("red caída"); }));
    const sellado = await estamparConstancia(await pdfDePrueba(1), ACUERDO, FIRMANTES);
    expect((await PDFDocument.load(sellado)).getPageCount()).toBe(2);
  });


  it("tolera emojis, títulos larguísimos y nombres sin espacios (WinAnsi + envoltura)", async () => {
    const acuerdo = { ...ACUERDO, titulo: ("Acuerdo 🚀 con «comillas» y emoji — " + "palabralarguisima".repeat(20)).slice(0, 200) };
    const firmantes = [{ ...FIRMANTES[0], nombre: "W".repeat(180), userAgent: "Mozilla/5.0 中文 🧨 " + "x".repeat(200) }];
    const sellado = await estamparConstancia(await pdfDePrueba(1), acuerdo, firmantes);
    expect((await PDFDocument.load(sellado)).getPageCount()).toBeGreaterThanOrEqual(2);
  });

  it("rechaza trazos que no son PNG o declaran dimensiones absurdas", async () => {
    expect(dimensionesPng(new Uint8Array([1, 2, 3]))).toBeNull();
    const dims = dimensionesPng(PNG_1PX);
    expect(dims).toEqual({ w: 1, h: 1 });
    // bomba: PNG válido cuyo IHDR declara 50000×50000 — la constancia lo salta sin caerse
    const bomba = PNG_1PX.slice();
    const dv = new DataView(bomba.buffer, bomba.byteOffset);
    dv.setUint32(16, 50000); dv.setUint32(20, 50000);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(bomba.buffer, { status: 200 })));
    const sellado = await estamparConstancia(await pdfDePrueba(1), ACUERDO, FIRMANTES);
    expect((await PDFDocument.load(sellado)).getPageCount()).toBe(2);
  });

  it("winAnsiSeguro conserva tildes y ñ, y neutraliza lo demás", () => {
    expect(winAnsiSeguro("Participación — señor «Núñez» ’quote’")).toBe("Participación — señor «Núñez» ’quote’");
    expect(winAnsiSeguro("hola\n🚀中")).toBe("hola ??");
  });

  it("acepta firmantes sin trazo (firmaUrl null) y reparte en más páginas si no caben", async () => {
    const muchos = Array.from({ length: 6 }, (_, i) => ({ ...FIRMANTES[i % 2], nombre: `Firmante ${i + 1}`, firmaUrl: null }));
    const sellado = await estamparConstancia(await pdfDePrueba(1), ACUERDO, muchos);
    expect((await PDFDocument.load(sellado)).getPageCount()).toBeGreaterThanOrEqual(2);
  });
});
