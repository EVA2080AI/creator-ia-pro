import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Zap, Image, ArrowRight,
  Wand2, ZoomIn, Eraser, ImagePlus, RotateCcw, Palette,
  Star, MessageSquare, PenTool,
  Hash, FileText, Type, Megaphone,
  Layers, Shield, Users, CheckCircle2, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Sample output images — curated abstract/creative photography
const GALLERY = [
  { src: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=400&fit=crop&q=80", label: "Generado con IA", tag: "Visual" },
  { src: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=400&fit=crop&q=80", label: "Logo design", tag: "Branding" },
  { src: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=400&h=400&fit=crop&q=80", label: "Identidad visual", tag: "Studio" },
  { src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop&q=80", label: "Arte abstracto", tag: "Neural" },
  { src: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=400&fit=crop&q=80", label: "Paleta de marca", tag: "Color" },
  { src: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop&q=80", label: "Diseño editorial", tag: "Print" },
  { src: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=400&fit=crop&q=80", label: "Fotografía IA", tag: "Photo" },
  { src: "https://images.unsplash.com/photo-1636690513351-0af1763f6237?w=400&h=400&fit=crop&q=80", label: "Producto 3D", tag: "3D" },
  { src: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop&q=80", label: "Arte digital", tag: "Digital" },
  { src: "https://images.unsplash.com/photo-1642427749670-f20e2e76ed8c?w=400&h=400&fit=crop&q=80", label: "Composición IA", tag: "Compose" },
];

const aiTools = [
  { icon: Wand2,       name: "Neural Enhancer",   desc: "Optimiza luz y detalles.",   cat: "image",     color: "from-purple-500/20 to-violet-500/10" },
  { icon: ZoomIn,      name: "Quantum Upscale",   desc: "Escala a 4K sin pérdida.",   cat: "image",     color: "from-blue-500/20 to-cyan-500/10" },
  { icon: Eraser,      name: "Object Eraser",     desc: "Elimina distracciones.",     cat: "image",     color: "from-rose-500/20 to-pink-500/10" },
  { icon: ImagePlus,   name: "Alpha Matte",       desc: "Fondo perfecto removido.",   cat: "image",     color: "from-emerald-500/20 to-teal-500/10" },
  { icon: RotateCcw,   name: "Photo Recovery",    desc: "Revive fotos dañadas.",      cat: "image",     color: "from-amber-500/20 to-yellow-500/10" },
  { icon: Image,       name: "Vision Morph",      desc: "Genera activos del texto.",  cat: "image",     color: "from-purple-500/20 to-fuchsia-500/10" },
  { icon: MessageSquare, name: "Copy Orchestrator", desc: "Copy de alta conversión.", cat: "marketing", color: "from-blue-500/20 to-indigo-500/10" },
  { icon: PenTool,     name: "Identity Forge",    desc: "Logos y marca neural.",      cat: "marketing", color: "from-rose-500/20 to-red-500/10" },
  { icon: Hash,        name: "Social Pulse",      desc: "Kit de redes optimizado.",   cat: "marketing", color: "from-cyan-500/20 to-sky-500/10" },
  { icon: FileText,    name: "Semantic Writer",   desc: "Artículos SEO premium.",     cat: "marketing", color: "from-green-500/20 to-emerald-500/10" },
  { icon: Type,        name: "Ad Synthesizer",    desc: "Ads para Google y Meta.",    cat: "marketing", color: "from-orange-500/20 to-amber-500/10" },
  { icon: Palette,     name: "Aether Studio",     desc: "Canvas creativo infinito.",  cat: "studio",    color: "from-violet-500/20 to-purple-500/10" },
];

const testimonials = [
  { name: "María G.", role: "Creative Director", text: "Pasamos de semanas a horas. La calidad de los activos generados supera cualquier agencia tradicional.", avatar: "MG" },
  { name: "Carlos R.", role: "Agencia Digital", text: "El upscale neural y los módulos de mejora son estudio. Indispensable para producción moderna.", avatar: "CR" },
  { name: "Ana L.", role: "Product Lead", text: "El Studio Canvas nos permite orquestar campañas completas en paralelo. Nada comparable.", avatar: "AL" },
];

const features = [
  { icon: Layers, title: "12+ Módulos", desc: "Arsenal completo de IA multimodal" },
  { icon: Shield, title: "100% Privado", desc: "Activos en vault persistente y seguro" },
  { icon: Users,  title: "Espacios", desc: "Entornos de producción colaborativa" },
  { icon: Zap,    title: "Sin latencia", desc: "Procesamiento acelerado en la nube" },
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
        <title>Creator IA Pro | Ecosistema Creativo con IA</title>
        <meta name="description" content="Genera imágenes, mejora activos, orquesta narrativas y construye flujos visuales infinitos con IA. 12+ módulos profesionales." />
      </Helmet>

      <div className="min-h-screen bg-[#050506] font-sans text-white overflow-hidden relative selection:bg-aether-purple/30">

        {/* Ambient blurs */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -top-40 left-1/4 h-[800px] w-[800px] rounded-full bg-aether-purple/5 blur-[120px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-aether-blue/5 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-rose-500/4 blur-[120px]" />
        </div>

        {/* Nav */}
        <header className="relative z-50 flex items-center justify-between px-8 py-5 sm:px-14 sticky top-0 bg-[#050506]/50 backdrop-blur-2xl border-b border-white/[0.05]">
          <div className="flex items-center gap-4">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-[0_0_16px_rgba(255,255,255,0.12)]">
              <div className="absolute right-[-3px] top-[-3px] h-2.5 w-2.5 rounded-full bg-aether-purple shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
              <Sparkles className="h-4 w-4 text-black" />
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight font-display uppercase">
                Creator <span className="text-aether-purple">IA</span> Pro
              </span>
              <span className="block text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] mt-0.5">
                v8.0 <span className="text-aether-purple/60">Neural Core</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/pricing")} variant="ghost" className="text-white/30 hover:text-white hover:bg-white/5 hidden sm:flex text-xs font-bold uppercase tracking-widest font-display">
              Precios
            </Button>
            <Button onClick={() => navigate("/auth")} className="bg-white text-black hover:bg-white/90 rounded-xl px-8 h-10 font-bold uppercase text-xs tracking-[0.2em] active:scale-95 transition-all font-display">
              Empezar
            </Button>
          </div>
        </header>

        <main className="relative z-10 flex flex-col items-center px-6 pt-28 pb-40">

          {/* Hero */}
          <div className="mb-10 flex items-center gap-3 rounded-full border border-white/5 bg-white/[0.03] px-6 py-2.5 text-[10px] text-white/40 font-bold uppercase tracking-[0.4em] animate-in fade-in duration-700 font-display">
            <div className="w-1.5 h-1.5 rounded-full bg-aether-purple animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            Ecosistema Multimodal con IA
          </div>

          <h1 className="max-w-5xl text-center text-6xl font-bold leading-[0.9] tracking-tight animate-in fade-in duration-700 md:text-8xl lg:text-[7rem] text-white font-display">
            Crea el futuro <br />
            <span className="bg-gradient-to-r from-aether-purple via-white to-aether-blue bg-clip-text text-transparent">sin límites.</span>
          </h1>

          <p className="mt-10 max-w-xl text-center text-base text-white/35 font-medium animate-in fade-in duration-700 leading-relaxed">
            Genera imágenes, mejora activos y orquesta campañas completas.
            <strong className="text-white"> 12+ módulos profesionales</strong> en un hub de producción persistente.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-in fade-in duration-700">
            <Button onClick={() => navigate("/auth")} size="lg" className="bg-white text-black hover:bg-white/90 gap-4 text-xs px-12 rounded-2xl h-14 shadow-[0_20px_40px_rgba(255,255,255,0.1)] font-bold uppercase tracking-[0.2em] active:scale-95 font-display">
              Comenzar gratis <ArrowRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate("/pricing")} size="lg" variant="outline" className="border-white/10 bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/5 gap-4 text-xs px-10 rounded-2xl h-14 font-bold uppercase tracking-[0.2em] font-display">
              Ver planes
            </Button>
          </div>

          {/* ── Product preview mockup ─────────────────────────────── */}
          <div className="mt-20 w-full max-w-5xl animate-in fade-in duration-1000">
            <div className="relative rounded-[1.5rem] overflow-hidden border border-white/10 bg-[#08080a] shadow-[0_0_80px_rgba(168,85,247,0.12),0_40px_100px_rgba(0,0,0,0.6)]">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-5 py-3 bg-white/[0.025] border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex-1 mx-4 h-6 rounded-lg bg-white/5 flex items-center px-3 gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-aether-purple/60" />
                  <span className="text-[10px] text-white/20 font-mono">creator-ia.com/dashboard</span>
                </div>
              </div>
              {/* Dashboard preview — image mosaic */}
              <div className="p-4">
                {/* Mini stats row */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: "Créditos", val: "847", color: "text-aether-purple" },
                    { label: "Plan", val: "Pro", color: "text-aether-blue" },
                    { label: "Espacios", val: "12", color: "text-rose-400" },
                    { label: "Activos", val: "264", color: "text-emerald-400" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <div className="flex-1">
                        <p className="text-[8px] text-white/25 uppercase tracking-widest font-bold">{s.label}</p>
                        <p className={`text-base font-bold tabular-nums ${s.color}`}>{s.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Image gallery preview */}
                <div className="grid grid-cols-5 gap-2">
                  {GALLERY.slice(0, 5).map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={img.src} alt={img.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-1.5 left-1.5">
                        <span className="text-[8px] font-bold text-white/70 bg-black/40 px-1.5 py-0.5 rounded-md uppercase tracking-widest">{img.tag}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Metrics ──────────────────────────────────────────────── */}
          <div className="mt-24 grid grid-cols-2 gap-16 sm:grid-cols-4 text-center">
            {[
              { value: "12+", label: "Módulos IA" },
              { value: "10",  label: "Créditos gratis" },
              { value: "4K",  label: "Resolución upscale" },
              { value: "∞",   label: "Canvas profundidad" },
            ].map((s) => (
              <div key={s.label} className="group">
                <p className="text-5xl font-bold text-white/20 group-hover:text-white transition-all duration-500 tracking-tighter font-display tabular-nums">{s.value}</p>
                <p className="mt-3 text-[10px] text-white/30 font-bold uppercase tracking-[0.4em] font-display">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Features ─────────────────────────────────────────────── */}
          <div className="mt-32 w-full max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={f.title} className="relative group aether-card rounded-2xl border border-white/5 p-8 hover:border-white/10 transition-all hover:scale-[1.02] duration-500 overflow-hidden">
                <span className="absolute -right-4 -bottom-6 text-[8rem] font-bold text-white/[0.02] pointer-events-none font-display">0{i + 1}</span>
                <div className="h-11 w-11 rounded-xl bg-white/5 flex items-center justify-center mb-7 group-hover:scale-110 transition-transform border border-white/5">
                  <f.icon className="h-5 w-5 text-white/30 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 tracking-tight font-display">{f.title}</h3>
                <p className="text-[11px] text-white/25 leading-relaxed font-bold uppercase tracking-[0.1em] font-display">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* ── Sample Outputs Gallery ───────────────────────────────── */}
          <div className="mt-40 w-full max-w-7xl">
            <div className="text-center mb-14 space-y-3">
              <Badge className="bg-aether-purple/10 text-aether-purple border-aether-purple/20 uppercase tracking-[0.5em] px-6 py-2 rounded-full font-bold text-[10px] font-display">
                Resultados reales
              </Badge>
              <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-none font-display">
                Lo que puedes <span className="text-aether-purple">crear.</span>
              </h2>
              <p className="text-white/30 max-w-md mx-auto text-sm leading-relaxed">
                Imágenes generadas, mejoradas y editadas con los módulos de Creator IA Pro.
              </p>
            </div>

            {/* Masonry-style grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {GALLERY.map((img, i) => (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-2xl border border-white/5 hover:border-aether-purple/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] ${i === 0 || i === 5 ? "row-span-2" : ""}`}
                >
                  <div className={`${i === 0 || i === 5 ? "aspect-[4/5]" : "aspect-square"} overflow-hidden`}>
                    <img
                      src={img.src}
                      alt={img.label}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 grayscale-[0.2] group-hover:grayscale-0"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-xs font-bold text-white truncate">{img.label}</p>
                    <span className="text-[9px] font-bold text-aether-purple uppercase tracking-widest">{img.tag}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button onClick={() => navigate("/auth")} className="bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 rounded-2xl px-10 h-12 text-xs font-bold uppercase tracking-widest font-display transition-all">
                Ver más resultados
              </Button>
            </div>
          </div>

          {/* ── Neural Arsenal ───────────────────────────────────────── */}
          <div className="mt-40 w-full max-w-7xl">
            <div className="mb-14 text-center space-y-3">
              <Badge className="bg-aether-blue/10 text-aether-blue border-aether-blue/20 uppercase tracking-[0.5em] px-6 py-2 rounded-full font-bold text-[10px] font-display">
                Suite completa
              </Badge>
              <h2 className="text-5xl font-bold text-white md:text-7xl tracking-tight leading-none font-display">
                Arsenal <span className="text-aether-blue">Neural.</span>
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {aiTools.map((tool) => (
                <button
                  key={tool.name}
                  onClick={() => navigate("/auth")}
                  className="group aether-card rounded-2xl border border-white/5 p-6 text-left hover:border-white/15 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-500 relative overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 group-hover:bg-white shadow-inner transition-all duration-500 border border-white/5">
                      <tool.icon className="h-5 w-5 text-white/30 group-hover:text-black transition-colors" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5 tracking-tight font-display">{tool.name}</h3>
                    <p className="text-[10px] text-white/25 leading-relaxed font-bold uppercase tracking-[0.1em] font-display">{tool.desc}</p>
                    <div className="mt-5 flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 duration-300 font-display">
                      Activar <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Studio Highlight ─────────────────────────────────────── */}
          <div className="mt-40 w-full max-w-7xl">
            <div className="rounded-[2.5rem] aether-card border border-white/5 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.4)] relative">
              <div className="grid lg:grid-cols-2 lg:items-stretch">
                {/* Left — text */}
                <div className="p-14 lg:p-20 flex flex-col justify-center space-y-7 relative z-10">
                  <Badge className="w-fit bg-aether-purple/10 text-aether-purple border-aether-purple/20 uppercase tracking-[0.5em] px-6 py-2 rounded-full font-bold text-[10px] font-display">Production Studio</Badge>
                  <h2 className="text-4xl font-bold text-white md:text-6xl leading-[0.9] tracking-tight font-display">
                    Canvas <span className="text-aether-purple">Infinito.</span>
                  </h2>
                  <p className="text-white/50 leading-relaxed font-medium text-sm max-w-lg">
                    Entorno node-based de alta fidelidad para creadores de élite. Orquesta campañas globales, conecta módulos IA y materializa tu visión en tiempo real.
                  </p>
                  <ul className="space-y-4">
                    {["Canvas multimodal infinito", "Procesamiento neural en línea", "Orquestación paralela de campañas", "Activos con persistencia industrial"].map((f) => (
                      <li key={f} className="flex items-center gap-3 text-xs font-bold text-white/40 uppercase tracking-widest font-display">
                        <CheckCircle2 className="h-4 w-4 text-aether-purple/60 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => navigate("/auth")} className="w-fit bg-white text-black hover:bg-white/90 gap-4 rounded-2xl px-12 h-13 font-bold uppercase text-xs tracking-[0.2em] active:scale-95 font-display">
                    <Palette className="h-5 w-5" />
                    Abrir Studio
                  </Button>
                </div>

                {/* Right — image collage */}
                <div className="relative hidden lg:block border-l border-white/5 bg-white/[0.01] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-aether-purple/8 to-aether-blue/8" />
                  <div className="grid grid-cols-2 gap-3 p-8 h-full">
                    {GALLERY.slice(2, 6).map((img, i) => (
                      <div key={i} className="relative rounded-2xl overflow-hidden border border-white/5 group hover:scale-[1.03] transition-transform duration-500">
                        <img src={img.src} alt={img.label} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-2 left-2">
                          <span className="text-[8px] font-bold text-white/60 bg-black/50 px-1.5 py-0.5 rounded uppercase tracking-widest">{img.tag}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Testimonials ─────────────────────────────────────────── */}
          <div className="mt-40 w-full max-w-6xl">
            <h2 className="text-center text-4xl font-bold text-white mb-12 md:text-6xl tracking-tight font-display">
              Lo que dicen <span className="text-aether-blue">los creadores.</span>
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.map((t) => (
                <div key={t.name} className="aether-card rounded-[2rem] border border-white/5 p-8 hover:border-white/10 transition-all duration-500">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aether-purple/30 to-aether-blue/30 flex items-center justify-center border border-white/10">
                      <span className="text-xs font-bold text-white">{t.avatar}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white font-display">{t.name}</p>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest font-display">{t.role}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {[1,2,3,4,5].map((s) => <Star key={s} className="h-3 w-3 fill-aether-purple text-aether-purple" />)}
                    </div>
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed font-medium">"{t.text}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Final CTA ────────────────────────────────────────────── */}
          <div className="mt-40 w-full max-w-4xl rounded-[3rem] aether-card border border-white/10 p-16 md:p-24 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-aether-purple/5 via-transparent to-aether-blue/5 pointer-events-none" />
            <div className="mx-auto mb-8 flex h-18 w-18 items-center justify-center rounded-[1.5rem] bg-white shadow-[0_20px_40px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
              <Sparkles className="h-8 w-8 text-black" />
            </div>
            <h2 className="text-5xl font-bold text-white md:text-7xl relative z-10 leading-[0.9] tracking-tight font-display mb-6">
              Creator <span className="text-aether-purple">IA Pro.</span>
            </h2>
            <p className="text-white/30 max-w-sm mx-auto text-sm font-medium leading-relaxed mb-10">
              Comienza gratis con 10 créditos. Sin tarjeta de crédito.
            </p>
            <Button onClick={() => navigate("/auth")} size="lg" className="bg-white text-black hover:bg-white/90 gap-4 px-16 rounded-2xl h-14 text-xs font-bold uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(255,255,255,0.1)] relative z-10 transition-all hover:scale-105 active:scale-95 font-display">
              Empezar gratis <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-aether-purple/40 to-transparent" />
          </div>

          {/* Footer */}
          <footer className="mt-32 w-full max-w-7xl border-t border-white/[0.05] pt-12 text-center text-[10px] text-white/30 space-y-4 pb-16 font-display">
            <p className="uppercase tracking-[0.5em] font-bold">© {new Date().getFullYear()} Creator IA Pro. Todos los derechos reservados.</p>
            <div className="flex items-center justify-center gap-10 opacity-50 uppercase tracking-[0.2em] font-bold text-[9px]">
              <span className="hover:text-white transition-colors cursor-pointer">Privacidad</span>
              <span className="hover:text-white transition-colors cursor-pointer">Términos</span>
              <span className="hover:text-white transition-colors cursor-pointer">Soporte</span>
            </div>
          </footer>

        </main>
      </div>
    </>
  );
};

export default Index;
