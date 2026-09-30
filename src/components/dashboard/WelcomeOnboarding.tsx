import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Code2, Layers, Scale, ArrowRight } from "lucide-react";
import { markWelcomeOnboardingSeen } from "@/lib/dashboard-onboarding";
import { CANVAS_ENABLED } from "@/lib/features";

interface IntentOption {
  icon: typeof Code2;
  title: string;
  desc: string;
  path: string;
  color: string;
  bg: string;
}

// Editor y Aplicaciones ya no son opciones propias: Editor se fusionó dentro
// de Basalt IA (Fase 5) y Aplicaciones también (panel "Herramientas" dentro
// del workspace de Basalt) — quedan 2 formas reales de crear, no 4.
const INTENT_OPTIONS: IntentOption[] = [
  {
    icon: Code2,
    title: "Basalt IA",
    desc: "Convérsale: te ayuda con marketing, imágenes, agentes de IA y también construye tu app o landing completa.",
    path: "/a/basalt",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  // La segunda opción era "Canvas IA — Próximamente": la MITAD de la primera pantalla de
  // un usuario nuevo era una función que todavía no existe y que lo dejaba en un
  // callejón sin salida. Se muestra solo cuando de verdad esté encendida; mientras
  // tanto, el segundo camino son los Expertos, que sí funcionan hoy.
  {
    icon: Scale,
    title: "Expertos",
    desc: "Un especialista por área: legal, mercadeo, finanzas, talento. Súbele un contrato y te lo analiza cláusula por cláusula.",
    path: "/a/legal",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20",
  },
  ...(CANVAS_ENABLED
    ? [{
        icon: Layers,
        title: "Canvas IA",
        desc: "Editor visual para diseñar tus piezas gráficas.",
        path: "/studio-flow",
        color: "text-blue-500 dark:text-blue-400",
        bg: "bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20",
      }]
    : []),
];

export function WelcomeOnboarding({ onDismiss }: { onDismiss: () => void }) {
  const navigate = useNavigate();

  const dismiss = () => {
    markWelcomeOnboardingSeen();
    onDismiss();
  };

  const choose = (path: string) => {
    markWelcomeOnboardingSeen();
    onDismiss();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-card rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-500/5 to-emerald-500/5 opacity-60 pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-foreground tracking-tight mb-2">
              Bienvenido a Creator IA Pro
            </h2>
            <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
              Basalt es tu punto de partida: conversas con él para todo, incluso para
              construir apps y sitios. Elige por dónde empezar.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {INTENT_OPTIONS.map((opt) => (
              <button
                key={opt.title}
                onClick={() => choose(opt.path)}
                className="group flex items-start gap-3 p-5 rounded-2xl border border-border bg-card text-left hover:border-primary/40 hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${opt.bg}`}>
                  <opt.icon className={`w-5 h-5 ${opt.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-black text-foreground">{opt.title}</p>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={dismiss}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Prefiero explorar por mi cuenta
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
