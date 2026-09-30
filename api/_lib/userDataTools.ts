// Herramientas de solo lectura sobre los datos reales del usuario — mismo
// formato OpenAI/OpenRouter que WEB_SEARCH_TOOL (ver api/_lib/search.ts).
// Sin costo en créditos: a diferencia de la búsqueda (Tavily, costo externo
// real) o de una futura ejecución de código (infra real), leer datos que la
// plataforma ya tiene calculados no cuesta nada extra — no hace falta
// cobrarlo ni exigir un plan mínimo.
export const GET_MY_PROJECTS_TOOL = {
  type: "function",
  function: {
    name: "get_my_projects",
    description:
      "Devuelve la lista de proyectos de código (Genesis) del usuario actual: nombre y fecha de última edición. Usala cuando pregunten qué proyectos tienen, cuántos, o algo similar sobre SU cuenta. No inventes proyectos que no aparezcan en el resultado.",
    parameters: { type: "object", properties: {}, required: [] },
  },
} as const;

export const GET_MY_ASSETS_TOOL = {
  type: "function",
  function: {
    name: "get_my_assets",
    description:
      "Devuelve los assets guardados más recientes (imágenes/documentos) del usuario actual en 'Mis Activos': tipo, prompt con el que se generó, fecha. Usala cuando pregunten qué imágenes o documentos tienen guardados.",
    parameters: { type: "object", properties: {}, required: [] },
  },
} as const;

export const GET_MY_USAGE_TOOL = {
  type: "function",
  function: {
    name: "get_my_usage",
    description:
      "Devuelve el plan y los créditos actuales del usuario: saldo de créditos, plan/tier, mensajes gratis usados hoy. Usala cuando pregunten cuántos créditos les quedan, qué plan tienen, o algo similar sobre su cuenta — nunca inventes estos números de memoria.",
    parameters: { type: "object", properties: {}, required: [] },
  },
} as const;

export const USER_DATA_TOOLS = [GET_MY_PROJECTS_TOOL, GET_MY_ASSETS_TOOL, GET_MY_USAGE_TOOL] as const;
export type UserDataToolName = (typeof USER_DATA_TOOLS)[number]["function"]["name"];

export function isUserDataToolName(name: string): name is UserDataToolName {
  return USER_DATA_TOOLS.some((t) => t.function.name === name);
}
