// Benchmark de calidad del CSS que genera Basalt. Uso:
//   BENCH_LABEL=<etiqueta> [BENCH_MODELS=modelo,modelo] [BENCH_PROMPTS=id,id] npx vite-node scripts/css-benchmark.ts
//   BENCH_RESCORE=<etiqueta> npx vite-node scripts/css-benchmark.ts   (re-puntúa una corrida guardada, sin llamar al modelo)
// Llama a OpenRouter directo (OPENROUTER_API_KEY de .env.local) con el
// SYSTEM_PROMPT REAL de src/lib/basalt.ts y 5 pedidos fijos, arma el proyecto
// como lo haría el chat (nombres de archivo + basalt.css) y lo puntúa con la
// rúbrica de src/lib/css-rubric.ts. Imprime una tabla y guarda el detalle en
// /tmp/css-bench-<etiqueta>.json para comparar ciclos con números.
// Cuesta centavos por corrida (modelos económicos). No corre en CI.
import { readFileSync, writeFileSync } from "node:fs";
import { buildSystemPrompt } from "../src/lib/basalt";
import { extractFilename, isWebLang, uniqueName, withBasaltBase, type ProjectFile } from "../src/lib/project-preview";
import { scoreProject } from "../src/lib/css-rubric";

const PROMPTS: Record<string, string> = {
  landing: "Hazme la página web (HTML) de una panadería artesanal llamada Trigo: hero, productos, testimonios y contacto.",
  reservas: "Hazme una página web (HTML) con un formulario de reservas para un consultorio médico, con validación, que muestre la confirmación y guarde en localStorage.",
  dashboard: "Hazme un dashboard web (HTML) de ventas con 4 KPIs, una tabla de los últimos pedidos y un filtro por estado.",
  portafolio: "Hazme la página web (HTML) del portafolio de una fotógrafa de bodas: presentación, galería de 6 trabajos, sobre mí y contacto.",
  precios: "Hazme una página web (HTML) de precios con 3 planes y un interruptor mensual/anual que cambie los precios.",
};

function loadKey(): string {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = env.match(/^OPENROUTER_API_KEY="?([^"\n]+)"?/m);
  if (!m) throw new Error("OPENROUTER_API_KEY no está en .env.local");
  return m[1];
}

// Igual que planProjects() en markdown.ts, pero tomando TODOS los bloques web/con nombre.
function extractProject(md: string): ProjectFile[] {
  const taken = new Set<string>();
  const files: ProjectFile[] = [];
  for (const m of md.matchAll(/```([\p{L}\p{N}+#_-]*)\n?([\s\S]*?)(?:```|$)/gu)) {
    const lang = (m[1] || "").toLowerCase();
    const { name, code } = extractFilename(m[2]);
    if (!name && !isWebLang(lang)) continue;
    const finalName = uniqueName(name, lang, taken);
    taken.add(finalName);
    files.push({ name: finalName, lang, code: code.replace(/\n$/, "") });
  }
  return withBasaltBase(files);
}

async function run(model: string, key: string, prompt: string) {
  const t0 = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [{ role: "system", content: buildSystemPrompt([]) }, { role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(280_000),
  });
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: { completion_tokens?: number }; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  return { text: json.choices?.[0]?.message?.content ?? "", ms: Date.now() - t0, tokens: json.usage?.completion_tokens ?? 0 };
}

const label = process.env.BENCH_LABEL || "run";
const models = (process.env.BENCH_MODELS || "google/gemini-2.5-flash-lite,google/gemini-2.5-flash").split(",");
const rescore = process.env.BENCH_RESCORE;
const key = rescore ? "" : loadKey();

type Row = { model: string; id: string; prompt: string; ok: boolean; ms: number; tokens: number; cut: boolean; files: string[]; score: number; failed: string[]; text: string; error?: string };
const saved: Row[] | null = rescore ? JSON.parse(readFileSync(`/tmp/css-bench-${rescore}.json`, "utf8")) : null;
if (saved) {
  for (const r of saved) {
    if (!r.ok) continue;
    const res = scoreProject(extractProject(r.text));
    r.score = res.score;
    r.failed = res.checks.filter((c) => !c.pass).map((c) => c.id);
  }
}

// BENCH_PROMPTS=landing,dashboard limita los pedidos (por defecto corren los 5).
const only = process.env.BENCH_PROMPTS?.split(",");
const jobs = saved ? [] : models.flatMap((model) => Object.entries(PROMPTS).filter(([id]) => !only || only.includes(id)).map(([id, prompt]) => ({ model, id, prompt })));
const results: Row[] = saved ?? (await Promise.all(
  jobs.map(async (j) => {
    try {
      const out = await run(j.model, key, j.prompt);
      const files = extractProject(out.text);
      const r = scoreProject(files);
      return { ...j, ok: true, ms: out.ms, tokens: out.tokens, cut: out.ms > 54_000, files: files.map((f) => f.name), score: r.score, failed: r.checks.filter((c) => !c.pass).map((c) => c.id), text: out.text };
    } catch (e) {
      return { ...j, ok: false, error: String(e), score: 0, failed: ["error"], ms: 0, tokens: 0, cut: false, files: [] as string[], text: "" };
    }
  }),
) as Row[]);

for (const model of [...new Set(results.map((r) => r.model))]) {
  console.log(`\n== ${model} ==`);
  for (const r of results.filter((x) => x.model === model)) {
    console.log(`${r.id.padEnd(11)} ${String(r.score).padStart(1)}/12  ${(r.ms / 1000).toFixed(0).padStart(3)}s ${String(r.tokens).padStart(5)}tok ${r.cut ? "CORTADO>54s" : "           "} files=${r.files.join(",")}  fallan: ${r.failed.join(",") || "-"}`);
  }
  const mine = results.filter((x) => x.model === model && x.ok);
  console.log(`media: ${(mine.reduce((a, r) => a + r.score, 0) / Math.max(1, mine.length)).toFixed(2)}/12  (${mine.length} ok)`);
}
if (!saved) writeFileSync(`/tmp/css-bench-${label}.json`, JSON.stringify(results, null, 2));
console.log(saved ? "\n(re-puntuado sin llamar al modelo)" : `\nDetalle: /tmp/css-bench-${label}.json`);
