import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ModelPicker } from "./ModelPicker";
import { CHAT_MODELS, DEFAULT_IMAGE_MODEL_ID, IMAGE_MODELS, canAccessModel } from "@/lib/ai/models";

const freeModel = CHAT_MODELS.find((m) => m.free)!;
const paidModel = CHAT_MODELS.find((m) => !canAccessModel("free", m.minTier))!;

// Los nombres se pisan como prefijo ("Gemini 2.5 Flash" / "… Flash Lite"): se busca por título exacto.
const rowFor = (label: string, scope: HTMLElement = document.body) =>
  within(scope).getAllByRole("option").find((o) => o.querySelector(".asst-picker-row-title")?.firstChild?.textContent === label)!;

function setup(tier: string | undefined) {
  const onModel = vi.fn();
  const onImageModel = vi.fn();
  render(<ModelPicker model={freeModel.id} imageModel={DEFAULT_IMAGE_MODEL_ID} tier={tier} onModel={onModel} onImageModel={onImageModel} />);
  return { onModel, onImageModel, trigger: screen.getByRole("button", { name: new RegExp(freeModel.label) }) };
}

describe("ModelPicker", () => {
  it("el botón muestra el modelo actual y el panel arranca cerrado", () => {
    const { trigger } = setup("free");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("abre el panel, marca el modelo elegido y agrupa texto e imágenes", () => {
    const { trigger } = setup("free");
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: /elegir modelo/i });
    const selected = within(dialog).getAllByRole("option", { selected: true });
    expect(selected.map((o) => o.textContent)).toEqual(expect.arrayContaining([expect.stringContaining(freeModel.label)]));
    expect(within(dialog).getByRole("listbox", { name: /modelos de texto/i })).toBeTruthy();
    expect(within(dialog).getByRole("listbox", { name: /motores de imagen/i })).toBeTruthy();
    // +1: la fila "Auto" (Basalt elige por ti), que no es un modelo del catálogo.
    expect(within(dialog).getAllByRole("option")).toHaveLength(CHAT_MODELS.length + IMAGE_MODELS.length + 1);
  });

  it("la fila Auto existe, va primera, y elegirla manda el id sintético", () => {
    const { trigger, onModel } = setup("free");
    fireEvent.click(trigger);
    const lista = within(screen.getByRole("dialog")).getByRole("listbox", { name: /modelos de texto/i });
    const filas = within(lista).getAllByRole("option");
    expect(filas[0].textContent).toContain("Auto");
    expect(filas[0].textContent).toContain("Gratis");
    fireEvent.click(filas[0]);
    expect(onModel).toHaveBeenCalledWith("auto");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("elegir un modelo permitido lo aplica y cierra el panel", () => {
    const { trigger, onModel } = setup("free");
    fireEvent.click(trigger);
    const other = CHAT_MODELS.find((m) => m.free && m.id !== freeModel.id)!;
    fireEvent.click(rowFor(other.label));
    expect(onModel).toHaveBeenCalledWith(other.id);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("un plan Free ve bloqueados los modelos de pago: deshabilitados, con el plan que piden, y no se pueden elegir", () => {
    const { trigger, onModel } = setup("free");
    fireEvent.click(trigger);
    const row = rowFor(paidModel.label);
    expect((row as HTMLButtonElement).disabled).toBe(true);
    expect(row.getAttribute("title")).toMatch(/Requiere el plan/);
    fireEvent.click(row);
    expect(onModel).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /ver planes/i })).toBeTruthy();
  });

  it("con el plan todavía cargando (tier undefined) no bloquea nada", () => {
    const { trigger } = setup(undefined);
    fireEvent.click(trigger);
    expect(screen.getAllByRole("option").every((o) => !(o as HTMLButtonElement).disabled)).toBe(true);
    expect(screen.queryByRole("link", { name: /ver planes/i })).toBeNull();
  });

  it("elegir un motor de imagen llama a onImageModel, no a onModel", () => {
    const { trigger, onModel, onImageModel } = setup("agencia");
    fireEvent.click(trigger);
    const img = IMAGE_MODELS.find((m) => m.id !== DEFAULT_IMAGE_MODEL_ID)!;
    fireEvent.click(rowFor(img.label, screen.getByRole("listbox", { name: /motores de imagen/i })));
    expect(onImageModel).toHaveBeenCalledWith(img.id);
    expect(onModel).not.toHaveBeenCalled();
  });

  it("Escape cierra el panel y devuelve el foco al botón", () => {
    const { trigger } = setup("free");
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("una flecha abajo mueve el foco a la fila siguiente que se pueda elegir", () => {
    const { trigger } = setup("free");
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog");
    const enabled = within(dialog).getAllByRole("option").filter((o) => !(o as HTMLButtonElement).disabled);
    (enabled[0] as HTMLElement).focus();
    fireEvent.keyDown(enabled[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(enabled[1]);
  });
  it("marca como Lento solo a los modelos con slow:true", () => {
    const { trigger } = setup("agencia");
    fireEvent.click(trigger);
    const slowLabels = CHAT_MODELS.filter((m) => m.slow).map((m) => m.label);
    expect(slowLabels.length).toBeGreaterThan(0);
    const flagged = screen.getAllByRole("option").filter((o) => o.textContent?.includes("Lento")).map((o) => o.querySelector(".asst-picker-row-title")?.firstChild?.textContent);
    expect(flagged).toEqual(slowLabels);
  });
});
