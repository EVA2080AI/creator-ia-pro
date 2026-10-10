import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home, Bug } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
  /** El fallo fue cargando un chunk (pestaña sobre un despliegue viejo o red caída):
   *  tiene SU arreglo (recargar) y "Intentar de nuevo" solo puede volver a fallar. */
  esChunk?: boolean;
}

/** Los mensajes con que Chrome, Safari y Firefox reportan un import() fallido. */
function esErrorDeChunk(error: Error): boolean {
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError/i.test(
    `${error.name} ${error.message}`,
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: "",
    };
  }

  private generateErrorId(): string {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: ``,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Chunk que no cargó: la pestaña quedó sobre un despliegue anterior (o la red
    // parpadeó). Recargar UNA vez lo arregla solo — misma guarda de 60s que el
    // manejador de vite:preloadError en main.tsx, por si este atrapó primero.
    // Sin ticket en ese caso: un reporte por pestaña abierta en cada despliegue
    // sería puro ruido. Si ya recargamos hace nada y sigue fallando, entonces sí
    // se muestra, se reporta, y el botón que manda es "Recargar".
    if (esErrorDeChunk(error)) {
      let recargar = false;
      try {
        const ultima = Number(sessionStorage.getItem("chunk_reload_at") || 0);
        if (Date.now() - ultima >= 60_000) {
          sessionStorage.setItem("chunk_reload_at", String(Date.now()));
          recargar = true;
        }
      } catch { recargar = true; }
      if (recargar) {
        window.location.reload();
        return;
      }
      this.setState({ esChunk: true });
    }

    const errorId = this.generateErrorId();
    this.setState({ errorId, errorInfo: info });

    console.error("ErrorBoundary caught:", {
      errorId,
      error: error.toString(),
      componentStack: info.componentStack,
      timestamp: new Date().toISOString(),
    });

    // "Nuestro equipo ha sido notificado" era mentira: el error moría en la consola
    // del navegador del usuario y el ID no servía para buscar nada (incidente real,
    // 2026-10-05: una usuaria mandó una captura con su ERR-… y no había dónde
    // mirarlo). Ahora queda como ticket (Panel Admin → Tickets), con sesión; si no
    // hay sesión o la red está caída, el intento no rompe nada.
    if (esErrorDeChunk(error)) return;
    try {
      const detalle = [
        error.toString(),
        (error.stack || "").split("\n").slice(0, 4).join("\n"),
        `Componente: ${(info.componentStack || "").trim().split("\n")[0] || "?"}`,
        `URL: ${window.location.href}`,
        `Navegador: ${navigator.userAgent}`,
      ].join("\n\n").slice(0, 3900);
      void fetch("/api/tickets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bug",
          title: `[auto] Pantalla "Algo salió mal" (${errorId})`,
          description: detalle,
          pageUrl: window.location.href.slice(0, 500),
        }),
      }).catch(() => {});
    } catch { /* reportar nunca debe causar otro error */ }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: "",
    });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-card rounded-3xl shadow-xl border border-border p-8 md:p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-rose-500 dark:text-rose-400" />
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-3">
                {this.state.esChunk ? "La app se actualizó" : "Algo salió mal"}
              </h1>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                {this.state.esChunk
                  ? "Salió una versión nueva mientras tenías esta pestaña abierta. Recárgala para seguir donde ibas."
                  : "Lo sentimos, ha ocurrido un error inesperado. Nuestro equipo ha sido notificado."}
              </p>

              {this.state.errorId && (
                <div className="mb-6 p-3 bg-muted rounded-xl w-full">
                  <p className="text-xs text-muted-foreground font-mono">
                    Error ID: {this.state.errorId}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                {/* Con un chunk perdido, "Intentar de nuevo" repite el mismo import roto:
                    no se ofrece. Recargar es el único camino que funciona. */}
                {!this.state.esChunk && (
                  <Button
                    onClick={this.handleReset}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Intentar de nuevo
                  </Button>
                )}
                <Button
                  variant={this.state.esChunk ? "default" : "outline"}
                  onClick={() => window.location.reload()}
                  className={this.state.esChunk ? "flex-1 bg-primary hover:bg-primary/90" : "flex-1"}
                >
                  {this.state.esChunk ? <RefreshCw className="w-4 h-4 mr-2" /> : <Bug className="w-4 h-4 mr-2" />}
                  Recargar página
                </Button>
              </div>

              <button
                onClick={() => window.location.href = "/"}
                className="mt-4 text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
