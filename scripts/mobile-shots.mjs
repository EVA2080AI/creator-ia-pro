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

const json = (route, body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
await ctx.route("**/api/**", (r) => {
  const u = new URL(r.request().url()).pathname;
  if (u.endsWith("/auth/get-session")) return json(r, { session: { id: "s1", userId: user.id, token: "t", expiresAt: new Date(Date.now() + 864e5).toISOString(), createdAt: now, updatedAt: now }, user });
  if (u === "/api/profile") return json(r, { ok: true, profile });
  if (u.startsWith("/api/basalt/conversations")) return json(r, { ok: true, conversations: [] });
  if (u.startsWith("/api/basalt/memory")) return json(r, { ok: true, facts: [] });
  if (u.startsWith("/api/assistants")) return json(r, { ok: true, assistants: [] });
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
