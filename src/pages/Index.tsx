import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Zap, Image, Video, ArrowRight, Coins,
  Wand2, ZoomIn, Eraser, ImagePlus, RotateCcw, Palette,
  LayoutGrid, Shield, Star, MessageSquare, PenTool,
  Hash, FileText, Type, Megaphone, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const aiTools = [
  { icon: Wand2, name: "Mejorar Imagen", desc: "Mejora calidad y nitidez al instante." },
  { icon: ZoomIn, name: "Ampliar 4x", desc: "Escala sin perder detalles." },
  { icon: Eraser, name: "Borrar Objetos", desc: "Elimina lo que sobra con un clic." },
  { icon: ImagePlus, name: "Quitar Fondo", desc: "Fondos eliminados automáticamente." },
  { icon: RotateCcw, name: "Restaurar Foto", desc: "Revive fotos antiguas." },
  { icon: Image, name: "Texto a Imagen", desc: "Crea imágenes desde texto." },
  { icon: MessageSquare, name: "AI Copywriter", desc: "Textos de marketing con IA." },
  { icon: PenTool, name: "Logo Maker", desc: "Logos profesionales con IA." },
  { icon: Hash, name: "Social Media Kit", desc: "Contenido para redes sociales." },
  { icon: FileText, name: "AI Blog Writer", desc: "Artículos SEO completos." },
  { icon: Type, name: "Ad Generator", desc: "Anuncios para Google y Meta." },
  { icon: Palette, name: "Formaketing Studio", desc: "Flows de marketing visual." },
];

const testimonials = [
  { name: "María G.", role: "Community Manager", text: "Creator IA Pro cambió mi flujo de trabajo. Genero contenido para 5 marcas en la mitad del tiempo." },
  { name: "Carlos R.", role: "Diseñador Freelance", text: "Las herramientas de mejora de imagen y upscale son increíbles. Mis clientes notan la diferencia." },
  { name: "Ana L.", role: "CEO, Digital Agency", text: "El Formaketing Studio nos permite crear flows de marketing visual que antes tardaban semanas." },
];

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/3 blur-[150px]" />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card glow-primary">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold">
            <span className="gradient-text">Creator IA</span>
            <span className="text-foreground"> Pro</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate("/pricing")} variant="ghost" className="text-muted-foreground hover:text-foreground hidden sm:flex">
            Precios
          </Button>
          <Button onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Empezar Gratis
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center px-6 pt-16 pb-32">
        {/* Badge */}
        <div className="mb-6 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs text-primary font-medium animate-fade-in">
          <Zap className="h-3.5 w-3.5" />
          12+ herramientas IA • 100 créditos gratis
        </div>

        {/* Hero */}
        <h1 className="max-w-4xl text-center text-5xl font-bold leading-[1.1] tracking-tight animate-fade-in md:text-7xl">
          <span className="text-foreground">La plataforma de </span>
          <span className="gradient-text">IA generativa</span>
          <br />
          <span className="text-foreground">que el mundo usará</span>
        </h1>

        <p className="mt-6 max-w-2xl text-center text-lg text-muted-foreground animate-fade-in leading-relaxed">
          Genera, mejora, escala y restaura imágenes. Crea textos de marketing, logos, contenido social y flows visuales.
          <strong className="text-foreground"> Todo con inteligencia artificial.</strong>
        </p>

        <div className="mt-10 flex gap-4 animate-fade-in">
          <Button onClick={() => navigate("/auth")} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base px-8">
            Crear Cuenta Gratis
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => navigate("/pricing")} size="lg" variant="outline" className="border-border text-foreground hover:bg-muted gap-2 text-base px-8">
            Ver Planes
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4 animate-fade-in">
          {[
            { value: "12+", label: "Herramientas IA" },
            { value: "100", label: "Créditos Gratis" },
            { value: "4x", label: "Upscale Máximo" },
            { value: "∞", label: "Lienzo Infinito" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-bold gradient-text">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="mt-24 w-full max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Todo lo que necesitas, <span className="gradient-text">en un solo lugar</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              De la generación de imágenes al marketing completo. Herramientas profesionales para cada etapa del proceso creativo.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
            {aiTools.map((tool) => (
              <div key={tool.name} className="group rounded-2xl border border-border bg-card p-5 node-shadow hover:border-primary/20 hover:-translate-y-0.5 transition-all">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <tool.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{tool.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Formaketing Section */}
        <div className="mt-24 w-full max-w-5xl">
          <div className="rounded-3xl border border-primary/20 bg-card overflow-hidden node-shadow">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <Badge className="w-fit mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">Nuevo</Badge>
                <h2 className="text-3xl font-bold text-foreground">
                  <span className="gradient-text">Formaketing</span> Studio
                </h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  El lienzo infinito para marketing visual. Crea flows de campañas, conecta nodos de contenido, genera assets y construye funnels completos con IA.
                </p>
                <ul className="mt-4 space-y-2">
                  {["Lienzo infinito con nodos conectables", "Generación de imágenes inline", "Flows de marketing visual", "Exporta campañas completas"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-primary shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => navigate("/auth")} className="mt-6 w-fit bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  <Palette className="h-4 w-4" />
                  Probar Formaketing
                </Button>
              </div>
              <div className="flex items-center justify-center bg-muted/20 p-8 min-h-[300px]">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-2xl bg-primary/5 blur-xl" />
                  <div className="relative grid grid-cols-2 gap-3">
                    {[Megaphone, Image, Type, TrendingUp].map((Icon, i) => (
                      <div key={i} className="flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-card node-shadow">
                        <Icon className="h-8 w-8 text-primary/60" />
                      </div>
                    ))}
                  </div>
                  {/* Connection lines */}
                  <div className="absolute top-10 left-[76px] w-8 h-0.5 bg-gold/40" />
                  <div className="absolute top-[76px] left-10 h-8 w-0.5 bg-gold/40" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-24 w-full max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-foreground mb-10">
            Lo que dicen nuestros <span className="gradient-text">creadores</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-card p-6 node-shadow">
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-24 w-full max-w-2xl rounded-3xl border border-primary/20 bg-card p-10 text-center node-shadow animate-fade-in">
          <Sparkles className="mx-auto mb-4 h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">
            El futuro de la creación es <span className="gradient-text">ahora</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Únete a miles de creadores que ya usan Creator IA Pro para transformar su contenido visual y marketing.
          </p>
          <Button onClick={() => navigate("/auth")} size="lg" className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-10">
            Empezar Gratis
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">100 créditos gratis • Sin tarjeta de crédito</p>
        </div>

        {/* Footer */}
        <footer className="mt-24 text-center text-xs text-muted-foreground space-y-2">
          <p>© {new Date().getFullYear()} Creator IA Pro. Todos los derechos reservados.</p>
          <p className="text-muted-foreground/50">Hecho con IA para creadores del futuro 🚀</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
