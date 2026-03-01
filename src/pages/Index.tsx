import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Zap, Image, Video, ArrowRight, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/canvas");
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[150px]" />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card glow-primary">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold">
            <span className="gradient-text">Canvas</span>
            <span className="text-foreground">AI</span>
          </span>
        </div>
        <Button
          onClick={() => navigate("/auth")}
          variant="outline"
          className="border-border text-foreground hover:bg-muted"
        >
          Iniciar Sesión
        </Button>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center px-6 pt-20 pb-32">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground animate-fade-in">
          <Zap className="h-3.5 w-3.5 text-primary" />
          100 créditos gratis al registrarte
        </div>

        <h1 className="max-w-3xl text-center text-5xl font-bold leading-tight tracking-tight animate-fade-in md:text-7xl">
          <span className="text-foreground">Crea con IA en un </span>
          <span className="gradient-text">lienzo infinito</span>
        </h1>

        <p className="mt-6 max-w-xl text-center text-lg text-muted-foreground animate-fade-in">
          Genera imágenes y videos con inteligencia artificial. Organiza, itera y construye visualmente en un espacio sin límites.
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
        </div>

        {/* Feature cards */}
        <div className="mt-24 grid w-full max-w-4xl gap-6 md:grid-cols-3 animate-fade-in">
          {[
            {
              icon: Image,
              title: "Imágenes",
              desc: "Genera imágenes con un prompt. 1 crédito por imagen.",
              accent: "text-primary bg-primary/10",
            },
            {
              icon: Video,
              title: "Videos",
              desc: "Crea videos de 5 segundos con IA. 20 créditos por video.",
              accent: "text-accent bg-accent/10",
            },
            {
              icon: Coins,
              title: "Créditos",
              desc: "Empieza con 100 gratis. Compra más cuando los necesites.",
              accent: "text-warning bg-warning/10",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-6 node-shadow hover:border-primary/20 transition-colors"
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${feature.accent}`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
