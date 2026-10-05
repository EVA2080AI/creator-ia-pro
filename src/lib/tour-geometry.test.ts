import { describe, expect, it } from "vitest";
import { haloRect, placeTooltip } from "./tour-geometry";

// iPhone 13: 390x664. Es el tamaño donde todo esto se rompe primero.
const VW = 390;
const VH = 664;

describe("placeTooltip", () => {
  it("va debajo del objetivo cuando cabe", () => {
    const p = placeTooltip({ top: 100, left: 20, width: 200, height: 40 }, 150, VW, VH);
    expect(p.side).toBe("abajo");
    expect(p.top).toBeGreaterThan(140);
    expect(p.top + 150).toBeLessThanOrEqual(VH - 12);
  });

  it("salta arriba cuando el objetivo está pegado al fondo (el compositor)", () => {
    const p = placeTooltip({ top: VH - 80, left: 20, width: 350, height: 60 }, 150, VW, VH);
    expect(p.side).toBe("arriba");
    expect(p.top).toBeGreaterThanOrEqual(12);
    expect(p.top + 150).toBeLessThanOrEqual(VH - 80);
  });

  it("nunca se sale por los lados aunque el objetivo esté en una esquina", () => {
    const izq = placeTooltip({ top: 50, left: 0, width: 36, height: 36 }, 120, VW, VH);
    expect(izq.left).toBe(12);
    const der = placeTooltip({ top: 50, left: VW - 36, width: 36, height: 36 }, 120, VW, VH);
    expect(der.left + der.width).toBeLessThanOrEqual(VW - 12);
  });

  it("en un teléfono la tarjeta usa el ancho disponible, no los 340 fijos", () => {
    const p = placeTooltip({ top: 50, left: 10, width: 100, height: 30 }, 120, 320, VH);
    expect(p.width).toBe(320 - 24);
  });

  it("si no cabe ni arriba ni abajo, se queda dentro de la pantalla", () => {
    // Objetivo gigante (ocupa casi todo): la tarjeta se ancla arriba con margen mínimo.
    const p = placeTooltip({ top: 20, left: 0, width: VW, height: VH - 40 }, 200, VW, VH);
    expect(p.top).toBe(12);
  });
});

describe("haloRect", () => {
  it("rodea al objetivo con su margen", () => {
    const h = haloRect({ top: 100, left: 50, width: 80, height: 40 }, VW, VH);
    expect(h).toEqual({ top: 94, left: 44, width: 92, height: 52 });
  });

  it("no se sale de la pantalla con un objetivo en el borde", () => {
    const h = haloRect({ top: 0, left: 0, width: 36, height: 36 }, VW, VH);
    expect(h.top).toBe(4);
    expect(h.left).toBe(4);
  });
});
