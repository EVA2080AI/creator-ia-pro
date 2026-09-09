# Próximos pasos — creator-ia-pro

Generado tras un QA completo el 2026-08-10 (revisión de código sin commitear + auditoría de backend + pruebas en vivo contra producción). Reporte completo con evidencia y líneas exactas: https://claude.ai/code/artifact/5d4df428-4402-4350-b449-a0fdc46bcd0c

No se aplicó ningún fix — todo lo de abajo está pendiente.

## 🔴 Urgente

1. **Pasar Supabase a plan Pro.** El proyecto (`zfzkohjdwggctogehlkw`) se pausó solo 2 veces en un mes por el plan gratuito (auto-pausa por inactividad), rompiendo el login en producción cada vez. Es el fallo más disruptivo y el único que no se arregla con código. Restaurar manualmente mientras tanto: dashboard de Supabase → botón "Restore project", o `POST https://api.supabase.com/v1/projects/zfzkohjdwggctogehlkw/restore` con el token del CLI.

2. **Fix: explicación del asistente se descarta en formato XML** — `src/components/studio/chat/utils.ts:172, 182, 296`. Causa raíz más probable de que el panel "Estudio de Ingeniería" (tareas/arquitectura) salga vacío. `processRawResponse` sigue buscando ` ``` ` para cortar el texto de explicación, pero los prompts nuevos (`genesis-prompts.ts`, `specialist-prompts.ts`) ya no usan bloques markdown, solo `<file path="...">`. Además, cualquier bloque ` ```mermaid ` o ` ```bash ` se clasifica como archivo de código fuente en vez de ignorarse. Confirmado por dos revisores independientes.

3. **Quitar 3 modelos de texto muertos del selector** — `src/services/ai-service.ts`, `TEXT_MODEL_MAP`. Probado en vivo contra OpenRouter: `google/gemini-2.0-flash-001` (Gemini 3 Flash), `anthropic/claude-3.5-sonnet` (Claude 3.5 Sonnet) y `anthropic/claude-3-opus-20240229` (Claude 3 Opus) devuelven `"No endpoints found"`. El usuario ve el error crudo sin clasificar. El modelo por defecto (`deepseek-chat`) sí funciona.

4. **Fix: selector de modelo fuera de pantalla en móvil** — `src/components/studio/chat/ModelSelector.tsx:118`. El cálculo de posición usa un ancho fijo (416px) en vez del ancho real renderizado; en cualquier viewport <428px el dropdown queda con `left` negativo, recortado contra el borde. Reproduce en el 100% de los teléfonos.

## 🟡 Importante

5. **Configurar `FAL_KEY` en los secretos de Supabase.** Sin ella, `media-proxy` está completamente caído: mejorar resolución, quitar fondo, restaurar y generar video (Fal.ai) fallan de inmediato, incluso antes de intentar el fallback a Replicate.

6. **`src/hooks/useStudioChatAI.ts:313`** — el detector de archivos en streaming busca `"</file>"` solo en el chunk actual, no en el buffer acumulado; un cierre de tag partido entre dos chunks no se detecta en vivo (el checklist "N archivos listos" subreporta, aunque el resultado final sí queda bien aplicado).

7. **`src/pages/Chat.tsx:579`** — condición de carrera entre dos `useEffect`: un usuario free con 0 créditos nunca recibe el modelo gratuito por defecto porque el efecto que persiste el modelo actual en `localStorage` corre antes que el efecto que decide el downgrade.

8. ~~**`src/components/studio/StudioChat.tsx:490`** — llamada a `/functions/v1/scrape-url`, función que no existe (confirmado 404 en vivo). La función de "pegar una URL y que la IA la lea" falla silenciosamente siempre.~~ **FIX 2026-09-08:** reemplazada por `api/scrape.ts` (Vercel Function con guard SSRF, límite de 512 KB / 15.000 chars y timeout de 10 s) llamada desde StudioChat como `/api/scrape`.

9. **`src/prompts/genesis-prompts.ts:23`** — la regla 5 pide declarar dependencias npm nuevas en un JSON con clave `"newDeps"` que ningún parser del código lee; se pierde silenciosamente y el archivo generado que la importe rompe en el preview.

## 🟢 Cuando haya tiempo

- Configurar `TAVILY_API_KEY` — sin ella, la búsqueda web de Génesis siempre devuelve un placeholder en vez de buscar de verdad (no rompe, solo no funciona).
- Limpiar funciones edge huérfanas: `check-subscription` (resto de Stripe pre-Bold.co, sin ninguna referencia en el frontend — candidata a borrar), `groq-proxy` / `huggingface-proxy` (caídas por falta de clave y además código muerto, sin ninguna pantalla que las use hoy).

## Sin verificar (pendiente de sesión con navegador conectado)

La extensión de Chrome no llegó a conectarse en esta sesión, así que estos dos puntos de la QA original (capturas de hace ~2 meses) no se pudieron reproducir visualmente:

- Panel "Estudio de Ingeniería" vacío — respaldado solo por análisis de código (ítem 2 arriba es la hipótesis más fuerte).
- Pantallas de carga infinita tras navegar a `/chat` y tras "Push to Cloud" — la teoría de las ~45 dependencias de shadcn como causa fue investigada y descartada (Sandpack muestra su propio error de timeout, no es un cuelgue silencioso), pero eso no confirma que el problema original ya no exista por otra causa.

Para cerrar esto: conectar la extensión con `/chrome` y pedir que se repita la pasada visual, o probarlo manualmente y contarme qué se ve.

## 🆕 2026-08-25 — Tareas (Kanban móvil) + correo con Resend: pendiente de despliegue

Código listo y verificado localmente (tests, build). Bloqueado porque el proyecto de Supabase está **pausado** (`INACTIVE`, el host ni resuelve en DNS) — es el mismo ítem 🔴 #1 de arriba. Al restaurarlo, ejecutar en orden:

```bash
npx supabase db push                                   # crea tasks + email_logs
npx supabase secrets set RESEND_API_KEY='re_...'       # clave gratuita de resend.com
npx supabase functions deploy send-email               # función de correo
```

Guía completa (plan gratuito de Resend, verificación de dominio, límites): `docs/TAREAS_Y_EMAIL.md`.

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

**⚠️ Nuevo hallazgo (2026-09-08): Supabase vivo en páginas con ruta.** Al auditar `import ... from '@/integrations/supabase/client'` quedan 6 archivos **alcanzables por el usuario** que siguen llamando al Supabase muerto (todo lo que tocan falla en silencio o con error):

| Archivo | Qué rompe | Migración necesaria |
|---|---|---|
| `src/pages/admin/components/AdminLoginGate.tsx` | Puerta de login del Admin usa `supabase.auth.signInWithPassword` — el Admin queda bloqueado si esta puerta es obligatoria. | Usar la sesión better-auth + flag `isAdmin` (ya migrado en `/api/admin/*`). |
| `src/pages/admin/components/AdminBootstrap.tsx` | Bootstrap de admin vía RPC `bootstrap_admin` de Supabase. | Endpoint `/api/admin/bootstrap` con chequeo de owner. |
| `src/pages/admin/tabs/RolesTab.tsx` | Gestión de roles llama a tablas Supabase. | Endpoint Drizzle sobre `organization_members`. |
| `src/pages/ShareScreen.tsx:47` | "Share screen" cobra créditos con RPC `spend_credits` de Supabase. | Reusar `spendCredits` de `api/_lib/credits.ts` vía un endpoint nuevo. |
| `src/pages/SystemStatus.tsx:192` | Sonda de salud contra tablas Supabase (como diagnóstico, reporta "down" — es lo correcto mientras siga muerto, pero hay que actualizarla al cortar Supabase). | Sonda contra `/api/health` + Neon. |
| `src/services/billing-service.ts` | `boldService`/`creditService` mezclan `supabase.functions.invoke` y `.from()` (usado por `StudioDeploy` y `useStudioActions`). | Revisar qué partes siguen vivas tras el fix de checkout del 26-ago; migrar las que falten a `/api/billing/*`. |

Además, `useAgentPreferences` (instrucciones por especialista de Génesis) leía la tabla muerta `agent_preferences` — **migrado a localStorage** (misma interfaz) para que StudioChat y AgentSettingsModal vuelvan a guardar de verdad. Persistencia multi-dispositivo: pendiente tabla Drizzle + `/api/preferences`.
