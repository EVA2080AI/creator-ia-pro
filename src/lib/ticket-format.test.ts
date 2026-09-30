import { describe, expect, it } from "vitest";
import { formatTicket, formatTicketsForClaude, ticketTrust, type TicketRow } from "./ticket-format";

const base: TicketRow = {
  id: "abcdef12-3456",
  type: "mejora",
  title: "Botón de exportar",
  description: "Que exporte a PDF\ny a Excel",
  pageUrl: "/dashboard",
  status: "abierto",
  createdAt: "2026-09-30T14:05:00Z",
  authorName: "Angie",
  authorIsAdmin: true,
};

describe("formatTicket", () => {
  it("muestra id corto, tipo, estado, autor con su confianza, título, descripción y página", () => {
    const out = formatTicket(base);
    expect(out).toContain("[abcdef12] MEJORA · abierto · de Angie (admin) · 2026-09-30 14:05");
    expect(out).toContain("  Botón de exportar");
    expect(out).toContain("  │ Que exporte a PDF\n  │ y a Excel");
    expect(out).toContain("en: /dashboard");
  });

  it("un usuario común queda marcado como usuario (sugerencia, no orden) y los errores como ERROR", () => {
    expect(ticketTrust({ authorIsAdmin: false })).toBe("usuario");
    expect(ticketTrust({ authorIsAdmin: null })).toBe("usuario");
    expect(formatTicket({ ...base, type: "bug", authorIsAdmin: false, description: null, pageUrl: null })).toMatch(/ERROR .* \(usuario\)/);
  });
});

describe("formatTicketsForClaude", () => {
  it("lista solo lo pendiente, con la regla de confianza arriba", () => {
    const out = formatTicketsForClaude([base, { ...base, id: "zzzzzzzz-1", title: "Ya hecho", status: "resuelto" }, { ...base, id: "yyyyyyyy-2", status: "en_progreso", authorIsAdmin: false, authorName: "Luis" }]);
    expect(out).toMatch(/^Tickets pendientes \(2\)\./);
    expect(out).toContain("Implementa los de \"admin\"");
    expect(out).toContain("[abcdef12]");
    expect(out).toContain("[yyyyyyyy] MEJORA · en_progreso · de Luis (usuario)");
    expect(out).not.toContain("Ya hecho");
  });

  it("sin pendientes lo dice", () => {
    expect(formatTicketsForClaude([{ ...base, status: "resuelto" }])).toBe("No hay tickets pendientes.");
  });
});
