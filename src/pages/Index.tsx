/**
 * Creator IA Pro — Landing Page
 * Redesigned with Stitch/Google-inspired aesthetic:
 * Clean dark background, focused typography, minimal chrome, conversion-first layout.
 */
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight, Code2, Image, Zap,
  CheckCircle2, Layers, MessageSquare, Video,
  Star, Shield, Users, ChevronRight, Sparkles
} from "lucide-react";
import { Logo } from "@/components/Logo";

// ─── Data ─────────────────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    badge: "Genesis IDE",
    headline: "De la idea al código en segundos.",
    sub: "Describe tu app y Genesis la construye completa con React, TypeScript y Tailwind. Previsualización en tiempo real, push a GitHub integrado.",
    icon: Code2,
    color: "#4ADE80",
    cta: "Probar Genesis →",
    path: "/chat",
    features: ["React 18 + TypeScript", "Preview instantáneo", "GitHub push", "Claude 4.6"],
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Creator IA Pro — Genesis IDE + Studio de IA</title>
        <meta name="description" content="Genera apps React completas con Genesis IDE y crea imágenes, logos y textos con Studio. Todo con IA. Desde $12/mes." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground selection:bg-primary/15 font-sans bg-grid-white/[0.02]">

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-background/90 backdrop-blur-md border-b border-zinc-200">
          <Logo size="sm" showText showPro onClick={() => navigate("/")} />

          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/pricing")} className="hidden sm:block text-[13px] text-zinc-400 hover:text-zinc-900 transition-colors font-medium">
              Precios
            </button>
            <button onClick={() => navigate("/hub")} className="hidden sm:block text-[13px] text-zinc-400 hover:text-zinc-900 transition-colors font-medium">
              Templates
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-zinc-900 text-white text-[13px] font-bold hover:bg-zinc-800 active:scale-95 transition-all"
            >
              Empezar gratis
            </button>
          </div>
        </header>

        {/* ── Announcement bar ─────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-3 py-2.5 px-4 bg-primary/10 border-b border-primary/20">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <p className="text-[12px] font-semibold text-zinc-600">
            Genesis IDE + Studio + Canvas — Starter desde{" "}
            <span className="text-zinc-900 font-black">$12/mes</span>
          </p>
          <button onClick={() => navigate("/pricing")} className="flex items-center gap-1 text-[12px] text-primary hover:text-zinc-900 transition-colors font-bold">
            Ver planes <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <main>

          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <section className="relative flex flex-col items-center text-center px-6 pt-24 pb-20 overflow-hidden">
            {/* Subtle glow */}
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/6 blur-[120px] rounded-full" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-[11px] font-bold text-zinc-400 uppercase tracking-[0.3em] mb-8">
                <Code2 className="h-3 w-3 text-primary" />
                Genesis IDE · Studio · Canvas IA
              </div>

              <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-black leading-[0.9] tracking-tight text-zinc-900 max-w-4xl mb-6">
                Construye apps.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">
                  Crea contenido.
                </span>
                <br />Todo con IA.
              </h1>

              <p className="text-[clamp(0.95rem,2vw,1.15rem)] text-zinc-400 max-w-lg mx-auto leading-relaxed mb-10">
                Genesis genera apps React completas desde tu descripción. Studio produce imágenes, logos y textos al instante. Sin fricción, sin código manual.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => navigate("/auth")}
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-zinc-900 text-white text-[14px] font-black hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-sm"
                >
                  Comenzar gratis <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate("/pricing")}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-zinc-200 text-zinc-500 text-[14px] font-bold hover:text-zinc-900 hover:border-zinc-300 transition-all"
                >
                  Ver planes
                </button>
              </div>

              {/* Social proof mini */}
              <div className="flex items-center justify-center gap-6 mt-10">
                {TRUST.map((t) => (
                  <div key={t.text} className="hidden sm:flex items-center gap-1.5">
                    <t.icon className="h-3.5 w-3.5 text-primary/70" />
                    <span className="text-[11px] text-zinc-400 font-medium">{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Product browser mockup ──────────────────────────────────── */}
          <section className="px-6 md:px-12 pb-20">
            <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-zinc-200 shadow-lg shadow-zinc-100 bg-white">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 bg-zinc-50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-3 h-5 rounded bg-zinc-50 flex items-center px-2.5 gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  <span className="text-[10px] text-zinc-300 font-mono">creator-ia.com/studio</span>
                </div>
              </div>

              {/* App preview — Studio 2-panel mockup */}
              <div className="flex h-72">
                {/* Sidebar */}
                <div className="w-52 shrink-0 border-r border-zinc-200 bg-zinc-50 p-3 flex flex-col gap-1">
                  <div className="text-[8px] font-bold text-zinc-300 uppercase tracking-[0.3em] px-2 py-2">Herramientas</div>
                  {[
                    { name: "Crear imagen", color: "#a855f7", active: true },
                    { name: "Diseñar logo",  color: "#00c2ff" },
                    { name: "Mejorar imagen", color: "#a855f7" },
                    { name: "Quitar fondo",  color: "#34d399" },
                    { name: "Copywriting",   color: "#f43f5e" },
                    { name: "Artículo SEO",  color: "#34d399" },
                  ].map((t) => (
                    <div key={t.name} className={`flex items-center gap-2 px-2 py-2 rounded-lg ${t.active ? 'bg-zinc-100 border-r-2 border-primary' : ''}`}>
                      <div className="w-5 h-5 rounded-md border border-zinc-200 flex items-center justify-center" style={{ background: t.color + '15' }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: t.color + '80' }} />
                      </div>
                      <span className={`text-[9px] font-medium ${t.active ? 'text-zinc-900' : 'text-zinc-400'}`}>{t.name}</span>
                    </div>
                  ))}
                </div>

                {/* Input panel */}
                <div className="w-52 shrink-0 border-r border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3">
                  <div className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest">Prompt</div>
                  <div className="flex-1 rounded-lg bg-zinc-50 border border-zinc-200 p-2">
                    <div className="text-[9px] text-zinc-400 leading-relaxed">Un gato astronauta en Marte al atardecer, estilo fotorrealista, luz dorada…</div>
                    <div className="w-1 h-3 bg-primary/70 animate-pulse inline-block mt-1" />
                  </div>
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="text-zinc-300">FLUX Schnell · 2cr</span>
                  </div>
                  <div className="w-full py-1.5 rounded-lg bg-primary text-white text-[8px] font-black text-center">Generar</div>
                </div>

                {/* Result panel */}
                <div className="flex-1 bg-black/30 flex items-center justify-center relative">
                  <div className="w-44 h-44 rounded-2xl overflow-hidden border border-zinc-200 shadow-2xl">
                    <div className="w-full h-full bg-background bg-grid-white/[0.02] flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl mb-1">🚀</div>
                        <div className="text-[8px] text-zinc-400">Resultado generado</div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <div className="px-2 py-1 rounded bg-zinc-900 text-white text-[8px] font-bold">Descargar</div>
                    <div className="px-2 py-1 rounded border border-zinc-200 text-zinc-400 text-[8px] font-bold">Guardar</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Products deep dive ──────────────────────────────────────── */}
          {PRODUCTS.map((p, i) => (
            <section key={p.badge} className={`px-6 md:px-12 py-20 border-t border-zinc-200 ${i % 2 === 1 ? 'bg-zinc-50' : ''}`}>
              <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
                {/* Text */}
                <div className={`flex-1 ${i % 2 === 1 ? 'md:order-2' : ''}`}>
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
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-[13px] text-zinc-500">
                        <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: p.color }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate(p.path)}
                    className="flex items-center gap-2 text-[13px] font-bold transition-colors group"
                    style={{ color: p.color }}
                  >
                    {p.cta}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Visual */}
                <div className={`flex-1 ${i % 2 === 1 ? 'md:order-1' : ''}`}>
                  <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-md shadow-zinc-200"
                    style={{ boxShadow: `0 4px 24px 15` }}>
                    {i === 0 ? (
                      /* Genesis preview */
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex gap-1">
                            {p.preview.map((f: any) => (
                              <div key={f.label} className={`px-2 py-1 rounded text-[8px] font-bold ${f.active ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-300'}`}>{f.label}</div>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-xl bg-black/40 p-4 font-mono text-[10px] leading-relaxed">
                          <span className="text-blue-400">import</span>{" "}
                          <span className="text-zinc-900">{'{'} useState {'}'}</span>{" "}
                          <span className="text-blue-400">from</span>{" "}
                          <span className="text-orange-300">'react'</span>
                          <br />
                          <br />
                          <span className="text-blue-400">export default function</span>{" "}
                          <span className="text-yellow-300">App</span>
                          <span className="text-zinc-900">() {"{"}</span>
                          <br />
                          {"  "}<span className="text-blue-400">return</span>{" "}
                          <span className="text-zinc-900">{"("}</span>
                          <br />
                          {"    "}<span className="text-zinc-400">{"<div className="}</span>
                          <span className="text-orange-300">"hero"</span>
                          <span className="text-zinc-400">{">"}</span>
                          <br />
                          {"      "}<span className="text-zinc-400">{"<h1>"}</span>
                          <span className="text-zinc-900">Mi App con IA</span>
                          <span className="text-zinc-400">{"</h1>"}</span>
                          <br />
                          {"    "}<span className="text-zinc-400">{"</div>"}</span>
                          <br />
                          {"  "}<span className="text-zinc-900">{")"}</span>
                          <br />
                          <span className="text-zinc-900">{"}"}</span>
                          <span className="inline-block w-1 h-3 bg-primary animate-pulse ml-0.5 align-middle" />
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
                            <Sparkles className="h-3 w-3 text-primary" />
                            <span className="text-[9px] font-bold text-primary">Claude 4.6</span>
                          </div>
                          <span className="text-[9px] text-zinc-300">Generando App.tsx…</span>
                        </div>
                      </div>
                    ) : (
                      /* Studio preview */
                      <div className="p-5">
                        <div className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest mb-3">Herramientas disponibles</div>
                        <div className="grid grid-cols-2 gap-2">
                          {(p.preview as any[]).map((t) => (
                            <div key={t.tool} className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 bg-zinc-50">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: t.color + '20' }}>
                                <div className="w-2 h-2 rounded-full" style={{ background: t.color + '80' }} />
                              </div>
                              <div>
                                <div className="text-[9px] font-bold text-zinc-600">{t.tool}</div>
                                <div className="text-[8px] text-zinc-300">{t.cr} crédito{t.cr > 1 ? 's' : ''}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 w-full h-24 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                          <span className="text-[10px] text-zinc-300">Preview en tiempo real</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ))}

          {/* ── Canvas section ──────────────────────────────────────────── */}
          <section className="px-6 md:px-12 py-20 border-t border-zinc-200">
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 text-primary bg-primary/10 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                <Layers className="h-3 w-3" />
                Canvas Editor
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight mb-4">
                Flujos de producción visual.
              </h2>
              <p className="text-[15px] text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
                Editor node-based estilo Figma para orquestar campañas completas: conecta nodos de imagen, video y texto con IA. Para agencias y productores de contenido.
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => navigate("/formarketing")}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-all font-bold text-[13px]"
                >
                  <Layers className="h-4 w-4" />
                  Abrir Canvas
                </button>
                <button
                  onClick={() => navigate("/hub")}
                  className="flex items-center gap-2 text-[13px] text-zinc-400 hover:text-zinc-900 transition-colors font-medium"
                >
                  Ver templates <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          {/* ── Pricing ─────────────────────────────────────────────────── */}
          <section className="px-6 md:px-12 py-20 border-t border-zinc-200 bg-zinc-50">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black text-zinc-900 mb-3">Precios simples.</h2>
                <p className="text-zinc-400 text-[15px]">Sin sorpresas. Cancela cuando quieras.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {PLANS.map((plan) => (
                  <div
                    key={plan.name}
                    className={`relative rounded-2xl p-6 border transition-all ${
                      plan.popular
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-zinc-200 bg-zinc-50'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-zinc-900 text-[10px] font-black uppercase tracking-widest">
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
                    <button
                      onClick={() => navigate("/pricing")}
                      className={`w-full py-2.5 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${
                        plan.popular
                          ? 'bg-primary text-white hover:bg-primary/90'
                          : 'border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
                      }`}
                    >
                      Empezar con {plan.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Final CTA ───────────────────────────────────────────────── */}
          <section className="px-6 md:px-12 py-24 border-t border-zinc-200">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold mb-6">
                <Sparkles className="h-3 w-3" />
                Sin tarjeta requerida
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-4 leading-tight">
                Empieza a crear hoy.
              </h2>
              <p className="text-zinc-400 text-[15px] mb-8 leading-relaxed">
                Genesis IDE y Studio disponibles desde el primer día. Sin configuración, sin fricción.
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="flex items-center gap-2.5 px-10 py-4 rounded-xl bg-zinc-900 text-white text-[15px] font-black hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-sm mx-auto"
              >
                Crear cuenta gratis <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </section>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <footer className="border-t border-zinc-200 px-6 md:px-12 py-8">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <Logo size="sm" showText showPro />
              <div className="flex items-center gap-6 text-[11px] text-zinc-300">
                <button onClick={() => navigate("/pricing")} className="hover:text-zinc-900 transition-colors">Precios</button>
                <button onClick={() => navigate("/hub")} className="hover:text-zinc-900 transition-colors">Templates</button>
                <button onClick={() => navigate("/system-status")} className="hover:text-zinc-900 transition-colors">Status</button>
                <button onClick={() => navigate("/descargar")} className="hover:text-zinc-900 transition-colors">Descargar app</button>
              </div>
              <p className="text-[11px] text-zinc-300">© 2026 Creator IA Pro</p>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
