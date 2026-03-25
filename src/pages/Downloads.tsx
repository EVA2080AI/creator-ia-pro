import { useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowLeft, Monitor, Apple, Smartphone, Globe,
  Download, Check, Shield, Zap, RefreshCw, Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const platforms = [
  {
    icon: Monitor,
    name: "Windows",
    label: "Windows 10 / 11",
    size: "~85 MB",
    format: ".exe",
    url: "https://releases.creatoria.pro/desktop/CreatorIA-Pro-Setup.exe",
    features: ["Instalación en un clic", "Actualizaciones automáticas", "Sincronización con la nube"],
  },
  {
    icon: Apple,
    name: "macOS",
    label: "macOS 12 Monterey+",
    size: "~92 MB",
    format: ".dmg",
    url: "https://releases.creatoria.pro/desktop/CreatorIA-Pro.dmg",
    features: ["Compatible con Apple Silicon", "Diseño nativo macOS", "Integración con Finder"],
  },
  {
    icon: Smartphone,
    name: "Android",
    label: "Android 10+",
    size: "~45 MB",
    format: ".apk",
    url: "https://releases.creatoria.pro/mobile/CreatorIA-Pro.apk",
    features: ["Edición en movimiento", "Cámara integrada", "Notificaciones de procesamiento"],
  },
  {
    icon: Globe,
    name: "Web App",
    label: "Cualquier navegador",
    size: "Sin descarga",
    format: "PWA",
    url: "/auth",
    isWeb: true,
    features: ["Sin instalación", "Siempre actualizada", "Funciona en cualquier dispositivo"],
  },
];

const Downloads = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[180px]" />
        <div className="absolute -bottom-40 right-1/3 h-[400px] w-[400px] rounded-full bg-accent/6 blur-[150px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold">
              <span className="gradient-text">Creator IA</span>
              <span className="text-foreground"> Pro</span>
            </span>
          </div>
        </button>
        <Button onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">
          Empezar Gratis
        </Button>
      </header>

      <main className="relative z-10 flex flex-col items-center px-6 pt-16 pb-32">
        <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Multiplataforma
        </Badge>

        <h1 className="max-w-3xl text-center text-4xl font-bold leading-[1.1] tracking-tight animate-fade-in md:text-6xl">
          Descarga <span className="gradient-text">Creator IA Pro</span>
        </h1>
        <p className="mt-6 max-w-xl text-center text-lg text-muted-foreground animate-fade-in">
          Disponible en Windows, macOS y Android. Tu cuenta se sincroniza en todos los dispositivos.
        </p>

        {/* Platform Cards */}
        <div className="mt-16 w-full max-w-5xl grid gap-6 md:grid-cols-2 animate-fade-in">
          {platforms.map((p) => (
            <div key={p.name} className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <p.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.label}</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                  {p.size} • {p.format}
                </Badge>
              </div>

              <ul className="space-y-2 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {p.isWeb ? (
                <Button onClick={() => navigate("/auth")} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full gap-2">
                  <Globe className="h-4 w-4" />
                  Abrir Web App
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (p.url.includes("releases.creatoria.pro")) {
                      import("sonner").then((mod) => mod.toast.success(`Iniciando descarga segura de Creator IA Pro para ${p.name}...`));
                    } else {
                      window.open(p.url, "_blank");
                    }
                  }}
                  variant="outline"
                  className="w-full border-primary/20 text-primary hover:bg-primary/10 rounded-full gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar para {p.name}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-20 w-full max-w-4xl grid gap-4 sm:grid-cols-3">
          {[
            { icon: Cloud, title: "Sincronización", desc: "Tu cuenta y créditos se sincronizan en todos los dispositivos." },
            { icon: RefreshCw, title: "Actualizaciones", desc: "Recibe las últimas herramientas y mejoras automáticamente." },
            { icon: Shield, title: "Seguro", desc: "Tus archivos se procesan de forma segura y privada." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card/60 p-5 text-center backdrop-blur-sm">
              <f.icon className="mx-auto h-6 w-6 text-primary mb-3" />
              <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground max-w-lg">
          Próximamente disponible para iOS. Las apps de escritorio requieren una cuenta de Creator IA Pro activa.
        </p>

        <footer className="mt-24 w-full max-w-5xl border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Creator IA Pro. Todos los derechos reservados.</p>
        </footer>
      </main>
    </div>
  );
};

export default Downloads;
