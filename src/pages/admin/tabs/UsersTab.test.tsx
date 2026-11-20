import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { UsersTab } from "./UsersTab";
import type { AdminUser } from "../types";

vi.mock("@/lib/auth-client", () => ({ authClient: { requestPasswordReset: vi.fn() } }));

const dias = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const user = (over: Partial<AdminUser>): AdminUser => ({
  user_id: over.email!, email: "x@example.com", display_name: null, credits_balance: 5, created_at: dias(40),
  last_sign_in: null, subscription_tier: "free", is_active: true, is_admin: false, ...over,
});

const USERS: AdminUser[] = [
  user({ email: "nueva@example.com", display_name: "Nueva", created_at: dias(1), last_active_at: dias(1), messages: 0, chats: 0, images: 0 }),
  user({ email: "fiel@example.com", display_name: "Fiel", created_at: dias(50), last_active_at: dias(0), messages: 23, chats: 5, images: 1 }),
  user({ email: "ida@example.com", display_name: "Ida", created_at: dias(60), last_active_at: dias(45), messages: 3, chats: 1, images: 0 }),
];

const names = () => screen.getAllByText(/^(Nueva|Fiel|Ida)$/).map((n) => n.textContent);
const setup = (users = USERS) => render(<UsersTab users={users} onRefresh={vi.fn()} onManageCredits={vi.fn()} />);

describe("UsersTab — quién usa la app", () => {
  it("ordena por última actividad: quien la usó hoy va arriba, no quien se registró ayer", () => {
    setup();
    expect(names()).toEqual(["Fiel", "Nueva", "Ida"]);
  });

  it("cada filtro muestra cuántas cuentas tiene y deja solo a esas personas", () => {
    setup();
    const grupo = screen.getByRole("group", { name: /filtrar por actividad/i });
    expect(within(grupo).getByRole("button", { name: /Todos\s*3/ })).toBeTruthy();
    expect(within(grupo).getByRole("button", { name: /Activos hoy\s*1/ })).toBeTruthy();
    expect(within(grupo).getByRole("button", { name: /Últimos 7 días\s*2/ })).toBeTruthy();
    expect(within(grupo).getByRole("button", { name: /Nunca lo usaron\s*1/ })).toBeTruthy();

    fireEvent.click(within(grupo).getByRole("button", { name: /Nunca lo usaron/ }));
    expect(names()).toEqual(["Nueva"]);
    fireEvent.click(within(grupo).getByRole("button", { name: /Activos hoy/ }));
    expect(names()).toEqual(["Fiel"]);
  });

  it("muestra los mensajes de cada persona y dice claro quién nunca la usó", () => {
    setup();
    expect(screen.getAllByText("23").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5 chats · 1 imagen").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Nunca lo usó/i).length).toBeGreaterThan(0);
  });

  it("se puede ordenar por mensajes o volver al orden por registro", () => {
    setup();
    const orden = screen.getByLabelText(/ordenar por/i);
    fireEvent.change(orden, { target: { value: "registro" } });
    expect(names()).toEqual(["Nueva", "Fiel", "Ida"]);
    fireEvent.change(orden, { target: { value: "mensajes" } });
    expect(names()).toEqual(["Fiel", "Ida", "Nueva"]);
  });

  it("si el servidor no mandó la actividad, la lista se ve igual que antes: sin filtros y sin ceros inventados", () => {
    setup(USERS.map(({ last_active_at: _a, messages: _m, chats: _c, images: _i, ...rest }) => rest));
    expect(screen.queryByRole("group", { name: /filtrar por actividad/i })).toBeNull();
    expect(screen.queryByText(/Nunca lo usó/i)).toBeNull();
    expect(names()).toEqual(["Nueva", "Fiel", "Ida"]); // el orden en que llegaron
  });
});
