import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { stripeService } from "@/services/billing-service";
import { STRIPE_TIERS } from "@/lib/stripe-tiers";
import { CREDIT_PACKS } from "@/lib/credit-packs";
import { Sparkles, Check, Zap, Crown, Star, GraduationCap, Loader2, Coins, Clock, ShieldCheck, Image, FileText, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { cn } from "@/lib/utils";

const plans = [
  {
    key: "starter" as const,
    name: "Gratis",
    price: "$0",
    period: "siempre",
    credits: 10,
    creditsLabel: "10 créditos de prueba",
    description: "Prueba la plataforma sin gastar nada.",
    features: [
      "10 créditos para empezar",
      "Crea 2 imágenes o 10 textos",
      "Acceso a todas las herramientas",
      "Resolución estándar",
    ],
    cta: "Empezar gratis",
    badge: null,
    icon: Zap,
    color: "text-white",
    stripeTier: null,
  },
  {
    key: "educacion" as const,
    name: "Estudiante",
    price: "$4.99",
    period: "/mes",
    credits: 500,
    creditsLabel: "500 créditos/mes",
    description: "Precio especial para estudiantes y docentes.",
    features: [
      "500 créditos mensuales",
      "Crea ~100 imágenes al mes",
      "Acceso al Studio Canvas",
      "Verificación académica requerida",
    ],
    cta: "Soy estudiante",
    badge: "50% menos",
    icon: GraduationCap,
    color: "text-rose-400",
    stripeTier: "educacion" as const,
  },
  {
    key: "pro" as const,
    name: "Pro",
    price: "$9.99",
    period: "/mes",
    credits: 1000,
    creditsLabel: "1,000 créditos/mes",
    description: "Para creadores que producen contenido constantemente.",
    features: [
      "1,000 créditos mensuales",
      "Crea ~200 imágenes al mes",
      "Genera video con IA",
      "Acceso completo al Studio",
    ],
    cta: "Ir a Pro",
    badge: "Más popular",
    icon: Star,
    color: "text-aether-purple",
    stripeTier: "pro" as const,
  },
  {
    key: "business" as const,
    name: "Agencia",
    price: "$49.99",
    period: "/mes",
    credits: 5000,
    creditsLabel: "5,000 créditos/mes",
    description: "Para agencias y equipos con alta producción.",
    features: [
      "5,000 créditos mensuales",
      "Crea ~1,000 imágenes al mes",
      "Espacios ilimitados",
      "Soporte prioritario 24/7",
    ],
    cta: "Para mi agencia",
    badge: "Máximo volumen",
    icon: Crown,
    color: "text-aether-blue",
    stripeTier: "business" as const,
  },
];

const faqs = [
  { q: "¿Cómo funciona el descuento de estudiante?", a: "Verificamos tu correo académico (.edu o .ac) para activar el 50% de descuento automáticamente." },
  { q: "¿Puedo cambiar de plan cuando quiera?", a: "Sí. Puedes subir o bajar de plan en cualquier momento. Los créditos restantes se ajustan automáticamente." },
  { q: "¿Qué pasa si se me acaban los créditos?", a: "Puedes comprar un paquete de créditos extra o esperar a que se renueven en tu próximo ciclo de facturación." },
  { q: "¿Quién es dueño de lo que creo?", a: "Tú. El 100% de los activos generados en planes de pago son de tu propiedad." },
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
      toast.info("Authentication required for protocol synchronization");
      navigate("/auth");
      return;
    }
    setLoadingPlan(plan.key);
    try {
      const tier = STRIPE_TIERS[plan.stripeTier];
      const data = await stripeService.createCheckout(tier.price_id);
      if (data?.url) window.location.href = data.url;
      else throw new Error("Nexus link failed");
    } catch (err: any) {
      toast.error(err.message || "Protocol link error");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleBuyCredits = async (pack: typeof CREDIT_PACKS[number]) => {
    if (!isLoggedIn) {
      toast.info("Authentication required for credit manifestation");
      navigate("/auth");
      return;
    }
    setLoadingPack(pack.id);
    try {
      const data = await stripeService.buyCredits(pack.price_id);
      if (data?.url) window.location.href = data.url;
      else throw new Error("Charge link failed");
    } catch (err: any) {
      toast.error(err.message || "Charge manifestation error");
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Planes y Precios | Creator IA Pro</title>
        <meta name="description" content="Elige el plan que mejor se adapta a tu ritmo de creación. Compra créditos extra cuando los necesites." />
      </Helmet>
      
      <div className="min-h-screen bg-[#050506] text-white selection:bg-aether-purple/30 selection:text-white font-sans overflow-hidden relative">
      <AppHeader userId={userId} onSignOut={() => supabase.auth.signOut()} />

      <main className="pt-24 relative z-10 flex flex-col items-center px-8 pb-48">
        
        {/* Promo Banner */}
        <div className="w-full max-w-[1440px] mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="aether-card rounded-3xl border border-white/10 p-1 group relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-aether-purple/10 via-aether-blue/10 to-aether-purple/10 animate-pulse" />
             <div className="relative z-10 w-full flex flex-col sm:flex-row items-center justify-between px-8 py-4 gap-6 backdrop-blur-3xl">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-4xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <Sparkles className="w-6 h-6 text-black" />
                   </div>
                   <div>
                      <h3 className="text-base font-bold text-white tracking-tight font-display uppercase">Oferta de lanzamiento — doble créditos</h3>
                      <p className="text-[11px] text-white/30 font-bold uppercase tracking-widest mt-1">Usa el código <strong className="text-white bg-white/5 py-1 px-2 rounded-lg border border-white/10 ml-1">EVOLVE20</strong> al suscribirte</p>
                   </div>
                </div>
                <div className="flex items-center gap-4 bg-[#050506] px-6 py-3 rounded-2xl border border-white/5 shadow-inner">
                   <Clock className="w-4 h-4 text-aether-purple animate-pulse" />
                   <div className="flex items-center gap-2 text-sm font-bold tabular-nums font-display tracking-[0.1em]">
                      <span className="text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                      <span className="text-white/20">:</span>
                      <span className="text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
                      <span className="text-white/20">:</span>
                      <span className="text-aether-purple">{String(timeLeft.seconds).padStart(2, '0')}</span>
                   </div>
                </div>
             </div>
           </div>
        </div>

        {/* Credit cost reference */}
        <div className="w-full max-w-[1440px] mb-16">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: FileText, label: "1 texto generado", cost: "1 crédito", color: "text-white" },
              { icon: Image, label: "1 imagen generada", cost: "5 créditos", color: "text-aether-purple" },
              { icon: Video, label: "1 video generado", cost: "20 créditos", color: "text-aether-blue" },
            ].map((item) => (
              <div key={item.label} className="aether-card rounded-2xl border border-white/5 px-6 py-4 flex items-center gap-4">
                <item.icon className={cn("w-5 h-5 shrink-0", item.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-white/40">{item.label}</p>
                </div>
                <span className={cn("text-xs font-bold shrink-0", item.color)}>{item.cost}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-24 space-y-6">
          <Badge className="bg-white/5 text-white/30 border-white/10 px-6 py-2 rounded-full text-[10px] font-bold tracking-[0.4em] uppercase font-display">
            Precios claros y transparentes
          </Badge>
          <h1 className="text-6xl md:text-9xl font-bold tracking-tight uppercase font-display">
            Elige tu <br /> <span className="bg-gradient-to-r from-white via-white to-white/20 bg-clip-text text-transparent">plan.</span>
          </h1>
          <p className="max-w-xl mx-auto text-sm text-white/30 font-medium leading-relaxed">
            Paga mensual y cancela cuando quieras. Los créditos se renuevan cada mes.
          </p>
        </div>

        {/* Protocol Grid */}
        <div className="grid w-full max-w-[1440px] gap-8 md:grid-cols-2 lg:grid-cols-4 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-[3rem] p-10 transition-all duration-700 hover:-translate-y-4 group",
                plan.name === 'Premium' 
                  ? "aether-card border-aether-purple/30 shadow-5xl shadow-aether-purple/10 aether-border-glow" 
                  : "aether-card border-white/5"
              )}
            >
              <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2.5xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <plan.icon className={cn("h-7 w-7", plan.color)} />
              </div>

              <div className="space-y-2 mb-8">
                 <h2 className="text-2xl font-bold text-white uppercase font-display tracking-tight">{plan.name}</h2>
                 <p className="text-[11px] text-white/20 font-bold uppercase tracking-widest leading-relaxed">{plan.description}</p>
              </div>

              <div className="mb-10 flex items-baseline gap-2">
                <span className={cn("text-6xl font-bold tracking-tighter font-display", plan.name === 'Premium' ? "text-white" : "text-white/60")}>
                  {plan.price}
                </span>
                <span className="text-[11px] font-bold text-white/20 uppercase tracking-[0.3em] font-display">{plan.period}</span>
              </div>
              
              <div className="mb-10 flex items-center justify-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] font-display text-white/40 group-hover:text-white transition-colors duration-500">
                <Sparkles className={cn("h-4 w-4", plan.color)} />
                {plan.creditsLabel}
              </div>

              <ul className="flex-1 space-y-5 px-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-4 text-[11px] text-white/20 font-bold uppercase tracking-widest group-hover:text-white/40 transition-colors">
                    <Check className={cn("h-4 w-4 shrink-0", plan.color)} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlan === plan.key}
                className={cn(
                  "mt-12 h-18 w-full rounded-2.5xl font-bold text-[11px] uppercase tracking-[0.3em] font-display transition-all active:scale-[0.98] shadow-4xl group-hover:scale-[1.02] duration-500",
                  plan.name === "Starter" 
                    ? "bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white" 
                    : "bg-white text-black hover:bg-white/90"
                )}
              >
                {loadingPlan === plan.key ? <Loader2 className="h-5 w-5 animate-spin" /> : plan.cta}
              </Button>
              
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white text-black shadow-5xl animate-bounce">
                  {plan.badge}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Credit Packs */}
        <div className="mt-32 w-full max-w-[1440px]">
             <div className="flex flex-col items-center mb-16 text-center space-y-4">
                 <Badge className="bg-aether-blue/10 text-aether-blue border-aether-blue/20 px-8 py-3 rounded-full text-[10px] font-bold tracking-[0.5em] uppercase font-display">
                    Créditos extra
                 </Badge>
                 <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-white uppercase font-display">Compra <span className="opacity-40">créditos.</span></h2>
                 <p className="text-white/30 font-medium text-sm max-w-md leading-relaxed">
                    Sin cambiar tu plan. Se suman a tus créditos actuales y no tienen vencimiento.
                 </p>
             </div>

           <div className="grid gap-6 sm:grid-cols-3">
              {CREDIT_PACKS.map((pack) => (
                  <div key={pack.id} className="group aether-card rounded-[2.5rem] border border-white/5 p-10 transition-all duration-500 hover:border-aether-blue/30 hover:scale-[1.03] text-center relative overflow-hidden">
                    <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mx-auto shadow-inner group-hover:bg-white transition-all duration-500">
                       <Coins className="h-8 w-8 text-white/20 group-hover:text-black transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight uppercase font-display">{pack.name}</h3>
                    <p className="mt-1.5 text-xs font-bold text-aether-blue uppercase tracking-widest font-display">{pack.credits} créditos</p>

                    {/* Cost per credit */}
                    <p className="mt-2 text-[10px] text-white/20 font-medium">
                      ≈ ${(parseFloat(pack.price.replace('$','')) / pack.credits).toFixed(3)} por crédito
                    </p>

                    <div className="mt-8 flex items-baseline justify-center gap-1">
                       <span className="text-4xl font-bold text-white tracking-tighter font-display tabular-nums">{pack.price}</span>
                       <span className="text-[11px] font-bold text-white/20 uppercase tracking-widest font-display">USD</span>
                    </div>

                    <Button
                       onClick={() => handleBuyCredits(pack)}
                       disabled={loadingPack === pack.id}
                       className="mt-10 w-full h-14 bg-white/[0.03] border border-white/5 text-white/40 hover:bg-white hover:text-black hover:border-white rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 font-display"
                    >
                       {loadingPack === pack.id ? <Loader2 className="h-5 w-5 animate-spin" /> : "Comprar ahora"}
                    </Button>
                 </div>
              ))}
           </div>
        </div>

        {/* FAQs */}
        <div className="mt-32 w-full max-w-4xl">
          <h2 className="text-center text-4xl md:text-6xl font-bold text-white mb-16 tracking-tight uppercase font-display">
            Preguntas <span className="opacity-40">frecuentes.</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="aether-card rounded-[2rem] border border-white/5 p-8 hover:border-aether-purple/20 transition-all group duration-500">
                <h3 className="text-sm font-bold text-white leading-relaxed font-display group-hover:text-aether-purple transition-colors mb-4">{faq.q}</h3>
                <p className="text-[13px] text-white/30 font-medium leading-relaxed group-hover:text-white/50 transition-colors">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="mt-20 p-8 rounded-[2.5rem] aether-card border border-white/5 flex flex-col md:flex-row items-center gap-6 px-12 group hover:border-aether-purple/10 duration-500">
           <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-aether-purple group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-7 h-7" />
           </div>
           <div className="text-center md:text-left flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-white/20 font-display mb-1">¿Tienes algún problema?</p>
              <p className="text-base font-bold text-white font-display">Escríbenos a <span className="text-aether-purple">soporte@creatorIA.pro</span></p>
           </div>
           <Button className="bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl px-8 h-12 font-display font-bold uppercase tracking-widest text-[10px]">Contactar soporte</Button>
        </div>
      </main>
      
      {/* Background Evolution Glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute top-1/2 left-1/4 h-[700px] w-[700px] rounded-full bg-aether-purple/5 blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 h-[600px] w-[600px] rounded-full bg-aether-blue/5 blur-[100px]" />
      </div>

      {/* Grain overlay */}
      <div className="pointer-events-none fixed inset-0 z-10 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
    </div>
    </>
  );
}
