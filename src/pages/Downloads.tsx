import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import {
  Sparkles, Globe,
  Check, Shield, Zap, RefreshCw, Cloud, Monitor, Smartphone,
} from "lucide-react";
import { Logo } from "@/components/Logo";

const Downloads = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Descargar Creator IA Pro"
        description="Accede a Creator IA Pro desde cualquier dispositivo. Web app disponible sin instalación. Compatible con Chrome, Safari, Firefox y Edge."
        keywords="descargar, web app, Chrome, Safari, Firefox, Edge, Colombia"
        canonical="https://creator-ia.com/descargar"
      />
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/4 blur-[180px] opacity-60" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-8 py-10 pb-32">
        <div className="mb-10">
          <Logo size="md" showText showPro onClick={() => navigate("/")} />
        </div>

        {/* Badge */}
        <div className="mb-10 flex items-center gap-3 rounded-full border border-border bg-card shadow-sm px-6 py-3">
          <Globe className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] font-display">Web App · Sin instalación</span>
        </div>

        <h1 className="max-w-3xl text-center text-5xl font-bold leading-none tracking-tight font-display md:text-7xl mb-6 text-foreground">
          Funciona en<br />
          cualquier dispositivo
        </h1>
        <p className="text-center text-base text-muted-foreground font-medium max-w-lg leading-relaxed mb-16">
          Creator IA Pro es una aplicación web — no necesitas descargar nada.
          Abre el navegador, inicia sesión y listo.
        </p>

        {/* Single CTA card */}
        <div className="w-full max-w-2xl bg-card/80 backdrop-blur-md rounded-[2.5rem] border border-border p-10 hover:border-primary/20 hover:shadow-xl transition-all duration-500 group shadow-sm">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 group-hover:scale-105 transition-transform shadow-[0_8px_16px_-4px_rgba(var(--primary-rgb),0.15)]">
              <Globe className="h-9 w-9 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground font-display tracking-tight mb-2">Web App</h3>
              <p className="text-sm text-muted-foreground font-medium max-w-sm leading-relaxed">
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
                <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80 font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-emerald-500" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate("/auth")}
              className="w-full max-w-xs flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest font-display hover:bg-primary/90 active:scale-95 transition-all shadow-xl shadow-black/10"
            >
              <Sparkles className="h-4 w-4" />
              Abrir Creator IA Pro
            </button>
          </div>
        </div>

        {/* Devices illustration */}
        <div className="mt-16 flex items-center gap-6 text-foreground/80">
          <div className="flex flex-col items-center gap-2">
            <Monitor className="h-8 w-8" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Desktop</span>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="flex flex-col items-center gap-2">
            <Smartphone className="h-8 w-8" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Móvil</span>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="flex flex-col items-center gap-2">
            <Globe className="h-8 w-8" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Tablet</span>
          </div>
        </div>

        {/* Features row */}
        <div className="mt-16 w-full max-w-4xl grid gap-5 sm:grid-cols-3">
          {[
            { icon: Cloud,     title: "Sincronización total",    desc: "Tu cuenta y créditos sincronizados en tiempo real.",      color: "text-primary" },
            { icon: RefreshCw, title: "Siempre actualizada",     desc: "Recibes las últimas mejoras automáticamente al abrir.",   color: "text-primary" },
            { icon: Shield,    title: "Procesamiento seguro",    desc: "Tus archivos viajan cifrados (TLS) y se procesan en servidores seguros.", color: "text-emerald-500" },
          ].map((f) => (
            <div key={f.title} className="p-8 rounded-3xl border border-border bg-card/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
              <f.icon className={`h-8 w-8 mb-4 ${f.color}`} />
              <h4 className="text-base font-bold text-foreground mb-2 font-display">{f.title}</h4>
              <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Also show credits feature */}
        <div className="mt-10 flex items-center gap-3 rounded-full border border-primary/10 bg-primary/[0.04] px-6 py-3">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-medium text-foreground/80">
            Plan gratuito incluye <span className="text-foreground font-bold">créditos de prueba</span> — sin tarjeta de crédito
          </span>
        </div>

        <footer className="mt-24 w-full max-w-5xl border-t border-border pt-8 text-center text-muted-foreground">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] font-display">
            © {new Date().getFullYear()} Creator IA Pro — Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </>
  );
};

export default Downloads;
