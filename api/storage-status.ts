// Dónde se guardan hoy las imágenes de este usuario: en su Google Drive (si lo
// vinculó) o en el almacenamiento de la plataforma. Lo consulta /perfil para saber
// qué mostrar sin tener que adivinar.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUser } from "./_lib/require-user.js";
import { hasDriveLinked } from "./_lib/drive.js";
import { isBlobConfigured } from "./_lib/blob.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido." });
    return;
  }

  const drive = await hasDriveLinked(user.userId);
  res.status(200).json({
    ok: true,
    drive,
    // Sin Drive vinculado las imágenes van al almacenamiento de la plataforma; si
    // tampoco estuviera configurado, el perfil lo puede decir en vez de prometer algo.
    fallback: isBlobConfigured() ? "plataforma" : "ninguno",
  });
}
