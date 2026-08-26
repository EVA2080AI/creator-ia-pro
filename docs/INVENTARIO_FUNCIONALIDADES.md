# Inventario de funcionalidades — Creator IA Pro

Fecha: 2026-08-25 · Base para el refactor de Genesis IA y la migración a Vercel + Neon.
Estado real verificado en código (no en producción: el proyecto de Supabase estaba pausado).

Leyenda de estado: ✅ funciona · ⚠️ funciona con bugs · ❌ roto · 🎭 mock (datos falsos) · 💀 código muerto (sin ruta ni consumidor)

---

## 1. Genesis IA (`/chat`, tier `creador`) — `src/pages/Chat.tsx` (1239 líneas)

### 1.1 Pantalla de bienvenida (sin proyecto activo)
| ID | Funcionalidad | Estado | Referencia | QA |
|---|---|---|---|---|
| G-01 | Prompt libre (textarea auto-resize, Enter envía) | ✅ | `Chat.tsx:222-231` | Enviar texto, verificar creación de proyecto |
| G-02 | Dictado por voz (`webkitSpeechRecognition` es-ES) | ⚠️ solo Chrome/Safari | `Chat.tsx:921-934` | Probar en Chrome, iOS Safari, Firefox (debe ocultarse) |
| G-03 | Adjuntar archivo → contexto del prompt | ✅ | `Chat.tsx:722-724` | Adjuntar .md/.txt, ver que llega al modelo |
| G-04 | Atajo HTML: `.html` completo crea proyecto sin IA | ✅ | `Chat.tsx:691-719` | Subir HTML con `<style>` y `<script>` |
| G-05 | Toggle React / HTML (`BuildMode`, localStorage) | ✅ | `Chat.tsx:728-732` | Cambiar y recargar; verificar tag `[MODO:]` |
| G-06 | Selector de modelo + badge de plan | ⚠️ dropdown fuera de pantalla en móvil (<428px) | `chat/ModelSelector.tsx:118` | Viewport 375px |
| G-07 | Tabs Mis proyectos / Recientes / Plantillas + búsqueda | ✅ | `Chat.tsx:428-521` | Filtrar, abrir plantilla |
| G-08 | Importar carpeta (`webkitdirectory`) y drag & drop recursivo | ✅ desktop · ❌ móvil (no soportado por navegador) | `Chat.tsx:765-890` | Carpeta con `node_modules` → debe filtrarse |
| G-09 | Auto-nombre de proyecto (stop-words) + detección de saludos | ✅ | `Chat.tsx:678-743` | "hola" no crea proyecto |
| G-10 | Eliminar proyecto (`window.confirm`) | ⚠️ UX nativa | `Chat.tsx:996-1000` | Reemplazar por AlertDialog |
| G-11 | Modelo por defecto `anthropic/claude-sonnet-4-5` | ❌ no existe en ningún catálogo | `Chat.tsx:574` | Unificar catálogo |
| G-12 | Downgrade a modelo gratuito con 0 créditos | ❌ carrera entre dos `useEffect` | `Chat.tsx:579` | Usuario free con 0 créditos |

### 1.2 IDE (proyecto activo)
| ID | Funcionalidad | Estado | Referencia | QA |
|---|---|---|---|---|
| G-13 | Vistas code / preview / split / files / history / sitemap / artifacts | ✅ | `Chat.tsx:69` | Cambiar cada vista |
| G-14 | Modo dispositivo desktop / tablet / mobile en preview | ✅ | `Chat.tsx` | — |
| G-15 | Snapshots en memoria (máx. 20) + restaurar | ⚠️ no persisten | `Chat.tsx:660-665` | Recargar → se pierden |
| G-16 | Push a GitHub (token + repo, crea repo, sube archivos) | ✅ | `Chat.tsx:947-994` | Token en claro en `github_connections` ⚠️ |
| G-17 | Exportar ZIP (JSZip) | ✅ | `Chat.tsx:80-93` | Descargar y abrir |
| G-18 | Deploy a Vercel (`StudioDeploy`) | ⚠️ | `vercel-service.ts` | Requiere token del usuario |
| G-19 | Config Supabase por proyecto (localStorage) | ✅ | `Chat.tsx:634-647` | — |
| G-20 | Command Palette ⌘K | ✅ | `Chat.tsx:910-919` | — |
| G-21 | Preview fullscreen | ❌ no-op (`isFullscreen={false}`) | `Chat.tsx:1155` | — |
| G-22 | Panel "Estudio de Ingeniería" (artifacts / tasks / logs) | ❌ sale vacío | `chat/utils.ts:172,182,296` | Causa: parser busca ``` y los prompts v25 emiten `<file path>` |

### 1.3 Chat compartido — `src/components/studio/StudioChat.tsx` (719 líneas; lo usan `/chat`, `/ide`, `/antigravity`)
| ID | Funcionalidad | Estado | Referencia | QA |
|---|---|---|---|---|
| G-23 | Streaming SSE con progreso y cursor | ✅ | `StudioChat.tsx:603-675` | — |
| G-24 | Checklist "N archivos listos" en streaming | ⚠️ subreporta (busca `</file>` en el chunk, no en el buffer) | `useStudioChatAI.ts:313` | Respuesta con 5 archivos |
| G-25 | Modo Arquitecto (plan aprobable) | ✅ | `StudioChat.tsx:357,554` | — |
| G-26 | Auto-Fix (3 reintentos ante error de preview) | ✅ | `StudioChat.tsx:430-483` | Introducir error de sintaxis |
| G-27 | Navegación por intención ("abre App.tsx") | ✅ | `StudioChat.tsx:302-316` | — |
| G-28 | Auto-nombre vía llamada extra a deepseek | ⚠️ llamada gratuita no contabilizada | `StudioChat.tsx:273-294` | — |
| G-29 | Adjuntar URL (scraping) | ❌ 404: `scrape-url` no existe en repo | `StudioChat.tsx:486-499` | — |
| G-30 | Adjuntar imagen (vision) → auto-switch a gemini | ✅ | `useStudioChatAI.ts:209-215` | Subir captura de UI |
| G-31 | @menciones de archivos como contexto | ✅ | `StudioChat.tsx:709-715` | — |
| G-32 | Instrucciones personalizadas (`agent_preferences`) | ❌ se reciben y se descartan | `useStudioChatAI.ts:100` | Punto de enganche de la personalización |
| G-33 | Cobro de créditos por mensaje | ❌ **nunca se cobra** (`cost` calculado y no usado) | `StudioChat.tsx:335`, `ai-proxy:579` | Fuga de costes |
| G-34 | Persona `antigravity` | ❌ usa el prompt de Genesis; `ANTIGRAVITY_CHAT_SYSTEM` nunca se usa | `useStudioChatAI.ts:197` | — |
| G-35 | Gating por tier | ❌ solo toast en sidebar, evadible por URL | `SidebarGlobal.tsx:93-110` | Entrar a `/antigravity` con plan free |

### 1.4 Otros shells sobre los mismos componentes
| ID | Ruta / módulo | Estado | Nota |
|---|---|---|---|
| G-36 | `/studio` → `StudioLite` + `StudioChatLite` (833 líneas) | ✅ reducido | Duplica `StudioChat`; catálogo de modelos propio |
| G-37 | `/ide`, `/code` → `CodeIDE` | 🎭 parcial | Publicar, GitHub Sync, Terminal, Configuración = "próximamente" |
| G-38 | `Studio.tsx` + `useGenesisUnified` + `multi-agent-orchestrator` + `ai-cache` + `Nexus/*` + `PluginManager` + `StudioFloatingToolbar` + `StudioAnalytics` | 💀 ~2.000 líneas | Importado pero nunca renderizado |
| G-39 | `Studio.old.tsx`, `useSimpleCodeGen`, `useUserPreferences`, `AgentSettingsModal`, `genesis-master-brain.md`, `chatStore`, `studioStore` | 💀 | 0 consumidores |
| G-40 | `StudioCloud` (14 secciones) | 🎭 mayoría | Porcentajes hardcodeados; GitHub PAT en localStorage |

---

## 2. Antigravity (`/antigravity`, tier `pyme`) — `src/pages/Antigravity.tsx` (207 líneas)
| ID | Funcionalidad | Estado | Referencia |
|---|---|---|---|
| A-01 | Chat | ✅ | = `StudioChat persona="antigravity"` (idéntico a Genesis, ver G-34) |
| A-02 | Panel "Actividad Neural" (logs, latencia, capacidad) | 🎭 | `Antigravity.tsx:17-22,79-83` — array hardcodeado |
| A-03 | "Nexus Guard — Protección Neural Activa" | 🎭 | `:126-136` |
| A-04 | Badges Kernel v9.0.2 / Sincronización / Ultra-rápido | 🎭 | `:161-165` |
| A-05 | Botón Share | ❌ sin `onClick` | `:87-89` |
| A-06 | Servicios "agénticos" (`multi-agent-orchestrator`, `deployment-service` mock con `setTimeout`, `github-service`, `clone-service`, `mcp-service`) | 💀 / 🎭 | Ninguno conectado al chat |

**Conclusión:** Antigravity no aporta ninguna capacidad propia. Se fusiona en Genesis como un *tipo de asistente* ("Agente estratega") con su tema visual.

---

## 3. Herramientas (`/tools`, `/apps/:id`, tier `free`) — `src/pages/Tools.tsx`
Flujo: `Tools.handleProcess` → `aiService.processAction` (cobra `spend_credits`) → edge function → refund en error.

| ID | Tool | Créditos UI | Backend real | Estado |
|---|---|---|---|---|
| T-01 | `generate` Crear imagen | 2 | `ai-proxy` → Replicate `flux-schnell` → fallback OpenRouter `gemini-2.5-flash-image` | ✅ |
| T-02 | `logo` Diseñar logo | 3 | idem + sufijo de prompt | ✅ |
| T-03 | `style` Transferir estilo | 2 | Replicate `flux-1.1-pro` con `image_prompt` = data-URI base64 | ⚠️ Replicate espera URL → probable 4xx |
| T-04 | `product` Mockup de producto | 3 | idem T-03 | ⚠️ |
| T-05 | `enhance` Mejorar imagen | 2 | `media-proxy` → Fal.ai `codeformer` | ❌ sin `FAL_KEY` + sin polling de `queue.fal.run` |
| T-06 | `upscale` Aumentar resolución | 3 | Fal.ai `real-esrgan` | ❌ idem |
| T-07 | `background` Quitar fondo | 1 | Fal.ai `bria/background-remove` | ❌ idem |
| T-08 | `restore` Restaurar foto | 3 | `media-proxy` **sin case `restore`** | ❌ por diseño |
| T-09 | `eraser` Borrar objeto | 2 | — | ❌ deshabilitado ("requiere máscara") |
| T-10 | `copywriter` Crear texto | 1 | `aiService.streamTextGen` → OpenRouter | ✅ |
| T-11 | `social` Contenido para redes | 2 | idem | ✅ |
| T-12 | `blog` Escribir artículo | 1 | idem | ✅ |
| T-13 | `ads` Crear anuncio | 1 | idem | ✅ |
| T-14 | Guardar en biblioteca (`saved_assets`) | ✅ manual | `Tools.tsx:323-349` |
| T-15 | Cobro de texto | ⚠️ doble cobro en fallback (`spend_credits` + `processAction`) | `Tools.tsx:268-286` |
| T-16 | Precio mostrado vs cobrado | ⚠️ `tool.credits` / `tokenCost` vs `MODEL_COSTS[model] ?? MODEL_COSTS[tool] ?? 2` | `ai-service.ts:203` |
| T-17 | 3 modelos de texto muertos en OpenRouter | ❌ `gemini-3-flash`, `claude-3.5-sonnet`, `claude-3-opus` | `components/ModelSelector.tsx:30-45` |
| T-18 | Landings SEO `/herramienta/:slug` (12) | ⚠️ "prueba gratis sin registro" falla (`Acceso no autorizado`); créditos no coinciden con Tools; modelo demo `nano-banana-25` inexistente | `ToolLanding.tsx:234-283` |
| T-19 | `components/ai/ModelSelector` + `useAIProvider` (groq/huggingface) | 💀 | 2ª arquitectura de proveedores sin consumidores |
| T-20 | `StudioAITools.tsx` (3er catálogo de tools con otros precios) | 💀 | — |

---

## 4. Canvas IA (`/studio-flow`, tier `pro`) — relación con Genesis/Tools
| ID | Funcionalidad | Estado | Referencia |
|---|---|---|---|
| C-01 | 13 tipos de nodo; ejecución vía `aiService.processAction` | ✅ | `useCanvasExecution.ts:98-131` |
| C-02 | Nodo vídeo: modelo elegido se ignora (siempre `wan-2.5`) | ❌ | `ai-service.ts:252` |
| C-03 | `CaptionNode`, `CampaignManagerNode`, `GeniusAssistant`, `VideoModelNode` hacen `fetch` directo → **no cobran créditos** | ❌ | `CaptionNode.tsx:75`, `CampaignManagerNode.tsx:51`, `GeniusAssistant.tsx:323`, `VideoModelNode.tsx:175` |
| C-04 | `GeniusAssistant` fallback a Gemini (`provider:'gemini'`) | ❌ 503 | `GeniusAssistant.tsx:337` |
| C-05 | `AntigravityBridgeNode` | 🎭 `setTimeout` + nombre aleatorio | `AntigravityBridgeNode.tsx:44-62` |
| C-06 | Biblioteca (`LibraryView`): "las imágenes del canvas se guardan aquí" | ❌ falso: nada se guarda automáticamente | `LibraryView.tsx` |

---

## 5. Transversales
| ID | Área | Estado | Nota |
|---|---|---|---|
| X-01 | Catálogo de modelos | ❌ **5 copias** con 4 mapas de coste distintos | `models.config.ts`, `chat/constants.ts`, `ai-service.ts`, `StudioChatLite.tsx`, `useAIProvider.ts`, `GeniusAssistant.tsx`, `components/ModelSelector.tsx` |
| X-02 | Chat LLM / parser SSE | ❌ **5 implementaciones** | `useStudioChatAI`, `streamTextGen`, `handleTextGen`, `GeniusAssistant`, `useGenesisLite` |
| X-03 | Créditos | ❌ inconsistente: Genesis gratis; Tools doble cobro; nodos sin cobro; `ai-proxy` con `TODO` | — |
| X-04 | Rate limit / circuit breaker en `ai-proxy` | ⚠️ en memoria (se pierde en cold start) | `ai-proxy:32-98` |
| X-05 | Tier gating | ❌ no hay guard de ruta | `SidebarGlobal.tsx` |
| X-06 | `useWorkspaceActions` (acciones contextuales en sidebar) | ✅ infraestructura lista, 1 consumidor | Punto de extensión para las tools dentro de Genesis |
| X-07 | Personalización existente | ❌ `agent_preferences` descartadas; `AgentSettingsModal` inaccesible; `useUserPreferences` sin consumidores; sin tenant/white-label | — |
| X-08 | `user_feature_flags` | ❌ tabla inexistente | `useFeatureFlags.ts:71` |
| X-09 | Edge functions huérfanas | 💀 `studio-generate`, `groq-proxy`, `huggingface-proxy`, `check-subscription` | — |
| X-10 | Edge functions en prod sin código en repo | ⚠️ `scrape-url`, `ai-chat`, `generate-image`, `ai-tool`, `generate-ui`, `ai-gateway*`, `buy-credits`, `create-checkout`, `customer-portal`, `stripe-webhook` | — |
| X-11 | Migraciones del repo ≠ base real | ⚠️ `profiles` tiene 6 columnas sin migración; `admin_get_user_roles`/`admin_set_role` existen en prod sin migración | Hace falta `pg_dump --schema-only` |
| X-12 | Tareas (`/tareas`) + correo Resend | ✅ nuevo (2026-08-25), pendiente de desplegar | `docs/TAREAS_Y_EMAIL.md` |

---

## 6. Backend Supabase en uso (resumen para la migración)
- **~27 tablas** (20 con FK a `auth.users`), 1 enum, 9 triggers, ~17 funciones (14 invocadas desde el front), ~55 políticas RLS.
- **Auth:** email+password, OAuth Google/Apple/GitHub, reset por correo. ~40 llamadas en ~23 ficheros.
- **Storage:** 1 bucket público `avatars` (1 fichero).
- **Realtime:** 0 usos.
- **Edge functions reales:** `ai-proxy`, `media-proxy`, `send-email`, `admin-save-settings`, `bold-checkout`, `bold-webhook` (+ `scrape-url` sin fuente).
- **PostgREST:** ~115 llamadas `supabase.from()` en 39 ficheros; 14 `rpc()` en 8 ficheros.
- **Pagos:** Bold.co activo; Stripe residual muerto.
