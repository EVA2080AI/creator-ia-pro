# Creator IA Pro Studio – Especificación Técnica UX/UI
**Proyecto:** Creator IA Pro (Node-based Canvas + Genesis IA)  
**Versión:** 2.0 — Lite (Light Mode Total) + Global Sidebar Navigation  
**URL:** https://creator-ia.com/formarketing  
**Fecha:** Abril 2026

---

## 📐 Principios de Diseño Fundamentales

### Regla de Oro: Light Mode Total
**CRÍTICO:** Esta es la versión Lite. TODO el sitio debe usar light mode. No puede existir NINGUNA página, componente, modal, o estado con elementos oscuros. Esto incluye:
- Canvas principal
- Paneles laterales
- Sidebar de navegación global
- Modales y overlays
- Estados hover/active
- Genesis IA chat
- Tooltips y popovers
- Notificaciones y toasts

### Filosofía UX
1. **Trabajo prolongado sin fatiga visual** - Fondos claros, contrastes suaves
2. **Premium pero técnico** - Limpio como Figma, preciso como Linear
3. **Zero learning curve** - Drag & drop intuitivo, feedback inmediato
4. **AI como copiloto, no como herramienta** - Genesis IA guía, no solo ejecuta
5. **Navegación unificada** - Un solo sidebar global reemplaza el header; toda la UI parte de ahí

---

## 🗂️ Sistema de Navegación Global — Sidebar Único (NUEVO v2.0)

### Concepto Central: "Header Muerto, Sidebar Vive"

**El header tradicional ha sido eliminado.** Toda la navegación, branding, acciones globales y acceso a secciones vive en un único sidebar izquierdo. Todos los paneles secundarios (nodos, Genesis IA, configuración, etc.) siguen el mismo patrón de sidebar para garantizar coherencia total de UX/UI.

### Principios del Sistema de Sidebars

| Regla | Descripción |
|-------|-------------|
| **Un solo sidebar global** | El sidebar izquierdo principal es la única navegación; no hay header |
| **Comportamiento consistente** | Todos los sidebars usan las mismas animaciones, sombras y transiciones |
| **Modo colapsado/expandido** | El sidebar global puede colapsar a 64px (solo íconos) o expandir a 240px |
| **No stacking** | Máximo 2 sidebars visibles al mismo tiempo (global + uno contextual) |
| **Overlay en mobile** | En tablet portrait, todos los sidebars usan overlay con backdrop |

---

### HTML — Estructura del Layout Global

```html
<!-- Layout raíz sin header -->
<div class="app-layout">

  <!-- 1. SIDEBAR GLOBAL (reemplaza el header) -->
  <aside class="sidebar-global" id="sidebar-global" data-state="expanded" role="navigation" aria-label="Menú principal">

    <!-- Logo / Branding -->
    <div class="sidebar-global__brand">
      <div class="brand-logo">
        <svg><!-- Logo SVG --></svg>
      </div>
      <span class="brand-name">Creator IA</span>
    </div>

    <!-- Toggle collapse -->
    <button class="sidebar-global__toggle" aria-label="Colapsar menú" id="sidebar-toggle">
      <svg class="icon-chevron"><!-- chevron left --></svg>
    </button>

    <!-- Navegación principal -->
    <nav class="sidebar-global__nav">
      <ul class="sidebar-nav__list">
        <li class="sidebar-nav__item">
          <a href="/studio" class="sidebar-nav__link" data-active="true" aria-current="page">
            <span class="sidebar-nav__icon">
              <svg><!-- Canvas icon --></svg>
            </span>
            <span class="sidebar-nav__label">Studio</span>
          </a>
        </li>
        <li class="sidebar-nav__item">
          <a href="/projects" class="sidebar-nav__link">
            <span class="sidebar-nav__icon">
              <svg><!-- Projects icon --></svg>
            </span>
            <span class="sidebar-nav__label">Proyectos</span>
          </a>
        </li>
        <li class="sidebar-nav__item">
          <a href="/templates" class="sidebar-nav__link">
            <span class="sidebar-nav__icon">
              <svg><!-- Templates icon --></svg>
            </span>
            <span class="sidebar-nav__label">Templates</span>
          </a>
        </li>
        <li class="sidebar-nav__item">
          <a href="/assets" class="sidebar-nav__link">
            <span class="sidebar-nav__icon">
              <svg><!-- Assets icon --></svg>
            </span>
            <span class="sidebar-nav__label">Activos</span>
          </a>
        </li>
        <li class="sidebar-nav__item">
          <a href="/history" class="sidebar-nav__link">
            <span class="sidebar-nav__icon">
              <svg><!-- History icon --></svg>
            </span>
            <span class="sidebar-nav__label">Historial</span>
          </a>
        </li>
      </ul>
    </nav>

    <!-- Divisor -->
    <div class="sidebar-global__divider"></div>

    <!-- Acciones rápidas (las que estaban en el header) -->
    <div class="sidebar-global__actions">
      <!-- Créditos (antes en header) -->
      <div class="sidebar-credits">
        <span class="sidebar-nav__icon">
          <svg><!-- Credits icon --></svg>
        </span>
        <div class="sidebar-credits__info">
          <span class="sidebar-credits__count">240</span>
          <span class="sidebar-credits__label">créditos</span>
        </div>
      </div>

      <!-- Guardar flujo (antes en header) -->
      <button class="sidebar-action-btn" aria-label="Guardar flujo">
        <span class="sidebar-nav__icon"><svg><!-- Save icon --></svg></span>
        <span class="sidebar-nav__label">Guardar</span>
      </button>

      <!-- Exportar (antes en header) -->
      <button class="sidebar-action-btn" aria-label="Exportar flujo">
        <span class="sidebar-nav__icon"><svg><!-- Export icon --></svg></span>
        <span class="sidebar-nav__label">Exportar</span>
      </button>
    </div>

    <!-- Footer del sidebar (perfil de usuario) -->
    <div class="sidebar-global__footer">
      <button class="sidebar-user" aria-label="Perfil de usuario">
        <div class="sidebar-user__avatar">S</div>
        <div class="sidebar-user__info">
          <span class="sidebar-user__name">Sebas</span>
          <span class="sidebar-user__plan">Pro</span>
        </div>
        <svg class="sidebar-user__chevron"><!-- chevron right --></svg>
      </button>
    </div>

  </aside>

  <!-- 2. ÁREA PRINCIPAL -->
  <main class="app-main" role="main">

    <!-- Canvas -->
    <div class="canvas-wrapper">
      {/* React Flow canvas */}
    </div>

    <!-- 3. SIDEBAR CONTEXTUAL DERECHO (Genesis IA, propiedades de nodo) -->
    <!-- Sigue el mismo patrón de sidebar -->
    <aside class="sidebar-contextual" id="sidebar-genesis" data-state="open" role="complementary" aria-label="Genesis IA">
      {/* Contenido Genesis IA */}
    </aside>

  </main>

</div>
```

---

### CSS — Sistema Completo de Sidebars

> **Instrucción para Claude al implementar:** Copia este bloque CSS completo en tu archivo `globals.css` o en el módulo de estilos raíz del proyecto. Todas las variables ya están definidas en el `:root` del Design System. Asegúrate de agregar y hacer commit en Git inmediatamente después de cada cambio (`git add -A && git commit -m "feat: add global sidebar navigation system"`).

```css
/* ============================================================
   CREATOR IA PRO — SISTEMA DE SIDEBAR GLOBAL
   Versión 2.0 | Light Mode Total
   Reemplaza completamente el header tradicional
   ============================================================ */

/* ------------------------------------------------------------
   1. LAYOUT RAÍZ — Sin header, todo en sidebar
   ------------------------------------------------------------ */

.app-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--canvas-bg);
}

.app-main {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* ------------------------------------------------------------
   2. SIDEBAR GLOBAL — Variables de control
   ------------------------------------------------------------ */

:root {
  --sidebar-global-width-expanded: 240px;
  --sidebar-global-width-collapsed: 64px;
  --sidebar-contextual-width: 400px;
  --sidebar-transition: 250ms cubic-bezier(0.4, 0, 0.2, 1);

  /* Sidebar tokens */
  --sidebar-bg: var(--surface-primary);
  --sidebar-border: var(--border-subtle);
  --sidebar-item-radius: var(--radius-sm);
  --sidebar-item-h: 40px;
  --sidebar-icon-size: 20px;
  --sidebar-gap: var(--space-1); /* 8px entre items */
  --sidebar-padding-x: 12px;
}

/* ------------------------------------------------------------
   3. SIDEBAR GLOBAL — Base
   ------------------------------------------------------------ */

.sidebar-global {
  width: var(--sidebar-global-width-expanded);
  height: 100vh;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: var(--z-sidebar);
  transition:
    width var(--sidebar-transition),
    box-shadow var(--sidebar-transition);
  overflow: hidden;
  position: relative;
}

/* Estado colapsado */
.sidebar-global[data-state="collapsed"] {
  width: var(--sidebar-global-width-collapsed);
}

/* Al colapsar, elevar sombra para separación visual */
.sidebar-global[data-state="collapsed"] {
  box-shadow: var(--shadow-md);
}

/* ------------------------------------------------------------
   4. SIDEBAR GLOBAL — Branding (reemplaza logo del header)
   ------------------------------------------------------------ */

.sidebar-global__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 20px var(--sidebar-padding-x) 16px;
  min-height: 64px;
  overflow: hidden;
  flex-shrink: 0;
}

.brand-logo {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.brand-name {
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  white-space: nowrap;
  opacity: 1;
  transition: opacity var(--sidebar-transition);
}

/* Ocultar texto de marca al colapsar */
.sidebar-global[data-state="collapsed"] .brand-name {
  opacity: 0;
  pointer-events: none;
}

/* ------------------------------------------------------------
   5. SIDEBAR GLOBAL — Botón de colapso
   ------------------------------------------------------------ */

.sidebar-global__toggle {
  position: absolute;
  top: 20px;
  right: -13px;
  width: 26px;
  height: 26px;
  background: var(--surface-primary);
  border: 1px solid var(--border-default);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: var(--shadow-sm);
  color: var(--text-secondary);
  transition:
    background 150ms ease,
    color 150ms ease,
    transform var(--sidebar-transition);
}

.sidebar-global__toggle:hover {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

/* Rotar el chevron al colapsar */
.sidebar-global[data-state="collapsed"] .sidebar-global__toggle .icon-chevron {
  transform: rotate(180deg);
}

.icon-chevron {
  width: 14px;
  height: 14px;
  transition: transform var(--sidebar-transition);
}

/* ------------------------------------------------------------
   6. SIDEBAR GLOBAL — Navegación
   ------------------------------------------------------------ */

.sidebar-global__nav {
  flex: 1;
  padding: var(--space-1) var(--sidebar-padding-x);
  overflow-y: auto;
  overflow-x: hidden;
  /* Scroll invisible */
  scrollbar-width: none;
}

.sidebar-global__nav::-webkit-scrollbar {
  display: none;
}

.sidebar-nav__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-nav__item {
  width: 100%;
}

/* LINK — Estado base */
.sidebar-nav__link {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: var(--sidebar-item-h);
  padding: 0 10px;
  border-radius: var(--sidebar-item-radius);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  white-space: nowrap;
  transition:
    background 150ms ease,
    color 150ms ease,
    padding 150ms ease;
  position: relative;
}

/* LINK — Hover */
.sidebar-nav__link:hover {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

/* LINK — Activo / página actual */
.sidebar-nav__link[data-active="true"],
.sidebar-nav__link[aria-current="page"] {
  background: var(--brand-light);
  color: var(--brand-primary);
  font-weight: var(--font-semibold);
}

/* Indicador lateral en el item activo */
.sidebar-nav__link[data-active="true"]::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--brand-primary);
  border-radius: 0 2px 2px 0;
}

/* ICON */
.sidebar-nav__icon {
  width: var(--sidebar-icon-size);
  height: var(--sidebar-icon-size);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-nav__icon svg {
  width: var(--sidebar-icon-size);
  height: var(--sidebar-icon-size);
}

/* LABEL — se oculta al colapsar */
.sidebar-nav__label {
  opacity: 1;
  transition: opacity var(--sidebar-transition);
  overflow: hidden;
}

.sidebar-global[data-state="collapsed"] .sidebar-nav__label {
  opacity: 0;
  width: 0;
  pointer-events: none;
}

/* Tooltip en modo colapsado */
.sidebar-global[data-state="collapsed"] .sidebar-nav__link {
  justify-content: center;
  padding: 0;
}

.sidebar-global[data-state="collapsed"] .sidebar-nav__link::after {
  content: attr(data-tooltip);
  position: absolute;
  left: calc(var(--sidebar-global-width-collapsed) + 8px);
  top: 50%;
  transform: translateY(-50%);
  background: var(--text-primary);
  color: white;
  font-size: var(--text-xs);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms ease;
  z-index: 999;
}

.sidebar-global[data-state="collapsed"] .sidebar-nav__link:hover::after {
  opacity: 1;
}

/* ------------------------------------------------------------
   7. SIDEBAR GLOBAL — Divisor
   ------------------------------------------------------------ */

.sidebar-global__divider {
  height: 1px;
  background: var(--sidebar-border);
  margin: var(--space-1) var(--sidebar-padding-x);
  flex-shrink: 0;
}

/* ------------------------------------------------------------
   8. SIDEBAR GLOBAL — Acciones rápidas (ex-header actions)
   ------------------------------------------------------------ */

.sidebar-global__actions {
  padding: var(--space-1) var(--sidebar-padding-x);
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

/* Créditos */
.sidebar-credits {
  display: flex;
  align-items: center;
  gap: 10px;
  height: var(--sidebar-item-h);
  padding: 0 10px;
  border-radius: var(--sidebar-item-radius);
  background: var(--surface-secondary);
}

.sidebar-credits__info {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  overflow: hidden;
  opacity: 1;
  transition: opacity var(--sidebar-transition);
}

.sidebar-global[data-state="collapsed"] .sidebar-credits__info {
  opacity: 0;
  width: 0;
}

.sidebar-credits__count {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--brand-primary);
}

.sidebar-credits__label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

/* Botones de acción (Guardar, Exportar) */
.sidebar-action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: var(--sidebar-item-h);
  padding: 0 10px;
  border: none;
  background: transparent;
  border-radius: var(--sidebar-item-radius);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 150ms ease,
    color 150ms ease;
  text-align: left;
}

.sidebar-action-btn:hover {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

.sidebar-global[data-state="collapsed"] .sidebar-action-btn {
  justify-content: center;
  padding: 0;
}

/* ------------------------------------------------------------
   9. SIDEBAR GLOBAL — Footer / Usuario
   ------------------------------------------------------------ */

.sidebar-global__footer {
  padding: var(--space-1) var(--sidebar-padding-x) 16px;
  flex-shrink: 0;
  border-top: 1px solid var(--sidebar-border);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 52px;
  padding: 0 10px;
  border: none;
  background: transparent;
  border-radius: var(--sidebar-item-radius);
  cursor: pointer;
  text-align: left;
  color: var(--text-primary);
  transition: background 150ms ease;
  overflow: hidden;
}

.sidebar-user:hover {
  background: var(--surface-secondary);
}

.sidebar-user__avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
  flex-shrink: 0;
}

.sidebar-user__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  overflow: hidden;
  opacity: 1;
  transition: opacity var(--sidebar-transition);
}

.sidebar-global[data-state="collapsed"] .sidebar-user__info,
.sidebar-global[data-state="collapsed"] .sidebar-user__chevron {
  opacity: 0;
  width: 0;
}

.sidebar-user__name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-user__plan {
  font-size: var(--text-xs);
  color: var(--brand-primary);
  font-weight: var(--font-medium);
}

.sidebar-user__chevron {
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  flex-shrink: 0;
  transition: opacity var(--sidebar-transition);
}

/* ------------------------------------------------------------
   10. SIDEBAR CONTEXTUAL — Patrón compartido (Genesis IA,
       propiedades de nodo, configuración, etc.)
   ------------------------------------------------------------ */

/*
  REGLA DE ORO: Todo panel secundario usa .sidebar-contextual
  para garantizar comportamiento UX/UI idéntico al sidebar global.
*/

.sidebar-contextual {
  width: var(--sidebar-contextual-width);
  height: 100vh;
  background: var(--sidebar-bg);
  border-left: 1px solid var(--sidebar-border);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: calc(var(--z-sidebar) - 10);

  /* Transición de apertura/cierre */
  transform: translateX(0);
  transition:
    transform var(--sidebar-transition),
    opacity var(--sidebar-transition),
    box-shadow var(--sidebar-transition);
  overflow: hidden;
}

/* Estado cerrado */
.sidebar-contextual[data-state="closed"] {
  transform: translateX(100%);
  opacity: 0;
  pointer-events: none;
}

/* Estado abierto */
.sidebar-contextual[data-state="open"] {
  transform: translateX(0);
  opacity: 1;
}

/* Header del sidebar contextual — siempre igual */
.sidebar-contextual__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-3);
  height: 56px;
  border-bottom: 1px solid var(--sidebar-border);
  background: var(--surface-secondary);
  flex-shrink: 0;
}

.sidebar-contextual__title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.sidebar-contextual__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  transition: background 150ms ease, color 150ms ease;
}

.sidebar-contextual__close:hover {
  background: var(--surface-primary);
  color: var(--text-primary);
}

/* Body del sidebar contextual */
.sidebar-contextual__body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--border-default) transparent;
}

.sidebar-contextual__body::-webkit-scrollbar {
  width: 4px;
}

.sidebar-contextual__body::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: 4px;
}

/* Footer del sidebar contextual */
.sidebar-contextual__footer {
  padding: var(--space-3);
  border-top: 1px solid var(--sidebar-border);
  background: var(--surface-primary);
  flex-shrink: 0;
}

/* ------------------------------------------------------------
   11. OVERLAY — Para tablet portrait (todos los sidebars)
   ------------------------------------------------------------ */

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.3); /* slate-900 al 30% */
  backdrop-filter: blur(2px);
  z-index: calc(var(--z-sidebar) - 1);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--sidebar-transition);
}

.sidebar-overlay[data-visible="true"] {
  opacity: 1;
  pointer-events: auto;
}

/* ------------------------------------------------------------
   12. RESPONSIVE — Comportamiento en tablet
   ------------------------------------------------------------ */

@media (max-width: 1023px) {
  .sidebar-global {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    height: 100vh;
    transform: translateX(0);
    transition:
      transform var(--sidebar-transition),
      width var(--sidebar-transition);
  }

  /* En tablet, el sidebar global empieza colapsado */
  .sidebar-global[data-state="expanded"] {
    width: var(--sidebar-global-width-expanded);
    transform: translateX(0);
  }

  .sidebar-global[data-state="collapsed"] {
    transform: translateX(calc(-1 * var(--sidebar-global-width-collapsed)));
  }

  /* El main no se desplaza */
  .app-main {
    margin-left: 0;
  }

  /* Sidebar contextual ocupa todo el ancho en mobile */
  .sidebar-contextual {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    width: min(var(--sidebar-contextual-width), 90vw);
  }
}

@media (max-width: 767px) {
  .sidebar-contextual {
    width: 100vw;
  }
}

/* ------------------------------------------------------------
   13. FOCUS & ACCESIBILIDAD — Sidebars
   ------------------------------------------------------------ */

.sidebar-nav__link:focus-visible,
.sidebar-action-btn:focus-visible,
.sidebar-user:focus-visible,
.sidebar-global__toggle:focus-visible,
.sidebar-contextual__close:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
  box-shadow: var(--shadow-focus);
}

/* Skip to content para screen readers */
.skip-to-content {
  position: absolute;
  top: -40px;
  left: var(--sidebar-global-width-expanded);
  background: var(--brand-primary);
  color: white;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  text-decoration: none;
  z-index: 9999;
  transition: top 150ms ease;
}

.skip-to-content:focus {
  top: 8px;
}
```

---

### TypeScript — Lógica del Sidebar Global

```typescript
// hooks/useSidebar.ts

import { useState, useCallback, useEffect } from 'react';

type SidebarState = 'expanded' | 'collapsed';
type ContextualSidebarId = 'genesis' | 'node-properties' | 'settings' | 'history';

interface SidebarStore {
  globalState: SidebarState;
  activeContextual: ContextualSidebarId | null;
  toggleGlobal: () => void;
  openContextual: (id: ContextualSidebarId) => void;
  closeContextual: () => void;
}

export const useSidebar = (): SidebarStore => {
  const [globalState, setGlobalState] = useState<SidebarState>('expanded');
  const [activeContextual, setActiveContextual] = useState<ContextualSidebarId | null>(null);

  // Persistir preferencia de colapso
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-global-state') as SidebarState;
    if (stored) setGlobalState(stored);
  }, []);

  const toggleGlobal = useCallback(() => {
    setGlobalState(prev => {
      const next = prev === 'expanded' ? 'collapsed' : 'expanded';
      localStorage.setItem('sidebar-global-state', next);
      return next;
    });
  }, []);

  // Máximo 1 sidebar contextual abierto a la vez
  const openContextual = useCallback((id: ContextualSidebarId) => {
    setActiveContextual(id);
  }, []);

  const closeContextual = useCallback(() => {
    setActiveContextual(null);
  }, []);

  return { globalState, activeContextual, toggleGlobal, openContextual, closeContextual };
};

// Cerrar sidebar contextual con Escape
export const useSidebarKeyboard = (closeContextual: () => void) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContextual();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeContextual]);
};
```

---

### React — Componente SidebarGlobal

```tsx
// components/SidebarGlobal.tsx

import { useSidebar } from '@/hooks/useSidebar';

const NAV_ITEMS = [
  { href: '/studio',    icon: <CanvasIcon />,   label: 'Studio',    tooltip: 'Studio' },
  { href: '/projects',  icon: <FolderIcon />,   label: 'Proyectos', tooltip: 'Proyectos' },
  { href: '/templates', icon: <GridIcon />,      label: 'Templates', tooltip: 'Templates' },
  { href: '/assets',    icon: <ImageIcon />,     label: 'Activos',   tooltip: 'Activos' },
  { href: '/history',   icon: <ClockIcon />,     label: 'Historial', tooltip: 'Historial' },
];

export const SidebarGlobal = () => {
  const { globalState, toggleGlobal, openContextual } = useSidebar();
  const pathname = usePathname();

  return (
    <aside
      className="sidebar-global"
      id="sidebar-global"
      data-state={globalState}
      role="navigation"
      aria-label="Menú principal"
    >
      {/* Branding */}
      <div className="sidebar-global__brand">
        <div className="brand-logo"><CreatorIALogo /></div>
        <span className="brand-name">Creator IA</span>
      </div>

      {/* Toggle */}
      <button
        className="sidebar-global__toggle"
        onClick={toggleGlobal}
        aria-label={globalState === 'expanded' ? 'Colapsar menú' : 'Expandir menú'}
        aria-expanded={globalState === 'expanded'}
        aria-controls="sidebar-global"
      >
        <svg className="icon-chevron" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      </button>

      {/* Nav principal */}
      <nav className="sidebar-global__nav">
        <ul className="sidebar-nav__list" role="list">
          {NAV_ITEMS.map(item => (
            <li key={item.href} className="sidebar-nav__item">
              <Link
                href={item.href}
                className="sidebar-nav__link"
                data-active={pathname === item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                data-tooltip={item.tooltip}
              >
                <span className="sidebar-nav__icon" aria-hidden="true">{item.icon}</span>
                <span className="sidebar-nav__label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-global__divider" />

      {/* Acciones rápidas (ex-header) */}
      <div className="sidebar-global__actions">
        <div className="sidebar-credits" role="status" aria-label="Créditos disponibles">
          <span className="sidebar-nav__icon" aria-hidden="true"><CreditIcon /></span>
          <div className="sidebar-credits__info">
            <span className="sidebar-credits__count">{credits}</span>
            <span className="sidebar-credits__label">créditos</span>
          </div>
        </div>

        <button
          className="sidebar-action-btn"
          onClick={saveFlow}
          aria-label="Guardar flujo"
          data-tooltip="Guardar"
        >
          <span className="sidebar-nav__icon" aria-hidden="true"><SaveIcon /></span>
          <span className="sidebar-nav__label">Guardar</span>
        </button>

        <button
          className="sidebar-action-btn"
          onClick={exportFlow}
          aria-label="Exportar flujo"
          data-tooltip="Exportar"
        >
          <span className="sidebar-nav__icon" aria-hidden="true"><ExportIcon /></span>
          <span className="sidebar-nav__label">Exportar</span>
        </button>
      </div>

      {/* Footer usuario */}
      <div className="sidebar-global__footer">
        <button
          className="sidebar-user"
          onClick={() => openContextual('settings')}
          aria-label="Abrir perfil de usuario"
        >
          <div className="sidebar-user__avatar" aria-hidden="true">S</div>
          <div className="sidebar-user__info">
            <span className="sidebar-user__name">Sebas</span>
            <span className="sidebar-user__plan">Pro</span>
          </div>
          <ChevronRightIcon className="sidebar-user__chevron" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};
```

---

### React — Componente SidebarContextual (Patrón Reutilizable)

```tsx
// components/SidebarContextual.tsx
// Usar este componente base para: Genesis IA, Node Properties, Settings, History

interface SidebarContextualProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const SidebarContextual = ({
  id,
  title,
  icon,
  isOpen,
  onClose,
  footer,
  children,
}: SidebarContextualProps) => {
  // Cerrar con Escape
  useSidebarKeyboard(onClose);

  return (
    <>
      {/* Overlay (tablet/mobile) */}
      <div
        className="sidebar-overlay"
        data-visible={isOpen}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className="sidebar-contextual"
        id={id}
        data-state={isOpen ? 'open' : 'closed'}
        role="complementary"
        aria-label={title}
        aria-hidden={!isOpen}
      >
        {/* Header — siempre igual en todos los sidebars */}
        <div className="sidebar-contextual__header">
          <div className="sidebar-contextual__title">
            {icon && <span aria-hidden="true">{icon}</span>}
            {title}
          </div>
          <button
            className="sidebar-contextual__close"
            onClick={onClose}
            aria-label={`Cerrar ${title}`}
          >
            <XIcon />
          </button>
        </div>

        {/* Body — contenido específico de cada sidebar */}
        <div className="sidebar-contextual__body">
          {children}
        </div>

        {/* Footer — opcional */}
        {footer && (
          <div className="sidebar-contextual__footer">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
};

// USO — Genesis IA
export const SidebarGenesis = () => {
  const { activeContextual, closeContextual } = useSidebar();

  return (
    <SidebarContextual
      id="sidebar-genesis"
      title="Genesis IA"
      icon={<GenesisAvatarIcon />}
      isOpen={activeContextual === 'genesis'}
      onClose={closeContextual}
      footer={<GenesisInputArea />}
    >
      <GenesisMessages />
    </SidebarContextual>
  );
};

// USO — Propiedades de nodo
export const SidebarNodeProperties = () => {
  const { activeContextual, closeContextual } = useSidebar();

  return (
    <SidebarContextual
      id="sidebar-node-props"
      title="Propiedades del Nodo"
      icon={<SettingsIcon />}
      isOpen={activeContextual === 'node-properties'}
      onClose={closeContextual}
    >
      <NodePropertiesForm />
    </SidebarContextual>
  );
};
```

---

### Layout Raíz — Next.js

```tsx
// app/studio/layout.tsx

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Accesibilidad: skip link */}
      <a href="#main-content" className="skip-to-content">
        Ir al contenido principal
      </a>

      {/* Layout raíz: sin header */}
      <div className="app-layout">

        {/* Sidebar global — reemplaza header */}
        <SidebarGlobal />

        {/* Área principal */}
        <main className="app-main" id="main-content" role="main">
          {children}

          {/* Sidebars contextuales */}
          <SidebarGenesis />
          <SidebarNodeProperties />
        </main>

      </div>
    </>
  );
}
```

---

## ⚙️ Regla Obligatoria: Git Commit Automático

**CRÍTICO para Claude:** Cada vez que Claude genere, modifique o cree un archivo en este proyecto, **debe ejecutar automáticamente** los siguientes comandos Git antes de responder que terminó:

```bash
# Siempre ejecutar después de cada cambio
git add -A
git commit -m "tipo(scope): descripción breve del cambio"
git push origin main
```

### Convención de Commits (Conventional Commits)

| Tipo | Cuándo usarlo |
|------|--------------|
| `feat` | Nueva funcionalidad o componente |
| `fix` | Corrección de bug o error de UI |
| `style` | Cambio de CSS, tokens, colores (sin lógica) |
| `refactor` | Reorganización de código sin cambio de comportamiento |
| `docs` | Actualización de documentación o spec |
| `chore` | Configuración, dependencias, herramientas |

### Ejemplos de commits que Claude debe generar automáticamente

```bash
# Al agregar el sidebar global
git add -A && git commit -m "feat(sidebar): add global sidebar navigation replacing header" && git push

# Al actualizar CSS
git add -A && git commit -m "style(sidebar): update collapsed state animations and tooltips" && git push

# Al crear un componente
git add -A && git commit -m "feat(components): add SidebarContextual reusable component" && git push

# Al eliminar el header
git add -A && git commit -m "refactor(layout): remove TopHeader, migrate all actions to SidebarGlobal" && git push
```

### Script helper (agregar a package.json)

```json
{
  "scripts": {
    "git:save": "git add -A && git commit -m",
    "git:push": "git push origin main",
    "git:sync": "git add -A && git commit -m 'chore: sync changes' && git push origin main"
  }
}
```

> **Nota:** Si hay conflictos de merge, Claude debe resolverlos manteniendo siempre los cambios más recientes del branch `main` remoto, excepto en archivos de spec y configuración donde prevalece la versión local.

---

## 🎨 Design System

### Paleta de Colores (Light Mode)
```css
:root {
  /* Canvas & Backgrounds */
  --canvas-bg: #f8fafc;           /* slate-50 - Fondo principal del canvas */
  --surface-primary: #ffffff;      /* Nodos, cards, paneles */
  --surface-secondary: #f1f5f9;    /* slate-100 - Áreas secundarias */
  
  /* Text Hierarchy */
  --text-primary: #0f172a;         /* slate-900 - Títulos principales */
  --text-secondary: #475569;       /* slate-600 - Texto de cuerpo */
  --text-tertiary: #94a3b8;        /* slate-400 - Labels, placeholders */
  
  /* Brand & Accent */
  --brand-primary: #a855f7;        /* purple-500 - Edges, CTAs, focus */
  --brand-secondary: #c084fc;      /* purple-400 - Hover states */
  --brand-light: #f3e8ff;          /* purple-50 - Backgrounds sutiles */
  
  /* States */
  --state-success: #10b981;        /* emerald-500 */
  --state-success-bg: #d1fae5;     /* emerald-100 */
  --state-error: #ef4444;          /* red-500 */
  --state-error-bg: #fee2e2;       /* red-100 */
  --state-warning: #f59e0b;        /* amber-500 */
  --state-warning-bg: #fef3c7;     /* amber-100 */
  --state-processing: #3b82f6;     /* blue-500 */
  --state-processing-bg: #dbeafe;  /* blue-100 */
  
  /* Borders & Dividers */
  --border-subtle: #e2e8f0;        /* slate-200 */
  --border-default: #cbd5e1;       /* slate-300 */
  --border-focus: var(--brand-primary);
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-focus: 0 0 0 4px var(--brand-light);
  
  /* Grid del Canvas */
  --grid-color: #cbd5e1;           /* slate-300 */
  --grid-size: 20px;
  --grid-dot-size: 1px;

  /* Sidebar — ver sección Sistema de Sidebar */
  --sidebar-global-width-expanded: 240px;
  --sidebar-global-width-collapsed: 64px;
  --sidebar-contextual-width: 400px;
  --sidebar-transition: 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Tipografía
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Scale */
--text-xs: 0.75rem;    /* 12px - Labels pequeños */
--text-sm: 0.875rem;   /* 14px - Body text en nodos */
--text-base: 1rem;     /* 16px - Texto principal */
--text-lg: 1.125rem;   /* 18px - Títulos de sección */
--text-xl: 1.25rem;    /* 20px - Títulos de nodo */
--text-2xl: 1.5rem;    /* 24px - Headers principales */

/* Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Espaciado & Layout
```css
/* 8px Grid System */
--space-1: 0.5rem;   /* 8px */
--space-2: 1rem;     /* 16px */
--space-3: 1.5rem;   /* 24px */
--space-4: 2rem;     /* 32px */
--space-6: 3rem;     /* 48px */

/* Radii */
--radius-sm: 0.375rem;   /* 6px - Buttons, inputs */
--radius-md: 0.5rem;     /* 8px - Cards pequeñas */
--radius-lg: 1rem;       /* 16px - Nodos */
--radius-xl: 1.5rem;     /* 24px - Paneles grandes */

/* Z-index Layers */
--z-canvas: 1;
--z-nodes: 10;
--z-edges: 5;
--z-toolbar: 100;
--z-sidebar: 200;
--z-modal: 1000;
--z-toast: 2000;
```

---

## 🧩 Anatomía del Nodo

### Estructura Base
```html
<div class="node-container">
  <!-- Header con icono y título -->
  <div class="node-header">
    <span class="node-icon">{icon}</span>
    <h3 class="node-title">{nombre}</h3>
    <button class="node-menu">⋯</button>
  </div>
  
  <!-- Contenido específico del nodo -->
  <div class="node-content">
    {campos de input/configuración}
  </div>
  
  <!-- Footer con estado/acciones -->
  <div class="node-footer">
    <span class="node-status">{estado}</span>
    <button class="node-action">{CTA}</button>
  </div>
  
  <!-- Handles de conexión -->
  <div class="handle handle-input"></div>
  <div class="handle handle-output"></div>
</div>
```

### Estilos CSS
```css
.node-container {
  min-width: 320px;
  max-width: 400px;
  background: var(--surface-primary);
  border: 2px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Estados */
.node-container[data-state="selected"] {
  border-color: var(--brand-primary);
  box-shadow: var(--shadow-focus);
}

.node-container[data-state="processing"] {
  border-color: var(--state-processing);
  animation: pulse-border 2s ease-in-out infinite;
}

.node-container[data-state="error"] {
  border-color: var(--state-error);
  background: var(--state-error-bg);
}

.node-container[data-state="success"] {
  border-color: var(--state-success);
}

.node-container[data-state="disabled"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Handles */
.handle {
  width: 16px;
  height: 16px;
  background: var(--surface-primary);
  border: 2px solid var(--brand-primary);
  border-radius: 50%;
  position: absolute;
  transition: all 150ms ease;
}

.handle-input {
  left: -9px;
  top: 50%;
  transform: translateY(-50%);
}

.handle-output {
  right: -9px;
  top: 50%;
  transform: translateY(-50%);
}

.handle:hover {
  transform: scale(1.25);
  box-shadow: 0 0 0 4px var(--brand-light);
}

.handle[data-valid="false"] {
  border-color: var(--state-error);
  animation: shake 300ms;
}

@keyframes pulse-border {
  0%, 100% { border-color: var(--state-processing); }
  50% { border-color: var(--brand-secondary); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
```

---

## 📊 Sistema de Estados del Nodo

Cada nodo debe manejar 6 estados mutuamente excluyentes:

| Estado | Trigger | Visual | Interacción |
|--------|---------|--------|-------------|
| **Idle** | Estado inicial | `border-subtle`, `bg-white` | Editable, conectable |
| **Processing** | API call en progreso | Animated border purple, edge animado | Solo cancelable |
| **Success** | Respuesta exitosa | Border verde 2s, luego vuelve a idle | Muestra resultado |
| **Error** | API error / validación fallida | `bg-error-bg`, mensaje de error en footer | Retry button visible |
| **Validating** | Al conectar/desconectar | Border azul pulsante | No editable temporalmente |
| **Disabled** | Upstream node error o sin créditos | `opacity-50`, grayscale | No interactuable |

### Implementación TypeScript
```typescript
type NodeState = 
  | 'idle' 
  | 'processing' 
  | 'success' 
  | 'error' 
  | 'validating' 
  | 'disabled';

interface NodeStatus {
  state: NodeState;
  message?: string;
  progress?: number; // 0-100 para processing
  errorCode?: string;
}

interface BaseNodeData {
  id: string;
  type: NodeType;
  status: NodeStatus;
  lastUpdated: number;
  credits_cost?: number;
}
```

---

## 🔌 Sistema de Tipos de Datos y Puertos

### Tipos de Datos Soportados
```typescript
type DataType = 
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'conditioning'
  | 'json';

interface Port {
  id: string;
  type: 'input' | 'output';
  dataType: DataType;
  label: string;
  required: boolean;
  multiple?: boolean;
}

interface NodeTypeDefinition {
  id: string;
  name: string;
  category: 'input' | 'processing' | 'output' | 'utility';
  icon: string;
  description: string;
  inputs: Port[];
  outputs: Port[];
  config: Record<string, any>;
}
```

### Validación de Conexiones
```typescript
const isValidConnection = (
  sourceNode: Node,
  sourceHandle: string,
  targetNode: Node,
  targetHandle: string
): boolean => {
  if (sourceNode.id === targetNode.id) return false;
  if (wouldCreateCycle(sourceNode, targetNode)) return false;
  
  const sourcePort = sourceNode.data.outputs.find(p => p.id === sourceHandle);
  const targetPort = targetNode.data.inputs.find(p => p.id === targetHandle);
  if (!sourcePort || !targetPort) return false;
  if (sourcePort.dataType === targetPort.dataType) return true;
  
  const autoConversions: Record<DataType, DataType[]> = {
    'image': ['conditioning'],
    'text': ['json'],
    'json': ['text'],
  };
  
  return (autoConversions[sourcePort.dataType] || []).includes(targetPort.dataType);
};
```

---

## 📦 Catálogo de Módulos (Nodos)

### A. Nodos de Entrada (Inputs)

#### 1. Prompt Base
```typescript
interface PromptNodeData extends BaseNodeData {
  type: 'prompt_base';
  config: { prompt: string; systemPrompt?: string; };
  outputs: [{ id: 'text_out', type: 'output', dataType: 'text', label: 'Prompt' }];
}
```
**UI del Nodo:** Icono 📝 · Textarea autoresizable · Contador de caracteres · Botón "Variables"

#### 2. Personaje / Marca
```typescript
interface BrandNodeData extends BaseNodeData {
  type: 'brand_persona';
  config: {
    brandName: string;
    tone: 'professional' | 'casual' | 'playful' | 'authoritative';
    targetAudience: string;
    keyValues: string[];
  };
}
```
**UI del Nodo:** Icono 🎭 · Radio buttons de tone · Tag input para valores clave

#### 3. Subir Activo
```typescript
interface UploadNodeData extends BaseNodeData {
  type: 'upload_asset';
  config: { fileUrl?: string; fileName?: string; fileType?: string; fileSize?: number; };
}
```
**UI del Nodo:** Icono 📎 · Drag & drop zone · Progress bar · Thumbnail preview

### B. Nodos de Procesamiento (IA Generativa)

#### 4. Generador de Imagen — 1 crédito
```typescript
interface ImageGenNodeData extends BaseNodeData {
  type: 'image_generator';
  config: {
    model: 'flux-pro' | 'flux-dev' | 'stable-diffusion-3';
    aspectRatio: '16:9' | '1:1' | '9:16' | '4:3';
    guidanceScale: number;
    numInferenceSteps: number;
    seed?: number;
  };
}
```

#### 5. Copywriter LLM — 0.5 créditos
```typescript
interface CopywriterNodeData extends BaseNodeData {
  type: 'copywriter_llm';
  config: {
    format: 'ad_copy' | 'blog_post' | 'tweet' | 'email' | 'video_script';
    maxLength: number;
    includeHashtags: boolean;
    includeEmojis: boolean;
  };
}
```

#### 6. Mejora / Upscaler — 0.5-1 crédito
```typescript
interface UpscalerNodeData extends BaseNodeData {
  type: 'upscaler';
  config: { scale: 2 | 4; model: 'real-esrgan' | 'ultrasharp'; denoise: number; };
}
```

#### 7. ControlNet / Estructura
```typescript
interface ControlNetNodeData extends BaseNodeData {
  type: 'controlnet';
  config: { preprocessor: 'canny' | 'depth' | 'pose' | 'lineart'; strength: number; };
}
```

### C. Nodos de Salida

#### 8. Exportar a Redes
```typescript
interface SocialExportNodeData extends BaseNodeData {
  type: 'social_export';
  config: { platforms: ('instagram' | 'twitter' | 'facebook' | 'linkedin')[]; caption?: string; scheduled?: Date; };
}
```

#### 9. Descargar ZIP
```typescript
interface DownloadNodeData extends BaseNodeData {
  type: 'download_zip';
  config: { fileName: string; };
}
```

---

## 🤖 Genesis IA – Panel como Sidebar Contextual

Genesis IA **ya no es un panel flotante fijo**: ahora se implementa usando el componente `SidebarContextual` del sistema unificado. Esto garantiza que Genesis tenga exactamente el mismo comportamiento de apertura, cierre, overlay, y transiciones que cualquier otro panel secundario.

### Activación desde el Sidebar Global

El botón para abrir Genesis **vive en el sidebar global**, no en el canvas:

```tsx
// En SidebarGlobal, dentro de sidebar-global__actions
<button
  className="sidebar-action-btn"
  onClick={() => openContextual('genesis')}
  aria-label="Abrir Genesis IA"
  data-tooltip="Genesis IA"
>
  <span className="sidebar-nav__icon" aria-hidden="true"><GenesisIcon /></span>
  <span className="sidebar-nav__label">Genesis IA</span>
</button>
```

### Estilos CSS del Panel Genesis (dentro del SidebarContextual)

```css
/* Contenido específico de Genesis — dentro de .sidebar-contextual__body */

.genesis-messages {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 100%;
}

.message-bubble {
  max-width: 85%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.message-bubble.user {
  align-self: flex-end;
  background: var(--brand-light);
  color: var(--text-primary);
  border: 1px solid var(--brand-secondary);
}

.message-bubble.genesis {
  align-self: flex-start;
  background: var(--surface-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
}

.message-bubble.streaming::after {
  content: '▊';
  animation: blink 1s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

/* Input area — va en .sidebar-contextual__footer */
.genesis-input-area {
  display: flex;
  gap: var(--space-2);
}

.genesis-textarea {
  flex: 1;
  min-height: 44px;
  max-height: 120px;
  padding: var(--space-2);
  border: 2px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: var(--text-sm);
  resize: none;
  background: var(--surface-primary);
  color: var(--text-primary);
}

.genesis-textarea:focus {
  outline: none;
  border-color: var(--brand-primary);
  box-shadow: var(--shadow-focus);
}

.genesis-send {
  width: 44px;
  height: 44px;
  background: var(--brand-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 150ms;
  flex-shrink: 0;
}

.genesis-send:hover:not(:disabled) {
  background: var(--brand-secondary);
  transform: translateY(-2px);
}

.genesis-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Capacidades de Genesis IA (sin cambios funcionales)

Genesis mantiene todas sus capacidades de context awareness, tool calling, streaming y sugerencias proactivas tal como se definieron en v1.0. La única diferencia es que el panel ahora usa el sistema `SidebarContextual` en lugar de un panel CSS fijo y flotante.

```typescript
const streamGenesisResponse = async (userMessage: string, context: CanvasContext) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      stream: true,
      messages: [{ role: 'user', content: buildGenesisPrompt(userMessage, context) }],
      tools: genesisTools
    })
  });
  // ... lógica de streaming igual que v1.0
};
```

---

## 🚨 Manejo de Errores

| Error | Causa | UI Feedback | Acción Usuario |
|-------|-------|-------------|----------------|
| **API Timeout** | Generación >60s | Toast sticky | Continuar trabajando |
| **Rate Limit** | >10 req/min | Modal bloqueante | Esperar o upgrade |
| **Invalid Connection** | Tipos incompatibles | Nodo shake + tooltip | Reconectar |
| **Créditos Insuficientes** | Balance = 0 | Modal bloqueante | Ir a billing |
| **NSFW Content** | Imagen bloqueada | Estado error en nodo | Cambiar prompt |
| **Network Error** | Sin internet | Banner en sidebar global | Esperar |

---

## ⚡ Performance y Persistencia

```typescript
// Virtualización del canvas
const useVisibleNodes = (nodes: Node[], viewport: Viewport) =>
  useMemo(() => nodes.filter(node => isInViewport(node, viewport, 200)), [nodes, viewport]);

// Debounce auto-save
const useDebouncedSave = (flow: Flow, delay = 3000) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => saveFlowToSupabase(flow), delay);
    return () => clearTimeout(timeoutRef.current);
  }, [flow, delay]);
};
```

---

## ♿ Accesibilidad (WCAG 2.1 AA)

### Contraste de Colores
```
✅ text-primary (#0f172a) sobre bg-white → 18.2:1
✅ text-secondary (#475569) sobre bg-white → 7.8:1
✅ brand-primary (#a855f7) sobre bg-white → 4.6:1
✅ state-error (#ef4444) sobre bg-white → 4.7:1
```

### Navegación por Teclado

```typescript
const keyboardShortcuts = {
  'Space + Drag': 'Pan canvas',
  'Cmd/Ctrl + Scroll': 'Zoom in/out',
  'Cmd/Ctrl + 0': 'Reset zoom',
  'Tab': 'Navegar entre nodos',
  'Shift + Tab': 'Navegar atrás',
  'Enter': 'Editar nodo seleccionado',
  'Escape': 'Cerrar sidebar contextual',
  'Cmd/Ctrl + \\': 'Toggle sidebar global',  // NUEVO
  'Cmd/Ctrl + G': 'Abrir Genesis IA',         // Abre como sidebar
  'Cmd/Ctrl + K': 'Abrir menú de nodos',
  '/': 'Focus en búsqueda de nodos'
};
```

### ARIA — Sidebar Global

```html
<aside
  role="navigation"
  aria-label="Menú principal"
  aria-expanded="true"
  id="sidebar-global"
>
  <!-- toggle -->
  <button aria-label="Colapsar menú" aria-expanded="true" aria-controls="sidebar-global" />
  
  <!-- nav link activa -->
  <a aria-current="page" href="/studio">Studio</a>
</aside>

<!-- Genesis IA como sidebar complementario -->
<aside
  role="complementary"
  aria-label="Genesis IA"
  aria-hidden="false"
>
  <div role="log" aria-live="polite" aria-atomic="false" class="genesis-messages" />
  <textarea aria-label="Escribe un mensaje para Genesis IA" />
</aside>
```

---

## 🎯 UX Details (Micro-interacciones)

```typescript
const microInteractions = {
  onEdgeCreated: () => { playSound('connect'); animateEdge('pulse'); showToast('✓ Conectado', 'success', 1500); },
  onInvalidConnection: (targetNode) => { shakeNode(targetNode.id); playSound('error'); showTooltip('Tipos incompatibles', targetNode.position); },
  onGenerationComplete: (nodeId) => { confetti({ particleCount: 50, origin: getNodeCenter(nodeId) }); pulseNode(nodeId, 'success'); },
  onSidebarToggle: () => { /* canvas se redimensiona suavemente con CSS transition */ },
};
```

### Animaciones con Framer Motion

```typescript
const NodeContainer = ({ node, children }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    className="node-container"
    data-state={node.status.state}
  >
    {children}
  </motion.div>
);
```

---

## 📱 Responsive Considerations

```css
/* Desktop — sidebar global visible */
@media (min-width: 1024px) {
  .app-layout { flex-direction: row; }
  .sidebar-global { position: relative; }
  .sidebar-contextual { width: 400px; }
  .node-container { min-width: 320px; }
}

/* Tablet landscape — sidebar colapsado por defecto */
@media (max-width: 1023px) and (min-width: 768px) {
  .sidebar-contextual { width: 350px; }
  .node-container { min-width: 280px; }
  .handle { width: 20px; height: 20px; }
}

/* Tablet portrait — sidebars como overlay */
@media (max-width: 767px) {
  .sidebar-contextual { width: 100vw; }
  .node-container { min-width: 260px; }
  .handle { width: 24px; height: 24px; }
}
```

---

## 🧪 Testing Checklist

### Sidebar (Nuevo en v2.0)
- [ ] El sidebar global colapsa/expande en 250ms sin jank
- [ ] Al colapsar, los tooltips aparecen en hover sobre íconos
- [ ] El estado de colapso persiste en `localStorage` entre sesiones
- [ ] Escape cierra cualquier sidebar contextual abierto
- [ ] `Cmd/Ctrl + \` hace toggle del sidebar global
- [ ] Máximo 1 sidebar contextual visible al mismo tiempo
- [ ] En tablet portrait, sidebars usan overlay con backdrop
- [ ] Genesis IA abre/cierra como SidebarContextual correctamente
- [ ] El canvas se redimensiona suavemente al abrir/cerrar sidebars
- [ ] No existe header en ninguna pantalla de la aplicación

### Funcional
- [ ] Todos los nodos se pueden crear y eliminar
- [ ] Validación de conexiones funciona correctamente
- [ ] Genesis IA responde en <2s y usa streaming
- [ ] Auto-save funciona cada 3s
- [ ] Drag & drop de archivos funciona
- [ ] Exportación de flujos genera JSON válido

### Visual (Light Mode)
- [ ] NO existe ningún elemento oscuro en todo el sitio
- [ ] Contraste de textos cumple WCAG AA
- [ ] Animaciones son smooth (60fps)
- [ ] Estados de nodo se ven claramente distintos
- [ ] Sidebar global usa 100% light mode en todos sus estados

### Git (Nuevo en v2.0)
- [ ] Cada cambio de Claude genera un commit automático
- [ ] Los mensajes de commit siguen Conventional Commits
- [ ] Se ejecuta `git push` después de cada commit
- [ ] No hay cambios sin commitear en el repo local

---

## 📦 Stack Tecnológico

```typescript
const techStack = {
  frontend: {
    framework: 'React 18 + TypeScript',
    canvas: 'React Flow 11',
    state: 'Zustand',
    styling: 'Tailwind CSS 3',
    animations: 'Framer Motion',
    forms: 'React Hook Form + Zod'
  },
  backend: {
    api: 'Next.js API Routes',
    database: 'Supabase (PostgreSQL)',
    storage: 'Supabase Storage',
    realtime: 'Supabase Realtime'
  },
  ai: {
    llm: 'Anthropic Claude (Sonnet 4)',
    imageGen: 'Replicate (Flux, SD3)',
    upscaling: 'Replicate (Real-ESRGAN)'
  },
  tooling: {
    bundler: 'Vite',
    linter: 'ESLint + Prettier',
    testing: 'Vitest + Testing Library',
    deployment: 'Vercel'
  }
};
```

---

## 🎬 Próximos Pasos

1. **Migrar header existente** — Mover todas las acciones del header al `SidebarGlobal` y eliminar el componente `TopHeader`
2. **Implementar SidebarContextual** — Crear el componente base y migrar Genesis IA, Node Properties y Settings
3. **Prototipo de Genesis IA** — Implementar streaming y tool calling dentro del SidebarContextual
4. **Matriz de Conexiones** — Código de validación completo
5. **Sistema de Estados** — Máquina de estados para nodos
6. **Design Tokens** — Variables CSS globales (ya definidas en este doc)
7. **Componente Base de Nodo** — Estructura reutilizable

---

**Documento creado por:** Claude (Anthropic)  
**Para:** Sebas — Lead Product Designer  
**Proyecto:** Creator IA Pro Studio  
**Versión:** 2.0 — Global Sidebar Navigation + Light Mode Total  
**Cambios v2.0:** Header eliminado · Sistema de Sidebar Unificado · CSS completo de implementación · Regla Git automático
