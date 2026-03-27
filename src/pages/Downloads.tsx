import { useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowLeft, Globe,
  Check, Shield, Zap, RefreshCw, Cloud, Monitor, Smartphone,
} from "lucide-react";

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
          <Globe className="h-3.5 w-3.5 text-aether-purple" />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] font-display">Web App · Sin instalación</span>
        </div>

        <h1 className="max-w-3xl text-center text-5xl font-bold leading-none tracking-tight font-display md:text-7xl mb-6">
          Funciona en<br />
          <span className="bg-gradient-to-r from-aether-purple to-aether-blue bg-clip-text text-transparent">cualquier dispositivo</span>
        </h1>
        <p className="text-center text-base text-white/30 font-medium max-w-lg leading-relaxed mb-16">
          Creator IA Pro es una aplicación web — no necesitas descargar nada.
          Abre el navegador, inicia sesión y listo.
        </p>

        {/* Single CTA card */}
        <div className="w-full max-w-2xl aether-card rounded-[2.5rem] border border-white/[0.08] p-10 hover:border-white/[0.12] transition-all duration-500 group">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-aether-purple/10 border border-aether-purple/20 group-hover:scale-105 transition-transform">
              <Globe className="h-9 w-9 text-aether-purple" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white font-display tracking-tight mb-2">Web App</h3>
              <p className="text-sm text-white/40 font-medium max-w-sm">
                Disponible en cualquier navegador moderno — Chrome, Safari, Firefox, Edge.
                La misma experiencia en todos tus dispositivos.
              </p>
            </div>

            <ul className="grid grid-cols-2 gap-3 w-full max-w-xs">
              {[
                "Sin instalación",
                "Siempre actualizada",
                "Desktop, móvil, tablet",
                "Sincronización en la nube",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-white/50 font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-emerald-400" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate("/auth")}
              className="w-full max-w-xs flex items-center justify-center gap-3 py-4 rounded-2xl bg-white text-black text-xs font-bold uppercase tracking-widest font-display hover:bg-white/90 active:scale-95 transition-all shadow-[0_8px_40px_rgba(255,255,255,0.15)]"
            >
              <Sparkles className="h-4 w-4" />
              Abrir Creator IA Pro
            </button>
          </div>
        </div>

        {/* Devices illustration */}
        <div className="mt-16 flex items-center gap-6 text-white/10">
          <div className="flex flex-col items-center gap-2">
            <Monitor className="h-8 w-8" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Desktop</span>
          </div>
          <div className="w-px h-10 bg-white/[0.06]" />
          <div className="flex flex-col items-center gap-2">
            <Smartphone className="h-8 w-8" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Móvil</span>
          </div>
          <div className="w-px h-10 bg-white/[0.06]" />
          <div className="flex flex-col items-center gap-2">
            <Globe className="h-8 w-8" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Tablet</span>
          </div>
        </div>

        {/* Features row */}
        <div className="mt-16 w-full max-w-4xl grid gap-5 sm:grid-cols-3">
          {[
            { icon: Cloud,     title: "Sincronización Total",    desc: "Tu cuenta y créditos sincronizados en tiempo real.",      color: "text-aether-blue" },
            { icon: RefreshCw, title: "Siempre Actualizada",     desc: "Recibes las últimas mejoras automáticamente al abrir.",   color: "text-aether-purple" },
            { icon: Shield,    title: "Procesamiento Seguro",    desc: "Tus archivos se procesan con encriptación E2E.",          color: "text-emerald-400" },
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

        {/* Also show credits feature */}
        <div className="mt-10 flex items-center gap-3 rounded-full border border-aether-purple/10 bg-aether-purple/[0.04] px-6 py-3">
          <Zap className="h-3.5 w-3.5 text-aether-purple" />
          <span className="text-[11px] font-medium text-white/40">
            Plan gratuito incluye <span className="text-white/70 font-bold">créditos de prueba</span> — sin tarjeta de crédito
          </span>
        </div>

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
