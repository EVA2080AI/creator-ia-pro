import { describe, expect, it } from "vitest";
import { textOutputOf, imageOutputOf, upstreamTexts } from "./nodeData";

const n = (id: string, type: string, data: Record<string, unknown>) => ({ id, type, data });
const edge = (source: string, target: string) => ({ source, target });

describe("textOutputOf", () => {
  it("lee el campo correcto de cada tipo", () => {
    expect(textOutputOf(n("a", "textInput", { value: "hola" }))).toBe("hola");
    expect(textOutputOf(n("a", "promptBuilder", { compiledPrompt: "compilado" }))).toBe("compilado");
    expect(textOutputOf(n("a", "promptBuilder", { template: "plantilla {{x}}" }))).toBe("plantilla {{x}}");
    expect(textOutputOf(n("a", "characterBreakdown", { description: "perfil" }))).toBe("perfil");
    expect(textOutputOf(n("a", "llmNode", { output: "respuesta" }))).toBe("respuesta");
    expect(textOutputOf(n("a", "llmNode", { prompt: "instructivo" }))).toBe("instructivo");
    expect(textOutputOf(n("a", "captionNode", { caption: "legado" }))).toBe("legado");
    expect(textOutputOf(n("a", "layoutBuilder", { structure: "Hero > CTA" }))).toBe("Hero > CTA");
  });

  it("devuelve '' si no hay nada, sin reventar con data rara", () => {
    expect(textOutputOf(n("a", "textInput", {}))).toBe("");
    expect(textOutputOf(n("a", "textInput", { value: 42 }))).toBe("");
    expect(textOutputOf({ id: "a", data: {} })).toBe("");
  });
});

describe("imageOutputOf", () => {
  it("solo Imagen IA aporta imagen", () => {
    expect(imageOutputOf(n("a", "modelView", { assetUrl: "https://x/y.png" }))).toBe("https://x/y.png");
    expect(imageOutputOf(n("a", "llmNode", { assetUrl: "https://x/y.png" }))).toBe("");
  });
});

describe("upstreamTexts", () => {
  const nodes = new Map(
    [
      n("texto", "textInput", { value: "brief del producto" }),
      n("llm", "llmNode", { output: "copy generado" }),
      n("vacio", "textInput", {}),
      n("img", "modelView", { assetUrl: "https://x.png" }),
    ].map((x) => [x.id, x]),
  );

  it("junta los textos de las fuentes conectadas, en orden de los cables", () => {
    const edges = [edge("texto", "destino"), edge("llm", "destino")];
    expect(upstreamTexts("destino", nodes, edges)).toEqual(["brief del producto", "copy generado"]);
  });

  it("ignora vacíos, fuentes sin texto (imagen) y cables hacia otros nodos", () => {
    const edges = [edge("vacio", "destino"), edge("img", "destino"), edge("llm", "otro")];
    expect(upstreamTexts("destino", nodes, edges)).toEqual([]);
  });

  it("dos cables de la misma fuente no duplican su texto", () => {
    const edges = [edge("texto", "destino"), edge("texto", "destino")];
    expect(upstreamTexts("destino", nodes, edges)).toEqual(["brief del producto"]);
  });
});
