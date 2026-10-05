// Los errores del chat que tienen una salida, y cuál es.
//
// El servidor ya distinguía cada caso con un `code` (api/ai/chat.ts) y el cliente lo
// tiraba a la basura: `throw new Error(body.error)`. Así, a quien se le acaban los
// créditos a mitad de un análisis le quedaba un aviso de texto y un botón de
// "Reintentar" que vuelve a fallar — teniendo /pricing a un clic.

export class ChatError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "ChatError";
    this.code = code;
  }
}

/** Construye el error conservando el código que mandó el servidor. */
export function chatError(body: unknown, status: number): ChatError {
  const b = body as { error?: string; code?: string } | null;
  return new ChatError(b?.error || `Error ${status}`, b?.code);
}

/** Qué se le ofrece al usuario para salir de este error, si hay algo que ofrecer. */
export function errorAction(code?: string): { label: string; to: string } | null {
  switch (code) {
    case "INSUFFICIENT_CREDITS":
    case "FREE_LIMIT_REACHED":
    case "TIER_REQUIRED":
      return { label: "Ver planes", to: "/pricing" };
    default:
      // NOT_CONFIGURED y PROVIDER_ERROR no los arregla el usuario; MODEL_HAS_NO_VISION
      // ya se avisa antes de enviar, con el cambio de modelo a mano.
      return null;
  }
}

/** Reintentar solo sirve si el problema puede haber pasado (red, proveedor). */
export function canRetry(code?: string): boolean {
  return code !== "INSUFFICIENT_CREDITS" && code !== "FREE_LIMIT_REACHED" && code !== "TIER_REQUIRED";
}
