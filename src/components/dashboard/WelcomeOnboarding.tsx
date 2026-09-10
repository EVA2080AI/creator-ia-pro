import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Code2, Layers, ArrowRight } from "lucide-react";
import { markWelcomeOnboardingSeen } from "@/lib/dashboard-onboarding";

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
    desc: "Describe una idea y genera una app React completa, con preview en vivo. También incluye herramientas directas de imágenes, logos y copys.",
    path: "/chat",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  {
    icon: Layers,
    title: "Canvas IA",
    desc: "Arma un flujo visual conectando nodos de IA paso a paso.",
    path: "/studio-flow",
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-100",
  },
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
        className="w-full max-w-2xl bg-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-500/5 to-emerald-500/5 opacity-60 pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-stone-900 tracking-tight mb-2">
              Bienvenido a Creator IA Pro
            </h2>
            <p className="text-sm text-stone-500 font-medium max-w-md mx-auto leading-relaxed">
              Tenés 2 formas de crear con IA. Elegí por dónde empezar —
              podés cambiar de una a otra cuando quieras desde el menú.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {INTENT_OPTIONS.map((opt) => (
              <button
                key={opt.title}
                onClick={() => choose(opt.path)}
                className="group flex items-start gap-3 p-5 rounded-2xl border border-stone-200 bg-white text-left hover:border-primary/40 hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${opt.bg}`}>
                  <opt.icon className={`w-5 h-5 ${opt.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-black text-stone-900">{opt.title}</p>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed mt-1">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={dismiss}
              className="text-xs font-medium text-stone-400 hover:text-stone-700 transition-colors"
            >
              Prefiero explorar por mi cuenta
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
