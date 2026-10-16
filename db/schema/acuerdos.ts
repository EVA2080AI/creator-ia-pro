// Acuerdos con firma electrónica — el admin sube un PDF y define quiénes firman;
// cada firmante recibe un enlace único (/firmar/<token>) donde dibuja su firma.
// Cuando firma el último, la constancia se estampa al final del PDF y el
// resultado queda guardado (ver api/firmar/[token].ts y api/acuerdos.ts).
import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const acuerdoEstado = pgEnum("acuerdo_estado", ["pendiente", "parcial", "firmado"]);

export const acuerdo = pgTable("acuerdo", {
  id: text("id").primaryKey(),
  titulo: text("titulo").notNull(),
  // PDF original en Vercel Blob: es EL documento que se firma; su hash queda abajo.
  pdfUrl: text("pdf_url").notNull(),
  // PDF con la constancia de firmas estampada — existe solo cuando todos firmaron.
  pdfFirmadoUrl: text("pdf_firmado_url"),
  hashSha256: text("hash_sha256").notNull(),
  estado: acuerdoEstado("estado").notNull().default("pendiente"),
  createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const acuerdoFirmante = pgTable("acuerdo_firmante", {
  id: text("id").primaryKey(),
  acuerdoId: text("acuerdo_id").notNull().references(() => acuerdo.id, { onDelete: "cascade" }),
  // Identidad tal como debe quedar en la constancia: nombre, rol y documento.
  nombre: text("nombre").notNull(),
  rol: text("rol").notNull(),
  documento: text("documento"),
  email: text("email"),
  orden: integer("orden").notNull().default(0),
  // Secreto del enlace /firmar/<token>; con él no hace falta cuenta para firmar.
  token: text("token").notNull().unique(),
  firmaUrl: text("firma_url"),
  firmadoAt: timestamp("firmado_at"),
  // Evidencia del acto de firma (Ley 527 de 1999: confiabilidad del origen).
  ip: text("ip"),
  userAgent: text("user_agent"),
});
