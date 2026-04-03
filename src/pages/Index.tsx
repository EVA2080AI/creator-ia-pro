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
  Star, Shield, Users, ChevronRight, Sparkles, Wand2
} from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  AnimatePresence,
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
  { name: "Starter", price: "$69K", per: "/mes", credits: "500 créditos", color: "#4ADE80", features: ["Genesis IDE", "Studio completo", "Canvas IA", "Modelos ECO"] },
  { name: "Creator", price: "$138K", per: "/mes", credits: "1.200 créditos", color: "#A855F7", popular: true, features: ["Todo Starter", "Claude 4.6", "GPT-4o", "Soporte prioritario"] },
  { name: "Pymes",   price: "$345K", per: "/mes", credits: "4.000 créditos", color: "#F59E0B", features: ["Todo Creator", "Claude Opus 4.6", "Modelos ULTRA", "BuilderAI IDE"] },
];

const TRUST = [
  { icon: Shield,  text: "SSL + datos seguros",     sub: "Supabase + Vercel Edge" },
  { icon: Zap,     text: "Generación en <30s",      sub: "99.5% uptime" },
  { icon: Users,   text: "Sin tarjeta para empezar", sub: "Plan gratuito disponible" },
  { icon: Star,    text: "Modelos top del mundo",    sub: "Claude · GPT-4o · FLUX" },
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
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut", delay },
  }),
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardEntrance = {
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

      <div className="min-h-screen bg-background text-foreground selection:bg-primary/15 font-sans overflow-x-hidden">

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-background/90 backdrop-blur-md border-b border-zinc-200"
        >
          <Logo size="sm" showText showPro onClick={() => navigate("/")} />

          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/pricing")} className="hidden sm:block text-[13px] text-zinc-400 hover:text-zinc-900 transition-colors font-medium">
              Precios
            </button>
            <button onClick={() => navigate("/hub")} className="hidden sm:block text-[13px] text-zinc-400 hover:text-zinc-900 transition-colors font-medium">
              Templates
            </button>
            <motion.button
              onClick={() => navigate("/auth")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-zinc-900 text-white text-[13px] font-bold hover:bg-zinc-800 transition-all"
            >
              Empezar gratis
            </motion.button>
          </div>
        </motion.header>

        {/* ── Announcement bar ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center justify-center gap-3 py-2.5 px-4 bg-primary/10 border-b border-primary/20"
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
          <p className="text-[12px] font-semibold text-zinc-600">
            Genesis IA · Generar IA · Canvas IA — Starter desde{" "}
            <span className="text-zinc-900 font-black">$69.000 COP/mes</span>
          </p>
          <button onClick={() => navigate("/pricing")} className="flex items-center gap-1 text-[12px] text-primary hover:text-zinc-900 transition-colors font-bold">
            Ver planes <ChevronRight className="h-3 w-3" />
          </button>
        </motion.div>

        <main>

          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <section ref={heroRef} className="relative flex flex-col items-center text-center px-6 pt-24 pb-20 overflow-hidden">

            {/* ── Creative background ──────────────────────────────────── */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {/* Dot grid */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.055]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="hero-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="#a855f7" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hero-dots)" />
              </svg>

              {/* Floating node graph — decorative AI canvas */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
                {/* Connection lines */}
                <line x1="18%" y1="30%" x2="38%" y2="50%" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="6 4" />
                <line x1="38%" y1="50%" x2="62%" y2="35%" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="6 4" />
                <line x1="62%" y1="35%" x2="82%" y2="55%" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="6 4" />
                <line x1="38%" y1="50%" x2="50%" y2="70%" stroke="#6366f1" strokeWidth="1"   strokeDasharray="4 4" />
                <line x1="62%" y1="35%" x2="50%" y2="70%" stroke="#6366f1" strokeWidth="1"   strokeDasharray="4 4" />
                {/* Node circles */}
                <circle cx="18%" cy="30%" r="12" fill="none" stroke="#a855f7" strokeWidth="1.5" />
                <circle cx="18%" cy="30%" r="5"  fill="#a855f7" />
                <circle cx="38%" cy="50%" r="14" fill="none" stroke="#a855f7" strokeWidth="1.5" />
                <circle cx="38%" cy="50%" r="6"  fill="#a855f7" />
                <circle cx="62%" cy="35%" r="12" fill="none" stroke="#6366f1" strokeWidth="1.5" />
                <circle cx="62%" cy="35%" r="5"  fill="#6366f1" />
                <circle cx="82%" cy="55%" r="10" fill="none" stroke="#a855f7" strokeWidth="1.5" />
                <circle cx="82%" cy="55%" r="4"  fill="#a855f7" />
                <circle cx="50%" cy="70%" r="10" fill="none" stroke="#6366f1" strokeWidth="1.5" />
                <circle cx="50%" cy="70%" r="4"  fill="#6366f1" />
              </svg>

              {/* Aurora blobs */}
              <motion.div
                animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.95, 1] }}
                transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
                className="absolute top-[-10%] left-[30%] w-[600px] h-[400px] bg-primary/8 blur-[130px] rounded-full"
              />
              <motion.div
                animate={{ x: [0, -50, 30, 0], y: [0, 40, -20, 0], scale: [1, 0.9, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 18, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-[10%] right-[20%] w-[400px] h-[300px] bg-violet-400/6 blur-[110px] rounded-full"
              />
              <motion.div
                animate={{ x: [0, 30, -40, 0], scale: [1, 1.15, 0.9, 1] }}
                transition={{ repeat: Infinity, duration: 22, ease: "easeInOut", delay: 4 }}
                className="absolute top-[40%] left-[10%] w-[300px] h-[200px] bg-emerald-400/5 blur-[100px] rounded-full"
              />

              {/* Floating animated particles */}
              {[
                { x: "12%", y: "20%", dur: 8,  delay: 0,   size: 3, color: "#a855f7" },
                { x: "88%", y: "15%", dur: 10, delay: 1.5, size: 2, color: "#6366f1" },
                { x: "75%", y: "65%", dur: 12, delay: 3,   size: 4, color: "#a855f7" },
                { x: "5%",  y: "55%", dur: 9,  delay: 2,   size: 2, color: "#34d399" },
                { x: "92%", y: "40%", dur: 11, delay: 4,   size: 3, color: "#f59e0b" },
              ].map((p, i) => (
                <motion.div
                  key={i}
                  style={{ left: p.x, top: p.y, width: p.size, height: p.size, background: p.color, position: "absolute", borderRadius: "50%" }}
                  animate={{ y: [0, -16, 0], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ repeat: Infinity, duration: p.dur, delay: p.delay, ease: "easeInOut" }}
                />
              ))}
            </div>

            <div className="relative z-10">
              {/* Badge */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={0.1}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-[11px] font-bold text-zinc-400 uppercase tracking-[0.3em] mb-8"
              >
                <motion.span
                  animate={{ rotate: [0, 15, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  <Code2 className="h-3 w-3 text-primary" />
                </motion.span>
                Genesis IDE · Studio · Canvas IA
              </motion.div>

              {/* Headline — word-by-word stagger */}
              <motion.h1
                className="text-[clamp(2.5rem,8vw,5.5rem)] font-black leading-[0.9] tracking-tight text-zinc-900 max-w-4xl mb-6"
              >
                <motion.span
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={0.2}
                  className="block"
                >
                  Construye apps.
                </motion.span>
                <motion.span
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={0.35}
                  className="block text-transparent bg-clip-text"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #a855f7 0%, #7c3aed 40%, #a855f7 80%, #c084fc 100%)",
                    backgroundSize: "200% 200%",
                  }}
                >
                  <motion.span
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                    style={{ display: "inline-block" }}
                  >
                    Crea contenido.
                  </motion.span>
                </motion.span>
                <motion.span
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={0.5}
                  className="block"
                >
                  Todo con IA.
                </motion.span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={0.6}
                className="text-[clamp(0.95rem,2vw,1.15rem)] text-zinc-400 max-w-lg mx-auto leading-relaxed mb-10"
              >
                Genesis genera apps React completas desde tu descripción. Studio produce imágenes, logos y textos al instante. Sin fricción, sin código manual.
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={0.7}
                className="flex flex-col sm:flex-row items-center justify-center gap-3"
              >
                <motion.button
                  onClick={() => navigate("/auth")}
                  whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-zinc-900 text-white text-[14px] font-black hover:bg-zinc-800 transition-all shadow-sm"
                >
                  Comenzar gratis <ArrowRight className="h-4 w-4" />
                </motion.button>
                <motion.button
                  onClick={() => navigate("/pricing")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-zinc-200 text-zinc-500 text-[14px] font-bold hover:text-zinc-900 hover:border-zinc-300 transition-all"
                >
                  Ver planes
                </motion.button>
              </motion.div>

              {/* Social proof mini */}
              <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="show"
                custom={0.9}
                className="flex items-center justify-center gap-6 mt-10"
              >
                {TRUST.map((t, idx) => (
                  <motion.div
                    key={t.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + idx * 0.08, duration: 0.4 }}
                    className="hidden sm:flex items-center gap-1.5"
                  >
                    <t.icon className="h-3.5 w-3.5 text-primary/70" />
                    <span className="text-[11px] text-zinc-400 font-medium">{t.text}</span>
                  </motion.div>
                ))}
              </motion.div>
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

          {/* ── Canvas section ──────────────────────────────────────────── */}
          <section className="px-6 md:px-12 py-20 border-t border-zinc-200">
            <InViewSection className="max-w-5xl mx-auto text-center">
              <motion.div variants={fadeUp} custom={0}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 text-primary bg-primary/10 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                  <Layers className="h-3 w-3" />
                  Canvas Editor
                </div>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={0.1} className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight mb-4">
                Flujos de producción visual.
              </motion.h2>
              <motion.p variants={fadeUp} custom={0.2} className="text-[15px] text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
                Editor node-based estilo Figma para orquestar campañas completas: conecta nodos de imagen, video y texto con IA. Para agencias y productores de contenido.
              </motion.p>
              <motion.div variants={fadeUp} custom={0.3} className="flex items-center justify-center gap-4">
                <motion.button
                  onClick={() => navigate("/formarketing")}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-all font-bold text-[13px]"
                >
                  <Layers className="h-4 w-4" />
                  Abrir Canvas
                </motion.button>
                <button
                  onClick={() => navigate("/hub")}
                  className="flex items-center gap-2 text-[13px] text-zinc-400 hover:text-zinc-900 transition-colors font-medium"
                >
                  Ver templates <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>

              {/* Animated canvas preview dots */}
              <motion.div variants={fadeUp} custom={0.4} className="mt-14 relative h-40 w-full max-w-2xl mx-auto">
                <div className="absolute inset-0 rounded-2xl border border-zinc-200 bg-zinc-950 overflow-hidden">
                  {/* Grid */}
                  <div className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: "radial-gradient(circle, #a855f7 1px, transparent 1px)",
                      backgroundSize: "28px 28px",
                    }}
                  />
                  {/* Animated nodes */}
                  {[
                    { x: "15%", y: "30%", color: "#a855f7", label: "Imagen" },
                    { x: "42%", y: "55%", color: "#00c2ff", label: "Texto" },
                    { x: "68%", y: "25%", color: "#4ade80", label: "Video" },
                  ].map((node, ni) => (
                    <motion.div
                      key={ni}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 3 + ni, ease: "easeInOut", delay: ni * 0.7 }}
                      className="absolute"
                      style={{ left: node.x, top: node.y }}
                    >
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-bold"
                        style={{ borderColor: node.color + '50', color: node.color, background: node.color + '15' }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: node.color }} />
                        {node.label}
                      </div>
                    </motion.div>
                  ))}
                  {/* Animated connection line */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 160" preserveAspectRatio="none">
                    <motion.path
                      d="M90,48 C200,48 200,88 252,88"
                      stroke="#a855f750"
                      strokeWidth="1.5"
                      fill="none"
                      strokeDasharray="4 4"
                      animate={{ strokeDashoffset: [0, -20] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    />
                    <motion.path
                      d="M252,88 C350,88 350,40 408,40"
                      stroke="#00c2ff50"
                      strokeWidth="1.5"
                      fill="none"
                      strokeDasharray="4 4"
                      animate={{ strokeDashoffset: [0, -20] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear", delay: 0.5 }}
                    />
                  </svg>
                </div>
              </motion.div>
            </InViewSection>
          </section>

          {/* ── Pricing ─────────────────────────────────────────────────── */}
          <section className="px-6 md:px-12 py-20 border-t border-zinc-200 bg-zinc-50">
            <div className="max-w-4xl mx-auto">
              <InViewSection className="text-center mb-12">
                <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-black text-zinc-900 mb-3">Precios simples.</motion.h2>
                <motion.p variants={fadeUp} custom={0.1} className="text-zinc-400 text-[15px]">Sin sorpresas. Cancela cuando quieras.</motion.p>
              </InViewSection>
              <InViewSection className="grid md:grid-cols-3 gap-4">
                {PLANS.map((plan, pi) => (
                  <motion.div
                    key={plan.name}
                    variants={cardEntrance}
                    custom={pi}
                    whileHover={{ y: -6, boxShadow: plan.popular ? `0 16px 48px ${plan.color}20` : "0 8px 24px rgba(0,0,0,0.06)" }}
                    className={`relative rounded-2xl p-6 border transition-all cursor-pointer ${
                      plan.popular
                        ? 'border-primary/40 bg-white'
                        : 'border-zinc-200 bg-white'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest">
                        Más popular
                      </div>
                    )}
                    <div className="mb-4">
                      <p className="text-[12px] font-bold uppercase tracking-widest mb-1" style={{ color: plan.color }}>{plan.name}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-zinc-900">{plan.price}</span>
                        <span className="text-zinc-400 text-sm">{plan.per}</span>
                      </div>
                      <p className="text-[12px] text-zinc-400 mt-1">{plan.credits}</p>
                    </div>
                    <ul className="flex flex-col gap-2 mb-6">
                      {plan.features.map((f) => (
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
                  </motion.div>
                ))}
              </InViewSection>
            </div>
          </section>

          {/* ── Final CTA ───────────────────────────────────────────────── */}
          <section className="relative px-6 md:px-12 py-24 border-t border-zinc-200 overflow-hidden">
            {/* Animated background glow */}
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/8 blur-[120px] rounded-full"
            />
            <InViewSection className="max-w-2xl mx-auto text-center relative z-10">
              <motion.div variants={fadeUp} custom={0}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold mb-6">
                  <motion.span
                    animate={{ rotate: [0, 15, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    <Sparkles className="h-3 w-3" />
                  </motion.span>
                  Sin tarjeta requerida
                </div>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={0.1} className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-4 leading-tight">
                Empieza a crear hoy.
              </motion.h2>
              <motion.p variants={fadeUp} custom={0.2} className="text-zinc-400 text-[15px] mb-8 leading-relaxed">
                Genesis IDE y Studio disponibles desde el primer día. Sin configuración, sin fricción.
              </motion.p>
              <motion.div variants={fadeUp} custom={0.3}>
                <motion.button
                  onClick={() => navigate("/auth")}
                  whileHover={{ scale: 1.05, boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2.5 px-10 py-4 rounded-xl bg-zinc-900 text-white text-[15px] font-black hover:bg-zinc-800 transition-all shadow-sm mx-auto"
                >
                  Crear cuenta gratis <ArrowRight className="h-5 w-5" />
                </motion.button>
              </motion.div>
            </InViewSection>
          </section>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <footer className="border-t border-zinc-200 px-6 md:px-12 py-8">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <Logo size="sm" showText showPro />
              <div className="flex items-center gap-6 text-[11px] text-zinc-500">
                <button onClick={() => navigate("/pricing")} className="hover:text-zinc-900 transition-colors">Precios</button>
                <button onClick={() => navigate("/hub")} className="hover:text-zinc-900 transition-colors">Templates</button>
                <button onClick={() => navigate("/system-status")} className="hover:text-zinc-900 transition-colors">Status</button>
                <button onClick={() => navigate("/descargar")} className="hover:text-zinc-900 transition-colors">Descargar app</button>
              </div>
              <p className="text-[11px] text-zinc-500">© 2026 Creator IA Pro</p>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
