import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { GitHubExportDialog } from "./GitHubExportDialog";
import { GITHUB_EXPORT_EVENT } from "@/lib/github-export";

// authClient.linkSocial redirige fuera de la app: aquí solo importa que no explote.
vi.mock("@/lib/auth-client", () => ({ authClient: { linkSocial: vi.fn().mockResolvedValue({ error: null }) } }));

const abrir = (archivos = [{ path: "index.html", content: "<h1>hola</h1>" }]) =>
  act(() => {
    window.dispatchEvent(new CustomEvent(GITHUB_EXPORT_EVENT, { detail: { titulo: "Mi tienda", archivos } }));
  });

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

const json = (body: unknown, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);

describe("GitHubExportDialog", () => {
  it("sin OAuth app configurada lo dice y sugiere el ZIP, sin inventar botones", async () => {
    fetchMock.mockReturnValueOnce(json({ ok: true, configured: false, linked: false }));
    render(<GitHubExportDialog />);
    abrir();
    expect(await screen.findByText(/aún no está activada/)).toBeTruthy();
    expect(screen.queryByText(/Conectar mi GitHub/)).toBeNull();
  });

  it("sin vincular ofrece conectar y avisa que habrá que volver a pulsar el botón", async () => {
    fetchMock.mockReturnValueOnce(json({ ok: true, configured: true, linked: false }));
    render(<GitHubExportDialog />);
    abrir();
    expect(await screen.findByText("Conectar mi GitHub")).toBeTruthy();
    expect(screen.getByText(/pulsa de nuevo/)).toBeTruthy();
  });

  it("vinculado: precarga el nombre saneado, sube y muestra el enlace al repo", async () => {
    fetchMock
      .mockReturnValueOnce(json({ ok: true, configured: true, linked: true, username: "sebastian" }))
      .mockReturnValueOnce(json({ ok: true, url: "https://github.com/sebastian/Mi-tienda", repo: "sebastian/Mi-tienda", rama: "main", archivos: 2 }));
    render(<GitHubExportDialog />);
    abrir();
    const input = (await screen.findByDisplayValue("Mi-tienda")) as HTMLInputElement;
    expect(input.value).toBe("Mi-tienda");
    expect(screen.getByText(/github\.com\/sebastian/)).toBeTruthy();
    act(() => {
      screen.getByText(/Crear repositorio y subir/).closest("button")!.click();
    });
    await waitFor(() => expect(screen.getByText(/Abrir sebastian\/Mi-tienda/)).toBeTruthy());
    const [, posted] = fetchMock.mock.calls[1];
    const cuerpo = JSON.parse((posted as RequestInit).body as string);
    expect(cuerpo.repoName).toBe("Mi-tienda");
    expect(cuerpo.privado).toBe(true);
    expect(cuerpo.archivos).toHaveLength(1);
  });

  it("si el nombre ya existe vuelve al formulario con el mensaje, no a un error mudo", async () => {
    fetchMock
      .mockReturnValueOnce(json({ ok: true, configured: true, linked: true, username: "sebastian" }))
      .mockReturnValueOnce(json({ ok: false, code: "NAME_TAKEN", error: "Ya tienes un repositorio llamado «Mi-tienda»." }, false));
    render(<GitHubExportDialog />);
    abrir();
    await screen.findByDisplayValue("Mi-tienda");
    act(() => {
      screen.getByText(/Crear repositorio y subir/).closest("button")!.click();
    });
    expect(await screen.findByText(/Ya tienes un repositorio/)).toBeTruthy();
    expect(screen.getByText(/Crear repositorio y subir/)).toBeTruthy();
  });
});
