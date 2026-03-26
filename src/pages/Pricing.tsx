import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stripeService } from "@/services/billing-service";
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
    credits: 10,
    creditsLabel: "10 créditos de prueba",
    description: "Perfecto para explorar las herramientas de IA.",
    features: [
      "10 créditos al registrarte",
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
      const data = await stripeService.createCheckout(tier.price_id);
      if (data?.url) {
        window.location.href = data.url;
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
      const data = await stripeService.buyCredits(pack.price_id);
      if (data?.url) {
        window.location.href = data.url;
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
    <div className="min-h-screen bg-[#020203] overflow-hidden text-white font-sans lowercase selection:bg-[#d4ff00]/30 selection:text-[#020203]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[700px] w-[700px] rounded-full bg-[#d4ff00]/5 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-slate-900/20 blur-[150px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-8 py-6 sm:px-12 bg-[#020203]/50 backdrop-blur-md border-b border-white/5">
        <button onClick={() => navigate("/")} className="flex items-center gap-4 text-slate-400 hover:text-white transition-all group">
          <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 group-hover:bg-white/10 group-hover:border-[#d4ff00]/20 transition-all">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d4ff00] shadow-2xl shadow-[#d4ff00]/20">
              <Sparkles className="h-5 w-5 text-[#020203]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-base font-black text-white tracking-tight lowercase">
                nexus<span className="text-[#d4ff00]">_</span>studio
              </span>
              <span className="text-[9px] font-black text-[#d4ff00]/60 uppercase tracking-widest mt-0.5">V8.0 NEBULA</span>
            </div>
          </div>
        </button>
        <Button onClick={() => navigate(isLoggedIn ? "/dashboard" : "/auth")} variant="outline" className="border-white/10 text-white hover:bg-white/5 rounded-2xl font-black lowercase h-11 px-6 shadow-sm active:scale-95 transition-all">
          {isLoggedIn ? "ir al dashboard" : "iniciar sesión"}
        </Button>
      </header>

      <main className="relative z-10 flex flex-col items-center px-8 pt-20 pb-40">
        <Badge className="mb-6 bg-[#d4ff00]/10 text-[#d4ff00] border-transparent animate-fade-in px-5 py-1.5 rounded-full text-[10px] lowercase font-black tracking-tight">precios_transparentes_nebula_v8.0</Badge>
        <h1 className="text-6xl font-black text-center md:text-8xl tracking-tighter leading-none text-white lowercase">
          planes y <span className="text-[#d4ff00]">precios.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-center text-slate-400 text-xl font-medium leading-relaxed lowercase">
          diseñado para creadores, optimizado para equipos. elige la escala que mejor se adapte a tu visión creativa.
        </p>

        <div className="mt-20 grid w-full max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-[3rem] border bg-[#080809]/60 p-10 transition-all shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-2xl hover:shadow-[#d4ff00]/5 hover:-translate-y-2 ${
                plan.name === 'Pro' ? 'border-[#d4ff00]/20 ring-1 ring-[#d4ff00]/5' : 'border-white/5'
              }`}
            >
              {plan.badge && (
                <span className={`absolute -top-4 left-10 rounded-full px-5 py-1.5 text-[10px] font-black lowercase tracking-tight shadow-lg ${
                  plan.name === "Educación"
                    ? "bg-[#d4ff00] text-[#020203]"
                    : plan.name === "Business"
                    ? "bg-white text-[#020203]"
                    : "bg-[#d4ff00] text-[#020203]"
                }`}>
                  {plan.badge === "Más Popular" ? "recomendado" : plan.badge.toLowerCase()}
                </span>
              )}

              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-[1.5rem] shadow-sm ${
                plan.name === 'Pro' ? 'bg-[#d4ff00] text-[#020203]' : 'bg-white/5 text-slate-500'
              }`}>
                <plan.icon className="h-7 w-7" />
              </div>

              <h2 className="text-2xl font-black text-white lowercase">{plan.name}</h2>
              <p className="mt-2 text-sm text-slate-400 font-bold lowercase leading-relaxed line-clamp-2 tracking-tight">{plan.description}</p>

              <div className="mt-8 flex items-baseline gap-2">
                <span className="text-6xl font-black text-white tracking-tighter">{plan.price}</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{plan.period}</span>
              </div>
              
              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/5 border border-white/5 px-5 py-3 text-xs font-black text-[#d4ff00] lowercase tracking-tight">
                <Sparkles className="h-4.5 w-4.5" />
                {plan.creditsLabel}
              </div>

              <ul className="mt-8 flex-1 space-y-3.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-[13px] text-slate-500 font-medium lowercase">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#d4ff00] opacity-40" />
                    {feature.toLowerCase()}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlan === plan.key}
                className={`mt-10 h-14 w-full rounded-2xl font-black lowercase text-sm shadow-2xl transition-all active:scale-95 ${
                  plan.name === "Pro"
                    ? "bg-[#d4ff00] text-[#020203] hover:bg-[#c4eb00] shadow-[#d4ff00]/20"
                    : plan.name === "Business"
                    ? "bg-white text-[#020203] hover:bg-slate-200 shadow-white/10"
                    : "bg-white/5 text-white hover:bg-white/10 shadow-none border border-white/5"
                }`}
              >
                {loadingPlan === plan.key ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  plan.cta.toLowerCase()
                )}
              </Button>
            </div>
          ))}
        </div>
        
        {/* Credit Packs Section */}
        <div className="mt-40 w-full max-w-7xl">
           <div className="flex flex-col items-center mb-16">
              <Badge className="mb-4 bg-amber-500/10 text-amber-500 border-transparent px-5 py-1.5 rounded-full text-[10px] lowercase font-black tracking-tight">recargas_instantáneas</Badge>
              <h2 className="text-4xl font-black tracking-tighter text-white lowercase">packs de créditos.</h2>
              <p className="mt-4 text-slate-400 font-bold text-lg lowercase tracking-tight">recarga tu balance sin compromisos ni suscripciones.</p>
           </div>
           
           <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {CREDIT_PACKS.map((pack) => (
                 <div key={pack.id} className="group relative flex flex-col items-center rounded-[2.5rem] border border-white/5 bg-[#080809]/60 p-8 transition-all hover:bg-white/[0.08] hover:border-[#d4ff00]/10 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                       <Coins className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-black text-white lowercase tracking-tight">{pack.name}</h3>
                    <p className="mt-1 text-xs font-black text-slate-600 uppercase tracking-widest">{pack.credits} créditos</p>
                    
                    <div className="mt-6 flex items-baseline gap-1">
                       <span className="text-4xl font-black text-white tracking-tighter">${pack.price}</span>
                       <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">USD</span>
                    </div>
                    
                    <Button 
                       onClick={() => handleBuyCredits(pack)}
                       disabled={loadingPack === pack.id}
                       className="mt-8 w-full h-12 bg-white/5 border border-white/5 text-white hover:bg-[#d4ff00] hover:text-[#020203] hover:border-[#d4ff00] rounded-2xl font-black lowercase text-[10px] tracking-widest transition-all shadow-sm active:scale-95"
                       aria-label={`comprar ${pack.name}`}
                    >
                       {loadingPack === pack.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "comprar ahora"}
                    </Button>
                 </div>
              ))}
           </div>
        </div>

        {/* FAQ */}
        <div className="mt-32 w-full max-w-4xl">
          <h2 className="text-center text-3xl font-black text-white mb-12 lowercase tracking-tighter">
            preguntas <span className="text-[#d4ff00]">frecuentes.</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-[2.5rem] border border-white/5 bg-[#080809]/60 p-8 shadow-sm hover:border-[#d4ff00]/10 transition-all">
                <h3 className="text-[15px] font-black text-white lowercase tracking-tight">{faq.q.toLowerCase()}</h3>
                <p className="mt-3 text-sm text-slate-400 font-bold lowercase leading-relaxed tracking-tight">{faq.a.toLowerCase()}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-20 text-[11px] font-black text-slate-600 text-center max-w-md lowercase bg-white/5 px-6 py-3 rounded-full tracking-widest uppercase">
          ¿necesitas un plan personalizado? escríbenos a{" "}
          <span className="text-[#d4ff00]">soporte@nexus.studio</span>
        </p>
      </main>
    </div>
  );
};

export default Pricing;
