// Capturas de pantalla en un móvil REAL (Chromium con métricas y táctil de iPhone/Pixel) de las pantallas
// que exigen sesión, con la API simulada — así se ve el responsive sin iniciar sesión ni tocar producción.
//
//   npx vite --port 5199 --strictPort &          (servidor local)
//   node scripts/mobile-shots.mjs <ruta> <salida.png> [--device "iPhone 13"] [--guide] [--dark] [--scroll=<px>] [--full]
//   ej.: node scripts/mobile-shots.mjs /a/basalt /tmp/basalt-movil.png --guide
//
// --guide  muestra la Guía rápida (borra la marca de "ya vista")   --dark  tema oscuro   --full  página completa
// Por qué existe: resize_window de Claude in Chrome no cambia el viewport, y creator-ia.com bloquea los iframes.
import { chromium, devices } from "@playwright/test";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const a = args.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };
const dev = args.indexOf("--device") >= 0 ? args[args.indexOf("--device") + 1] : "iPhone 13";
const [route, out] = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--device");
if (!route || !out) throw new Error("Uso: mobile-shots.mjs <ruta> <salida.png> [--device X] [--guide] [--dark] [--full]");

const base = process.env.BASE_URL ?? "http://localhost:5199";
const now = new Date().toISOString();
const user = { id: "u-demo", name: "Sebastián Prueba", email: "demo@example.com", emailVerified: true, image: null, createdAt: now, updatedAt: now };
const profile = { userId: "u-demo", displayName: "Sebastián Prueba", avatarUrl: null, email: "demo@example.com", creditsBalance: 120, subscriptionTier: "free", subscriptionExpiresAt: null, isAdmin: false, createdAt: now };

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices[dev], locale: "es-CO", colorScheme: flag("--dark") ? "dark" : "light" });
await ctx.addInitScript(([guide, dark]) => {
  try {
    if (guide) localStorage.removeItem("basalt_guide_seen_v1"); else localStorage.setItem("basalt_guide_seen_v1", "1");
    if (dark) localStorage.setItem("theme", "dark");
  } catch { /* sin storage */ }
}, [flag("--guide"), flag("--dark")]);

const DEMO_EXPERTS = ["marketing", "legal", "financiero", "talento", "ventas"].map((slug, i) => ({
  id: `a${i}`, slug, name: slug[0].toUpperCase() + slug.slice(1), tagline: "Experto de prueba",
  visibility: "system", isActive: true, brand: {}, welcome: { cards: [] }, persona: {}, capabilities: {},
}));

const DEMO_CONVERSATIONS = [
  { id: "c1", title: "Analiza este contrato de prestación de servicios", updatedAt: Date.now(), messages: [] },
  { id: "c2", title: "Plan de mercadeo para la marca", updatedAt: Date.now() - 1e6, messages: [] },
];

const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10); // columna date: "YYYY-MM-DD"
const DEMO_TASKS = [
  ["Revisar el contrato de ACME antes del viernes", "todo", "high", day(2)],
  ["Preparar la parrilla de contenido de octubre", "todo", "medium", day(6)],
  ["Llamar al proveedor de pasarela de pagos", "in_progress", "high", day(-1)],
  ["Ajustar el copy de la landing", "in_progress", "low", null],
  ["Cerrar la facturación de septiembre", "done", "medium", day(-4)],
].map(([title, status, priority, dueDate], i) => ({
  id: `t${i}`, userId: "u-demo", title, description: null, status, priority, dueDate,
  position: i, notifyEmail: false, reminderSentAt: null, completedAt: null,
  createdAt: now, updatedAt: now,
}));

const json = (route, body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
await ctx.route("**/api/**", (r) => {
  const u = new URL(r.request().url()).pathname;
  if (u.endsWith("/auth/get-session")) return json(r, { session: { id: "s1", userId: user.id, token: "t", expiresAt: new Date(Date.now() + 864e5).toISOString(), createdAt: now, updatedAt: now }, user });
  if (u === "/api/profile") return json(r, { ok: true, profile });
  if (u.startsWith("/api/basalt/conversations")) return json(r, { ok: true, conversations: [] });
  if (u.startsWith("/api/basalt/memory")) return json(r, { ok: true, facts: [] });
  if (u.startsWith("/api/assistants")) return json(r, { ok: true, assistants: DEMO_EXPERTS });
  // Con las respuestas vacías, /tareas y /proyectos salían en su estado "no hay nada":
  // justo el que NO sirve para ver si algo se desborda en un teléfono.
  if (u.startsWith("/api/tasks")) return json(r, { ok: true, tasks: DEMO_TASKS });
  if (u.startsWith("/api/basalt/conversations")) return json(r, { ok: true, conversations: DEMO_CONVERSATIONS });
  return json(r, { ok: true });
});

const page = await ctx.newPage();
await page.goto(base + route, { waitUntil: "networkidle" });
await page.waitForTimeout(1200); // animaciones de entrada
const y = Number(opt("--scroll", 0));
if (y) { await page.evaluate((v) => document.querySelector(".asst-scroller")?.scrollTo(0, v), y); await page.waitForTimeout(300); }
await page.screenshot({ path: out, fullPage: flag("--full") });
console.log(`${dev} ${page.viewportSize().width}x${page.viewportSize().height} → ${out}`);
await browser.close();
