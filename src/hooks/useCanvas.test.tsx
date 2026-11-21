import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCanvas } from "./useCanvas";
import { CANVAS_OPEN_EVENT, WHOLE_MESSAGE, getCanvasTarget } from "@/lib/canvas";

const F = "```";
const COMPONENT = `Va:\n\n${F}tsx\nexport default function A() { return <b>hola</b>; }\n${F}`;
const user = { id: "u1", role: "user", text: "hazme un componente" };
const model = (text: string, id = "m1") => ({ id, role: "model", text });

/** Pantalla ancha (cabe el Canvas al lado) o angosta. */
function screen(wide: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: wide, media: q, addEventListener() {}, removeEventListener() {} }));
}

describe("useCanvas", () => {
  beforeEach(() => screen(true));
  afterEach(() => vi.unstubAllGlobals());

  it("se abre solo cuando la respuesta que se está escribiendo trae algo que ver", () => {
    const { result, rerender } = renderHook(({ msgs, gen }) => useCanvas(msgs, gen), { initialProps: { msgs: [user, model("Va:")], gen: true } });
    expect(result.current.artifact).toBeNull();
    rerender({ msgs: [user, model(COMPONENT)], gen: true });
    expect(result.current.artifact?.kind).toBe("react");
    expect(result.current.target).toEqual({ msgId: "m1", index: 0 });
    expect(result.current.streaming).toBe(true);
    expect(getCanvasTarget()).toEqual({ msgId: "m1", index: 0 });
  });

  it("en una pantalla angosta no se abre solo (taparía el chat)", () => {
    screen(false);
    const { result } = renderHook(() => useCanvas([user, model(COMPONENT)], true));
    expect(result.current.artifact).toBeNull();
  });

  it("una conversación que ya estaba escrita no abre nada por su cuenta", () => {
    const { result } = renderHook(() => useCanvas([user, model(COMPONENT)], false));
    expect(result.current.artifact).toBeNull();
    expect(result.current.versions).toHaveLength(1);
  });

  it("si el usuario lo cierra mientras se escribe, no vuelve a abrirse para esa respuesta", () => {
    const { result, rerender } = renderHook(({ msgs }) => useCanvas(msgs, true), { initialProps: { msgs: [user, model(COMPONENT)] } });
    expect(result.current.artifact).not.toBeNull();
    act(() => result.current.close());
    rerender({ msgs: [user, model(COMPONENT + "\n\nListo.")] });
    expect(result.current.artifact).toBeNull();
    expect(getCanvasTarget()).toBeNull();
  });

  it("el botón «Abrir en Canvas» de una tarjeta lo abre por evento", () => {
    const html = `${F}html\n<h1>uno</h1><p>dos</p>\n${F}`;
    const { result } = renderHook(() => useCanvas([user, model(COMPONENT + "\n\n" + html)], false));
    act(() => { window.dispatchEvent(new CustomEvent(CANVAS_OPEN_EVENT, { detail: { msgId: "m1", index: 1 } })); });
    expect(result.current.artifact?.kind).toBe("web");
    expect(result.current.streaming).toBe(false);
  });

  it("una respuesta entera se abre como documento", () => {
    const plan = model("# Plan de mercadeo\n\nTexto del plan.");
    const { result } = renderHook(() => useCanvas([user, plan], false));
    act(() => result.current.open({ msgId: "m1", index: WHOLE_MESSAGE }));
    expect(result.current.artifact?.kind).toBe("doc");
    expect(result.current.artifact?.title).toBe("Plan de mercadeo");
  });

  it("se cierra si el mensaje desaparece (chat nuevo, otra conversación, regenerar)", () => {
    const { result, rerender } = renderHook(({ msgs }) => useCanvas(msgs, false), { initialProps: { msgs: [user, model(COMPONENT)] } });
    act(() => result.current.open({ msgId: "m1", index: 0 }));
    expect(result.current.artifact).not.toBeNull();
    rerender({ msgs: [] });
    expect(result.current.artifact).toBeNull();
    expect(result.current.target).toBeNull();
  });

  it("un número de artefacto que no existe no abre un panel vacío", () => {
    const { result } = renderHook(() => useCanvas([user, model(COMPONENT)], false));
    act(() => result.current.open({ msgId: "m1", index: 7 }));
    expect(result.current.artifact).toBeNull();
    expect(result.current.target).toBeNull();
  });
});
