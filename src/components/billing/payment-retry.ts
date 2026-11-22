/**
 * Esperas entre consultas de "¿ya entró mi pago?", en ms. Bold tarda unos segundos en
 * reflejar un pago con tarjeta y varios minutos con PSE: mientras diga "en proceso" se
 * insiste alrededor de un minuto; si dice "sin pago", solo un par de veces (quien volvió
 * sin pagar no debe quedarse esperando).
 */
export const RETRY_DELAYS = [2500, 4000, 6000, 10000, 15000, 20000];
export const UNPAID_RETRIES = 2;
