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
  Globe, Users, Layers, Shield, Crown, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const aiTools = [
  { icon: Wand2, name: "Neural Enhancer", desc: "Optimize lighting and details with AI.", path: "/auth", cat: "image" },
  { icon: ZoomIn, name: "Quantum Upscale", desc: "Scale assets to 4K without loss.", path: "/auth", cat: "image" },
  { icon: Eraser, name: "Object Eraser", desc: "Seamlessly remove distractions.", path: "/auth", cat: "image" },
  { icon: ImagePlus, name: "Alpha Matte", desc: "Perfect background removal.", path: "/auth", cat: "image" },
  { icon: RotateCcw, name: "Photo Recovery", desc: "Revive damaged visual records.", path: "/auth", cat: "image" },
  { icon: Image, name: "Vision Morph", desc: "Generate assets from narrative.", path: "/auth", cat: "image" },
  { icon: MessageSquare, name: "Copy Orchestrator", desc: "High-converting marketing copy.", path: "/auth", cat: "marketing" },
  { icon: PenTool, name: "Identity Forge", desc: "Neural brand and logo design.", path: "/auth", cat: "marketing" },
  { icon: Hash, name: "Social Pulse", desc: "Optimized social content kit.", path: "/auth", cat: "marketing" },
  { icon: FileText, name: "Semantic Writer", desc: "Industrial SEO articles.", path: "/auth", cat: "marketing" },
  { icon: Type, name: "Ad Synthesizer", desc: "Ads for Google and Meta.", path: "/auth", cat: "marketing" },
  { icon: Palette, name: "Aether Studio", desc: "Infinite creative canvas.", path: "/auth", cat: "studio" },
];

const testimonials = [
  { name: "Maria G.", role: "Creative Director", text: "Aether Evolution redefined our workflow. We manifest high-fidelity campaigns in hours, not weeks." },
  { name: "Carlos R.", role: "Global Operator", text: "The neural upscale and enhancement modules are production-grade. Essential for modern agencies." },
  { name: "Ana L.", role: "Product Lead", text: "The infinite studio allows for parallel creative orchestration that was simply impossible before." },
];

const features = [
  { icon: Layers, title: "12+ Neural Modules", desc: "Integrated industrial AI arsenal." },
  { icon: Shield, title: "Quantum Security", desc: "Private, persistent vault architecture." },
  { icon: Users, title: "Nexus Clusters", desc: "Collaborative production environments." },
  { icon: Zap, title: "Zero Latency", desc: "Cloud-accelerated neural processing." },
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
        <title>Aether Evolution | Industrial Multimodal Creative Ecosystem</title>
        <meta name="description" content="Orchestrate high-fidelity visual assets, marketing narratives, and infinite creative flows with the Aether Evolution design system." />
      </Helmet>
      
      <div className="min-h-screen bg-[#050506] font-sans text-slate-100 overflow-hidden relative selection:bg-aether-purple/30 selection:text-white">
      {/* Ambient Evolution Blurs */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[800px] w-[800px] rounded-full bg-aether-purple/5 blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-aether-blue/5 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-rose-500/5 blur-[120px]" />
      </div>

      {/* Navigation */}
      <header className="relative z-50 flex items-center justify-between px-10 py-8 sm:px-16 sticky top-0 bg-[#050506]/40 backdrop-blur-2xl border-b border-white/[0.05]">
        <div className="flex items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2.5xl bg-white shadow-[0_0_30px_rgba(255,255,255,0.15)]">
            <Sparkles className="h-6 w-6 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white tracking-tighter font-display uppercase leading-none">
              Aether <span className="opacity-40">Evolution</span>
            </span>
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.5em] mt-2">V8.0 Production Core</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <Button onClick={() => navigate("/pricing")} variant="ghost" className="text-white/30 hover:text-white hover:bg-white/5 hidden sm:flex text-xs font-bold uppercase tracking-widest transition-all font-display">
            Protocols
          </Button>
          <Button onClick={() => navigate("/auth")} className="bg-white text-black hover:bg-white/90 rounded-2xl px-12 h-13 shadow-2xl shadow-white/10 font-bold uppercase text-xs tracking-[0.2em] active:scale-95 transition-all font-display">
            Initialize
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center px-8 pt-32 pb-48">
        {/* Cinematic Badge */}
        <div className="mb-14 flex items-center gap-4 rounded-full border border-white/5 bg-white/[0.03] px-8 py-3 text-[10px] text-white/40 font-bold uppercase tracking-[0.4em] animate-in fade-in slide-in-from-bottom-4 duration-1000 font-display">
          <div className="w-2 h-2 rounded-full bg-aether-purple animate-pulse shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
          Neural Multimodal Ecosystem
        </div>

        {/* Hero Title */}
        <h1 className="max-w-7xl text-center text-8xl font-bold leading-[0.85] tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 md:text-9xl lg:text-[11rem] text-white font-display">
          Design <span className="bg-gradient-to-r from-white via-white to-white/20 bg-clip-text text-transparent">the Future</span>
          <br />
          <span className="opacity-10">without limits.</span>
        </h1>

        <p className="mt-14 max-w-2xl text-center text-lg text-white/30 font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 leading-relaxed tracking-tight font-display">
          manifest images, enhance assets, orchestrate narratives, and build infinite visual flows.
          <strong className="text-white"> 12+ professional neural modules</strong> in a persistent production hub.
        </p>

        <div className="mt-20 flex flex-col sm:flex-row gap-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <Button onClick={() => navigate("/auth")} size="lg" className="bg-white text-black hover:bg-white/90 gap-5 text-xs px-16 rounded-[2rem] h-20 shadow-4xl shadow-white/10 font-bold uppercase tracking-[0.2em] active:scale-95 transition-all font-display">
            Start Evolution
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button onClick={() => navigate("/pricing")} size="lg" variant="outline" className="border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/5 gap-5 text-xs px-14 rounded-[2rem] h-20 font-bold uppercase tracking-[0.2em] shadow-sm transition-all font-display">
             View Protocols
          </Button>
        </div>

        {/* Global Metrics */}
        <div className="mt-40 grid grid-cols-2 gap-24 sm:grid-cols-4 animate-in fade-in duration-1000 text-center">
          {[
            { value: "12+", label: "Neural Modules" },
            { value: "100", label: "Init Credits" },
            { value: "4K+", label: "Upscale Resolution" },
            { value: "∞", label: "Canvas Depth" },
          ].map((s) => (
            <div key={s.label} className="group">
              <p className="text-7xl font-bold text-white/10 group-hover:text-white transition-all duration-700 tracking-tighter font-display tabular-nums">{s.value}</p>
              <p className="mt-4 text-[10px] text-white/20 font-bold uppercase tracking-[0.4em] font-display">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Features - Premium Cards */}
        <div className="mt-48 w-full max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={f.title} className="relative group aether-card rounded-[3rem] border border-white/5 p-12 backdrop-blur-3xl hover:border-white/10 transition-all overflow-hidden shadow-4xl hover:scale-[1.02] duration-500">
              <span className="absolute -right-6 -bottom-10 text-[12rem] font-bold text-white/[0.02] pointer-events-none group-hover:text-white/[0.04] transition-colors leading-none font-display">
                0{i + 1}
              </span>
              <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform border border-white/5">
                <f.icon className="h-6 w-6 text-white/30 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 tracking-tight font-display">{f.title}</h3>
              <p className="text-[11px] text-white/20 leading-relaxed font-bold uppercase tracking-[0.1em] font-display">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Module Arsenal Grid */}
        <div className="mt-56 w-full max-w-7xl">
          <div className="mb-24 text-center space-y-4">
            <Badge className="bg-aether-purple/10 text-aether-purple border-aether-purple/20 hover:bg-aether-purple/20 uppercase tracking-[0.5em] px-8 py-3 rounded-full font-bold text-[10px] font-display">Industrial Suite</Badge>
            <h2 className="text-6xl font-bold text-white md:text-8xl tracking-tight leading-none font-display">
              Neural <span className="opacity-40">Arsenal.</span>
            </h2>
            <p className="text-white/20 max-w-xl mx-auto uppercase text-[10px] font-bold tracking-[0.4em] font-display">
              Professional modules for multidimensional production.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {aiTools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => navigate(tool.path)}
                className="group aether-card rounded-[3rem] border border-white/5 p-10 text-left backdrop-blur-3xl
                  hover:border-white/20 hover:-translate-y-3 hover:shadow-4xl
                  transition-all duration-700 relative overflow-hidden"
              >
                <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2.5xl bg-white/5 group-hover:bg-white shadow-inner transition-all duration-500">
                  <tool.icon className="h-7 w-7 text-white/30 group-hover:text-black transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight font-display leading-none">{tool.name}</h3>
                <p className="text-[11px] text-white/20 leading-relaxed font-bold uppercase tracking-[0.1em] font-display">{tool.desc}</p>
                <div className="mt-10 flex items-center gap-3 text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all translate-x-[-20px] group-hover:translate-x-0 font-display">
                  Initiate Module <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Aether Studio Cinematic Highlight */}
        <div className="mt-56 w-full max-w-7xl">
          <div className="rounded-[4rem] aether-card border border-white/5 overflow-hidden shadow-4xl relative">
            <div className="grid lg:grid-cols-2 lg:items-center">
              <div className="p-20 lg:p-28 flex flex-col justify-center space-y-10 relative z-10">
                <Badge className="w-fit bg-aether-blue/10 text-aether-blue border-aether-blue/20 hover:bg-aether-blue/20 uppercase tracking-[0.5em] px-8 py-3 rounded-full font-bold text-[10px] font-display text-xs">Production Studio</Badge>
                <h2 className="text-6xl font-bold text-white md:text-8xl leading-[0.85] tracking-tight font-display">
                  Infinite <span className="opacity-40">Canvas.</span>
                </h2>
                <p className="text-white/30 leading-relaxed font-medium text-lg font-display max-w-lg">
                  A high-fidelity node-based environment for elite creators. Orchestrate global campaigns, connect neural clusters, and manifest vision in real-time.
                </p>
                <ul className="space-y-6">
                  {["Multimodal infinite canvas", "In-line neural processing", "Parallel campaign orchestration", "Industrial asset persistence"].map((f) => (
                    <li key={f} className="flex items-center gap-5 text-sm font-bold text-white/40 uppercase tracking-widest font-display">
                      <div className="p-1 rounded-full bg-white/10"><CheckCircle2 className="h-4 w-4 text-white/40" /></div>{f}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => navigate("/auth")} className="mt-12 w-fit bg-white text-black hover:bg-white/90 gap-6 rounded-[2rem] px-16 h-20 shadow-4xl font-bold uppercase text-xs tracking-[0.3em] active:scale-95 transition-all font-display">
                  <Palette className="h-6 w-6" />
                  Init Aether Studio
                </Button>
              </div>
              <div className="hidden lg:flex items-center justify-center p-20 min-h-[600px] relative border-l border-white/[0.05] bg-white/[0.01]">
                <div className="absolute inset-0 bg-gradient-to-br from-aether-purple/5 to-aether-blue/5 pointer-events-none" />
                <div className="relative grid grid-cols-2 gap-10">
                  {[Megaphone, Image, Type, Rocket].map((Icon, i) => (
                    <div key={i} className="flex h-48 w-48 items-center justify-center rounded-[3rem] aether-card border border-white/5 shadow-inner hover:border-white/20 transition-all group hover:-translate-y-4 hover:shadow-4xl duration-700">
                      <Icon className="h-16 w-16 text-white/5 group-hover:text-white transition-all duration-700" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Background Grain */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          </div>
        </div>

        {/* Operator Network */}
        <div className="mt-56 w-full max-w-7xl">
          <h2 className="text-center text-6xl font-bold text-white mb-28 md:text-8xl tracking-tight font-display">
            Global <span className="opacity-40">Network.</span>
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="aether-card rounded-[3.5rem] border border-white/5 p-16 shadow-4xl hover:border-white/10 transition-all duration-700">
                <div className="flex gap-2 mb-10">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-aether-purple text-aether-purple/20" />
                  ))}
                </div>
                <p className="text-2xl text-white/40 leading-relaxed font-bold mb-14 font-display italic">"{t.text}"</p>
                <div className="flex flex-col gap-3 border-t border-white/5 pt-10">
                  <p className="text-sm font-bold text-white uppercase tracking-widest font-display">{t.name}</p>
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em] font-display">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final Evolution CTA */}
        <div className="mt-64 w-full max-w-5xl rounded-[5rem] aether-card border border-white/10 p-28 md:p-40 text-center shadow-5xl animate-fade-in relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-aether-purple/5 via-transparent to-aether-blue/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="mx-auto mb-14 flex h-28 w-28 items-center justify-center rounded-[2.5rem] bg-white shadow-4xl relative z-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
            <Sparkles className="h-14 w-14 text-black" />
          </div>
          <h2 className="text-7xl font-bold text-white md:text-9xl relative z-10 leading-[0.85] tracking-tight font-display mb-14">
            Start <br /> <span className="opacity-40">Evolution.</span>
          </h2>
          <p className="text-white/20 max-w-md mx-auto relative z-10 uppercase text-[11px] font-bold tracking-[0.5em] leading-[2.5] font-display">
            Join the elite circle of creative operators. Initial protocols active. 
          </p>
          <Button onClick={() => navigate("/auth")} size="lg" className="mt-20 bg-white text-black hover:bg-white/90 gap-6 px-24 rounded-[2rem] h-24 text-xs font-bold uppercase tracking-[0.4em] shadow-5xl relative z-10 transition-all hover:scale-105 active:scale-95 font-display">
            Access Nexus
            <ArrowRight className="h-6 w-6" />
          </Button>
          
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-aether-purple to-transparent opacity-20" />
        </div>

        {/* Global Footer */}
        <footer className="mt-56 w-full max-w-7xl border-t border-white/[0.05] pt-20 text-center text-[10px] text-white/10 space-y-8 pb-32 font-display">
          <p className="uppercase tracking-[0.6em] font-bold">© {new Date().getFullYear()} Aether Evolution Ecosystem. All nodes operational.</p>
          <div className="flex items-center justify-center gap-12 opacity-40 uppercase tracking-[0.2em] font-extrabold text-[9px]">
             <span className="hover:text-white transition-colors cursor-pointer">Security Protocol</span>
             <span className="hover:text-white transition-colors cursor-pointer">API Manifest</span>
             <span className="hover:text-white transition-colors cursor-pointer">System Status</span>
          </div>
        </footer>
      </main>
    </div>

    </>
  );
};

export default Index;
