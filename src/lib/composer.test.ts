import { describe, expect, it } from "vitest";
import { shouldSubmitOnEnter } from "./composer";

const ev = (key: string, shift = false, composing = false) =>
  ({ key, shiftKey: shift, isComposing: composing }) as KeyboardEvent;

describe("shouldSubmitOnEnter", () => {
  it("envía en desktop con Enter sin modificadores", () => {
    expect(shouldSubmitOnEnter(ev("Enter"), false)).toBe(true);
  });
  it("NO envía con Shift+Enter (salto de línea en los dos modos)", () => {
    expect(shouldSubmitOnEnter(ev("Enter", true), false)).toBe(false);
    expect(shouldSubmitOnEnter(ev("Enter", true), true)).toBe(false);
  });
  it("en móvil (prefersClickSubmit) Enter deja salto de línea", () => {
    expect(shouldSubmitOnEnter(ev("Enter"), true)).toBe(false);
  });
  it("nunca envía con IME activo — Enter confirma el carácter", () => {
    expect(shouldSubmitOnEnter(ev("Enter", false, true), false)).toBe(false);
    expect(shouldSubmitOnEnter(ev("Enter", false, true), true)).toBe(false);
  });
  it("ignora cualquier tecla distinta de Enter", () => {
    expect(shouldSubmitOnEnter(ev("a"), false)).toBe(false);
    expect(shouldSubmitOnEnter(ev("Escape"), false)).toBe(false);
  });
});
