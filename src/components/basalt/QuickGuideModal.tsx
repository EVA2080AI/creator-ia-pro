import { X, MessageSquare, Users, Brain, Scale, LayoutGrid } from "lucide-react";
import { markBasaltGuideSeen } from "@/lib/basalt-guide";

const STEPS = [
  {
    icon: MessageSquare,
    title: "Conversa como con Gemini o ChatGPT",
    desc: "Escríbele lo que necesites: dudas, ideas, planes. Si le pides una app o un sitio web, también te la construye completa.",
  },
  {
    icon: Users,
    title: "Expertos",
    desc: "En el menú tienes asistentes especializados por área (marketing, legal, etc.) — mismo chat, enfoque distinto según lo que necesites.",
  },
  {
    icon: Brain,
    title: "Memoria",
    desc: "Basalt recuerda datos que le cuentas entre conversaciones — tu marca, tu negocio, tus preferencias — para no repetírselos cada vez.",
  },
  {
    icon: Scale,
    title: "Arena IA",
    desc: "Compara varios modelos de IA respondiendo la misma pregunta, lado a lado, para elegir el que mejor te sirva.",
  },
  {
    icon: LayoutGrid,
    title: "Tareas, Proyectos y Perfil",
    desc: "Viven en la misma barra lateral, sección \"Plataforma\" — sin salir de Basalt para ir de un lado a otro.",
  },
];

export function QuickGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  const close = () => {
    markBasaltGuideSeen();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}
      onClick={close}
    >
      <div
        className="w-full max-w-md rounded-[1.75rem] p-6 shadow-2xl"
        style={{ background: "var(--asst-bg)", border: "1px solid var(--asst-border)", color: "var(--asst-txt)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black" style={{ color: "var(--asst-txt)" }}>Guía rápida de Basalt</h2>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--asst-txt-3)" }}>Lo esencial para empezar a sacarle provecho.</p>
          </div>
          <button
            onClick={close}
            className="rounded-lg p-1 shrink-0"
            style={{ color: "var(--asst-txt-3)" }}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3.5 mb-5">
          {STEPS.map((s) => (
            <div key={s.title} className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--asst-panel)", color: "var(--a-accent, #8b5cf6)" }}
              >
                <s.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold" style={{ color: "var(--asst-txt)" }}>{s.title}</p>
                <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: "var(--asst-txt-3)" }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={close}
          className="w-full rounded-xl py-2.5 text-[13px] font-bold"
          style={{ background: "var(--a-accent, #8b5cf6)", color: "#fff" }}
        >
          Entendido, empezar
        </button>
      </div>
    </div>
  );
}
