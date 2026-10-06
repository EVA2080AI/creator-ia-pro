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
    // El modal de bienvenida del panel tapa la pantalla que se quiere ver; con
    // --welcome se deja aparecer a propósito.
    if (guide) localStorage.removeItem("dashboard_onboarded_v1"); else localStorage.setItem("dashboard_onboarded_v1", "1");
  } catch { /* sin storage */ }
}, [flag("--guide"), flag("--dark")]);

const DEMO_EXPERTS = ["marketing", "legal", "financiero", "talento", "ventas"].map((slug, i) => ({
  id: `a${i}`, slug, name: slug[0].toUpperCase() + slug.slice(1), tagline: "Experto de prueba",
  visibility: "system", isActive: true, brand: {}, welcome: { cards: [] }, persona: {}, capabilities: {},
}));

const DEMO_MESSAGES = [
  { id: "u1", role: "user", text: "Analiza este contrato y dime los riesgos para mí." },
  { id: "m1", role: "model", text: "## Resumen\n\nContrato de prestación de servicios entre **ACME** y el contratista.\n\n- Pago contra entrega\n- Plazo de cuatro meses\n\nEste análisis es orientativo y no reemplaza la revisión de un abogado." },
];

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

const ago = (n) => new Date(Date.now() - n * 864e5).toISOString();
const DEMO_PROJECTS = [
  ["Landing de la agencia", "Sitio de una p\u00e1gina con formulario"],
  ["Tienda de velas", "Cat\u00e1logo y carrito"],
  ["Panel de indicadores", "Tablero con gr\u00e1ficas de ventas"],
].map(([name, description], i) => ({
  id: `p${i}`, userId: "u-demo", name, description, thumbnailUrl: null, settings: {},
  createdAt: ago(20 - i * 5), updatedAt: ago(i),
}));

const DEMO_TRANSACTIONS = [
  ["spend", -12, "chat: gemini-2.5-flash", 1],
  ["spend", -30, "imagen: flux", 2],
  ["purchase", 500, "Recarga de cr\u00e9ditos", 5],
  ["spend", -8, "chat: gpt-oss-120b", 6],
  ["spend", -45, "chat: claude-sonnet-4.5", 9],
].map(([type, amount, description, d], i) => ({
  id: `tx${i}`, userId: "u-demo", type, amount, description, createdAt: ago(d),
}));

const json = (route, body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
await ctx.route("**/api/**", (r) => {
  const u = new URL(r.request().url()).pathname;
  // --anon: sin sesión, para ver lo que ve alguien que todavía no entró (/auth, la landing).
  if (u.endsWith("/auth/get-session") && flag("--anon")) return json(r, { session: null, user: null });
  if (u.endsWith("/auth/get-session")) return json(r, { session: { id: "s1", userId: user.id, token: "t", expiresAt: new Date(Date.now() + 864e5).toISOString(), createdAt: now, updatedAt: now }, user });
  if (u === "/api/profile") return json(r, { ok: true, profile });
  if (u.startsWith("/api/basalt/memory")) return json(r, { ok: true, facts: [] });
  if (u.startsWith("/api/assistants")) return json(r, { ok: true, assistants: DEMO_EXPERTS });
  // Con las respuestas vacías, /tareas y /proyectos salían en su estado "no hay nada":
  // justo el que NO sirve para ver si algo se desborda en un teléfono.
  if (u.startsWith("/api/tasks")) return json(r, { ok: true, tasks: DEMO_TASKS });
  if (u === "/api/spaces") return json(r, { ok: true, spaces: [] });
  if (u === "/api/projects") return json(r, { ok: true, projects: DEMO_PROJECTS });
  if (u.startsWith("/api/assets")) return json(r, { ok: true, assets: [], total: 12 });
  if (u.startsWith("/api/billing/transactions")) return json(r, { ok: true, transactions: DEMO_TRANSACTIONS });
  // La ruta por id va ANTES del prefijo: si no, el mock de la lista se la come y el
  // cliente cree que la conversación no existe.
  if (/^\/api\/basalt\/conversations\/[^/]+$/.test(u)) {
    return json(r, { ok: true, conversation: { ...DEMO_CONVERSATIONS[0], messages: DEMO_MESSAGES } });
  }
  if (u.startsWith("/api/basalt/conversations")) return json(r, { ok: true, conversations: DEMO_CONVERSATIONS });
  // El bloque de GitHub del perfil solo aparece si el servidor dice "configurado";
  // sin este mock la captura de /profile no lo mostraría nunca.
  if (u === "/api/github/export") return json(r, { ok: true, configured: true, linked: false });
  return json(r, { ok: true });
});

const page = await ctx.newPage();
await page.goto(base + route, { waitUntil: "networkidle" });
await page.waitForTimeout(1200); // animaciones de entrada
const y = Number(opt("--scroll", 0));
if (y) {
  // El chat scrollea en .asst-scroller; el resto de páginas, en el contenedor que
  // desborde (o el documento). Sin esto, --scroll solo servía para el chat.
  await page.evaluate((v) => {
    const el = document.querySelector(".asst-scroller")
      ?? [...document.querySelectorAll("main, div")].find((m) => m.scrollHeight > m.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(m).overflowY))
      ?? document.scrollingElement;
    el?.scrollTo(0, v);
  }, y);
  await page.waitForTimeout(300);
}
await page.screenshot({ path: out, fullPage: flag("--full") });
console.log(`${dev} ${page.viewportSize().width}x${page.viewportSize().height} → ${out}`);
await browser.close();
