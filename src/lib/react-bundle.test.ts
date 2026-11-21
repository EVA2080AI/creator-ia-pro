import { describe, expect, it } from "vitest";
import { transform } from "sucrase";
import { bundleReact, resolveLocal, ESM_CDN } from "./react-bundle";
import type { ProjectFile } from "./project-preview";

const f = (name: string, code: string): ProjectFile => ({ name, lang: name.split(".").pop() ?? "", code });

/** El import map que quedó dentro del documento. */
function importMap(html: string): Record<string, string> {
  const raw = /<script type="importmap">([\s\S]*?)<\/script>/.exec(html)?.[1];
  return (JSON.parse(raw ?? "{}") as { imports: Record<string, string> }).imports;
}
const moduleCode = (url: string) => decodeURIComponent(url.replace(/^data:text\/javascript;charset=utf-8,/, ""));

const APP = `import { useState } from "react";
import { Heart } from "lucide-react";
import Boton from "./components/Boton";
import "./index.css";

export default function App() {
  const [n, setN] = useState<number>(0);
  return <main className="p-6"><Boton onClick={() => setN(n + 1)}>Sumar {n}</Boton><Heart /></main>;
}`;

const VITE: ProjectFile[] = [
  f("package.json", JSON.stringify({ dependencies: { react: "^18.2.0", "react-dom": "^18.2.0", "lucide-react": "^0.400.0" }, devDependencies: { tailwindcss: "^3.4.0", vite: "^5.0.0" } })),
  f("index.html", `<!DOCTYPE html><html><head><title>Panadería Trigo</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"></head><body class="bg-stone-50"><div id="app"></div><script type="module" src="/src/main.tsx"></script></body></html>`),
  f("vite.config.ts", `import { defineConfig } from "vite"; export default defineConfig({ plugins: [ `),
  f("src/main.tsx", `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\nimport "./index.css";\nReactDOM.createRoot(document.getElementById("app")!).render(<App />);`),
  f("src/App.tsx", APP),
  f("src/components/Boton.tsx", `import type { ReactNode } from "react";\nexport default function Boton({ children, onClick }: { children: ReactNode; onClick: () => void }) { return <button onClick={onClick}>{children}</button>; }`),
  f("src/index.css", `@tailwind base;\n@tailwind components;\n@tailwind utilities;\nbody { margin: 0 }`),
];

describe("resolveLocal", () => {
  const has = (p: string) => ["src/App.tsx", "src/lib/util.ts", "src/components/index.ts", "src/data.json"].includes(p);
  it("resuelve sin extensión, con alias @/ y carpetas con index", () => {
    expect(resolveLocal("./App", "src/main.tsx", has)).toBe("src/App.tsx");
    expect(resolveLocal("@/lib/util", "src/pages/Home.tsx", has)).toBe("src/lib/util.ts");
    expect(resolveLocal("../components", "src/pages/Home.tsx", has)).toBe("src/components/index.ts");
    expect(resolveLocal("/src/App.tsx", "index.html", has)).toBe("src/App.tsx");
    expect(resolveLocal("./data.json", "src/App.tsx", has)).toBe("src/data.json");
  });
  it("un import TypeScript escrito con .js llega al .ts", () => {
    expect(resolveLocal("./lib/util.js", "src/App.tsx", has)).toBe("src/lib/util.ts");
  });
  it("lo que no existe devuelve null", () => {
    expect(resolveLocal("./Nada", "src/App.tsx", has)).toBeNull();
  });
});

describe("bundleReact: proyecto Vite", () => {
  const b = bundleReact(VITE, transform);
  const map = importMap(b.html);

  it("arranca desde el módulo que enlaza index.html", () => {
    expect(b.entry).toBe("src/main.tsx");
    expect(b.html).toContain(`await import("basalt-local/src/main.tsx")`);
  });

  it("solo viajan los archivos que la app importa (vite.config está roto y no importa)", () => {
    expect(Object.keys(map).filter((k) => k.startsWith("basalt-local/src/"))).toEqual(
      expect.arrayContaining(["basalt-local/src/main.tsx", "basalt-local/src/App.tsx", "basalt-local/src/components/Boton.tsx"]),
    );
    expect(map["basalt-local/vite.config.ts"]).toBeUndefined();
    expect(b.html).not.toContain("Error de sintaxis");
  });

  it("los imports locales se reescriben y el código ya no tiene JSX ni tipos", () => {
    const app = moduleCode(map["basalt-local/src/App.tsx"]);
    expect(app).toContain(`from "basalt-local/src/components/Boton.tsx"`);
    expect(app).toContain(`from "react/jsx-runtime"`);
    expect(app).not.toContain("<main");
    expect(app).not.toContain("useState<number>");
    expect(app).not.toContain("index.css");
  });

  it("React queda fijo en la versión del package.json y los paquetes salen de esm.sh sin duplicarlo", () => {
    expect(map.react).toBe(`${ESM_CDN}/react@18.2.0`);
    expect(map["react-dom/"]).toBe(`${ESM_CDN}/react-dom@18.2.0/`);
    expect(map["lucide-react"]).toBe(`${ESM_CDN}/lucide-react@0.400.0?external=react,react-dom`);
    expect(b.externals).toContain("lucide-react");
  });

  it("el CSS entra como estilo de Tailwind y se carga su CDN", () => {
    expect(b.html).toContain(`<style type="text/tailwindcss" data-file="src/index.css">`);
    expect(b.html).toContain(`<script src="https://cdn.tailwindcss.com"></script>`);
    expect((b.html.match(/data-file="src\/index.css"/g) ?? [])).toHaveLength(1);
  });

  it("respeta lo que traía el index.html: título, fuentes, clase del body y el id de la raíz", () => {
    expect(b.html).toContain("<title>Panadería Trigo</title>");
    expect(b.html).toContain("fonts.googleapis.com");
    expect(b.html).toContain(`<body class="bg-stone-50">`);
    expect(b.html).toContain(`<div id="app"></div>`);
  });
});

describe("bundleReact: un componente suelto", () => {
  it("lo monta él mismo, con límite de errores", () => {
    const b = bundleReact([f("App.tsx", `export default function App() { return <h1 className="text-2xl">Hola</h1>; }`)], transform);
    expect(b.entry).toBe("App.tsx");
    expect(b.html).toContain(`import("basalt-local/App.tsx")`);
    expect(b.html).toContain("createRoot");
    expect(b.html).toContain(`getElementById("root")`);
    expect(importMap(b.html).react).toBe(`${ESM_CDN}/react@18.3.1`);
  });

  it("sin export default, exporta el componente raíz (el que nadie más dibuja)", () => {
    const code = `const COLORES = ["rojo"];\nfunction Panel() { return <section><Tarjeta /></section>; }\nfunction Tarjeta() { return <p>{COLORES[0]}</p>; }`;
    const map = importMap(bundleReact([f("Panel.jsx", code)], transform).html);
    expect(moduleCode(map["basalt-local/Panel.jsx"])).toContain("export default Panel;");
  });

  it("si el archivo ya se monta solo (createRoot), solo se importa", () => {
    const code = `import { createRoot } from "react-dom/client";\nfunction App() { return <p>hola</p>; }\ncreateRoot(document.getElementById("root")).render(<App />);`;
    const b = bundleReact([f("App.jsx", code)], transform);
    expect(b.html).toContain(`await import("basalt-local/App.jsx")`);
    expect(b.html).not.toContain("Limite");
  });

  it("detecta Tailwind por las clases aunque no haya configuración", () => {
    const con = bundleReact([f("App.tsx", `export default () => <div className="flex items-center gap-4 p-6">x</div>;`)], transform);
    const sin = bundleReact([f("App.tsx", `export default () => <div className="caja">x</div>;`)], transform);
    expect(con.html).toContain(`<script src="https://cdn.tailwindcss.com"></script>`);
    expect(sin.html).not.toContain(`<script src="https://cdn.tailwindcss.com"></script>`);
  });
});

describe("bundleReact: lo que sale mal", () => {
  it("un error de sintaxis se muestra con el nombre del archivo en vez de lanzar", () => {
    const b = bundleReact([f("App.tsx", `export default function App() { return <div>; }`)], transform);
    expect(b.html).toContain("Error de sintaxis en App.tsx");
    expect(b.html).toContain("console.error");
  });

  it("un archivo que no llegó se reemplaza por un sustituto con los nombres pedidos, y se avisa", () => {
    const code = `import Menu, { Item, Grupo as G } from "./Menu";\nimport logo from "./logo.png";\nexport default function App() { return <Menu><Item /><G /><img src={logo} /></Menu>; }`;
    const b = bundleReact([f("src/App.tsx", code)], transform);
    const map = importMap(b.html);
    const stub = moduleCode(map["basalt-local/__falta/src/Menu"]);
    expect(stub).toContain("export default Falta;");
    expect(stub).toContain("export const Item = Falta;");
    expect(stub).toContain("export const Grupo = Falta;");
    expect(moduleCode(map["basalt-local/__falta/src/logo.png"])).toContain("data:image/svg+xml");
    expect(b.warnings).toEqual(["src/App.tsx importa ./Menu, que no llegó (¿respuesta cortada?)"]);
    expect(b.html).toContain("console.warn");
  });

  it("sin ningún componente lo dice", () => {
    const b = bundleReact([f("package.json", "{}"), f("README.md", "# hola")], transform);
    expect(b.entry).toBeNull();
    expect(b.html).toContain("No encontré qué mostrar");
  });
});

describe("bundleReact: paquetes y casos del navegador", () => {
  it("react-router usa el enrutador en memoria (pushState falla dentro del iframe aislado)", () => {
    const code = `import { BrowserRouter, Routes, Route } from "react-router-dom";\nexport default function App() { return <BrowserRouter><Routes><Route path="/" element={<p>Inicio</p>} /></Routes></BrowserRouter>; }`;
    const map = importMap(bundleReact([f("App.tsx", code)], transform).html);
    const shim = moduleCode(map["react-router-dom"]);
    expect(shim).toContain(`export * from "${ESM_CDN}/react-router-dom?external=react,react-dom"`);
    expect(shim).toContain("export const BrowserRouter = MemoryRouter;");
  });

  it("el CSS de un paquete se enlaza en vez de importarse como módulo", () => {
    const code = `import "leaflet/dist/leaflet.css";\nimport L from "leaflet";\nexport default function App() { return <div>{String(!!L)}</div>; }`;
    const b = bundleReact([f("App.tsx", code)], transform);
    expect(b.html).toContain(`<link rel="stylesheet" href="${ESM_CDN}/leaflet/dist/leaflet.css">`);
    expect(moduleCode(importMap(b.html)["basalt-local/App.tsx"])).not.toContain("leaflet.css");
  });

  it("los módulos CSS devuelven el nombre de la clase y el JSON entra como objeto", () => {
    const b = bundleReact([
      f("App.tsx", `import s from "./App.module.css";\nimport datos from "./datos.json";\nexport default function App() { return <p className={s.titulo}>{datos.nombre}</p>; }`),
      f("App.module.css", `.titulo { color: red }`),
      f("datos.json", `{"nombre":"Trigo"}`),
    ], transform);
    const map = importMap(b.html);
    expect(moduleCode(map["basalt-local/App.tsx"])).toContain(`from "basalt-local/__estilos"`);
    expect(moduleCode(map["basalt-local/datos.json"])).toContain(`export default {"nombre":"Trigo"};`);
    expect(b.html).toContain(".titulo { color: red }");
  });

  it("ningún </script> del código cierra el documento antes de tiempo", () => {
    const code = `export default function App() { return <p>{"</script><script>alert(1)</script>"}</p>; }`;
    const b = bundleReact([f("App.tsx", code)], transform);
    expect(b.html.match(/<\/script>/g)?.length).toBe(b.html.match(/<script\b/g)?.length);
    expect(b.html).not.toContain("<script>alert(1)");
  });
});
