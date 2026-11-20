// El camino del chat con modelos gratuitos (api/ai/chat.ts): qué modelo se le pide de verdad
// a OpenRouter cuando el elegido está oculto o saturado. Sin red y sin base: la sesión, los
// créditos y la base están simulados, y `fetch` responde según el modelo que se le pida.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MODEL_ID, FREE_ONLY_MODE, freeFallbacks, getModel } from "@/lib/ai/models";

const state = vi.hoisted(() => ({ tier: "free", consume: vi.fn(), spend: vi.fn(), refund: vi.fn() }));

vi.mock("../../api/_lib/session.js", () => ({
  getSessionUser: async () => ({ userId: "u1", email: "persona@example.com" }),
  getProfile: async () => ({ subscriptionTier: state.tier, creditsBalance: 0 }),
}));
vi.mock("../../api/_lib/credits.js", () => ({
  spendCredits: state.spend,
  refundCredits: state.refund,
  consumeFreeMessage: state.consume,
  logSpend: vi.fn(),
  FREE_DAILY_MESSAGE_LIMIT: 30,
  PAID_PLAN_DAILY_MESSAGE_LIMIT: 150,
  FREE_LIMIT_EXEMPT_EMAILS: new Set<string>(),
}));
vi.mock("../../db/index.js", () => ({ getDb: () => { throw new Error("la prueba no debe tocar la base"); }, schema: {} }));
vi.mock("../../api/_lib/userData.js", () => ({ getUserProjects: vi.fn(), getUserAssets: vi.fn(), getUserUsage: vi.fn() }));

import handler from "../../api/ai/chat";

const FREE_A = "nvidia/nemotron-3.5-super-vl:free";
const FREE_B = "nvidia/nemotron-3-ultra-550b-a55b:free";

/** Un stream SSE mínimo como el de OpenRouter. */
function sse(text: string): Response {
  const body = `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: text } }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`;
  return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}
const saturado = () => new Response(JSON.stringify({ error: { message: "Provider returned error", code: 429 } }), { status: 429 });

/** `fetch` simulado: `down` son los modelos que responden 429. Devuelve los modelos pedidos, en orden. */
function stubFetch(down: string[] | "todos") {
  const pedidos: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: { body: string }) => {
    const { model } = JSON.parse(init.body) as { model: string };
    pedidos.push(model);
    return down === "todos" || down.includes(model) ? saturado() : sse(`hola desde ${model}`);
  }));
  return pedidos;
}

async function send(body: Record<string, unknown>) {
  const out = { status: 0, headers: {} as Record<string, string>, json: null as null | { code?: string; error?: string }, text: "" };
  const res = {
    writableEnded: false,
    status(code: number) { out.status = code; return res; },
    setHeader(k: string, v: string) { out.headers[k] = v; },
    json(j: { code?: string; error?: string }) { out.json = j; res.writableEnded = true; },
    write(chunk: string) { out.text += chunk; return true; },
    end() { res.writableEnded = true; },
  };
  const req = { method: "POST", body: { messages: [{ role: "user", content: "hola" }], ...body }, on: () => {} };
  await handler(req as never, res as never);
  return out;
}

describe("/api/ai/chat con modelos gratuitos", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "sk-prueba";
    state.tier = "free";
    state.consume.mockReset().mockResolvedValue(1);
    state.spend.mockReset().mockResolvedValue(10);
    state.refund.mockReset();
  });

  it("el gratuito elegido responde: no se toca ningún respaldo", async () => {
    const pedidos = stubFetch([]);
    const r = await send({ model: FREE_A });
    expect(pedidos).toEqual([FREE_A]);
    expect(r.status).toBe(200);
    expect(r.headers["X-Model-Used"]).toBe(FREE_A);
    expect(r.text).toContain(`hola desde ${FREE_A}`);
  });

  it("el elegido está saturado (429): responde el siguiente gratuito y la cabecera dice cuál fue", async () => {
    const pedidos = stubFetch([FREE_A]);
    const r = await send({ model: FREE_A });
    const respaldo = freeFallbacks(FREE_A, false)[0];
    expect(pedidos).toEqual([FREE_A, respaldo]);
    expect(r.status).toBe(200);
    expect(r.headers["X-Model-Used"]).toBe(respaldo);
    expect(r.text).toContain(`hola desde ${respaldo}`);
    expect(state.spend).not.toHaveBeenCalled();
  });

  it("con una foto adjunta, el respaldo tiene que ver imágenes", async () => {
    const pedidos = stubFetch([FREE_A]);
    const png = "data:image/png;base64,iVBORw0KGgo=";
    const r = await send({ model: FREE_A, images: [png] });
    expect(r.status).toBe(200);
    expect(pedidos.length).toBe(2);
    expect(getModel(pedidos[1]).vision).toBe(true);
    expect(pedidos[1]).not.toBe(FREE_B); // Ultra no ve: no puede atender una foto
  });

  it("todos saturados: tres intentos como mucho y un mensaje que se entiende, no el JSON del proveedor", async () => {
    const pedidos = stubFetch("todos");
    const r = await send({ model: FREE_A });
    expect(pedidos.length).toBe(3);
    expect(new Set(pedidos).size).toBe(3);
    expect(r.status).toBe(429);
    expect(r.json?.code).toBe("PROVIDER_ERROR");
    expect(r.json?.error).toMatch(/saturados/);
    expect(r.json?.error).not.toMatch(/Provider returned error/);
  });

  it.runIf(FREE_ONLY_MODE)("modo solo-gratuitos: un modelo de pago que llegue igual se atiende con el gratuito por defecto y no cobra", async () => {
    const pedidos = stubFetch([]);
    for (const oculto of ["anthropic/claude-sonnet-4.5", "google/gemini-2.5-flash-lite", "openai/gpt-oss-120b"]) {
      const r = await send({ model: oculto });
      expect(r.headers["X-Model-Used"]).toBe(DEFAULT_MODEL_ID);
    }
    expect(new Set(pedidos)).toEqual(new Set([DEFAULT_MODEL_ID]));
    expect(state.spend).not.toHaveBeenCalled();
  });

  it.runIf(FREE_ONLY_MODE)("modo solo-gratuitos: el plan Free tiene 30 mensajes al día y un plan de pago 150", async () => {
    stubFetch([]);
    await send({ model: FREE_A });
    expect(state.consume).toHaveBeenLastCalledWith("u1", 30);
    state.tier = "pro";
    await send({ model: FREE_A });
    expect(state.consume).toHaveBeenLastCalledWith("u1", 150);
  });

  it("última ronda de herramientas: al gratuito se le prohíbe llamar otra y se le pide la respuesta", async () => {
    // El modelo insiste en usar una herramienta las tres rondas permitidas; en la cuarta
    // petición tiene que responder. Sin tool_choice:"none" + el aviso, Nemotron 3 Ultra
    // escribía "<tool_call>…" como texto de la respuesta.
    const cuerpos: { tools?: unknown[]; tool_choice?: string; messages: { role: string; content: unknown }[] }[] = [];
    const llamada = (n: number) => new Response(
      `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: `call_${n}`, type: "function", function: { name: "get_my_projects", arguments: "{}" } }] } }] })}\n\n` +
      `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\ndata: [DONE]\n\n`,
      { status: 200 },
    );
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: { body: string }) => {
      cuerpos.push(JSON.parse(init.body));
      return cuerpos.length <= 3 ? llamada(cuerpos.length) : sse("estos son tus proyectos");
    }));
    const r = await send({ model: FREE_B });
    expect(cuerpos.length).toBe(4);
    expect(cuerpos.slice(0, 3).every((c) => c.tool_choice === "auto")).toBe(true);
    const ultima = cuerpos[3];
    expect(ultima.tool_choice).toBe("none");
    expect(ultima.tools?.length).toBeGreaterThan(0);
    expect(ultima.messages.at(-1)?.role).toBe("system");
    expect(String(ultima.messages.at(-1)?.content)).toMatch(/Ya no puedes usar herramientas/);
    expect(r.text).toContain("estos son tus proyectos");
  });

  it("al llegar al tope diario no se llama al proveedor", async () => {
    const pedidos = stubFetch([]);
    state.consume.mockResolvedValue(null);
    const r = await send({ model: FREE_A });
    expect(r.status).toBe(429);
    expect(r.json?.code).toBe("FREE_LIMIT_REACHED");
    expect(pedidos).toEqual([]);
  });
});
