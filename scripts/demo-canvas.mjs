// Conversación de muestra para ver el Canvas en el arnés (mobile-shots.mjs --demo=canvas):
// una respuesta por cada cosa que el Canvas sabe mostrar.
const F = "```";
const fence = (info, body) => `${F}${info}\n${body}\n${F}`;

const REACT = `import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";

const PANES = [
  { id: 1, nombre: "Pan de masa madre", precio: 12000 },
  { id: 2, nombre: "Croissant de mantequilla", precio: 6500 },
  { id: 3, nombre: "Baguette rústica", precio: 5000 },
];

export default function Pedido() {
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const cambiar = (id: number, delta: number) =>
    setCantidades((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + delta) }));
  const total = PANES.reduce((s, p) => s + p.precio * (cantidades[p.id] ?? 0), 0);

  return (
    <main className="min-h-screen bg-amber-50 p-6 text-stone-800">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><ShoppingBag className="h-6 w-6 text-amber-600" /> Panadería Trigo</h1>
        <ul className="mt-4 divide-y divide-stone-100">
          {PANES.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{p.nombre}</p>
                <p className="text-sm text-stone-500">$ {p.precio.toLocaleString("es-CO")}</p>
              </div>
              <div className="flex items-center gap-3">
                <button aria-label="Quitar" onClick={() => cambiar(p.id, -1)} className="rounded-full bg-stone-100 p-1"><Minus className="h-4 w-4" /></button>
                <span data-testid={"cant-" + p.id} className="w-4 text-center">{cantidades[p.id] ?? 0}</span>
                <button aria-label={"Agregar " + p.nombre} onClick={() => cambiar(p.id, 1)} className="rounded-full bg-amber-500 p-1 text-white"><Plus className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
        <p id="total" className="mt-4 text-right text-lg font-semibold">Total: $ {total.toLocaleString("es-CO")}</p>
      </div>
    </main>
  );
}`;

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="Logo de Panadería Trigo">
  <circle cx="120" cy="120" r="110" fill="#f59e0b"/>
  <path d="M120 50c-20 30-20 60 0 90 20-30 20-60 0-90z" fill="#fff7ed"/>
  <path d="M80 90c-8 28 4 54 40 70-4-34-16-58-40-70z" fill="#fde68a"/>
  <path d="M160 90c8 28-4 54-40 70 4-34 16-58 40-70z" fill="#fde68a"/>
  <text x="120" y="205" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="#78350f">Trigo</text>
</svg>`;

const MERMAID = `flowchart TD
  A[Visita en Instagram] --> B{¿Escribe por WhatsApp?}
  B -- Sí --> C[Asesor responde en 5 min]
  B -- No --> D[Anuncio de recordatorio]
  C --> E[Cotización]
  E --> F{¿Acepta?}
  F -- Sí --> G[Venta y encuesta]
  F -- No --> D`;

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Reservas Trigo</title>
<link rel="stylesheet" href="basalt.css">
<style>:root { --brand-h: 60; } form { max-width: 26rem; margin: 2rem auto; }</style>
</head>
<body>
<main class="container section">
  <h1>Reserva tu pedido</h1>
  <form id="reserva" class="card stack">
    <label for="nombre">Nombre</label>
    <input class="input" id="nombre" name="nombre" required value="Laura">
    <button class="btn" id="enviar">Reservar</button>
  </form>
  <p id="resultado" class="lead"></p>
</main>
<script>
  const previas = JSON.parse(localStorage.getItem("reservas") || "[]");
  document.getElementById("reserva").addEventListener("submit", (e) => {
    e.preventDefault();
    previas.push(e.target.nombre.value);
    localStorage.setItem("reservas", JSON.stringify(previas));
    document.getElementById("resultado").textContent = "Reserva confirmada para " + e.target.nombre.value + " (" + previas.length + " en total)";
  });
</script>
</body>
</html>`;

const VITE = [
  fence("json package.json", JSON.stringify({ name: "trigo", private: true, scripts: { dev: "vite" }, dependencies: { react: "^18.3.1", "react-dom": "^18.3.1", "react-router-dom": "^6.26.0" }, devDependencies: { vite: "^5.4.0", "@vitejs/plugin-react": "^4.3.0", typescript: "^5.5.0", tailwindcss: "^3.4.0", postcss: "^8.4.0", autoprefixer: "^10.4.0" } }, null, 2)),
  fence("html index.html", `<!DOCTYPE html>\n<html lang="es">\n<head><meta charset="utf-8"><title>Trigo — App</title></head>\n<body>\n<div id="root"></div>\n<script type="module" src="/src/main.tsx"></script>\n</body>\n</html>`),
  fence("tsx src/main.tsx", `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport { BrowserRouter } from "react-router-dom";\nimport App from "./App";\nimport "./index.css";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <BrowserRouter>\n      <App />\n    </BrowserRouter>\n  </React.StrictMode>,\n);`),
  fence("tsx src/App.tsx", `import { Link, Route, Routes } from "react-router-dom";\nimport Inicio from "./pages/Inicio";\nimport Menu from "./pages/Menu";\n\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-stone-50 text-stone-800">\n      <nav className="flex gap-4 bg-white p-4 shadow">\n        <Link to="/" className="font-semibold text-amber-700">Inicio</Link>\n        <Link to="/menu" id="ir-menu" className="font-semibold text-amber-700">Menú</Link>\n      </nav>\n      <Routes>\n        <Route path="/" element={<Inicio />} />\n        <Route path="/menu" element={<Menu />} />\n      </Routes>\n    </div>\n  );\n}`),
  fence("tsx src/pages/Inicio.tsx", `export default function Inicio() {\n  return <h1 className="titulo p-8 text-3xl font-bold">Pan recién horneado</h1>;\n}`),
  fence("tsx src/pages/Menu.tsx", `import { productos } from "../data/productos";\n\nexport default function Menu() {\n  return (\n    <ul className="p-8">\n      {productos.map((p) => <li key={p} className="py-1">{p}</li>)}\n    </ul>\n  );\n}`),
  fence("ts src/data/productos.ts", `export const productos: string[] = ["Masa madre", "Croissant", "Baguette"];`),
  fence("css src/index.css", `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n.titulo { @apply text-amber-700; }`),
].join("\n\n");

const PLAN = `# Plan de mercadeo — Panadería Trigo

## Diagnóstico

Trigo vende bien entre semana a vecinos del barrio, pero casi no tiene pedidos por encargo ni presencia en redes. La competencia directa son dos panaderías de cadena a menos de 500 metros.

## Objetivos (90 días)

1. Subir los pedidos por encargo de 8 a 30 por semana.
2. Llegar a 2.000 seguidores locales en Instagram.
3. Lograr 40 reseñas en Google con promedio de 4,7 o más.

## Parrilla de la primera semana

| Día | Red | Formato | Tema | CTA |
|---|---|---|---|---|
| Lunes | Instagram | Reel | El horno a las 4 a. m. | Pide por WhatsApp |
| Miércoles | Facebook | Foto | Combo desayuno | Reserva el tuyo |
| Viernes | Instagram | Historia | Encuesta: ¿dulce o salado? | Vota |

## Presupuesto

- Pauta en Meta: $ 300.000 al mes
- Fotografía de producto: $ 250.000 (una vez)

> Siguiente paso: definir quién responde WhatsApp en menos de cinco minutos.`;

export const DEMO_CANVAS_MESSAGES = [
  { id: "u1", role: "user", text: "Hazme un componente de pedidos, un logo, el flujo de ventas, una página de reservas y la app." },
  { id: "m1", role: "model", text: `Aquí está el componente de pedidos:\n\n${fence("tsx", REACT)}\n\nEl logo en SVG:\n\n${fence("svg", SVG)}\n\nY el flujo de ventas:\n\n${fence("mermaid", MERMAID)}` },
  { id: "u2", role: "user", text: "Ahora la página de reservas." },
  { id: "m2", role: "model", text: `Lista, funciona en el navegador:\n\n${fence("html", HTML)}` },
  { id: "u3", role: "user", text: "Y la app completa con rutas." },
  { id: "m3", role: "model", text: `Proyecto Vite con dos pantallas:\n\n${VITE}` },
  { id: "u4", role: "user", text: "Escribe el plan de mercadeo." },
  { id: "m4", role: "model", text: PLAN },
];
