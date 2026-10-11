// Página 9:16 pensada para GRABAR, no para visitar:
// 1) ábrela en creator-ia.com/promo/tiktok (preferiblemente desde el navegador
//    del iPhone con pantalla en vertical, o desde Chrome en escritorio con
//    DevTools en modo iPhone 13 para que el canvas ocupe toda la ventana),
// 2) grábala con la Grabación de Pantalla del iPhone o QuickTime,
// 3) subela a TikTok/Reels (ya trae noindex y queda fuera de buscadores).
// Loop de ~17s en 4 escenas (hook, tools, demo, cta) con barra de progreso
// tipo stories arriba.
//
// Nota: el ícono flotante de PerformanceMonitor (abajo-derecha) SOLO existe
// en dev (`import.meta.env.DEV`). En producción no sale, así que la grabación
// desde creator-ia.com queda limpia.
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Sparkles, Image as ImageIcon, Code2, FileText, MessageSquare, Zap, Volume2, VolumeX, ArrowRight } from "lucide-react";

const SCENES = [
  { key: "hook", durationMs: 3500 },
  { key: "tools", durationMs: 4500 },
  { key: "demo", durationMs: 5000 },
  { key: "cta", durationMs: 4500 },
] as const;

const TOTAL = SCENES.reduce((a, s) => a + s.durationMs, 0);

export default function PromoTiktok() {
  const [elapsed, setElapsed] = useState(0);
  // Arranca MUTED por defecto porque los navegadores bloquean autoplay con
  // sonido hasta que haya interacción. El toggle en pantalla deja activar la
  // música cuando Sebastián está listo para grabar.
  const [muted, setMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - start) % TOTAL), 50);
    return () => clearInterval(id);
  }, []);

  // Al desmutear, intenta reproducir — en navegadores que todavía bloquean el
  // play automático, el click sobre el botón ya cuenta como gesto de usuario.
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    const a = audioRef.current;
    if (!a) return;
    a.muted = next;
    if (!next) a.play().catch(() => { /* el navegador puede bloquear si la URL no existe */ });
  };

  let acc = 0;
  const current = SCENES.find((s) => {
    acc += s.durationMs;
    return elapsed < acc;
  })?.key ?? "hook";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
      <Helmet>
        <title>Creator IA Pro — Promo</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* El canvas 9:16: en móvil ocupa todo el viewport; en desktop se enmarca para
          que al grabar la ventana se vea exactamente igual que en móvil. */}
      <div
        className="relative overflow-hidden bg-[#070C0F] shadow-2xl"
        style={{
          aspectRatio: "9/16",
          width: "min(100vw, calc(100vh * 9 / 16))",
          height: "min(100vh, calc(100vw * 16 / 9))",
        }}
      >
        {/* Trama de puntos del modo terminal */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="tiktok-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#5be9a0" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tiktok-dots)" />
        </svg>

        {/* Barra de progreso superior tipo stories */}
        <div className="absolute top-6 left-6 right-6 flex gap-1.5 z-20">
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

        <AnimatePresence mode="wait">
          {current === "hook" && (
            <motion.div
              key="hook"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 180 }}
                className="w-20 h-20 rounded-3xl bg-[#5be9a0]/10 border border-[#5be9a0]/30 flex items-center justify-center mb-8"
              >
                <Zap className="h-10 w-10 text-[#5be9a0]" />
              </motion.div>
              <h1 className="text-[48px] leading-[1.05] font-black text-white tracking-tight mb-5">
                ¿Pagas <span className="text-[#5be9a0]">5 apps de IA</span> distintas?
              </h1>
              <p className="text-xl text-white/60 font-medium leading-snug max-w-[85%]">
                Hay una que las junta todas.
              </p>
            </motion.div>
          )}

          {current === "tools" && (
            <motion.div
              key="tools"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#5be9a0] mb-8">Un solo chat · todo adentro</p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-[320px] mb-8">
                {[
                  { icon: MessageSquare, label: "Chatear", color: "text-blue-400" },
                  { icon: ImageIcon, label: "Imágenes", color: "text-pink-400" },
                  { icon: Code2, label: "Apps", color: "text-indigo-400" },
                  { icon: FileText, label: "Contratos", color: "text-amber-400" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.7, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.12, type: "spring", stiffness: 200 }}
                    className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col items-center gap-3"
                  >
                    <item.icon className={`h-8 w-8 ${item.color}`} />
                    <span className="text-sm font-bold text-white uppercase tracking-wider">{item.label}</span>
                  </motion.div>
                ))}
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-2xl font-black text-white tracking-tight"
              >
                21 modelos. 11 expertos. <span className="text-[#5be9a0]">Un chat.</span>
              </motion.p>
            </motion.div>
          )}

          {current === "demo" && (
            <motion.div
              key="demo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#5be9a0] mb-6">Mira lo que puedes hacer</p>
              <div className="w-full max-w-[340px] rounded-3xl bg-white/[0.03] border border-white/10 p-5 space-y-3">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="ml-auto max-w-[85%] rounded-2xl bg-white/10 px-4 py-3 text-left"
                >
                  <p className="text-[13px] text-white/90">Analiza este contrato y dime los riesgos</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="mr-auto max-w-[90%] rounded-2xl bg-[#5be9a0]/10 border border-[#5be9a0]/20 px-4 py-3 text-left"
                >
                  <p className="text-[13px] text-white/90">
                    <span className="font-bold text-[#5be9a0]">3 riesgos:</span> cláusula de exclusividad, penalización por salida y...
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.7 }}
                  className="ml-auto max-w-[85%] rounded-2xl bg-white/10 px-4 py-3 text-left"
                >
                  <p className="text-[13px] text-white/90">Ahora genera una imagen tipo portada</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.5, type: "spring", stiffness: 200 }}
                  className="mr-auto w-[70%] aspect-square rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 flex items-center justify-center"
                >
                  <Sparkles className="h-10 w-10 text-white/80" />
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
              className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                className="w-24 h-24 rounded-[2rem] bg-[#5be9a0] flex items-center justify-center mb-8"
              >
                <span className="text-5xl font-black text-black">C</span>
              </motion.div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#5be9a0] mb-3">Plan Pro · el más popular</p>
              <h2 className="text-[42px] leading-[1.05] font-black text-white tracking-tight mb-3">
                $349.900<span className="text-xl text-white/50">/mes</span>
              </h2>
              <p className="text-sm text-white/60 font-medium mb-10 max-w-[85%]">
                3.000 créditos · GPT-5 y Claude · chats simultáneos · soporte prioritario
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70 mb-3"
              >
                Pruébalo gratis en
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-3 px-8 py-5 rounded-full bg-white text-black text-base font-black uppercase tracking-widest shadow-2xl shadow-white/20"
              >
                creator-ia.com
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.span>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
                className="text-[11px] text-white/40 font-medium mt-4"
              >
                Sin tarjeta · 100 créditos de regalo
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio opcional — si subes /public/promo-music.mp3 royalty-free, se
            reproduce al desmutear. Si no, no se oye. Botón mute/unmute arriba
            a la derecha para controlar antes de grabar. */}
        <audio ref={audioRef} src="/promo-music.mp3" loop muted preload="auto" />
        <button
          onClick={toggleMute}
          aria-label={muted ? "Activar sonido" : "Silenciar"}
          title={muted ? "Activar sonido" : "Silenciar"}
          className="absolute top-5 right-5 z-30 w-9 h-9 rounded-full bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
