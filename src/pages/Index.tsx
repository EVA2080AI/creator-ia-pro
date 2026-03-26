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
      
      <div className="min-h-screen bg-[#050506] font-sans text-slate-100 overflow-hidden relative selection:bg-white/10 selection:text-white">
      {/* Ambient blurs - Industrial Monochrome */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[700px] w-[700px] rounded-full bg-white/[0.03] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-white/[0.02] blur-[100px]" />
      </div>

      {/* Nav */}
      <header className="relative z-50 flex items-center justify-between px-8 py-8 sm:px-14 sticky top-0 bg-[#050506]/60 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-3xl shadow-white/10">
            <Sparkles className="h-6 w-6 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-white tracking-tighter uppercase leading-none lowercase">
              nexus_ <span className="text-white/40">system</span>
            </span>
            <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] mt-2">V2.1 industrial_core</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Button onClick={() => navigate("/pricing")} variant="ghost" className="text-white/20 hover:text-white hover:bg-white/5 hidden sm:flex text-[10px] font-black uppercase tracking-widest transition-colors">
            nexus_tiers
          </Button>
          <Button onClick={() => navigate("/auth")} className="bg-white text-black hover:bg-white/90 rounded-2xl px-10 h-13 shadow-3xl shadow-white/5 font-black uppercase text-[10px] tracking-[0.3em] active:scale-95 transition-all">
            init_nexus
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center px-8 pt-32 pb-48">
        {/* Pulse Badge */}
        <div className="mb-14 flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-8 py-3 text-[10px] text-white/40 font-black uppercase tracking-[0.3em] animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
          industrial_multimodal_ecosystem
        </div>

        {/* Hero */}
        <h1 className="max-w-6xl text-center text-8xl font-black leading-[0.85] tracking-tighter animate-in fade-in slide-in-from-bottom-4 duration-1000 md:text-9xl lg:text-[11rem] text-white lowercase">
          neural_ <span className="text-white/40">studio_</span>
          <br />
          <span className="text-white/10">without_limits.</span>
        </h1>

        <p className="mt-12 max-w-2xl text-center text-lg text-white/20 font-bold animate-in fade-in slide-in-from-bottom-6 duration-1000 leading-relaxed tracking-tight lowercase">
          orchestrate images, enhance assets, generate marketing copies, and build visual flows.
          <strong className="text-white font-black"> 12+ professional nexus tools</strong> in a single cluster.
        </p>

        <div className="mt-16 flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Button onClick={() => navigate("/auth")} size="lg" className="bg-white text-black hover:bg-white/90 gap-4 text-[11px] px-14 rounded-2xl h-18 shadow-3xl shadow-white/10 font-black uppercase tracking-[0.3em] active:scale-95 transition-all">
            initialize_nexus_node
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button onClick={() => navigate("/pricing")} size="lg" variant="outline" className="border-white/5 bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/5 gap-4 text-[11px] px-12 rounded-2xl h-18 font-black uppercase tracking-[0.3em] shadow-sm transition-all focus:ring-0">
            <Crown className="h-5 w-5 text-white/40" />
            review_tiers
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-32 grid grid-cols-2 gap-20 sm:grid-cols-4 animate-in fade-in duration-1000">
          {[
            { value: "12+", label: "nexus_tools" },
            { value: "100", label: "init_credits" },
            { value: "4x", label: "upscale_ratio" },
            { value: "3", label: "clusters" },
          ].map((s) => (
            <div key={s.label} className="text-center group">
              <p className="text-7xl font-black text-white/10 group-hover:text-white transition-colors duration-500 tracking-tighter">{s.value}</p>
              <p className="mt-3 text-[9px] text-white/10 font-black uppercase tracking-[0.4em]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Features Row - Industrial Numbered Cards */}
        <div className="mt-32 w-full max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-5 animate-fade-in">
          {features.map((f, i) => (
            <div key={f.title} className="relative group rounded-[2rem] border border-white/5 bg-white/[0.01] p-10 backdrop-blur-sm hover:bg-white/[0.03] transition-all overflow-hidden shadow-3xl shadow-white/5">
              <span className="absolute -right-6 -bottom-10 text-[10rem] font-black text-white/[0.02] pointer-events-none group-hover:text-white/[0.04] transition-colors leading-none">
                0{i + 1}
              </span>
              <f.icon className="h-7 w-7 text-white/20 mb-8 group-hover:text-white transition-colors" />
              <h3 className="text-xl font-black text-white mb-3 lowercase tracking-tighter">{f.title}</h3>
              <p className="text-[10px] text-white/10 leading-relaxed uppercase tracking-[0.2em] font-black">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Tools Grid — All Accessible */}
        <div className="mt-40 w-full max-w-7xl">
          <div className="mb-20 text-center">
            <Badge className="mb-6 bg-white/5 text-white/20 border-white/10 hover:bg-white/5 uppercase tracking-[0.4em] px-6 py-2 rounded-full font-black text-[9px]">Industrial_Suite</Badge>
            <h2 className="text-6xl font-black text-white md:text-8xl tracking-tighter leading-none lowercase">
              orchestrate_ <span className="text-white/40">everything_</span>
            </h2>
            <p className="mt-6 text-white/10 max-w-xl mx-auto uppercase text-[9px] font-black tracking-[0.4em]">
              Select a visual endpoint to begin neural processing.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
            {aiTools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => navigate(tool.path)}
                className="group rounded-[2rem] border border-white/5 bg-white/[0.01] p-10 text-left backdrop-blur-sm
                  hover:border-white/20 hover:-translate-y-2 hover:shadow-3xl hover:shadow-white/5
                  transition-all duration-500 relative overflow-hidden"
              >
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 group-hover:bg-white shadow-3xl shadow-white/0 group-hover:shadow-white/10 transition-all">
                  <tool.icon className="h-6 w-6 text-white/20 group-hover:text-black transition-colors" />
                </div>
                <h3 className="text-xl font-black text-white mb-3 tracking-tighter lowercase leading-none">{tool.name}</h3>
                <p className="text-[10px] text-white/10 leading-relaxed font-black uppercase tracking-[0.2em]">{tool.desc}</p>
                <div className="mt-8 flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all translate-x-[-15px] group-hover:translate-x-0">
                  initiate_node <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Formaketing Highlight */}
        <div className="mt-40 w-full max-w-7xl">
          <div className="rounded-[4rem] border border-white/5 bg-white/[0.01] overflow-hidden backdrop-blur-3xl shadow-3xl shadow-white/5">
            <div className="grid md:grid-cols-2">
              <div className="p-16 md:p-24 flex flex-col justify-center">
                <Badge className="w-fit mb-8 bg-white/5 text-white/40 border-white/10 hover:bg-white/5 uppercase tracking-[0.4em] px-6 py-2 rounded-full font-black text-[9px]">Nexus_Studio</Badge>
                <h2 className="text-6xl font-black text-white md:text-8xl leading-[0.85] tracking-tighter lowercase mb-8">
                  visual_ <span className="text-white/40">marketing_</span> cluster.
                </h2>
                <p className="mb-10 text-white/10 leading-relaxed font-black uppercase text-[10px] tracking-[0.3em]">
                  INFINITE CANVAS FOR NEURAL CREATIVES. ORCHESTRATE CAMPAIGNS, CONNECT NODES, GENERATE ASSETS AND DEPLOY SCALABLE FUNNELS.
                </p>
                <ul className="space-y-6">
                  {["Infinite node-based canvas", "In-line asset generation", "High-density visual flows", "Prompt-to-UI code export"].map((f) => (
                    <li key={f} className="flex items-center gap-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                      <CheckCircle2 className="h-5 w-5 text-white/20 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => navigate("/auth")} className="mt-16 w-fit bg-white text-black hover:bg-white/90 gap-5 rounded-[1.5rem] px-14 h-16 shadow-3xl shadow-white/10 font-black uppercase text-[11px] tracking-[0.4em] active:scale-95 transition-all">
                  <Palette className="h-5 w-5" />
                  initiate_studio
                </Button>
              </div>
              <div className="flex items-center justify-center bg-white/[0.01] p-16 min-h-[500px] relative border-l border-white/5">
                <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                <div className="relative grid grid-cols-2 gap-8">
                  {[Megaphone, Image, Type, TrendingUp].map((Icon, i) => (
                    <div key={i} className="flex h-40 w-40 items-center justify-center rounded-[2.5rem] border border-white/5 bg-[#050506] shadow-3xl shadow-white/5 hover:border-white/20 transition-all group hover:-translate-y-2">
                      <Icon className="h-12 w-12 text-white/5 group-hover:text-white transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-40 w-full max-w-7xl">
          <h2 className="text-center text-6xl font-black text-white mb-24 md:text-8xl tracking-tighter lowercase">
            operator_ <span className="text-white/40">feedback_</span>
          </h2>
          <div className="grid gap-8 md:grid-cols-3 animate-fade-in">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-12 backdrop-blur-3xl shadow-3xl shadow-white/5">
                <div className="flex gap-1.5 mb-8">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-white text-white/10" />
                  ))}
                </div>
                <p className="text-xl text-white/20 leading-relaxed font-bold mb-10 lowercase tracking-tight">"{t.text}"</p>
                <div className="flex flex-col gap-2 border-t border-white/5 pt-8">
                  <p className="text-sm font-black text-white uppercase tracking-[0.2em]">{t.name}</p>
                  <p className="text-[10px] text-white/5 font-black uppercase tracking-[0.4em]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-56 w-full max-w-5xl rounded-[4rem] border border-white/5 bg-[#0a0a0b] p-24 md:p-32 text-center shadow-3xl shadow-white/10 animate-fade-in relative overflow-hidden">
          <div className="absolute inset-0 bg-white/[0.02] pointer-events-none" />
          <div className="mx-auto mb-10 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white shadow-3xl shadow-white/20 relative z-10">
            <Sparkles className="h-12 w-12 text-black" />
          </div>
          <h2 className="text-7xl font-black text-white md:text-9xl relative z-10 leading-[0.85] tracking-tighter lowercase mb-10">
            initialize_ <br /> <span className="text-white/40">nexus_today.</span>
          </h2>
          <p className="mt-10 text-white/10 max-w-md mx-auto relative z-10 uppercase text-[10px] font-black tracking-[0.4em] leading-loose">
            JOIN THOUSANDS OF HIGH-LEVEL OPERATORS. 100 INIT CREDITS. NO AUTHENTICATION REQUIRED.
          </p>
          <Button onClick={() => navigate("/auth")} size="lg" className="mt-16 bg-white text-black hover:bg-white/90 gap-5 px-20 rounded-[1.5rem] h-20 text-[11px] font-black uppercase tracking-[0.5em] shadow-3xl shadow-white/10 relative z-10 transition-all hover:scale-105 active:scale-95">
            Comenzar_Init
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-48 w-full max-w-7xl border-t border-white/5 pt-16 text-center text-[10px] text-white/10 space-y-6 pb-24">
          <p className="uppercase tracking-[0.5em] font-black">© {new Date().getFullYear()} Nexus System V7. All clusters operational.</p>
          <p className="text-white/5 uppercase tracking-[0.2em] font-black max-w-sm mx-auto">GLOBAL NEURAL ORCHESTRATION PLATFORM FOR FUTURE OPERATORS 🚀</p>
        </footer>
      </main>
    </div>

    </>
  );
};

export default Index;
