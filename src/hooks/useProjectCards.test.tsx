import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { useRef } from "react";
import { mdToHtml } from "@/lib/markdown";
import { useProjectCards } from "./useProjectCards";

const fence = (info: string, body: string) => "```" + info + "\n" + body + "\n```";

function Host({ md }: { md: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useProjectCards(ref);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: mdToHtml(md) }} />;
}

const pkg = JSON.stringify({ scripts: { build: "tsc && vite build" }, dependencies: { react: "^18" }, devDependencies: { vite: "^5", tailwindcss: "^3", postcss: "^8", autoprefixer: "^10" } });
const project = (extra: string[] = []) =>
  [
    fence("json package.json", pkg),
    fence("html index.html", '<div id="root"></div><script type="module" src="/src/main.tsx"></script>'),
    fence("tsx src/main.tsx", "import React from 'react';"),
    fence("css src/index.css", "@tailwind base;"),
    ...extra,
  ].join("\n\n");

describe("useProjectCards — aviso de faltantes en proyectos Vite", () => {
  it("lista lo que falta cuando el modelo ya terminó", () => {
    const { container } = render(<Host md={project()} />);
    const box = container.querySelector<HTMLElement>(".md-proj-problems")!;
    expect(box.hidden).toBe(false);
    expect(box.textContent).toMatch(/tailwind\.config\.js/);
    expect(box.textContent).toMatch(/postcss\.config\.js/);
    expect(box.textContent).toMatch(/tsconfig\.json/);
  });

  it("no muestra nada mientras el chat sigue generando (botón de detener presente)", () => {
    const stop = document.createElement("button");
    stop.className = "asst-send stop";
    document.body.appendChild(stop);
    const { container } = render(<Host md={project()} />);
    expect(container.querySelector<HTMLElement>(".md-proj-problems")!.hidden).toBe(true);
    stop.remove();
  });

  it("con todos los archivos el aviso queda oculto", () => {
    const { container } = render(
      <Host md={project([fence("js tailwind.config.js", "export default {}"), fence("js postcss.config.js", "export default {}"), fence("json tsconfig.json", "{}")])} />,
    );
    expect(container.querySelector<HTMLElement>(".md-proj-problems")!.hidden).toBe(true);
  });
});

describe("useProjectCards — Subir a GitHub", () => {
  it("el botón junta los archivos del DOM y dispara el evento del diálogo", () => {
    const { container } = render(
      <Host md={[fence("html index.html", "<title>Mi tienda</title><h1>hola</h1>"), fence("css styles.css", "h1{color:red}")].join("\n\n")} />,
    );
    const btn = container.querySelector<HTMLButtonElement>('[data-act="github"]')!;
    expect(btn).toBeTruthy();
    let detalle: { titulo: string; archivos: { path: string; content: string }[] } | null = null;
    const onEvt = (e: Event) => { detalle = (e as CustomEvent<typeof detalle>).detail; };
    window.addEventListener("basalt:github-export", onEvt);
    btn.click();
    window.removeEventListener("basalt:github-export", onEvt);
    expect(detalle).not.toBeNull();
    expect(detalle!.titulo).toBe("Mi tienda");
    const paths = detalle!.archivos.map((a) => a.path);
    expect(paths).toContain("index.html");
    expect(paths).toContain("styles.css");
    const css = detalle!.archivos.find((a) => a.path === "styles.css")!;
    expect(css.content).toBe("h1{color:red}");
  });
});
