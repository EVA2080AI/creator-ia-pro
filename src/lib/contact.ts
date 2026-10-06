// Validación del formulario de contacto, compartida por la página y por
// /api/contact (misma razón que limits.ts: sin imports, segura para node16).

export interface MensajeContacto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** `null` si está bien; si no, el mensaje para el usuario (va a UI y a la 400). */
export function validarContacto(c: Partial<MensajeContacto>): string | null {
  const name = (c.name ?? "").trim();
  const email = (c.email ?? "").trim();
  const subject = (c.subject ?? "").trim();
  const message = (c.message ?? "").trim();
  if (!name || name.length > 100) return "Dinos tu nombre (máximo 100 caracteres).";
  if (!EMAIL_RE.test(email) || email.length > 200) return "Ese correo no parece válido.";
  if (!subject || subject.length > 150) return "El asunto es obligatorio (máximo 150 caracteres).";
  if (message.length < 10) return "Cuéntanos un poco más (mínimo 10 caracteres).";
  if (message.length > 5000) return "El mensaje supera los 5.000 caracteres.";
  return null;
}
