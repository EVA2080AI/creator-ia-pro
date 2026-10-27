# Próximos pasos — creator-ia-pro

Lista nacida del QA completo del 2026-08-10 (revisión de código sin commitear + auditoría
de backend + pruebas en vivo contra producción). Reporte original con evidencia y líneas
exactas: https://claude.ai/code/artifact/5d4df428-4402-4350-b449-a0fdc46bcd0c

**Revalidada contra el código el 2026-10-21, después de la migración a Neon.** Más de la
mitad de la lista se cerró sola con la migración, y los números de línea del QA ya no
corresponden: lo que sigue abierto lleva su línea de hoy. **No queda nada en 🔴.**

## 🟡 Abierto

1. **El downgrade a modelo gratuito nunca ocurre** — `src/pages/Chat.tsx:607` y `:613`.
   Dos `useEffect` compiten: el primero escribe `genesis-selected-model` en `localStorage`
   en cada render (incluido el de montaje), así que cuando el segundo pregunta
   `if (!saved && (tier === 'free' || credits <= 0))`, `saved` **siempre** tiene valor y la
   condición nunca entra. Un usuario free con 0 créditos se queda con el modelo de pago y
   choca contra el error de saldo. Arreglo: decidir el downgrade con una bandera propia
   ("el usuario eligió modelo") en vez de deducirlo de la presencia de la clave.

2. **El checklist "N archivos listos" subreporta en vivo** — `src/hooks/useStudioChatAI.ts:393`.
   `delta.includes('</file>')` mira solo el chunk actual, no el buffer acumulado: un cierre
   de etiqueta partido entre dos chunks no se detecta. El resultado final sí queda bien
   aplicado — es solo el contador en pantalla.

3. **Las 5 herramientas de edición de imagen siguen caídas** — `src/services/ai-service.ts`.
   `upscale`, `background`, `enhance`, `restore` y `eraser` lanzan *"temporalmente
   deshabilitada"* (hay un test que lo fija en `src/test/ai-service.test.ts:129`). Nunca se
   migraron de la edge function `media-proxy` de Supabase. Hoy el camino sería `api/ai/*`,
   con el mismo patrón de `api/ai/image.ts`: sesión → plan → cobro atómico → reembolso si falla.
   *(Este ítem reemplaza al viejo "configurar `FAL_KEY` en los secretos de Supabase", que ya
   no aplica: no hay secretos de Supabase.)*

4. **`newDeps` que ningún parser lee** — `src/prompts/genesis-prompts.ts:32`. La regla 5 le
   pide al modelo declarar paquetes npm nuevos en un JSON con clave `"newDeps"`; nada en el
   código la lee, así que se pierde en silencio y el archivo generado que importe ese paquete
   rompe en el preview.

5. **`media-proxy` fantasma en el panel admin** — `src/pages/Admin.tsx:125`. Sigue listado
   como servicio ("Edición de imagen (Replicate)") un endpoint que ya no existe. Se cae con
   el ítem 3 o se borra la fila.

## 🟢 Cuando haya tiempo

- Configurar `TAVILY_API_KEY` si se quiere búsqueda web de verdad. Ya no rompe nada: sin la
  clave, `api/ai/chat.ts` no ofrece la herramienta y le agrega al prompt una nota de que no
  puede buscar (`NO_SEARCH_NOTE`), para que el modelo no la prometa.
- Ejecutar el `git rm` de los 35 archivos muertos identificados en la fase 7 (ver más abajo),
  si es que siguen ahí.

## ✅ Cerrado desde el QA

| Ítem original | Qué lo cerró |
|---|---|
| 🔴 1. Supabase a plan Pro (auto-pausa rompía el login) | La migración a Neon + better-auth. No queda `@supabase/supabase-js` en `package.json`, ni carpeta `supabase/`, ni una sola llamada viva: las 87 menciones que quedan en el código son comentarios históricos del tipo *"reemplaza `supabase.from(...)`"*. |
| 🔴 2. La explicación del asistente se descartaba en formato XML | **2026-10-21.** `processRawResponse` cortaba la explicación con `rawText.indexOf('```')`, que da `-1` en una respuesta XML — y el motor usa `<file path="...">` desde v25, así que el panel "Estudio de Ingeniería" mostraba **siempre** "Código generado.". Ahora corta en el marcador que aparezca primero (`<file` o ` ``` `). De paso: un bloque ` ```mermaid ` o ` ```bash ` sin nombre caía en el default y se guardaba como `App.tsx`, **pisando el archivo real**; ahora se ignora (`NO_SON_ARCHIVOS` en `utils.ts`). Cubierto por 5 tests nuevos en `utils.test.ts`. |
| 🔴 3. Tres modelos de texto muertos en el selector | `TEXT_MODEL_MAP` ya remapea `claude-3.5-sonnet` → `anthropic/claude-sonnet-4.5`; `gemini-2.0-flash-001` y `claude-3-opus-20240229` ya no están. |
| 🔴 4. Selector de modelo recortado en móvil | `ModelSelector.tsx` ya calcula `effectiveWidth = Math.min(416, vw - 24)` y acota `left` contra el viewport. |
| 🟡 8. `/functions/v1/scrape-url` inexistente | **2026-09-08.** Reemplazada por `api/scrape.ts` (función de Vercel con guard SSRF, límite de 512 KB / 15.000 chars y timeout de 10 s), llamada como `/api/scrape`. |
| 🟢 Funciones edge huérfanas (`check-subscription`, `groq-proxy`, `huggingface-proxy`) | Desaparecieron con Supabase. No hay ninguna referencia en `src/` ni en `api/`. |
| 🆕 2026-08-25. Tareas (Kanban) + correo, bloqueado por Supabase pausado | Desbloqueado: `/tasks` y los correos corren sobre Neon + Vercel. El bloque de `npx supabase db push` que estaba aquí ya no aplica. |
| 🆕 2026-09-08. Seis archivos con Supabase vivo y alcanzable | Todos migrados: `src/integrations/` ya no existe, `AdminLoginGate.tsx` se borró y los otros cinco tienen cero menciones a Supabase. Ver el detalle histórico al final de este documento. |

## Sin verificar (pendiente de sesión con navegador conectado)

La extensión de Chrome no llegó a conectarse en la sesión del QA, así que este punto no se
pudo reproducir visualmente:

- Pantallas de carga infinita tras navegar a `/chat` y tras "Push to Cloud". La teoría de las
  ~45 dependencias de shadcn como causa fue investigada y descartada (Sandpack muestra su
  propio error de timeout, no es un cuelgue silencioso), pero eso no confirma que el problema
  original ya no exista por otra causa.
- El panel "Estudio de Ingeniería" vacío **ya tiene causa confirmada y arreglada** (ítem 2 de
  la tabla de cerrados). Vale la pena una pasada visual para confirmar que no quedaba una
  segunda causa.

Para cerrar esto: conectar la extensión con `/chrome` y pedir que se repita la pasada visual,
o probarlo manualmente y contarme qué se ve.

## 🆕 2026-08-26 — Migración a Vercel + Neon: núcleo de Genesis ya funciona en producción

Verificado con pruebas reales contra `creator-ia.com` (no solo en local):

✅ **Funciona hoy en producción:**
- Registro/login con email+contraseña (`better-auth`, cookies seguras).
- Perfil con créditos y plan (`/api/profile`).
- Proyectos de Genesis: crear, guardar archivos, listar, borrar (`/api/projects`).
- Tareas (`/tareas`): CRUD completo + mover entre columnas, con `completed_at` correcto.
- Motor de chat de Genesis (`/api/ai/chat`) ya conectado desde `useStudioChatAI` — cobra créditos de forma atómica y hace streaming, pero **sin `OPENROUTER_API_KEY` no genera respuestas reales todavía**.
- Catálogo de modelos unificado (`src/lib/ai/models.ts`), verificado en vivo contra OpenRouter — reemplaza los 5 catálogos duplicados y elimina 9 IDs de modelo que ya no existían.
- Bug corregido: selector de modelos con posición negativa en móvil.
- Bug corregido: instrucciones personalizadas del usuario se recibían y se descartaban sin usarse — ahora se inyectan en el system prompt.
- **Bug crítico encontrado y corregido**: Vercel no soporta rutas catch-all (`[...all].ts`) fuera de Next.js más allá de un segmento — esto rompía TODO el login en producción (`/api/auth/sign-up/email` daba 404). Se arregló con un rewrite explícito en `vercel.json`.

🔑 **Bloqueadores — solo necesitan una clave que pongas en Vercel → Settings → Environment Variables:**
- ~~`OPENROUTER_API_KEY`~~ ✅ configurada 2026-08-26 — el chat ya genera código/texto real en producción.
- ~~`RESEND_API_KEY`~~ ✅ configurada 2026-08-26 — y dominio `creator-ia.com` **verificado** en Resend (DKIM/SPF/MX/DMARC agregados en Vercel DNS; `RESEND_FROM` apunta a `tareas@creator-ia.com`). Correo de prueba enviado a un buzón externo (no el dueño de la cuenta) y confirmado recibido — ya puede enviar a cualquier usuario.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (y equivalentes de Apple/GitHub) → para que los botones de login social funcionen. Callback: `https://creator-ia.com/api/auth/callback/google`.

⏳ **Todavía en Supabase (siguiente bloque):** Antigravity, Herramientas (imagen/texto), Canvas IA, Biblioteca de assets, panel de Admin más allá del flag `isAdmin`, y la fusión visual de todo dentro de Genesis con personalización por organización. Plan completo en `docs/PLAN_REFACTOR_GENESIS.md`.

## 🆕 2026-09-08 — Última milla de la migración: limpieza de código muerto + historial de chat de Genesis

Trabajo post-26-ago revisado, completado y verificado (tests 29/29 ✅). Pendiente de commit + deploy.

**Nuevo en backend (Vercel Functions):**
- `api/scrape.ts` — lectura server-side de URLs para adjuntar al chat (**arregla el ítem 🟡 #8**). Guard SSRF (rechaza IPs privadas/loopback/metadata cloud en cada salto de redirect), solo http/https, máx 512 KB → 15.000 chars, timeout 10 s.
- `api/projects/[id]/messages.ts` — historial de chat de un proyecto de Genesis (última conversación + mensajes, doble verificación de propiedad).
- `api/profile.ts` — `PATCH` para editar displayName/avatarUrl.
- `api/ai/chat.ts` — persiste la conversación aunque no haya asistente (chats de Genesis se archivan por `projectId`, validando que el proyecto sea del usuario). Con asistente o sin proyecto (Tools, nodos sueltos) no archiva.

**Migración de BD (`db/migrations/0001_genesis_chat_history.sql`):** `conversation.assistant_id` pasa a ser nullable + índice `(project_id, updated_at)`. ⚠️ Aplicar a Neon con `drizzle-kit push` si aún no se aplicó.

**Frontend:**
- Historial de chat de Genesis ya no pasa por Supabase: lectura desde `/api/projects/:id/messages`, persistencia desde el propio `/api/ai/chat` al final del stream. Al recargar, los bloques `<file>` se compactan a referencias legibles.
- `GeniusAssistant` (formarketing) migrado de las edge functions `ai-proxy` de Supabase a `/api/ai/chat` con cobro/reembolso atómico en servidor; modelos derivados del catálogo canónico.
- `Tools.tsx` usa el catálogo canónico (`src/lib/ai/models.ts`) para costes reales de créditos.
- `Profile.tsx` reescrito sobre `useProfile` + `PATCH /api/profile`; sin Supabase.
- Watcher de sesión en `App.tsx` migrado de `supabase.auth.onAuthStateChange` a la sesión de better-auth (solo navega a `/auth` cuando una sesión activa se pierde, no en carga inicial).
- Rutas retiradas con redirect 301 en `vercel.json`: `/studio`→`/chat`, `/inicio`→`/`, `/menu`/`/customize`/`/summary`/`/success`→`/` (demos Lumina retiradas).
- `StudioViewToolbar` con botones de pantalla completa y compartir.
- Tests de `useAuth` reescritos para better-auth (los viejos mock-eaban Supabase y fallaban fuera de un `<Router>`).
- Fix en `UsersTab`: `resetPassword` → `requestPasswordReset` (el primero es el paso de "poner nueva contraseña", no el de enviar el correo).

**Limpieza (fase 7 del plan): 35 archivos muertos identificados con 0 referencias vivas** (~3.400 líneas), listos para `git rm`: páginas sin ruta (`Studio`, `Studio.old`, `StudioLite`, `Home`, `Inicio`, `Landing`, `NebulaDashboard`, 4 de Lumina), hooks/stores de la era Supabase (`useGenesisUnified`, `useGenesisLite`, `useFeatureFlags`, `useAIProvider`, `useDatabase`, `useVirtualFS`, `useSubscription`, `useSimpleCodeGen`, `src/stores/` completo, `src/store/useCanvasStore`, `ai-cache`, `multi-agent-orchestrator`, `serviceWorker`), y componentes huérfanos (`components/ai/ModelSelector`, `admin/HealthDashboard`, `studio/PluginManager`, `studio/StudioAITools`, `components/canvas/` completo). Todos los errores de `tsc -b` están en estos archivos: al borrarlos el typecheck queda limpio. ⚠️ **La eliminación quedó pendiente de ejecutar** (bloqueo temporal del entorno, no del proyecto).

**CI:** `npm run typecheck` y `typecheck:api` (nuevo `tsconfig.api.json` para `api/`+`db/`) en el workflow; job de E2E de Playwright retirado del pipeline de deploy.

**Sigue pendiente (sin cambios):** claves OAuth de Google/Apple/GitHub en Vercel, migración de datos de Supabase (fase 6, requiere restaurar el proyecto pausado), `TAVILY_API_KEY`, y la fusión visual restante dentro de Genesis (`docs/PLAN_REFACTOR_GENESIS.md`).
> Al 2026-10-21: la migración de datos ya no aplica (no queda Supabase). OAuth, `TAVILY_API_KEY` y la fusión visual de Genesis siguen abiertos.

**⚠️ Nuevo hallazgo (2026-09-08): Supabase vivo en páginas con ruta.** ✅ **Resuelto — tabla histórica, no accionable.** Verificado el 2026-10-21: `src/integrations/` ya no existe, `AdminLoginGate.tsx` se borró y los otros cinco archivos tienen cero menciones a Supabase. Al auditar `import ... from '@/integrations/supabase/client'` quedan 6 archivos **alcanzables por el usuario** que siguen llamando al Supabase muerto (todo lo que tocan falla en silencio o con error):

| Archivo | Qué rompe | Migración necesaria |
|---|---|---|
| `src/pages/admin/components/AdminLoginGate.tsx` | Puerta de login del Admin usa `supabase.auth.signInWithPassword` — el Admin queda bloqueado si esta puerta es obligatoria. | Usar la sesión better-auth + flag `isAdmin` (ya migrado en `/api/admin/*`). |
| `src/pages/admin/components/AdminBootstrap.tsx` | Bootstrap de admin vía RPC `bootstrap_admin` de Supabase. | Endpoint `/api/admin/bootstrap` con chequeo de owner. |
| `src/pages/admin/tabs/RolesTab.tsx` | Gestión de roles llama a tablas Supabase. | Endpoint Drizzle sobre `organization_members`. |
| `src/pages/ShareScreen.tsx:47` | "Share screen" cobra créditos con RPC `spend_credits` de Supabase. | Reusar `spendCredits` de `api/_lib/credits.ts` vía un endpoint nuevo. |
| `src/pages/SystemStatus.tsx:192` | Sonda de salud contra tablas Supabase (como diagnóstico, reporta "down" — es lo correcto mientras siga muerto, pero hay que actualizarla al cortar Supabase). | Sonda contra `/api/health` + Neon. |
| `src/services/billing-service.ts` | `boldService`/`creditService` mezclan `supabase.functions.invoke` y `.from()` (usado por `StudioDeploy` y `useStudioActions`). | Revisar qué partes siguen vivas tras el fix de checkout del 26-ago; migrar las que falten a `/api/billing/*`. |

Además, `useAgentPreferences` (instrucciones por especialista de Génesis) leía la tabla muerta `agent_preferences` — **migrado a localStorage** (misma interfaz) para que StudioChat y AgentSettingsModal vuelvan a guardar de verdad. Persistencia multi-dispositivo: pendiente tabla Drizzle + `/api/preferences`.
