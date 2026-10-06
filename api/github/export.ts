// Exportar un proyecto generado a un repositorio de GitHub del usuario.
//
//   GET  → estado para el diálogo: ¿está GitHub configurado en el servidor?,
//          ¿este usuario ya vinculó su cuenta CON permiso de repos?, ¿qué @usuario es?
//   POST → { repoName, privado, archivos:[{path,content}] } → crea el repo y sube
//          todo en un commit. Los archivos viajan en la petición (vienen del DOM de
//          la tarjeta, igual que el ZIP) y NO se guardan en nuestra base.
//
// Códigos que la UI distingue: GITHUB_NOT_CONFIGURED (falta la OAuth app),
// GITHUB_NOT_LINKED / GITHUB_SCOPE / GITHUB_RELINK (→ botón de conectar),
// NAME_TAKEN (→ cambiar nombre), TOO_LARGE / INVALID_FILES (→ mensaje tal cual).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUser } from "../_lib/require-user.js";
import { crearRepoYSubir, GitHubError, githubAccount, githubLogin, githubToken } from "../_lib/github.js";
import { sanitizeRepoName, readmePorDefecto, tieneReadme, validarArchivos, type ArchivoExport } from "../../src/lib/github-export.js";

export const config = { maxDuration: 30 };

const configurado = () => !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method === "GET") {
    if (!configurado()) return void res.status(200).json({ ok: true, configured: false, linked: false });
    const cuenta = await githubAccount(user.userId);
    const linked = !!cuenta?.scopeOk;
    let username: string | null = null;
    if (linked) {
      const token = await githubToken(user.userId);
      if (token) username = await githubLogin(token);
    }
    res.status(200).json({ ok: true, configured: true, linked, username });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }

  if (!configurado()) {
    res.status(503).json({ ok: false, code: "GITHUB_NOT_CONFIGURED", error: "GitHub aún no está configurado en esta plataforma." });
    return;
  }

  const body = (req.body ?? {}) as { repoName?: unknown; privado?: unknown; archivos?: unknown };
  const nombre = sanitizeRepoName(typeof body.repoName === "string" ? body.repoName : "");
  const privado = body.privado !== false; // privado salvo que pidan público explícitamente
  const archivos = (Array.isArray(body.archivos) ? body.archivos : []) as ArchivoExport[];

  const problema = validarArchivos(archivos);
  if (problema) {
    res.status(400).json({ ok: false, code: "INVALID_FILES", error: problema });
    return;
  }

  const token = await githubToken(user.userId);
  if (!token) {
    res.status(403).json({ ok: false, code: "GITHUB_NOT_LINKED", error: "Primero conecta tu cuenta de GitHub con permiso de repositorios." });
    return;
  }

  const completos = tieneReadme(archivos)
    ? archivos
    : [...archivos, { path: "README.md", content: readmePorDefecto(nombre) }];

  try {
    const repo = await crearRepoYSubir(token, nombre, privado, completos);
    res.status(200).json({ ok: true, url: repo.url, repo: repo.fullName, rama: repo.rama, archivos: completos.length });
  } catch (err) {
    if (err instanceof GitHubError) {
      const status =
        err.code === "NAME_TAKEN" ? 409 :
        err.code === "GITHUB_RELINK" || err.code === "GITHUB_SCOPE" ? 403 :
        err.code === "INVALID_NAME" ? 400 :
        err.code === "GITHUB_RATE" ? 429 : 502;
      res.status(status).json({ ok: false, code: err.code, error: err.message });
      return;
    }
    console.error("[github/export] error inesperado:", err);
    res.status(500).json({ ok: false, code: "INTERNAL", error: "No se pudo subir el proyecto. Inténtalo de nuevo." });
  }
}
