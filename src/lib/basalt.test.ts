import { describe, expect, it } from "vitest";
import { filterConversations, groupConversationsByDate, joinContinuation, type StoredConversation } from "./basalt";

const conv = (id: string, title: string, updatedAt = Date.now()): StoredConversation => ({ id, title, updatedAt, messages: [] });

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

describe("filterConversations", () => {
  const list = [
    conv("1", "Analiza este contrato de servicios"),
    conv("2", "Plan de mercadeo para la marca"),
    conv("3", "Hazme una landing para el gimnasio"),
  ];

  it("sin texto devuelve todo", () => {
    expect(filterConversations(list, "   ")).toHaveLength(3);
  });

  it("ignora acentos y mayúsculas", () => {
    expect(filterConversations(list, "MERCADÉO").map((c) => c.id)).toEqual(["2"]);
  });

  it("exige todas las palabras, en cualquier orden", () => {
    expect(filterConversations(list, "landing gimnasio").map((c) => c.id)).toEqual(["3"]);
    expect(filterConversations(list, "landing contrato")).toHaveLength(0);
  });
});

describe("groupConversationsByDate", () => {
  const now = new Date(2026, 9, 1, 15, 0); // 1 de octubre de 2026
  const at = (id: string, d: Date) => ({ id, title: id, updatedAt: d.getTime(), messages: [] });

  it("separa hoy, ayer, la semana y los meses anteriores", () => {
    const groups = groupConversationsByDate([
      at("hoy", new Date(2026, 9, 1, 9, 0)),
      at("ayer", new Date(2026, 8, 30, 23, 30)),
      at("semana", new Date(2026, 8, 27, 12, 0)),
      at("agosto", new Date(2026, 7, 3, 12, 0)),
      at("viejo", new Date(2025, 11, 24, 12, 0)),
    ], now);
    expect(groups.map((g) => g.label)).toEqual(["Hoy", "Ayer", "Últimos 7 días", "Agosto", "Diciembre 2025"]);
    expect(groups[0].items.map((c) => c.id)).toEqual(["hoy"]);
  });

  it("ordena de más nueva a más vieja dentro del grupo", () => {
    const groups = groupConversationsByDate([
      at("temprano", new Date(2026, 9, 1, 8, 0)),
      at("tarde", new Date(2026, 9, 1, 14, 0)),
    ], now);
    expect(groups[0].items.map((c) => c.id)).toEqual(["tarde", "temprano"]);
  });
});

describe("groupConversationsByDate con ancladas", () => {
  const now = new Date(2026, 9, 1, 15, 0);
  const at = (id: string, d: Date, pinned = false) => ({ id, title: id, updatedAt: d.getTime(), messages: [], pinned });

  it("las ancladas van en su propio grupo al principio, sin repetirse en su fecha", () => {
    const groups = groupConversationsByDate([
      at("hoy", new Date(2026, 9, 1, 9, 0)),
      at("vieja-anclada", new Date(2026, 5, 2, 9, 0), true),
      at("hoy-anclada", new Date(2026, 9, 1, 11, 0), true),
    ], now);
    expect(groups[0].label).toBe("Ancladas");
    expect(groups[0].pinned).toBe(true);
    expect(groups[0].items.map((c) => c.id)).toEqual(["hoy-anclada", "vieja-anclada"]);
    expect(groups.slice(1).flatMap((g) => g.items.map((c) => c.id))).toEqual(["hoy"]);
  });

  it("sin ancladas no aparece el grupo", () => {
    const groups = groupConversationsByDate([at("hoy", new Date(2026, 9, 1, 9, 0))], now);
    expect(groups.map((g) => g.label)).toEqual(["Hoy"]);
  });
});
