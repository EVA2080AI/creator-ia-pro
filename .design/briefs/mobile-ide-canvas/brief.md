# Design Brief: Mobile — CodeIDE + Canvas IA (Formarketing)

**Fecha:** 2026-09-09
**Status:** En progreso
**Philosophy:** Dieter Rams + Swiss
**Scope:** `src/pages/CodeIDE.tsx` (`/ide`, `/code`, `/code-editor`) y `src/pages/Formarketing.tsx` (Canvas IA, `/studio-flow`)

---

## Contexto

Fase 5 del plan de UX/UI. Auditoría encontró que ambas páginas tienen cero clases `md:`/`lg:` — son 100% desktop-only hoy, y `useIsMobile` (ya existe en `src/hooks/use-mobile.tsx`, breakpoint 768px) no se usa en ninguna de las dos. Decisión del usuario: construir una versión mobile real, no un mensaje de "usa desktop".

## Usuarios

**Primary:** El mismo usuario de siempre, pero en su teléfono — revisando un proyecto que dejó a medias, probando una idea rápida, ajustando algo puntual. No es el flujo principal de trabajo profundo (eso sigue siendo desktop), es continuidad.

## Objetivos

- CodeIDE y Canvas IA usables en un viewport de 375px sin scroll horizontal accidental ni elementos cortados.
- No degradar ni una línea del layout desktop existente — todo el trabajo nuevo va detrás de `useIsMobile()`, ramas de render separadas donde haga falta.

## Exploración de Codebase

### CodeIDE.tsx — estructura actual (desktop)
- Activity Bar fija de 56px (`w-14`) con 4 tabs (Explorer/Search/Git/Extensions — en la práctica solo Explorer cambia contenido real hoy) + Settings/Perfil abajo.
- `ResizablePanelGroup` de 3 paneles: Explorador (18-32%), Editor (57-82%), Chat IA "Antigravity" (25-40%, toggleable).
- Botón flotante "Antigravity" para abrir/cerrar el panel de chat.
- `StudioTopbar.tsx` (48px, ya tiene un `hidden md:inline` puntual — no rediseñar, solo verificar que no desborda a 375px).

### Formarketing.tsx — estructura actual (desktop)
- Header de 64px con `StudioToolbar.tsx` centrado (9 botones de ícono, ya con aria-label desde Fase 4).
- `FormarketingSidebar.tsx`: **ya tiene un patrón de colapso** — riel de íconos de 56px siempre visible + panel expandible de `w-80` (320px) controlado por `menuOpen`. No hay que inventar el toggle, ya existe; solo falta que el panel expandido no sea un ancho fijo en mobile.
- `ReactFlow` (canvas de nodos) — sin props que deshabiliten touch (`panOnDrag`, etc. no están seteados a false); pan/zoom/drag táctil funciona por defecto de la librería. No necesita rediseño.
- `PropertyInspector.tsx`: panel lateral de ancho fijo `w-[300px]` que aparece al seleccionar un nodo.

### Patrones a reutilizar
- `useIsMobile()` (`src/hooks/use-mobile.tsx`) — ya existe, no usado en ninguna de las dos páginas hoy.
- `src/pages/Tools.tsx` — sidebar `hidden md:flex` + scroll horizontal en mobile para su fila de tabs.
- `src/pages/Admin.tsx` — `flex-col md:flex-row` para reflow de layout.
- Componente `Sheet` (`@/components/ui/sheet`, Radix) — ya usado en otras partes de la app para overlays deslizables; no hace falta uno nuevo.

## Requisitos

### CodeIDE.tsx — Must Have
- [ ] En mobile: una vista a la vez (Archivos / Código / IA), no los 3 paneles simultáneos — el `ResizablePanelGroup` de react-resizable-panels no es táctil y 3 columnas no caben en 375px.
- [ ] Barra de tabs inferior fija (Archivos / Código / IA) que reemplaza a la Activity Bar + el botón flotante "Antigravity" en mobile.
- [ ] Seleccionar un archivo en la vista Archivos navega automáticamente a la vista Código (patrón estándar de editores mobile).
- [ ] Desktop sin cambios — misma rama de código, solo un `if (isMobile) return <...>` antes del JSX actual.

### Formarketing.tsx — Must Have
- [ ] `FormarketingSidebar`: el panel expandido (`w-80`) pasa a `w-full` en mobile (el riel de íconos de 56px ya es angosto, se queda igual).
- [ ] `PropertyInspector`: `w-[300px]` pasa a ancho completo en mobile.
- [ ] `StudioToolbar` (compartido): scroll horizontal si el contenido no cabe, en vez de desbordar o cortarse — mismo patrón que Tools.tsx.

### Nice to Have (no bloquean esta fase)
- Ocultar el MiniMap de React Flow en mobile para ganar espacio de canvas (no es obligatorio, no estorba funcionalmente).

## Design Tokens Aplicados

Los ya reconciliados en Fase 1 (`.design/tokens/index.css` / `src/index.css`) — sin tokens nuevos. Altura de tab bar inferior: 56px (toque cómodo, consistente con los botones de 36-40px ya usados en StudioToolbar/BaseNode).

## Notas

- Breakpoint: 768px (`md:`), consistente con `useIsMobile` y el resto del proyecto.
- No se toca `StudioTopbar.tsx` salvo que la verificación visual muestre desborde real a 375px.
- El Activity Bar de CodeIDE hoy tiene tabs Search/Git/Extensions que no cambian contenido (solo Explorer funciona) — no se replican en la barra mobile; se pierde nada funcional.

## Checklist de Implementación

- [x] Brief
- [x] CodeIDE.tsx: vista mobile de un panel + tab bar inferior (Archivos/Código/IA)
- [x] Formarketing.tsx: `FormarketingSidebar` full-width en mobile, `PropertyInspector` como bottom sheet en mobile (mejor que el "full width" original del brief — no tapa el canvas por completo)
- [x] `StudioToolbar.tsx`: max-width + scroll horizontal en overflow
- [x] `lint`/`typecheck`/`test`/`build` en verde
- [~] Verificación visual: confirmado que `/code` y `/studio-flow` cargan sin error de consola en viewport 390×844 (dev server local). **No se pudo verificar visualmente la vista mobile autenticada real** — ambas rutas exigen sesión y no hay forma de loguearse sin crear una cuenta, algo que no debo hacer. Pendiente: probarlo vos mismo con una cuenta real y avisarme si algo se ve mal.
