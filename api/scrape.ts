// Lectura server-side de una URL pública (para adjuntar contenido web al chat
// de Genesis). Reemplaza la edge function `scrape-url` del Supabase muerto.
//
// Seguridad (S11/S12 del QA adversarial):
//   - Requiere sesión (cookie better-auth).
//   - Solo http/https.
//   - Guard SSRF: rechaza hosts que resuelvan a IPs privadas/loopback/link-local
//     (incluye metadata cloud 169.254.169.254). Se valida CADA salto de redirect.
//   - Body limitado a 512 KB, texto resultante truncado a 15.000 caracteres.
//   - Timeout total de 10 segundos.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { lookup } from "dns/promises";
import { isIP } from "net";
import { z } from "zod";
import { getSessionUser } from "./_lib/session.js";

const URL_SCHEMA = z.object({ url: z.string().trim().min(1).max(2000) });

const MAX_BYTES = 512 * 1024;
const MAX_CHARS = 15_000;
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 4;

function isPrivateIp(ip: string): boolean {
  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    return (
      lower === "::1" ||
      lower === "::" ||
      lower.startsWith("fe80") || // link-local
      lower.startsWith("fc") || // unique local fc00::/7
      lower.startsWith("fd") ||
      lower.startsWith("::ffff:127.") ||
      lower.startsWith("::ffff:10.") ||
      lower.startsWith("::ffff:192.168.") ||
      lower.startsWith("::ffff:172.")
    );
  }
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

/** Valida que el host de `url` NO apunte a infraestructura interna. */
async function assertPublicHost(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("BAD_URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("BAD_PROTOCOL");
  }
  // Host literal tipo http://10.0.0.1/ — validar sin DNS.
  const asIp = isIP(parsed.hostname);
  if (asIp !== 0) {
    if (isPrivateIp(parsed.hostname)) throw new Error("PRIVATE_HOST");
    return parsed;
  }
  if (parsed.hostname === "localhost" || parsed.hostname.endsWith(".localhost") || parsed.hostname.endsWith(".internal")) {
    throw new Error("PRIVATE_HOST");
  }
  try {
    const records = await lookup(parsed.hostname, { all: true });
    if (records.length === 0 || records.some((r) => isPrivateIp(r.address))) {
      throw new Error("PRIVATE_HOST");
    }
  } catch (err) {
    if (err instanceof Error && err.message === "PRIVATE_HOST") throw err;
    throw new Error("DNS_FAIL");
  }
  return parsed;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function htmlToText(html: string): { title: string; content: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]).replace(/\s+/g, " ").trim().slice(0, 300) : "";

  const text = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|section|article|header|footer|nav|li|tr|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return {
    title,
    content: decodeEntities(text)
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n\s*\n+/g, "\n\n")
      .trim()
      .slice(0, MAX_CHARS),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ ok: false, code: "UNAUTHORIZED", error: "Debes iniciar sesión." });
    return;
  }

  const parsedBody = URL_SCHEMA.safeParse(req.body ?? {});
  if (!parsedBody.success) {
    res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "URL inválida." });
    return;
  }

  // Sigue redirects manualmente validando cada destino (anti open-redirect a red interna).
  let target = parsedBody.data.url;
  let response: Response | null = null;
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const validated = await assertPublicHost(target);
      response = await fetch(validated, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "User-Agent": "CreatorIABot/1.0 (+https://creator-ia.com)",
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
        },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) break;
        target = new URL(location, target).toString(); // redirects relativos válidos
        continue;
      }
      break;
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : "UNKNOWN";
    if (reason === "PRIVATE_HOST" || reason === "BAD_PROTOCOL" || reason === "BAD_URL") {
      res.status(400).json({ ok: false, code: "BLOCKED_URL", error: "Esa URL no se puede leer." });
      return;
    }
    if (reason === "DNS_FAIL") {
      res.status(400).json({ ok: false, code: "DNS_FAIL", error: "No se pudo resolver el dominio." });
      return;
    }
    if (err instanceof Error && err.name === "TimeoutError") {
      res.status(504).json({ ok: false, code: "TIMEOUT", error: "El sitio tardó demasiado en responder." });
      return;
    }
    res.status(502).json({ ok: false, code: "FETCH_FAIL", error: "No se pudo leer el sitio." });
    return;
  }

  if (!response || !response.ok) {
    res.status(502).json({ ok: false, code: "FETCH_FAIL", error: `El sitio respondió ${response?.status ?? "sin respuesta"}.` });
    return;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!/text\/html|text\/plain|xhtml/i.test(contentType)) {
    res.status(415).json({ ok: false, code: "UNSUPPORTED", error: "Solo se puede leer contenido de texto/HTML." });
    return;
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BYTES) {
    res.status(413).json({ ok: false, code: "TOO_LARGE", error: "La página es demasiado grande para adjuntar." });
    return;
  }

  let html: string;
  try {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) {
      res.status(413).json({ ok: false, code: "TOO_LARGE", error: "La página es demasiado grande para adjuntar." });
      return;
    }
    html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  } catch {
    res.status(502).json({ ok: false, code: "DECODE_FAIL", error: "No se pudo decodificar la respuesta." });
    return;
  }

  const { title, content } = htmlToText(html);
  if (!content) {
    res.status(422).json({ ok: false, code: "EMPTY", error: "La página no tiene texto legible." });
    return;
  }

  res.status(200).json({ ok: true, url: target, title, content });
}