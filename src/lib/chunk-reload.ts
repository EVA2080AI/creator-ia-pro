// Qué hacer cuando un módulo partido (chunk) no carga: casi siempre la pestaña quedó
// abierta sobre un despliegue anterior y los nombres con hash ya no existen. Recargar
// trae el HTML nuevo con los chunks nuevos.
//
// Esto depende de que un chunk que falta devuelva un 404 de verdad. Por eso el fallback
// de la SPA en vercel.json excluye `/assets/`: sin esa exclusion, pedir un chunk de un
// despliegue anterior devolvia 200 con el HTML de index.html (medido en produccion el
// 2026-10-25), y entonces el service worker lo cacheaba bajo la URL del chunk —solo mira
// status===200— y la regla de cabeceras lo marcaba `immutable` por un ano al ser un .js.
//
// Vive aparte porque la misma guarda la necesitan dos sitios —el manejador de
// `vite:preloadError` (src/main.tsx) y el ErrorBoundary, que atrapa el fallo si el
// evento no llegó primero— y antes estaba copiada en los dos con la misma clave y la
// misma ventana escritas a mano.

const CLAVE = "chunk_reload_at";
/** Una sola recarga por minuto: si acabamos de recargar y vuelve a fallar, el problema
 *  no era el despliegue y hay que dejar que el error se vea en vez de entrar en bucle. */
const VENTANA_MS = 60_000;

/** Ya recargamos en ESTA carga de página. No puede vivir en sessionStorage porque hace
 *  falta justamente cuando no hay almacenamiento, y porque un mismo fallo llama a
 *  `puedeRecargar()` dos veces: primero el manejador del evento y después el
 *  ErrorBoundary, que atrapa el error ya propagado. */
let recargadoEnEstaPagina = false;

/** `true` si esta carga de página ya es el resultado de una recarga. Lo dice el propio
 *  navegador, sin almacenamiento de por medio: es el único freno que queda cuando
 *  sessionStorage está bloqueado. */
function venimosDeUnaRecarga(): boolean {
  try {
    const [nav] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    return nav?.type === "reload";
  } catch {
    return false;
  }
}

/** `true` si toca recargar (y deja la marca para que el otro sitio no recargue otra vez). */
export function puedeRecargar(): boolean {
  if (recargadoEnEstaPagina) return false;

  let conAlmacenamiento = true;
  let ultima = 0;
  try {
    ultima = Number(sessionStorage.getItem(CLAVE) || 0);
  } catch {
    conAlmacenamiento = false;
  }

  if (conAlmacenamiento) {
    if (Date.now() - ultima < VENTANA_MS) return false;
  } else if (venimosDeUnaRecarga()) {
    // Pestaña privada o almacenamiento bloqueado por política: antes acá se devolvía
    // `true` siempre, así que la guarda anti-bucle no existía y un chunk que falta de
    // verdad (un 404 del CDN, un bloqueador) recargaba sin tope y el usuario no llegaba
    // ni a leer el error.
    return false;
  }

  recargadoEnEstaPagina = true;
  try {
    sessionStorage.setItem(CLAVE, String(Date.now()));
  } catch { /* contamos con eso: queda la marca en memoria y la del navegador */ }
  return true;
}

/** Solo para los tests: la marca en memoria es de la página, y cada test es una página
 *  nueva en la vida real. */
export function _reiniciarMarcaEnMemoria(): void {
  recargadoEnEstaPagina = false;
}

/** Los mensajes con que Chrome, Safari y Firefox reportan un import() fallido. */
export function esErrorDeChunk(error: { name?: string; message?: string }): boolean {
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError/i.test(
    `${error.name ?? ""} ${error.message ?? ""}`,
  );
}

/** Un preload de hoja de estilos que no llegó. Es el unico `vite:preloadError` que
 *  conviene cancelar, y se distingue por el mensaje que arma Vite al colgar el listener
 *  de error del <link>: `Unable to preload CSS for <dep>`. */
function esFalloDeHojaDeEstilos(payload: unknown): boolean {
  const msg =
    typeof payload === "object" && payload !== null && "message" in payload
      ? String((payload as Error).message)
      : String(payload ?? "");
  return /Unable to preload CSS/i.test(msg);
}

/**
 * Manejador del evento `vite:preloadError`.
 *
 * NUNCA cancela el error del MÓDULO, y eso es el punto entero de esta función. (Sí
 * cancela el de una hoja de estilos, que es otra cosa: ver más abajo.)
 * El helper de Vite (`preload` en el plugin de análisis de imports) hace:
 *
 *     function handlePreloadError(err) { …dispatchEvent(e); if (!e.defaultPrevented) throw err }
 *     return promise.then(() => baseModule().catch(handlePreloadError))
 *
 * Con `preventDefault()` ese `catch` no lanza: **devuelve `undefined`**, así que el
 * `import()` se CUMPLE con `undefined`. Y `location.reload()` es asíncrono, así que la
 * ejecución sigue con ese `undefined` en la mano: React.lazy lee `modulo.default` y los
 * dos shells leen `m.BasaltAppLayout`, y revienta un
 * `TypeError: Cannot read properties of undefined` que ya no se parece a un error de
 * chunk — el ErrorBoundary no lo reconocía y lo reportaba como ticket.
 *
 * Eso fueron CINCO tickets automáticos entre el 13 y el 19 de octubre de 2026, en
 * cinco builds distintos y de cuatro personas: 5312c0dc (/spaces), 5418989f (/tasks),
 * bec56274 (/a/financiero), aec0f159 (/a/arena) y 2bf255c8 (/auth). Los tres últimos
 * dicen `reading 'default'` (React.lazy pelado) y los dos primeros
 * `reading 'BasaltAppLayout'` (el `.then` que mapea el export con nombre) — la misma
 * causa vista por los dos lados. Sin `preventDefault()` el error se propaga tal cual,
 * el ErrorBoundary lo reconoce, no abre ticket y muestra "La app se actualizó".
 */
export function manejarPreloadError(event: Event): void {
  if (esFalloDeHojaDeEstilos((event as Event & { payload?: unknown }).payload)) {
    // La ÚNICA cancelación segura. En el bucle de deps de Vite, cancelar deja que el
    // bucle termine y que se llame a `baseModule()` igual, así que el `import()` se
    // cumple con el módulo de verdad y la ruta carga —sin esa hoja de estilos—. Antes,
    // al propagarse, el `throw` del bucle ocurría ANTES de `baseModule()`: una hoja que
    // una extensión o un proxy bloquea tumbaba la ruta entera, y recargar no la trae.
    // El módulo en sí nunca pasa por acá: "Unable to preload CSS" solo lo produce el
    // listener de error del <link>, nunca el rechazo de `baseModule()`.
    event.preventDefault();
    return;
  }
  if (!puedeRecargar()) return;
  window.location.reload();
}
