import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Zap, Image, ArrowRight, Coins,
  Wand2, ZoomIn, Eraser, ImagePlus, RotateCcw, Palette,
  Star, MessageSquare, PenTool,
  Hash, FileText, Type, Megaphone, TrendingUp,
  Monitor, Apple, Smartphone, Download, CheckCircle2,
  Globe, Users, Layers, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const aiTools = [
  { icon: Wand2, name: "Mejorar Imagen", desc: "Mejora calidad y nitidez al instante.", path: "/herramienta/mejorar-imagen", cat: "image" },
  { icon: ZoomIn, name: "Ampliar 4x", desc: "Escala sin perder detalles.", path: "/herramienta/ampliar-4x", cat: "image" },
  { icon: Eraser, name: "Borrar Objetos", desc: "Elimina lo que sobra con un clic.", path: "/herramienta/borrar-objetos", cat: "image" },
  { icon: ImagePlus, name: "Quitar Fondo", desc: "Fondos eliminados automáticamente.", path: "/herramienta/quitar-fondo", cat: "image" },
  { icon: RotateCcw, name: "Restaurar Foto", desc: "Revive fotos antiguas.", path: "/herramienta/restaurar-foto", cat: "image" },
  { icon: Image, name: "Texto a Imagen", desc: "Crea imágenes desde texto.", path: "/herramienta/texto-a-imagen", cat: "image" },
  { icon: MessageSquare, name: "AI Copywriter", desc: "Textos de marketing con IA.", path: "/herramienta/ai-copywriter", cat: "marketing" },
  { icon: PenTool, name: "Logo Maker", desc: "Logos profesionales con IA.", path: "/herramienta/logo-maker", cat: "marketing" },
  { icon: Hash, name: "Social Media Kit", desc: "Contenido para redes sociales.", path: "/herramienta/social-media-kit", cat: "marketing" },
  { icon: FileText, name: "AI Blog Writer", desc: "Artículos SEO completos.", path: "/herramienta/ai-blog-writer", cat: "marketing" },
  { icon: Type, name: "Ad Generator", desc: "Anuncios para Google y Meta.", path: "/herramienta/ad-generator", cat: "marketing" },
  { icon: Palette, name: "Formaketing Studio", desc: "Flows de marketing visual.", path: "/canvas", cat: "studio" },
];



const testimonials = [
  { name: "María G.", role: "Community Manager", text: "Creator IA Pro cambió mi flujo de trabajo. Genero contenido para 5 marcas en la mitad del tiempo." },
  { name: "Carlos R.", role: "Diseñador Freelance", text: "Las herramientas de mejora de imagen y upscale son increíbles. Mis clientes notan la diferencia." },
  { name: "Ana L.", role: "CEO, Digital Agency", text: "El Formaketing Studio nos permite crear flows de marketing visual que antes tardaban semanas." },
];

const features = [
  { icon: Layers, title: "12+ Herramientas IA", desc: "Todo integrado en una sola plataforma." },
  { icon: Shield, title: "Seguro y Privado", desc: "Tus datos nunca se comparten." },
  { icon: Users, title: "Para Equipos", desc: "Espacios colaborativos y compartidos." },
  { icon: Zap, title: "Velocidad Pro", desc: "Procesamiento rápido con GPU cloud." },
];

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white overflow-hidden text-slate-900 font-sans">
      {/* Ambient blurs - Pulse Magenta */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[700px] w-[700px] rounded-full bg-[#ff0071]/3 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-slate-50 blur-[100px]" />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 sm:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff0071] shadow-xl shadow-[#ff0071]/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900 tracking-tight lowercase">
              creator_ia <span className="text-[#ff0071]">pro</span>
            </span>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">V6.2 Pulse</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate("/pricing")} variant="ghost" className="text-slate-400 hover:text-[#ff0071] hover:bg-[#ff0071]/5 hidden sm:flex text-sm font-bold lowercase">
            precios
          </Button>
          <Button onClick={() => navigate("/auth")} className="bg-[#ff0071] text-white hover:bg-[#e60066] rounded-full px-8 h-12 shadow-xl shadow-[#ff0071]/20 font-bold lowercase tracking-normal active:scale-95 transition-all">
            empezar gratis
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center px-8 pt-24 pb-40">
        {/* Pulse Badge */}
        <div className="mb-10 flex items-center gap-3 rounded-full border border-slate-100 bg-slate-50/50 px-6 py-2.5 text-[11px] text-slate-500 font-bold lowercase animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ff0071] animate-pulse" />
          disponible en windows, macos y android
        </div>

        {/* Hero */}
        <h1 className="max-w-5xl text-center text-6xl font-bold leading-[1.05] tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 md:text-8xl lg:text-9xl text-slate-900 lowercase">
          crea con <span className="text-[#ff0071]">ia</span>
          <br />
          <span className="text-slate-200">sin límites.</span>
        </h1>

        <p className="mt-10 max-w-2xl text-center text-xl text-slate-400 lowercase font-medium animate-in fade-in slide-in-from-bottom-6 duration-1000 leading-relaxed">
          genera imágenes, mejora fotos, crea textos de marketing, logos y flows visuales.
          <strong className="text-slate-900 font-bold"> 12+ herramientas profesionales</strong> en una sola plataforma.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-5 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Button onClick={() => navigate("/auth")} size="lg" className="bg-[#ff0071] text-white hover:bg-[#e60066] gap-3 text-lg px-12 rounded-[2rem] h-16 shadow-2xl shadow-[#ff0071]/20 font-bold lowercase active:scale-95 transition-all">
            crear cuenta gratis
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button onClick={() => navigate("/descargar")} size="lg" variant="outline" className="border-slate-100 text-slate-600 hover:bg-slate-50 gap-3 text-lg px-10 rounded-[2rem] h-16 font-bold lowercase shadow-sm transition-all">
            <Download className="h-5 w-5" />
            descargar app
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-28 grid grid-cols-2 gap-16 sm:grid-cols-4 animate-in fade-in duration-1000">
          {[
            { value: "12+", label: "herramientas ia" },
            { value: "100", label: "créditos gratis" },
            { value: "4x", label: "upscale máximo" },
            { value: "3", label: "plataformas" },
          ].map((s) => (
            <div key={s.label} className="text-center group">
              <p className="text-6xl font-bold text-slate-900 group-hover:text-[#ff0071] transition-colors duration-500">{s.value}</p>
              <p className="mt-3 text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-40 w-full max-w-6xl border-t border-slate-50 pt-10 text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] space-y-3">
          <p>© {new Date().getFullYear()} creator ia pro • pulse engine v6.2</p>
          <p className="opacity-40">plataforma de ia generativa para creadores del futuro 🚀</p>
        </footer>
       {/* Features Row */}
        <div className="mt-24 w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card/50 p-5 text-center backdrop-blur-sm">
              <f.icon className="mx-auto h-6 w-6 text-primary mb-3" />
              <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Tools Grid — All Accessible */}
        <div className="mt-28 w-full max-w-6xl">
          <div className="mb-12 text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">Suite Completa</Badge>
            <h2 className="text-3xl font-bold text-foreground md:text-5xl">
              Todo lo que necesitas, <span className="gradient-text">en un solo lugar</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Haz clic en cualquier herramienta para empezar a crear.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
            {aiTools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => navigate(tool.path)}
                className="group rounded-2xl border border-border bg-card/60 p-5 text-left backdrop-blur-sm
                  hover:border-primary/30 hover:-translate-y-1 hover:shadow-[0_8px_30px_-10px_hsl(262_83%_58%/0.2)]
                  transition-all duration-200"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <tool.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{tool.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Abrir <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Formaketing Highlight */}
        <div className="mt-28 w-full max-w-5xl">
          <div className="rounded-3xl border border-primary/20 bg-card/60 overflow-hidden node-shadow backdrop-blur-sm">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <Badge className="w-fit mb-4 bg-accent/10 text-accent border-accent/20 hover:bg-accent/10">Formaketing</Badge>
                <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                  <span className="gradient-accent-text">Marketing Visual</span> con IA
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  El lienzo infinito para marketing. Crea flows de campañas, conecta nodos, genera assets y construye funnels completos con inteligencia artificial.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {["Lienzo infinito con nodos conectables", "Generación de imágenes inline", "Flows de marketing visual", "Exporta campañas completas"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => navigate("/auth")} className="mt-8 w-fit bg-accent text-accent-foreground hover:bg-accent/90 gap-2 rounded-full px-6">
                  <Palette className="h-4 w-4" />
                  Probar Formaketing
                </Button>
              </div>
              <div className="flex items-center justify-center bg-muted/10 p-8 min-h-[320px]">
                <div className="relative">
                  <div className="absolute -inset-6 rounded-3xl bg-primary/5 blur-2xl" />
                  <div className="relative grid grid-cols-2 gap-4">
                    {[Megaphone, Image, Type, TrendingUp].map((Icon, i) => (
                      <div key={i} className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-card node-shadow hover:border-primary/20 transition-colors">
                        <Icon className="h-9 w-9 text-primary/50" />
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-12 left-[92px] w-10 h-0.5 bg-accent/40" />
                  <div className="absolute top-[92px] left-12 h-10 w-0.5 bg-accent/40" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Download Section */}
        <div className="mt-28 w-full max-w-5xl">
          <div className="rounded-3xl border border-primary/20 bg-card/60 p-10 text-center backdrop-blur-sm node-shadow">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">Multiplataforma</Badge>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Descarga <span className="gradient-text">Creator IA Pro</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Disponible en Windows, macOS y Android. Tu cuenta se sincroniza en todos los dispositivos.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {[
                { icon: Monitor, name: "Windows" },
                { icon: Apple, name: "macOS" },
                { icon: Smartphone, name: "Android" },
              ].map((p) => (
                <div key={p.name} className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-5 py-2.5">
                  <p.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => navigate("/descargar")} size="lg" className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-full px-10">
              <Download className="h-4 w-4" />
              Ver Descargas
            </Button>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-28 w-full max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-foreground mb-12 md:text-4xl">
            Lo que dicen nuestros <span className="gradient-text">creadores</span>
          </h2>
          <div className="grid gap-5 md:grid-cols-3 animate-fade-in">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-28 w-full max-w-2xl rounded-3xl border border-primary/20 bg-card/60 p-12 text-center node-shadow backdrop-blur-sm animate-fade-in">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Empieza a crear <span className="gradient-text">hoy</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Únete a miles de creadores que ya usan Creator IA Pro. 10 créditos gratis, sin tarjeta.
          </p>
          <Button onClick={() => navigate("/auth")} size="lg" className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-10 rounded-full h-12 text-base">
            Empezar Gratis
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-24 w-full max-w-5xl border-t border-border pt-8 text-center text-xs text-muted-foreground space-y-2">
          <p>© {new Date().getFullYear()} Creator IA Pro. Todos los derechos reservados.</p>
          <p className="text-muted-foreground/50">Plataforma de IA generativa para creadores del futuro 🚀</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
