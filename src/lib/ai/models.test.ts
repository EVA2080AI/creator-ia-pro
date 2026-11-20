import { describe, expect, it } from "vitest";
import {
  ALL_CHAT_MODELS, AUTO_CHAT_ID, AUTO_CODE_ID, AUTO_MODEL_ID, CHAT_MODELS, DEFAULT_MODEL_ID, FREE_ONLY_MODE,
  POWER_LABEL, byPower, freeFallbacks, getModel, isUpstreamFree, looksLikeCodeRequest, modelLabel, modelPower, powerTier,
  resolveAutoModel, visibleChatModels,
} from "./models";

describe("resolveAutoModel", () => {
  it("solo elige modelos que existen en el catálogo y son gratis (nunca cobra por su cuenta)", () => {
    for (const caso of [
      { hasImages: false, text: "hola, ¿cómo estás?" },
      { hasImages: false, text: "hazme una página web para mi cafetería" },
      { hasImages: true, text: "qué dice esta foto" },
    ]) {
      const m = resolveAutoModel(caso);
      expect(CHAT_MODELS.some((x) => x.id === m.id)).toBe(true);
      expect(m.free).toBe(true);
      expect(m.minTier).toBe("free");
    }
  });

  it("con imagen elige un modelo con visión, aunque el texto pida código", () => {
    const m = resolveAutoModel({ hasImages: true, text: "arregla el bug de esta captura" });
    expect(m.vision).toBe(true);
  });

  it("código o sitio → el mejor gratis del benchmark; charla normal → el rápido", () => {
    // Cuál es cada uno depende de FREE_ONLY_MODE (ver AUTO_CHAT_ID / AUTO_CODE_ID).
    expect(resolveAutoModel({ hasImages: false, text: "créame una landing para mi negocio" }).id).toBe(AUTO_CODE_ID);
    expect(resolveAutoModel({ hasImages: false, text: "dame ideas para el cumpleaños de mi mamá" }).id).toBe(AUTO_CHAT_ID);
    expect(AUTO_CODE_ID).toBe(FREE_ONLY_MODE ? "nvidia/nemotron-3-ultra-550b-a55b:free" : "openai/gpt-oss-120b");
    expect(AUTO_CHAT_ID).toBe(FREE_ONLY_MODE ? "nvidia/nemotron-3.5-super-vl:free" : "google/gemini-2.5-flash-lite");
  });

  it("detecta pedidos de código en español cotidiano y en inglés técnico", () => {
    expect(looksLikeCodeRequest("quiero una aplicación de reservas")).toBe(true);
    expect(looksLikeCodeRequest("fix this typescript bug")).toBe(true);
    expect(looksLikeCodeRequest("una calculadora de propinas")).toBe(true);
    expect(looksLikeCodeRequest("recomiéndame libros de historia")).toBe(false);
    // "programa" solo cuenta como verbo/sustantivo de software, no "programa de televisión"…
    // regla conservadora: esto SÍ dispara (el costo de equivocarse es bajo: gpt-oss chatea bien).
  });

  it("'auto' no es un id del catálogo (se resuelve antes de llegar al servidor)", () => {
    expect(CHAT_MODELS.some((m) => m.id === AUTO_MODEL_ID)).toBe(false);
  });
});

describe("modo solo-gratuitos (FREE_ONLY_MODE)", () => {
  const soloGratis = visibleChatModels(true);
  const todos = visibleChatModels(false);

  it("activo: ningún modelo que le cueste plata a la cuenta de OpenRouter queda a la vista", () => {
    expect(soloGratis.length).toBeGreaterThanOrEqual(3);
    expect(soloGratis.every((m) => isUpstreamFree(m.id))).toBe(true);
    // …y ninguno le cobra créditos al usuario ni le pide plan.
    expect(soloGratis.every((m) => m.free && m.credits === 0 && m.minTier === "free")).toBe(true);
    // Los "gratis" que en realidad se facturan por token también salen.
    for (const id of ["google/gemini-2.5-flash-lite", "openai/gpt-oss-120b", "anthropic/claude-sonnet-4.5"]) {
      expect(soloGratis.some((m) => m.id === id)).toBe(false);
    }
  });

  it("apagado: vuelve el catálogo entero, con los gratuitos nuevos como opciones extra", () => {
    expect(todos).toBe(ALL_CHAT_MODELS);
    expect(todos[0].id).toBe("google/gemini-2.5-flash-lite");
    expect(soloGratis.every((m) => todos.includes(m))).toBe(true);
  });

  it("el primero de los gratuitos (el modelo por defecto del modo) ve imágenes", () => {
    // Es el que atiende a los Expertos y a cualquier id oculto que llegue al servidor:
    // si no viera, adjuntar una foto a un Experto dejaría de funcionar.
    expect(soloGratis[0].vision).toBe(true);
  });

  it("el catálogo que se ofrece hoy coincide con la bandera, y el modelo por defecto sale de él", () => {
    expect(CHAT_MODELS).toEqual(visibleChatModels(FREE_ONLY_MODE));
    expect(CHAT_MODELS[0].id).toBe(DEFAULT_MODEL_ID);
    expect(getModel(DEFAULT_MODEL_ID).free).toBe(true);
  });

  it("no hay ids repetidos en el catálogo entero", () => {
    const ids = ALL_CHAT_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("un id oculto o desconocido se resuelve al modelo por defecto, pero conserva su nombre en el historial", () => {
    expect(getModel("no/existe").id).toBe(DEFAULT_MODEL_ID);
    expect(modelLabel("anthropic/claude-sonnet-4.5")).toBe("Claude Sonnet 4.5");
    if (FREE_ONLY_MODE) expect(getModel("anthropic/claude-sonnet-4.5").id).toBe(DEFAULT_MODEL_ID);
    expect(modelLabel("no/existe")).toBe(getModel(DEFAULT_MODEL_ID).label);
  });
});

describe("freeFallbacks", () => {
  it("solo propone gratuitos del catálogo visible, nunca el mismo que falló, y como mucho dos", () => {
    for (const m of CHAT_MODELS.filter((x) => isUpstreamFree(x.id))) {
      const alt = freeFallbacks(m.id, false);
      expect(alt.length).toBeGreaterThan(0);
      expect(alt.length).toBeLessThanOrEqual(2);
      expect(alt).not.toContain(m.id);
      expect(alt.every((id) => isUpstreamFree(id) && CHAT_MODELS.some((x) => x.id === id))).toBe(true);
    }
  });

  it("con fotos, el respaldo también tiene que ver", () => {
    for (const m of CHAT_MODELS.filter((x) => isUpstreamFree(x.id) && x.vision)) {
      const alt = freeFallbacks(m.id, true);
      expect(alt.length).toBeGreaterThan(0);
      expect(alt.every((id) => getModel(id).vision)).toBe(true);
    }
  });

  it("nunca manda a un proveedor que el usuario no eligió ver: ERNIE (Baidu) no es respaldo de nadie", () => {
    for (const m of ALL_CHAT_MODELS) {
      expect(freeFallbacks(m.id, false)).not.toContain("baidu/ernie-5.5-flash-preview:free");
    }
  });
});

describe("potencia (la etiqueta de cada modelo)", () => {
  it("en cualquiera de los dos modos hay un tope, un piso y algo en medio", () => {
    for (const lista of [visibleChatModels(true), visibleChatModels(false)]) {
      const escalones = new Set(lista.map((m) => powerTier(m, lista)));
      expect(escalones).toEqual(new Set(["top", "mid", "light"]));
    }
  });

  it("entre los gratuitos, el más potente es Nemotron 3 Ultra y solo él", () => {
    const lista = visibleChatModels(true);
    const tope = lista.filter((m) => powerTier(m, lista) === "top").map((m) => m.id);
    expect(tope).toEqual(["nvidia/nemotron-3-ultra-550b-a55b:free"]);
  });

  it("con todo el catálogo a la vista el tope pasa a ser la categoría Ultra, no un gratuito", () => {
    const lista = visibleChatModels(false);
    const tope = lista.filter((m) => powerTier(m, lista) === "top");
    expect(tope.length).toBeGreaterThan(0);
    expect(tope.every((m) => m.category === "ultra")).toBe(true);
  });

  it("byPower ordena del más potente al menos sin perder ninguno ni tocar la lista original", () => {
    const original = [...CHAT_MODELS];
    const orden = byPower(CHAT_MODELS);
    expect(CHAT_MODELS).toEqual(original);
    expect([...orden].sort((a, b) => a.id.localeCompare(b.id))).toEqual([...original].sort((a, b) => a.id.localeCompare(b.id)));
    for (let i = 1; i < orden.length; i++) expect(modelPower(orden[i - 1])).toBeGreaterThanOrEqual(modelPower(orden[i]));
  });

  it("si todos pesan lo mismo, ninguno se anuncia como el más potente", () => {
    const iguales = visibleChatModels(false).filter((m) => m.category === "ultra");
    expect(iguales.every((m) => powerTier(m, iguales) === "mid")).toBe(true);
  });

  it("las tres etiquetas existen y ninguna habla de precio", () => {
    expect(Object.values(POWER_LABEL)).toEqual(["Más potente", "Potente", "Ligero"]);
  });
});
