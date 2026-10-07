// Valida el destino de vuelta tras entrar (/auth?next=...): SOLO rutas internas.
// Un valor externo — "https://evil.com" o el protocolo-relativo "//evil.com" —
// convertiría /auth en un open redirect (phishing con nuestra URL de confianza).
export function safeInternalPath(raw: string | null, fallback = "/a/basalt"): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}
