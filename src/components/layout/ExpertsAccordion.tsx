import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Assistant } from "@/lib/assistants";

// Sección "Expertos" del sidebar — la usan tanto Basalt (BasaltShellSidebar)
// como cada Experto (Assistant.tsx), homologada acá para que no se
// desincronicen otra vez (pedido directo del usuario, 2026-09-29: "expertos
// en un dropdown o acordeón"). Colapsada por defecto salvo que el experto
// activo esté en la lista, para no esconder dónde está parado el usuario.
export function ExpertsAccordion({
  experts, activeSlug, onSelect,
}: {
  experts: Assistant[];
  activeSlug?: string;
  onSelect: (a: Assistant) => void;
}) {
  const [open, setOpen] = useState(() => experts.some((a) => a.slug === activeSlug));
  // Mientras cargaban, la sección entera desaparecía del menú: se veía igual que
  // "no hay expertos". Ahora se anuncia que están en camino.
  if (experts.length === 0) return <div className="asst-switcher-label">Expertos · cargando…</div>;

  return (
    <div>
      <button
        className="asst-switcher-label asst-accordion-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Expertos
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div>
          {experts.map((a) => (
            <button
              key={a.slug}
              className={`asst-switch-item ${a.slug === activeSlug ? "active" : ""}`}
              onClick={() => onSelect(a)}
              title={a.tagline || a.name}
            >
              <span className="asst-switch-dot" style={a.slug === activeSlug ? undefined : { background: "var(--asst-txt-3)" }} />
              {a.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
