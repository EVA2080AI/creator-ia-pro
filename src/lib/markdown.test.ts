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
    const host = render(`Acá va:\n\n${fence("html", "<h1>Hola</h1>")}\n\nListo.`);
    expect(host.querySelectorAll(".md-project")).toHaveLength(1);
    const iframe = host.querySelector("iframe.md-preview-frame")!;
    expect(iframe.getAttribute("sandbox")).toBe("allow-scripts");
    expect(iframe.hasAttribute("srcdoc")).toBe(false);
    expect(host.querySelector('[data-tab="preview"]')).not.toBeNull();
    expect(host.querySelector('.md-proj-pane[data-file="index.html"] code')?.textContent).toBe("<h1>Hola</h1>");
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
    const host = render([fence("html", "<p>uno</p>"), fence("html", "<p>dos</p>")].join("\n\n"));
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
    const host = render(fence("html", "<script>alert(1)</script>"));
    expect(host.querySelector(".md-project script")).toBeNull();
    expect(host.querySelector(".md-proj-pane code")?.textContent).toBe("<script>alert(1)</script>");
  });

  it("un HTML que enlaza basalt.css muestra basalt.css como pestaña del proyecto", () => {
    const host = render(fence("html", '<html><head><link rel="stylesheet" href="basalt.css"></head><body>x</body></html>'));
    const names = [...host.querySelectorAll(".md-proj-pane[data-file]")].map((p) => p.getAttribute("data-file"));
    expect(names).toEqual(["index.html", "basalt.css"]);
  });
});
