// "¿Quién usa la app?" — reglas puras para Admin → Usuarios.
//
// La lista de usuarios mostraba plan, saldo y fecha de registro, pero nada que dijera si la
// persona volvió a entrar o escribió alguna vez: con 118 cuentas no se distinguía a quien
// usa el producto de quien se registró y no volvió (pedido de Sebastián, 2026-11-20:
// "quiero saber quién lo usa"). Los datos llegan de GET /api/admin/users.
import type { AdminUser } from "./types";

export type ActivityFilter = "todos" | "hoy" | "7d" | "30d" | "sin-uso";
export type UserSort = "actividad" | "mensajes" | "registro";

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Días de CALENDARIO (hora local de quien mira) desde `iso`; null si no hay fecha válida. */
export function daysAgo(iso: string | null | undefined, now: Date = new Date()): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.round((startOfDay(now) - startOfDay(d)) / DAY));
}

export function activityLabel(iso: string | null | undefined, now: Date = new Date()): string {
  const n = daysAgo(iso, now);
  if (n === null) return "Sin actividad";
  if (n === 0) return "Hoy";
  if (n === 1) return "Ayer";
  if (n < 30) return `Hace ${n} días`;
  const meses = Math.floor(n / 30);
  return meses === 1 ? "Hace 1 mes" : `Hace ${meses} meses`;
}

/** Se registró pero nunca escribió un mensaje ni generó una imagen. */
export function neverUsed(u: AdminUser): boolean {
  return (u.messages ?? 0) === 0 && (u.images ?? 0) === 0;
}

export function matchesActivity(u: AdminUser, filter: ActivityFilter, now: Date = new Date()): boolean {
  if (filter === "todos") return true;
  if (filter === "sin-uso") return neverUsed(u);
  const n = daysAgo(u.last_active_at, now);
  if (n === null) return false;
  return n <= (filter === "hoy" ? 0 : filter === "7d" ? 7 : 30);
}

export function summarizeActivity(users: AdminUser[], now: Date = new Date()): Record<ActivityFilter, number> {
  const count = (f: ActivityFilter) => users.filter((u) => matchesActivity(u, f, now)).length;
  return { todos: users.length, hoy: count("hoy"), "7d": count("7d"), "30d": count("30d"), "sin-uso": count("sin-uso") };
}

/** Copia ordenada; quien no tiene dato de actividad va al final, no al principio. */
export function sortUsers(users: AdminUser[], sort: UserSort): AdminUser[] {
  const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() || 0 : 0);
  const by: Record<UserSort, (a: AdminUser, b: AdminUser) => number> = {
    actividad: (a, b) => time(b.last_active_at) - time(a.last_active_at),
    mensajes: (a, b) => (b.messages ?? 0) - (a.messages ?? 0) || time(b.last_active_at) - time(a.last_active_at),
    registro: (a, b) => time(b.created_at) - time(a.created_at),
  };
  return [...users].sort(by[sort]);
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** El dato principal de uso, partido en número y palabra para poder resaltar el número:
 *  los mensajes, o las imágenes cuando la persona solo generó imágenes (si no, la tabla
 *  decía "0 mensajes" de alguien que sí usó el producto). */
export function usageHeadline(u: AdminUser): { n: number; label: string } {
  const m = u.messages ?? 0;
  if (m > 0) return { n: m, label: m === 1 ? "mensaje" : "mensajes" };
  const i = u.images ?? 0;
  return { n: i, label: i === 1 ? "imagen" : "imágenes" };
}

/** La línea de detalle bajo el dato principal: "5 chats · 1 imagen", o "sin mensajes". */
export function usageLine(u: AdminUser): string {
  if (!u.messages) return "sin mensajes";
  const partes = [plural(u.chats ?? 0, "chat", "chats")];
  if (u.images) partes.push(plural(u.images, "imagen", "imágenes"));
  return partes.join(" · ");
}
