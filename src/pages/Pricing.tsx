import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { boldService } from "@/services/billing-service";
import { CREDIT_PACKS } from "@/lib/credit-packs";
import { CATEGORY_CONFIG } from "@/lib/models.config";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import React from "react";
import {
  Sparkles, Check, Zap, Crown, Rocket, Loader2,
  Coins, Shield, Code2, Bolt, ArrowRight,
  TrendingUp, Globe, Lock, Cpu, Star, MessageSquare
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
    credits: 5,
    creditsLabel: "5 créditos",
    description: "Explora la magia de la IA sin compromisos.",
    color: "#9CA3AF",
    gradient: "from-gray-500/10 to-gray-500/5",
    border: "border-gray-500/20",
    icon: Sparkles,
    badge: null,
    category: "ECO",
    features: [
      { label: "5 créditos mensuales", highlight: true },
      { label: "Modelos ECO (Llama 3, Gemini Flash)", highlight: false },
      { label: "Genesis Studio básico", highlight: false },
      { label: "Soporte vía comunidad", highlight: false },
    ],
  },
  {
    key: "starter" as const,
    name: "Starter",
    price: 69000,
    priceLabel: "$69.000",
    credits: 500,
    creditsLabel: "500 créditos",
    description: "Ideal para creadores que inician sus proyectos.",
    color: "#4ADE80",
    gradient: "from-emerald-500/15 to-emerald-500/5",
    border: "border-emerald-500/20",
    glow: "rgba(74, 222, 128, 0.15)",
    icon: Zap,
    badge: null,
    category: "PRO",
    features: [
      { label: "500 créditos mensuales", highlight: true },
      { label: "Acceso a modelos PRO", highlight: false },
      { label: "Soporte por Email prioritario", highlight: false },
      { label: "Genesis Studio completo", highlight: false },
    ],
  },
  {
    key: "creator" as const,
    name: "Creator",
    price: 138000,
    priceLabel: "$138.000",
    credits: 1200,
    creditsLabel: "1.200 créditos",
    description: "Nuestra opción más popular para profesionales.",
    color: "#A855F7",
    gradient: "from-primary/20 to-primary/5",
    border: "border-primary/30",
    glow: "rgba(168, 85, 247, 0.2)",
    icon: Rocket,
    badge: "Más popular",
    category: "PRO",
    features: [
      { label: "1.200 créditos mensuales", highlight: true },
      { label: "Modelos estándar y rápidos", highlight: true },
      { label: "Mayores límites de concurrencia", highlight: false },
      { label: "Acceso temprano a betas", highlight: false },
    ],
  },
  {
    key: "pymes" as const,
    name: "Pymes",
    price: 345000,
    priceLabel: "$345.000",
    credits: 4000,
    creditsLabel: "4.000 créditos",
    description: "Poder total sin límites para tu negocio.",
    color: "#F59E0B",
    gradient: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/30",
    glow: "rgba(245, 158, 11, 0.25)",
    icon: Crown,
    badge: "Acceso Total",
    category: "ULTRA",
    features: [
      { label: "4.000 créditos mensuales", highlight: true },
      { label: "Modelos ULTRA (Sonnet 3.5, GPT-4o)", highlight: true },
      { label: "BuilderAI (IDE Integrado)", highlight: true },
      { label: "Canvas (Visual Builder)", highlight: true },
      { label: "Soporte 24/7 dedicado", highlight: true },
    ],
  },
];

const COMPARISON_DATA = [
  { feature: "Costo por Token", creator: "Optimización Dinámica", others: "Tarifas Fijas Altas" },
  { feature: "Model Switching", creator: "Instantáneo (Any-Model)", others: "Bloqueo de Proveedor" },
  { feature: "IDE Studio", creator: "Incluido en Planes", others: "Costo Extra ($20+)" },
  { feature: "Soporte Latam", creator: "Bold Local / COP", others: "Tarjetas Int. / USD" },
];

const TESTIMONIALS = [
  {
    name: "Carlos Rivera",
    role: "Nómada Digital",
    content: "La facilidad de pagar en COP con Bold y tener acceso a Claude 3.5 Sonnet cambió mi flujo de trabajo por completo.",
    avatar: "https://i.pravatar.cc/150?u=carlos",
  },
  {
    name: "Elena Gómez",
    role: "Founder @ TechNova",
    content: "El modo ULTRA es una bestia. BuilderAI genera interfaces complejas en segundos. Es como tener 10 seniors en uno.",
    avatar: "https://i.pravatar.cc/150?u=elena",
  },
  {
    name: "Mario Duarte",
    role: "Creador de Contenido",
    content: "Los créditos top-up que no expiran son clave. Compro lo que necesito y sé que siempre estarán ahí.",
    avatar: "https://i.pravatar.cc/150?u=mario",
  },
];

function MeshGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-40">
      <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-primary/8 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse [animation-delay:4s]" />
    </div>
  );
}

function SectionHeader({ badge, title, subtitle }: { badge: string; title: string | React.ReactNode; subtitle: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center px-6 mb-16"
    >
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-50 border border-zinc-200 text-[10px] font-black uppercase tracking-widest text-primary mb-4">
        {badge}
      </span>
      <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase font-display mb-4">
        {title}
      </h2>
      <p className="max-w-xl mx-auto text-zinc-400 text-[15px] leading-relaxed">
        {subtitle}
      </p>
    </motion.div>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [annual, setAnnual] = useState(false);
  const [estimateSlider, setEstimateSlider] = useState(500);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setUserId(session?.user?.id);
    });
  }, []);

  const handleBoldAction = async (id: string) => {
    if (!isLoggedIn) {
      toast.info("Identidad requerida. Por favor inicia sesión.");
      navigate("/auth");
      return;
    }
    setLoadingAction(id);
    try {
      await boldService.purchaseCredits(id);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#4ade80', '#a855f7']
      });
    } catch (err: any) {
      toast.error(err.message || "Error al conectar con Bold");
      setLoadingAction(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Precios | Creator IA Pro</title>
        <meta name="description" content="Esquema de créditos industriales. Paga por lo que usas con la seguridad de Bold.co." />
      </Helmet>

      <div className="min-h-screen bg-background bg-grid-white/[0.02] text-zinc-900 selection:bg-primary/15 relative overflow-x-hidden">
        <MeshGradient />

        <main id="main-content" className="pt-20 pb-40 relative z-10">
          
          {/* ── Hero ────────────────────────────────────────────────────────── */}
          <section className="relative px-6 mb-24 overflow-visible">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-5xl mx-auto text-center"
            >
              <h1 className="text-6xl sm:text-8xl md:text-[8rem] font-black tracking-[-0.05em] uppercase font-display leading-[0.85] mb-8 text-zinc-900">
                Escala tu<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-purple-300">Impacto.</span>
              </h1>
              <p className="max-w-lg mx-auto text-lg text-zinc-400 leading-relaxed font-medium">
                Sin suscripciones forzadas. <span className="text-zinc-700">Créditos industriales</span> para creadores que exigen la mejor latencia y los modelos más potentes.
              </p>
            </motion.div>
          </section>

          {/* ── Annual Toggle ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-6 mb-16">
            <span className={cn("text-xs font-black uppercase tracking-widest transition-opacity", !annual ? "opacity-100" : "opacity-30")}>Mensual</span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative w-14 h-7 rounded-full bg-zinc-100 border border-zinc-200 p-1 flex items-center transition-all"
            >
              <motion.div 
                animate={{ x: annual ? 28 : 0 }}
                className="w-5 h-5 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
              />
            </button>
            <span className={cn("text-xs font-black uppercase tracking-widest transition-opacity flex items-center gap-2", annual ? "opacity-100" : "opacity-30")}>
              Anual 
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] border border-emerald-500/30">
                -20% OFF
              </span>
            </span>
          </div>

          {/* ── Plans Grid ─────────────────────────────────────────────────── */}
          <section className="px-6 mb-32">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PLANS.map((plan, idx) => {
                const isPopular = plan.badge === "Más popular";
                const displayPrice = annual ? Math.round(plan.price * 0.8) : plan.price;
                const Icon = plan.icon;
                
                return (
                  <motion.div
                    key={plan.key}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -8 }}
                    className={cn(
                      "relative group rounded-[2.5rem] border p-8 flex flex-col transition-all duration-500 overflow-hidden",
                      isPopular 
                        ? "bg-zinc-50 border-primary/40 shadow-[0_30px_100px_-20px_rgba(168,85,247,0.15)]" 
                        : "bg-zinc-50 border-zinc-200"
                    )}
                  >
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `radial-gradient(circle at top right, ${plan.glow || 'rgba(255,255,255,0.05)'}, transparent 70%)` }} />

                    {plan.badge && (
                      <div className="absolute top-4 right-6 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest">
                        {plan.badge}
                      </div>
                    )}

                    <div className="mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-6 border border-zinc-200 group-hover:border-zinc-300 transition-colors">
                        <Icon className="h-6 w-6" style={{ color: plan.color }} />
                      </div>
                      <h3 className="text-2xl font-black uppercase font-display mb-1">{plan.name}</h3>
                      <p className="text-zinc-400 text-xs leading-relaxed">{plan.description}</p>
                    </div>

                    <div className="mb-8 overflow-hidden">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black font-display tracking-tighter">
                          ${displayPrice.toLocaleString('es-CO')}
                        </span>
                        <span className="text-zinc-300 text-xs font-bold uppercase tracking-widest">COP</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 py-1.5 px-3 rounded-xl bg-zinc-100 border border-zinc-200 w-fit">
                        <Coins className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-black" style={{ color: plan.color }}>{plan.creditsLabel}</span>
                      </div>
                    </div>

                    <ul className="space-y-4 mb-10 flex-1">
                      {plan.features.map(f => (
                        <li key={f.label} className="flex gap-3 items-start">
                          <Check className={cn("h-4 w-4 shrink-0 mt-0.5", f.highlight ? "text-primary" : "text-zinc-300")} />
                          <span className={cn("text-xs leading-relaxed", f.highlight ? "text-zinc-700 font-bold" : "text-zinc-400")}>
                            {f.label}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleBoldAction(plan.key)}
                      disabled={loadingAction === plan.key}
                      className={cn(
                        "w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group/btn",
                        isPopular ? "bg-primary text-white" : "bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-100"
                      )}
                    >
                      {loadingAction === plan.key ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Empezar Ahora <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ── Comparación con la Industria ───────────────────────────────── */}
          <section className="px-6 mb-40">
            <SectionHeader 
              badge="Eficiencia Industrial" 
              title={<>Ahorro <span className="text-primary">Real.</span></>}
              subtitle="Nuestro modelo distribuido elimina los costos fijos de servidores, pasando el ahorro directamente a tu saldo."
            />
            
            <div className="max-w-4xl mx-auto rounded-[3rem] bg-zinc-50 border border-zinc-200 p-4 sm:p-12 overflow-hidden relative">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                <div className="hidden sm:block text-xs font-black uppercase text-zinc-300 tracking-widest mt-4">Característica</div>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase">
                    Creator IA Pro
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-black text-zinc-400 uppercase">
                    Modelos Tradicionales
                  </div>
                </div>

                {COMPARISON_DATA.map((row, idx) => (
                  <React.Fragment key={row.feature}>
                    <div className="hidden sm:block py-4 border-t border-zinc-200 text-xs font-bold text-zinc-500">{row.feature}</div>
                    <div className="py-4 border-t border-zinc-200 text-center text-xs font-black text-zinc-900">{row.creator}</div>
                    <div className="py-4 border-t border-zinc-200 text-center text-xs font-medium text-zinc-400">{row.others}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>

          {/* ── Calculadora de Consumo ─────────────────────────────────────── */}
          <section className="px-6 mb-40">
            <div className="max-w-3xl mx-auto rounded-[3.5rem] bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 p-10 md:p-16 text-center overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
              
              <Zap className="h-10 w-10 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-black uppercase font-display mb-8">Calculadora de Consumo</h2>
              
              <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-black uppercase text-zinc-400 tracking-widest">Uso estimado</span>
                  <span className="text-2xl font-black text-primary font-display">{estimateSlider} créditos</span>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="10000" 
                  step="100"
                  value={estimateSlider}
                  onChange={(e) => setEstimateSlider(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-4 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                  <span>Light (Básico)</span>
                  <span>Industrial (Alto)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                <div className="p-4 rounded-3xl bg-zinc-100 border border-zinc-200">
                  <Globe className="h-4 w-4 text-zinc-400 mx-auto mb-2" />
                  <div className="text-lg font-black text-zinc-700">{(estimateSlider / 10).toFixed(0)}</div>
                  <div className="text-[9px] font-black uppercase text-zinc-400">Tokens ECO</div>
                </div>
                <div className="p-4 rounded-3xl bg-zinc-100 border border-zinc-200">
                  <Cpu className="h-4 w-4 text-zinc-400 mx-auto mb-2" />
                  <div className="text-lg font-black text-zinc-700">{(estimateSlider / 100).toFixed(0)}</div>
                  <div className="text-[9px] font-black uppercase text-zinc-400">Prompts ULTRA</div>
                </div>
                <div className="p-4 rounded-3xl bg-zinc-100 border border-zinc-200 col-span-2 md:col-span-1">
                  <Code2 className="h-4 w-4 text-zinc-400 mx-auto mb-2" />
                  <div className="text-lg font-black text-zinc-700">{(estimateSlider / 50).toFixed(0)}</div>
                  <div className="text-[9px] font-black uppercase text-zinc-400">UI Screens</div>
                </div>
              </div>

              <button 
                onClick={() => document.getElementById('credit-packs-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary/90 hover:scale-105 transition-transform font-bold"
              >
                Recargar Créditos Ahora <Bolt className="h-4 w-4 fill-current" />
              </button>
            </div>
          </section>

          {/* ── Packs de Créditos ─────────────────────────────────────────── */}
          {CREDIT_PACKS && CREDIT_PACKS.length > 0 && (
            <section id="credit-packs-section" className="px-6 mb-40">
              <SectionHeader 
                badge="Recargas Top-up" 
                title="Créditos Extra."
                subtitle="Sin vencimiento. Úsalos cuando los necesites con la flexibilidad total de Bold.co."
              />
              <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-6">
                {CREDIT_PACKS.map((pack) => {
                  const isLoadingThis = loadingAction === pack.id;
                  return (
                    <motion.div
                      key={pack.id}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "relative rounded-3xl border p-8 flex flex-col gap-6 transition-all bg-zinc-50",
                        pack.popular ? "border-primary/40 bg-primary/5 shadow-2xl" : "border-zinc-200"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                          <Coins className="h-5 w-5 text-primary" />
                        </div>
                        {pack.popular && (
                          <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-widest">Popular</span>
                        )}
                      </div>
                      <div>
                        <div className="text-4xl font-black font-display mb-1">{pack.credits_amount.toLocaleString()}</div>
                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Créditos</div>
                      </div>
                      <div className="text-2xl font-black text-zinc-800 font-display">${pack.price}</div>
                      <button
                        onClick={() => handleBoldAction(pack.id)}
                        disabled={isLoadingThis}
                        className={cn(
                          "w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                          pack.popular ? "bg-primary text-white hover:bg-primary/90" : "bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200"
                        )}
                      >
                        {isLoadingThis ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Comprar Pack"}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Testimonios ────────────────────────────────────────────────── */}
          <section className="px-6 mb-40">
            <SectionHeader 
              badge="Proof of Quality" 
              title="Testimonios."
              subtitle="Líderes de industria que han industrializado sus flujos creativos con Creator IA Pro."
            />
            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t, i) => (
                <motion.div 
                  key={t.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-[2.5rem] bg-zinc-50 border border-zinc-200 relative"
                >
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-3 w-3 fill-primary text-primary" />)}
                  </div>
                  <p className="text-[14px] text-zinc-500 leading-relaxed italic mb-8">"{t.content}"</p>
                  <div className="flex items-center gap-4">
                    <img src={t.avatar} className="w-10 h-10 rounded-2xl border border-zinc-200" alt={t.name} />
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-zinc-900">{t.name}</div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── Trust Grid ─────────────────────────────────────────────────── */}
          <section className="px-6 max-w-5xl mx-auto mb-20 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: "Seguridad Bold" },
              { icon: Lock, label: "AES-256 Encryption" },
              { icon: TrendingUp, label: "99.9% Uptime" },
              { icon: MessageSquare, label: "Soporte Latam" },
            ].map(t => (
              <div key={t.label} className="p-6 rounded-[2rem] bg-zinc-50 border border-zinc-200 flex flex-col items-center gap-4 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all cursor-default group">
                <t.icon className="h-6 w-6 group-hover:text-primary transition-colors" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center">{t.label}</span>
              </div>
            ))}
          </section>

        </main>
      </div>
    </>
  );
}
