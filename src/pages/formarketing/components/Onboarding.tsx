import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Layers, GitBranch, Play as PlayIcon } from "lucide-react";

const ONBOARDING_STEPS = [
  { icon: Layers,      title: 'Arrastra un nodo',          desc: 'Desde la barra lateral izquierda elige un módulo y arrástralo al canvas.' },
  { icon: GitBranch,   title: 'Conecta los nodos',          desc: 'Haz clic en el punto de salida de un nodo y conéctalo al siguiente.' },
  { icon: PlayIcon,    title: 'Ejecuta el flujo',           desc: 'Presiona ▶ dentro de cada nodo para que la IA genere el contenido.' },
];

export function Onboarding({ step, setStep, onDismiss }: { step: number; setStep: (s: number) => void; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Iridescent background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-pink-500/5 opacity-50 pointer-events-none" />
        
        <div className="relative z-10 text-center">
          <div className="h-20 w-20 rounded-3xl bg-zinc-900 mx-auto flex items-center justify-center shadow-2xl shadow-zinc-900/20 mb-8 border border-zinc-800">
            {step === 0 && <Layers className="h-8 w-8 text-white" />}
            {step === 1 && <GitBranch className="h-8 w-8 text-white" />}
            {step === 2 && <PlayIcon className="h-8 w-8 text-white fill-white" />}
          </div>
          
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-3">
            {ONBOARDING_STEPS[step].title}
          </h2>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-[320px] mx-auto mb-10 opacity-70">
            {ONBOARDING_STEPS[step].desc}
          </p>
          
          <div className="flex items-center justify-center gap-2 mb-10">
            {ONBOARDING_STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-zinc-900' : 'w-1.5 bg-zinc-200'}`} />
            ))}
          </div>
          
          <Button 
            className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
            onClick={() => step === ONBOARDING_STEPS.length - 1 ? onDismiss() : setStep(step + 1)}
          >
            {step === ONBOARDING_STEPS.length - 1 ? '¡Entendido!' : 'Siguiente paso'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
