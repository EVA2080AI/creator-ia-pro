import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CanvasPanel } from "./CanvasPanel";
import { WHOLE_MESSAGE, docArtifact, type CanvasArtifact } from "@/lib/canvas";

// La vista previa real necesita un navegador (sucrase + esm.sh, mermaid): acá se reemplaza
// por un documento fijo y se prueba lo que es del panel.
const buildArtifactDoc = vi.fn(async () => "<!DOCTYPE html><html><body>vista</body></html>");
vi.mock("@/lib/canvas-preview", () => ({ buildArtifactDoc: (...args: unknown[]) => buildArtifactDoc(...(args as [])) }));

const react: CanvasArtifact = {
  kind: "react", title: "Componente React",
  files: [{ name: "App.tsx", lang: "tsx", code: "export default function App() { return <b>hola</b>; }" }],
};
const proyecto: CanvasArtifact = {
  kind: "web", title: "Trigo",
  files: [{ name: "index.html", lang: "html", code: "<h1>Trigo</h1>" }, { name: "styles.css", lang: "css", code: "h1{color:red}" }],
};

function setup(artifact: CanvasArtifact, extra: Partial<React.ComponentProps<typeof CanvasPanel>> = {}) {
  const props = {
    artifact, target: { msgId: "m1", index: 0 }, versions: [{ msgId: "m1", index: 0, artifact }], streaming: false, theme: "light",
    onSelect: vi.fn(), onClose: vi.fn(), onAsk: vi.fn(), ...extra,
  };
  const view = render(<CanvasPanel {...props} />);
  return { ...props, ...view };
}

describe("CanvasPanel", () => {
  beforeEach(() => buildArtifactDoc.mockClear());

  it("mientras Basalt escribe muestra el código llegar, no una vista previa a medias", () => {
    setup(react, { streaming: true });
    expect(screen.getByRole("status")).toHaveTextContent("Escribiendo");
    expect(screen.getByRole("tab", { name: "Código" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Código de App.tsx")).toHaveTextContent("export default function App()");
    expect(buildArtifactDoc).not.toHaveBeenCalled();
  });

  it("al terminar pasa sola a la vista previa, en un iframe aislado", async () => {
    const { rerender, ...props } = setup(react, { streaming: true });
    rerender(<CanvasPanel {...props} streaming={false} />);
    const frame = await screen.findByTitle("Vista previa: Componente React");
    expect(screen.getByRole("tab", { name: "Vista previa" })).toHaveAttribute("aria-selected", "true");
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts allow-forms allow-modals");
    expect(frame.getAttribute("sandbox")).not.toContain("allow-same-origin");
    expect(frame.getAttribute("srcdoc")).toContain("vista");
    expect(buildArtifactDoc).toHaveBeenCalledWith({ kind: "react", files: react.files }, { dark: false });
  });

  it("si el usuario eligió Código, terminar de escribir no lo saca de ahí", () => {
    const { rerender, ...props } = setup(react, { streaming: true });
    fireEvent.click(screen.getByRole("tab", { name: "Código" }));
    rerender(<CanvasPanel {...props} streaming={false} />);
    expect(screen.getByRole("tab", { name: "Código" })).toHaveAttribute("aria-selected", "true");
  });

  it("con varios archivos, la pestaña Código deja elegir cuál ver", () => {
    setup(proyecto);
    fireEvent.click(screen.getByRole("tab", { name: "Código" }));
    expect(screen.getByLabelText("Código de index.html")).toHaveTextContent("<h1>Trigo</h1>");
    fireEvent.click(screen.getByRole("tab", { name: "styles.css" }));
    expect(screen.getByLabelText("Código de styles.css")).toHaveTextContent("h1{color:red}");
    expect(screen.getByTitle("Descargar todos los archivos en un ZIP")).toBeInTheDocument();
  });

  it("un error de la vista previa aparece en la consola y se puede pedir el arreglo SIN enviarlo", async () => {
    const { onAsk } = setup(react);
    const frame = (await screen.findByTitle("Vista previa: Componente React")) as HTMLIFrameElement;
    act(() => {
      window.dispatchEvent(new MessageEvent("message", { data: { __basalt: 1, t: "error", m: "precio is not defined" }, source: frame.contentWindow }));
    });
    expect(await screen.findByText("precio is not defined")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Pedir que lo arregle/ }));
    expect(onAsk).toHaveBeenCalledTimes(1);
    expect(onAsk).toHaveBeenCalledWith(expect.stringContaining("precio is not defined"));
    expect(onAsk).toHaveBeenCalledWith(expect.stringContaining("Componente React"));
  });

  it("ignora mensajes que no vienen de su iframe", async () => {
    setup(react);
    await screen.findByTitle("Vista previa: Componente React");
    act(() => { window.dispatchEvent(new MessageEvent("message", { data: { __basalt: 1, t: "error", m: "de otro lado" }, source: window })); });
    expect(screen.queryByText("de otro lado")).toBeNull();
  });

  it("una respuesta como documento: se lee dibujada y ofrece Word e imprimir", () => {
    const doc = docArtifact("# Plan de mercadeo\n\nDiagnóstico de la marca.\n\n| Día | Tema |\n|---|---|\n| Lunes | Pan |");
    const { container } = setup(doc, { target: { msgId: "m1", index: WHOLE_MESSAGE }, versions: [] });
    expect(screen.getByRole("tab", { name: "Documento" })).toHaveAttribute("aria-selected", "true");
    expect(container.querySelector(".asst-canvas-doc table")).not.toBeNull();
    expect(screen.getByRole("button", { name: /Word/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Imprimir/ })).toBeInTheDocument();
    expect(buildArtifactDoc).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("tab", { name: "Markdown" }));
    expect(screen.getByLabelText(/Código de plan-de-mercadeo\.md/)).toHaveTextContent("# Plan de mercadeo");
  });

  it("con más de una cosa creada, el selector salta entre ellas", () => {
    const versions = [{ msgId: "m1", index: 0, artifact: react }, { msgId: "m2", index: 0, artifact: proyecto }];
    const { onSelect } = setup(react, { versions });
    fireEvent.change(screen.getByLabelText("Cambiar a otra cosa creada en esta conversación"), { target: { value: "m2:0" } });
    expect(onSelect).toHaveBeenCalledWith({ msgId: "m2", index: 0 });
  });

  it("cerrar avisa a la página; recargar vuelve a montar el iframe", async () => {
    const { onClose } = setup(react);
    const before = await screen.findByTitle("Vista previa: Componente React");
    fireEvent.click(screen.getByRole("button", { name: "Recargar la vista previa" }));
    await waitFor(() => expect(screen.getByTitle("Vista previa: Componente React")).not.toBe(before));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar el Canvas" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
