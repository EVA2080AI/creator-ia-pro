import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Sparkles, ArrowLeft, Globe,
  Check, Shield, Zap, RefreshCw, Cloud, Monitor, Smartphone,
} from "lucide-react";

const Downloads = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet><title>Descargas | Creator IA Pro</title></Helmet>
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[180px]" />
        <div className="absolute -bottom-40 right-1/3 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <div id="main-content" className="relative z-10 flex flex-col items-center px-8 py-10 pb-32">
        {/* Badge */}
        <div className="mb-10 flex items-center gap-3 rounded-full border border-white/5 bg-white/[0.03] px-6 py-3">
          <Globe className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.3em] font-display">Web App · Sin instalación</span>
        </div>

        <h1 className="max-w-3xl text-center text-5xl font-bold leading-none tracking-tight font-display md:text-7xl mb-6">
          Funciona en<br />
          <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">cualquier dispositivo</span>
        </h1>
        <p className="text-center text-base text-white/60 font-medium max-w-lg leading-relaxed mb-16">
          Creator IA Pro es una aplicación web — no necesitas descargar nada.
          Abre el navegador, inicia sesión y listo.
        </p>

        {/* Single CTA card */}
        <div className="w-full max-w-2xl bg-white/[0.03] rounded-[2.5rem] border border-white/[0.08] p-10 hover:border-white/[0.12] transition-all duration-500 group">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 group-hover:scale-105 transition-transform">
              <Globe className="h-9 w-9 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white font-display tracking-tight mb-2">Web App</h3>
              <p className="text-sm text-white/60 font-medium max-w-sm">
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
        <div className="mt-16 flex items-center gap-6 text-white/50">
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
            { icon: Cloud,     title: "Sincronización Total",    desc: "Tu cuenta y créditos sincronizados en tiempo real.",      color: "text-primary" },
            { icon: RefreshCw, title: "Siempre Actualizada",     desc: "Recibes las últimas mejoras automáticamente al abrir.",   color: "text-primary" },
            { icon: Shield,    title: "Procesamiento Seguro",    desc: "Tus archivos se procesan con encriptación E2E.",          color: "text-emerald-400" },
          ].map((f) => (
            <div key={f.title} className="bg-white/[0.03] rounded-[2rem] border border-white/5 p-8 text-center group hover:border-white/10 transition-all duration-500">
              <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white font-display tracking-tight mb-2">{f.title}</h3>
              <p className="text-[11px] text-white/60 leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Also show credits feature */}
        <div className="mt-10 flex items-center gap-3 rounded-full border border-primary/10 bg-primary/[0.04] px-6 py-3">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-medium text-white/60">
            Plan gratuito incluye <span className="text-white/70 font-bold">créditos de prueba</span> — sin tarjeta de crédito
          </span>
        </div>

        <footer className="mt-24 w-full max-w-5xl border-t border-white/[0.05] pt-8 text-center">
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.3em] font-display">
            © {new Date().getFullYear()} Creator IA Pro — Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </>
  );
};

export default Downloads;
