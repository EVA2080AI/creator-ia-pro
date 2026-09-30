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

  it("si el modelo reescribe la línea que quedó cortada, no la duplica", () => {
    const prefix = `${F}css styles.css\nbody { margin: 0 }\nh1 { color: #92400e;`;
    const cont = `h1 { color: #92400e; font-size: 3rem; }\np { color: #78350f; }\n${F}`;
    const joined = joinContinuation(prefix, cont);
    expect(joined).toBe(`${F}css styles.css\nbody { margin: 0 }\nh1 { color: #92400e; font-size: 3rem; }\np { color: #78350f; }\n${F}`);
    expect((joined.match(/\{/g) ?? []).length).toBe((joined.match(/\}/g) ?? []).length);
  });

  it("descarta también varias líneas repetidas y la valla reabierta a la vez", () => {
    const prefix = `${F}js script.js\nconst a = 1;\nfunction hola() {\n  console.log("hi");`;
    const cont = `${F}js\nfunction hola() {\n  console.log("hi");\n}\n${F}`;
    expect(joinContinuation(prefix, cont)).toBe(`${F}js script.js\nconst a = 1;\nfunction hola() {\n  console.log("hi");\n}\n${F}`);
  });

  it("un solapamiento corto (<8 caracteres) no cuenta: se une por línea", () => {
    const prefix = `${F}css styles.css\na { x: 1 }\n}`;
    expect(joinContinuation(prefix, "}\nb { y: 2 }")).toBe(`${prefix}\n}\nb { y: 2 }`);
  });

  it("en prosa, si repite el final de la oración no la duplica", () => {
    expect(joinContinuation("Los beneficios principales son la velocidad y", "Los beneficios principales son la velocidad y la simpleza.")).toBe(
      "Los beneficios principales son la velocidad y la simpleza.",
    );
  });
});
