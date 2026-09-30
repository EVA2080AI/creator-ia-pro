// Funciones de solo lectura, ya scopeadas a userId, pensadas para que las
// herramientas de Basalt (api/ai/chat.ts) reutilicen la misma lógica de
// acceso a datos que las rutas HTTP existentes en vez de reinventarla con
// queries nuevas — evita abrir una superficie nueva de fuga entre usuarios
// (auditoría 2026-09-29, pedido: que Basalt pueda leer tus datos reales).
// getUserAssets es más simple que el GET de api/assets.ts a propósito (sin
// paginación/favoritos/spaceId) — ese endpoint ya cubre esos casos para la
// UI; esta versión solo necesita devolver "qué tenés" para una herramienta
// de chat, no reemplazar el endpoint más rico.
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { getProfile } from "./session.js";

export async function getUserProjects(userId: string) {
  const db = getDb();
  return db.select().from(schema.project).where(eq(schema.project.userId, userId)).orderBy(desc(schema.project.updatedAt));
}

export async function getUserAssets(userId: string, limit = 20) {
  const db = getDb();
  return db.select().from(schema.savedAsset).where(eq(schema.savedAsset.userId, userId)).orderBy(desc(schema.savedAsset.createdAt)).limit(limit);
}

export interface UserUsage {
  creditsBalance: number;
  subscriptionTier: string;
  freeMsgCount: number;
  freeMsgResetAt: string;
}

// Mismo criterio de whitelist que api/profile.ts: getProfile() trae la fila
// cruda (incluye isAdmin, isActive, etc.) — acá solo se expone lo que tiene
// sentido que el modelo vea y le repita al usuario.
export async function getUserUsage(userId: string): Promise<UserUsage | null> {
  const profile = await getProfile(userId);
  if (!profile) return null;
  return {
    creditsBalance: profile.creditsBalance,
    subscriptionTier: profile.subscriptionTier,
    freeMsgCount: profile.freeMsgCount,
    freeMsgResetAt: profile.freeMsgResetAt.toISOString(),
  };
}
