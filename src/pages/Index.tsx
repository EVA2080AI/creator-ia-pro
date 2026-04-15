/**
 * Creator IA Pro — Landing Page
 * Motion-enhanced with Framer Motion: staggered entrances, floating mockup,
 * animated aurora, scroll-triggered reveals, marquee ticker, and hover lifts.
 */
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight, Code2, Image, Zap,
  CheckCircle2, Layers, MessageSquare, Video,
  Star, Shield, Users, ChevronRight, Sparkles, Wand2, Check
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { LandingHeader } from "@/components/layout/LandingHeader";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  AnimatePresence,
  Variants,
} from "framer-motion";

// ─── Data ─────────────────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    badge: "Genesis IA",
    headline: "Crea apps y sitios web en segundos.",
    sub: "Describe tu app o sitio web y Genesis lo construye completo: React, TypeScript, Tailwind, APIs y más. Previsualización en tiempo real, push a GitHub integrado.",
    icon: Code2,
    color: "#4ADE80",
    cta: "Probar Genesis IA →",
    path: "/chat",
    features: ["Apps React + TypeScript", "Sitios web completos", "Preview instantáneo", "Claude 4.6 Sonnet"],
    preview: [
      { label: "App.tsx", lines: 42, active: true },
      { label: "components/Hero.tsx", lines: 28, active: false },
      { label: "styles.css", lines: 16, active: false },
    ],
  },
  {
    badge: "Studio",
    headline: "Crea imágenes y textos con IA.",
    sub: "8 herramientas de imagen (genera, mejora, upscale, quita fondo, restaura…) y 4 de texto (copy, SEO, redes, ads). Todo inline, sin salir del workspace.",
    icon: Image,
    color: "#00C2FF",
    cta: "Abrir Studio →",
    path: "/studio",
    features: ["FLUX Pro + SDXL", "Upscale 4K", "Streaming de texto", "Guarda en biblioteca"],
    preview: [
      { tool: "Crear imagen", cr: 2, color: "#a855f7" },
      { tool: "Diseñar logo",  cr: 3, color: "#00c2ff" },
      { tool: "Quitar fondo",  cr: 1, color: "#34d399" },
      { tool: "Copywriting",   cr: 1, color: "#f43f5e" },
    ],
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    per: "/mes",
    credits: "5 créditos",
    color: "#64748B",
    description: "Para explorar el potencial de la IA",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop",
    features: ["Genesis IDE básico", "5 créditos totales", "Modelos estándar", "Soporte comunitario"]
  },
  {
    name: "Creador",
    price: "$149.900",
    per: "/mes",
    credits: "1.000 créditos",
    color: "#94A3B8",
    description: "Todo lo que necesitas para empezar",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop",
    features: ["Genesis IDE completo", "Studio creativo", "1.000 créditos/mes", "Soporte por chat"]
  },
  {
    name: "Pro",
    price: "$349.900",
    per: "/mes",
    credits: "3.000 créditos",
    color: "#6366F1",
    popular: true,
    description: "Para creadores que publican a diario",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    features: ["Modelos premium (GPT-4, Claude)", "3.000 créditos/mes", "Generación prioritaria", "Soporte prioritario"]
  },
  {
    name: "Agencia",
    price: "$699.900",
    per: "/mes",
    credits: "8.000 créditos",
    color: "#F59E0B",
    description: "Ideal para equipos que crean en escala",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop",
    features: ["Suite completa de IA", "8.000 créditos/mes", "Soporte 24/7", "Facturación directa"]
  },
  {
    name: "Pyme",
    price: "$1.499.900",
    per: "/mes",
    credits: "20.000 créditos",
    color: "#10B981",
    description: "IA a escala sin límites para negocios",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=400&fit=crop",
    features: ["20.000 créditos/mes", "Usuarios del equipo", "Integraciones API", "Gerente de cuenta"]
  },
  {
    name: "Empresarial",
    price: "A medida",
    per: "",
    credits: "Créditos ilimitados",
    color: "#A855F7",
    description: "Solución personalizada para grandes organizaciones",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop",
    isContact: true,
    features: ["Volumen personalizado", "Infraestructura dedicada", "SLA garantizado", "Soporte enterprise"]
  },
];

const TRUST = [
  { icon: Shield,  text: "SSL + datos seguros",     sub: "Supabase + Vercel Edge" },
  { icon: Zap,     text: "Generación en <30s",      sub: "99.5% uptime" },
  { icon: Users,   text: "Sin tarjeta para empezar", sub: "Plan gratuito disponible" },
  { icon: Star,    text: "Modelos top del mundo",    sub: "Claude · GPT-4o · FLUX" },
];

// ─── Stats ───────────────────────────────────────────────────────────────────
const STATS = [
  { value: "50K+", label: "Apps generadas", icon: Code2 },
  { value: "2M+", label: "Imágenes creadas", icon: Image },
  { value: "99.5%", label: "Uptime garantizado", icon: Shield },
  { value: "4.9", label: "Rating promedio", icon: Star },
];

// ─── How it works ────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Describe tu idea",
    description: "Escribe en lenguaje natural lo que quieres crear. Un sitio web, una app, una imagen...",
    color: "#a855f7",
    icon: MessageSquare,
  },
  {
    step: "02",
    title: "IA genera el código",
    description: "Genesis IDE construye tu proyecto completo con React, TypeScript y Tailwind en segundos.",
    color: "#6366f1",
    icon: Code2,
  },
  {
    step: "03",
    title: "Previsualiza y ajusta",
    description: "Ve tu proyecto en tiempo real. Solicita cambios, agrega features o refactoriza.",
    color: "#10b981",
    icon: Layers,
  },
  {
    step: "04",
    title: "Publica y exporta",
    description: "Descarga tu código, push a GitHub o despliega en un click. Tú tienes el control total.",
    color: "#f59e0b",
    icon: Zap,
  },
];

// ─── Testimonials ────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "María García",
    role: "Diseñadora UX",
    company: "Agencia Digital MX",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    content: "Genesis IDE me ahorra horas de trabajo. Puedo prototipar una idea en minutos y mostrarla al cliente. Es impresionante.",
    rating: 5,
  },
  {
    name: "Carlos Ruiz",
    role: "Founder",
    company: "TechStart",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    content: "Lancé mi MVP en una semana gracias a Creator IA. Lo que antes tardaba meses, ahora lo hago en días.",
    rating: 5,
  },
  {
    name: "Ana Martínez",
    role: "Marketing Lead",
    company: "GrowthLab",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    content: "Studio es mi herramienta secreta para crear contenido. Las imágenes que genera son de nivel profesional.",
    rating: 5,
  },
  {
    name: "Diego Soto",
    role: "Desarrollador Fullstack",
    company: "Freelance",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    content: "La calidad del código que genera es sorprendente. TypeScript limpio, buenas prácticas, estructura profesional.",
    rating: 5,
  },
];

const MARQUEE_ITEMS = [
  { icon: Sparkles, label: "Claude 4.6 Opus" },
  { icon: Wand2,    label: "FLUX Pro Ultra" },
  { icon: Code2,    label: "Genesis IDE" },
  { icon: Image,    label: "Upscale 4K" },
  { icon: Layers,   label: "Canvas Editor" },
  { icon: MessageSquare, label: "GPT-4o" },
  { icon: Video,    label: "Video IA" },
  { icon: Zap,      label: "Generación <30s" },
  { icon: Star,     label: "SDXL Turbo" },
  { icon: Shield,   label: "E2E Encrypted" },
];

// ─── Motion variants ───────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (delay: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: (delay: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut", delay },
  }),
};

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardEntrance: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Reusable animated section wrapper ────────────────────────────────────────
function InViewSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Product deep-dive section (needs its own hooks) ──────────────────────────
function ProductSection({ p, i, navigate }: { p: typeof PRODUCTS[0]; i: number; navigate: (path: string) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });
  return (
    <section
      ref={sectionRef}
      className={`px-6 md:px-12 py-20 border-t border-zinc-200 ${i % 2 === 1 ? 'bg-zinc-50' : ''}`}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: i % 2 === 1 ? 40 : -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className={`flex-1 ${i % 2 === 1 ? 'md:order-2' : ''}`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.3em] mb-6"
            style={{ borderColor: p.color + '40', color: p.color, background: p.color + '10' }}>
            <p.icon className="h-3 w-3" />
            {p.badge}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight mb-4 leading-tight">
            {p.headline}
          </h2>
          <p className="text-[15px] text-zinc-400 leading-relaxed mb-6 max-w-md">
            {p.sub}
          </p>
          <ul className="flex flex-col gap-2 mb-8">
            {p.features.map((f, fi) => (
              <motion.li
                key={f}
                initial={{ opacity: 0, x: -10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 + fi * 0.08, duration: 0.4 }}
                className="flex items-center gap-2.5 text-[13px] text-zinc-500"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: p.color }} />
                {f}
              </motion.li>
            ))}
          </ul>
          <motion.button
            onClick={() => navigate(p.path)}
            whileHover={{ x: 4 }}
            className="flex items-center gap-2 text-[13px] font-bold transition-colors group"
            style={{ color: p.color }}
          >
            {p.cta}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </motion.button>
        </motion.div>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, x: i % 2 === 1 ? -40 : 40, scale: 0.96 }}
          animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          whileHover={{ y: -4 }}
          className={`flex-1 ${i % 2 === 1 ? 'md:order-1' : ''}`}
        >
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-md shadow-zinc-100">
            {i === 0 ? (
              /* Genesis preview */
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1">
                    {(p.preview as any[]).map((f: any) => (
                      <div key={f.label} className={`px-2 py-1 rounded text-[8px] font-bold ${f.active ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500'}`}>{f.label}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-zinc-950 p-4 font-mono text-[10px] leading-relaxed">
                  <span className="text-blue-400">import</span>{" "}
                  <span className="text-zinc-300">{'{'} useState {'}'}</span>{" "}
                  <span className="text-blue-400">from</span>{" "}
                  <span className="text-orange-300">'react'</span>
                  <br /><br />
                  <span className="text-blue-400">export default function</span>{" "}
                  <span className="text-yellow-300">App</span>
                  <span className="text-zinc-400">() {"{"}</span>
                  <br />
                  {"  "}<span className="text-blue-400">return</span>{" "}
                  <span className="text-zinc-400">{"("}</span>
                  <br />
                  {"    "}<span className="text-zinc-500">{"<div className="}</span>
                  <span className="text-orange-300">"hero"</span>
                  <span className="text-zinc-500">{">"}</span>
                  <br />
                  {"      "}<span className="text-zinc-500">{"<h1>"}</span>
                  <span className="text-zinc-300">Mi App con IA</span>
                  <span className="text-zinc-500">{"</h1>"}</span>
                  <br />
                  {"    "}<span className="text-zinc-500">{"</div>"}</span>
                  <br />
                  {"  "}<span className="text-zinc-400">{")"}</span>
                  <br />
                  <span className="text-zinc-400">{"}"}</span>
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1.1 }}
                    className="inline-block w-1 h-3 bg-primary ml-0.5 align-middle"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-bold text-primary">Claude 4.6</span>
                  </div>
                  <span className="text-[9px] text-zinc-500">Generando App.tsx…</span>
                </div>
              </div>
            ) : (
              /* Studio preview */
              <div className="p-5">
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Herramientas disponibles</div>
                <div className="grid grid-cols-2 gap-2">
                  {(p.preview as any[]).map((t: any, ti: number) => (
                    <motion.div
                      key={t.tool}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={inView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.3 + ti * 0.1, duration: 0.4 }}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 bg-zinc-50"
                    >
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: t.color + '20' }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: t.color + '80' }} />
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-zinc-600">{t.tool}</div>
                        <div className="text-[8px] text-zinc-500">{t.cr} crédito{t.cr > 1 ? 's' : ''}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-3 w-full h-24 rounded-xl bg-gradient-to-br from-violet-50 via-zinc-50 to-cyan-50 border border-zinc-200 flex items-center justify-center">
                  <span className="text-[10px] text-zinc-500">Preview en tiempo real</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Index() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const mockupY = useTransform(scrollY, [0, 400], [0, -40]);
  const mockupScale = useTransform(scrollY, [0, 400], [1, 0.96]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Creator IA Pro — Genesis IDE + Studio de IA</title>
        <meta name="description" content="Genera apps React completas con Genesis IDE y crea imágenes, logos y textos con Studio. Todo con IA. Desde $69.000 COP/mes." />
      </Helmet>

      <div className="min-h-screen bg-white text-foreground selection:bg-primary/20 font-sans overflow-x-hidden relative">
        <LandingHeader />

        <main className="pt-20 md:pt-32">

          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <section ref={heroRef} className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden">

            {/* ── Creative background ──────────────────────────────────── */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {/* Animated gradient orbs */}
              <motion.div
                animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
                className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full"
              />
              <motion.div
                animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 0.9, 1] }}
                transition={{ repeat: Infinity, duration: 25, ease: "easeInOut", delay: 5 }}
                className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-400/5 blur-[120px] rounded-full"
              />
              <motion.div
                animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
                transition={{ repeat: Infinity, duration: 18, ease: "easeInOut", delay: 8 }}
                className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-emerald-400/5 blur-[100px] rounded-full"
              />

              {/* Dot grid pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="hero-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#a855f7" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hero-dots)" />
              </svg>

              {/* Floating particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-primary/40"
                  style={{
                    left: `${10 + i * 12}%`,
                    top: `${20 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0.2, 0.6, 0.2],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4 + i,
                    delay: i * 0.5,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 max-w-6xl mx-auto">
              {/* Badge */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={0.1}
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-zinc-200/80 text-[11px] font-black text-zinc-500 uppercase tracking-[0.25em] mb-8 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)]"
              >
                <motion.span
                  animate={{ rotate: [0, 15, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                </motion.span>
                Genesis IDE · Studio · V21.0
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={0.2}
                className="text-[clamp(3rem,10vw,7rem)] font-black leading-[0.9] tracking-tighter text-zinc-900 mb-6"
              >
                <span className="block">Crea apps con</span>
                <span className="block bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  IA Generativa
                </span>
                <span className="block text-[clamp(1.5rem,4vw,3rem)] text-zinc-400 font-medium mt-2">
                  en segundos, no en días
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={0.35}
                className="text-[clamp(1rem,2vw,1.25rem)] text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-10"
              >
                Genesis IDE convierte tus ideas en apps React completas. Studio genera imágenes, logos y textos.
                <span className="text-zinc-900 font-semibold"> Todo en uno.</span>
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={0.45}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <motion.button
                  onClick={() => navigate("/auth")}
                  whileHover={{ scale: 1.03, boxShadow: "0 20px 40px -10px rgba(168,85,247,0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-zinc-900 to-zinc-800 text-white text-[15px] font-black hover:from-zinc-800 hover:to-zinc-700 transition-all shadow-xl"
                >
                  Comenzar gratis
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  onClick={() => navigate("/pricing")}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-8 py-4 rounded-full border border-zinc-200 text-zinc-600 text-[15px] font-bold hover:border-zinc-300 hover:text-zinc-900 hover:bg-zinc-50 transition-all"
                >
                  Ver planes
                </motion.button>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={0.55}
                className="flex flex-wrap items-center justify-center gap-6 mt-12"
              >
                {TRUST.map((t, idx) => (
                  <motion.div
                    key={t.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + idx * 0.08, duration: 0.4 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 border border-zinc-100"
                  >
                    <t.icon className="h-4 w-4 text-primary" />
                    <span className="text-[12px] text-zinc-600 font-medium">{t.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Avatars */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={0.65}
                className="flex items-center justify-center gap-4 mt-10"
              >
                <div className="flex -space-x-3">
                  {[
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
                  ].map((src, i) => (
                    <motion.img
                      key={i}
                      src={src}
                      alt=""
                      className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1, duration: 0.4 }}
                    />
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-500">+50,000 creadores confían en nosotros</p>
                </div>
              </motion.div>
            </div>
          </section>

          {/* ── Stats ───────────────────────────────────────────────────── */}
          <section className="relative py-16 bg-zinc-900 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="stats-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="#fff" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#stats-grid)" />
              </svg>
            </div>
            <div className="relative z-10 max-w-6xl mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                {STATS.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="text-center"
                  >
                    <div className="flex justify-center mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                        <stat.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <motion.div
                      className="text-4xl md:text-5xl font-black tracking-tight mb-1"
                      initial={{ scale: 0.5 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + 0.2, duration: 0.5, type: "spring" }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-[13px] text-zinc-400 font-medium">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Marquee ticker ───────────────────────────────────────────── */}
          <div className="relative overflow-hidden py-4 border-y border-zinc-100 bg-zinc-50/80">
            <div className="flex gap-0">
              {[0, 1].map((copy) => (
                <motion.div
                  key={copy}
                  animate={{ x: ["0%", "-100%"] }}
                  transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
                  className="flex shrink-0 gap-8 pr-8"
                >
                  {MARQUEE_ITEMS.map((item, i) => (
                    <div key={`${copy}-${i}`} className="flex items-center gap-2 text-zinc-500 whitespace-nowrap">
                      <item.icon className="h-3.5 w-3.5 text-primary/50" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{item.label}</span>
                      <span className="text-zinc-200 mx-2">·</span>
                    </div>
                  ))}
                </motion.div>
              ))}
            </div>
            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-zinc-50 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-zinc-50 to-transparent" />
          </div>

          {/* ── Product browser mockup ──────────────────────────────────── */}
          <section className="px-6 md:px-12 pb-20 pt-12">
            <motion.div
              style={{ y: mockupY, scale: mockupScale }}
              className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-zinc-200 shadow-lg shadow-zinc-100 bg-white"
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 bg-zinc-50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-3 h-5 rounded bg-zinc-50 flex items-center px-2.5 gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  <span className="text-[10px] text-zinc-500 font-mono">creator-ia.com/studio</span>
                </div>
              </div>

              {/* App preview — Studio 2-panel mockup */}
              <div className="flex h-72">
                {/* Sidebar */}
                <div className="w-52 shrink-0 border-r border-zinc-200 bg-zinc-50 p-3 flex flex-col gap-1">
                  <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.3em] px-2 py-2">Herramientas</div>
                  {[
                    { name: "Crear imagen", color: "#a855f7", active: true },
                    { name: "Diseñar logo",  color: "#00c2ff" },
                    { name: "Mejorar imagen", color: "#a855f7" },
                    { name: "Quitar fondo",  color: "#34d399" },
                    { name: "Copywriting",   color: "#f43f5e" },
                    { name: "Artículo SEO",  color: "#34d399" },
                  ].map((t, idx) => (
                    <motion.div
                      key={t.name}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.07, duration: 0.35 }}
                      className={`flex items-center gap-2 px-2 py-2 rounded-lg ${t.active ? 'bg-zinc-100 border-r-2 border-primary' : ''}`}
                    >
                      <div className="w-5 h-5 rounded-md border border-zinc-200 flex items-center justify-center" style={{ background: t.color + '15' }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: t.color + '80' }} />
                      </div>
                      <span className={`text-[9px] font-medium ${t.active ? 'text-zinc-900' : 'text-zinc-400'}`}>{t.name}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Input panel */}
                <div className="w-52 shrink-0 border-r border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3">
                  <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Prompt</div>
                  <div className="flex-1 rounded-lg bg-zinc-50 border border-zinc-200 p-2">
                    <div className="text-[9px] text-zinc-400 leading-relaxed">Un gato astronauta en Marte al atardecer, estilo fotorrealista, luz dorada…</div>
                    <motion.div
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 1.1 }}
                      className="w-1 h-3 bg-primary/70 inline-block mt-1"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="text-zinc-500">FLUX Schnell · 2cr</span>
                  </div>
                  <div className="w-full py-1.5 rounded-lg bg-primary text-white text-[8px] font-black text-center">Generar</div>
                </div>

                {/* Result panel */}
                <div className="flex-1 bg-zinc-100 flex items-center justify-center relative">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="w-44 h-44 rounded-2xl overflow-hidden border border-zinc-200 shadow-xl shadow-zinc-200/80"
                  >
                    <div className="w-full h-full bg-gradient-to-br from-violet-100 via-zinc-50 to-cyan-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl mb-1">🚀</div>
                        <div className="text-[8px] text-zinc-400">Resultado generado</div>
                      </div>
                    </div>
                  </motion.div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <div className="px-2 py-1 rounded bg-zinc-900 text-white text-[8px] font-bold">Descargar</div>
                    <div className="px-2 py-1 rounded border border-zinc-200 text-zinc-400 text-[8px] font-bold">Guardar</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* ── Products deep dive ──────────────────────────────────────── */}
          {PRODUCTS.map((p, i) => (
            <ProductSection key={p.badge} p={p} i={i} navigate={navigate} />
          ))}

          {/* ── How it Works ─────────────────────────────────────────────── */}
          <section className="px-6 md:px-12 py-24 bg-zinc-50 border-t border-zinc-200">
            <InViewSection className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <motion.div variants={fadeUp} custom={0}>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-[0.2em] mb-6">
                    <Zap className="h-3 w-3" />
                    Cómo funciona
                  </div>
                </motion.div>
                <motion.h2 variants={fadeUp} custom={0.1} className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight mb-4">
                  De idea a realidad en <span className="text-primary">4 pasos</span>
                </motion.h2>
                <motion.p variants={fadeUp} custom={0.2} className="text-zinc-500 text-[15px] max-w-xl mx-auto">
                  Nuestro proceso está diseñado para eliminar la fricción y maximizar tu productividad.
                </motion.p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {HOW_IT_WORKS.map((step, i) => (
                  <motion.div
                    key={step.step}
                    variants={cardEntrance}
                    custom={i * 0.1}
                    whileHover={{ y: -8 }}
                    className="group relative rounded-2xl bg-white border border-zinc-200 p-6 overflow-hidden"
                  >
                    {/* Step number */}
                    <div className="absolute top-4 right-4 text-5xl font-black opacity-5 group-hover:opacity-10 transition-opacity" style={{ color: step.color }}>
                      {step.step}
                    </div>

                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                      style={{ background: step.color + '15' }}
                    >
                      <step.icon className="h-6 w-6" style={{ color: step.color }} />
                    </div>

                    {/* Content */}
                    <div className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: step.color }}>
                      Paso {step.step}
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-2">{step.title}</h3>
                    <p className="text-[13px] text-zinc-500 leading-relaxed">{step.description}</p>

                    {/* Hover line */}
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ background: step.color }}
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Connection line for desktop */}
              <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="w-[60%] h-0.5 bg-gradient-to-r from-violet-200 via-primary/30 to-violet-200"
                />
              </div>
            </InViewSection>
          </section>

          {/* ── Testimonials ───────────────────────────────────────────── */}
          <section className="px-6 md:px-12 py-24 bg-white border-t border-zinc-200 overflow-hidden">
            <InViewSection className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <motion.div variants={fadeUp} custom={0}>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[11px] font-black uppercase tracking-[0.2em] mb-6">
                    <Star className="h-3 w-3 fill-amber-600" />
                    Testimonios
                  </div>
                </motion.div>
                <motion.h2 variants={fadeUp} custom={0.1} className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight mb-4">
                  Lo que dicen nuestros <span className="text-primary">creadores</span>
                </motion.h2>
                <motion.p variants={fadeUp} custom={0.2} className="text-zinc-500 text-[15px] max-w-xl mx-auto">
                  Miles de personas están creando más rápido con Creator IA Pro.
                </motion.p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {TESTIMONIALS.map((testimonial, i) => (
                  <motion.div
                    key={testimonial.name}
                    variants={cardEntrance}
                    custom={i * 0.1}
                    className="group rounded-2xl bg-zinc-50 border border-zinc-200 p-6 hover:shadow-lg hover:border-zinc-300 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(testimonial.rating)].map((_, r) => (
                            <Star key={r} className="h-4 w-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <p className="text-zinc-700 text-[14px] leading-relaxed mb-4">
                          "{testimonial.content}"
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-zinc-900 text-[14px]">{testimonial.name}</div>
                            <div className="text-zinc-500 text-[12px]">{testimonial.role} · {testimonial.company}</div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </InViewSection>
          </section>

          {/* ── Canvas section ──────────────────────────────────────────── */}
          <section className="relative px-6 md:px-12 py-24 border-t border-zinc-200 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/50 to-transparent" />
            <InViewSection className="max-w-6xl mx-auto relative z-10">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <motion.div variants={fadeUp} custom={0}>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-[0.2em] mb-6">
                      <Layers className="h-3.5 w-3.5" />
                      Canvas IA
                    </div>
                  </motion.div>
                  <motion.h2 variants={fadeUp} custom={0.1} className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight mb-4">
                    Conecta <span className="text-primary">módulos de IA</span>
                  </motion.h2>
                  <motion.p variants={fadeUp} custom={0.2} className="text-[15px] text-zinc-500 mb-6 leading-relaxed">
                    Como Freepik AI pero con tus propios nodos. Crea flujos visuales arrastrando módulos: genera imágenes, mejora prompts, escribe copy y exporta todo conectado.
                  </motion.p>

                  {/* Available Nodes */}
                  <motion.div variants={fadeUp} custom={0.25} className="mb-6">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Nodos disponibles</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Generar imagen", color: "#a855f7" },
                        { label: "Video IA", color: "#00c2ff" },
                        { label: "Generar copy", color: "#f59e0b" },
                        { label: "LLM", color: "#6366f1" },
                        { label: "Exportar", color: "#10b981" },
                        { label: "Blueprint", color: "#ec4899" },
                      ].map((node, i) => (
                        <motion.div
                          key={node.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium"
                          style={{
                            borderColor: node.color + '30',
                            background: node.color + '10',
                            color: node.color,
                          }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: node.color }} />
                          {node.label}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.ul variants={fadeUp} custom={0.3} className="space-y-3 mb-8">
                    {[
                      "Arrastra y conecta nodos como en Figma",
                      "Cada nodo es un modelo de IA diferente",
                      "Conecta salidas con entradas",
                      "Ejecuta todo el flujo con un click",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-[14px] text-zinc-600">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </motion.ul>

                  <motion.div variants={fadeUp} custom={0.4} className="flex items-center gap-4">
                    <motion.button
                      onClick={() => navigate("/canvas")}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-[14px] hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                    >
                      <Layers className="h-4 w-4" />
                      Abrir Canvas IA
                    </motion.button>
                    <button
                      onClick={() => navigate("/hub")}
                      className="flex items-center gap-2 text-[14px] text-zinc-500 hover:text-zinc-900 transition-colors font-medium"
                    >
                      Ver templates <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                </div>

                {/* Canvas Preview */}
                <motion.div
                  variants={cardEntrance}
                  custom={0.2}
                  className="relative"
                >
                  <div className="relative rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-rose-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-[11px] text-zinc-400 font-medium">Canvas IA</span>
                      </div>
                    </div>

                    {/* Canvas Content */}
                    <div className="relative h-80 bg-zinc-950 overflow-hidden">
                      {/* Grid */}
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: "radial-gradient(circle, #a855f7 1px, transparent 1px)",
                          backgroundSize: "24px 24px",
                        }}
                      />

                      {/* Connection lines */}
                      <svg className="absolute inset-0 w-full h-full">
                        <motion.path
                          d="M80,60 Q150,60 200,100"
                          stroke="#a855f7"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="6 4"
                          animate={{ strokeDashoffset: [0, -20] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                          opacity="0.6"
                        />
                        <motion.path
                          d="M200,140 Q250,180 320,120"
                          stroke="#00c2ff"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="6 4"
                          animate={{ strokeDashoffset: [0, -20] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: 0.3 }}
                          opacity="0.6"
                        />
                      </svg>

                      {/* Nodes - Representing real Canvas IA nodes */}
                      {[
                        { x: 20, y: 30, color: "#a855f7", icon: Image, label: "Image Gen", active: true, type: "input" },
                        { x: 160, y: 80, color: "#6366f1", icon: Wand2, label: "LLM", active: false, type: "process" },
                        { x: 160, y: 150, color: "#f59e0b", icon: MessageSquare, label: "Caption", active: false, type: "process" },
                        { x: 280, y: 100, color: "#10b981", icon: Layers, label: "Export", active: true, type: "output" },
                      ].map((node, ni) => (
                        <motion.div
                          key={ni}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5 + ni * 0.15, duration: 0.4 }}
                          className="absolute"
                          style={{ left: node.x, top: node.y }}
                        >
                          <div
                            className={`px-3 py-2.5 rounded-xl border shadow-lg min-w-[100px] ${
                              node.active ? 'bg-zinc-900 border-primary/30' : 'bg-zinc-900/80 border-zinc-700'
                            }`}
                          >
                            {/* Connection points */}
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-600 border border-zinc-500" />
                            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500 border border-emerald-400" />

                            <div className="flex items-center gap-2">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: node.color + '20' }}
                              >
                                <node.icon className="h-3.5 w-3.5" style={{ color: node.color }} />
                              </div>
                              <span className="text-[10px] font-medium text-zinc-300">{node.label}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Floating badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1, duration: 0.4 }}
                    className="absolute -bottom-4 -right-4 bg-white rounded-xl border border-zinc-200 shadow-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-zinc-900">Flujo ejecutado</div>
                        <div className="text-[10px] text-zinc-500">4 nodos · 12 segundos</div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </InViewSection>
          </section>

          {/* ── Pricing ─────────────────────────────────────────────────── */}
          <section className="px-6 md:px-12 py-20 border-t border-zinc-200 bg-zinc-50">
            <div className="max-w-4xl mx-auto">
              <InViewSection className="text-center mb-12">
                <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-black text-zinc-900 mb-3">Precios simples.</motion.h2>
                <motion.p variants={fadeUp} custom={0.1} className="text-zinc-400 text-[15px]">Sin sorpresas. Cancela cuando quieras.</motion.p>
              </InViewSection>
              <InViewSection className="grid md:grid-cols-3 gap-6">
                {PLANS.map((plan, pi) => (
                  <motion.div
                    key={plan.name}
                    variants={cardEntrance}
                    custom={pi}
                    whileHover={{ y: -8, boxShadow: plan.popular ? `0 20px 60px ${plan.color}25` : "0 12px 32px rgba(0,0,0,0.08)" }}
                    className={`group relative rounded-2xl border overflow-hidden transition-all cursor-pointer flex flex-col ${
                      plan.popular
                        ? 'border-primary/40 bg-white'
                        : 'border-zinc-200 bg-white'
                    }`}
                  >
                    {/* Plan Image */}
                    <div className="relative h-40 overflow-hidden">
                      <motion.img
                        src={plan.image}
                        alt={plan.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/90">{plan.name}</p>
                      </div>
                      {plan.popular && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-wider shadow-lg">
                          Popular
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="mb-4">
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="text-3xl font-black text-zinc-900">{plan.price}</span>
                          <span className="text-zinc-400 text-sm">{plan.per}</span>
                        </div>
                        <p className="text-[12px] text-zinc-500">{plan.credits}</p>
                        <p className="text-[11px] text-zinc-400 mt-2">{plan.description}</p>
                      </div>
                      <ul className="flex flex-col gap-2 mb-5 flex-1">
                        {plan.features.slice(0, 4).map((f) => (
                          <li key={f} className="flex items-center gap-2 text-[12px] text-zinc-500">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: plan.color }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <motion.button
                        onClick={() => navigate("/pricing")}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                          plan.popular
                            ? 'bg-primary text-white hover:bg-primary/90'
                            : 'border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
                        }`}
                      >
                        Empezar con {plan.name}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </InViewSection>
            </div>
          </section>

          {/* ── Final CTA ───────────────────────────────────────────────── */}
          <section className="relative px-6 md:px-12 py-28 border-t border-zinc-200 overflow-hidden bg-zinc-900 text-white">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
                transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/20 blur-[120px] rounded-full"
              />
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
            </div>

            <InViewSection className="max-w-3xl mx-auto text-center relative z-10">
              <motion.div variants={fadeUp} custom={0}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-[11px] font-bold mb-6">
                  <motion.span
                    animate={{ rotate: [0, 15, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    <Sparkles className="h-3 w-3" />
                  </motion.span>
                  Comienza gratis — Sin tarjeta
                </div>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={0.1} className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
                ¿Listo para crear
                <span className="block bg-gradient-to-r from-primary via-violet-400 to-primary bg-clip-text text-transparent animate-gradient">
                  sin límites?
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={0.2} className="text-zinc-400 text-[16px] mb-10 leading-relaxed max-w-xl mx-auto">
                Únete a +50,000 creadores que ya están usando Genesis IDE y Studio para dar vida a sus ideas en minutos, no en días.
              </motion.p>

              {/* Feature bullets */}
              <motion.div variants={fadeUp} custom={0.3} className="flex flex-wrap justify-center gap-4 mb-10">
                {["5 créditos gratis", "Sin compromiso", "Cancela cuando quieras"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[13px] text-zinc-400">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item}
                  </div>
                ))}
              </motion.div>

              <motion.div variants={fadeUp} custom={0.4} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  onClick={() => navigate("/auth")}
                  whileHover={{ scale: 1.03, boxShadow: "0 20px 40px -10px rgba(168,85,247,0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2.5 px-10 py-4 rounded-full bg-white text-zinc-900 text-[15px] font-black hover:bg-zinc-100 transition-all shadow-xl"
                >
                  Crear cuenta gratis <ArrowRight className="h-5 w-5" />
                </motion.button>
                <motion.button
                  onClick={() => navigate("/pricing")}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white text-[15px] font-bold hover:bg-white/10 transition-all"
                >
                  Ver planes
                </motion.button>
              </motion.div>

              {/* Trust badges */}
              <motion.div variants={fadeUp} custom={0.5} className="flex items-center justify-center gap-6 mt-12 pt-12 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-zinc-500" />
                  <span className="text-[12px] text-zinc-500">SSL Seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-zinc-500" />
                  <span className="text-[12px] text-zinc-500">50K+ usuarios</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-zinc-500" />
                  <span className="text-[12px] text-zinc-500">4.9 rating</span>
                </div>
              </motion.div>
            </InViewSection>
          </section>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <footer className="bg-zinc-950 border-t border-zinc-800 px-6 md:px-12 py-12">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-white font-bold">Creator IA Pro</span>
                  </div>
                  <p className="text-zinc-500 text-[13px] max-w-sm mb-4">
                    La plataforma de IA todo-en-uno para crear apps, imágenes y contenido en segundos.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-bold text-[13px] mb-4">Producto</h4>
                  <ul className="space-y-2">
                    {[
                      { label: "Genesis IDE", path: "/chat" },
                      { label: "Studio", path: "/studio" },
                      { label: "Canvas", path: "/formarketing" },
                      { label: "Precios", path: "/pricing" },
                    ].map((item) => (
                      <li key={item.label}>
                        <button
                          onClick={() => navigate(item.path)}
                          className="text-zinc-500 text-[12px] hover:text-white transition-colors"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-bold text-[13px] mb-4">Recursos</h4>
                  <ul className="space-y-2">
                    {[
                      { label: "Hub de templates", path: "/hub" },
                      { label: "Documentación", path: "/docs" },
                      { label: "Estado del sistema", path: "/system-status" },
                      { label: "Descargar app", path: "/descargar" },
                    ].map((item) => (
                      <li key={item.label}>
                        <button
                          onClick={() => navigate(item.path)}
                          className="text-zinc-500 text-[12px] hover:text-white transition-colors"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[11px] text-zinc-600">© 2026 Creator IA Pro. Todos los derechos reservados.</p>
                <div className="flex items-center gap-6">
                  {[
                    { label: "Términos", path: "/terms" },
                    { label: "Privacidad", path: "/privacy" },
                    { label: "Contacto", path: "/contact" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
