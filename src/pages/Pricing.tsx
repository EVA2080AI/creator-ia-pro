import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { boldService } from "@/services/bold-service";
import { CREDIT_PACKS } from "@/lib/credit-packs";
import { CATEGORY_CONFIG } from "@/lib/models.config";
import {
  Sparkles, Check, Zap, Crown, Rocket, Loader2,
  Coins, Shield, Code2, Megaphone, MessageSquare,
  ChevronDown, ChevronUp, Bolt,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { cn } from "@/lib/utils";

// ─── Plan definitions ─────────────────────────────────────────────────────────
const PLANS = [
  {
    key: "free" as const,
    name: "Free",
    price: 0,
    priceLabel: "$0",
    period: "/mes",
    credits: 5,
    creditsLabel: "5 créditos",
    description: "Para explorar la plataforma y ver la magia en acción.",
    color: "#9CA3AF",
    gradient: "from-gray-500/10 to-gray-500/5",
    border: "border-gray-500/20",
    icon: Sparkles,
    badge: null,
    category: "ECO",
    stripeTier: "free" as const,
    features: [
      { label: "5 créditos/mes", highlight: true },
      { label: "Modelos ECO (Gemini, Llama)", highlight: false },
      { label: "Studio (básico)", highlight: false },
    ],
    lockedFeatures: ["Modelos Premium", "Code y Canvas"],
    psychNote: "Comienza sin tarjeta",
  },
  {
    key: "starter" as const,
    name: "Starter",
    price: 69000,
    priceLabel: "$69.000",
    period: "/mes",
    credits: 500,
    creditsLabel: "500 créditos",
    description: "Para creadores que están construyendo su viaje.",
    color: "#4ADE80",
    gradient: "from-emerald-500/10 to-emerald-500/5",
    border: "border-emerald-500/20",
    icon: Zap,
    badge: null,
    category: "PRO",
    stripeTier: "starter" as const,
    features: [
      { label: "500 créditos/mes", highlight: true },
      { label: "Modelos rápidos y estándar", highlight: false },
      { label: "Genesis (Chat IA)", highlight: false },
      { label: "Soporte email", highlight: false },
    ],
    lockedFeatures: ["Modelos Premium (Sonnet, Opus)", "Code y Canvas"],
    psychNote: "Prueba sin compromiso · cancela cuando quieras",
  },
  {
    key: "creator" as const,
    name: "Creator",
    price: 138000,
    priceLabel: "$138.000",
    period: "/mes",
    credits: 1200,
    creditsLabel: "1.200 créditos",
    description: "El nivel ideal para creadores e independientes.",
    color: "#A855F7",
    gradient: "from-primary/15 to-primary/5",
    border: "border-primary/30",
    icon: Rocket,
    badge: "Más popular",
    category: "PRO",
    stripeTier: "creator" as const,
    features: [
      { label: "1.200 créditos/mes", highlight: true },
      { label: "Modelos rápidos y estándar", highlight: true },
      { label: "Mayor límite de uso", highlight: false },
      { label: "Soporte prioritario", highlight: false },
    ],
    lockedFeatures: ["Modelos Premium", "Code y Canvas"],
    psychNote: "Inversión 100% deducible de impuestos",
  },
  {
    key: "pymes" as const,
    name: "Pymes",
    price: 345000,
    priceLabel: "$345.000",
    period: "/mes",
    credits: 4000,
    creditsLabel: "4.000 créditos",
    description: "Acceso total. Modelos Premium y todas las herramientas.",
    color: "#F59E0B",
    gradient: "from-amber-500/15 to-amber-500/5",
    border: "border-amber-500/30",
    icon: Crown,
    badge: "Acceso Total",
    category: "ULTRA",
    stripeTier: "pymes" as const,
    features: [
      { label: "4.000 créditos/mes", highlight: true },
      { label: "Modelos Premium (Claude 3.5 Sonnet, GPT-4o, Opus)", highlight: true },
      { label: "Desbloquea Code (BuilderAI IDE)", highlight: true },
      { label: "Desbloquea Canvas (ReactFlow)", highlight: true },
      { label: "Soporte prioritario 24/7", highlight: true },
    ],
    lockedFeatures: [],
    psychNote: "Máximo retorno para negocios de contenido.",
  },
];

// ─── Comparison table rows ────────────────────────────────────────────────────
const COMPARISON_ROWS = [
  { label: "Créditos/mes",             free: "5",       starter: "500",  creator: "1.200", pymes: "4.000" },
  { label: "Modelos Estándar",         free: true,      starter: true,   creator: true,    pymes: true },
  { label: "Modelos Premium",          free: false,     starter: false,  creator: false,   pymes: true },
  { label: "Genesis (Chat IA)",        free: true,      starter: true,   creator: true,    pymes: true },
  { label: "Studio",                   free: true,      starter: true,   creator: true,    pymes: true },
  { label: "Code (BuilderAI)",         free: false,     starter: false,  creator: false,   pymes: true },
  { label: "Canvas (ReactFlow)",       free: false,     starter: false,  creator: false,   pymes: true },
  { label: "Soporte",                  free: "Foro",    starter: "Email",creator: "Prior", pymes: "24/7" },
];

// ─── Lightning bolts component ────────────────────────────────────────────────
function Bolts({ count, color }: { count: number; color: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Zap key={i} className="h-3 w-3" style={{ color: i < count ? color : 'rgba(255,255,255,0.1)' }} />
      ))}
    </div>
  );
}

// ─── Model category pill ──────────────────────────────────────────────────────
function CategoryPill({ category }: { category: keyof typeof CATEGORY_CONFIG }) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
      style={{ background: cfg.bgColor, color: cfg.color, border: `1px solid ${cfg.color}30` }}
    >
      <Bolts count={cfg.bolts} color={cfg.color} />
      {cfg.label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Pricing() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [annual, setAnnual] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setUserId(session?.user?.id);
    });
  }, []);

  const handleBuyCredits = async (pack: typeof CREDIT_PACKS[number]) => {
    if (!isLoggedIn) {
      toast.info("Necesitas iniciar sesión para comprar créditos.");
      navigate("/auth");
      return;
    }
    setLoadingPack(pack.id);
    try {
      await boldService.purchaseCredits(pack.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al procesar el pago.");
      setLoadingPack(null);
    } 
  };

  const handleSubscribe = async (plan: typeof PLANS[number]) => {
    if (!isLoggedIn) {
      toast.info("Necesitas iniciar sesión para suscribirte.");
      navigate("/auth");
      return;
    }
    
    // In the new credit-only model with Bold, we map subscriptions to large credit packs.
    // For now, prompt the user to buy the explicit credit packs instead.
    toast.info("En el nuevo modelo Bold, por favor adquiere un pack de créditos debajo.");
    document.getElementById("credit-packs-section")?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>Planes y Precios | Creator IA Pro</title>
        <meta name="description" content="Starter $12 · Creator $29 · Agency $79. Créditos mensuales para generar con los mejores modelos de IA." />
      </Helmet>

      <div className="min-h-screen bg-background bg-grid-white/[0.02] text-white selection:bg-primary/30">
        <AppHeader userId={userId} onSignOut={() => supabase.auth.signOut()} />

        <main className="pt-20 pb-40">

          {/* ── Hero ────────────────────────────────────────────────────────── */}
          <section className="text-center px-6 pt-12 pb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-8">
              <Sparkles className="h-3 w-3 text-primary" />
              Precios claros · Cancela cuando quieras
            </div>
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter uppercase font-display mb-6">
              Elige tu{" "}
              <span className="bg-gradient-to-br from-white via-white to-white/20 bg-clip-text text-transparent">
                plan.
              </span>
            </h1>
            <p className="max-w-lg mx-auto text-[15px] text-white/35 leading-relaxed">
              Créditos basados en tokens. ECO · PRO · ULTRA.{" "}
              <span className="text-white/60 font-semibold">Los multiplicadores protegen tu margen.</span>
            </p>
          </section>

          {/* ── Billing period toggle ────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <span className={cn("text-[12px] font-bold transition-colors", !annual ? "text-white" : "text-white/30")}>Mensual</span>
            <button
              onClick={() => setAnnual(v => !v)}
              className={cn(
                "relative w-12 h-6 rounded-full transition-all duration-300",
                annual ? "bg-primary" : "bg-white/10"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300",
                annual ? "left-6" : "left-0.5"
              )} />
            </button>
            <span className={cn("text-[12px] font-bold transition-colors flex items-center gap-2", annual ? "text-white" : "text-white/30")}>
              Anual
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/30">
                −20%
              </span>
            </span>
          </div>

          {/* ── Model category explanation (bento row) ────────────────────── */}
          <section className="px-6 mb-12 max-w-5xl mx-auto">
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(CATEGORY_CONFIG) as [keyof typeof CATEGORY_CONFIG, typeof CATEGORY_CONFIG[keyof typeof CATEGORY_CONFIG]][]).map(([key, cfg]) => (
                <div key={key} className="rounded-2xl border p-5" style={{ borderColor: cfg.color + '20', background: cfg.bgColor }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
                    <Bolts count={cfg.bolts} color={cfg.color} />
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed">{cfg.description}</p>
                  <p className="text-xs font-bold text-white/60 mt-2">{cfg.multiplier}× multiplicador</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Pricing cards (bento grid) ───────────────────────────────── */}
          <section className="px-6 mb-8 w-full">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isLoading = loadingPlan === plan.key;
                const isPopular = plan.badge === "Más popular";
                const displayPrice = annual ? Math.round(plan.price * 0.8) : plan.price;
                const annualTotal = annual ? Math.round(plan.price * 0.8 * 12) : null;
                return (
                  <div
                    key={plan.key}
                    className={cn(
                      "relative rounded-[2rem] border p-8 flex flex-col transition-all duration-300 hover:-translate-y-1",
                      isPopular
                        ? "bg-gradient-to-b " + plan.gradient + " " + plan.border + " shadow-[0_0_60px_rgba(168,85,247,0.15)]"
                        : "bg-white/[0.02] " + plan.border
                    )}
                  >
                    {/* Popular badge */}
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                        style={{ background: plan.color, color: '#000' }}>
                        {plan.badge}
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: plan.color + '20' }}>
                            <Icon className="h-4.5 w-4.5" style={{ color: plan.color }} />
                          </div>
                          <span className="text-base font-black text-white font-display">{plan.name}</span>
                        </div>
                        <CategoryPill category={plan.category as keyof typeof CATEGORY_CONFIG} />
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-2">
                      <span className="text-5xl md:text-6xl font-black text-white font-display tracking-tight">${displayPrice.toLocaleString('es-CO')}</span>
                      <span className="text-white/30 text-sm ml-1">COP/mes</span>
                      {annual && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[11px] text-white/25 line-through">${plan.price.toLocaleString('es-CO')}</span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/25">
                            ${annualTotal?.toLocaleString('es-CO')} / año
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Credits */}
                    <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl" style={{ background: plan.color + '10' }}>
                      <Coins className="h-4 w-4 shrink-0" style={{ color: plan.color }} />
                      <span className="text-sm font-black" style={{ color: plan.color }}>{plan.creditsLabel}/mes</span>
                    </div>

                    {/* Description */}
                    <p className="text-[12px] text-white/40 mb-5 leading-relaxed">{plan.description}</p>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map(f => (
                        <li key={f.label} className="flex items-start gap-2.5">
                          <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: f.highlight ? plan.color : 'rgba(255,255,255,0.25)' }} />
                          <span className={cn("text-[12px] leading-relaxed", f.highlight ? "text-white/85 font-semibold" : "text-white/45")}>
                            {f.label}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={isLoading}
                      className={cn(
                        "w-full py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50",
                        isPopular
                          ? "bg-white text-black hover:bg-white/90 shadow-lg"
                          : "border text-white hover:bg-white/5"
                      )}
                      style={!isPopular ? { borderColor: plan.color + '40', color: plan.color } : undefined}
                    >
                      {isLoading
                        ? <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        : `Activar ${plan.name}`}
                    </button>

                    {/* Psych note */}
                    {plan.psychNote && (
                      <p className="text-center text-[9px] text-white/20 mt-3 font-medium">{plan.psychNote}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Comparison table toggle ──────────────────────────────────── */}
          <section className="px-6 max-w-5xl mx-auto mb-12">
            <button
              onClick={() => setShowComparison(v => !v)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-[11px] font-bold uppercase tracking-widest text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all"
            >
              {showComparison ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showComparison ? "Ocultar comparación" : "Ver tabla comparativa completa"}
            </button>

            {showComparison && (
              <div className="mt-4 rounded-2xl border border-white/[0.06] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-5 py-3.5 text-[10px] font-bold text-white/25 uppercase tracking-widest w-2/5">Feature</th>
                      {PLANS.map(p => (
                        <th key={p.key} className="px-4 py-3.5 text-center">
                          <span className="text-[11px] font-black" style={{ color: p.color }}>{p.name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row, i) => (
                      <tr key={row.label} className={cn("border-b border-white/[0.04]", i % 2 === 0 && "bg-white/[0.01]")}>
                        <td className="px-5 py-3 text-[12px] text-white/50">{row.label}</td>
                        {(['free', 'starter', 'creator', 'pymes'] as const).map(tier => {
                          const val = (row as any)[tier];
                          return (
                            <td key={tier} className="px-4 py-3 text-center">
                              {typeof val === 'boolean' ? (
                                val
                                  ? <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                                  : <span className="text-white/15 text-lg">—</span>
                              ) : (
                                <span className="text-[11px] font-bold text-white/70">{val}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Credit packs ─────────────────────────────────────────────── */}
          {CREDIT_PACKS && CREDIT_PACKS.length > 0 && (
            <section id="credit-packs-section" className="px-6 max-w-5xl mx-auto mb-12">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-black uppercase tracking-widest text-primary mb-3">
                  <Coins className="h-3 w-3 text-primary" />
                  Top-up · Pagos con Bold
                </div>
                <h2 className="text-2xl font-black text-white font-display tracking-tight">Créditos extra</h2>
                <p className="text-white/30 text-[13px] mt-1">Pago único · no expiran · compatible con todos los planes</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {CREDIT_PACKS.map((pack) => {
                  const isLoadingThis = loadingPack === pack.id;
                  return (
                    <div
                      key={pack.id}
                      className={cn(
                        "relative rounded-2xl border p-5 flex flex-col gap-4 transition-all",
                        pack.popular
                          ? "border-primary/30 bg-primary/5 shadow-[0_0_30px_rgba(74,222,128,0.08)]"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                      )}
                    >
                      {pack.popular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary text-white">
                          Más popular
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20 shrink-0">
                          <Coins className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex items-baseline gap-1 mt-1 justify-center">
                          <span className="text-3xl font-black text-white">{pack.credits_amount.toLocaleString()}</span>
                          <span className="text-sm font-medium text-white/50">créditos</span>
                        </div>
                        <span className="ml-auto text-xl font-black text-white font-display">{pack.price}</span>
                      </div>
                      <button
                        onClick={() => handleBuyCredits(pack)}
                        disabled={isLoadingThis}
                        className={cn(
                          "w-full py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50",
                          pack.popular
                            ? "bg-primary text-white hover:bg-primary/90"
                            : "border border-white/[0.10] text-white/60 hover:text-white hover:border-white/25 hover:bg-white/[0.04]"
                        )}
                      >
                        {isLoadingThis
                          ? <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          : "Comprar ahora"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── FAQ ──────────────────────────────────────────────────────── */}
          <section className="px-6 max-w-3xl mx-auto">
            <h2 className="text-center text-lg font-black text-white/40 uppercase tracking-widest mb-6">
              Preguntas frecuentes
            </h2>
            <div className="space-y-3">
              {[
                { q: "¿Qué es Genesis IDE?", a: "Genesis es nuestro generador de código IA estilo Lovable. Describes tu app en lenguaje natural y BuilderAI genera React + Tailwind listo para producción. Puedes hacer push directo a tu repositorio de GitHub." },
                { q: "¿Qué son los multiplicadores ECO/PRO/ULTRA?", a: "Son factores que determinan cuántos créditos consume cada modelo. Un modelo ECO (1×) usa 1 crédito por ~100 tokens. Un modelo PRO (5×) usa 5 créditos. ULTRA (20×) usa 20. Esto refleja el costo real de inferencia." },
                { q: "¿Puedo cambiar de plan cuando quiera?", a: "Sí. Puedes subir o bajar de plan en cualquier momento desde el Portal de cliente. Los créditos del ciclo actual se mantienen." },
                { q: "¿Qué pasa si se me acaban los créditos?", a: "Puedes comprar un pack extra (top-up) sin cambiar de plan, o esperar tu renovación mensual." },
                { q: "¿Los créditos expiran?", a: "Los créditos mensuales se renuevan cada ciclo de facturación. Los packs de top-up no expiran." },
                { q: "¿Quién es dueño de lo que genero?", a: "Tú. El 100% de los activos y el código generado en planes de pago son de tu propiedad absoluta." },
              ].map(faq => (
                <div key={faq.q} className="rounded-2xl border border-white/[0.06] px-6 py-4">
                  <p className="text-[13px] font-bold text-white/70 mb-2">{faq.q}</p>
                  <p className="text-[12px] text-white/35 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </>
  );
}
