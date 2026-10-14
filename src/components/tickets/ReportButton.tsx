import { useState } from "react";
import { Ticket } from "lucide-react";
import { ReportModal } from "./ReportModal";

// Pastilla "Ticket" SIEMPRE visible en la barra superior (Basalt, Expertos y el
// shell de páginas). El modal ya existía pero solo se abría desde el menú de
// cuenta de la sidebar y nadie lo encontraba — pedido 2026-10-14: "que Johanna
// encuentre la opción de tickets en la parte superior". No es un botón flotante
// (la auditoría UX los vetó): va en el flujo de la barra, como Duplicar.
export function ReportButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="asst-dup-btn asst-ticket-btn"
        onClick={() => setOpen(true)}
        title="Reportar un error o pedir una mejora"
        aria-label="Enviar un ticket de mejora o error"
      >
        <Ticket className="w-3.5 h-3.5" aria-hidden /> <span>Ticket</span>
      </button>
      <ReportModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
