import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";
import { _reiniciarMarcaEnMemoria } from "@/lib/chunk-reload";

/** Un hijo que revienta al montar, con el error que se le indique. */
function Reventar({ error }: { error: Error }): never {
  throw error;
}

function errorDeChunk(): Error {
  return new TypeError(
    "Failed to fetch dynamically imported module: https://creator-ia.com/assets/Basalt-DpSxzXkx.js",
  );
}

const LOCATION_ORIGINAL = Object.getOwnPropertyDescriptor(window, "location");

let reload: ReturnType<typeof vi.fn>;
let fetchMock: ReturnType<typeof vi.fn>;
let errorSilenciado: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  reload = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, reload, href: "https://creator-ia.com/tasks" },
  });
  fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));
  vi.stubGlobal("fetch", fetchMock);
  // React escribe el error del boundary por console.error; acá es ruido esperado.
  errorSilenciado = vi.spyOn(console, "error").mockImplementation(() => {});
  // Cada test es una página nueva. Sin esto, la marca en memoria de chunk-reload.ts
  // sobrevive de un test al siguiente y los de más abajo pasan por arrastre en vez de
  // por la ventana de 60s que dicen comprobar: quedan atados al orden de declaración.
  sessionStorage.clear();
  _reiniciarMarcaEnMemoria();
});

afterEach(() => {
  if (LOCATION_ORIGINAL) Object.defineProperty(window, "location", LOCATION_ORIGINAL);
  vi.unstubAllGlobals();
  errorSilenciado.mockRestore();
  vi.clearAllMocks();
});

describe("ErrorBoundary con un error normal de la app", () => {
  it("lo muestra, lo reporta como ticket y ofrece intentar de nuevo", async () => {
    render(
      <ErrorBoundary>
        <Reventar error={new TypeError("x is not a function")} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Algo salió mal")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Intentar de nuevo/ })).toBeTruthy();
    expect(screen.getByText(/^Error ID:/)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith("/api/tickets", expect.objectContaining({ method: "POST" }));
    expect(reload).not.toHaveBeenCalled();
  });
});

describe("ErrorBoundary con un chunk de un despliegue viejo", () => {
  it("recarga una vez y no reporta nada", () => {
    render(
      <ErrorBoundary>
        <Reventar error={errorDeChunk()} />
      </ErrorBoundary>,
    );
    expect(reload).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // Estos tres son la razón de ser del arreglo: cinco tickets automáticos de octubre de
  // 2026 eran ESTO reportado como si fuera un fallo de la app. Si vuelve a abrir ticket,
  // volvemos a tener ruido en el panel; si vuelve a mostrar el Error ID, volvemos a dar
  // un número que no se puede buscar en ninguna parte (el error que se arregló el 5-oct).
  describe("cuando ya recargamos hace menos de un minuto", () => {
    beforeEach(() => {
      sessionStorage.setItem("chunk_reload_at", String(Date.now()));
      render(
        <ErrorBoundary>
          <Reventar error={errorDeChunk()} />
        </ErrorBoundary>,
      );
    });

    it("no entra en bucle de recargas y dice que la app se actualizó, no que algo se rompió", () => {
      expect(reload).not.toHaveBeenCalled();
      expect(screen.getByText("La app se actualizó")).toBeTruthy();
      expect(screen.queryByText("Algo salió mal")).toBeNull();
    });

    it("NO abre ticket: sería uno por pestaña abierta en cada despliegue", () => {
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("NO muestra un Error ID que no lleva a ningún ticket", () => {
      expect(screen.queryByText(/^Error ID:/)).toBeNull();
    });

    it("no ofrece 'Intentar de nuevo', que repetiría el mismo import roto", () => {
      expect(screen.queryByRole("button", { name: /Intentar de nuevo/ })).toBeNull();
      expect(screen.getByRole("button", { name: /Recargar página/ })).toBeTruthy();
    });
  });
});
