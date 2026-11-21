import { describe, expect, it } from "vitest";
import { docArtifact, docTitle, extractArtifacts, isDocLike, isReactProject, looksLikeComponent, projectKind } from "./canvas";
import { mdToHtml } from "./markdown";

const FENCE = "```";
const fence = (info: string, body: string) => `${FENCE}${info}\n${body}\n${FENCE}`;
const f = (name: string, code = "") => ({ name, lang: name.split(".").pop() ?? "", code });

describe("extractArtifacts", () => {
  it("sin bloques de código no hay nada que abrir", () => {
    expect(extractArtifacts("Claro, cuéntame más de tu negocio.")).toEqual([]);
  });

  it("un html suelto es una página; lleva basalt.css si la enlaza", () => {
    const [a] = extractArtifacts(fence("html", '<!DOCTYPE html><html><head><title>Trigo</title><link rel="stylesheet" href="basalt.css"></head><body><h1>Pan</h1></body></html>'));
    expect(a.kind).toBe("web");
    expect(a.title).toBe("Trigo");
    expect(a.files.map((x) => x.name)).toEqual(["index.html", "basalt.css"]);
  });

  it("html + css + js sin nombre son UN artefacto", () => {
    const arts = extractArtifacts([fence("html", "<h1>x</h1>"), fence("css", "h1{}"), fence("js", "let a")].join("\n\n"));
    expect(arts).toHaveLength(1);
    expect(arts[0].files.map((x) => x.name)).toEqual(["index.html", "styles.css", "script.js"]);
  });

  it("un proyecto Vite con React es de tipo react; con Next es solo código", () => {
    const vite = [fence("json package.json", '{"dependencies":{"react":"^18"}}'), fence("tsx src/main.tsx", "x"), fence("tsx src/App.tsx", "y")].join("\n\n");
    const next = [fence("json package.json", '{"dependencies":{"next":"15","react":"19"}}'), fence("tsx app/page.tsx", "y")].join("\n\n");
    expect(extractArtifacts(vite)[0].kind).toBe("react");
    expect(extractArtifacts(vite)[0].title).toBe("App React");
    expect(extractArtifacts(next)[0].kind).toBe("code");
  });

  it("componente, svg y diagrama sueltos: cada uno es su artefacto, en orden", () => {
    const md = [
      "Te dejo tres cosas:",
      fence("jsx", "export default function Hola() { return <h1>Hola</h1>; }"),
      fence("svg", '<svg viewBox="0 0 1 1"><rect width="1" height="1"/></svg>'),
      fence("mermaid", "graph LR\n A --> B"),
      fence("bash", "npm run dev"),
    ].join("\n\n");
    const arts = extractArtifacts(md);
    expect(arts.map((a) => a.kind)).toEqual(["react", "svg", "mermaid"]);
    expect(arts.map((a) => a.files[0].name)).toEqual(["App.jsx", "imagen.svg", "diagrama.mmd"]);
  });

  it("un bloque javascript que importa React y devuelve JSX también es un componente", () => {
    const code = `import { useState } from "react";\nexport default function Contador() { const [n] = useState(0); return <button>{n}</button>; }`;
    expect(extractArtifacts(fence("javascript", code))[0].kind).toBe("react");
    expect(extractArtifacts(fence("javascript", "const total = precios.reduce((a, b) => a + b, 0);"))).toEqual([]);
  });

  it("un xml que no empieza por <svg> no es una imagen", () => {
    expect(extractArtifacts(fence("xml", '<?xml version="1.0"?><svg viewBox="0 0 1 1"></svg>'))[0].kind).toBe("svg");
    expect(extractArtifacts(fence("xml", "<sitemap><url>x</url></sitemap>"))).toEqual([]);
  });

  it("un artefacto a medio escribir (sin cerrar la valla) ya cuenta: el Canvas lo muestra mientras llega", () => {
    const arts = extractArtifacts("Va la página:\n\n```html\n<!DOCTYPE html>\n<html><head>");
    expect(arts).toHaveLength(1);
    expect(arts[0].kind).toBe("web");
  });

  it("el artefacto N es la tarjeta N del chat (mismo plan que mdToHtml)", () => {
    const md = [
      fence("html", "<h1>a</h1><p>b</p>"),
      fence("python", "print(1)"),
      fence("tsx", "export default function A() { return <i>x</i>; }"),
      fence("html", "<h2>c</h2><p>d</p>"),
    ].join("\n\ntexto\n\n");
    const host = document.createElement("div");
    host.innerHTML = mdToHtml(md);
    const cards = [...host.querySelectorAll<HTMLElement>(".md-project")];
    const arts = extractArtifacts(md);
    expect(cards).toHaveLength(arts.length);
    cards.forEach((card, i) => {
      expect(card.dataset.canvas).toBe(String(i));
      expect(card.dataset.kind).toBe(arts[i].kind);
      expect(card.querySelector(".md-proj-pane[data-file] code")?.textContent).toBe(arts[i].files[0].code);
    });
  });
});

describe("tipos de proyecto", () => {
  it("looksLikeComponent pide JSX y una declaración de componente", () => {
    expect(looksLikeComponent("export default function A() { return <div/>; }")).toBe(true);
    expect(looksLikeComponent("const Tarjeta = () => <article>hola</article>;")).toBe(true);
    expect(looksLikeComponent("export type Props = { a: Array<string> };")).toBe(false);
    expect(looksLikeComponent("function suma(a, b) { return a + b; }")).toBe(false);
  });

  it("isReactProject descarta los frameworks con servidor", () => {
    expect(isReactProject([f("package.json", '{"dependencies":{"react":"18"}}'), f("src/App.jsx")])).toBe(true);
    expect(isReactProject([f("package.json", '{"dependencies":{"vue":"3"}}'), f("src/App.vue")])).toBe(false);
    expect(isReactProject([f("package.json", '{"dependencies":{"astro":"4","react":"18"}}'), f("src/X.tsx")])).toBe(false);
    expect(isReactProject([f("main.py"), f("requirements.txt")])).toBe(false);
  });

  it("projectKind: una web estática gana aunque traiga archivos sueltos", () => {
    expect(projectKind([f("index.html", "<h1>x</h1>"), f("styles.css")])).toBe("web");
    expect(projectKind([f("main.py"), f("util.py")])).toBe("code");
  });
});

describe("la respuesta como documento", () => {
  const plan = "# Plan de mercadeo para Trigo\n\n" + "Diagnóstico de la marca y del mercado local. ".repeat(12) + "\n\n## Objetivos\n\n- Subir ventas\n- Más seguidores";

  it("un plan con títulos se puede leer como documento; una respuesta corta no", () => {
    expect(isDocLike(plan)).toBe(true);
    expect(isDocLike("Claro, ¿de qué negocio hablamos?")).toBe(false);
    expect(isDocLike("palabra ".repeat(100))).toBe(false);
  });

  it("el título sale del primer encabezado, sin marcas de markdown, y da nombre al archivo", () => {
    expect(docTitle(plan)).toBe("Plan de mercadeo para Trigo");
    expect(docTitle("**Hola** [mundo](https://x.co) y más")).toBe("Hola mundo y más");
    expect(docTitle("")).toBe("Documento");
    const a = docArtifact(plan);
    expect(a.kind).toBe("doc");
    expect(a.files[0].name).toBe("plan-de-mercadeo-para-trigo.md");
    expect(a.files[0].code).toBe(plan);
  });
});
