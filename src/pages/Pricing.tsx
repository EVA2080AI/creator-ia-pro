import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Check, Zap, Crown, ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "para siempre",
    credits: 100,
    creditsLabel: "100 créditos únicos",
    description: "Perfecto para explorar todas las herramientas de IA.",
    features: [
      "100 créditos al registrarte",
      "Todas las herramientas IA",
      "Generación de imágenes",
      "Mejorar y restaurar fotos",
      "Resolución estándar",
      "Soporte comunitario",
    ],
    cta: "Empezar Gratis",
    accent: "border-border hover:border-primary/30",
    badge: null,
    icon: Zap,
    iconClass: "text-primary bg-primary/10",
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/mes",
    credits: 1000,
    creditsLabel: "1,000 créditos/mes",
    description: "Para creadores que necesitan producción constante.",
    features: [
      "1,000 créditos mensuales",
      "Todas las herramientas IA",
      "Generación de imágenes y video",
      "Formaketing Studio completo",
      "Alta resolución (4K)",
      "Ampliación 4x con IA",
      "Modelos premium",
      "Soporte prioritario",
    ],
    cta: "Suscribirme",
    accent: "border-primary/50 ring-1 ring-primary/20",
    badge: "Más Popular",
    icon: Star,
    iconClass: "text-primary bg-primary/10",
  },
  {
    name: "Business",
    price: "$49.99",
    period: "/mes",
    credits: 5000,
    creditsLabel: "5,000 créditos/mes",
    description: "Para equipos y profesionales con alta demanda.",
    features: [
      "5,000 créditos mensuales",
      "Todo lo de Pro",
      "Todos los modelos de IA",
      "Máxima resolución",
      "Cola de generación prioritaria",
      "Espacios ilimitados",
      "API access",
      "Soporte dedicado 24/7",
    ],
    cta: "Elegir Business",
    accent: "border-gold/40 hover:border-gold/60",
    badge: "Enterprise",
    icon: Crown,
    iconClass: "text-gold bg-gold/10",
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[150px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold">
              <span className="gradient-text">Creator IA</span>
              <span className="text-foreground"> Pro</span>
            </span>
          </div>
        </button>
        <Button onClick={() => navigate(isLoggedIn ? "/dashboard" : "/auth")} variant="outline" className="border-border text-foreground hover:bg-muted">
          {isLoggedIn ? "Ir al Dashboard" : "Iniciar Sesión"}
        </Button>
      </header>

      <main className="relative z-10 flex flex-col items-center px-6 pt-12 pb-32">
        <h1 className="text-4xl font-bold text-center md:text-5xl">
          <span className="text-foreground">Planes y </span>
          <span className="gradient-text">Precios</span>
        </h1>
        <p className="mt-4 max-w-lg text-center text-muted-foreground">
          Precios simples y transparentes. Escala cuando lo necesites.
        </p>

        <div className="mt-16 grid w-full max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border bg-card p-8 transition-colors node-shadow ${plan.accent}`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  {plan.badge}
                </span>
              )}

              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconClass}`}>
                <plan.icon className="h-5 w-5" />
              </div>

              <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>

              <div className="mt-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm font-medium text-primary w-fit">
                {plan.creditsLabel}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => navigate("/auth")}
                className={`mt-8 w-full ${
                  plan.name === "Pro"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : plan.name === "Business"
                    ? "bg-gold/90 text-background hover:bg-gold"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-16 text-sm text-muted-foreground text-center max-w-md">
          ¿Necesitas un plan personalizado? Escríbenos a{" "}
          <span className="text-primary">soporte@creatoria.pro</span>
        </p>
      </main>
    </div>
  );
};

export default Pricing;
