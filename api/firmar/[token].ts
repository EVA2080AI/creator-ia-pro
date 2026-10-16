// Firma electrónica de un acuerdo — respaldo de la página pública /firmar/<token>.
// GET: datos para la pantalla de firma. POST: recibe el trazo (PNG), guarda la
// evidencia (fecha, IP, dispositivo) y, cuando firma el último, estampa la
// CONSTANCIA DE FIRMA ELECTRÓNICA al final del PDF con pdf-lib y guarda el
// resultado en Blob. El token del enlace es el único secreto: no exige cuenta,
// igual que el módulo de firmas del proyecto Faro (Cruz Roja) que replica.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { asc, eq, isNull, and, count } from "drizzle-orm";
import { createHash } from "node:crypto";
import { getDb, schema } from "../../db/index.js";
import { uploadFirmaPng, uploadPdf } from "../_lib/blob.js";
import { estamparConstancia, dimensionesPng, MAX_LADO_FIRMA_PX } from "../_lib/constancia.js";

const PNG_DATA_URI = /^data:image\/png;base64,(.+)$/s;
const MAX_FIRMA_BASE64 = 2 * 1024 * 1024; // un trazo de canvas pesa ~10-60 KB; 2 MB ya es un abuso

type Db = ReturnType<typeof getDb>;

async function cargarPorToken(db: Db, token: string) {
  const [firmante] = await db.select().from(schema.acuerdoFirmante).where(eq(schema.acuerdoFirmante.token, token));
  if (!firmante) return null;
  const [acuerdo] = await db.select().from(schema.acuerdo).where(eq(schema.acuerdo.id, firmante.acuerdoId));
  return acuerdo ? { firmante, acuerdo } : null;
}


/** Genera el PDF final (original + constancia) y devuelve su URL, o null si algo falla. */
async function generarPdfFirmado(db: Db, acuerdo: typeof schema.acuerdo.$inferSelect): Promise<string | null> {
  try {
    const original = new Uint8Array(await (await fetch(acuerdo.pdfUrl)).arrayBuffer());
    // Si el blob no corresponde al hash registrado, algo tocó el documento: mejor no estampar nada.
    const hash = createHash("sha256").update(original).digest("hex");
    if (hash !== acuerdo.hashSha256) throw new Error("El PDF almacenado no coincide con la huella registrada.");
    const firmantes = await db
      .select()
      .from(schema.acuerdoFirmante)
      .where(eq(schema.acuerdoFirmante.acuerdoId, acuerdo.id))
      .orderBy(asc(schema.acuerdoFirmante.orden));
    const sellado = await estamparConstancia(original, acuerdo, firmantes);
    return await uploadPdf(Buffer.from(sellado), "acuerdos/firmados");
  } catch (err) {
    console.error("[firmar] No se pudo generar el PDF firmado:", err);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = getDb();
  const token = String(req.query.token ?? "");
  const data = token ? await cargarPorToken(db, token) : null;
  if (!data) {
    res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Este enlace de firma no existe o fue retirado." });
    return;
  }
  const { firmante, acuerdo } = data;

  if (req.method === "GET") {
    // Autorreparación: si el acuerdo quedó firmado pero el estampado falló en su
    // momento (red, blob…), se reintenta aquí; cualquier visita al enlace lo sana.
    if (acuerdo.estado === "firmado" && !acuerdo.pdfFirmadoUrl) {
      const url = await generarPdfFirmado(db, acuerdo);
      if (url) {
        await db.update(schema.acuerdo).set({ pdfFirmadoUrl: url, updatedAt: new Date() }).where(eq(schema.acuerdo.id, acuerdo.id));
        acuerdo.pdfFirmadoUrl = url;
      }
    }
    const todos = await db
      .select({ nombre: schema.acuerdoFirmante.nombre, rol: schema.acuerdoFirmante.rol, firmadoAt: schema.acuerdoFirmante.firmadoAt })
      .from(schema.acuerdoFirmante)
      .where(eq(schema.acuerdoFirmante.acuerdoId, acuerdo.id))
      .orderBy(asc(schema.acuerdoFirmante.orden));
    res.status(200).json({
      ok: true,
      acuerdo: {
        titulo: acuerdo.titulo,
        pdfUrl: acuerdo.pdfUrl,
        estado: acuerdo.estado,
        pdfFirmadoUrl: acuerdo.pdfFirmadoUrl,
        hashSha256: acuerdo.hashSha256,
      },
      firmante: {
        nombre: firmante.nombre,
        rol: firmante.rol,
        documento: firmante.documento,
        yaFirmo: !!firmante.firmadoAt,
      },
      firmantes: todos.map((f) => ({ nombre: f.nombre, rol: f.rol, firmo: !!f.firmadoAt })),
    });
    return;
  }

  if (req.method === "POST") {
    if (firmante.firmadoAt) {
      res.status(409).json({ ok: false, code: "ALREADY_SIGNED", error: "Esta firma ya fue registrada." });
      return;
    }
    const body = (req.body ?? {}) as { firmaDataUrl?: string; acepta?: boolean };
    if (body.acepta !== true) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "Debes aceptar la declaración de firma electrónica." });
      return;
    }
    const match = typeof body.firmaDataUrl === "string" ? PNG_DATA_URI.exec(body.firmaDataUrl) : null;
    if (!match) return void res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "La firma es obligatoria." });
    if (match[1].length > MAX_FIRMA_BASE64) return void res.status(413).json({ ok: false, code: "TOO_LARGE", error: "La firma pesa demasiado." });
    // Magia y dimensiones del PNG ANTES de guardarlo: ni archivos renombrados ni
    // bombas de descompresión (PNG chiquito que infla a miles de píxeles).
    const dims = dimensionesPng(Buffer.from(match[1], "base64"));
    if (!dims) return void res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "La firma no es un PNG válido." });
    if (dims.w > MAX_LADO_FIRMA_PX || dims.h > MAX_LADO_FIRMA_PX) {
      return void res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "La imagen de la firma es desproporcionada." });
    }

    const firmaUrl = await uploadFirmaPng(body.firmaDataUrl!, `acuerdos/firmas/${acuerdo.id}`);
    if (!firmaUrl) return void res.status(500).json({ ok: false, code: "UPLOAD_FAILED", error: "No se pudo guardar la firma. Intenta de nuevo." });

    const ip = (String(req.headers["x-forwarded-for"] ?? "").split(",")[0] || req.socket?.remoteAddress || "").trim() || null;
    const userAgent = String(req.headers["user-agent"] ?? "").slice(0, 300) || null;

    // Solo pasa de null→firmado: si dos envíos llegan a la vez, el segundo no pisa al primero.
    const [actualizado] = await db
      .update(schema.acuerdoFirmante)
      .set({ firmaUrl, firmadoAt: new Date(), ip, userAgent })
      .where(and(eq(schema.acuerdoFirmante.id, firmante.id), isNull(schema.acuerdoFirmante.firmadoAt)))
      .returning();
    if (!actualizado) {
      res.status(409).json({ ok: false, code: "ALREADY_SIGNED", error: "Esta firma ya fue registrada." });
      return;
    }

    const [{ pendientes }] = await db
      .select({ pendientes: count() })
      .from(schema.acuerdoFirmante)
      .where(and(eq(schema.acuerdoFirmante.acuerdoId, acuerdo.id), isNull(schema.acuerdoFirmante.firmadoAt)));

    let estado: "parcial" | "firmado" = "parcial";
    let pdfFirmadoUrl: string | null = null;

    if (Number(pendientes) === 0) {
      pdfFirmadoUrl = await generarPdfFirmado(db, acuerdo);
      estado = "firmado";
      await db.update(schema.acuerdo).set({ estado, pdfFirmadoUrl, updatedAt: new Date() }).where(eq(schema.acuerdo.id, acuerdo.id));
      // Si el estampado falló, el acuerdo queda "firmado" sin PDF final: las firmas ya
      // están a salvo y la autorreparación del GET lo reintenta en la próxima visita.
    } else {
      estado = "parcial";
      await db.update(schema.acuerdo).set({ estado, updatedAt: new Date() }).where(eq(schema.acuerdo.id, acuerdo.id));
    }

    res.status(200).json({ ok: true, estado, pdfFirmadoUrl });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido." });
}
