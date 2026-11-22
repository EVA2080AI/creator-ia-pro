// @vitest-environment node
//
// El cron diario (api/cron/subscription-renewals.ts) como red de seguridad de los pagos:
// concilia lo que Bold ya cobró ANTES de mandar recordatorios o bajar planes. Postgres de
// verdad (PGlite + db/migrations), Bold y el correo simulados.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { encodePurchase } from "@/lib/bold";
import { billingProduct } from "@/lib/limits";

const state = vi.hoisted(() => ({
  db: null as unknown,
  emails: [] as Array<{ to: string; template: string }>,
  /** Se ejecuta cuando sale un correo: lo que pasa "mientras tanto" en una carrera. */
  onEmail: null as null | ((to: string) => Promise<void>),
}));

vi.mock("../../db/index.js", async () => {
  const schema = await vi.importActual<Record<string, unknown>>("../../db/schema/index.js");
  return { getDb: () => state.db, schema };
});
vi.mock("../../api/_lib/send-system-email.js", () => ({
  sendSystemEmail: async (o: { to: string; template: string }) => {
    state.emails.push({ to: o.to, template: o.template });
    await state.onEmail?.(o.to);
    return true;
  },
  emailLayout: (_t: string, content: string) => content,
  emailButton: (label: string) => label,
}));

import cron from "../../api/cron/subscription-renewals";

let pg: PGlite;
const q = <T = Record<string, unknown>>(text: string, params: unknown[] = []) => pg.query<T>(text, params).then((r) => r.rows);

async function addUser(id: string, o: { tier?: string; expiresInDays?: number | null; admin?: boolean; credits?: number } = {}) {
  await q(`INSERT INTO "user" (id, name, email, email_verified) VALUES ($1, $1, $2, true)`, [id, `${id}@example.com`]);
  await q(
    `INSERT INTO profile (user_id, credits_balance, subscription_tier, subscription_expires_at, is_admin)
     VALUES ($1, $2, $3, CASE WHEN $4::int IS NULL THEN NULL ELSE now()::timestamp + make_interval(days => $4::int) END, $5)`,
    [id, o.credits ?? 0, o.tier ?? "free", o.expiresInDays ?? null, o.admin ?? false],
  );
}
const addPending = (userId: string, packId: string, linkId: string, ageDays = 0) =>
  q(
    `INSERT INTO "transaction" (id, user_id, type, amount, description, created_at)
     VALUES ($1, $2, 'bold_pending', 0, $3, now()::timestamp - make_interval(days => $4::int))`,
    [crypto.randomUUID(), userId, encodePurchase(packId, linkId, billingProduct(packId)!.priceCop), ageDays],
  );
const profileOf = async (userId: string) =>
  (await q<{ credits: number; tier: string; dias: number | null }>(
    `SELECT credits_balance AS credits, subscription_tier AS tier,
            round(extract(epoch FROM (subscription_expires_at - now()::timestamp)) / 86400)::int AS dias
       FROM profile WHERE user_id = $1`,
    [userId],
  ))[0];

/** Bold responde por cada link el estado que se le indique; lo demás sigue ACTIVE. */
function stubBold(links: Record<string, { status: string; is_sandbox?: boolean } | "caído">) {
  const asked: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const id = url.split("/").pop()!;
    asked.push(id);
    const link = links[id] ?? { status: "ACTIVE" };
    if (link === "caído") return new Response("upstream error", { status: 502 });
    return new Response(JSON.stringify({ api_version: 1, id, total: 1, is_sandbox: false, ...link }), { status: 200 });
  }));
  return asked;
}

/** `null` = sin cabecera (un `undefined` tomaría el valor por defecto). */
async function run(authorization: string | null = "Bearer secreto-del-cron") {
  const out = { status: 0, json: null as null | Record<string, unknown> };
  const res = { status(code: number) { out.status = code; return res; }, json(j: Record<string, unknown>) { out.json = j; return res; } };
  await cron({ method: "GET", headers: authorization ? { authorization } : {} } as never, res as never);
  return out;
}

beforeAll(async () => {
  pg = new PGlite();
  const d = drizzle(pg);
  await migrate(d, { migrationsFolder: "db/migrations" });
  state.db = d;
}, 60_000);

beforeEach(async () => {
  await pg.exec(`TRUNCATE "transaction", profile, "user" CASCADE`);
  state.emails = [];
  state.onEmail = null;
  process.env.CRON_SECRET = "secreto-del-cron";
  process.env.BOLD_API_KEY = "llave-de-identidad-de-prueba";
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("cron diario: conciliación de pagos", () => {
  it("sin CRON_SECRET no corre, y con un secreto ajeno tampoco", async () => {
    await addUser("ana");
    await addPending("ana", "pack_200", "LNK_K0");
    const asked = stubBold({ LNK_K0: { status: "PAID" } });
    expect((await run("Bearer otro")).status).toBe(401);
    expect((await run(null)).status).toBe(401);
    delete process.env.CRON_SECRET;
    expect((await run()).status).toBe(503);
    expect((await run("Bearer undefined")).status).toBe(503);
    expect(asked).toEqual([]);
    expect((await profileOf("ana")).credits).toBe(0);
  });

  it("acredita lo que Bold ya cobró y deja quieto lo que no", async () => {
    await addUser("ana");
    await addUser("beto");
    await addUser("caro");
    await addPending("ana", "pack_1000", "LNK_K1", 1);
    await addPending("beto", "pack_200", "LNK_K2", 1);
    await addPending("caro", "pro", "LNK_K3", 2);
    stubBold({ LNK_K1: { status: "PAID" }, LNK_K2: { status: "PROCESSING" }, LNK_K3: { status: "EXPIRED" } });

    const r = await run();
    expect(r.status).toBe(200);
    expect(r.json).toMatchObject({ ok: true, reconciled: 1 });
    expect((await profileOf("ana")).credits).toBe(1_000);
    expect((await profileOf("beto")).credits).toBe(0);
    expect(await profileOf("caro")).toMatchObject({ credits: 0, tier: "free" });

    // Al día siguiente: lo acreditado no se vuelve a sumar.
    expect((await run()).json).toMatchObject({ reconciled: 0 });
    expect((await profileOf("ana")).credits).toBe(1_000);
  });

  it("quien renovó y no alcanzó a volver a la app NO baja a Free ni recibe el recordatorio", async () => {
    // Plan vencido hace 5 días (más que la gracia de 3) con una renovación ya pagada en Bold.
    await addUser("ana", { tier: "pro", expiresInDays: -5 });
    await addPending("ana", "pro", "LNK_K4", 1);
    // Y alguien que de verdad no renovó, para ver que la bajada sigue funcionando.
    await addUser("beto", { tier: "agencia", expiresInDays: -5 });
    stubBold({ LNK_K4: { status: "PAID" } });

    const r = await run();
    expect(r.json).toMatchObject({ reconciled: 1, downgraded: 1, remindersSent: 0 });
    expect(await profileOf("ana")).toEqual({ credits: 3_000, tier: "pro", dias: 30 });
    expect(await profileOf("beto")).toMatchObject({ tier: "free", dias: null });
    expect(state.emails).toEqual([{ to: "beto@example.com", template: "subscription_downgraded" }]);
  });

  it("un pago de prueba solo se concilia para un administrador", async () => {
    await addUser("ana");
    await addUser("jefe", { admin: true });
    await addPending("ana", "pyme", "LNK_K5");
    await addPending("jefe", "creador", "LNK_K6");
    stubBold({ LNK_K5: { status: "PAID", is_sandbox: true }, LNK_K6: { status: "PAID", is_sandbox: true } });
    expect((await run()).json).toMatchObject({ reconciled: 1 });
    expect(await profileOf("ana")).toMatchObject({ credits: 0, tier: "free" });
    expect(await profileOf("jefe")).toMatchObject({ credits: 1_000, tier: "creador" });
  });

  it("si Bold falla en una compra sigue con las demás, y el resto del cron corre igual", async () => {
    await addUser("ana");
    await addUser("beto");
    await addUser("caro", { tier: "pro", expiresInDays: 2 });
    await addPending("ana", "pack_200", "LNK_K7");
    await addPending("beto", "pack_200", "LNK_K8");
    const asked = stubBold({ LNK_K7: "caído", LNK_K8: { status: "PAID" } });
    const r = await run();
    expect(r.status).toBe(200);
    expect(asked.sort()).toEqual(["LNK_K7", "LNK_K8"]);
    expect(r.json).toMatchObject({ reconciled: 1, remindersSent: 1 });
    expect((await profileOf("ana")).credits).toBe(0);
    expect((await profileOf("beto")).credits).toBe(200);
    expect(state.emails).toEqual([{ to: "caro@example.com", template: "subscription_reminder" }]);
  });

  it("pregunta por compras de hasta 30 días (un link no vence), y no llama a Bold si no hay llave", async () => {
    await addUser("ana");
    await addPending("ana", "pack_200", "LNK_K9", 31);
    await addPending("ana", "pack_200", "LNK_K10", 12);
    await addPending("ana", "pack_200", "LNK_K11", 1);
    const asked = stubBold({ LNK_K10: { status: "PAID" } });
    expect((await run()).json).toMatchObject({ reconciled: 1, reconcileSkipped: 0 });
    expect(asked.sort()).toEqual(["LNK_K10", "LNK_K11"]);
    expect((await profileOf("ana")).credits).toBe(200);

    delete process.env.BOLD_API_KEY;
    asked.length = 0;
    expect((await run()).json).toMatchObject({ ok: true, reconciled: 0 });
    expect(asked).toEqual([]);
  });

  it("con decenas de intentos abandonados encima, la compra pagada más vieja igual se concilia", async () => {
    await addUser("ana");
    await addUser("beto");
    await addPending("beto", "pro", "LNK_PAGADA", 6);
    for (let i = 0; i < 40; i++) await addPending("ana", "pack_200", `LNK_ABANDONO${i}`, i % 5);
    const asked = stubBold({ LNK_PAGADA: { status: "PAID" } });
    expect((await run()).json).toMatchObject({ reconciled: 1, reconcileSkipped: 0 });
    expect(asked).toHaveLength(41);
    expect(await profileOf("beto")).toMatchObject({ credits: 3_000, tier: "pro" });
    expect((await profileOf("ana")).credits).toBe(0);
  });

  it("el recordatorio sale UNA vez por ciclo, no cada día", async () => {
    await addUser("ana", { tier: "pro", expiresInDays: 2 });
    stubBold({});
    expect((await run()).json).toMatchObject({ remindersSent: 1 });
    expect((await run()).json).toMatchObject({ remindersSent: 0 });
    expect((await run()).json).toMatchObject({ remindersSent: 0 });
    expect(state.emails).toEqual([{ to: "ana@example.com", template: "subscription_reminder" }]);
  });

  it("…y vuelve a salir en el ciclo siguiente, aunque nadie haya limpiado la marca", async () => {
    // Avisada hace 31 días (el ciclo anterior) y con un vencimiento nuevo dentro de 2 días.
    await addUser("ana", { tier: "pro", expiresInDays: 2 });
    await q(`UPDATE profile SET renewal_reminder_sent_at = now()::timestamp - interval '31 days' WHERE user_id = 'ana'`);
    stubBold({});
    expect((await run()).json).toMatchObject({ remindersSent: 1 });
  });

  it("si la renovación entra mientras el cron trabaja, NO baja el plan recién pagado", async () => {
    await addUser("ana", { tier: "agencia", expiresInDays: -5 });
    await addUser("beto", { tier: "pro", expiresInDays: -5 });
    stubBold({});
    // Mientras sale el primer correo de bajada, a la otra persona le entra su renovación.
    state.onEmail = async (to) => {
      const other = to.startsWith("ana") ? "beto" : "ana";
      await q(`UPDATE profile SET subscription_expires_at = now()::timestamp + interval '30 days' WHERE user_id = $1 AND subscription_tier <> 'free'`, [other]);
    };
    const r = await run();
    expect(r.json).toMatchObject({ downgraded: 1 });
    const tiers = [(await profileOf("ana")).tier, (await profileOf("beto")).tier].sort();
    expect(tiers).toHaveLength(2);
    expect(tiers.filter((t) => t === "free")).toHaveLength(1);
    // Un solo correo de bajada: a quien renovó no se le dice "bajamos tu plan".
    expect(state.emails.filter((e) => e.template === "subscription_downgraded")).toHaveLength(1);
    const renovada = (await profileOf("ana")).tier === "free" ? "beto" : "ana";
    expect((await profileOf(renovada)).dias).toBe(30);
    expect(await q(`SELECT 1 FROM "transaction" WHERE user_id = $1 AND description LIKE '%vencido%'`, [renovada])).toEqual([]);
  });

  it("un pago que Bold no marca como real ni de prueba no se concilia para un usuario cualquiera", async () => {
    await addUser("ana");
    await addPending("ana", "pyme", "LNK_K12");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ api_version: 1, total: 1, status: "PAID" }), { status: 200 })));
    expect((await run()).json).toMatchObject({ reconciled: 0 });
    expect(await profileOf("ana")).toMatchObject({ credits: 0, tier: "free" });
  });
});
