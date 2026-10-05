import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { DocError, MAX_DOC_CHARS, MAX_FILE_BYTES, docxToText, extractDocument, formatBytes, normalizeText, pdfPagesToText, readBuffer } from "./doc-extract";

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
async function makeDocx(bodyXml: string): Promise<File> {
  const zip = new JSZip();
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8"?><w:document ${W}><w:body>${bodyXml}</w:body></w:document>`);
  const buf = await zip.generateAsync({ type: "arraybuffer" });
  return new File([buf], "contrato.docx");
}
const p = (t: string) => `<w:p><w:r><w:t>${t}</w:t></w:r></w:p>`;

describe("docxToText", () => {
  it("conserva párrafos, tabulaciones, saltos y tablas, e ignora el texto borrado", async () => {
    const f = await makeDocx(
      p("CONTRATO DE PRESTACIÓN DE SERVICIOS") +
        '<w:p><w:r><w:t>Cláusula 1.</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>Objeto</w:t></w:r><w:r><w:br/></w:r><w:r><w:t>segunda línea</w:t></w:r></w:p>' +
        '<w:p><w:del><w:r><w:delText>texto borrado</w:delText></w:r></w:del><w:ins><w:r><w:t>texto vigente</w:t></w:r></w:ins></w:p>' +
        "<w:tbl><w:tr><w:tc>" + p("Valor") + "</w:tc><w:tc>" + p("$ 5.000.000") + "</w:tc></w:tr></w:tbl>",
    );
    const text = await docxToText(await readBuffer(f));
    expect(text).toContain("CONTRATO DE PRESTACIÓN DE SERVICIOS");
    expect(text).toContain("Cláusula 1.\tObjeto\nsegunda línea");
    expect(text).toContain("texto vigente");
    expect(text).not.toContain("texto borrado");
    expect(text).toContain("Valor | $ 5.000.000");
  });

  it("un zip sin cuerpo o un archivo que no es zip dan un error entendible", async () => {
    const empty = await new JSZip().generateAsync({ type: "arraybuffer" });
    await expect(docxToText(empty)).rejects.toThrow(/no parece un \.docx/);
    await expect(docxToText(new TextEncoder().encode("hola").buffer as ArrayBuffer)).rejects.toThrow(DocError);
  });
});

describe("extractDocument", () => {
  it("lee texto plano y normaliza espacios y saltos", async () => {
    const d = await extractDocument(new File(["Linea 1  \r\n\r\n\r\n\r\nLinea 2"], "notas.txt"));
    expect(d.text).toBe("Linea 1\n\nLinea 2");
    expect(d.truncated).toBe(false);
    expect(d.name).toBe("notas.txt");
  });

  it("lee un .docx completo", async () => {
    const d = await extractDocument(await makeDocx(p("Hola contrato")));
    expect(d.text).toBe("Hola contrato");
  });

  it("corta los documentos enormes y lo declara en el texto y en el resultado", async () => {
    const d = await extractDocument(new File(["x".repeat(MAX_DOC_CHARS + 500)], "gigante.txt"));
    expect(d.truncated).toBe(true);
    expect(d.chars).toBe(MAX_DOC_CHARS + 500);
    expect(d.text).toMatch(/documento truncado/);
  });

  it("rechaza lo que no puede leer con un mensaje claro", async () => {
    await expect(extractDocument(new File(["x"], "viejo.doc"))).rejects.toThrow(/\.doc antiguos/);
    await expect(extractDocument(new File(["x"], "foto.png"))).rejects.toThrow(/No puedo leer archivos \.png/);
    await expect(extractDocument(new File([], "vacio.txt"))).rejects.toThrow(/vacío/);
    await expect(extractDocument(new File(["   \n  "], "blanco.txt"))).rejects.toThrow(/no tiene texto/);
    const big = new File([new Uint8Array(1)], "enorme.pdf");
    Object.defineProperty(big, "size", { value: MAX_FILE_BYTES + 1 });
    await expect(extractDocument(big)).rejects.toThrow(/pesa/);
  });
});

describe("pdfPagesToText", () => {
  it("arma líneas con hasEOL y marca cada página para poder citarla", () => {
    const t = pdfPagesToText([
      [{ str: "CLÁUSULA ", hasEOL: false }, { str: "PRIMERA", hasEOL: true }, { str: "Las partes acuerdan", hasEOL: true }],
      [{ str: "Firmas", hasEOL: true }, {}],
    ]);
    expect(t).toBe("--- Página 1 ---\nCLÁUSULA PRIMERA\nLas partes acuerdan\n\n\n--- Página 2 ---\nFirmas\n");
  });
});

describe("utilidades", () => {
  it("formatBytes y normalizeText", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
    expect(normalizeText("  a \n\n\n b  ")).toBe("a\n\n b");
  });
});

describe("extractDocument con .md", () => {
  it("lee un README.md como texto plano, con su markdown intacto", async () => {
    const md = "# Mi proyecto\n\n## Arquitectura\n\n- Frontend: Vite + React\n- API: Vercel Functions\n\n## Despliegue\n\n```bash\nvercel --prod\n```\n";
    const file = new File([md], "README.md", { type: "text/markdown" });
    const doc = await extractDocument(file);
    expect(doc.name).toBe("README.md");
    expect(doc.text).toContain("## Despliegue");
    expect(doc.text).toContain("vercel --prod");
    expect(doc.truncated).toBe(false);
  });

  it("lee un .markdown aunque el navegador no le ponga mime", async () => {
    const file = new File(["## Stack\nNode 20"], "arquitectura.markdown", { type: "" });
    const doc = await extractDocument(file);
    expect(doc.text).toContain("Node 20");
  });
});
