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
