import type { VercelRequest } from "@vercel/node";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";
import { getDb, schema } from "../../db/index.js";
import { eq } from "drizzle-orm";

export async function getSessionUser(req: VercelRequest) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session?.user) return null;

  const db = getDb();
  const [row] = await db
    .select({ isActive: schema.profile.isActive })
    .from(schema.profile)
    .where(eq(schema.profile.userId, session.user.id))
    .limit(1);
  if (row && !row.isActive) return null; // cuenta suspendida por un admin

  return { userId: session.user.id, email: session.user.email, name: session.user.name };
}

export async function getProfile(userId: string) {
  const db = getDb();
  const [row] = await db.select().from(schema.profile).where(eq(schema.profile.userId, userId)).limit(1);
  return row ?? null;
}
