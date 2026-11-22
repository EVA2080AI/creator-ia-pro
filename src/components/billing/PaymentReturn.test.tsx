// El aviso que ve quien vuelve de pagar: qué se le dice en cada estado y cuánto se insiste.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ confirm: vi.fn(), confetti: vi.fn() }));
vi.mock("canvas-confetti", () => ({ default: mocks.confetti }));
vi.mock("@/services/billing-service", async () => {
  const actual = await vi.importActual<typeof import("@/services/billing-service")>("@/services/billing-service");
  return { ...actual, boldService: { ...actual.boldService, confirmPayment: mocks.confirm } };
});

import { PaymentCheckError } from "@/services/billing-service";
import { PaymentReturn } from "./PaymentReturn";
import { RETRY_DELAYS, UNPAID_RETRIES } from "./payment-retry";

let client: QueryClient;
const onClose = vi.fn();

function mount(pack: string | null = "pro", likelyPaid = false) {
  client = new QueryClient();
  vi.spyOn(client, "invalidateQueries");
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PaymentReturn pack={pack} likelyPaid={likelyPaid} onClose={onClose} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Deja resolver la consulta en curso. */
const settle = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
const state = () => screen.getByRole("status").getAttribute("data-payment-state");

beforeEach(() => {
  vi.useFakeTimers();
  mocks.confirm.mockReset();
  mocks.confetti.mockReset();
  onClose.mockReset();
});
afterEach(() => vi.useRealTimers());

describe("PaymentReturn", () => {
  it("mientras consulta dice que está confirmando, y no celebra nada", async () => {
    mocks.confirm.mockReturnValue(new Promise(() => {}));
    mount();
    expect(state()).toBe("checking");
    expect(screen.getByText("Confirmando tu pago con Bold…")).toBeInTheDocument();
    expect(mocks.confirm).toHaveBeenCalledWith("pro");
    expect(mocks.confetti).not.toHaveBeenCalled();
  });

  it("plan aprobado: dice qué plan y cuántos créditos, refresca el perfil y celebra una vez", async () => {
    mocks.confirm.mockResolvedValue({ state: "approved", fresh: true, packId: "pro", credits: 3000, isPlan: true });
    mount();
    await settle();
    expect(state()).toBe("approved");
    expect(screen.getByText("Pago aprobado")).toBeInTheDocument();
    expect(screen.getByText("Tu plan Pro quedó activo por 30 días y se sumaron 3.000 créditos a tu cuenta.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a Basalt" })).toHaveAttribute("href", "/a/basalt");
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["profile"] });
    expect(mocks.confetti).toHaveBeenCalledTimes(1);
    expect(mocks.confirm).toHaveBeenCalledTimes(1);
  });

  it("recarga ya acreditada antes (recargó la página): lo dice sin volver a celebrar", async () => {
    mocks.confirm.mockResolvedValue({ state: "approved", fresh: false, packId: "pack_200", credits: 200, isPlan: false });
    mount("pack_200");
    await settle();
    expect(screen.getByText("Se sumaron 200 créditos a tu cuenta.")).toBeInTheDocument();
    expect(mocks.confetti).not.toHaveBeenCalled();
  });

  it("en proceso: insiste y, cuando Bold aprueba, lo muestra", async () => {
    mocks.confirm
      .mockResolvedValueOnce({ state: "processing" })
      .mockResolvedValueOnce({ state: "processing" })
      .mockResolvedValue({ state: "approved", fresh: true, packId: "pack_1000", credits: 1000, isPlan: false });
    mount("pack_1000");
    await settle();
    expect(state()).toBe("checking");
    expect(screen.getByText("Bold está procesando tu pago…")).toBeInTheDocument();
    await advance(RETRY_DELAYS[0]);
    expect(mocks.confirm).toHaveBeenCalledTimes(2);
    await advance(RETRY_DELAYS[1]);
    expect(mocks.confirm).toHaveBeenCalledTimes(3);
    expect(state()).toBe("approved");
    expect(screen.getByText("Se sumaron 1.000 créditos a tu cuenta.")).toBeInTheDocument();
  });

  it("sigue en proceso después de un minuto: lo explica, deja de insistir y ofrece volver a revisar", async () => {
    mocks.confirm.mockResolvedValue({ state: "processing" });
    mount();
    await settle();
    for (const ms of RETRY_DELAYS) await advance(ms);
    expect(mocks.confirm).toHaveBeenCalledTimes(RETRY_DELAYS.length + 1);
    expect(state()).toBe("processing");
    expect(screen.getByText("Tu pago está en proceso")).toBeInTheDocument();
    await advance(120_000);
    expect(mocks.confirm).toHaveBeenCalledTimes(RETRY_DELAYS.length + 1);

    mocks.confirm.mockResolvedValue({ state: "approved", fresh: true, packId: "pro", credits: 3000, isPlan: true });
    fireEvent.click(screen.getByRole("button", { name: "Volver a revisar" }));
    await settle();
    expect(state()).toBe("approved");
  });

  it("volvió sin pagar: no lo hace esperar un minuto ni afirma que se cobró o no", async () => {
    mocks.confirm.mockResolvedValue({ state: "unpaid" });
    mount();
    await settle();
    for (let i = 0; i < UNPAID_RETRIES; i++) await advance(RETRY_DELAYS[i]);
    expect(mocks.confirm).toHaveBeenCalledTimes(UNPAID_RETRIES + 1);
    expect(state()).toBe("unpaid");
    expect(screen.getByText("No se completó el pago")).toBeInTheDocument();
    expect(screen.getByText(/Si pagaste, los créditos se suman solos/)).toBeInTheDocument();
    expect(mocks.confetti).not.toHaveBeenCalled();
  });

  it("pago de prueba y 'sin compra reciente' se dicen tal cual, sin insistir", async () => {
    mocks.confirm.mockResolvedValue({ state: "sandbox" });
    const first = mount();
    await settle();
    expect(screen.getByText("Pago de prueba")).toBeInTheDocument();
    first.unmount();

    mocks.confirm.mockReset().mockResolvedValue({ state: "none" });
    mount();
    await settle();
    expect(screen.getByText("No encontramos una compra reciente")).toBeInTheDocument();
    await advance(60_000);
    expect(mocks.confirm).toHaveBeenCalledTimes(1);
  });

  it("sesión vencida: manda a iniciar sesión y aclara que el pago no se pierde", async () => {
    mocks.confirm.mockRejectedValue(new PaymentCheckError("Debes iniciar sesión.", "UNAUTHORIZED"));
    mount();
    await settle();
    expect(state()).toBe("error");
    expect(screen.getByText("Inicia sesión para ver tu pago")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/auth");
    expect(screen.queryByRole("button", { name: "Volver a revisar" })).not.toBeInTheDocument();
  });

  it("no se pudo consultar: no inventa un resultado y deja reintentar", async () => {
    mocks.confirm.mockRejectedValue(new PaymentCheckError("No pudimos consultar el pago.", "PROVIDER_ERROR"));
    mount();
    await settle();
    expect(screen.getByText("No pudimos consultar tu pago")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver a revisar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Escríbenos" })).toHaveAttribute("href", "/contact");
  });

  it("cerrar avisa a la página y deja de consultar", async () => {
    mocks.confirm.mockResolvedValue({ state: "processing" });
    const view = mount();
    await settle();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    view.unmount();
    await advance(120_000);
    expect(mocks.confirm).toHaveBeenCalledTimes(1);
  });

  it("pago aprobado que el servidor no pudo acreditar: NO promete que 'se suman solos'", async () => {
    mocks.confirm.mockRejectedValue(new PaymentCheckError("Tu pago está aprobado pero no pudimos sumar los créditos.", "INTERNAL_ERROR"));
    mount();
    await settle();
    expect(state()).toBe("uncredited");
    expect(screen.getByText("Tu pago está aprobado, pero falta sumar los créditos")).toBeInTheDocument();
    expect(screen.queryByText(/se suman solos/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Escríbenos" })).toHaveAttribute("href", "/contact");
    expect(mocks.confetti).not.toHaveBeenCalled();
  });

  it("si el servidor pide espaciar las consultas, vuelve a preguntar en vez de mostrar un error", async () => {
    mocks.confirm
      .mockRejectedValueOnce(new PaymentCheckError("Espera un momento.", "TOO_MANY"))
      .mockResolvedValue({ state: "approved", fresh: true, packId: "pack_200", credits: 200, isPlan: false });
    mount("pack_200");
    await settle();
    expect(state()).toBe("checking");
    await advance(RETRY_DELAYS[0]);
    expect(state()).toBe("approved");
  });

  it("Bold lo devolvió diciendo 'aprobado': insiste el minuto completo antes de decir que no hay pago", async () => {
    mocks.confirm.mockResolvedValue({ state: "unpaid" });
    mount("pro", true);
    await settle();
    for (let i = 0; i < UNPAID_RETRIES; i++) await advance(RETRY_DELAYS[i]);
    expect(state()).toBe("checking");
    for (let i = UNPAID_RETRIES; i < RETRY_DELAYS.length; i++) await advance(RETRY_DELAYS[i]);
    expect(mocks.confirm).toHaveBeenCalledTimes(RETRY_DELAYS.length + 1);
    // Y aun así no celebra ni afirma un pago: eso solo lo decide el servidor.
    expect(state()).toBe("unpaid");
    expect(mocks.confetti).not.toHaveBeenCalled();
  });
});
