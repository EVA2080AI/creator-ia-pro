# Plan: Genesis IA unificado + personalización por cliente + migración a Vercel/Neon

Fecha: 2026-08-25 · Referencias de diseño: `~/Desktop/tipos de asistentes de IA/asistente-ia.html` (Mentor IA, estética Gemini) y `GUIA-ASISTENTES-IA.md`.
Inventario detallado: `docs/INVENTARIO_FUNCIONALIDADES.md`.

## 1. Objetivo

Un solo producto de IA — **Genesis** — que:
1. Se **personaliza por asistente** (nombre, logo, colores/gradiente, tema claro/oscuro, mensaje de bienvenida, tarjetas de sugerencia, system prompt por módulos, modelo por defecto, herramientas habilitadas), y cada cliente / usuario / estudiante ve *su* asistente.
2. Absorbe **Antigravity** (pasa a ser un tipo de asistente "Agente estratega") y las **Herramientas** de imagen y texto (pasan a ser capacidades del asistente, invocables desde el chat y desde un panel lateral).
3. Corre sobre **Vercel Functions + Neon** en lugar de Supabase, para eliminar la pausa automática que tumba producción.

## 2. Modelo de personalización (nuevas tablas)

```
assistants
  id, slug, owner_id (null = plantilla del sistema), organization_id (null = global),
  visibility ('system' | 'organization' | 'private'),
  name, tagline, avatar_url, brand jsonb {gradient, accent, accentSoft, panel, font, theme:'light'|'dark'|'system'},
  welcome jsonb {title, subtitle, cards:[{label, prompt, icon}]},
  persona jsonb {role, modules:[{title, rules[]}], style[], guardrails[], language},
  capabilities jsonb {code:true, image:true, text:true, web:false, charts:true, vision:true},
  default_model, allowed_models text[], min_tier, is_active, created_at, updated_at

organizations                      -- cliente / colegio / empresa
  id, slug, name, logo_url, brand jsonb, default_assistant_id, plan, created_at

organization_members
  organization_id, user_id, role ('owner' | 'admin' | 'member' | 'student')

user_assistant_settings            -- lo que cada usuario ajusta dentro de lo permitido
  user_id, assistant_id, instructions, preferred_model, theme, pinned boolean

conversations / messages           -- unifica studio_conversations + studio_messages + historial de Tools
  conversation.assistant_id, project_id nullable, title, created_at
  message.role, content, attachments jsonb, tool_calls jsonb, cost_credits, model
```

Plantillas del sistema iniciales ("tipos de asistente"): **Genesis** (constructor de apps, hoy `/chat`), **Antigravity** (agente estratega), **Mentor IA** (educativo, el del HTML: asistentes de IA, cripto, apuestas, cobranzas, datos), **Copywriter** (texto/social/blog/ads), **Diseñador** (imagen/logo/mockups). Un admin crea organizaciones, les asigna un asistente por defecto y personaliza marca; un estudiante entra y ve directamente "Hola, soy Mentor IA de <colegio>".

## 3. Interfaz (basada en `asistente-ia.html`)
- Tokens CSS por asistente (`--grad`, `--accent`, `--accent-soft`, `--panel`, `--bg`…) con tema claro/oscuro y `prefers-color-scheme`.
- Layout: sidebar (nuevo chat, recientes, guía, configuración, tema) · topbar con chispa + nombre + chip de modelo · bienvenida con saludo en gradiente y tarjetas de sugerencia · hilo de mensajes · píldora de entrada · disclaimer.
- Markdown seguro con bloques de código copiables y **gráficos `chart`** (líneas / barras / dona en SVG, paleta CVD-safe).
- Streaming con shimmer, detener, regenerar, copiar. Móvil 100 %: sidebar deslizable, inputs ≥16 px, áreas táctiles ≥40 px.
- Cuando el asistente tiene `capabilities.code` se muestra el IDE actual (preview Sandpack, archivos, snapshots, GitHub, ZIP, deploy). Cuando tiene `image`/`text` aparecen las herramientas como *acciones* (chips bajo la píldora + panel lateral vía `useWorkspaceActions`), y el resultado (imagen/texto) se renderiza en el hilo y se guarda automáticamente en la biblioteca.

## 4. Arquitectura destino (Vercel + Neon)

```
/api/*  (Vercel Functions, Node 22, TypeScript)
  auth/*           → Better Auth (email+password, Google, Apple, GitHub, reset por Resend)
  ai/chat          → streaming SSE unificado (OpenRouter / Gemini / Groq), cobro de créditos ATÓMICO por mensaje
  ai/image         → Replicate (flux) con fallback OpenRouter; enhance/upscale/background/restore vía Replicate
  ai/video         → Replicate / Fal (con polling correcto)
  assistants/*     → CRUD de asistentes, organizaciones, settings
  projects/*, conversations/*, assets/*, tasks/*, profile/*, admin/*, billing/* (Bold checkout + webhook raw-body)
  email/send       → Resend (portado de supabase/functions/send-email)
db/                → Drizzle ORM + esquema + migraciones (drizzle-kit) sobre Neon
lib/authz          → autorización en servidor (reemplaza RLS): cada consulta filtra por user_id / organization_id
Upstash Redis      → rate limiting + circuit breaker (hoy en memoria en ai-proxy)
Vercel Blob        → avatares + imágenes generadas (hoy URLs efímeras de Replicate/Fal)
```

Frontend: `src/lib/api.ts` (cliente fetch tipado) reemplaza los ~115 `supabase.from()` + 14 `rpc()` + ~40 `supabase.auth.*`.

## 5. Fases y compuertas de QA

| Fase | Entregable | QA de salida |
|---|---|---|
| **0. Cimientos** | Neon `DATABASE_URL` enlazado al proyecto de Vercel; esquema Drizzle (tablas actuales + nuevas); Better Auth con los 3 OAuth; `/api/health`; Upstash; Blob | Registro/login/OAuth/reset en preview de Vercel; `drizzle-kit push` limpio; tests de autz |
| **1. Motor de IA único** | `/api/ai/chat` con streaming + créditos atómicos + registro de modelos único (`src/lib/models.config.ts`) + `useAssistantChat` (reemplaza 5 hooks/parsers) | 20 prompts de regresión (código, texto, imagen, vision, chart); saldo antes/después coincide con el coste mostrado |
| **2. Genesis UI nueva** | Layout Mentor IA (tokens, bienvenida, tarjetas, píldora, markdown+charts, tema) sobre `/chat`; IDE actual conectado como capacidad `code` | Checklist visual desktop 1440 / móvil 375; a11y básica; Lighthouse móvil ≥ 90 |
| **3. Personalización** | Tablas `assistants`/`organizations`/…; 5 plantillas del sistema; panel admin (marca, prompt por módulos, tarjetas, modelos, tools) ; selector de asistente; `?assistant=slug` y subdominio/slug por organización | Crear org "Colegio X" con Mentor IA morado → un alumno lo ve así; cambiar prompt → cambia comportamiento |
| **4. Fusión Antigravity** | `/antigravity` → redirect a `/chat?assistant=antigravity`; borrar mocks (Actividad Neural, Nexus Guard) y ~2.000 líneas muertas | Todo lo que hacía Antigravity sigue disponible; sin rutas rotas |
| **5. Fusión Herramientas** | 13 tools como capacidades: chips + panel lateral + comandos `/imagen`, `/logo`, `/texto`…; `enhance/upscale/background/restore` movidas a Replicate; `/tools` y `/apps/:id` redirigen a Genesis; landings SEO apuntan al asistente Diseñador/Copywriter; guardado automático en biblioteca | Cada tool probada 1 a 1 con saldo verificado; precios iguales en UI, landing y cobro |
| **6. Migración de datos y corte** | `pg_dump` de Supabase (requiere restaurar el proyecto) → import a Neon (usuarios con mismo UUID, hashes bcrypt, perfiles, proyectos, assets, transacciones); avatares a Blob; Bold webhook apuntando a Vercel; DNS sin cambios | Login de usuarios existentes (password y OAuth por email); saldos idénticos; proyectos abren; pagos de prueba |
| **7. Limpieza y QA final** | Eliminar `@supabase/*`, funciones edge, `supabase/`; CI verde (`tsc` limpio, tests, Playwright móvil) | Recorrido completo de `INVENTARIO_FUNCIONALIDADES.md` marcando ✅ cada ID |

Regla del refactor: **nada se borra hasta que su reemplazo pasa QA**; cada fase termina con build verde y un recorrido en navegador (desktop + móvil 375 px).

## 6. Riesgos
- Supabase pausado: sin restaurarlo no hay `pg_dump` ni migración de usuarios (fase 6). Las fases 0-5 no dependen de ello.
- Auth es el bloque más caro (3 OAuth + reset + migración de hashes). Better Auth se aloja en Neon (sin proveedor externo que pause).
- Autorización pasa de declarativa (RLS) a imperativa: se mitiga con un único `lib/authz` y tests por endpoint.
- Rate limiting en memoria no sirve en Vercel → Upstash desde la fase 0.
- `scrape-url` está en prod sin código: se reescribe (`/api/ai/scrape` con fetch + readability).
