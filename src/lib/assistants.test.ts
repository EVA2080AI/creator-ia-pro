import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// La caché es estado de módulo: cada test importa una copia fresca para no
// heredar la lista del test anterior.
const fresco = async () => {
  vi.resetModules();
  return await import("./assistants");
};

const respuesta = (body: unknown, ok = true) =>
  ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response;

const EXPERTO = { id: "1", slug: "licitaciones", name: "Licitaciones", visibility: "private" };

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("caché de listAssistants", () => {
  it("peek arranca vacío y se llena tras un list exitoso", async () => {
    const lib = await fresco();
    expect(lib.peekAssistants()).toBeNull();
    vi.mocked(fetch).mockResolvedValueOnce(respuesta({ ok: true, assistants: [EXPERTO] }));
    const lista = await lib.listAssistants();
    expect(lista).toHaveLength(1);
    expect(lib.peekAssistants()).toEqual(lista);
  });

  it("un list fallido devuelve null y NO pisa la caché buena", async () => {
    const lib = await fresco();
    vi.mocked(fetch).mockResolvedValueOnce(respuesta({ ok: true, assistants: [EXPERTO] }));
    await lib.listAssistants();
    vi.mocked(fetch).mockRejectedValueOnce(new Error("sin red"));
    expect(await lib.listAssistants()).toBeNull();
    expect(lib.peekAssistants()).toHaveLength(1);
  });

  it.each([
    ["createAssistant", (lib: Awaited<ReturnType<typeof fresco>>) => lib.createAssistant({ name: "X" }), { ok: true, assistant: EXPERTO }],
    ["updateAssistant", (lib: Awaited<ReturnType<typeof fresco>>) => lib.updateAssistant("licitaciones", { name: "Y" }), { ok: true, assistant: EXPERTO }],
    ["deleteAssistant", (lib: Awaited<ReturnType<typeof fresco>>) => lib.deleteAssistant("licitaciones"), { ok: true }],
  ])("%s exitoso invalida la caché", async (_nombre, accion, cuerpo) => {
    const lib = await fresco();
    vi.mocked(fetch).mockResolvedValueOnce(respuesta({ ok: true, assistants: [EXPERTO] }));
    await lib.listAssistants();
    expect(lib.peekAssistants()).not.toBeNull();
    vi.mocked(fetch).mockResolvedValueOnce(respuesta(cuerpo));
    await accion(lib);
    expect(lib.peekAssistants()).toBeNull();
  });

  it("una escritura fallida conserva la caché (la lista no cambió)", async () => {
    const lib = await fresco();
    vi.mocked(fetch).mockResolvedValueOnce(respuesta({ ok: true, assistants: [EXPERTO] }));
    await lib.listAssistants();
    vi.mocked(fetch).mockResolvedValueOnce(respuesta({ ok: false, error: "nope" }, false));
    expect(await lib.deleteAssistant("licitaciones")).toBe(false);
    expect(lib.peekAssistants()).toHaveLength(1);
  });
});
