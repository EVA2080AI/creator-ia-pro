import { describe, expect, it } from "vitest";
import { upstreamExecutionOrder, wouldCreateCycle } from "./flowGraph";

const edge = (source: string, target: string) => ({ source, target });

describe("upstreamExecutionOrder", () => {
  it("ordena una cadena lineal de fuentes a objetivo", () => {
    const { order, hasCycle } = upstreamExecutionOrder(["c"], [edge("a", "b"), edge("b", "c")]);
    expect(hasCycle).toBe(false);
    expect(order).toEqual(["a", "b", "c"]);
  });

  it("un nodo suelto se devuelve solo", () => {
    expect(upstreamExecutionOrder(["x"], [])).toEqual({ order: ["x"], hasCycle: false });
  });

  it("las dependencias van siempre antes que quien las consume (diamante)", () => {
    // a → b, a → c, b → d, c → d
    const { order, hasCycle } = upstreamExecutionOrder(
      ["d"],
      [edge("a", "b"), edge("a", "c"), edge("b", "d"), edge("c", "d")],
    );
    expect(hasCycle).toBe(false);
    expect(order.indexOf("a")).toBeLessThan(order.indexOf("b"));
    expect(order.indexOf("a")).toBeLessThan(order.indexOf("c"));
    expect(order.indexOf("b")).toBeLessThan(order.indexOf("d"));
    expect(order.indexOf("c")).toBeLessThan(order.indexOf("d"));
    expect(order).toHaveLength(4);
  });

  it("varios objetivos con ancestros compartidos: cada nodo aparece UNA vez", () => {
    // a → b → t1, a → c → t2 — 'a' alimenta a los dos terminales
    const { order } = upstreamExecutionOrder(
      ["t1", "t2"],
      [edge("a", "b"), edge("b", "t1"), edge("a", "c"), edge("c", "t2")],
    );
    expect(order.filter((id) => id === "a")).toHaveLength(1);
    expect(order).toHaveLength(5);
    expect(order.indexOf("a")).toBeLessThan(order.indexOf("b"));
    expect(order.indexOf("c")).toBeLessThan(order.indexOf("t2"));
  });

  it("ignora ramas aguas abajo del objetivo", () => {
    const { order } = upstreamExecutionOrder(["b"], [edge("a", "b"), edge("b", "c")]);
    expect(order).toEqual(["a", "b"]);
  });

  it("detecta un ciclo A→B→A sin colgarse", () => {
    const res = upstreamExecutionOrder(["b"], [edge("a", "b"), edge("b", "a")]);
    expect(res.hasCycle).toBe(true);
    expect(res.order).toEqual([]);
  });

  it("detecta un self-loop A→A", () => {
    expect(upstreamExecutionOrder(["a"], [edge("a", "a")]).hasCycle).toBe(true);
  });

  it("detecta el ciclo aunque esté lejos del objetivo", () => {
    // ciclo x→y→x que alimenta a → objetivo
    const res = upstreamExecutionOrder(["t"], [edge("x", "y"), edge("y", "x"), edge("y", "a"), edge("a", "t")]);
    expect(res.hasCycle).toBe(true);
  });

  it("edges duplicados no duplican nodos en el orden", () => {
    const { order } = upstreamExecutionOrder(["b"], [edge("a", "b"), edge("a", "b")]);
    expect(order).toEqual(["a", "b"]);
  });
});

describe("wouldCreateCycle", () => {
  it("detecta el ciclo directo y el self-loop", () => {
    expect(wouldCreateCycle("b", "a", [edge("a", "b")])).toBe(true);
    expect(wouldCreateCycle("a", "a", [])).toBe(true);
  });

  it("detecta el ciclo a distancia (c→a cerraría a→b→c)", () => {
    expect(wouldCreateCycle("c", "a", [edge("a", "b"), edge("b", "c")])).toBe(true);
  });

  it("permite conexiones sanas, incluido el diamante", () => {
    expect(wouldCreateCycle("a", "b", [])).toBe(false);
    // a→b, a→c: cerrar b→c es un diamante, no un ciclo
    expect(wouldCreateCycle("b", "c", [edge("a", "b"), edge("a", "c")])).toBe(false);
  });

  it("no se cuelga si los datos guardados ya traen un ciclo ajeno", () => {
    expect(wouldCreateCycle("m", "n", [edge("x", "y"), edge("y", "x")])).toBe(false);
  });
});
