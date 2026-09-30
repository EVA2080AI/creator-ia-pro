import { describe, expect, it } from "vitest";
import { joinContinuation } from "./basalt";

const F = "```";

describe("joinContinuation", () => {
  it("sin texto previo devuelve la continuación tal cual", () => {
    expect(joinContinuation("", "hola")).toBe("hola");
  });

  it("si el corte fue en prosa, separa con un párrafo", () => {
    expect(joinContinuation("Primera parte.", "Segunda parte.")).toBe("Primera parte.\n\nSegunda parte.");
  });

  it("si el corte dejó una valla abierta, sigue el código en la línea siguiente", () => {
    const prefix = `${F}css styles.css\nbody { margin: 0 }`;
    expect(joinContinuation(prefix, "h1 { color: red }\n" + F)).toBe(`${prefix}\nh1 { color: red }\n${F}`);
  });

  it("si el modelo reabre la valla igual, descarta esa línea de apertura", () => {
    const prefix = `${F}css styles.css\nbody { margin: 0 }`;
    const joined = joinContinuation(prefix, `${F}css\nh1 { color: red }\n${F}`);
    expect(joined).toBe(`${prefix}\nh1 { color: red }\n${F}`);
    expect((joined.match(/```/g) ?? []).length).toBe(2);
  });

  it("con las vallas balanceadas no toca los bloques de la continuación", () => {
    const prefix = `Listo:\n\n${F}html index.html\n<p>x</p>\n${F}`;
    const cont = `${F}css styles.css\np{}\n${F}`;
    expect(joinContinuation(prefix, cont)).toBe(`${prefix}\n\n${cont}`);
  });
});
