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

8. **`src/components/studio/StudioChat.tsx:490`** — llamada a `/functions/v1/scrape-url`, función que no existe (confirmado 404 en vivo). La función de "pegar una URL y que la IA la lea" falla silenciosamente siempre.

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
