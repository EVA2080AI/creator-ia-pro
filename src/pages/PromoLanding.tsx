// Página 16:9 pensada para GRABAR y usar como video promocional horizontal
// (hero de la landing, embed de YouTube, campañas de Meta/X):
// 1) ábrela en creator-ia.com/promo/landing desde escritorio con la ventana
//    maximizada (en móvil el canvas se enmarca 16:9 centrado con bandas negras),
// 2) grábala con QuickTime (Mac) o la grabación nativa del SO,
// 3) recorta y súbela como /public/promo-landing.mp4 — la sección "Míralo en
//    acción" del /index la toma directo del poster/src.
// Loop de ~17s en 4 escenas con barra de progreso tipo stories arriba.
//
// Nota: el ícono flotante de PerformanceMonitor (abajo-derecha) SOLO existe
// en dev (`import.meta.env.DEV`). En producción no sale, así que la grabación
// desde creator-ia.com queda limpia.
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Sparkles, Image as ImageIcon, Code2, FileText, MessageSquare, Zap, Check, Volume2, VolumeX, ArrowRight } from "lucide-react";

const SCENES = [
  { key: "hook", durationMs: 3500 },
  { key: "tools", durationMs: 4500 },
  { key: "demo", durationMs: 5000 },
  { key: "cta", durationMs: 4500 },
] as const;

const TOTAL = SCENES.reduce((a, s) => a + s.durationMs, 0);

export default function PromoLanding() {
  const [elapsed, setElapsed] = useState(0);
  // Arranca muted: los browsers bloquean autoplay con sonido. El toggle lo
  // activa cuando Sebastián está listo para grabar.
  const [muted, setMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - start) % TOTAL), 50);
    return () => clearInterval(id);
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    const a = audioRef.current;
    if (!a) return;
    a.muted = next;
    if (!next) a.play().catch(() => { /* sin music file o bloqueo del browser */ });
  };

  let acc = 0;
  const current = SCENES.find((s) => {
    acc += s.durationMs;
    return elapsed < acc;
  })?.key ?? "hook";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
      <Helmet>
        <title>Creator IA Pro — Promo horizontal</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Canvas 16:9 — en escritorio con ventana ancha ocupa todo; si la ventana
          es más vertical que 16:9, el canvas se enmarca y deja bandas negras
          laterales (para que al grabar siempre se vea 16:9 limpio). */}
      <div
        className="relative overflow-hidden bg-[#070C0F] shadow-2xl"
        style={{
          aspectRatio: "16/9",
          width: "min(100vw, calc(100vh * 16 / 9))",
          height: "min(100vh, calc(100vw * 9 / 16))",
        }}
      >
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="landing-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#5be9a0" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#landing-dots)" />
        </svg>

        {/* Barra de progreso tipo stories arriba */}
        <div className="absolute top-6 left-8 right-8 flex gap-2 z-20">
          {SCENES.map((s, i) => {
            const scenesSoFar = SCENES.slice(0, i).reduce((a, x) => a + x.durationMs, 0);
            const sceneElapsed = Math.max(0, Math.min(s.durationMs, elapsed - scenesSoFar));
            const pct = (sceneElapsed / s.durationMs) * 100;
            return (
              <div key={s.key} className="flex-1 h-0.5 bg-white/15 rounded-full overflow-hidden">
                <div className="h-full bg-white/90" style={{ width: `${pct}%`, transition: "width 50ms linear" }} />
              </div>
            );
          })}
        </div>

        {/* Watermark creator-ia.com abajo-izq, visible toda la escena */}
        <div className="absolute bottom-6 left-8 z-20 flex items-center gap-2 opacity-60">
          <div className="w-6 h-6 rounded-lg bg-[#5be9a0] flex items-center justify-center">
            <span className="text-[11px] font-black text-black">C</span>
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-white/70">creator-ia.com</span>
        </div>

        <AnimatePresence mode="wait">
          {current === "hook" && (
            <motion.div
              key="hook"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center px-20"
            >
              <div className="grid grid-cols-[1fr_auto] gap-16 items-center max-w-6xl">
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5be9a0]/10 border border-[#5be9a0]/30 mb-6"
                  >
                    <Zap className="h-3 w-3 text-[#5be9a0]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5be9a0]">Creator IA Pro</span>
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="text-7xl leading-[1.02] font-black text-white tracking-tight mb-6"
                  >
                    ¿Pagas <span className="text-[#5be9a0]">5 apps de IA</span><br />distintas?
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-2xl text-white/60 font-medium"
                  >
                    Hay una que las junta todas.
                  </motion.p>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
                  className="w-56 h-56 rounded-[2.5rem] bg-[#5be9a0] flex items-center justify-center shadow-2xl shadow-[#5be9a0]/40"
                >
                  <span className="text-9xl font-black text-black">C</span>
                </motion.div>
              </div>
            </motion.div>
          )}

          {current === "tools" && (
            <motion.div
              key="tools"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-16"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-[11px] font-black uppercase tracking-[0.3em] text-[#5be9a0] mb-6"
              >
                Un solo chat · todo adentro
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-5xl font-black text-white tracking-tight mb-10 text-center"
              >
                21 modelos. 11 expertos. <span className="text-[#5be9a0]">Un chat.</span>
              </motion.h2>
              <div className="grid grid-cols-4 gap-5 w-full max-w-4xl">
                {[
                  { icon: MessageSquare, label: "Chatear con IA", desc: "GPT-5, Claude, Gemini", color: "text-blue-400" },
                  { icon: ImageIcon, label: "Generar imágenes", desc: "Flux, Nano-banana", color: "text-pink-400" },
                  { icon: Code2, label: "Construir apps", desc: "React, HTML, Next", color: "text-indigo-400" },
                  { icon: FileText, label: "Analizar contratos", desc: "PDF, Word, texto", color: "text-amber-400" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 16, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 180 }}
                    className="rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col items-start gap-3"
                  >
                    <item.icon className={`h-10 w-10 ${item.color}`} />
                    <span className="text-base font-black text-white uppercase tracking-wide leading-tight">{item.label}</span>
                    <span className="text-[11px] text-white/50 font-medium">{item.desc}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {current === "demo" && (
            <motion.div
              key="demo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center px-20"
            >
              <div className="grid grid-cols-[1fr_1fr] gap-16 items-center w-full max-w-6xl">
                <div>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-[11px] font-black uppercase tracking-[0.3em] text-[#5be9a0] mb-4"
                  >
                    Un ejemplo real
                  </motion.p>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-5xl font-black text-white tracking-tight mb-6 leading-[1.05]"
                  >
                    "Analiza <br />este contrato <br />y hazme la portada"
                  </motion.h2>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-2.5"
                  >
                    {["3 riesgos detectados", "Resumen ejecutivo listo", "Portada generada en 8s"].map((item, i) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + i * 0.2 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#5be9a0]/15 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-[#5be9a0]" />
                        </div>
                        <span className="text-base text-white/90 font-medium">{item}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
                  className="relative aspect-square rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-2xl shadow-purple-500/40"
                >
                  <Sparkles className="h-24 w-24 text-white/80" />
                  <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur">
                    <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Imagen generada</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {current === "cta" && (
            <motion.div
              key="cta"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center px-16 text-center"
            >
              <div className="max-w-3xl">
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-[12px] font-black uppercase tracking-[0.4em] text-[#5be9a0] mb-5"
                >
                  Plan Pro · el más popular
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-8xl font-black text-white tracking-tight mb-4 leading-none"
                >
                  $349.900<span className="text-3xl text-white/50">/mes</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-lg text-white/60 font-medium mb-8"
                >
                  3.000 créditos · GPT-5 y Claude · chats simultáneos · soporte prioritario
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.85 }}
                  className="text-[12px] font-black uppercase tracking-[0.4em] text-white/70 mb-3"
                >
                  Pruébalo gratis en
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-black text-lg font-black uppercase tracking-widest shadow-2xl shadow-white/20"
                >
                  creator-ia.com
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.span>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="text-sm text-white/40 font-medium mt-5"
                >
                  Sin tarjeta · 100 créditos de regalo
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio opcional — si subes /public/promo-music.mp3 royalty-free, se
            reproduce al desmutear. Botón mute/unmute arriba a la derecha. */}
        <audio ref={audioRef} src="/promo-music.mp3" loop muted preload="auto" />
        <button
          onClick={toggleMute}
          aria-label={muted ? "Activar sonido" : "Silenciar"}
          title={muted ? "Activar sonido" : "Silenciar"}
          className="absolute top-5 right-5 z-30 w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
