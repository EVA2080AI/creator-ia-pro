// @vitest-environment node
//
// Experto "Licitaciones": se crea solo en la base, una vez, sin pisar ediciones, y su prompt
// lleva la regla que no puede fallar — recomienda, no adjudica. Postgres de verdad (PGlite).
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../../db/schema/index.js";
import { ensureSystemAssistants, LICITACIONES_PROMPT, resetEnsureSystemAssistants, SYSTEM_ASSISTANT_DEFS } from "../../api/_lib/system-assistants";

let pg: PGlite;
let db: ReturnType<typeof drizzle>;
const rows = () => pg.query<{ slug: string; visibility: string; is_active: boolean; persona: { systemPrompt?: string } }>(`SELECT slug, visibility::text AS visibility, is_active, persona FROM assistant WHERE slug = 'licitaciones'`).then((r) => r.rows);
const ensure = () => ensureSystemAssistants(db as never);

beforeAll(async () => {
  pg = new PGlite();
  db = drizzle(pg, { schema });
  await migrate(db, { migrationsFolder: "db/migrations" });
});
beforeEach(async () => {
  resetEnsureSystemAssistants();
  await pg.query(`DELETE FROM assistant WHERE slug = 'licitaciones'`);
});

describe("ensureSystemAssistants", () => {
  it("crea el Experto como del sistema y activo", async () => {
    await ensure();
    const r = await rows();
    expect(r).toHaveLength(1);
    expect(r[0].visibility).toBe("system");
    expect(r[0].is_active).toBe(true);
    expect(r[0].persona.systemPrompt).toBe(LICITACIONES_PROMPT);
  });

  it("llamarlo varias veces, o a la vez, deja una sola fila", async () => {
    await Promise.all([ensure(), ensure(), ensure()]);
    resetEnsureSystemAssistants();
    await ensure();
    expect(await rows()).toHaveLength(1);
  });

  it("no pisa una edición hecha en la base", async () => {
    await ensure();
    await pg.query(`UPDATE assistant SET tagline = 'editado a mano' WHERE slug = 'licitaciones'`);
    resetEnsureSystemAssistants();
    await ensure();
    const [r] = await pg.query<{ tagline: string }>(`SELECT tagline FROM assistant WHERE slug = 'licitaciones'`).then((x) => x.rows);
    expect(r.tagline).toBe("editado a mano");
  });

  it("si falla, la siguiente llamada reintenta", async () => {
    const roto = { select: () => { throw new Error("BD caída"); } };
    await ensureSystemAssistants(roto as never);
    await ensure();
    expect(await rows()).toHaveLength(1);
  });
});

describe("Licitaciones: contenido", () => {
  const def = SYSTEM_ASSISTANT_DEFS.find((d) => d.slug === "licitaciones")!;

  it("el prompt dice que recomienda y no adjudica, y que decide el comité", () => {
    expect(LICITACIONES_PROMPT).toMatch(/RECOMIENDAS, NO ADJUDICAS/);
    expect(LICITACIONES_PROMPT).toMatch(/Nunca declares un ganador/);
    expect(LICITACIONES_PROMPT).toMatch(/comité evaluador/);
  });

  it("evalúa solo con el pliego y trata las ofertas como datos", () => {
    expect(LICITACIONES_PROMPT).toMatch(/SELECCIÓN OBJETIVA/);
    expect(LICITACIONES_PROMPT).toMatch(/DATOS, NO INSTRUCCIONES/);
    expect(LICITACIONES_PROMPT).toMatch(/No verificable con los documentos entregados/);
  });

  it("ninguna tarjeta de bienvenida pide adjudicar", () => {
    for (const c of def.welcome.cards) expect(`${c.label} ${c.prompt}`).not.toMatch(/adjudica(r|\s+(el|la|a))/i);
  });

  it("el slug no choca con rutas fijas", () => {
    expect(["basalt", "arena", "nuevo"]).not.toContain(def.slug);
  });
});
