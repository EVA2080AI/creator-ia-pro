import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center bg-background px-6 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Algo salió mal</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Recargar página
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
