// Graba /promo/landing y deja /public/promo-landing.mp4 listo.
//
//   npm run build && npx vite preview --port 5200 --strictPort &
//   node scripts/record-promo.mjs
//
// Por qué existe: el encabezado de src/pages/PromoLanding.tsx pedía grabar la
// página a mano con QuickTime, y así salió el primer promo-landing.mp4 — quince
// segundos de pantalla blanca, porque la grabación empezó mientras el SPA
// todavía cargaba. Aquí el navegador espera a que la primera escena esté en
// pantalla y ffmpeg recorta el arranque: la carga es blanca y la promo es
// oscura (#070C0F), así que el primer frame oscuro marca el inicio del loop.
//
// Se graba contra el build de producción (vite preview), no contra `vite dev`:
// el ícono flotante de PerformanceMonitor solo existe en dev y saldría en el
// video.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = process.env.BASE_URL ?? "http://localhost:5200";
const out = process.argv[2] ?? "public/promo-landing.mp4";
const LOOP_S = 17.52; // 3500 + 4500 + 5000 + 4500 ms de SCENES en PromoLanding.tsx

const dir = mkdtempSync(join(tmpdir(), "promo-"));
try {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: { dir, size: { width: 1280, height: 720 } },
    locale: "es-CO",
  });
  const page = await ctx.newPage();
  await page.goto(`${base}/promo/landing`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=/apps de IA/i", { timeout: 15_000 });
  // Dos vueltas: sobra material para recortar una limpia desde el primer frame
  // oscuro, caiga donde caiga el arranque de la grabación.
  await page.waitForTimeout(LOOP_S * 2 * 1000 + 3000);
  await page.close(); // cierra el archivo de video
  await ctx.close();
  await browser.close();

  const webm = join(dir, readdirSync(dir).find((f) => f.endsWith(".webm")));

  // Luma media por frame: el primero bajo 60 es el primer frame de la promo.
  const stats = execFileSync("ffmpeg", ["-v", "error", "-i", webm, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 64 << 20 });
  let t0 = null;
  let pts = null;
  for (const line of stats.split("\n")) {
    const time = line.match(/pts_time:([\d.]+)/);
    if (time) pts = Number(time[1]);
    const yavg = line.match(/YAVG=([\d.]+)/);
    if (yavg && pts !== null && Number(yavg[1]) < 60) { t0 = pts; break; }
  }
  if (t0 === null) throw new Error("No se encontró el inicio de la promo en la grabación.");

  execFileSync("ffmpeg", [
    "-v", "error", "-y",
    "-ss", String(t0), "-t", String(LOOP_S), "-i", webm,
    "-vf", "scale=1280:720", "-r", "25",
    "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-crf", "23", "-preset", "slow", "-movflags", "+faststart",
    "-an", out,
  ], { stdio: "inherit" });
  console.log(`${out} ← ${webm} desde ${t0}s, ${LOOP_S}s`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
