import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { TicketsTab } from "./TicketsTab";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const tickets = [
  { id: "aaaaaaaa-1", userId: "u1", type: "mejora", title: "Exportar a PDF", description: "Desde el dashboard", pageUrl: "/dashboard", status: "abierto", createdAt: "2026-09-30T10:00:00Z", authorName: "Angie", authorIsAdmin: true },
  { id: "bbbbbbbb-2", userId: "u2", type: "bug", title: "El botón no responde", description: null, pageUrl: "/tasks", status: "resuelto", createdAt: "2026-09-29T10:00:00Z", authorName: "Luis", authorIsAdmin: false },
  { id: "cccccccc-3", userId: "u2", type: "mejora", title: "Modo compacto", description: null, pageUrl: null, status: "en_progreso", createdAt: "2026-09-28T10:00:00Z", authorName: "Luis", authorIsAdmin: false },
];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, tickets }) })));
});
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("TicketsTab", () => {
  it("muestra el autor con la marca admin, los conteos por estado y los pendientes primero", async () => {
    render(<TicketsTab />);
    await screen.findByText("Exportar a PDF");
    expect(screen.getByText("admin")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Todos · 3" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Abierto · 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Resuelto · 1" })).toBeTruthy();
    const order = screen.getAllByRole("combobox").map((s) => (s as HTMLSelectElement).value);
    expect(order).toEqual(["abierto", "en_progreso", "resuelto"]);
  });

  it("filtra por estado y por tipo", async () => {
    render(<TicketsTab />);
    await screen.findByText("Exportar a PDF");
    fireEvent.click(screen.getByRole("button", { name: "Resuelto · 1" }));
    expect(screen.queryByText("Exportar a PDF")).toBeNull();
    expect(screen.getByText("El botón no responde")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Todos · 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Mejoras" }));
    expect(screen.queryByText("El botón no responde")).toBeNull();
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
  });

  it("'Copiar pendientes para Claude' copia solo lo pendiente, con la regla de confianza", async () => {
    const writeText = vi.fn(async (_text: string) => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<TicketsTab />);
    await screen.findByText("Exportar a PDF");
    fireEvent.click(screen.getByRole("button", { name: /Copiar pendientes para Claude/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const text = writeText.mock.calls[0][0];
    expect(text).toMatch(/Tickets pendientes \(2\)/);
    expect(text).toContain("de Angie (admin)");
    expect(text).toContain("de Luis (usuario)");
    expect(text).not.toContain("El botón no responde");
    expect(toast.success).toHaveBeenCalled();
  });

  it("sin tickets muestra el estado vacío", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, tickets: [] }) })));
    render(<TicketsTab />);
    expect(await screen.findByText("Sin tickets todavía.")).toBeTruthy();
    expect(within(document.body).queryByRole("button", { name: /Copiar pendientes/ })).toBeNull();
  });
});
