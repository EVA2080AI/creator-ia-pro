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
  TrendingUp, Globe, Lock, Cpu, Star, MessageSquare,
  HelpCircle, ChevronDown, ChevronUp, Layers,
  Layout, MousePointer2, Database, Network
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const PLANS = [
  {
    key: "free" as const,
    name: "Free",
    price: 0,
    priceLabel: "$0",
    credits: 5,
    creditsLabel: "5 créditos de por vida",
    description: "Para explorar el potencial de la IA sin compromiso.",
    color: "#64748B",
    gradient: "from-slate-500/10 to-slate-500/5",
    border: "border-slate-200",
    icon: Zap,
    badge: "Para empezar",
    features: [
      { label: "5 créditos totales", highlight: true },
      { label: "Studio creativo básico", highlight: true },
      { label: "Acceso a modelos estándar", highlight: false },
      { label: "Soporte comunitario", highlight: false },
    ],
  },
  {
    key: "creador" as const,
    name: "Creador",
    price: 149900,
    priceLabel: "$149.900",
    credits: 1000,
    creditsLabel: "1.000 créditos al mes",
    description: "Todo lo que necesitas para empezar a crear contenido con IA.",
    color: "#94A3B8",
    gradient: "from-zinc-500/10 to-zinc-500/5",
    border: "border-zinc-200",
    icon: Sparkles,
    badge: null,
    features: [
      { label: "1.000 créditos mensuales", highlight: true },
      { label: "Studio creativo con IA", highlight: true },
      { label: "Acceso a modelos rápidos (ilimitado)", highlight: false },
      { label: "Soporte por chat", highlight: false },
    ],
  },
  {
    key: "pro" as const,
    name: "Pro",
    price: 349900,
    priceLabel: "$349.900",
    credits: 3000,
    creditsLabel: "3.000 créditos al mes",
    description: "Para creadores que publican a diario y quieren más potencia.",
    color: "#6366F1",
    gradient: "from-indigo-500/15 to-indigo-500/5",
    border: "border-indigo-500/20",
    glow: "rgba(99, 102, 241, 0.15)",
    icon: Layout,
    badge: "Más popular",
    features: [
      { label: "3.000 créditos mensuales", highlight: true },
      { label: "Modelos premium de IA (GPT-4, Claude)", highlight: true },
      { label: "Generación prioritaria (más rápido)", highlight: true },
      { label: "Múltiples chats de IA simultáneos", highlight: false },
      { label: "Soporte prioritario", highlight: false },
    ],
  },
  {
    key: "agencia" as const,
    name: "Agencia",
    price: 699900,
    priceLabel: "$699.900",
    credits: 8000,
    creditsLabel: "8.000 créditos al mes",
    description: "Ideal para agencias y equipos que crean contenido en escala.",
    color: "#F59E0B",
    gradient: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/30",
    glow: "rgba(245, 158, 11, 0.25)",
    icon: Crown,
    badge: "Acceso total",
    features: [
      { label: "8.000 créditos mensuales", highlight: true },
      { label: "Suite completa: texto, imágenes y código", highlight: true },
      { label: "Acceso a todos los modelos de IA", highlight: true },
      { label: "Soporte prioritario 24/7", highlight: true },
      { label: "Facturación directa", highlight: false },
    ],
  },
  {
    key: "pyme" as const,
    name: "Pyme",
    price: 1499900,
    priceLabel: "$1.499.900",
    credits: 20000,
    creditsLabel: "20.000 créditos al mes",
    description: "Para negocios que necesitan IA a escala sin límites.",
    color: "#10B981",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/30",
    glow: "rgba(16, 185, 129, 0.2)",
    icon: Rocket,
    badge: "Para negocios",
    features: [
      { label: "20.000 créditos mensuales", highlight: true },
      { label: "Todo lo del plan Agencia", highlight: true },
      { label: "Usuarios adicionales del equipo", highlight: true },
      { label: "Integraciones y API disponibles", highlight: true },
      { label: "Gerente de cuenta dedicado", highlight: false },
    ],
  },
  {
    key: "empresarial" as const,
    name: "Empresarial",
    price: 0,
    priceLabel: "A medida",
    credits: 0,
    creditsLabel: "Créditos personalizados",
    description: "Solución personalizada para grandes organizaciones.",
    color: "#A855F7",
    gradient: "from-purple-500/10 to-purple-500/5",
    border: "border-purple-500/20",
    glow: "rgba(168, 85, 247, 0.15)",
    icon: Network,
    badge: null,
    isContact: true,
    features: [
      { label: "Volumen de créditos a la medida", highlight: true },
      { label: "Infraestructura dedicada", highlight: true },
      { label: "SLA personalizado y soporte enterprise", highlight: true },
      { label: "Integración con tus herramientas actuales", highlight: false },
      { label: "Facturación corporativa y NIT", highlight: false },
    ],
  },
];

const FAQS = [
  {
    question: "¿Qué es un crédito y cómo se usa?",
    answer: "Un crédito es la unidad de medida de Creator IA Pro. Cada vez que generas texto, imágenes o código, el sistema descuenta una cantidad según la tarea y el modelo que elijas. Los modelos más rápidos consumen menos; los más avanzados (como GPT-4 o Claude) consumen un poco más."
  },
  {
    question: "¿Cuándo se renuevan mis créditos?",
    answer: "Los créditos de tu plan mensual se renuevan automáticamente al inicio de cada mes. Si compras una recarga adicional, esos créditos se acreditan de inmediato y no vencen nunca."
  },
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer: "Sí, sin compromisos ni penalizaciones. Puedes cancelar o cambiar de plan desde Configuración en cualquier momento. No hay contratos mínimos."
  },
  {
    question: "¿Qué pasa si se me acaban los créditos?",
    answer: "Tu cuenta entra en modo de sólo lectura para proteger tu trabajo. Puedes reactivarla comprando una recarga de créditos en cualquier momento, que se aplica al instante vía Bold.co."
  },
  {
    question: "¿Cómo funciona el pago con Bold?",
    answer: "Bold.co es la plataforma de pagos líder en Colombia. Puedes pagar con tarjeta débito, crédito o PSE en pesos colombianos (COP), sin necesidad de dólares ni cuentas internacionales."
  }
];

const COMPARISON_DATA = [
  { feature: "Costo de uso", creator: "Pago por uso real", others: "Tarifa fija aunque no uses" },
  { feature: "Modelos de IA", creator: "Cambia con 1 clic", others: "Bloqueado a un proveedor" },
  { feature: "Studio creativo", creator: "Incluido", others: "Suscripción adicional" },
  { feature: "Forma de pago", creator: "Bold en COP (local)", others: "Dólares + tarifa internacional" },
];

const TESTIMONIALS = [
  {
    name: "Carlos Rivera",
    role: "Creador de contenido digital",
    content: "Pagar en COP con Bold fue un alivio total. Ya no necesito tarjeta en dólares para usar IA de calidad. Creo el doble de contenido en la mitad del tiempo.",
    avatar: "https://i.pravatar.cc/150?u=carlos",
  },
  {
    name: "Elena Gómez",
    role: "Diseñadora y directora creativa",
    content: "El plan Pro vale cada peso. Genero piezas para mis clientes en minutos y los modelos de imagen son increíbles. Mis entregas mejoraron notablemente.",
    avatar: "https://i.pravatar.cc/150?u=elena",
  },
  {
    name: "Mario Duarte",
    role: "Fundador de agencia de marketing",
    content: "Con el plan Agencia, todo mi equipo trabaja en el mismo Studio. Generamos campañas completas (textos + imágenes + estrategia) en horas, no días.",
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
        <title>Planes y Precios — Creator IA Pro (Desde $0)</title>
        <meta name="description" content="6 planes flexibles: Free, Creador ($149.900), Pro ($349.900), Agencia ($699.900), Pyme y Empresarial. Paga en pesos colombianos con Bold." />
        <meta name="keywords" content="precios IA, planes GPT-4, Bold Colombia, créditos IA, suscripción IA" />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://creator-ia.com/pricing" />
        <meta property="og:title" content="Planes y Precios — Creator IA Pro" />
        <meta property="og:description" content="6 planes desde $0. Paga en pesos colombianos con Bold. GPT-4, Claude, Gemini incluidos." />
        <meta property="og:image" content="https://creator-ia.com/og-pricing.jpg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Planes y Precios — Creator IA Pro" />
        <meta property="twitter:description" content="6 planes desde $0. Paga en COP con Bold." />
        <meta property="twitter:image" content="https://creator-ia.com/og-pricing.jpg" />

        <link rel="canonical" href="https://creator-ia.com/pricing" />
      </Helmet>

      <div className="h-full bg-background selection:bg-primary/15 relative overflow-x-hidden">
        <MeshGradient />
        <LandingHeader />

        <div className="pt-20 lg:pt-32 pb-40 relative z-10">
          
          {/* ── Hero ────────────────────────────────────────────────────────── */}
          <section className="relative px-6 mb-24 overflow-visible">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-5xl mx-auto text-center"
            >
              <h1 className="text-6xl sm:text-8xl md:text-[8rem] font-black tracking-[-0.05em] uppercase font-display leading-[0.85] mb-8 text-zinc-900">
                Crea más,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-purple-300 italic">paga menos.</span>
              </h1>
              <p className="max-w-xl mx-auto text-lg text-zinc-400 leading-relaxed font-medium mb-12">
                Crea contenido de calidad profesional con la IA más avanzada. Paga sólo lo que usas, cuando lo usas, en pesos colombianos con{" "}
                <span className="text-zinc-900 border-b-2 border-primary/20">Bold.co</span>.
              </p>

              {/* Credit Bar Illustrative */}
              <div className="max-w-md mx-auto p-4 rounded-[1.5rem] bg-white border border-zinc-100 shadow-xl mb-12">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-left">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Ejemplo de Uso</p>
                    <p className="text-[12px] font-bold text-zinc-900">Créditos del Proyecto</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-black text-primary italic">120 / 150</p>
                  </div>
                </div>
                <div className="h-4 w-full bg-zinc-50 rounded-full border border-zinc-100 overflow-hidden p-1">
                  <div className="h-full w-[80%] rounded-full bg-gradient-to-r from-primary via-indigo-400 to-primary animate-pulse" />
                </div>
              </div>
            </motion.div>
          </section>

          {/* Annual badge — coming soon */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Facturación mensual</span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold uppercase tracking-wide">Anual con descuento — Próximamente</span>
          </div>

          <section className="px-6 mb-32">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {PLANS.map((plan, idx) => {
                const isPopular = plan.badge === "Más popular";
                const displayPrice = plan.price;
                const Icon = plan.icon;
                const isContact = 'isContact' in plan && plan.isContact;
                
                return (
                  <motion.div
                    key={plan.key}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08 }}
                    whileHover={{ y: -6 }}
                    className={cn(
                      "relative group rounded-[2rem] border p-6 flex flex-col transition-all duration-500 overflow-hidden",
                      isPopular 
                        ? "bg-zinc-50 border-primary/40 shadow-[0_20px_80px_-15px_rgba(168,85,247,0.15)]" 
                        : isContact
                        ? "bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20"
                        : "bg-zinc-50 border-zinc-200"
                    )}
                  >
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `radial-gradient(circle at top right, ${'glow' in plan ? plan.glow : 'rgba(255,255,255,0.05)'}, transparent 70%)` }} />

                    {plan.badge && (
                      <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-widest">
                        {plan.badge}
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mb-5 border border-zinc-200 group-hover:border-zinc-300 transition-colors">
                        <Icon className="h-5 w-5" style={{ color: plan.color }} />
                      </div>
                      <h3 className="text-xl font-black uppercase font-display mb-1">{plan.name}</h3>
                      <p className="text-zinc-400 text-xs leading-relaxed">{plan.description}</p>
                    </div>

                    <div className="py-6 relative">
                      {isContact ? (
                        <div>
                          <span className="text-3xl font-black font-display tracking-tighter">A medida</span>
                          <p className="text-xs text-zinc-400 mt-1">Precio según tu volumen</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black font-display tracking-tighter">
                              ${displayPrice.toLocaleString('es-CO')}
                            </span>
                            <span className="text-zinc-300 text-xs font-bold uppercase tracking-widest">COP/mes</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 py-1 px-2.5 rounded-lg bg-zinc-100 border border-zinc-200 w-fit">
                            <Coins className="h-3 w-3 text-primary" />
                            <span className="text-[11px] font-bold" style={{ color: plan.color }}>{plan.creditsLabel}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map(f => (
                        <li key={f.label} className="flex gap-2.5 items-start">
                          <Check className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", f.highlight ? "text-primary" : "text-zinc-300")} />
                          <span className={cn("text-xs leading-relaxed", f.highlight ? "text-zinc-700 font-semibold" : "text-zinc-400")}>
                            {f.label}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {isContact ? (
                      <a
                        href="mailto:hola@creator-ia.com?subject=Plan Empresarial Creator IA Pro"
                        className="w-full py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2"
                      >
                        Contactar representante <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <button
                        onClick={() => handleBoldAction(plan.key)}
                        disabled={loadingAction === plan.key}
                        className={cn(
                          "w-full py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all relative overflow-hidden group/btn",
                          isPopular ? "bg-primary text-white hover:bg-primary/90" : "bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200"
                        )}
                      >
                        {loadingAction === plan.key ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Empezar ahora <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                          </span>
                        )}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section className="px-6 mb-40">
            <SectionHeader 
              badge="Por qué elegirnos" 
              title={<>Ventajas <span className="text-primary">reales.</span></>}
              subtitle="Diseñado para creadores latinoamericanos. Sin dólares, sin costos ocultos."
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
              <h2 className="text-3xl font-black uppercase font-display mb-8">¿Cuántos créditos necesito?</h2>
              
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
                  <span>Uso casual</span>
                  <span>Uso profesional</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                <div className="p-4 rounded-3xl bg-zinc-100 border border-zinc-200">
                  <Globe className="h-4 w-4 text-zinc-400 mx-auto mb-2" />
                  <div className="text-lg font-black text-zinc-700">{(estimateSlider / 10).toFixed(0)}</div>
                  <div className="text-[9px] font-black uppercase text-zinc-400">Posts de texto</div>
                </div>
                <div className="p-4 rounded-3xl bg-zinc-100 border border-zinc-200">
                  <Cpu className="h-4 w-4 text-zinc-400 mx-auto mb-2" />
                  <div className="text-lg font-black text-zinc-700">{(estimateSlider / 100).toFixed(0)}</div>
                  <div className="text-[9px] font-black uppercase text-zinc-400">Imágenes generadas</div>
                </div>
                <div className="p-4 rounded-3xl bg-zinc-100 border border-zinc-200 col-span-2 md:col-span-1">
                  <Code2 className="h-4 w-4 text-zinc-400 mx-auto mb-2" />
                  <div className="text-lg font-black text-zinc-700">{(estimateSlider / 50).toFixed(0)}</div>
                  <div className="text-[9px] font-black uppercase text-zinc-400">Guiones de video</div>
                </div>
              </div>

              <button 
                onClick={() => document.getElementById('credit-packs-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary/90 hover:scale-105 transition-transform font-bold"
              >
                Ver recargas de créditos <Bolt className="h-4 w-4 fill-current" />
              </button>
            </div>
          </section>

          {/* ── Packs de Créditos ─────────────────────────────────────────── */}
          {CREDIT_PACKS && CREDIT_PACKS.length > 0 && (
            <section id="credit-packs-section" className="px-6 mb-40">
              <SectionHeader 
              badge="Recargas adicionales" 
              title="Créditos extra."
              subtitle="Sin vencimiento. Cómpralos cuando los necesites y úsalos a tu ritmo."
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
              badge="Lo dicen nuestros creadores" 
              title="Testimonios."
              subtitle="Personas reales que ya crean contenido increíble con Creator IA Pro."
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

          {/* ── FAQ Section ───────────────────────────────────────────────── */}
          <section className="px-6 mb-40">
            <SectionHeader 
              badge="FAQ" 
              title={<>Preguntas <span className="text-primary italic">frecuentes.</span></>}
              subtitle="Todo lo que necesitas saber antes de empezar."
            />
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-4">
                {FAQS.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border border-zinc-100 rounded-3xl px-6 bg-white shadow-sm overflow-hidden transition-all hover:border-zinc-200">
                    <AccordionTrigger className="text-xs font-black uppercase tracking-widest text-zinc-900 hover:no-underline py-6">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-[13px] text-zinc-500 leading-relaxed pb-6">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          <section className="px-6 max-w-5xl mx-auto mb-20 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: "Pago seguro con Bold" },
              { icon: Lock, label: "Datos protegidos" },
              { icon: TrendingUp, label: "99.9% disponibilidad" },
              { icon: MessageSquare, label: "Soporte en español" },
            ].map(t => (
              <div key={t.label} className="p-6 rounded-[2rem] bg-zinc-50 border border-zinc-200 flex flex-col items-center gap-4 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all cursor-default group">
                <t.icon className="h-6 w-6 group-hover:text-primary transition-colors" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center">{t.label}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
