import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PromptPicker } from "./PromptPicker";
import { ATTACH_CARD_PROMPT } from "@/lib/doc-context";

const CARDS = [
  { label: "Plan de mercadeo", icon: "chart", prompt: "Ayúdame a crear un plan de mercadeo para mi negocio." },
  { label: "Analizar un contrato", icon: "file", prompt: ATTACH_CARD_PROMPT },
  { label: "Pieza gráfica", icon: "image", prompt: "Diseña una pieza gráfica para Instagram." },
];

function setup(current = "") {
  const onPick = vi.fn();
  const onAttach = vi.fn();
  render(<PromptPicker cards={CARDS} current={current} onPick={onPick} onAttach={onAttach} />);
  return { onPick, onAttach };
}

describe("PromptPicker", () => {
  it("es un selector cerrado: las ideas no están en pantalla hasta abrirlo", () => {
    setup();
    expect(screen.getByRole("button", { name: /Elige una idea para empezar/ })).toBeInTheDocument();
    expect(screen.queryByRole("option")).toBeNull();
  });

  it("al abrirlo muestra cada idea con el texto que va a escribir", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Elige una idea/ }));
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByText("Ayúdame a crear un plan de mercadeo para mi negocio.")).toBeInTheDocument();
  });

  it("elegir una idea entrega su texto para el compositor y cierra la lista — no envía nada", () => {
    const { onPick, onAttach } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Elige una idea/ }));
    fireEvent.click(screen.getByRole("option", { name: /Plan de mercadeo/ }));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith("Ayúdame a crear un plan de mercadeo para mi negocio.");
    expect(onAttach).not.toHaveBeenCalled();
    expect(screen.queryByRole("option")).toBeNull();
  });

  it("la idea de adjuntar abre el selector de archivos y nunca escribe el centinela en el chat", () => {
    const { onPick, onAttach } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Elige una idea/ }));
    const fila = screen.getByRole("option", { name: /Analizar un contrato/ });
    expect(fila).toHaveTextContent("Adjuntar");
    expect(fila).not.toHaveTextContent(ATTACH_CARD_PROMPT);
    fireEvent.click(fila);
    expect(onAttach).toHaveBeenCalledTimes(1);
    expect(onPick).not.toHaveBeenCalled();
  });

  it("mientras el compositor tenga ese texto, el selector dice cuál idea se eligió", () => {
    setup("Diseña una pieza gráfica para Instagram.");
    expect(screen.getByRole("button", { name: /Pieza gráfica/ })).toBeInTheDocument();
    expect(screen.getByText(/ajústala a tu caso y envíala/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Pieza gráfica/ }));
    expect(screen.getByRole("option", { name: /Pieza gráfica/ })).toHaveAttribute("aria-selected", "true");
  });

  it("si el usuario ya editó el texto, vuelve a ofrecer elegir", () => {
    setup("Diseña una pieza gráfica para Instagram de mi panadería.");
    expect(screen.getByRole("button", { name: /Elige una idea para empezar/ })).toBeInTheDocument();
  });

  it("Escape cierra la lista", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Elige una idea/ }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("option")).toBeNull();
  });

  it("sin ideas no pinta nada", () => {
    const { container } = render(<PromptPicker cards={[]} current="" onPick={() => {}} onAttach={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
