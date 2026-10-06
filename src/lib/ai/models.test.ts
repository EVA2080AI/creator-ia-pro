import { describe, expect, it } from "vitest";
import { AUTO_MODEL_ID, CHAT_MODELS, looksLikeCodeRequest, resolveAutoModel } from "./models";

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
    expect(resolveAutoModel({ hasImages: false, text: "créame una landing para mi negocio" }).id).toBe("openai/gpt-oss-120b");
    expect(resolveAutoModel({ hasImages: false, text: "dame ideas para el cumpleaños de mi mamá" }).id).toBe("google/gemini-2.5-flash-lite");
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
