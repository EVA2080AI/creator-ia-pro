// Subir un proyecto generado al GitHub del usuario.
//
// El token lo administra better-auth (tabla `account`, providerId "github"):
// mismo patrón que drive.ts. El permiso `repo` NO se pide al iniciar sesión —
// se vincula aparte desde el diálogo de exportar, con linkSocial.
//
// La subida es UN solo commit: árbol con el contenido inline (la API de git data
// acepta `content` de texto por entrada, así que no hay que crear blobs uno a
// uno) → commit → mover la rama. El repo se crea con auto_init para tener una
// rama base; nuestro árbol completo la reemplaza en el commit siguiente.
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { tieneRepoScope, type ArchivoExport } from "../../src/lib/github-export.js";
import { auth } from "./auth.js";

const GH = "https://api.github.com";

/** Error con código estable para que el endpoint lo traduzca a HTTP + UI. */
export class GitHubError extends Error {
  code: string;
  constructor(code: string, mensaje: string) {
    super(mensaje);
    this.code = code;
  }
}

/** La cuenta GitHub del usuario, si existe, y si ya autorizó el permiso de repos. */
export async function githubAccount(userId: string): Promise<{ id: string; scopeOk: boolean } | null> {
  const db = getDb();
  const [row] = await db
    .select({ id: schema.account.id, scope: schema.account.scope })
    .from(schema.account)
    .where(and(eq(schema.account.userId, userId), eq(schema.account.providerId, "github")))
    .limit(1);
  if (!row) return null;
  return { id: row.id, scopeOk: tieneRepoScope(row.scope) };
}

/** Token de GitHub refrescado por better-auth (los de OAuth apps no caducan, pero
 *  el camino es el mismo que en Drive y cubre el día en que sí caduquen). */
export async function githubToken(userId: string): Promise<string | null> {
  const cuenta = await githubAccount(userId);
  if (!cuenta?.scopeOk) return null;
  try {
    const res = await auth.api.getAccessToken({ body: { accountId: cuenta.id, userId } });
    return (res as { accessToken?: string })?.accessToken ?? null;
  } catch (err) {
    console.error("[github] No se pudo obtener el token:", err);
    return null;
  }
}

async function gh(token: string, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${GH}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "creator-ia-pro",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

async function fallo(res: Response, contexto: string): Promise<never> {
  const texto = (await res.text().catch(() => "")).slice(0, 300);
  if (res.status === 401) throw new GitHubError("GITHUB_RELINK", "GitHub rechazó el acceso (token revocado). Vuelve a conectar tu cuenta.");
  if (res.status === 403 && /rate limit/i.test(texto)) throw new GitHubError("GITHUB_RATE", "GitHub limitó las peticiones de tu cuenta. Inténtalo en unos minutos.");
  if (res.status === 403) throw new GitHubError("GITHUB_SCOPE", "Tu cuenta de GitHub no dio el permiso de repositorios. Vuelve a conectarla.");
  console.error(`[github] ${contexto}:`, res.status, texto);
  throw new GitHubError("GITHUB_ERROR", `GitHub respondió ${res.status} al ${contexto}.`);
}

/** El usuario de GitHub (para mostrar "@login" en el diálogo y armar URLs). */
export async function githubLogin(token: string): Promise<string | null> {
  const res = await gh(token, "/user");
  if (!res.ok) return null;
  const json = (await res.json()) as { login?: string };
  return json?.login ?? null;
}

export interface RepoCreado {
  url: string;
  fullName: string;
  rama: string;
}

/**
 * Crea `nombre` en la cuenta del usuario y sube los archivos en un commit.
 * Lanza GitHubError con código estable; el nombre repetido es NAME_TAKEN para
 * que la UI ofrezca cambiarlo en vez de mostrar un error genérico.
 */
export async function crearRepoYSubir(
  token: string,
  nombre: string,
  privado: boolean,
  archivos: ArchivoExport[],
): Promise<RepoCreado> {
  const creado = await gh(token, "/user/repos", {
    method: "POST",
    body: JSON.stringify({
      name: nombre,
      description: "Generado con Creator IA — creator-ia.com",
      private: privado,
      auto_init: true,
    }),
  });
  if (creado.status === 422) {
    const texto = await creado.text().catch(() => "");
    if (/already exists/i.test(texto)) throw new GitHubError("NAME_TAKEN", `Ya tienes un repositorio llamado «${nombre}».`);
    console.error("[github] crear repo 422:", texto.slice(0, 300));
    throw new GitHubError("INVALID_NAME", "GitHub rechazó ese nombre de repositorio.");
  }
  if (!creado.ok) await fallo(creado, "crear el repositorio");
  const repo = (await creado.json()) as { full_name: string; html_url: string; default_branch?: string };
  const rama = repo.default_branch || "main";

  // auto_init tarda un instante en materializar la rama: reintento corto.
  let baseSha: string | null = null;
  for (let i = 0; i < 4 && !baseSha; i++) {
    if (i) await new Promise((r) => setTimeout(r, 600));
    const ref = await gh(token, `/repos/${repo.full_name}/git/ref/${encodeURIComponent(`heads/${rama}`)}`);
    if (ref.ok) baseSha = ((await ref.json()) as { object?: { sha?: string } }).object?.sha ?? null;
  }
  if (!baseSha) throw new GitHubError("GITHUB_ERROR", "El repositorio se creó pero su rama inicial no apareció. Revísalo en GitHub.");

  // Sin base_tree: el árbol es exactamente el proyecto (el README de auto_init
  // desaparece salvo que el proyecto traiga el suyo — nosotros ya le añadimos uno).
  const arbol = await gh(token, `/repos/${repo.full_name}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      tree: archivos.map((a) => ({ path: a.path, mode: "100644", type: "blob", content: a.content })),
    }),
  });
  if (!arbol.ok) await fallo(arbol, "preparar los archivos");
  const treeSha = ((await arbol.json()) as { sha: string }).sha;

  const commit = await gh(token, `/repos/${repo.full_name}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: "Proyecto generado con Creator IA\n\nhttps://creator-ia.com",
      tree: treeSha,
      parents: [baseSha],
    }),
  });
  if (!commit.ok) await fallo(commit, "crear el commit");
  const commitSha = ((await commit.json()) as { sha: string }).sha;

  const ref = await gh(token, `/repos/${repo.full_name}/git/refs/${encodeURIComponent(`heads/${rama}`)}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commitSha, force: false }),
  });
  if (!ref.ok) await fallo(ref, "publicar el commit");

  return { url: repo.html_url, fullName: repo.full_name, rama };
}
