import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Zap, Image, ArrowRight, Coins,
  Wand2, ZoomIn, Eraser, ImagePlus, RotateCcw, Palette,
  Star, MessageSquare, PenTool,
  Hash, FileText, Type, Megaphone, TrendingUp,
  Monitor, Apple, Smartphone, Download, CheckCircle2,
  Globe, Users, Layers, Shield, Crown
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
    <>
      <Helmet>
        <title>Creator IA Pro | Ecosistema Industrial de Creación Multimodal</title>
        <meta name="description" content="Domina tu contenido con Creator IA Pro. Herramientas avanzadas de edición de imagen, copywriting y flujos de marketing visual impulsados por inteligencia artificial de primer nivel." />
        <meta property="og:title" content="Creator IA Pro | Ecosistema Industrial" />
        <meta property="og:description" content="Automatiza y potencia tu agencia con IA multimodal. Flujos de alto rendimiento." />
      </Helmet>
      
      <div className="min-h-screen bg-[#09090b] font-inter text-slate-100 overflow-hidden relative selection:bg-[#EC4699]/30">
      {/* Ambient blurs - PicLink Pink/Orange */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[700px] w-[700px] rounded-full bg-[#EC4699]/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#FA8214]/5 blur-[100px]" />
      </div>

      {/* Nav */}
      <header className="relative z-50 flex items-center justify-between px-8 py-6 sm:px-12 sticky top-0 bg-[#09090b]/40 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#EC4699] to-[#FA8214] shadow-lg shadow-[#EC4699]/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-display text-white tracking-tight uppercase leading-none">
              creator ia <span className="text-[#FA8214]">pro</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">V2.1 industrial</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate("/pricing")} variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 hidden sm:flex text-sm font-medium transition-colors">
            Precios
          </Button>
          <Button onClick={() => navigate("/auth")} className="bg-gradient-to-r from-[#EC4699] to-[#FA8214] text-white hover:opacity-90 rounded-md px-8 h-12 shadow-[0_0_20px_-5px_rgba(236,70,153,0.4)] font-bold active:scale-95 transition-all">
            Empezar Gratis
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center px-8 pt-24 pb-40">
        {/* Pulse Badge */}
        <div className="mb-10 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-[11px] text-slate-300 font-bold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="w-1.5 h-1.5 rounded-full bg-[#EC4699] animate-pulse shadow-[0_0_8px_#EC4699]" />
          Ecosistema Creativo Industrial
        </div>

        {/* Hero */}
        <h1 className="max-w-5xl text-center text-8xl font-display leading-[0.9] tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 md:text-9xl lg:text-[10rem] text-white">
          Crea con <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EC4699] to-[#FA8214]">IA</span>
          <br />
          <span className="text-slate-700">Sin límites.</span>
        </h1>

        <p className="mt-10 max-w-2xl text-center text-xl text-slate-400 font-medium animate-in fade-in slide-in-from-bottom-6 duration-1000 leading-relaxed tracking-tight">
          Genera imágenes, mejora fotos, crea textos de marketing, logos y flows visuales.
          <strong className="text-white font-bold"> 12+ herramientas profesionales</strong> en una sola plataforma.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-5 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Button onClick={() => navigate("/auth")} size="lg" className="bg-gradient-to-r from-[#EC4699] to-[#FA8214] text-white hover:opacity-90 gap-3 text-lg px-12 rounded-md h-16 shadow-[0_0_30px_-5px_rgba(236,70,153,0.5)] font-bold active:scale-95 transition-all">
            Crear cuenta gratis
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button onClick={() => navigate("/pricing")} size="lg" variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-3 text-lg px-10 rounded-md h-16 font-bold shadow-sm transition-all focus:ring-0">
            <Crown className="h-5 w-5 text-[#ffb800]" />
            Ver planes
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
              <p className="text-7xl font-display text-white group-hover:text-[#EC4699] transition-colors duration-500 tracking-tight">{s.value}</p>
              <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Features Row - PicLink Numbered Cards */}
        <div className="mt-24 w-full max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
          {features.map((f, i) => (
            <div key={f.title} className="relative group rounded-xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-sm hover:bg-white/[0.04] transition-all overflow-hidden">
              <span className="absolute -right-4 -bottom-8 text-9xl font-display text-white/[0.03] pointer-events-none group-hover:text-white/[0.05] transition-colors">
                0{i + 1}
              </span>
              <f.icon className="h-6 w-6 text-[#EC4699] mb-6" />
              <h3 className="text-xl font-display text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed uppercase tracking-wide font-bold">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Tools Grid — All Accessible */}
        <div className="mt-32 w-full max-w-6xl">
          <div className="mb-16 text-center">
            <Badge className="mb-4 bg-[#EC4699]/10 text-[#EC4699] border-[#EC4699]/20 hover:bg-[#EC4699]/10 uppercase tracking-widest px-4 py-1">Suite Completa</Badge>
            <h2 className="text-5xl font-display text-white md:text-7xl">
              Todo lo que necesitas, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EC4699] to-[#FA8214]">en un solo lugar</span>
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto uppercase text-xs font-bold tracking-widest">
              Haz clic en cualquier herramienta para empezar a crear.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
            {aiTools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => navigate(tool.path)}
                className="group rounded-xl border border-white/5 bg-white/[0.02] p-8 text-left backdrop-blur-sm
                  hover:border-[#EC4699]/30 hover:-translate-y-1 hover:shadow-[0_8px_30px_-10px_rgba(236,70,153,0.2)]
                  transition-all duration-300 relative overflow-hidden"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 group-hover:bg-[#EC4699]/10 transition-colors">
                  <tool.icon className="h-6 w-6 text-slate-400 group-hover:text-[#EC4699] transition-colors" />
                </div>
                <h3 className="text-lg font-display text-white mb-2">{tool.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-bold uppercase tracking-wide">{tool.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-[#EC4699] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                  Abrir Herramienta <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Formaketing Highlight */}
        <div className="mt-32 w-full max-w-6xl">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden backdrop-blur-sm">
            <div className="grid md:grid-cols-2">
              <div className="p-12 md:p-20 flex flex-col justify-center">
                <Badge className="w-fit mb-6 bg-[#EC4699]/10 text-[#EC4699] border-[#EC4699]/20 hover:bg-[#EC4699]/10 uppercase tracking-widest px-4 py-1">Formaketing Studio</Badge>
                <h2 className="text-5xl font-display text-white md:text-7xl leading-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EC4699] to-[#FA8214]">Marketing Visual</span> con IA
                </h2>
                <p className="mt-6 text-slate-500 leading-relaxed font-bold uppercase text-xs tracking-widest">
                  EL LIENZO INFINITO PARA CREATIVOS. Crea flujos de campañas, conecta nodos, genera assets y construye funnels completos.
                </p>
                <ul className="mt-8 space-y-4">
                  {["Lienzo infinito con nodos conectables", "Generación de imágenes inline", "Flows de marketing visual", "Exporta a código (Prompt-to-UI)"].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <CheckCircle2 className="h-4 w-4 text-[#EC4699] shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => navigate("/auth")} className="mt-12 w-fit bg-gradient-to-r from-[#EC4699] to-[#FA8214] text-white hover:opacity-90 gap-3 rounded-md px-10 h-14 shadow-[0_0_20px_-5px_rgba(236,70,153,0.4)] font-bold uppercase text-xs tracking-widest">
                  <Palette className="h-5 w-5" />
                  Probar Studio
                </Button>
              </div>
              <div className="flex items-center justify-center bg-white/[0.01] p-12 min-h-[400px] relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#EC4699]/5 to-transparent pointer-events-none" />
                <div className="relative grid grid-cols-2 gap-6">
                  {[Megaphone, Image, Type, TrendingUp].map((Icon, i) => (
                    <div key={i} className="flex h-32 w-32 items-center justify-center rounded-xl border border-white/5 bg-[#09090b] shadow-2xl hover:border-[#EC4699]/20 transition-colors group">
                      <Icon className="h-10 w-10 text-slate-700 group-hover:text-[#EC4699] transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-32 w-full max-w-6xl">
          <h2 className="text-center text-5xl font-display text-white mb-16 md:text-7xl">
            Lo que dicen nuestros <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EC4699] to-[#FA8214]">creadores</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-white/5 bg-white/[0.02] p-10 backdrop-blur-sm">
                <div className="flex gap-1 mb-6">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-[#FA8214] text-[#FA8214]" />
                  ))}
                </div>
                <p className="text-lg text-slate-300 leading-relaxed font-medium mb-8">"{t.text}"</p>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-display text-white uppercase tracking-wider">{t.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-40 w-full max-w-4xl rounded-2xl border border-white/5 bg-[#09090b] p-16 md:p-24 text-center shadow-2xl animate-fade-in relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#EC4699]/10 via-transparent to-[#FA8214]/10 pointer-events-none" />
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EC4699] to-[#FA8214] shadow-2xl shadow-[#EC4699]/20 relative z-10">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-6xl font-display text-white md:text-8xl relative z-10 leading-none">
            EMPIEZA A CREAR <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EC4699] to-[#FA8214]">HOY MISMO</span>
          </h2>
          <p className="mt-8 text-slate-500 max-w-md mx-auto relative z-10 uppercase text-xs font-bold tracking-[0.2em] leading-loose">
            ÚNETE A MILES DE CREADORES DE ALTO NIVEL. 10 CRÉDITOS GRATIS. SIN TARJETA DE CRÉDITO.
          </p>
          <Button onClick={() => navigate("/auth")} size="lg" className="mt-12 bg-gradient-to-r from-[#EC4699] to-[#FA8214] text-white hover:opacity-90 gap-3 px-16 rounded-md h-16 text-sm font-bold uppercase tracking-widest shadow-[0_0_30px_-5px_rgba(236,70,153,0.5)] relative z-10 transition-all hover:scale-105 active:scale-95">
            Comenzar Gratis
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-32 w-full max-w-6xl border-t border-white/5 pt-12 text-center text-[10px] text-slate-600 space-y-4 pb-20">
          <p className="uppercase tracking-[0.3em] font-bold">© {new Date().getFullYear()} Creator IA Pro. Todos los derechos reservados.</p>
          <p className="text-slate-700 uppercase tracking-[0.1em] font-bold">PLATAFORMA DE IA GENERATIVA PARA CREADORES DEL FUTURO 🚀</p>
        </footer>
      </main>
    </div>
    </>
  );
};

export default Index;
