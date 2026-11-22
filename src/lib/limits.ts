// Topes que tienen que coincidir SÍ O SÍ entre el cliente y el servidor.
//
// Vive aparte (sin imports) porque lo carga también el API, donde el resolutor de
// módulos es node16: cualquier archivo que el API importe tiene que ser importable sin
// arrastrar medio cliente detrás.

/**
 * Conversaciones guardadas por usuario y por contexto (Basalt y cada Experto llevan la
 * suya). El servidor lo aplica al guardar: al pasar de aquí BORRA la más antigua sin
 * anclar, para siempre (api/basalt/conversations.ts). El cliente usa el mismo número
 * para avisarlo ANTES de que pase, y así se pueda anclar o descargar lo que importe.
 */
export const MAX_CONVERSATIONS = 50;

/**
 * Créditos que cada plan otorga al mes. Es lo que venden /pricing y la landing
 * ("1.000 créditos/mes", …): si cambian allá, cambia AQUÍ — el panel admin proyecta
 * con estos números cuánta plata hay que tener cargada en OpenRouter.
 */
export const PLAN_MONTHLY_CREDITS: Record<string, number> = {
  free: 0,
  creador: 1_000,
  pro: 3_000,
  agencia: 8_000,
  pyme: 20_000,
};

/**
 * Precio mensual del plan en COP, en pesos (no centavos). Fuente de verdad para el
 * panel admin financiero (MRR estimado = usuarios por plan × este precio). Debe
 * coincidir con `src/pages/Pricing.tsx` (PLANS[].price): si cambia allá, cambia AQUÍ.
 * "empresarial" es a medida y no se incluye.
 */
export const PLAN_PRICES_COP: Record<string, number> = {
  free: 0,
  creador: 149_900,
  pro: 349_900,
  agencia: 699_900,
  pyme: 1_499_900,
};

/**
 * Precio de las recargas puntuales (packs de créditos) en COP. Debe coincidir con
 * `src/lib/credit-packs.ts` (CREDIT_PACKS[].price). Se usa en el endpoint financiero
 * para traducir una `transaction.description` que empieza con "pack_200|…" a su
 * monto cobrado.
 */
export const CREDIT_PACK_PRICES_COP: Record<string, number> = {
  pack_200: 25_000,
  pack_1000: 90_000,
  pack_2000: 150_000,
};

/** Créditos que entrega cada recarga puntual. Debe coincidir con `src/lib/credit-packs.ts`. */
export const CREDIT_PACK_CREDITS: Record<string, number> = {
  pack_200: 200,
  pack_1000: 1_000,
  pack_2000: 2_000,
};

export interface BillingProduct {
  id: string;
  /** Lo que se cobra, en pesos colombianos. */
  priceCop: number;
  /** Créditos que se suman al aprobarse el pago. */
  credits: number;
  /** Un plan además cambia `subscription_tier` y corre el vencimiento 30 días. */
  isPlan: boolean;
}

const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/**
 * Lo ÚNICO que se puede comprar: el cobro (api/billing/checkout.ts) y la acreditación
 * (api/_lib/billing.ts) salen de acá, así que no puede cobrarse un precio y acreditarse
 * otro. Antes cada archivo llevaba su propia tabla de precios y de créditos.
 * `own()` y no `mapa[id]`: el id viene del navegador y "constructor" o "toString" existen
 * en cualquier objeto.
 */
export function billingProduct(id: unknown): BillingProduct | null {
  if (typeof id !== "string") return null;
  if (id !== "free" && own(PLAN_PRICES_COP, id) && own(PLAN_MONTHLY_CREDITS, id)) {
    return { id, priceCop: PLAN_PRICES_COP[id], credits: PLAN_MONTHLY_CREDITS[id], isPlan: true };
  }
  if (own(CREDIT_PACK_PRICES_COP, id) && own(CREDIT_PACK_CREDITS, id)) {
    return { id, priceCop: CREDIT_PACK_PRICES_COP[id], credits: CREDIT_PACK_CREDITS[id], isPlan: false };
  }
  return null;
}
