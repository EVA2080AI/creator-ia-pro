import { describe, expect, it } from "vitest";
import { findViteProblems } from "./vite-check";
import type { ProjectFile } from "./project-preview";

const f = (name: string, code: string): ProjectFile => ({ name, lang: name.split(".").pop() ?? "", code });

const pkg = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    scripts: { dev: "vite", build: "tsc && vite build" },
    dependencies: { react: "^18", "react-dom": "^18" },
    devDependencies: { vite: "^5", tailwindcss: "^3", postcss: "^8", autoprefixer: "^10" },
    ...extra,
  });

const base = [
  f("package.json", pkg()),
  f("index.html", '<div id="root"></div><script type="module" src="/src/main.tsx"></script>'),
  f("src/main.tsx", "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';"),
  f("src/App.tsx", "import { useState } from 'react';\nexport default function App() { return null }"),
  f("src/index.css", "@tailwind base;\n@tailwind components;\n@tailwind utilities;"),
  f("tailwind.config.js", "export default { content: ['./src/**/*.tsx'] }"),
  f("postcss.config.js", "export default { plugins: { tailwindcss: {}, autoprefixer: {} } }"),
  f("tsconfig.json", "{}"),
];

describe("findViteProblems", () => {
  it("un proyecto completo no tiene problemas", () => {
    expect(findViteProblems(base)).toEqual([]);
  });

  it("sin package.json no opina (todavía no es un proyecto Vite)", () => {
    expect(findViteProblems(base.slice(1))).toEqual([]);
  });

  it("detecta Tailwind v3 sin sus archivos de configuración y el build con tsc sin tsconfig", () => {
    const partial = base.filter((x) => !/^(tailwind|postcss|tsconfig)/.test(x.name));
    const p = findViteProblems(partial);
    expect(p.some((x) => x.includes("tailwind.config.js"))).toBe(true);
    expect(p.some((x) => x.includes("postcss.config.js"))).toBe(true);
    expect(p.some((x) => x.includes("tsconfig.json"))).toBe(true);
  });

  it("con el plugin @tailwindcss/vite no exige tailwind.config ni postcss.config", () => {
    const v4 = [
      f("package.json", pkg({ devDependencies: { vite: "^5", tailwindcss: "^4", "@tailwindcss/vite": "^4" } })),
      ...base.slice(1).filter((x) => !/^(tailwind|postcss)/.test(x.name)),
    ];
    expect(findViteProblems(v4)).toEqual([]);
  });

  it("avisa de paquetes importados que no están en package.json (incluye scoped y subrutas)", () => {
    const withImports = base.map((x) =>
      x.name === "src/App.tsx" ? f(x.name, "import { v4 } from 'uuid';\nimport { Link } from 'react-router-dom';\nimport x from '@headlessui/react/x';\nimport y from './y';\nimport z from '@/z';") : x,
    );
    const p = findViteProblems(withImports).find((x) => x.includes("paquetes"));
    expect(p).toMatch(/uuid/);
    expect(p).toMatch(/react-router-dom/);
    expect(p).toMatch(/@headlessui\/react/);
    expect(p).not.toMatch(/\.\/y|@\/z/);
  });

  it("avisa si el HTML arranca un módulo que no llegó y si package.json está cortado", () => {
    expect(findViteProblems(base.filter((x) => x.name !== "src/main.tsx")).some((x) => x.includes("src/main.tsx"))).toBe(true);
    expect(findViteProblems([f("package.json", '{"name":"x","scripts":{'), ...base.slice(1)])[0]).toMatch(/incompleto/);
  });
});
