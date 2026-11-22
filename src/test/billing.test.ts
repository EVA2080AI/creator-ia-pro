// @vitest-environment node
//
// La pasarela de pagos (Bold) de punta a punta, sin red y sin tocar la base real:
//  · el formato de Bold (src/lib/bold.ts) contra los ejemplos de su documentación;
//  · la acreditación (api/_lib/billing.ts) contra un Postgres DE VERDAD — PGlite con las
//    mismas migraciones de db/migrations — porque lo que protege la plata es una sentencia
//    SQL, y un doble de la base no prueba una sentencia SQL;
//  · los tres handlers (cobro, aviso, confirmación) con la sesión simulada y `fetch`
//    respondiendo como Bold.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { Readable } from "node:stream";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { billingProduct, CREDIT_PACK_CREDITS, CREDIT_PACK_PRICES_COP, PLAN_MONTHLY_CREDITS, PLAN_PRICES_COP } from "@/lib/limits";
import { decodePurchase, encodePurchase, isLinkId, isTestPurchase, parseLink, parseNotification, purchaseDescription } from "@/lib/bold";
import { CREDIT_PACKS } from "@/lib/credit-packs";
import { CREDIT_PLANS } from "@/services/billing-service";

const state = vi.hoisted(() => ({
  db: null as unknown,
  pg: null as unknown,
  user: null as null | { userId: string; email: string; name: string },
}));

vi.mock("../../api/_lib/session.js", () => ({
  getSessionUser: async () => state.user,
  getProfile: async (userId: string) => {
    const r = await (state.pg as PGlite).query<{ is_admin: boolean }>("SELECT is_admin FROM profile WHERE user_id = $1", [userId]);
    return r.rows[0] ? { isAdmin: r.rows[0].is_admin } : null;
  },
}));
vi.mock("../../db/index.js", async () => {
  const schema = await vi.importActual<Record<string, unknown>>("../../db/schema/index.js");
  return { getDb: () => state.db, schema };
});

import { verifySignature } from "../../api/_lib/bold";
import { findPurchaseByLink, justApproved, pendingPurchases, recentPendingCount, settlePurchase, userPendings, type Exec } from "../../api/_lib/billing";
import checkout from "../../api/billing/checkout";
import webhook from "../../api/billing/webhook";
import confirm, { resetConfirmThrottle } from "../../api/billing/confirm";

const SECRET = "llave-secreta-de-prueba";
const sign = (body: string, secret = SECRET) => createHmac("sha256", secret).update(Buffer.from(body, "utf8").toString("base64")).digest("hex");

/** Un aviso con la forma que documenta Bold (developers.bold.co/webhook). */
const notice = (reference: string, type = "SALE_APPROVED", total = 25_000) => ({
  id: "191850cb-00f8-4f64-aa5f-4975848e9428",
  type,
  subject: "CNPCGSPS2WBA8",
  source: "/payments/links",
  spec_version: "1.0",
  time: 1_719_242_727_607,
  data: {
    payment_id: "CNPCGSPS2WBA8",
    merchant_id: "CKKA859CGE",
    created_at: "2026-11-22T10:15:00-05:00",
    amount: { currency: "COP", total, taxes: [], tip: 0 },
    user_id: "comprador",
    metadata: { reference },
    payment_method: "CARD_WEB",
    integration: "LINK",
  },
  datacontenttype: "application/json",
});

let pg: PGlite;
let db: Exec;
const q = <T = Record<string, unknown>>(text: string, params: unknown[] = []) => pg.query<T>(text, params).then((r) => r.rows);

async function addUser(id: string, o: { credits?: number; tier?: string; expiresInDays?: number | null; admin?: boolean; profile?: boolean } = {}) {
  await q(`INSERT INTO "user" (id, name, email, email_verified) VALUES ($1, $1, $2, true)`, [id, `${id}@example.com`]);
  if (o.profile === false) return;
  await q(
    `INSERT INTO profile (user_id, credits_balance, subscription_tier, subscription_expires_at, renewal_reminder_sent_at, is_admin)
     VALUES ($1, $2, $3, CASE WHEN $4::int IS NULL THEN NULL ELSE now()::timestamp + make_interval(days => $4::int) END, now()::timestamp, $5)`,
    [id, o.credits ?? 5, o.tier ?? "free", o.expiresInDays ?? null, o.admin ?? false],
  );
}

async function addPurchase(userId: string, packId: string, linkId: string, o: { approved?: boolean; ageDays?: number; amountCop?: number | null } = {}) {
  const amount = o.amountCop === undefined ? billingProduct(packId)?.priceCop ?? 1 : o.amountCop;
  const description = amount === null ? `${packId}|${linkId}` : encodePurchase(packId, linkId, amount);
  const id = crypto.randomUUID();
  await q(
    `INSERT INTO "transaction" (id, user_id, type, amount, description, created_at)
     VALUES ($1, $2, $3::transaction_type, 0, $4, now()::timestamp - make_interval(days => $5::int))`,
    [id, userId, o.approved ? "bold_approved" : "bold_pending", description, o.ageDays ?? 0],
  );
  return id;
}

const profileOf = async (userId: string) =>
  (await q<{ credits: number; tier: string; dias: number | null; avisado: boolean }>(
    `SELECT credits_balance AS credits, subscription_tier AS tier,
            round(extract(epoch FROM (subscription_expires_at - now()::timestamp)) / 86400)::int AS dias,
            renewal_reminder_sent_at IS NOT NULL AS avisado
       FROM profile WHERE user_id = $1`,
    [userId],
  ))[0];
const txOf = (userId: string) =>
  q<{ type: string; amount: number; description: string }>(`SELECT type::text AS type, amount, description FROM "transaction" WHERE user_id = $1 ORDER BY type::text, description`, [userId]);

/** Llama a un handler de Vercel con lo mínimo de `req`/`res`. `raw` es el cuerpo sin parsear (webhook). */
async function call(handler: (req: never, res: never) => unknown, o: { method?: string; body?: unknown; raw?: string; headers?: Record<string, string> } = {}) {
  const out = { status: 0, json: null as null | Record<string, unknown>, text: "" };
  const res = {
    status(code: number) { out.status = code; return res; },
    json(j: Record<string, unknown>) { out.json = j; return res; },
    end(text?: string) { out.text = text ?? ""; return res; },
    setHeader() { return res; },
  };
  const req = Object.assign(Readable.from(o.raw === undefined ? [] : [Buffer.from(o.raw, "utf8")]), {
    method: o.method ?? "POST",
    headers: o.headers ?? {},
    body: o.body,
  });
  await handler(req as never, res as never);
  return out;
}

/**
 * `fetch` que responde como Bold. Devuelve las llamadas recibidas. `link` es la respuesta de
 * cualquier consulta de estado; `links` la fija por id ("caído" = Bold no responde por ese).
 */
function stubBold(o: { link?: Record<string, unknown>; links?: Record<string, Record<string, unknown> | "caído">; create?: Record<string, unknown>; status?: number } = {}) {
  const calls: Array<{ url: string; method: string; auth: string; body: Record<string, unknown> | null }> = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: { method?: string; headers?: Record<string, string>; body?: string }) => {
    calls.push({ url, method: init.method ?? "GET", auth: init.headers?.Authorization ?? "", body: init.body ? JSON.parse(init.body) : null });
    if (init.method === "POST") {
      return new Response(JSON.stringify(o.create ?? { payload: { payment_link: "LNK_NUEVO123", url: "https://checkout.bold.co/LNK_NUEVO123" }, errors: [] }), { status: o.status ?? 200 });
    }
    const one = o.links?.[url.split("/").pop()!];
    if (one === "caído") return new Response("upstream error", { status: 502 });
    return new Response(JSON.stringify(one ?? o.link ?? { api_version: 1, id: "LNK_X", total: 25_000, status: "ACTIVE", is_sandbox: false }), { status: o.status ?? 200 });
  }));
  return calls;
}

beforeAll(async () => {
  pg = new PGlite();
  const d = drizzle(pg);
  await migrate(d, { migrationsFolder: "db/migrations" });
  db = d as unknown as Exec;
  state.db = d;
  state.pg = pg;
}, 60_000);

beforeEach(async () => {
  await pg.exec(`TRUNCATE "transaction", profile, "user" CASCADE`);
  state.user = { userId: "ana", email: "ana@example.com", name: "Ana" };
  resetConfirmThrottle();
  process.env.BOLD_API_KEY = "llave-de-identidad-de-prueba";
  process.env.BOLD_WEBHOOK_SECRET = SECRET;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("catálogo: qué se puede comprar", () => {
  it("planes y recargas salen de un solo lugar, con precio y créditos", () => {
    expect(billingProduct("pro")).toEqual({ id: "pro", priceCop: 349_900, credits: 3_000, isPlan: true });
    expect(billingProduct("pack_200")).toEqual({ id: "pack_200", priceCop: 25_000, credits: 200, isPlan: false });
  });

  it("no se puede comprar el plan gratis, ni un id inventado, ni una propiedad de Object", () => {
    for (const id of ["free", "empresarial", "", "constructor", "toString", "__proto__", null, undefined, 7, { id: "pro" }]) {
      expect(billingProduct(id)).toBeNull();
    }
  });

  it("lo que muestra /pricing es lo que se cobra y se acredita", () => {
    const digits = (s: string) => Number(s.replace(/\D/g, ""));
    for (const pack of CREDIT_PACKS) {
      expect(CREDIT_PACK_PRICES_COP[pack.id], pack.id).toBe(digits(pack.price));
      expect(CREDIT_PACK_CREDITS[pack.id], pack.id).toBe(pack.credits_amount);
    }
    for (const plan of CREDIT_PLANS) {
      expect(PLAN_PRICES_COP[plan.id], plan.id).toBe(digits(plan.price_display));
      expect(PLAN_MONTHLY_CREDITS[plan.id], plan.id).toBe(plan.credits_amount);
    }
    expect(Object.keys(CREDIT_PACK_CREDITS).sort()).toEqual(Object.keys(CREDIT_PACK_PRICES_COP).sort());
  });

  it("la descripción que ve el comprador en Bold cabe en sus 100 caracteres", () => {
    expect(purchaseDescription(billingProduct("pyme")!)).toBe("Creator IA Pro · Plan Pyme · 30 días · 20.000 créditos");
    expect(purchaseDescription(billingProduct("pack_1000")!)).toBe("Creator IA Pro · Recarga de 1.000 créditos");
    for (const id of [...Object.keys(CREDIT_PACK_PRICES_COP), "creador", "pro", "agencia", "pyme"]) {
      const d = purchaseDescription(billingProduct(id)!);
      expect(d.length).toBeGreaterThanOrEqual(2);
      expect(d.length).toBeLessThanOrEqual(100);
    }
  });
});

describe("formato de Bold", () => {
  it("la compra pendiente guarda producto, link y lo cobrado", () => {
    expect(encodePurchase("pro", "LNK_ABC123", 349_900)).toBe("pro|LNK_ABC123|349900");
    expect(decodePurchase("pro|LNK_ABC123|349900")).toEqual({ packId: "pro", linkId: "LNK_ABC123", amountCop: 349_900 });
    // Formato anterior, sin monto: sigue leyéndose.
    expect(decodePurchase("pack_200|LNK_VIEJO")).toEqual({ packId: "pack_200", linkId: "LNK_VIEJO", amountCop: null });
    // Lo que usa el panel financiero para saber qué se vendió no cambia.
    expect("pro|LNK_ABC123|349900".split("|")[0]).toBe("pro");
  });

  it("una descripción que no es una compra no se confunde con una", () => {
    for (const d of [null, undefined, "", "Plan activado: pro (Bold)", "pro|", "pro|no-es-un-link", "|LNK_ABC"]) {
      expect(decodePurchase(d)).toBeNull();
    }
  });

  it("un id de link empieza por LNK_ y no trae comodines", () => {
    expect(isLinkId("LNK_H7S4XXXX")).toBe(true);
    for (const v of ["|", "%", "_", "LNK_", "LNK_a|b", "LNK_%", "pack_200", "lnk_abc", "", null, 5]) expect(isLinkId(v)).toBe(false);
  });

  it("lee el aviso real: tipo en `type`, referencia en data.metadata.reference, monto en data.amount.total", () => {
    expect(parseNotification(notice("LNK_ABC123", "SALE_APPROVED", 349_900))).toEqual({
      type: "SALE_APPROVED", reference: "LNK_ABC123", paymentId: "CNPCGSPS2WBA8", totalCop: 349_900,
    });
  });

  it("el formato que esperaba el receptor anterior NO es un aviso de Bold", () => {
    expect(parseNotification({ data: { reference: "LNK_ABC123", status: "APPROVED" } })).toBeNull();
    expect(parseNotification({ reference: "LNK_ABC123", status: "PAID" })).toBeNull();
    for (const p of [null, "texto", 3, [], {}]) expect(parseNotification(p)).toBeNull();
  });

  it("lee el estado de un link, plano o dentro de payload", () => {
    expect(parseLink({ api_version: 1, id: "LNK_X", total: 10_000, status: "PAID", is_sandbox: false })).toEqual({ status: "PAID", totalCop: 10_000, isSandbox: false });
    expect(parseLink({ payload: { status: "processing", total: 10_000, is_sandbox: true } })).toEqual({ status: "PROCESSING", totalCop: 10_000, isSandbox: true });
    expect(parseLink({ payload: { payment_link: "LNK_X", url: "https://checkout.bold.co/LNK_X" } })).toBeNull();
    expect(parseLink(null)).toBeNull();
  });

  it("si Bold no dice si el pago es de prueba, NO se da por real", () => {
    expect(parseLink({ status: "PAID", total: 1 })?.isSandbox).toBeNull();
    expect(parseLink({ status: "PAID", total: 1, is_sandbox: "false" })?.isSandbox).toBeNull();
    expect(parseLink({ status: "PAID", total: 1, isSandbox: false })?.isSandbox).toBeNull();
  });

  it("una compra de prueba queda marcada y el panel financiero la reconoce", () => {
    expect(isTestPurchase("pro|LNK_ABC123|349900|prueba")).toBe(true);
    expect(isTestPurchase("pro|LNK_ABC123|349900")).toBe(false);
    expect(isTestPurchase("pro|LNK_ABC123")).toBe(false);
    expect(isTestPurchase(null)).toBe(false);
    // La marca no estorba para leer la compra.
    expect(decodePurchase("pro|LNK_ABC123|349900|prueba")).toEqual({ packId: "pro", linkId: "LNK_ABC123", amountCop: 349_900 });
  });

  it("la firma es HMAC-SHA256 del cuerpo en base64, en hexadecimal", () => {
    const body = JSON.stringify(notice("LNK_ABC123"));
    expect(verifySignature(body, sign(body), SECRET)).toBe(true);
    expect(verifySignature(body, sign(body).toUpperCase(), SECRET)).toBe(true);
    expect(verifySignature(body + " ", sign(body), SECRET)).toBe(false);
    expect(verifySignature(body, sign(body, "otra-llave"), SECRET)).toBe(false);
    expect(verifySignature(body, null, SECRET)).toBe(false);
    expect(verifySignature(body, "abc", SECRET)).toBe(false);
  });

  it("una llave vacía nunca valida (Bold firma así en modo de pruebas)", () => {
    const body = JSON.stringify(notice("LNK_ABC123"));
    expect(verifySignature(body, sign(body, ""), "")).toBe(false);
  });
});

describe("acreditar una compra (SQL real)", () => {
  it("una recarga suma los créditos y no toca el plan", async () => {
    await addUser("ana", { credits: 5 });
    await addPurchase("ana", "pack_1000", "LNK_R1");
    const purchase = (await findPurchaseByLink(db, "LNK_R1"))!;
    expect(purchase).toMatchObject({ userId: "ana", packId: "pack_1000", approved: false, amountCop: 90_000 });

    expect(await settlePurchase(db, purchase)).toEqual({ status: "credited", userId: "ana", packId: "pack_1000", credits: 1_000, isPlan: false, balance: 1_005 });
    expect(await profileOf("ana")).toEqual({ credits: 1_005, tier: "free", dias: null, avisado: true });
    expect(await txOf("ana")).toEqual([{ type: "bold_approved", amount: 1_000, description: "pack_1000|LNK_R1|90000" }]);
  });

  it("un plan suma los créditos, activa el plan 30 días y limpia el recordatorio", async () => {
    await addUser("ana", { credits: 5 });
    await addPurchase("ana", "pro", "LNK_P1");
    const result = await settlePurchase(db, (await findPurchaseByLink(db, "LNK_P1"))!);
    expect(result).toMatchObject({ status: "credited", credits: 3_000, isPlan: true, balance: 3_005 });
    expect(await profileOf("ana")).toEqual({ credits: 3_005, tier: "pro", dias: 30, avisado: false });
    expect(await txOf("ana")).toEqual([
      { type: "bold_approved", amount: 3_000, description: "pro|LNK_P1|349900" },
      { type: "subscription_change", amount: 0, description: "Plan activado: pro (Bold)" },
    ]);
  });

  it("renovar antes de que venza no pierde los días que quedaban", async () => {
    await addUser("ana", { tier: "pro", expiresInDays: 10 });
    await addPurchase("ana", "pro", "LNK_P2");
    await settlePurchase(db, (await findPurchaseByLink(db, "LNK_P2"))!);
    expect((await profileOf("ana")).dias).toBe(40);
  });

  it("un plan vencido arranca los 30 días desde hoy", async () => {
    await addUser("ana", { tier: "pro", expiresInDays: -5 });
    await addPurchase("ana", "pro", "LNK_P3");
    await settlePurchase(db, (await findPurchaseByLink(db, "LNK_P3"))!);
    expect((await profileOf("ana")).dias).toBe(30);
  });

  it("acreditar dos veces la misma compra suma UNA vez", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pro", "LNK_D1");
    const purchase = (await findPurchaseByLink(db, "LNK_D1"))!;
    expect((await settlePurchase(db, purchase)).status).toBe("credited");
    // La misma copia "pendiente" en memoria (un aviso repetido que leyó la fila antes): no vuelve a sumar.
    expect((await settlePurchase(db, purchase)).status).toBe("already");
    expect((await settlePurchase(db, (await findPurchaseByLink(db, "LNK_D1"))!)).status).toBe("already");
    expect(await profileOf("ana")).toMatchObject({ credits: 3_000, dias: 30 });
    expect((await txOf("ana")).filter((t) => t.type === "subscription_change")).toHaveLength(1);
  });

  it("dos avisos a la vez: uno acredita y el otro no", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pack_2000", "LNK_C1");
    const purchase = (await findPurchaseByLink(db, "LNK_C1"))!;
    const results = await Promise.all([settlePurchase(db, purchase), settlePurchase(db, purchase), settlePurchase(db, purchase)]);
    expect(results.map((r) => r.status).sort()).toEqual(["already", "already", "credited"]);
    expect((await profileOf("ana")).credits).toBe(2_000);
  });

  it("la referencia tiene que ser EXACTAMENTE el link: nada de coincidencias parciales", async () => {
    await addUser("ana");
    await addPurchase("ana", "pack_200", "LNK_SECRETO99");
    for (const ref of ["|", "%", "_", "pack_200", "LNK", "LNK_", "LNK_SECRETO9", "LNK_SECRETO999", "LNK_SECRETO__", "LNK_%", "", null, undefined, 12]) {
      expect(await findPurchaseByLink(db, ref), String(ref)).toBeNull();
    }
    expect(await findPurchaseByLink(db, "LNK_SECRETO99")).not.toBeNull();
  });

  it("una cuenta sin perfil no queda 'aprobada' sin créditos: la compra sigue pendiente", async () => {
    await addUser("sinperfil", { profile: false });
    await addPurchase("sinperfil", "pack_200", "LNK_SP1");
    const result = await settlePurchase(db, (await findPurchaseByLink(db, "LNK_SP1"))!);
    expect(result.status).toBe("invalid");
    expect((await txOf("sinperfil"))[0]).toMatchObject({ type: "bold_pending", amount: 0 });
  });

  it("un producto que ya no existe no se acredita", async () => {
    await addUser("ana", { credits: 5 });
    await addPurchase("ana", "pack_retirado", "LNK_OLD1", { amountCop: 1 });
    expect((await settlePurchase(db, (await findPurchaseByLink(db, "LNK_OLD1"))!)).status).toBe("invalid");
    expect((await profileOf("ana")).credits).toBe(5);
  });

  it("las pendientes de un usuario: suyas, del producto pedido, de los últimos 30 días y varias", async () => {
    await addUser("ana");
    await addUser("beto");
    await addPurchase("beto", "pro", "LNK_BETO");
    expect(await userPendings(db, "ana")).toEqual([]);
    await addPurchase("ana", "pro", "LNK_VIEJA", { ageDays: 31 });
    await addPurchase("ana", "pro", "LNK_YA", { approved: true });
    expect(await userPendings(db, "ana")).toEqual([]);
    await addPurchase("ana", "pack_200", "LNK_A3", { ageDays: 9 });
    await addPurchase("ana", "pack_200", "LNK_A2", { ageDays: 2 });
    await addPurchase("ana", "pro", "LNK_A1", { ageDays: 1 });
    expect((await userPendings(db, "ana")).map((p) => p.linkId)).toEqual(["LNK_A1", "LNK_A2", "LNK_A3"]);
    expect((await userPendings(db, "ana", "pack_200")).map((p) => p.linkId)).toEqual(["LNK_A2", "LNK_A3"]);
    expect(await userPendings(db, "ana", "pyme")).toEqual([]);
    expect((await userPendings(db, "ana", undefined, 2)).map((p) => p.linkId)).toEqual(["LNK_A1", "LNK_A2"]);
  });

  it("'recién aprobada' es una compra del usuario acreditada hace minutos, no la de ayer", async () => {
    await addUser("ana");
    await addUser("beto");
    await addPurchase("beto", "pro", "LNK_BETO2", { approved: true });
    await addPurchase("ana", "pro", "LNK_AYER", { approved: true, ageDays: 1 });
    expect(await justApproved(db, "ana")).toBeNull();
    await addPurchase("ana", "pack_200", "LNK_HOY", { approved: true });
    expect((await justApproved(db, "ana"))?.linkId).toBe("LNK_HOY");
    expect(await justApproved(db, "ana", "pro")).toBeNull();
  });

  it("una compra de prueba acreditada queda marcada en la fila", async () => {
    await addUser("ana", { admin: true });
    await addPurchase("ana", "creador", "LNK_TEST1");
    expect((await settlePurchase(db, (await findPurchaseByLink(db, "LNK_TEST1"))!, { test: true })).status).toBe("credited");
    const row = (await txOf("ana")).find((t) => t.type === "bold_approved")!;
    expect(row.description).toBe("creador|LNK_TEST1|149900|prueba");
    expect(isTestPurchase(row.description)).toBe(true);
    // Y sigue encontrándose por su link (un aviso repetido responde "ya estaba").
    expect((await settlePurchase(db, (await findPurchaseByLink(db, "LNK_TEST1"))!)).status).toBe("already");
  });

  it("cuenta los links de la última hora y lista las pendientes para conciliar", async () => {
    await addUser("ana", { admin: true });
    await addUser("beto");
    await addPurchase("ana", "pack_200", "LNK_H1");
    await addPurchase("ana", "pack_200", "LNK_H2");
    await addPurchase("ana", "pack_200", "LNK_H3", { approved: true });
    await addPurchase("beto", "pro", "LNK_B1", { ageDays: 2 });
    await addPurchase("beto", "pro", "LNK_B2", { ageDays: 31 });
    expect(await recentPendingCount(db, "ana")).toBe(2);
    expect(await recentPendingCount(db, "beto")).toBe(0);
    const pend = await pendingPurchases(db);
    expect(pend.map((p) => [p.linkId, p.isAdmin]).sort()).toEqual([["LNK_B1", false], ["LNK_H1", true], ["LNK_H2", true]]);
  });
});

describe("POST /api/billing/checkout", () => {
  it("sin sesión no hay link", async () => {
    state.user = null;
    const calls = stubBold();
    expect((await call(checkout, { body: { packId: "pro" } })).status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  it("un producto que no existe se rechaza sin llamar a Bold", async () => {
    await addUser("ana");
    const calls = stubBold();
    for (const packId of ["free", "constructor", "pack_9999", undefined]) {
      expect((await call(checkout, { body: { packId } })).status).toBe(400);
    }
    expect(calls).toHaveLength(0);
  });

  it("sin la llave de Bold avisa que los pagos no están habilitados", async () => {
    await addUser("ana");
    delete process.env.BOLD_API_KEY;
    const r = await call(checkout, { body: { packId: "pro" } });
    expect(r.json).toMatchObject({ ok: false, code: "NOT_CONFIGURED" });
  });

  it("cobra el precio del servidor y deja la compra pendiente a nombre de la sesión", async () => {
    await addUser("ana");
    const calls = stubBold();
    const r = await call(checkout, { body: { packId: "pro", amount: 1, userId: "beto", email: "otro@example.com" } });
    expect(r.json).toEqual({ ok: true, url: "https://checkout.bold.co/LNK_NUEVO123" });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ url: "https://integrations.api.bold.co/online/link/v1", method: "POST", auth: "x-api-key llave-de-identidad-de-prueba" });
    expect(calls[0].body).toEqual({
      amount_type: "CLOSE",
      amount: { currency: "COP", tip_amount: 0, total_amount: 349_900 },
      description: "Creator IA Pro · Plan Pro · 30 días · 3.000 créditos",
      callback_url: "https://creator-ia.com/pricing?status=payment_returned&pack=pro",
    });
    // Sin `payer_email`: con ese campo Bold le manda el cobro por correo a esa dirección, y el
    // correo de una cuenta no está verificado (cualquiera podría hacérselo llegar a un tercero).
    expect(JSON.stringify(calls[0].body)).not.toContain("ana@example.com");
    // Sin `reference`: la referencia del aviso tiene que ser el id del link.
    expect(calls[0].body).not.toHaveProperty("reference");
    expect(await txOf("ana")).toEqual([{ type: "bold_pending", amount: 0, description: "pro|LNK_NUEVO123|349900" }]);
  });

  it("si Bold falla no queda ninguna compra pendiente", async () => {
    await addUser("ana");
    stubBold({ status: 401, create: { errors: [{ detail: "llave inválida" }] } });
    const r = await call(checkout, { body: { packId: "pro" } });
    expect(r.status).toBe(502);
    expect(JSON.stringify(r.json)).not.toContain("llave inválida");
    expect(await txOf("ana")).toEqual([]);
  });

  it("si Bold devuelve un id de link que después no se sabría leer, falla a la vista", async () => {
    await addUser("ana");
    stubBold({ create: { payload: { payment_link: "PAGO 123|raro", url: "https://checkout.bold.co/x" }, errors: [] } });
    const r = await call(checkout, { body: { packId: "pro" } });
    expect(r.status).toBe(502);
    expect(await txOf("ana")).toEqual([]);
  });

  it("si la compra no se puede guardar, el link no se le entrega a nadie", async () => {
    // La sesión dice un usuario que no existe en la base: guardar la fila falla (clave foránea).
    state.user = { userId: "fantasma", email: "fantasma@example.com", name: "Fantasma" };
    const calls = stubBold();
    const r = await call(checkout, { body: { packId: "pro" } });
    expect(r.status).toBe(502);
    expect(JSON.stringify(r.json)).not.toContain("checkout.bold.co");
    expect(calls).toHaveLength(1);
    expect(await q(`SELECT 1 FROM "transaction"`)).toEqual([]);
  });

  it("no deja abrir pagos sin fin: tope por hora", async () => {
    await addUser("ana");
    for (let i = 0; i < 8; i++) await addPurchase("ana", "pack_200", `LNK_T${i}`);
    const calls = stubBold();
    const r = await call(checkout, { body: { packId: "pack_200" } });
    expect(r.status).toBe(429);
    expect(calls).toHaveLength(0);
  });
});

describe("POST /api/billing/webhook", () => {
  const send = (payload: unknown, o: { signature?: string | null; secret?: string } = {}) => {
    const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
    const signature = o.signature === undefined ? sign(raw, o.secret ?? SECRET) : o.signature;
    return call(webhook, { raw, headers: signature === null ? {} : { "x-bold-signature": signature } });
  };

  it("sin el secreto configurado no procesa NADA, ni siquiera un aviso bien formado", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pyme", "LNK_W0");
    delete process.env.BOLD_WEBHOOK_SECRET;
    for (const signature of [null, "", sign(JSON.stringify(notice("LNK_W0")), "")]) {
      expect((await send(notice("LNK_W0"), { signature })).status).toBe(503);
    }
    process.env.BOLD_WEBHOOK_SECRET = "";
    expect((await send(notice("LNK_W0"), { secret: "" })).status).toBe(503);
    expect((await profileOf("ana")).credits).toBe(0);
  });

  it("sin firma o con firma ajena responde 401 y no acredita", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pyme", "LNK_W1");
    expect((await send(notice("LNK_W1"), { signature: null })).status).toBe(401);
    expect((await send(notice("LNK_W1"), { secret: "otra-llave" })).status).toBe(401);
    expect((await send(notice("LNK_W1"), { secret: "" })).status).toBe(401);
    expect((await profileOf("ana")).credits).toBe(0);
  });

  it("un pago aprobado y firmado acredita la compra", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "agencia", "LNK_W2");
    const r = await send(notice("LNK_W2", "SALE_APPROVED", 699_900));
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ ok: true, status: "credited" });
    expect(await profileOf("ana")).toMatchObject({ credits: 8_000, tier: "agencia", dias: 30 });
  });

  it("referencia ajena con monto menor: alguien crea un link de $1.000 con la referencia de su compra de Pyme", async () => {
    // La llave de identidad con la que se crean links es pública según Bold, y la referencia
    // la elige quien crea el link. El aviso llega BIEN firmado, pero no paga lo que se cobró.
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pyme", "LNK_W7");
    for (const total of [1_000, 1_499_899, 0]) {
      const r = await send(notice("LNK_W7", "SALE_APPROVED", total));
      expect(r.status).toBe(200);
      expect(r.json).toEqual({ ok: true, ignored: "monto" });
    }
    expect(await profileOf("ana")).toMatchObject({ credits: 0, tier: "free" });
    expect((await txOf("ana"))[0].type).toBe("bold_pending");

    // El pago completo sí acredita (y si trae propina, también).
    expect((await send(notice("LNK_W7", "SALE_APPROVED", 1_499_900 + 5_000))).json).toEqual({ ok: true, status: "credited" });
    expect(await profileOf("ana")).toMatchObject({ credits: 20_000, tier: "pyme" });
  });

  it("un aviso sin monto, o de una compra antigua sin monto guardado, no acredita por este camino", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pack_200", "LNK_W8");
    await addPurchase("ana", "pack_200", "LNK_W9", { amountCop: null });
    const sinMonto = notice("LNK_W8");
    delete (sinMonto.data as { amount?: unknown }).amount;
    expect((await send(sinMonto)).json).toEqual({ ok: true, ignored: "monto" });
    expect((await send(notice("LNK_W9"))).json).toEqual({ ok: true, ignored: "monto" });
    expect((await profileOf("ana")).credits).toBe(0);
  });

  it("pago aprobado que no se puede acreditar: 500 para que Bold reintente, y queda en el log", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pack_retirado", "LNK_W10", { amountCop: 5_000 });
    const r = await send(notice("LNK_W10", "SALE_APPROVED", 5_000));
    expect(r.status).toBe(500);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("SIN acreditar"));
    expect((await profileOf("ana")).credits).toBe(0);
  });

  it("el mismo aviso repetido responde 200 y no suma dos veces", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pack_200", "LNK_W3");
    expect((await send(notice("LNK_W3"))).json).toEqual({ ok: true, status: "credited" });
    const again = await send(notice("LNK_W3"));
    expect(again.status).toBe(200);
    expect(again.json).toEqual({ ok: true, status: "already" });
    expect((await profileOf("ana")).credits).toBe(200);
  });

  it("una venta del comercio que no es de la app se responde 200 y se ignora (Bold no reintenta)", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pack_200", "LNK_W4");
    for (const ref of ["WEB-ORD-009876", "LNK_DE_OTRA_COSA", "|", "pack_200"]) {
      const r = await send(notice(ref));
      expect(r.status).toBe(200);
      expect(r.json).toEqual({ ok: true, ignored: "otra venta" });
    }
    expect((await profileOf("ana")).credits).toBe(0);
  });

  it("un pago rechazado o una anulación no acreditan", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pack_200", "LNK_W5");
    for (const type of ["SALE_REJECTED", "VOID_APPROVED", "VOID_REJECTED"]) {
      const r = await send(notice("LNK_W5", type));
      expect(r.status).toBe(200);
      expect(r.json).toEqual({ ok: true, ignored: type });
    }
    expect((await profileOf("ana")).credits).toBe(0);
    expect((await txOf("ana"))[0].type).toBe("bold_pending");
  });

  it("un cuerpo firmado con el formato viejo ({data:{reference,status}}) no acredita", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pack_200", "LNK_W6");
    const r = await send({ data: { reference: "LNK_W6", status: "APPROVED" } });
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ ok: true, ignored: "formato" });
    expect((await profileOf("ana")).credits).toBe(0);
  });

  it("solo acepta POST", async () => {
    expect((await call(webhook, { method: "GET" })).status).toBe(405);
  });
});

describe("POST /api/billing/confirm", () => {
  const link = (status: string, extra: Record<string, unknown> = {}) => ({ api_version: 1, id: "LNK_X", total: 25_000, status, is_sandbox: false, ...extra });
  /** Una consulta "nueva": sin el freno de consultas seguidas (que tiene su propia prueba). */
  const ask = (body: Record<string, unknown> = {}) => { resetConfirmThrottle(); return call(confirm, { body }); };

  it("sin sesión responde 401", async () => {
    state.user = null;
    expect((await call(confirm, { body: {} })).status).toBe(401);
  });

  it("sin compras recientes dice que no hay nada que confirmar, sin llamar a Bold", async () => {
    await addUser("ana");
    const calls = stubBold();
    expect((await call(confirm, { body: {} })).json).toEqual({ ok: true, state: "none" });
    expect(calls).toHaveLength(0);
  });

  it("Bold dice PAID: acredita y lo cuenta como recién aprobado", async () => {
    await addUser("ana", { credits: 5 });
    await addPurchase("ana", "pack_200", "LNK_F1");
    const calls = stubBold({ link: link("PAID") });
    const r = await call(confirm, { body: { pack: "pack_200" } });
    expect(r.json).toEqual({ ok: true, state: "approved", fresh: true, packId: "pack_200", credits: 200, isPlan: false });
    expect(calls).toEqual([{ url: "https://integrations.api.bold.co/online/link/v1/LNK_F1", method: "GET", auth: "x-api-key llave-de-identidad-de-prueba", body: null }]);
    expect((await profileOf("ana")).credits).toBe(205);

    // Recargar la página: ya está aprobada, no vuelve a preguntar ni a sumar.
    const again = await call(confirm, { body: { pack: "pack_200" } });
    expect(again.json).toMatchObject({ state: "approved", fresh: false });
    expect(calls).toHaveLength(1);
    expect((await profileOf("ana")).credits).toBe(205);
  });

  it("el aviso de Bold llegó primero: el comprador ve 'aprobado' igual", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pro", "LNK_F2");
    await settlePurchase(db, (await findPurchaseByLink(db, "LNK_F2"))!);
    const calls = stubBold({ link: link("PAID") });
    expect((await call(confirm, { body: {} })).json).toEqual({ ok: true, state: "approved", fresh: false, packId: "pro", credits: 3_000, isPlan: true });
    expect(calls).toHaveLength(0);
    expect((await profileOf("ana")).credits).toBe(3_000);
  });

  it("en proceso o sin pagar no acredita", async () => {
    await addUser("ana", { credits: 5 });
    await addPurchase("ana", "pack_200", "LNK_F3");
    stubBold({ link: link("PROCESSING") });
    expect((await ask()).json).toMatchObject({ ok: true, state: "processing" });
    for (const status of ["ACTIVE", "REJECTED", "CANCELLED", "EXPIRED"]) {
      stubBold({ link: link(status) });
      expect((await ask()).json, status).toMatchObject({ ok: true, state: "unpaid" });
    }
    expect((await profileOf("ana")).credits).toBe(5);
  });

  it("dos clics en 'comprar' y paga el PRIMER link: se acredita ese, no se le dice 'sin pago'", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pro", "LNK_L1", { ageDays: 1 });
    await addPurchase("ana", "pro", "LNK_L2");
    const calls = stubBold({ links: { LNK_L1: link("PAID", { total: 349_900 }), LNK_L2: link("ACTIVE") } });
    expect((await ask({ pack: "pro" })).json).toEqual({ ok: true, state: "approved", fresh: true, packId: "pro", credits: 3_000, isPlan: true });
    expect(calls.map((c) => c.url.split("/").pop()).sort()).toEqual(["LNK_L1", "LNK_L2"]);
    expect(await profileOf("ana")).toMatchObject({ credits: 3_000, tier: "pro" });
    expect((await txOf("ana")).filter((t) => t.type === "bold_pending").map((t) => t.description)).toEqual(["pro|LNK_L2|349900"]);
  });

  it("una compra aprobada ayer no tapa la de hoy: si la de hoy no está pagada, se dice", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pro", "LNK_AYER1", { approved: true, ageDays: 1 });
    await addPurchase("ana", "pro", "LNK_HOY1");
    stubBold({ link: link("ACTIVE") });
    expect((await ask({ pack: "pro" })).json).toMatchObject({ ok: true, state: "unpaid" });
  });

  it("el aviso acreditó la compra y quedan intentos viejos sin pagar: ve 'aprobado', no 'sin pago'", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pack_200", "LNK_INTENTO", { ageDays: 3 });
    await addPurchase("ana", "pack_200", "LNK_BUENA");
    await settlePurchase(db, (await findPurchaseByLink(db, "LNK_BUENA"))!);
    stubBold({ link: link("ACTIVE") });
    expect((await ask({ pack: "pack_200" })).json).toEqual({ ok: true, state: "approved", fresh: false, packId: "pack_200", credits: 200, isPlan: false });
    expect((await profileOf("ana")).credits).toBe(200);
  });

  it("consultas seguidas del mismo usuario: la segunda no llega a Bold", async () => {
    await addUser("ana");
    await addPurchase("ana", "pack_200", "LNK_FR1");
    const calls = stubBold({ link: link("ACTIVE") });
    expect((await call(confirm, { body: {} })).status).toBe(200);
    const again = await call(confirm, { body: {} });
    expect(again.status).toBe(429);
    expect(again.json).toMatchObject({ ok: false, code: "TOO_MANY" });
    expect(calls).toHaveLength(1);
  });

  it("un `pack` que no existe no filtra ni rompe nada", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pack_200", "LNK_FP1");
    stubBold({ link: link("PAID") });
    expect((await ask({ pack: "constructor" })).json).toMatchObject({ state: "approved", packId: "pack_200" });
  });

  it("Bold no dice si el pago es de prueba: no se acredita por este camino ni se afirma nada falso", async () => {
    await addUser("ana", { credits: 5 });
    await addPurchase("ana", "pyme", "LNK_F7");
    const sinCampo = link("PAID");
    delete (sinCampo as { is_sandbox?: unknown }).is_sandbox;
    stubBold({ link: sinCampo });
    expect((await ask()).json).toMatchObject({ ok: true, state: "processing" });
    expect(await profileOf("ana")).toMatchObject({ credits: 5, tier: "free" });
  });

  it("Bold responde por un link y no por otro: decide con lo que sí sabe", async () => {
    await addUser("ana", { credits: 0 });
    await addPurchase("ana", "pack_200", "LNK_M1", { ageDays: 1 });
    await addPurchase("ana", "pack_200", "LNK_M2");
    stubBold({ links: { LNK_M1: link("PAID"), LNK_M2: "caído" } });
    expect((await ask()).json).toMatchObject({ state: "approved", fresh: true });
    expect((await profileOf("ana")).credits).toBe(200);
  });

  it("un pago con llaves de PRUEBA no le regala créditos a un usuario cualquiera", async () => {
    await addUser("ana", { credits: 5 });
    await addPurchase("ana", "pyme", "LNK_F4");
    stubBold({ link: link("PAID", { is_sandbox: true }) });
    expect((await call(confirm, { body: {} })).json).toMatchObject({ ok: true, state: "sandbox" });
    expect(await profileOf("ana")).toMatchObject({ credits: 5, tier: "free" });
  });

  it("…pero sí a un administrador, para poder probar el flujo completo", async () => {
    await addUser("ana", { credits: 5, admin: true });
    await addPurchase("ana", "creador", "LNK_F5");
    stubBold({ link: link("PAID", { is_sandbox: true }) });
    expect((await call(confirm, { body: {} })).json).toMatchObject({ ok: true, state: "approved", fresh: true });
    expect(await profileOf("ana")).toMatchObject({ credits: 1_005, tier: "creador" });
    // Y queda marcada: una compra de prueba no es un ingreso.
    expect((await txOf("ana")).find((t) => t.type === "bold_approved")?.description).toBe("creador|LNK_F5|149900|prueba");
  });

  it("nunca mira la compra de otra persona", async () => {
    await addUser("ana", { credits: 5 });
    await addUser("beto", { credits: 5 });
    await addPurchase("beto", "pyme", "LNK_BETO1");
    const calls = stubBold({ link: link("PAID") });
    expect((await call(confirm, { body: { pack: "pyme", linkId: "LNK_BETO1", userId: "beto" } })).json).toEqual({ ok: true, state: "none" });
    expect(calls).toHaveLength(0);
    expect((await profileOf("beto")).credits).toBe(5);
  });

  it("si Bold no responde no inventa un resultado", async () => {
    await addUser("ana", { credits: 5 });
    await addPurchase("ana", "pack_200", "LNK_F6");
    stubBold({ status: 500, link: { message: "error" } });
    const r = await call(confirm, { body: {} });
    expect(r.status).toBe(502);
    expect(r.json).toMatchObject({ ok: false, code: "PROVIDER_ERROR" });
    expect((await profileOf("ana")).credits).toBe(5);
  });
});
