import { describe, expect, it } from "vitest";
import { activityLabel, basaltEventLine, mergeSources, readBasaltEvent, sourceHost } from "./stream-events";

describe("readBasaltEvent", () => {
  it("ignora los chunks de OpenRouter", () => {
    expect(readBasaltEvent({ choices: [{ delta: { content: "hola" } }] })).toBeNull();
    expect(readBasaltEvent({})).toBeNull();
    expect(readBasaltEvent(null)).toBeNull();
  });

  it("lee el evento de búsqueda", () => {
    expect(readBasaltEvent({ basalt: { type: "search", query: "dólar hoy" } })).toEqual({ type: "search", query: "dólar hoy" });
  });

  it("descarta eventos mal formados en vez de romper el stream", () => {
    expect(readBasaltEvent({ basalt: { type: "search" } })).toBeNull();
    expect(readBasaltEvent({ basalt: { type: "otro" } })).toBeNull();
    expect(readBasaltEvent({ basalt: "search" })).toBeNull();
  });

  it("descarta una fuente que no sea http(s) — se pinta como enlace", () => {
    const e = readBasaltEvent({
      basalt: { type: "sources", query: "q", credits: 1, sources: [{ title: "mala", url: "javascript:alert(1)" }, { title: "B", url: "https://b.com" }] },
    });
    expect(e).toEqual({ type: "sources", query: "q", sources: [{ title: "B", url: "https://b.com" }], credits: 1 });
  });

  it("normaliza las fuentes y el costo", () => {
    const e = readBasaltEvent({
      basalt: { type: "sources", query: "q", sources: [{ title: "A", url: "https://a.com" }, { title: "sin url" }], credits: "1" },
    });
    expect(e).toEqual({ type: "sources", query: "q", sources: [{ title: "A", url: "https://a.com" }], credits: 1 });
  });

  it("da la vuelta completa por la línea SSE", () => {
    const line = basaltEventLine({ type: "account", tool: "get_my_usage" });
    expect(line.startsWith("data: ")).toBe(true);
    expect(line.endsWith("\n\n")).toBe(true);
    expect(readBasaltEvent(JSON.parse(line.slice(6)))).toEqual({ type: "account", tool: "get_my_usage" });
  });
});

describe("activityLabel", () => {
  it("dice qué está buscando", () => {
    expect(activityLabel({ type: "search", query: "precio del dólar" })).toBe("Buscando en la web: precio del dólar");
  });

  it("traduce las herramientas de cuenta y aguanta una desconocida", () => {
    expect(activityLabel({ type: "account", tool: "get_my_assets" })).toBe("Revisando tus archivos guardados…");
    expect(activityLabel({ type: "account", tool: "get_my_futuro" })).toBe("Revisando los datos de tu cuenta…");
  });

  it("no muestra nada para las fuentes (ya se ven en la lista)", () => {
    expect(activityLabel({ type: "sources", query: "q", sources: [], credits: 1 })).toBe("");
  });
});

describe("mergeSources", () => {
  it("acumula sin repetir url", () => {
    const uno = mergeSources(undefined, [{ title: "A", url: "https://a.com" }]);
    const dos = mergeSources(uno, [{ title: "A otra vez", url: "https://a.com" }, { title: "B", url: "https://b.com" }]);
    expect(dos).toEqual([{ title: "A", url: "https://a.com" }, { title: "B", url: "https://b.com" }]);
  });

  it("usa el dominio cuando la fuente no trae título", () => {
    expect(mergeSources([], [{ title: "", url: "https://www.lanacion.com.ar/nota" }])).toEqual([
      { title: "lanacion.com.ar", url: "https://www.lanacion.com.ar/nota" },
    ]);
  });
});

describe("sourceHost", () => {
  it("quita el www y aguanta una url inválida", () => {
    expect(sourceHost("https://www.bbc.com/mundo")).toBe("bbc.com");
    expect(sourceHost("no-es-una-url")).toBe("no-es-una-url");
  });
});
