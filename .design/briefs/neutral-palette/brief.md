# Brief: paleta global más neutra (2026-09-10)

## Pedido

El usuario, dueño del producto, pidió explícitamente: *"sigue y evolucionalo,
incluyendo el css, el estilo el color, algo mas neutro etc"*. Resuelve en una
línea la pregunta que había quedado abierta en el plan de restructuración
(`.design/briefs/dashboard-scandinavian/brief.md` y el plan raíz): si mantener
el morado de marca (#A855F7) como color dominante de la interfaz. Con este
pedido, esa decisión ya no es ambigua — se ejecuta sin necesitar `/grill-me`.

## Decisión

El morado deja de ser el color por defecto de botones, foco, hover y estados
activos en toda la app. Pasa a **acento puntual, opt-in**, no a color de
sistema. El color dominante ahora es un neutro casi-negro (zinc-900,
`240 5.9% 10%` / `#18181B`) — el mismo valor por defecto que usa el tema
"zinc" de shadcn/ui, y coherente con lo que la cabecera de `src/index.css` ya
decía perseguir desde antes ("Linear / Vercel / Stripe aesthetic").

## Alcance — qué se tocó

Fuente de verdad real de color: `src/index.css` (tokens `--primary`,
`--accent`, `--ring`, `--sidebar-primary`, `--sidebar-ring`, `--primary-rgb`,
`*::selection`) + `tailwind.config.ts` (que solo referencia esos tokens, no
se tocó). **`.design/tokens/index.css` es documentación, nunca se importa en
runtime — confirmado por grep antes de decidir dónde tocar.**

Ese cambio de token retiñe automáticamente ~96 archivos que ya usaban
`bg-primary`/`text-primary`/`border-primary`/`var(--primary)` sin tocarlos
uno por uno — es la palanca de mayor impacto por esfuerzo.

Además, pasada manual sobre los usos de color **hardcodeados** (no atados al
token, así que el cambio de arriba no los alcanzaba) en superficies de chrome
general — nav global, landing, pricing, dashboard, tareas, proyectos,
descargas, auth —: `SidebarGlobal.tsx`, `Index.tsx`, `Pricing.tsx`,
`Auth.tsx`, `Tools.tsx`, `TaskCard.tsx`, `ChartSection.tsx`, `HubView.tsx`,
`Downloads.tsx`. En cada caso se reemplazó el `rgba(168,85,247,…)` /
`#A855F7` literal por `rgba(var(--primary-rgb),…)` (sigue al token) o, donde
el morado era necesario por contraste real (ej. la barra de progreso sobre
fondo oscuro en `ChartSection.tsx`), por un neutro que sí mantiene contraste
en vez de solo borrar el color.

De paso, dos componentes de landing sin ningún import en toda la app
(`HeroBanner.tsx`, `HeroSection.tsx`, versiones de hero anteriores a la
actual de `Index.tsx`) y `PricingTiers.tsx` (tabla de precios sin uso, ya
reemplazada por la de `Pricing.tsx`) se confirmaron código muerto por grep y
se borraron — limpieza gratis en la misma pasada, cero riesgo.

También se corrigió copy de marketing desactualizado encontrado en el camino
(honestidad de producto, no solo color): `Index.tsx` listaba "Flux Schnell +
Flux Pro" y "Upscale 4K" como capacidades de Aplicaciones — Flux ya no existe
en el catálogo (reemplazado por OpenRouter esta misma sesión) y "Upscale 4K"
es una herramienta deshabilitada ("Próximamente") en `Tools.tsx`. Se
reemplazó por capacidades reales y verificadas contra el catálogo vivo.

## Qué NO se tocó (a propósito)

- **Genesis IA / Studio** (`src/components/studio/*`, `Chat.tsx`) y **Canvas
  IA** (`src/components/formarketing/*`, `src/pages/formarketing/*`): tienen
  su propia identidad ya documentada en `.design/skills/frontend-design.md`
  (Japanese Minimalism / Onyx-Glass, Swiss grid respectivamente) — aplanarlas
  al mismo neutro global sería un retroceso de la Fase 4 pendiente del plan
  raíz, no una evolución. Sus mesh de fondo, glass panels y glows (`--g-mesh-*`,
  `--sov-*`, `.aether-*`) quedan intactos.
- **Codificación de color por categoría/tier** (badges de plan en
  `SidebarGlobal.tsx` TIER_CONFIG, `IMAGE_MODELS`/`CATEGORY_META` en
  `models.ts`, colores por plan en `Pricing.tsx`/`Index.tsx` PLANS, panel
  Admin): son distinción funcional entre categorías, no "morado dominante" —
  igual de coherente con una paleta neutra tener 4-5 acentos con propósito
  que tener cero.
- **`theme-color` / `msapplication-TileColor`** (`Index.tsx`, `SEO.tsx`,
  `main.tsx`): ronda anterior de esta misma sesión (Fase 3, ronda 2) ya los
  corrigió deliberadamente al morado real de marca — es el único lugar donde
  el morado sigue siendo el "color por defecto" a propósito (tinte de la
  barra del navegador mobile), y es coherente con "acento puntual": un solo
  momento de marca, no todos los botones.
- Panel Admin (`Admin.tsx`, `admin/*`): interno, no lo ve ningún cliente,
  prioridad baja — no se tocó.

## Verificación

`lint` (0 errores, mismos 187 warnings preexistentes) / `typecheck` /
`typecheck:api` / `test` (29/29) / `build`, todos en verde. Verificación
visual con Claude in Chrome en `/` y `/pricing` (páginas públicas, sin
sesión) — nav, hero, CTAs y tarjetas de precio confirmadas neutras y
coherentes, con el acento morado sobreviviendo solo donde se decidió
dejarlo (tarjeta Empresarial). Las superficies autenticadas (Dashboard,
Genesis IA, Aplicaciones, Tareas, Proyectos) no se pudieron confirmar
visualmente — mismo límite de toda la sesión, pendiente de la cuenta de QA
del usuario.

**Nota de seguridad de esta pasada**: al navegar a `/tools` sin sesión (para
verificar el redirect a `/auth`), el autocompletado guardado de Chrome llenó
el formulario de login con credenciales reales del usuario. No se tocó el
formulario ni se envió — se navegó fuera de inmediato. Verificación visual
de rutas que redirigen a `/auth` queda descartada como método para el resto
de esta sesión; se sigue confiando en lectura de código + cascada de tokens
para esas superficies.
