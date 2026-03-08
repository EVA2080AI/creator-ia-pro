import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_TIERS } from "@/lib/stripe-tiers";
import { CREDIT_PACKS } from "@/lib/credit-packs";
import { Sparkles, Check, Zap, Crown, ArrowLeft, Star, GraduationCap, Building2, Loader2, Coins, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const plans = [
  {
    key: "starter" as const,
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
    stripeTier: null,
  },
  {
    key: "educacion" as const,
    name: "Educación",
    price: "$4.99",
    period: "/mes",
    credits: 500,
    creditsLabel: "500 créditos/mes",
    description: "Descuento especial para estudiantes y profesores.",
    features: [
      "500 créditos mensuales",
      "Todas las herramientas IA",
      "Generación de imágenes",
      "Formaketing Studio",
      "Alta resolución",
      "Verificación académica",
      "Soporte prioritario",
    ],
    cta: "Suscribirme",
    accent: "border-accent/40 hover:border-accent/60",
    badge: "Educación",
    icon: GraduationCap,
    iconClass: "text-accent bg-accent/10",
    stripeTier: "educacion" as const,
  },
  {
    key: "pro" as const,
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
    stripeTier: "pro" as const,
  },
  {
    key: "business" as const,
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
    stripeTier: "business" as const,
  },
];

const faqs = [
  { q: "¿Cómo funciona el plan de Educación?", a: "Al suscribirte al plan Educación, te pediremos verificar tu correo institucional (.edu) o cargar un documento que acredite tu condición de estudiante o profesor." },
  { q: "¿Puedo cambiar de plan en cualquier momento?", a: "Sí, puedes subir o bajar de plan cuando quieras. Los créditos restantes se ajustan proporcionalmente." },
  { q: "¿Qué pasa si se me acaban los créditos?", a: "Puedes comprar créditos adicionales o esperar al siguiente ciclo de facturación. También puedes subir de plan." },
  { q: "¿Hay descuentos por pago anual?", a: "Sí, ofrecemos un 20% de descuento en todos los planes al pagar anualmente." },
];

const Pricing = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  const handleSubscribe = async (plan: typeof plans[number]) => {
    if (!plan.stripeTier) {
      navigate(isLoggedIn ? "/dashboard" : "/auth");
      return;
    }

    if (!isLoggedIn) {
      toast.info("Inicia sesión primero para suscribirte");
      navigate("/auth");
      return;
    }

    setLoadingPlan(plan.key);
    try {
      const tier = STRIPE_TIERS[plan.stripeTier];
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: tier.price_id },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Error al iniciar el pago");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleBuyCredits = async (pack: typeof CREDIT_PACKS[number]) => {
    if (!isLoggedIn) {
      toast.info("Inicia sesión primero para comprar créditos");
      navigate("/auth");
      return;
    }

    setLoadingPack(pack.id);
    try {
      const { data, error } = await supabase.functions.invoke("buy-credits", {
        body: { priceId: pack.price_id },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Buy credits error:", err);
      toast.error(err.message || "Error al iniciar la compra");
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[180px]" />
        <div className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-accent/6 blur-[150px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold">
              <span className="gradient-text">Creator IA</span>
              <span className="text-foreground"> Pro</span>
            </span>
          </div>
        </button>
        <Button onClick={() => navigate(isLoggedIn ? "/dashboard" : "/auth")} variant="outline" className="border-border text-foreground hover:bg-muted rounded-full">
          {isLoggedIn ? "Ir al Dashboard" : "Iniciar Sesión"}
        </Button>
      </header>

      <main className="relative z-10 flex flex-col items-center px-6 pt-12 pb-32">
        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">Precios transparentes</Badge>
        <h1 className="text-4xl font-bold text-center md:text-5xl">
          <span className="text-foreground">Planes y </span>
          <span className="gradient-text">Precios</span>
        </h1>
        <p className="mt-4 max-w-lg text-center text-muted-foreground">
          Precios simples y transparentes. Incluye plan especial para educación. Escala cuando lo necesites.
        </p>

        <div className="mt-16 grid w-full max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border bg-card/60 p-7 transition-all backdrop-blur-sm node-shadow hover:-translate-y-1 ${plan.accent}`}
            >
              {plan.badge && (
                <span className={`absolute -top-3 left-6 rounded-full px-3 py-0.5 text-xs font-semibold ${
                  plan.name === "Educación"
                    ? "bg-accent text-accent-foreground"
                    : plan.name === "Business"
                    ? "bg-gold text-background"
                    : "bg-primary text-primary-foreground"
                }`}>
                  {plan.badge}
                </span>
              )}

              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconClass}`}>
                <plan.icon className="h-5 w-5" />
              </div>

              <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>

              <div className="mt-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm font-medium text-primary w-fit">
                {plan.creditsLabel}
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlan === plan.key}
                className={`mt-7 w-full rounded-full ${
                  plan.name === "Pro"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : plan.name === "Business"
                    ? "bg-gold/90 text-background hover:bg-gold"
                    : plan.name === "Educación"
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {loadingPlan === plan.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  plan.cta
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Credit Packs */}
        <div className="mt-20 w-full max-w-4xl">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-gold/10 text-gold border-gold/20 hover:bg-gold/10">
              <Package className="mr-1 h-3 w-3" />
              Pago único
            </Badge>
            <h2 className="text-3xl font-bold text-foreground">
              ¿Necesitas más <span className="gradient-text">créditos</span>?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Compra paquetes de créditos adicionales. Sin suscripción, pago único.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.id}
                className={`relative rounded-2xl border bg-card/60 p-6 backdrop-blur-sm node-shadow transition-all hover:-translate-y-1 ${
                  pack.popular
                    ? "border-gold/50 ring-1 ring-gold/20"
                    : "border-border hover:border-gold/30"
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-0.5 text-xs font-semibold text-background">
                    Mejor valor
                  </span>
                )}
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 mb-4">
                  <Coins className="h-5 w-5 text-gold" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{pack.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">{pack.price}</span>
                  <span className="text-sm text-muted-foreground">único</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {pack.credits} créditos añadidos a tu balance actual
                </p>
                <Button
                  onClick={() => handleBuyCredits(pack)}
                  disabled={loadingPack === pack.id}
                  className="mt-5 w-full rounded-full bg-gold/90 text-background hover:bg-gold gap-2"
                >
                  {loadingPack === pack.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Coins className="h-4 w-4" />
                      Comprar
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24 w-full max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-foreground mb-8">
            Preguntas <span className="gradient-text">frecuentes</span>
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-foreground">{faq.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
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
