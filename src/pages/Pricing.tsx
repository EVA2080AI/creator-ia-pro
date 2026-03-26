import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { stripeService } from "@/services/billing-service";
import { STRIPE_TIERS } from "@/lib/stripe-tiers";
import { CREDIT_PACKS } from "@/lib/credit-packs";
import { Sparkles, Check, Zap, Crown, ArrowLeft, Star, GraduationCap, Loader2, Coins, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";

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
      "Resolución estándar",
    ],
    cta: "Empezar Gratis",
    badge: null,
    icon: Zap,
    color: "#00c2ff",
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
      "Formarketing Studio",
      "Alta resolución",
      "Soporte prioritario",
    ],
    cta: "Plan Estudiante",
    badge: "50% Off",
    icon: GraduationCap,
    color: "#00e5a0",
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
      "Formarketing Studio completo",
      "Generación de Video",
      "Modelos premium",
    ],
    cta: "Suscribirme - Pro",
    badge: "Más Popular",
    icon: Star,
    color: "#bd00ff",
    stripeTier: "pro" as const,
  },
  {
    key: "business" as const,
    name: "Business",
    price: "$49.99",
    period: "/mes",
    credits: 5000,
    creditsLabel: "5,000 créditos/mes",
    description: "Para agencias y equipos con alta demanda.",
    features: [
      "5,000 créditos mensuales",
      "Espacios ilimitados",
      "Assets privados",
      "Soporte 24/7",
    ],
    cta: "Plan Business",
    badge: "Agencias",
    icon: Crown,
    color: "#ffb800",
    stripeTier: "business" as const,
  },
];

const faqs = [
  { q: "¿Cómo funcional el plan de Educación?", a: "Usamos validación automática mediante correo .edu o .ac para aplicar el descuento del 50% de inmediato." },
  { q: "¿Puedo cambiar de plan en cualquier momento?", a: "Sí, puedes subir o bajar de plan cuando quieras. Los créditos restantes se ajustan proporcionalmente de forma automática." },
  { q: "¿Qué pasa si se me acaban los créditos?", a: "Puedes comprar Packs de Créditos adicionales al instante o esperar a la recarga de tu siguiente ciclo de facturación mensual." },
  { q: "¿Las imágenes generadas son mías?", a: "Sí, tú conservas el 100% de los derechos comerciales de todo el contenido generado en los planes de pago." },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setUserId(session?.user?.id);
    });

    // Promo Countdown Timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubscribe = async (plan: typeof plans[number]) => {
    if (!plan.stripeTier) {
      navigate(isLoggedIn ? "/dashboard" : "/auth");
      return;
    }

    if (!isLoggedIn) {
      toast.info("Inicia sesión para suscribirte");
      navigate("/auth");
      return;
    }

    setLoadingPlan(plan.key);
    try {
      const tier = STRIPE_TIERS[plan.stripeTier];
      const data = await stripeService.createCheckout(tier.price_id);
      if (data?.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned");
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
      if (data?.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned");
    } catch (err: any) {
      console.error("Buy credits error:", err);
      toast.error(err.message || "Error al iniciar la compra");
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Precios y Planes | Creator IA Pro</title>
        <meta name="description" content="Descubre nuestros planes diseñados para creadores y agencias. Descuentos para estudiantes disponibles en Creator IA Pro." />
      </Helmet>
      <div className="min-h-screen bg-[#050506] text-white">
      <AppHeader userId={userId} onSignOut={() => supabase.auth.signOut()} />

      <main className="pt-14 relative z-10 flex flex-col items-center px-6 pb-40">
        
        {/* FOMO Promo Banner */}
        <div className="w-full max-w-[1400px] mt-6 mx-auto">
          <div className="rounded-2xl bg-gradient-to-r from-[#bd00ff]/20 via-[#ff0071]/20 to-[#ffb800]/20 border border-white/10 p-1 flex relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 animate-pulse" />
            <div className="relative z-10 w-full flex flex-col sm:flex-row items-center justify-between px-6 py-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ff0071] flex items-center justify-center shadow-[0_0_15px_#ff0071]">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Oferta Especial de Lanzamiento v2.0</h3>
                  <p className="text-xs text-white/70">Usa el código <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded">NEBULA20</strong> para doble de créditos en tu primer mes.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#050506] px-4 py-2 rounded-xl border border-white/10">
                <Clock className="w-4 h-4 text-[#ffb800] animate-pulse" />
                <div className="flex items-center gap-1 text-sm font-black tabular-nums">
                  <span className="text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-white/40">:</span>
                  <span className="text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-white/40">:</span>
                  <span className="text-[#ff0071]">{String(timeLeft.seconds).padStart(2, '0')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-20 mb-16">
          <Badge className="mb-6 bg-white/5 text-white/70 border-white/10 px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase">
            Planes Transparentes
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
            Poder de IA, <span className="brand-gradient-text">escalable.</span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-white/50 font-medium leading-relaxed">
            Diseñado para creadores, optimizado para equipos. Elige el plan que mejor se adapte a tu ecosistema.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid w-full max-w-[1400px] gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-[2rem] border bg-[#0f0f12] p-8 transition-all duration-300 hover:-translate-y-2
                ${plan.name === 'Pro' ? 'border-[#bd00ff]/30 shadow-2xl shadow-[#bd00ff]/10 ring-1 ring-[#bd00ff]/20' : 'border-white/8 hover:border-white/20 shadow-xl'}`}
            >
              {plan.badge && (
                <div 
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg"
                  style={{ background: plan.color, color: "#050506", boxShadow: `0 4px 14px ${plan.color}50` }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${plan.color}15` }}>
                <plan.icon className="h-6 w-6" style={{ color: plan.color }} />
              </div>

              <h2 className="text-2xl font-black text-white">{plan.name}</h2>
              <p className="mt-2 text-sm text-white/40 font-medium leading-relaxed h-10">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-5xl font-black tracking-tighter" style={{ color: plan.name === 'Pro' ? '#bd00ff' : 'white' }}>
                  {plan.price}
                </span>
                <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">{plan.period}</span>
              </div>
              
              <div 
                className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/5 px-4 py-2.5 text-xs font-bold"
                style={{ color: plan.color }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {plan.creditsLabel}
              </div>

              <ul className="mt-8 flex-1 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-white/60 font-medium">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: plan.color }} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlan === plan.key}
                className={`mt-10 h-12 w-full rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center gap-2
                  ${plan.name === "Pro" || plan.name === "Educación" || plan.name === "Business"
                    ? "text-[#050506] hover:opacity-90"
                    : "bg-white/5 text-white hover:bg-white/10 shadow-none border border-white/10"
                }`}
                style={plan.name !== "Starter" ? { background: plan.color, boxShadow: `0 4px 14px ${plan.color}30` } : undefined}
              >
                {loadingPlan === plan.key ? <Loader2 className="h-5 w-5 animate-spin" /> : plan.cta}
                {plan.name !== "Starter" && !loadingPlan && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          ))}
        </div>
        
        {/* Credit Packs */}
        <div className="mt-32 w-full max-w-[1400px]">
           <div className="flex flex-col items-center mb-12">
              <Badge className="mb-4 bg-[#ffb800]/10 text-[#ffb800] border-[#ffb800]/20 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase">
                Recargas Instantáneas
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white">Packs de Créditos Adicionales.</h2>
              <p className="mt-4 text-white/50 font-medium text-base text-center max-w-xl">
                 Recarga tu balance industrial sin compromisos ni suscripciones mensuales adicionales.
              </p>
           </div>
           
           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CREDIT_PACKS.map((pack) => (
                 <div key={pack.id} className="group relative flex flex-col items-center rounded-[2rem] border border-white/8 bg-[#0f0f12] p-8 transition-all hover:bg-white/[0.04] hover:border-[#ffb800]/30 shadow-xl hover:shadow-[#ffb800]/10">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffb800]/10 text-[#ffb800] group-hover:scale-110 group-hover:bg-[#ffb800] group-hover:text-[#050506] transition-all duration-300">
                       <Coins className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{pack.name}</h3>
                    <p className="mt-1 text-[11px] font-bold text-[#ffb800] uppercase tracking-widest">{pack.credits} créditos</p>
                    
                    <div className="mt-6 flex items-baseline gap-1 relative">
                       <span className="text-4xl font-black text-white tracking-tighter">${pack.price}</span>
                       <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">USD</span>
                    </div>
                    
                    <Button 
                       onClick={() => handleBuyCredits(pack)}
                       disabled={loadingPack === pack.id}
                       className="mt-8 w-full h-11 bg-white/5 border border-white/10 text-white hover:bg-[#ffb800] hover:text-[#050506] hover:border-[#ffb800] rounded-xl font-bold text-xs tracking-wide transition-all shadow-sm active:scale-95"
                    >
                       {loadingPack === pack.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comprar Ahora"}
                    </Button>
                 </div>
              ))}
           </div>
        </div>

        {/* FAQ */}
        <div className="mt-32 w-full max-w-4xl">
          <h2 className="text-center text-3xl font-black text-white mb-10 tracking-tighter">
            Preguntas Frecuentes
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-white/8 bg-[#0f0f12] p-6 shadow-xl hover:border-white/20 transition-all">
                <h3 className="text-[13px] font-bold text-white leading-snug">{faq.q}</h3>
                <p className="mt-3 text-xs text-white/50 font-medium leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-20 text-xs font-medium text-white/40 text-center bg-white/5 border border-white/5 px-6 py-3 rounded-full">
          ¿Problemas con el pago? Contáctanos en <span className="text-[#00c2ff]">billing@creator-ia.com</span>
        </p>
      </main>
    </div>
    </>
  );
};
