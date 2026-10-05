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
