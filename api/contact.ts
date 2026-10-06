// El formulario de /contact — que durante meses "Simuló envío" y tiraba el
// mensaje a la basura con un toast de éxito. Ahora manda un correo real a
// hola@creator-ia.com por Resend (la misma pieza que ya envía el reset de
// contraseña). Público a propósito: quien pregunta por los planes no tiene
// cuenta todavía. Guardas anti-bot sin base de datos: campo señuelo (website)
// que un humano no ve — si viene lleno se responde "ok" sin enviar — y los
// topes de validarContacto. Nada se guarda en nuestra base.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { validarContacto } from "../src/lib/contact.js";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const DESTINO = "hola@creator-ia.com";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;

  // Señuelo: los humanos no ven este campo; un bot que lo llena recibe un
  // "éxito" vacío y no gasta ni una llamada a Resend.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    res.status(200).json({ ok: true });
    return;
  }

  const datos = {
    name: String(body.name ?? ""),
    email: String(body.email ?? ""),
    subject: String(body.subject ?? ""),
    message: String(body.message ?? ""),
  };
  const problema = validarContacto(datos);
  if (problema) {
    res.status(400).json({ ok: false, code: "INVALID", error: problema });
    return;
  }

  if (!resend) {
    // Sin RESEND_API_KEY no se promete nada: la página ofrece el mailto.
    res.status(503).json({ ok: false, code: "CONTACT_DISABLED", error: "El formulario no está disponible ahora mismo." });
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "Creator IA Pro <onboarding@resend.dev>",
      to: DESTINO,
      replyTo: datos.email.trim(),
      subject: `[Contacto] ${datos.subject.trim().slice(0, 150)}`,
      text: `De: ${datos.name.trim()} <${datos.email.trim()}>\n\n${datos.message.trim()}`,
    });
    if (error) {
      console.error("[contact] Resend rechazó el envío:", error);
      res.status(502).json({ ok: false, code: "SEND_FAILED", error: "No se pudo enviar el mensaje." });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[contact] error al enviar:", err);
    res.status(502).json({ ok: false, code: "SEND_FAILED", error: "No se pudo enviar el mensaje." });
  }
}
