import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { puedeRecargar, esErrorDeChunk, manejarPreloadError, _reiniciarMarcaEnMemoria } from "./chunk-reload";

/** jsdom no deja reasignar location.reload, así que lo espiamos por defineProperty.
 *  `restaurarLocation` lo devuelve a su sitio: un window.location suplantado que se
 *  queda puesto contagia a cualquier test posterior que lea la URL. */
const LOCATION_ORIGINAL = Object.getOwnPropertyDescriptor(window, "location");

function espiarReload() {
  const reload = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, reload, href: "https://creator-ia.com/tasks" },
  });
  return reload;
}

function restaurarLocation() {
  if (LOCATION_ORIGINAL) Object.defineProperty(window, "location", LOCATION_ORIGINAL);
}

/** Bloquear el almacenamiento hay que hacerlo suplantando `window.sessionStorage`
 *  entero. `vi.spyOn(Storage.prototype, …)` NO sirve: en este jsdom sessionStorage no
 *  hereda de ese prototipo (medido: Object.getPrototypeOf(sessionStorage) ===
 *  Storage.prototype da false y el spy no se activa ni una vez), así que un test escrito
 *  así pasa sin tocar la rama que dice cubrir. */
const SESSION_ORIGINAL = Object.getOwnPropertyDescriptor(window, "sessionStorage");

function bloquearAlmacenamiento() {
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    get() { throw new Error("almacenamiento bloqueado"); },
  });
}

function restaurarAlmacenamiento() {
  if (SESSION_ORIGINAL) Object.defineProperty(window, "sessionStorage", SESSION_ORIGINAL);
}

/** Lo que responde el navegador cuando esta carga de página YA es una recarga. */
function fingirNavegacion(type: "navigate" | "reload") {
  vi.spyOn(performance, "getEntriesByType").mockReturnValue([{ type }] as unknown as PerformanceEntry[]);
}

/** Cada test es una página nueva: la marca en memoria no debe cruzarse. */
function paginaNueva() {
  _reiniciarMarcaEnMemoria();
  sessionStorage.clear();
}

describe("puedeRecargar", () => {
  beforeEach(paginaNueva);
  afterEach(() => { vi.restoreAllMocks(); restaurarAlmacenamiento(); });

  it("deja recargar la primera vez y deja la marca", () => {
    expect(puedeRecargar()).toBe(true);
    expect(sessionStorage.getItem("chunk_reload_at")).toBeTruthy();
  });

  it("no deja recargar dos veces en la misma pagina: eso seria un bucle", () => {
    expect(puedeRecargar()).toBe(true);
    expect(puedeRecargar()).toBe(false);
  });

  it("tampoco deja recargar si la marca es de hace menos de un minuto, aunque la pagina sea nueva", () => {
    sessionStorage.setItem("chunk_reload_at", String(Date.now() - 5_000));
    expect(puedeRecargar()).toBe(false);
  });

  it("vuelve a dejar recargar pasado el minuto", () => {
    sessionStorage.setItem("chunk_reload_at", String(Date.now() - 61_000));
    expect(puedeRecargar()).toBe(true);
  });

  describe("sin almacenamiento (pestana privada, politica de empresa)", () => {
    beforeEach(bloquearAlmacenamiento);

    it("recarga la primera vez: peor es dejar la pantalla de error", () => {
      fingirNavegacion("navigate");
      expect(puedeRecargar()).toBe(true);
    });

    it("NO recarga si el navegador dice que esta pagina ya es una recarga", () => {
      fingirNavegacion("reload");
      expect(puedeRecargar()).toBe(false);
    });

    // La guarda que antes no existia: el catch devolvia true siempre, asi que un chunk
    // que falta de verdad (404 del CDN, un bloqueador) recargaba sin tope.
    it("no recarga dos veces en la misma pagina", () => {
      fingirNavegacion("navigate");
      expect(puedeRecargar()).toBe(true);
      expect(puedeRecargar()).toBe(false);
    });
  });
});

describe("esErrorDeChunk", () => {
  it("reconoce los mensajes de los tres navegadores", () => {
    for (const message of [
      "Failed to fetch dynamically imported module: https://creator-ia.com/assets/Basalt-x.js",
      "Importing a module script failed.",
      "error loading dynamically imported module",
      "Unable to preload CSS for /assets/Assistant-x.css",
    ]) {
      expect(esErrorDeChunk({ name: "TypeError", message })).toBe(true);
    }
    expect(esErrorDeChunk({ name: "ChunkLoadError", message: "nada" })).toBe(true);
  });

  it("no confunde un error normal de la app con uno de chunk", () => {
    expect(esErrorDeChunk({ name: "TypeError", message: "x is not a function" })).toBe(false);
  });
});

describe("manejarPreloadError", () => {
  beforeEach(paginaNueva);
  afterEach(() => { vi.restoreAllMocks(); restaurarLocation(); restaurarAlmacenamiento(); });

  // LA regresión de este módulo. Si alguien vuelve a poner preventDefault(), el catch de
  // Vite deja de lanzar y el import() se cumple con `undefined`: React.lazy lee
  // `.default` de undefined y salen los TypeError que abrieron cinco tickets
  // automáticos en octubre de 2026. Ver el comentario de manejarPreloadError.
  it("NUNCA cancela el error del modulo: tiene que seguir propagandose", () => {
    espiarReload();
    const event = new Event("vite:preloadError", { cancelable: true });
    manejarPreloadError(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it("recarga la primera vez", () => {
    const reload = espiarReload();
    manejarPreloadError(new Event("vite:preloadError", { cancelable: true }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("no recarga de nuevo en la misma pagina, y tampoco cancela el evento", () => {
    const reload = espiarReload();
    manejarPreloadError(new Event("vite:preloadError", { cancelable: true }));
    const segundo = new Event("vite:preloadError", { cancelable: true });
    manejarPreloadError(segundo);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(segundo.defaultPrevented).toBe(false);
  });
});

describe("manejarPreloadError con una hoja de estilos que no llego", () => {
  beforeEach(paginaNueva);
  afterEach(() => { vi.restoreAllMocks(); restaurarLocation(); });

  /** El evento tal como lo arma Vite: el error va en `payload`. */
  function eventoDeCss() {
    const event = new Event("vite:preloadError", { cancelable: true }) as Event & { payload?: unknown };
    event.payload = new Error("Unable to preload CSS for /assets/Assistant-kAaQGJJ-.css");
    return event;
  }

  // Esta SI se cancela, y es la unica. Cancelar en el bucle de deps deja que Vite llame
  // igual a baseModule(), asi que la ruta carga sin esa hoja en vez de caerse entera.
  it("cancela el evento para que la ruta cargue igual, sin esa hoja", () => {
    espiarReload();
    const event = eventoDeCss();
    manejarPreloadError(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("no recarga: si la hoja la bloquea una extension o un proxy, recargar no la trae", () => {
    const reload = espiarReload();
    manejarPreloadError(eventoDeCss());
    expect(reload).not.toHaveBeenCalled();
  });

  it("y no gasta la ventana de recarga, que hace falta para el modulo que si importa", () => {
    espiarReload();
    manejarPreloadError(eventoDeCss());
    expect(puedeRecargar()).toBe(true);
  });
});
