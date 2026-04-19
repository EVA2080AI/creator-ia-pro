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
    const errorId = this.generateErrorId();
    this.setState({ errorId, errorInfo: info });

    console.error("ErrorBoundary caught:", {
      errorId,
      error: error.toString(),
      componentStack: info.componentStack,
      timestamp: new Date().toISOString(),
    });
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
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-zinc-100 p-8 md:p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-rose-100 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-rose-500" />
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight mb-3">
                Algo salió mal
              </h1>

              <p className="text-zinc-500 mb-6 leading-relaxed">
                Lo sentimos, ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
              </p>

              {this.state.errorId && (
                <div className="mb-6 p-3 bg-zinc-100 rounded-xl w-full">
                  <p className="text-xs text-zinc-400 font-mono">
                    Error ID: {this.state.errorId}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Intentar de nuevo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Recargar página
                </Button>
              </div>

              <button
                onClick={() => window.location.href = "/"}
                className="mt-4 text-sm text-zinc-400 hover:text-primary transition-colors flex items-center gap-1"
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
