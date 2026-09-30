import { describe, expect, it } from "vitest";
import { mdToHtml } from "./markdown";

const FENCE = "```";
const fence = (info: string, body: string) => `${FENCE}${info}\n${body}\n${FENCE}`;

function render(md: string) {
  const host = document.createElement("div");
  host.innerHTML = mdToHtml(md);
  return host;
}

describe("mdToHtml — tarjetas de proyecto", () => {
  it("un ```html suelto se vuelve una tarjeta con pestaña de vista previa e iframe sin srcdoc", () => {
    const host = render(`Acá va:\n\n${fence("html", "<h1>Hola</h1><p>mundo</p>")}\n\nListo.`);
    expect(host.querySelectorAll(".md-project")).toHaveLength(1);
    const iframe = host.querySelector("iframe.md-preview-frame")!;
    expect(iframe.getAttribute("sandbox")).toBe("allow-scripts");
    expect(iframe.hasAttribute("srcdoc")).toBe(false);
    expect(host.querySelector('[data-tab="preview"]')).not.toBeNull();
    expect(host.querySelector('.md-proj-pane[data-file="index.html"] code')?.textContent).toBe("<h1>Hola</h1><p>mundo</p>");
  });

  it("html + css + js sin nombres forman UN proyecto y los otros bloques desaparecen", () => {
    const host = render([fence("html", "<h1>x</h1>"), "texto entre medio", fence("css", "h1{color:red}"), fence("js", "let a = 1")].join("\n\n"));
    expect(host.querySelectorAll(".md-project")).toHaveLength(1);
    expect(host.querySelectorAll(".md-codeblock")).toHaveLength(0);
    const names = [...host.querySelectorAll(".md-proj-pane[data-file]")].map((p) => p.getAttribute("data-file"));
    expect(names).toEqual(["index.html", "styles.css", "script.js"]);
    expect(host.textContent).toContain("texto entre medio");
  });

  it("lee los nombres de la valla y del comentario, y saca esa línea del código", () => {
    const host = render(
      [fence("json package.json", '{"name":"x"}'), fence("tsx", "// src/App.tsx\nexport default function App() {}")].join("\n\n"),
    );
    const panes = [...host.querySelectorAll(".md-proj-pane[data-file]")];
    expect(panes.map((p) => p.getAttribute("data-file"))).toEqual(["package.json", "src/App.tsx"]);
    expect(panes[0].querySelector("code")?.textContent).toBe('{"name":"x"}');
    expect(panes[1].querySelector("code")?.textContent).toBe("export default function App() {}");
    // sin HTML no hay pestaña de vista previa, pero sí ZIP y StackBlitz (hay package.json)
    expect(host.querySelector('[data-tab="preview"]')).toBeNull();
    expect(host.querySelector('[data-act="zip"]')).not.toBeNull();
    expect(host.querySelector('[data-act="stackblitz"]')).not.toBeNull();
  });

  it("dos ```html sin css/js NO se fusionan: cada uno es su propia tarjeta", () => {
    const host = render([fence("html", "<h1>uno</h1><p>a</p>"), fence("html", "<h1>dos</h1><p>b</p>")].join("\n\n"));
    expect(host.querySelectorAll(".md-project")).toHaveLength(2);
  });

  it("bloques de otros lenguajes siguen siendo bloques de código normales", () => {
    const host = render(fence("python", "print(1)"));
    expect(host.querySelectorAll(".md-project")).toHaveLength(0);
    expect(host.querySelector(".md-codeblock code")?.textContent).toBe("print(1)");
  });

  it("un bash suelto junto a un proyecto queda como bloque normal", () => {
    const host = render([fence("html", "<p>x</p>"), fence("css", "p{}"), fence("bash", "npm run dev")].join("\n\n"));
    expect(host.querySelectorAll(".md-project")).toHaveLength(1);
    expect(host.querySelector(".md-codeblock code")?.textContent).toBe("npm run dev");
  });

  it("escapa el código y los nombres (nada de HTML vivo dentro de la tarjeta)", () => {
    const host = render(fence("html", "<p>hi</p><script>alert(1)</script>"));
    expect(host.querySelector(".md-project script")).toBeNull();
    expect(host.querySelector(".md-proj-pane code")?.textContent).toBe("<p>hi</p><script>alert(1)</script>");
  });

  it("un HTML que enlaza basalt.css muestra basalt.css como pestaña del proyecto", () => {
    const host = render(fence("html", '<html><head><link rel="stylesheet" href="basalt.css"></head><body>x</body></html>'));
    const names = [...host.querySelectorAll(".md-proj-pane[data-file]")].map((p) => p.getAttribute("data-file"));
    expect(names).toEqual(["index.html", "basalt.css"]);
    const bar = host.querySelector('.md-proj-pane[data-file="basalt.css"] .md-proj-filebar')?.textContent ?? "";
    expect(bar).toMatch(/gu.rdala junto a tu HTML/);
    expect(host.querySelector('.md-proj-pane[data-file="index.html"] .md-proj-filebar')?.textContent).not.toMatch(/gu.rdala/);
  });

  it("las pestañas son accesibles: role=tab con aria-selected, paneles con role=tabpanel", () => {
    const host = render([fence("html", "<p>x</p>"), fence("css", "p{}")].join("\n\n"));
    const tabs = [...host.querySelectorAll('[role="tab"]')];
    expect(tabs.map((t) => t.getAttribute("aria-selected"))).toEqual(["true", "false", "false"]);
    expect(host.querySelectorAll('[role="tabpanel"]')).toHaveLength(3);
    expect(host.querySelector('[data-device="desktop"]')!.getAttribute("aria-pressed")).toBe("true");
  });
  it("el código en línea se escapa una sola vez (no muestra &lt; ni &#39; literales)", () => {
    const host = render("Cambia `<style>` y `url('x.jpg')` en el CSS, o `<script>alert(1)</script>`.");
    const codes = [...host.querySelectorAll("p code")].map((c) => c.textContent);
    expect(codes).toEqual(["<style>", "url('x.jpg')", "<script>alert(1)</script>"]);
    expect(host.querySelector("p script")).toBeNull();
  });
  it("un fragmento html de una sola etiqueta (ilustración) queda como bloque de código, sin iframe", () => {
    const host = render(`Cambia la foto:\n\n${fence("html", '<img src="ruta/tu-imagen.jpg" alt="Espresso">')}`);
    expect(host.querySelector(".md-project")).toBeNull();
    expect(host.querySelector(".md-codeblock code")?.textContent).toBe('<img src="ruta/tu-imagen.jpg" alt="Espresso">');
  });

  it("un html con nombre de archivo siempre es proyecto, aunque sea corto", () => {
    const host = render(fence("html index.html", "<p>x</p>"));
    expect(host.querySelectorAll(".md-project")).toHaveLength(1);
  });
});

describe("mdToHtml — listas", () => {
  it("las viñetas con sangría cuelgan de su ítem numerado y la numeración sigue", () => {
    const host = render("1. **A**:\n   * uno\n   * dos\n2. **B**:\n   * tres");
    const ols = host.querySelectorAll("ol");
    expect(ols).toHaveLength(1);
    const items = ols[0].querySelectorAll(":scope > li");
    expect(items).toHaveLength(2);
    expect(items[0].querySelectorAll(":scope > ul > li")).toHaveLength(2);
    expect(items[1].querySelectorAll(":scope > ul > li")).toHaveLength(1);
  });

  it("una línea en blanco entre el ítem y sus viñetas no parte la lista", () => {
    const host = render("1. A\n\n   * x\n\n2. B\n\n   * y");
    expect(host.querySelectorAll("ol")).toHaveLength(1);
    expect(host.querySelectorAll("ol > li")).toHaveLength(2);
    expect(host.querySelectorAll("ol > li > ul > li")).toHaveLength(2);
  });

  it("una lista que arranca en 3 conserva el número; dos listas separadas por un párrafo son dos listas", () => {
    expect(render("3. c\n4. d").querySelector("ol")?.getAttribute("start")).toBe("3");
    const host = render("- a\n- b\n\nTexto suelto\n\n- c");
    expect(host.querySelectorAll("ul")).toHaveLength(2);
    expect(host.querySelectorAll("p")).toHaveLength(1);
  });

  it("una viñeta sin sangría después de una numerada abre otra lista", () => {
    const host = render("1. uno\n2. dos\n- viñeta");
    expect(host.querySelectorAll("ol")).toHaveLength(1);
    expect(host.querySelectorAll("ul")).toHaveLength(1);
  });
});
