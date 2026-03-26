import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { stripeService } from "@/services/billing-service";
import { STRIPE_TIERS } from "@/lib/stripe-tiers";
import { CREDIT_PACKS } from "@/lib/credit-packs";
import { Sparkles, Check, Zap, Crown, ArrowLeft, Star, GraduationCap, Loader2, Coins, Clock, ArrowRight, ShieldCheck, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";

const plans = [
  {
    key: "starter" as const,
    name: "Starter",
    price: "$0",
    period: "forever",
    credits: 10,
    creditsLabel: "10 trial credits",
    description: "Explore the neural ecosystem with primary access.",
    features: [
      "10 init credits",
      "All neural modules",
      "Standard resolution",
      "Community nexus access",
    ],
    cta: "Start Free",
    badge: null,
    icon: Zap,
    color: "text-white",
    stripeTier: null,
  },
  {
    key: "educacion" as const,
    name: "Academic",
    price: "$4.99",
    period: "/mo",
    credits: 500,
    creditsLabel: "500 credits/mo",
    description: "Special protocol for students and academic operators.",
    features: [
      "500 monthly units",
      "Aether Studio access",
      "High-fidelity rendering",
      "Academic verification",
    ],
    cta: "Academic Access",
    badge: "50% Offset",
    icon: GraduationCap,
    color: "text-rose-400",
    stripeTier: "educacion" as const,
  },
  {
    key: "pro" as const,
    name: "Premium",
    price: "$9.99",
    period: "/mo",
    credits: 1000,
    creditsLabel: "1,000 credits/mo",
    description: "For elite creators manifestating high-density assets.",
    features: [
      "1,000 monthly units",
      "Full Studio orchestration",
      "Video neural rendering",
      "Alpha Matte modules",
    ],
    cta: "Sync Premium",
    badge: "Operational Peak",
    icon: Star,
    color: "text-aether-purple",
    stripeTier: "pro" as const,
  },
  {
    key: "business" as const,
    name: "Enterprise",
    price: "$49.99",
    period: "/mo",
    credits: 5000,
    creditsLabel: "5,000 credits/mo",
    description: "Industrial scale for global agencies and clusters.",
    features: [
      "5,000 monthly units",
      "Infinite cluster spaces",
      "Private vaulting",
      "24/7 Neural support",
    ],
    cta: "Enterprise Sync",
    badge: "Global Scale",
    icon: Crown,
    color: "text-aether-blue",
    stripeTier: "business" as const,
  },
];

const faqs = [
  { q: "How does the Academic Protocol work?", a: "We orchestrate automatic validation via .edu or .ac endpoints to grant the 50% offset immediately." },
  { q: "Can I modify my protocol anytime?", a: "Yes. You can scale your nexus tier up or down. Remaining credits are automatically recalibrated." },
  { q: "What happens if I exhaust my charge?", a: "You can manifest instant Credit Packs or wait for the next billing cycle synchronization." },
  { q: "Who owns the manifested assets?", a: "You maintain 100% industrial ownership of all neural assets manifested under paid protocols." },
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
        <title>Pricing & Protocols | Aether Evolution</title>
        <meta name="description" content="Choose your neural protocol level. Scalable industrial AI orchestration for elite creators." />
      </Helmet>
      
      <div className="min-h-screen bg-[#050506] text-white selection:bg-aether-purple/30 selection:text-white font-sans overflow-hidden relative">
      <AppHeader userId={userId} onSignOut={() => supabase.auth.signOut()} />

      <main className="pt-24 relative z-10 flex flex-col items-center px-8 pb-48">
        
        {/* Cinematic Promo Banner */}
        <div className="w-full max-w-[1440px] mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="aether-card rounded-3xl border border-white/10 p-1 group relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-aether-purple/10 via-aether-blue/10 to-aether-purple/10 animate-pulse" />
             <div className="relative z-10 w-full flex flex-col sm:flex-row items-center justify-between px-8 py-4 gap-6 backdrop-blur-3xl">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-4xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <Sparkles className="w-6 h-6 text-black" />
                   </div>
                   <div>
                      <h3 className="text-base font-bold text-white tracking-tight font-display uppercase">Aether Launch Protocol v8.0</h3>
                      <p className="text-[11px] text-white/30 font-bold uppercase tracking-widest mt-1">Manifest double charge using protocol <strong className="text-white bg-white/5 py-1 px-2 rounded-lg border border-white/10 ml-1">EVOLVE20</strong></p>
                   </div>
                </div>
                <div className="flex items-center gap-4 bg-[#050506] px-6 py-3 rounded-2xl border border-white/5 shadow-inner">
                   <Clock className="w-4 h-4 text-aether-purple animate-pulse" />
                   <div className="flex items-center gap-2 text-sm font-bold tabular-nums font-display tracking-[0.1em]">
                      <span className="text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                      <span className="text-white/20">:</span>
                      <span className="text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
                      <span className="text-white/20">:</span>
                      <span className="text-aether-purple text-glow-purple">{String(timeLeft.seconds).padStart(2, '0')}</span>
                   </div>
                </div>
             </div>
           </div>
        </div>

        <div className="text-center mb-24 space-y-6">
          <Badge className="bg-white/5 text-white/30 border-white/10 px-6 py-2 rounded-full text-[10px] font-bold tracking-[0.4em] uppercase font-display">
            Transparent Protocols
          </Badge>
          <h1 className="text-6xl md:text-9xl font-bold tracking-tight uppercase font-display">
            Neural Power, <br /> <span className="bg-gradient-to-r from-white via-white to-white/20 bg-clip-text text-transparent">Scalable.</span>
          </h1>
          <p className="max-w-xl mx-auto text-sm text-white/20 font-medium uppercase tracking-[0.2em] leading-relaxed font-display italic">
            Engineered for creators, optimized for agencies. Orchestrate your evolution at the correct level of charge.
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
        
        {/* Instant Charge Packs */}
        <div className="mt-56 w-full max-w-[1440px]">
             <div className="flex flex-col items-center mb-24 text-center space-y-6">
                 <Badge className="bg-aether-blue/10 text-aether-blue border-aether-blue/20 px-8 py-3 rounded-full text-[10px] font-bold tracking-[0.5em] uppercase font-display">
                    Instant Manifestation
                 </Badge>
                 <h2 className="text-6xl md:text-8xl font-bold tracking-tight text-white uppercase font-display">Nexus <span className="opacity-40">Charges.</span></h2>
                 <p className="text-white/20 font-bold uppercase tracking-[0.3em] text-xs max-w-xl leading-loose font-display">
                    Instantly manifests industrial units without protocol modifications.
                 </p>
             </div>
           
           <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {CREDIT_PACKS.map((pack) => (
                  <div key={pack.id} className="group aether-card rounded-[3.5rem] border border-white/5 p-12 transition-all duration-700 hover:border-aether-blue/30 hover:scale-[1.05] shadow-5xl text-center relative overflow-hidden">
                    <div className="mb-10 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white/5 border border-white/10 mx-auto shadow-inner group-hover:bg-white transition-all duration-700">
                       <Coins className="h-10 w-10 text-white/20 group-hover:text-black transition-colors" />
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight uppercase font-display">{pack.name}</h3>
                    <p className="mt-2 text-xs font-bold text-aether-blue uppercase tracking-[0.3em] font-display">{pack.credits} units</p>
                    
                    <div className="mt-10 flex items-baseline justify-center gap-2">
                       <span className="text-5xl font-bold text-white tracking-tighter font-display tabular-nums">${pack.price}</span>
                       <span className="text-[11px] font-bold text-white/20 uppercase tracking-widest font-display">USD</span>
                    </div>
                    
                    <Button 
                       onClick={() => handleBuyCredits(pack)}
                       disabled={loadingPack === pack.id}
                       className="mt-12 w-full h-16 bg-white/[0.03] border border-white/5 text-white/40 hover:bg-white hover:text-black hover:border-white rounded-2.5xl font-bold text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 font-display"
                    >
                       {loadingPack === pack.id ? <Loader2 className="h-5 w-5 animate-spin" /> : "Manifest Now"}
                    </Button>
                    
                    {/* Visual noise background for cards */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                 </div>
              ))}
           </div>
        </div>

        {/* Global FAQs */}
        <div className="mt-56 w-full max-w-6xl">
          <h2 className="text-center text-4xl md:text-7xl font-bold text-white mb-28 tracking-tight uppercase font-display">
            Operational <span className="opacity-40">Intelligence.</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {faqs.map((faq) => (
              <div key={faq.q} className="aether-card rounded-[2.5rem] border border-white/5 p-12 shadow-3xl hover:border-aether-purple/20 transition-all group group duration-700">
                <h3 className="text-sm font-bold text-white leading-relaxed uppercase tracking-widest font-display group-hover:text-aether-purple transition-colors mb-6">{faq.q}</h3>
                <p className="text-[13px] text-white/20 font-medium uppercase tracking-widest leading-loose font-display group-hover:text-white/40 transition-colors">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-32 p-10 rounded-[3rem] aether-card border border-white/5 flex flex-col md:flex-row items-center gap-8 px-16 group hover:border-aether-purple/10 duration-700">
           <div className="p-5 rounded-2.5xl bg-white/5 border border-white/5 text-aether-purple group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8" />
           </div>
           <div className="text-center md:text-left flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-white/20 font-display">Nexus Resolution Center</p>
              <p className="text-lg font-bold text-white mt-1 font-display">Facing neural deficiency or protocol errors? <span className="text-aether-purple whitespace-nowrap">protocol@aether-evolution.io</span></p>
           </div>
           <Button className="bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl px-10 h-14 font-display font-bold uppercase tracking-widest text-[10px]">Contact Liaison</Button>
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
