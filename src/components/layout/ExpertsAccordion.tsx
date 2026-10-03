import { useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Plus } from "lucide-react";
import type { Assistant } from "@/lib/assistants";

// Sección "Expertos" del sidebar — la usan tanto Basalt (BasaltShellSidebar)
// como cada Experto (Assistant.tsx), homologada acá para que no se
// desincronicen otra vez (pedido directo del usuario, 2026-09-29: "expertos
// en un dropdown o acordeón"). Colapsada por defecto salvo que el experto
// activo esté en la lista, para no esconder dónde está parado el usuario.
//
// Los propios van en su propio grupo, con lápiz para editarlos: la API de
// asistentes personalizados existía desde hacía semanas y no había por dónde
// entrar (ver src/pages/ExpertEditor.tsx).
export function ExpertsAccordion({
  experts, activeSlug, onSelect, onCreate, onEdit,
}: {
  experts: Assistant[];
  activeSlug?: string;
  onSelect: (a: Assistant) => void;
  onCreate?: () => void;
  onEdit?: (a: Assistant) => void;
}) {
  const [open, setOpen] = useState(() => experts.some((a) => a.slug === activeSlug));
  const propios = experts.filter((a) => a.visibility !== "system");
  const sistema = experts.filter((a) => a.visibility === "system");
  // Mientras cargaban, la sección entera desaparecía del menú: se veía igual que
  // "no hay expertos". Ahora se anuncia que están en camino.
  if (experts.length === 0) return <div className="asst-switcher-label">Expertos · cargando…</div>;

  const fila = (a: Assistant, editable: boolean) => (
    <div key={a.slug} className="asst-conv-row">
      <button
        className={`asst-switch-item ${a.slug === activeSlug ? "active" : ""}`}
        onClick={() => onSelect(a)}
        title={a.tagline || a.name}
        style={{ flex: 1, minWidth: 0 }}
      >
        <span className="asst-switch-dot" style={a.slug === activeSlug ? undefined : { background: "var(--asst-txt-3)" }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
      </button>
      {editable && onEdit && (
        <button
          className="asst-icon-btn asst-row-btn"
          onClick={() => onEdit(a)}
          aria-label={`Editar ${a.name}`}
          title="Editar este experto"
        >
          <Pencil className="w-3.5 h-3.5" aria-hidden />
        </button>
      )}
    </div>
  );

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
          {sistema.map((a) => fila(a, false))}
          {!!propios.length && <div className="asst-group-label">Mis expertos</div>}
          {propios.map((a) => fila(a, true))}
          {onCreate && (
            <button className="asst-switch-item asst-create-expert" onClick={onCreate}>
              <Plus className="w-3.5 h-3.5" aria-hidden /> Crear un experto
            </button>
          )}
        </div>
      )}
    </div>
  );
}
