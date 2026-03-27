import { useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowLeft, Monitor, Apple, Smartphone, Globe,
  Download, Check, Shield, Zap, RefreshCw, Cloud,
} from "lucide-react";
import { toast } from "sonner";

const platforms = [
  {
    icon: Monitor, name: "Windows", label: "Windows 10 / 11",
    size: "~85 MB", format: ".exe",
    url: "https://releases.creatoria.pro/desktop/CreatorIA-Pro-Setup.exe",
    color: "text-aether-blue",
    features: ["Instalación en un clic", "Actualizaciones automáticas", "Sincronización en la nube"],
  },
  {
    icon: Apple, name: "macOS", label: "macOS 12 Monterey+",
    size: "~92 MB", format: ".dmg",
    url: "https://releases.creatoria.pro/desktop/CreatorIA-Pro.dmg",
    color: "text-white",
    features: ["Compatible con Apple Silicon", "Diseño nativo macOS", "Integración con Finder"],
  },
  {
    icon: Smartphone, name: "Android", label: "Android 10+",
    size: "~45 MB", format: ".apk",
    url: "https://releases.creatoria.pro/mobile/CreatorIA-Pro.apk",
    color: "text-emerald-400",
    features: ["Edición en movimiento", "Cámara integrada", "Notificaciones de procesamiento"],
  },
  {
    icon: Globe, name: "Web App", label: "Cualquier navegador",
    size: "Sin descarga", format: "PWA",
    url: "/auth", isWeb: true,
    color: "text-aether-purple",
    features: ["Sin instalación", "Siempre actualizada", "Funciona en cualquier dispositivo"],
  },
];

const Downloads = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050506] text-white font-sans overflow-hidden selection:bg-aether-purple/30 selection:text-white">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-aether-purple/5 blur-[180px]" />
        <div className="absolute -bottom-40 right-1/3 h-[400px] w-[400px] rounded-full bg-aether-blue/5 blur-[150px]" />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/[0.05] bg-[#050506]/40 backdrop-blur-2xl">
        <button onClick={() => navigate("/")} className="flex items-center gap-4 text-white/30 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <Sparkles className="h-5 w-5 text-black" />
            </div>
            <span className="text-sm font-bold font-display uppercase tracking-tight">
              Creator <span className="text-aether-purple">IA</span> Pro
            </span>
          </div>
        </button>
        <button
          onClick={() => navigate("/auth")}
          className="bg-white text-black hover:bg-white/90 rounded-2xl px-8 py-3 text-xs font-bold uppercase tracking-widest font-display transition-all active:scale-95"
        >
          Empezar Gratis
        </button>
      </header>

      <main className="relative z-10 flex flex-col items-center px-8 pt-20 pb-32">
        {/* Badge */}
        <div className="mb-10 flex items-center gap-3 rounded-full border border-white/5 bg-white/[0.03] px-6 py-3">
          <Download className="h-3.5 w-3.5 text-aether-purple" />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] font-display">Multiplataforma</span>
        </div>

        <h1 className="max-w-3xl text-center text-5xl font-bold leading-none tracking-tight font-display md:text-7xl mb-6">
          Descarga <span className="bg-gradient-to-r from-aether-purple to-aether-blue bg-clip-text text-transparent">Creator IA Pro</span>
        </h1>
        <p className="text-center text-base text-white/30 font-medium max-w-lg leading-relaxed">
          Disponible en Windows, macOS y Android. Tu cuenta se sincroniza en todos los dispositivos.
        </p>

        {/* Platform Cards */}
        <div className="mt-20 w-full max-w-5xl grid gap-5 md:grid-cols-2">
          {platforms.map((p) => (
            <div key={p.name} className="aether-card rounded-[2.5rem] border border-white/5 p-8 hover:border-white/10 transition-all duration-500 group">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform ${p.color}`}>
                    <p.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-display tracking-tight">{p.name}</h3>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5 font-display">{p.label}</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-white/30 uppercase tracking-widest font-display">
                  {p.size} · {p.format}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/40 font-medium">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              {p.isWeb ? (
                <button
                  onClick={() => navigate("/auth")}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white text-black text-xs font-bold uppercase tracking-widest font-display hover:bg-white/90 active:scale-95 transition-all"
                >
                  <Globe className="h-4 w-4" />
                  Abrir Web App
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (p.url.includes("releases.creatoria.pro")) {
                      toast.success(`Iniciando descarga segura para ${p.name}...`);
                    } else {
                      window.open(p.url, "_blank");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-white/10 bg-white/5 text-white/60 text-xs font-bold uppercase tracking-widest font-display hover:bg-white/10 hover:text-white active:scale-95 transition-all"
                >
                  <Download className="h-4 w-4" />
                  Descargar para {p.name}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Features row — Tailwind UI 3-column feature list */}
        <div className="mt-20 w-full max-w-4xl grid gap-5 sm:grid-cols-3">
          {[
            { icon: Cloud, title: "Sincronización Total", desc: "Tu cuenta y créditos sincronizados en tiempo real en todos los dispositivos.", color: "text-aether-blue" },
            { icon: RefreshCw, title: "Auto-Actualizaciones", desc: "Recibe las últimas herramientas y mejoras de forma transparente.", color: "text-aether-purple" },
            { icon: Shield, title: "Procesamiento Seguro", desc: "Tus archivos se procesan de forma privada con encriptación E2E.", color: "text-emerald-400" },
          ].map((f) => (
            <div key={f.title} className="aether-card rounded-[2rem] border border-white/5 p-8 text-center group hover:border-white/10 transition-all duration-500">
              <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white font-display tracking-tight mb-2">{f.title}</h3>
              <p className="text-[11px] text-white/30 leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-[11px] text-white/20 max-w-lg font-medium leading-relaxed">
          Próximamente disponible para iOS. Las apps de escritorio requieren una cuenta de Creator IA Pro activa.
        </p>

        <footer className="mt-24 w-full max-w-5xl border-t border-white/[0.05] pt-8 text-center">
          <p className="text-[10px] text-white/15 font-bold uppercase tracking-[0.3em] font-display">
            © {new Date().getFullYear()} Creator IA Pro — Todos los derechos reservados.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Downloads;
