import { describe, expect, it } from "vitest";
import { safeFileName, toMarkdown } from "./export-conversation";
import type { StoredMsg } from "./basalt";

const FECHA = new Date("2026-10-04T15:30:00Z");

describe("toMarkdown", () => {
  it("arma la conversación con quién dijo qué", () => {
    const msgs: StoredMsg[] = [
      { id: "1", role: "user", text: "¿Qué riesgos tiene este contrato?" },
      { id: "2", role: "model", text: "## Resumen\n\nEs un contrato de servicios." },
    ];
    const md = toMarkdown("Contrato ACME", msgs, { fecha: FECHA });
    expect(md).toContain("# Contrato ACME");
    expect(md).toContain("## Tú\n\n¿Qué riesgos tiene este contrato?");
    expect(md).toContain("## Basalt\n\n## Resumen");
    expect(md.endsWith("\n")).toBe(true);
  });

  it("usa el nombre del Experto cuando lo hay", () => {
    const md = toMarkdown("x", [{ id: "1", role: "model", text: "hola" }], { assistantName: "Legal", fecha: FECHA });
    expect(md).toContain("## Legal");
    expect(md).not.toContain("## Basalt");
  });

  it("deja constancia de lo adjunto, con su tipo", () => {
    const msgs: StoredMsg[] = [{
      id: "1", role: "user", text: "Analiza esto",
      attachments: [
        { name: "contrato.pdf", chars: 1200, kind: "doc" },
        { name: "foto.png", chars: 0, kind: "image" },
        { name: "bcentral.cl", chars: 900, kind: "web" },
      ],
    }];
    const md = toMarkdown("x", msgs, { fecha: FECHA });
    expect(md).toContain("📄 contrato.pdf");
    expect(md).toContain("🖼️ foto.png");
    expect(md).toContain("🌐 bcentral.cl");
  });

  it("incluye fuentes e imágenes generadas", () => {
    const msgs: StoredMsg[] = [{
      id: "1", role: "model", text: "El dólar cerró a $960.",
      sources: [{ title: "Banco Central", url: "https://bcentral.cl/a" }],
      images: [{ prompt: "post", format: "1:1", url: "https://blob/x.png" }, { prompt: "otro", format: "1:1", error: "sin créditos" }],
    }];
    const md = toMarkdown("x", msgs, { fecha: FECHA });
    expect(md).toContain("1. [Banco Central](https://bcentral.cl/a)");
    expect(md).toContain("https://blob/x.png");
    expect(md).toContain("sin créditos");
  });

  it("no deja huecos de líneas en blanco", () => {
    const md = toMarkdown("x", [{ id: "1", role: "model", text: "" }], { fecha: FECHA });
    expect(md).not.toMatch(/\n{3,}/);
  });
});

describe("safeFileName", () => {
  it("quita acentos, signos y pone la fecha", () => {
    expect(safeFileName("Análisis: contrato ACME (2026)", FECHA)).toBe("analisis-contrato-acme-2026-2026-10-04.md");
  });

  it("aguanta un título vacío o solo de signos", () => {
    expect(safeFileName("", FECHA)).toBe("conversacion-2026-10-04.md");
    expect(safeFileName("¿¡!?", FECHA)).toBe("conversacion-2026-10-04.md");
  });

  it("recorta un título larguísimo", () => {
    const nombre = safeFileName("a".repeat(200), FECHA);
    expect(nombre.length).toBeLessThanOrEqual(75);
  });
});
