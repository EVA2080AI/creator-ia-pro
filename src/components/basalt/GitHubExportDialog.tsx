// Diálogo de "Subir a GitHub". Se monta UNA vez por página de chat y espera el
// evento que dispara la tarjeta de proyecto (useProjectCards → data-act="github"),
// porque la tarjeta es HTML crudo sin acceso a estado React.
//
// Estados por los que pasa, en orden honesto de qué puede faltar:
//   cargando → sin-configurar (falta la OAuth app en el servidor)
//            → sin-vincular   (falta que ESTE usuario autorice el permiso `repo`)
//            → listo          (nombre + privado/público → subir)
//            → subiendo → éxito (enlace al repo) | error con remedio
//
// La vinculación redirige a GitHub y vuelve: el diálogo no sobrevive al viaje,
// así que se avisa que al volver hay que pulsar el botón de la tarjeta otra vez.
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Github, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import {
  GITHUB_EXPORT_EVENT, GITHUB_REPO_SCOPE, sanitizeRepoName, validarArchivos, type ArchivoExport,
} from "@/lib/github-export";

interface Detalle {
  titulo: string;
  archivos: ArchivoExport[];
}

type Estado = "cargando" | "sin-configurar" | "sin-vincular" | "listo" | "subiendo" | "exito";

export function GitHubExportDialog() {
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [usuario, setUsuario] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [privado, setPrivado] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ url: string; repo: string } | null>(null);
  const [vinculando, setVinculando] = useState(false);
  const abierto = useRef(false);
  abierto.current = !!detalle;

  // La tarjeta avisa con los archivos ya leídos del DOM.
  useEffect(() => {
    const onExport = (e: Event) => {
      const d = (e as CustomEvent<Detalle>).detail;
      if (!d?.archivos?.length || abierto.current) return;
      setDetalle(d);
      setNombre(sanitizeRepoName(d.titulo));
      setPrivado(true);
      setError(null);
      setResultado(null);
      setEstado("cargando");
      void fetch("/api/github/export", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { configured?: boolean; linked?: boolean; username?: string | null } | null) => {
          if (!abierto.current) return;
          if (!j || !j.configured) return setEstado("sin-configurar");
          if (!j.linked) return setEstado("sin-vincular");
          setUsuario(j.username ?? null);
          setEstado("listo");
        })
        .catch(() => setEstado("sin-configurar"));
    };
    window.addEventListener(GITHUB_EXPORT_EVENT, onExport);
    return () => window.removeEventListener(GITHUB_EXPORT_EVENT, onExport);
  }, []);

  const conectar = useCallback(async () => {
    setVinculando(true);
    setError(null);
    const { error: err } = await authClient.linkSocial({
      provider: "github",
      scopes: [GITHUB_REPO_SCOPE],
      callbackURL: window.location.pathname,
    });
    if (err) {
      setError(err.message || "No se pudo conectar con GitHub.");
      setVinculando(false);
    }
    // Si no hubo error, el navegador se va a GitHub y vuelve: no hay más que hacer acá.
  }, []);

  const subir = useCallback(async () => {
    if (!detalle) return;
    const problema = validarArchivos(detalle.archivos);
    if (problema) return setError(problema);
    setEstado("subiendo");
    setError(null);
    try {
      const res = await fetch("/api/github/export", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoName: nombre, privado, archivos: detalle.archivos }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; url?: string; repo?: string; code?: string; error?: string }
        | null;
      if (res.ok && json?.ok && json.url) {
        setResultado({ url: json.url, repo: json.repo ?? nombre });
        setEstado("exito");
        return;
      }
      const code = json?.code ?? "";
      if (code === "GITHUB_NOT_LINKED" || code === "GITHUB_SCOPE" || code === "GITHUB_RELINK") {
        setEstado("sin-vincular");
        setError(json?.error ?? null);
        return;
      }
      setEstado("listo");
      setError(json?.error || "No se pudo subir el proyecto. Inténtalo de nuevo.");
    } catch {
      setEstado("listo");
      setError("Sin conexión con el servidor. Inténtalo de nuevo.");
    }
  }, [detalle, nombre, privado]);

  const cerrar = (open: boolean) => {
    if (!open && estado !== "subiendo") setDetalle(null);
  };

  const n = detalle?.archivos.length ?? 0;

  return (
    <Dialog open={!!detalle} onOpenChange={cerrar}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" aria-hidden /> Subir a GitHub
          </DialogTitle>
          <DialogDescription>
            {estado === "exito"
              ? "Tu proyecto ya está en GitHub."
              : `Crea un repositorio en tu cuenta con ${n === 1 ? "este archivo" : `estos ${n} archivos`} en un solo commit.`}
          </DialogDescription>
        </DialogHeader>

        {estado === "cargando" && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Revisando tu cuenta…
          </div>
        )}

        {estado === "sin-configurar" && (
          <p className="rounded-2xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
            La conexión con GitHub aún no está activada en la plataforma. Mientras tanto puedes
            descargar el <b>ZIP</b> y subirlo con <code>git push</code>, o abrir el proyecto en StackBlitz.
          </p>
        )}

        {estado === "sin-vincular" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Para crear repositorios necesitamos tu permiso de GitHub (alcance «repo»). Se pide una
              sola vez; al volver, pulsa de nuevo <b>Subir a GitHub</b> en la tarjeta del proyecto.
            </p>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <button
              type="button"
              disabled={vinculando}
              onClick={conectar}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-bold text-background disabled:opacity-60"
            >
              <Github className="h-4 w-4" aria-hidden />
              {vinculando ? "Abriendo GitHub…" : "Conectar mi GitHub"}
            </button>
          </div>
        )}

        {(estado === "listo" || estado === "subiendo") && (
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); if (estado === "listo") void subir(); }}
          >
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Nombre del repositorio
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={estado === "subiendo"}
                required
                className="mt-1 h-11 w-full rounded-xl border border-border bg-muted/50 px-3 font-mono text-sm text-foreground"
              />
              {usuario && <span className="mt-1 block font-mono text-[11px] font-medium normal-case tracking-normal">se creará en github.com/{usuario}</span>}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={privado}
                onChange={(e) => setPrivado(e.target.checked)}
                disabled={estado === "subiendo"}
                className="h-4 w-4 accent-primary"
              />
              Repositorio privado
            </label>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={estado === "subiendo" || !nombre.trim()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-bold text-background disabled:opacity-60"
            >
              {estado === "subiendo"
                ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Creando el repositorio…</>)
                : `Crear repositorio y subir ${n === 1 ? "1 archivo" : `${n} archivos`}`}
            </button>
          </form>
        )}

        {estado === "exito" && resultado && (
          <div className="space-y-3">
            <a
              href={resultado.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-bold text-background"
            >
              Abrir {resultado.repo} <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
            <p className="text-xs text-muted-foreground">
              Para seguir trabajando: <code>git clone {resultado.url}.git</code>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
