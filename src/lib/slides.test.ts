import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { deckHtml, parseDeck, parseRuns, readableOn, runsText } from "./slides";
import { deckToPptx, fixParagraphs } from "./slides-pptx";
import { extractArtifacts } from "./canvas";
import { buildArtifactDoc } from "./canvas-preview";
import { mdToHtml } from "./markdown";

const DECK = `color: #0F766E
tema: oscuro

# Trigo
Propuesta comercial 2027

---

## El problema
- Los pedidos no crecen: **8 por semana** desde marzo
- Sin presencia en redes
  - 310 seguidores
- Dos cadenas cerca

Notas: Abrir con la anécdota.
Cerrar con la pregunta.

---

## 85%
de los clientes repite compra.

---

## Planes
1. Básico
2. Equipo

| Plan | Precio |
|---|---|
| Básico | $ 380.000 |

---

> "El mejor pan del barrio."
> — Laura Gómez

---

# ¡Gracias!`;

describe("parseRuns", () => {
  it("separa negrita, cursiva, código y enlaces sin perder texto", () => {
    const runs = parseRuns("Sube **30%** con *poco* `código` y [más](https://x.co) al final");
    expect(runsText(runs)).toBe("Sube 30% con poco código y más al final");
    expect(runs.find((r) => r.bold)?.text).toBe("30%");
    expect(runs.find((r) => r.italic)?.text).toBe("poco");
    expect(runs.find((r) => r.code)?.text).toBe("código");
    expect(runs.find((r) => r.href)).toEqual({ text: "más", href: "https://x.co" });
  });
  it("un guion_bajo dentro de una palabra no es cursiva", () => {
    expect(parseRuns("usa mi_variable_larga")).toEqual([{ text: "usa mi_variable_larga" }]);
  });
});

describe("parseDeck", () => {
  const deck = parseDeck(DECK);

  it("lee la cabecera: color de marca y tema", () => {
    expect(deck.accent).toBe("#0f766e");
    expect(deck.dark).toBe(true);
    expect(deck.title).toBe("Trigo");
  });

  it("una diapositiva por separador, con la distribución que le toca", () => {
    expect(deck.slides.map((s) => s.layout)).toEqual(["cover", "content", "stat", "content", "quote", "section"]);
    expect(deck.slides.map((s) => s.title)).toEqual(["Trigo", "El problema", "85%", "Planes", "", "¡Gracias!"]);
  });

  it("viñetas con niveles, y las notas del orador fuera del contenido", () => {
    const s = deck.slides[1];
    expect(s.blocks).toHaveLength(1);
    const list = s.blocks[0];
    expect(list.type === "bullets" && list.items.map((i) => `${i.level}:${runsText(i.runs)}`)).toEqual([
      "0:Los pedidos no crecen: 8 por semana desde marzo", "0:Sin presencia en redes", "1:310 seguidores", "0:Dos cadenas cerca",
    ]);
    expect(s.notes).toBe("Abrir con la anécdota.\nCerrar con la pregunta.");
  });

  it("lista numerada y tabla en la misma diapositiva; la fila de guiones no cuenta", () => {
    const [list, table] = deck.slides[3].blocks;
    expect(list.type === "bullets" && list.ordered).toBe(true);
    expect(table.type === "table" && table.rows.map((r) => r.map(runsText))).toEqual([["Plan", "Precio"], ["Básico", "$ 380.000"]]);
  });

  it("la cita separa el autor y pierde las comillas de adorno", () => {
    const q = deck.slides[4].blocks[0];
    expect(q.type === "quote" && runsText(q.runs)).toBe("El mejor pan del barrio.");
    expect(q.type === "quote" && q.author).toBe("Laura Gómez");
  });

  it("sin separadores, cada título abre una diapositiva", () => {
    const d = parseDeck("# Uno\nHola\n\n## Dos\n- a\n- b\n\n## Tres\n- c");
    expect(d.slides.map((s) => s.title)).toEqual(["Uno", "Dos", "Tres"]);
  });

  it("entiende el front-matter de Marp y no lo muestra", () => {
    const d = parseDeck("---\nmarp: true\ntheme: dark\npaginate: true\n---\n\n# Hola\n\n---\n\n## Dos\n- a");
    expect(d.dark).toBe(true);
    expect(d.slides.map((s) => s.title)).toEqual(["Hola", "Dos"]);
  });

  it("mucho texto baja el tamaño de letra en vez de salirse", () => {
    const largo = "## Detalle\n" + Array.from({ length: 12 }, (_, i) => `- Punto número ${i} con bastante texto para ocupar la línea completa`).join("\n");
    expect(parseDeck(`# A\n\n---\n\n${largo}`).slides[1].density).toBe(2);
    expect(deck.slides[1].density).toBe(0);
  });

  it("un color inválido se ignora y una línea «Autor: Ana» sigue siendo contenido", () => {
    const d = parseDeck("color: rojo\n# Hola\nAutor: Ana");
    expect(d.accent).toBe("#7c3aed");
    expect(d.slides[0].blocks[0]).toMatchObject({ type: "para" });
  });

  it("vacío no revienta: cero diapositivas", () => {
    expect(parseDeck("").slides).toEqual([]);
    expect(deckHtml(parseDeck(""))).toContain("todavía no tiene diapositivas");
  });
});

describe("deckHtml", () => {
  const html = deckHtml(parseDeck(DECK));

  it("es un documento completo con una sección por diapositiva y los controles", () => {
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html.match(/<section class="slide /g)).toHaveLength(6);
    expect(html).toContain(`<span id="n">1 / 6</span>`);
    expect(html).toContain(`id="play"`);
    expect(html).toContain("--accent:#0f766e");
  });

  it("escapa lo que el modelo escriba (nada de HTML vivo en una diapositiva)", () => {
    const evil = deckHtml(parseDeck(`# <img src=x onerror=alert(1)>\n- <script>alert(2)</script>`));
    expect(evil).not.toContain("<img src=x");
    expect(evil).not.toContain("<script>alert(2)");
    expect(evil).toContain("&lt;script&gt;alert(2)&lt;/script&gt;");
  });

  it("el texto sobre el color de marca se elige para que se lea", () => {
    expect(readableOn("#0f766e")).toBe("#ffffff");
    expect(readableOn("#fde047")).toBe("#111318");
  });
});

describe("la presentación en el chat y en el Canvas", () => {
  const md = "Aquí va:\n\n```slides\n" + DECK + "\n```\n\n¿Ajusto algo?";

  it("un bloque ```slides es un artefacto de tipo presentación, con su título", () => {
    const [a] = extractArtifacts(md);
    expect(a.kind).toBe("slides");
    expect(a.title).toBe("Trigo");
    expect(a.files[0].name).toBe("presentacion.md");
  });

  it("también valen ```presentación, ```pptx y el markdown de Marp", () => {
    expect(extractArtifacts("```presentación\n# Hola\n```")[0].kind).toBe("slides");
    expect(extractArtifacts("```pptx\n# Hola\n```")[0].kind).toBe("slides");
    expect(extractArtifacts("```markdown\n---\nmarp: true\n---\n# Hola\n```")[0].kind).toBe("slides");
    expect(extractArtifacts("```markdown\n# Un README cualquiera\n```")).toEqual([]);
  });

  it("vale aunque el modelo escriba «slides» en la primera línea del bloque (visto en producción)", () => {
    const suelto = "```\nslides\ncolor: #b45309\n# Trigo\nDesayunos\n\n---\n# Dos\n- a\n```";
    const conEspacio = "``` slides\n# Trigo\n\n---\n# Dos\n- a\n```";
    for (const md of [suelto, conEspacio]) {
      const [a] = extractArtifacts(md);
      expect(a.kind).toBe("slides");
      expect(a.title).toBe("Trigo");
      expect(a.files[0].code.startsWith("slides")).toBe(false);
      const host = document.createElement("div");
      host.innerHTML = mdToHtml(md);
      expect(host.querySelector(".md-codehead span")?.textContent).toBe("Presentación · 2 diapositivas");
    }
    expect(parseDeck(extractArtifacts(suelto)[0].files[0].code).accent).toBe("#b45309");
    // un bloque sin lenguaje que no empieza por uno conocido sigue siendo código
    expect(extractArtifacts("```\nhola\nmundo\n```")).toEqual([]);
  });

  it("la tarjeta dice cuántas diapositivas son y ofrece el PowerPoint, no un ZIP", () => {
    const host = document.createElement("div");
    host.innerHTML = mdToHtml(md);
    expect(host.querySelector(".md-project")?.getAttribute("data-kind")).toBe("slides");
    expect(host.querySelector(".md-codehead span")?.textContent).toBe("Presentación · 6 diapositivas");
    expect(host.querySelector('[data-act="pptx"]')?.textContent).toBe("Descargar PowerPoint");
    expect(host.querySelector('[data-act="zip"]')).toBeNull();
    expect(host.querySelector("iframe.md-preview-frame")).not.toBeNull();
  });

  it("la vista previa es el mismo documento de diapositivas", async () => {
    const doc = await buildArtifactDoc(extractArtifacts(md)[0]);
    expect(doc).toContain(`<section class="slide cover`);
  });
});

describe("PowerPoint", () => {
  it("fixParagraphs deja un solo bloque de propiedades por párrafo, el primero", () => {
    const xml = `<a:p><a:pPr marL="1"><a:buNone/></a:pPr><a:r><a:t>a</a:t></a:r><a:pPr indent="0"><a:buNone/></a:pPr><a:r><a:t>b</a:t></a:r><a:pPr/><a:r><a:t>c</a:t></a:r></a:p><a:p><a:r><a:t>d</a:t></a:r></a:p>`;
    expect(fixParagraphs(xml)).toBe(`<a:p><a:pPr marL="1"><a:buNone/></a:pPr><a:r><a:t>a</a:t></a:r><a:r><a:t>b</a:t></a:r><a:r><a:t>c</a:t></a:r></a:p><a:p><a:r><a:t>d</a:t></a:r></a:p>`);
  });

  it("genera un .pptx con una diapositiva por cada una, notas y XML válido para PowerPoint", async () => {
    const bytes = (await deckToPptx(parseDeck(DECK), "nodebuffer")) as Uint8Array;
    const zip = await JSZip.loadAsync(bytes);
    const slides = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
    expect(slides).toHaveLength(6);
    const two = await zip.file("ppt/slides/slide2.xml")!.async("string");
    expect(two).toContain("El problema");
    expect(two).toContain("8 por semana");
    for (const p of two.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? []) expect(p.match(/<a:pPr/g)?.length ?? 0).toBeLessThanOrEqual(1);
    const four = await zip.file("ppt/slides/slide4.xml")!.async("string");
    expect(four.match(/<a:buAutoNum[^>]*startAt="(\d+)"/g)).toEqual([`<a:buAutoNum type="arabicPeriod" startAt="1"`, `<a:buAutoNum type="arabicPeriod" startAt="2"`]);
    expect(four).toContain("<a:tbl>");
    const notes = Object.keys(zip.files).filter((n) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(n));
    expect((await Promise.all(notes.map((n) => zip.file(n)!.async("string")))).some((x) => x.includes("Abrir con la anécdota."))).toBe(true);
  }, 20000);
});
