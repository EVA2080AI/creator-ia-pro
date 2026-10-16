// Acuerdos con firma electrónica — crear (PDF + firmantes), listar y borrar.
// Solo admin. La firma ocurre en /api/firmar/[token] (pública: el token del
// enlace es el secreto). Ver db/schema/acuerdos.ts y src/pages/admin/tabs/AcuerdosTab.tsx.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { desc, eq, inArray, asc } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { getDb, schema } from "../db/index.js";
import { requireAdmin } from "./_lib/require-admin.js";
import { uploadPdf, isBlobConfigured } from "./_lib/blob.js";

// Vercel corta el body en ~4.5 MB: con 4 MB de base64 (~3 MB de PDF) queda margen
// para el resto del JSON. Un acuerdo de texto pesa ~200 KB, sobra espacio.
const MAX_PDF_BASE64 = 4 * 1024 * 1024;
const PDF_DATA_URI = /^data:application\/pdf;base64,(.+)$/s;

const FIRMANTE_SCHEMA = z.object({
  nombre: z.string().trim().min(1, "Falta el nombre de un firmante.").max(200),
  rol: z.string().trim().min(1, "Falta el rol de un firmante.").max(120),
  documento: z.string().trim().max(120).nullish(),
  email: z.union([z.string().trim().email("Correo de firmante inválido.").max(200), z.literal(""), z.null(), z.undefined()]),
});

const CREATE_SCHEMA = z.object({
  titulo: z.string().trim().min(1, "Falta el título del acuerdo.").max(200),
  pdfDataUrl: z.string().min(1, "Falta el PDF del acuerdo."),
  firmantes: z.array(FIRMANTE_SCHEMA).min(1, "Agrega al menos un firmante.").max(6, "Máximo 6 firmantes."),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const db = getDb();

  if (req.method === "GET") {
    const acuerdos = await db.select().from(schema.acuerdo).orderBy(desc(schema.acuerdo.createdAt));
    const ids = acuerdos.map((a) => a.id);
    const firmantes = ids.length
      ? await db.select().from(schema.acuerdoFirmante).where(inArray(schema.acuerdoFirmante.acuerdoId, ids)).orderBy(asc(schema.acuerdoFirmante.orden))
      : [];
    res.status(200).json({
      ok: true,
      acuerdos: acuerdos.map((a) => ({ ...a, firmantes: firmantes.filter((f) => f.acuerdoId === a.id) })),
    });
    return;
  }

  if (req.method === "POST") {
    if (!isBlobConfigured()) {
      res.status(500).json({ ok: false, code: "BLOB_MISSING", error: "El almacenamiento de archivos no está configurado (BLOB_READ_WRITE_TOKEN)." });
      return;
    }
    const parsed = CREATE_SCHEMA.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: parsed.error.issues[0]?.message ?? "Datos inválidos." });
      return;
    }
    const { titulo, pdfDataUrl, firmantes } = parsed.data;

    const match = PDF_DATA_URI.exec(pdfDataUrl);
    if (!match) return void res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "El archivo debe ser un PDF." });
    if (match[1].length > MAX_PDF_BASE64) return void res.status(413).json({ ok: false, code: "TOO_LARGE", error: "El PDF supera los 3 MB. Compréndelo o divídelo." });
    const buffer = Buffer.from(match[1], "base64");
    // Firma mágica del formato: evita guardar como "acuerdo" cualquier otro archivo renombrado.
    if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return void res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "El archivo no es un PDF válido." });
    }

    const pdfUrl = await uploadPdf(buffer, "acuerdos/originales");
    if (!pdfUrl) return void res.status(500).json({ ok: false, code: "UPLOAD_FAILED", error: "No se pudo guardar el PDF. Intenta de nuevo." });

    const acuerdoId = crypto.randomUUID();
    const hash = createHash("sha256").update(buffer).digest("hex");
    const [creado] = await db.insert(schema.acuerdo).values({
      id: acuerdoId,
      titulo,
      pdfUrl,
      hashSha256: hash,
      createdBy: admin.userId,
    }).returning();

    const filas = firmantes.map((f, i) => ({
      id: crypto.randomUUID(),
      acuerdoId,
      nombre: f.nombre,
      rol: f.rol,
      documento: f.documento || null,
      email: f.email || null,
      orden: i,
      // base64url: apto para URL sin escapes; 24 bytes = imposible de adivinar.
      token: randomBytes(24).toString("base64url"),
    }));
    const creados = await db.insert(schema.acuerdoFirmante).values(filas).returning();

    res.status(200).json({ ok: true, acuerdo: { ...creado, firmantes: creados } });
    return;
  }

  if (req.method === "DELETE") {
    const id = String(req.query.id ?? "");
    if (!id) return void res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "Falta el id del acuerdo." });
    // Los blobs quedan huérfanos a propósito: sus URLs no son adivinables y un
    // acuerdo borrado por error no debe perder también su PDF firmado.
    const [borrado] = await db.delete(schema.acuerdo).where(eq(schema.acuerdo.id, id)).returning();
    if (!borrado) return void res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Acuerdo no encontrado." });
    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido." });
}
