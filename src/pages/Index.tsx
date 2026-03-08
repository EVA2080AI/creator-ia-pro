import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Zap, Image, Video, ArrowRight, Coins,
  Wand2, ZoomIn, Eraser, ImagePlus, RotateCcw, Palette,
  LayoutGrid, Shield, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const aiTools = [
  { icon: Wand2, name: "Mejorar Imagen", desc: "Mejora calidad, luz y nitidez al instante.", credits: 2 },
  { icon: ZoomIn, name: "Ampliar con IA", desc: "Escala hasta 4x sin perder detalles.", credits: 3 },
  { icon: Eraser, name: "Borrar Objetos", desc: "Elimina objetos no deseados con un clic.", credits: 2 },
  { icon: ImagePlus, name: "Quitar Fondo", desc: "Elimina fondos automáticamente.", credits: 1 },
  { icon: RotateCcw, name: "Restaurar Foto", desc: "Restaura fotos antiguas o dañadas.", credits: 3 },
  { icon: Image, name: "Generar Imagen", desc: "Crea imágenes desde texto con IA.", credits: 1 },
  { icon: Video, name: "Generar Video", desc: "Crea videos de 5s con IA generativa.", credits: 20 },
  { icon: Palette, name: "Formaketing Studio", desc: "Lienzo infinito para proyectos creativos.", credits: 0 },
];

const stats = [
  { value: "8+", label: "Herramientas IA" },
  { value: "100", label: "Créditos Gratis" },
  { value: "4x", label: "Upscale Máximo" },
  { value: "∞", label: "Lienzo Infinito" },
];

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/spaces");
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
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
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
          <Button
            onClick={() => navigate("/pricing")}
            variant="ghost"
            className="text-muted-foreground hover:text-foreground hidden sm:flex"
          >
            Precios
          </Button>
          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="border-border text-foreground hover:bg-muted"
          >
            Iniciar Sesión
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center px-6 pt-16 pb-32">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground animate-fade-in">
          <Zap className="h-3.5 w-3.5 text-primary" />
          100 créditos gratis al registrarte
        </div>

        <h1 className="max-w-4xl text-center text-5xl font-bold leading-tight tracking-tight animate-fade-in md:text-7xl">
          <span className="text-foreground">Tu estudio de </span>
          <span className="gradient-text">IA generativa</span>
          <span className="text-foreground"> profesional</span>
        </h1>

        <p className="mt-6 max-w-2xl text-center text-lg text-muted-foreground animate-fade-in">
          Genera, mejora, escala y restaura imágenes con inteligencia artificial. Crea contenido visual profesional en un lienzo infinito con más de 8 herramientas de IA.
        </p>

        <div className="mt-10 flex gap-4 animate-fade-in">
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base px-8"
          >
            Empezar Gratis
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => navigate("/pricing")}
            size="lg"
            variant="outline"
            className="border-border text-foreground hover:bg-muted gap-2 text-base px-8"
          >
            Ver Planes
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4 animate-fade-in">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold gradient-text">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* AI Tools Grid */}
        <div className="mt-20 w-full max-w-5xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Herramientas <span className="gradient-text">IA Profesionales</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Todo lo que necesitas para crear contenido visual de alto impacto.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
            {aiTools.map((tool) => (
              <div
                key={tool.name}
                className="group rounded-2xl border border-border bg-card p-5 node-shadow hover:border-primary/20 transition-all hover:-translate-y-0.5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <tool.icon className="h-5 w-5 text-primary" />
                  </div>
                  {tool.credits > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">
                      <Coins className="h-2.5 w-2.5" />
                      {tool.credits}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground">{tool.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Use cases */}
        <div className="mt-24 w-full max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Para cada <span className="gradient-text">necesidad</span>
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
            {[
              {
                icon: Star,
                title: "Creadores de Contenido",
                desc: "Genera imágenes únicas, mejora fotos y crea contenido visual que destaque en redes sociales.",
              },
              {
                icon: LayoutGrid,
                title: "Profesionales",
                desc: "Edición de nivel profesional: mejora retratos, elimina fondos y escala imágenes para impresión.",
              },
              {
                icon: Shield,
                title: "Equipos y Agencias",
                desc: "Espacios compartidos, alta resolución y cola prioritaria para producción a gran escala.",
              },
            ].map((uc) => (
              <div
                key={uc.title}
                className="rounded-2xl border border-border bg-card p-6 node-shadow"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <uc.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{uc.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 w-full max-w-2xl rounded-2xl border border-primary/20 bg-card p-10 text-center node-shadow animate-fade-in">
          <Sparkles className="mx-auto mb-4 h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            Empieza a crear con <span className="gradient-text">Creator IA Pro</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Regístrate gratis y recibe 100 créditos para explorar todas las herramientas.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8"
          >
            Crear Cuenta Gratis
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-24 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Creator IA Pro. Todos los derechos reservados.
        </footer>
      </main>
    </div>
  );
};

export default Index;
