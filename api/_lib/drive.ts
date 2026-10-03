// Guardar en el Google Drive del usuario.
//
// El permiso es `drive.file`: da acceso ÚNICAMENTE a los archivos que crea esta app,
// no al resto de su unidad. Por eso Google lo considera no sensible y no exige
// verificación — y por eso, si el usuario desvincula, lo que perdemos es el acceso a
// nuestros propios archivos, no a los suyos.
//
// El token lo administra better-auth (tabla `account`: access_token, refresh_token,
// scope). `getAccessToken` lo refresca solo cuando hace falta.
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { auth, DRIVE_SCOPE } from "./auth.js";

const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
const DRIVE_FILES = "https://www.googleapis.com/drive/v3/files";

/** Carpeta donde se guarda todo, para que el usuario la encuentre y la borre si quiere. */
const FOLDER_NAME = "Creator IA Pro";

/** Prefijo con el que se guarda en `saved_asset.asset_url` un archivo que vive en Drive. */
export const DRIVE_PREFIX = "drive:";

export const driveFileId = (assetUrl: string) =>
  assetUrl.startsWith(DRIVE_PREFIX) ? assetUrl.slice(DRIVE_PREFIX.length) : null;

/** La cuenta de Google de este usuario, si autorizó además el permiso de Drive. */
async function driveAccount(userId: string): Promise<{ id: string } | null> {
  const db = getDb();
  const [row] = await db
    .select({ id: schema.account.id, scope: schema.account.scope })
    .from(schema.account)
    .where(and(eq(schema.account.userId, userId), eq(schema.account.providerId, "google")))
    .limit(1);
  return row?.scope?.includes(DRIVE_SCOPE) ? { id: row.id } : null;
}

/** ¿Este usuario autorizó guardar en su Drive? */
export async function hasDriveLinked(userId: string): Promise<boolean> {
  return !!(await driveAccount(userId));
}

/** Token válido para la API de Drive, refrescado por better-auth si estaba vencido. */
async function accessToken(userId: string): Promise<string | null> {
  const cuenta = await driveAccount(userId);
  if (!cuenta) return null;
  try {
    // accountId es el id de la FILA de `account`, no el id del usuario en Google.
    const res = await auth.api.getAccessToken({ body: { accountId: cuenta.id, userId } });
    return (res as { accessToken?: string })?.accessToken ?? null;
  } catch (err) {
    console.error("[drive] No se pudo obtener el token:", err);
    return null;
  }
}

/** La carpeta de la app, creándola la primera vez. */
async function folderId(token: string): Promise<string | null> {
  const buscar = new URL(DRIVE_FILES);
  // Solo entre los archivos de esta app (drive.file) y sin los borrados.
  buscar.searchParams.set("q", `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  buscar.searchParams.set("fields", "files(id)");
  buscar.searchParams.set("pageSize", "1");

  const encontrada = await fetch(buscar, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => (r.ok ? (r.json() as Promise<{ files?: { id: string }[] }>) : null))
    .catch(() => null);
  const existente = encontrada?.files?.[0]?.id;
  if (existente) return existente;

  const creada = await fetch(DRIVE_FILES, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  })
    .then((r) => (r.ok ? (r.json() as Promise<{ id?: string }>) : null))
    .catch(() => null);
  return creada?.id ?? null;
}

/**
 * Sube una imagen al Drive del usuario y devuelve su id, o null si no se pudo (sin
 * vincular, token caducado, cuota llena…). Quien llama decide el plan B — nunca se
 * pierde una imagen que el usuario pagó.
 */
export async function uploadToDrive(userId: string, data: Buffer, mime: string, nombre: string): Promise<string | null> {
  const token = await accessToken(userId);
  if (!token) return null;
  const carpeta = await folderId(token);

  // Subida multiparte: metadatos + binario en una sola petición.
  const limite = `creator-ia-${Date.now()}`;
  const meta = JSON.stringify({ name: nombre, ...(carpeta ? { parents: [carpeta] } : {}) });
  const cuerpo = Buffer.concat([
    Buffer.from(`--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${limite}\r\nContent-Type: ${mime}\r\n\r\n`),
    data,
    Buffer.from(`\r\n--${limite}--`),
  ]);

  try {
    const res = await fetch(`${DRIVE_UPLOAD}?uploadType=multipart&fields=id`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${limite}` },
      body: cuerpo,
    });
    if (!res.ok) {
      console.error("[drive] Subida rechazada:", res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const json = (await res.json()) as { id?: string };
    return json?.id ?? null;
  } catch (err) {
    console.error("[drive] Error al subir:", err);
    return null;
  }
}

/** Descarga un archivo del Drive del usuario (para servirlo desde /api/assets/<id>/raw). */
export async function downloadFromDrive(userId: string, fileId: string): Promise<{ body: ArrayBuffer; mime: string } | null> {
  const token = await accessToken(userId);
  if (!token) return null;
  try {
    const res = await fetch(`${DRIVE_FILES}/${encodeURIComponent(fileId)}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return { body: await res.arrayBuffer(), mime: res.headers.get("content-type") || "application/octet-stream" };
  } catch (err) {
    console.error("[drive] Error al descargar:", err);
    return null;
  }
}
