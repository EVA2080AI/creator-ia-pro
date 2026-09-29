// "Memoria" de Basalt — datos que recuerda del usuario entre conversaciones,
// antes solo en localStorage (ver db/schema/basalt.ts). Un row por usuario.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../../db/index.js";
import { requireUser } from "../_lib/require-user.js";

const MAX_FACTS = 60;
const MAX_FACT_LEN = 500;

const PUT_SCHEMA = z.object({
  facts: z.array(z.string().trim().max(MAX_FACT_LEN)).max(MAX_FACTS),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();

  if (req.method === "GET") {
    const [row] = await db.select().from(schema.basaltMemory).where(eq(schema.basaltMemory.userId, user.userId)).limit(1);
    res.status(200).json({ ok: true, facts: (row?.facts as string[] | undefined) ?? [] });
    return;
  }

  if (req.method === "PUT") {
    const parsed = PUT_SCHEMA.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: parsed.error.issues[0]?.message ?? "Datos inválidos." });
      return;
    }
    const facts = parsed.data.facts.slice(-MAX_FACTS);
    await db.insert(schema.basaltMemory)
      .values({ userId: user.userId, facts, updatedAt: new Date() })
      .onConflictDoUpdate({ target: schema.basaltMemory.userId, set: { facts, updatedAt: new Date() } });
    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader("Allow", "GET, PUT");
  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido." });
}
