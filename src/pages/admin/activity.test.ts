import { describe, expect, it } from "vitest";
import { activityLabel, daysAgo, matchesActivity, neverUsed, sortUsers, summarizeActivity, usageHeadline, usageLine } from "./activity";
import type { AdminUser } from "./types";

const NOW = new Date(2026, 10, 20, 15, 0, 0); // 20 nov 2026, 3 p. m. hora local
const hace = (dias: number, hora = 10) => new Date(2026, 10, 20 - dias, hora, 0, 0).toISOString();

const user = (over: Partial<AdminUser>): AdminUser => ({
  user_id: over.email ?? "u", email: "a@example.com", display_name: null, credits_balance: 5,
  created_at: hace(40), last_sign_in: null, subscription_tier: "free", is_active: true, is_admin: false,
  last_active_at: null, messages: 0, chats: 0, images: 0, ...over,
});

describe("daysAgo / activityLabel", () => {
  it("cuenta días de calendario, no bloques de 24 horas", () => {
    // Ayer a las 11 p. m. son 16 horas, pero para quien mira la tabla fue "ayer".
    expect(daysAgo(hace(1, 23), NOW)).toBe(1);
    expect(daysAgo(hace(0, 1), NOW)).toBe(0);
  });

  it("dice hoy, ayer, días y meses; sin fecha, que no hay actividad", () => {
    expect(activityLabel(hace(0), NOW)).toBe("Hoy");
    expect(activityLabel(hace(1), NOW)).toBe("Ayer");
    expect(activityLabel(hace(9), NOW)).toBe("Hace 9 días");
    expect(activityLabel(hace(35), NOW)).toBe("Hace 1 mes");
    expect(activityLabel(hace(95), NOW)).toBe("Hace 3 meses");
    expect(activityLabel(null, NOW)).toBe("Sin actividad");
    expect(activityLabel("no es una fecha", NOW)).toBe("Sin actividad");
  });

  it("una fecha unos minutos adelantada (relojes distintos) cuenta como hoy, no como negativa", () => {
    expect(daysAgo(new Date(NOW.getTime() + 5 * 60_000).toISOString(), NOW)).toBe(0);
  });
});

describe("filtros de actividad", () => {
  const users = [
    user({ email: "hoy@x.co", last_active_at: hace(0), messages: 12, chats: 3 }),
    user({ email: "semana@x.co", last_active_at: hace(5), messages: 2, chats: 1 }),
    user({ email: "mes@x.co", last_active_at: hace(20), messages: 0, images: 1 }),
    user({ email: "viejo@x.co", last_active_at: hace(60), messages: 4, chats: 1 }),
    user({ email: "curioso@x.co", last_active_at: hace(3) }), // entró, nunca escribió
    user({ email: "fantasma@x.co" }),
  ];

  it("cada grupo incluye a los más recientes: hoy ⊂ 7 días ⊂ 30 días", () => {
    expect(summarizeActivity(users, NOW)).toEqual({ todos: 6, hoy: 1, "7d": 3, "30d": 4, "sin-uso": 2 });
  });

  it("'nunca lo usó' es no haber escrito NI generado una imagen, aunque haya entrado", () => {
    expect(users.filter(neverUsed).map((u) => u.email)).toEqual(["curioso@x.co", "fantasma@x.co"]);
    // Generó una imagen sin escribir en el chat: sí lo usó.
    expect(neverUsed(users[2])).toBe(false);
  });

  it("quien no tiene ninguna fecha de actividad no aparece en ningún grupo de fechas", () => {
    const fantasma = users[5];
    expect(["hoy", "7d", "30d"].some((f) => matchesActivity(fantasma, f as "hoy", NOW))).toBe(false);
    expect(matchesActivity(fantasma, "todos", NOW)).toBe(true);
  });
});

describe("sortUsers", () => {
  const a = user({ email: "a", last_active_at: hace(10), messages: 50, created_at: hace(90) });
  const b = user({ email: "b", last_active_at: hace(1), messages: 3, created_at: hace(5) });
  const c = user({ email: "c", last_active_at: null, messages: 0, created_at: hace(2) });

  it("por actividad: el más reciente arriba y quien nunca hizo nada al final", () => {
    expect(sortUsers([c, a, b], "actividad").map((u) => u.email)).toEqual(["b", "a", "c"]);
  });
  it("por mensajes y por registro", () => {
    expect(sortUsers([c, b, a], "mensajes").map((u) => u.email)).toEqual(["a", "b", "c"]);
    expect(sortUsers([a, b, c], "registro").map((u) => u.email)).toEqual(["c", "b", "a"]);
  });
  it("no toca la lista original", () => {
    const original = [c, a, b];
    sortUsers(original, "actividad");
    expect(original.map((u) => u.email)).toEqual(["c", "a", "b"]);
  });
});

describe("usageHeadline / usageLine", () => {
  it("singular y plural, y las imágenes solo si hay", () => {
    expect(usageLine(user({ messages: 1, chats: 1 }))).toBe("1 chat");
    expect(usageLine(user({ messages: 9, chats: 4, images: 1 }))).toBe("4 chats · 1 imagen");
    expect(usageLine(user({ messages: 9, chats: 2, images: 3 }))).toBe("2 chats · 3 imágenes");
    expect(usageHeadline(user({ messages: 1 }))).toEqual({ n: 1, label: "mensaje" });
    expect(usageHeadline(user({ messages: 23 }))).toEqual({ n: 23, label: "mensajes" });
  });

  it("quien solo generó imágenes no aparece como '0 mensajes': su dato son las imágenes", () => {
    const soloImagen = user({ messages: 0, chats: 0, images: 1 });
    expect(usageHeadline(soloImagen)).toEqual({ n: 1, label: "imagen" });
    expect(usageLine(soloImagen)).toBe("sin mensajes");
    expect(usageHeadline(user({ images: 4 }))).toEqual({ n: 4, label: "imágenes" });
  });
});
