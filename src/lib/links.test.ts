import { describe, expect, it } from "vitest";
import { findLinks, linkHost } from "./links";

describe("findLinks", () => {
  it("encuentra el enlace dentro de una frase", () => {
    expect(findLinks("mira esto https://www.bbc.com/mundo/articulo-123 y dime qué opinas")).toEqual([
      "https://www.bbc.com/mundo/articulo-123",
    ]);
  });

  it("no se come la puntuación del final", () => {
    expect(findLinks("resume https://ejemplo.com/nota.")).toEqual(["https://ejemplo.com/nota"]);
    expect(findLinks("(ver https://ejemplo.com/a)")).toEqual(["https://ejemplo.com/a"]);
  });

  it("no repite y respeta el máximo", () => {
    const texto = "https://a.com/1 https://a.com/1 https://b.com https://c.com https://d.com";
    expect(findLinks(texto)).toEqual(["https://a.com/1", "https://b.com", "https://c.com"]);
  });

  it("ignora lo que no es una página", () => {
    expect(findLinks("escribe a mailto:hola@ejemplo.com o ftp://archivos.com")).toEqual([]);
    expect(findLinks("corre en http://localhost:3000")).toEqual([]);
    expect(findLinks("sin enlaces acá")).toEqual([]);
  });
});

describe("linkHost", () => {
  it("quita el www", () => {
    expect(linkHost("https://www.lanacion.com.ar/nota")).toBe("lanacion.com.ar");
    expect(linkHost("nada")).toBe("nada");
  });
});
