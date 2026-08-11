# Creator IA Pro Studio — Spec Técnico
**Versión:** 2.0 · Light Mode Total · Global Sidebar  
**URL:** https://creator-ia.com/  
**Stack:** React 18 + TypeScript · Next.js API Routes · React Flow 11 · Zustand · Tailwind CSS 3 · Framer Motion · Supabase · Replicate · Anthropic Claude Sonnet 4

---

## Reglas absolutas

1. **Light mode total.** Ningún elemento, estado, componente o página puede ser oscuro. Esto incluye canvas, sidebars, modales, tooltips, toasts y Genesis IA.
2. **No existe header.** Todo vive en el sidebar global izquierdo.
3. **Máximo 2 sidebars visibles simultáneamente** (global + 1 contextual).
4. **Git automático.** Tras cada cambio: `git add -A && git commit -m "tipo(scope): descripción" && git push origin main`. Usar Conventional Commits (`feat`, `fix`, `style`, `refactor`, `docs`, `chore`).

---

## Design Tokens

```css
:root {
  /* Backgrounds */
  --canvas-bg: #f8fafc;
  --surface-primary: #ffffff;
  --surface-secondary: #f1f5f9;

  /* Text */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;

  /* Brand (purple) */
  --brand-primary: #a855f7;
  --brand-secondary: #c084fc;
  --brand-light: #f3e8ff;

  /* States */
  --state-success: #10b981;    --state-success-bg: #d1fae5;
  --state-error: #ef4444;      --state-error-bg: #fee2e2;
  --state-warning: #f59e0b;    --state-warning-bg: #fef3c7;
  --state-processing: #3b82f6; --state-processing-bg: #dbeafe;

  /* Borders */
  --border-subtle: #e2e8f0;
  --border-default: #cbd5e1;
  --border-focus: var(--brand-primary);

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,.1);
  --shadow-focus: 0 0 0 4px var(--brand-light);

  /* Canvas grid */
  --grid-color: #cbd5e1;
  --grid-size: 20px;

  /* Sidebar */
  --sidebar-global-width-expanded: 240px;
  --sidebar-global-width-collapsed: 64px;
  --sidebar-contextual-width: 400px;
  --sidebar-transition: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --sidebar-bg: var(--surface-primary);
  --sidebar-border: var(--border-subtle);
  --sidebar-item-h: 40px;
  --sidebar-icon-size: 20px;
  --sidebar-padding-x: 12px;

  /* Spacing (8px grid) */
  --space-1: .5rem; --space-2: 1rem; --space-3: 1.5rem; --space-4: 2rem;

  /* Radii */
  --radius-sm: .375rem; --radius-md: .5rem; --radius-lg: 1rem; --radius-xl: 1.5rem;

  /* Z-index */
  --z-canvas: 1; --z-nodes: 10; --z-edges: 5;
  --z-toolbar: 100; --z-sidebar: 200; --z-modal: 1000; --z-toast: 2000;

  /* Typography — Inter */
  --text-xs: .75rem; --text-sm: .875rem; --text-base: 1rem;
  --text-lg: 1.125rem; --text-xl: 1.25rem; --text-2xl: 1.5rem;
  --font-normal: 400; --font-medium: 500; --font-semibold: 600; --font-bold: 700;
}
```

---

## Layout global

```
app-layout (flex row, 100vw/vh, overflow hidden)
├── sidebar-global (izquierda, colapsable 240px↔64px)
│   ├── brand (logo + nombre)
│   ├── toggle (botón colapso, posición absolute derecha)
│   ├── nav (Studio · Proyectos · Templates · Activos · Historial)
│   ├── divider
│   ├── actions (Créditos · Genesis IA · Guardar · Exportar)
│   └── footer (avatar usuario + nombre + plan)
└── app-main (flex, ocupa el resto)
    ├── canvas-wrapper (React Flow)
    └── sidebar-contextual (derecha, 400px, slide desde la derecha)
        Posibles contenidos: genesis | node-properties | settings | history
```

**Comportamiento del sidebar global:**
- Estado (`expanded`/`collapsed`) persiste en `localStorage`.
- Al colapsar: labels y textos se ocultan con `opacity: 0`, íconos centrados, tooltips CSS en hover.
- Toggle: botón circular absoluto en el borde derecho del sidebar, chevron rota 180° al colapsar.
- `Cmd/Ctrl + \` hace toggle.

**Comportamiento del sidebar contextual:**
- Solo 1 abierto a la vez (reemplaza el anterior).
- Cierra con `Escape` o click en overlay (solo mobile/tablet).
- En `≤1023px`: position fixed, overlay backdrop `rgba(15,23,42,.3)`.
- En `≤767px`: width `100vw`.

---

## Tipos TypeScript clave

```typescript
// Sidebar
type SidebarState = 'expanded' | 'collapsed';
type ContextualSidebarId = 'genesis' | 'node-properties' | 'settings' | 'history';

// Nodos
type NodeState = 'idle' | 'processing' | 'success' | 'error' | 'validating' | 'disabled';
type DataType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'conditioning' | 'json';
type NodeType = 'prompt_base' | 'brand_persona' | 'upload_asset' |
                'image_generator' | 'copywriter_llm' | 'upscaler' | 'controlnet' |
                'social_export' | 'download_zip';

interface NodeStatus {
  state: NodeState;
  message?: string;
  progress?: number; // 0-100
  errorCode?: string;
}

interface BaseNodeData {
  id: string;
  type: NodeType;
  status: NodeStatus;
  lastUpdated: number;
  credits_cost?: number;
}

interface Port {
  id: string;
  type: 'input' | 'output';
  dataType: DataType;
  label: string;
  required: boolean;
  multiple?: boolean;
}
```

---

## Hook useSidebar

```typescript
// hooks/useSidebar.ts
export const useSidebar = () => {
  const [globalState, setGlobalState] = useState<SidebarState>('expanded');
  const [activeContextual, setActiveContextual] = useState<ContextualSidebarId | null>(null);

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

  // Máximo 1 contextual abierto
  const openContextual = useCallback((id: ContextualSidebarId) => setActiveContextual(id), []);
  const closeContextual = useCallback(() => setActiveContextual(null), []);

  return { globalState, activeContextual, toggleGlobal, openContextual, closeContextual };
};
```

---

## Componentes React

### SidebarGlobal
```tsx
// NAV_ITEMS: Studio(/studio), Proyectos(/projects), Templates(/templates),
//            Activos(/assets), Historial(/history)
// ACTIONS: Genesis IA (openContextual('genesis')), Guardar, Exportar
// FOOTER: avatar inicial + nombre + plan → openContextual('settings')
// data-state={globalState} en <aside> controla collapse via CSS
```

### SidebarContextual (patrón reutilizable)
```tsx
interface SidebarContextualProps {
  id: string; title: string; icon?: ReactNode;
  isOpen: boolean; onClose: () => void;
  footer?: ReactNode; children: ReactNode;
}
// Estructura: overlay (solo mobile) + aside[data-state=open|closed]
//   → header (título + botón cerrar) + body (scroll) + footer (opcional)
// Escape cierra via useSidebarKeyboard(onClose)
```

### Layout raíz (app/studio/layout.tsx)
```tsx
// <a href="#main-content" className="skip-to-content"> (accesibilidad)
// <div className="app-layout">
//   <SidebarGlobal />
//   <main id="main-content">
//     {children}  ← canvas
//     <SidebarGenesis />
//     <SidebarNodeProperties />
//   </main>
// </div>
```

---

## Catálogo de nodos

| ID | Nombre | Categoría | Entradas | Salidas | Créditos |
|----|--------|-----------|----------|---------|----------|
| `prompt_base` | Prompt Base | input | — | text | 0 |
| `brand_persona` | Personaje/Marca | input | — | text | 0 |
| `upload_asset` | Subir Activo | input | — | image/file | 0 |
| `image_generator` | Generador de Imagen | processing | text, conditioning? | image | 1 |
| `copywriter_llm` | Copywriter LLM | processing | text | text | 0.5 |
| `upscaler` | Mejora/Upscaler | processing | image | image | 0.5–1 |
| `controlnet` | ControlNet | processing | image | conditioning | 0.5 |
| `social_export` | Exportar a Redes | output | image, text? | — | 0 |
| `download_zip` | Descargar ZIP | output | image/file | — | 0 |

**Config por nodo:**
- `image_generator`: model (`flux-pro`|`flux-dev`|`stable-diffusion-3`), aspectRatio, guidanceScale, steps, seed?
- `copywriter_llm`: format (`ad_copy`|`blog_post`|`tweet`|`email`|`video_script`), maxLength, includeHashtags, includeEmojis
- `upscaler`: scale (2|4), model (`real-esrgan`|`ultrasharp`), denoise
- `controlnet`: preprocessor (`canny`|`depth`|`pose`|`lineart`), strength
- `social_export`: platforms (`instagram`|`twitter`|`facebook`|`linkedin`), caption?, scheduled?

---

## Validación de conexiones

```typescript
// Reglas:
// 1. No self-loops
// 2. No ciclos
// 3. dataType debe coincidir, excepto conversiones automáticas:
const autoConversions: Record<DataType, DataType[]> = {
  'image': ['conditioning'],
  'text': ['json'],
  'json': ['text'],
};
```

---

## Estados del nodo

| Estado | Visual |
|--------|--------|
| idle | `border-subtle`, bg blanco |
| processing | border purple animado (pulse), edge animado |
| success | border verde 2s → vuelve a idle |
| error | `bg-error-bg`, mensaje en footer, botón retry |
| validating | border azul pulsante, no editable |
| disabled | opacity 0.5, grayscale, no interactuable |

**CSS data-attribute:** `data-state="idle|processing|success|error|validating|disabled"` en `.node-container`

---

## Anatomía del nodo (CSS)

```
.node-container (min 320px, max 400px, radius-lg, border 2px, shadow-sm)
  .node-header (icono + título h3 + botón menú ⋯)
  .node-content (campos específicos)
  .node-footer (estado + CTA)
  .handle.handle-input (izquierda, 16px circle, border brand-primary)
  .handle.handle-output (derecha, 16px circle, border brand-primary)
```

**Animaciones:** `pulse-border` (processing), `shake` (conexión inválida), Framer Motion entrada `scale 0.8→1` + `whileHover y:-2`.

---

## Genesis IA

Genesis es un `SidebarContextual` (id: `genesis`), abierto desde el sidebar global.

**Capacidades:** context awareness del canvas, tool calling, streaming SSE, sugerencias proactivas.

```typescript
// Llamada a API
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
```

**UI del panel:**
- `.genesis-messages` (flex-col, gap-3, scroll)
  - `.message-bubble.user` (align-end, bg brand-light, border brand-secondary)
  - `.message-bubble.genesis` (align-start, bg surface-secondary)
  - `.message-bubble.streaming::after` → cursor parpadeante `▊`
- Footer: textarea autoresizable (44–120px) + botón enviar 44×44 brand-primary

---

## Performance

```typescript
// Virtualización: solo renderizar nodos visibles
const useVisibleNodes = (nodes: Node[], viewport: Viewport) =>
  useMemo(() => nodes.filter(n => isInViewport(n, viewport, 200)), [nodes, viewport]);

// Auto-save con debounce
const useDebouncedSave = (flow: Flow, delay = 3000) => {
  const ref = useRef<NodeJS.Timeout>();
  useEffect(() => {
    clearTimeout(ref.current);
    ref.current = setTimeout(() => saveFlowToSupabase(flow), delay);
    return () => clearTimeout(ref.current);
  }, [flow]);
};
```

---

## Manejo de errores

| Error | UI |
|-------|----|
| API Timeout (>60s) | Toast sticky |
| Rate Limit (>10 req/min) | Modal bloqueante → upgrade |
| Conexión inválida | Shake en nodo + tooltip |
| Créditos = 0 | Modal bloqueante → billing |
| NSFW | Estado error en nodo |
| Sin internet | Banner en sidebar global |

---

## Accesibilidad (WCAG 2.1 AA)

- `role="navigation"` + `aria-label="Menú principal"` + `aria-expanded` en sidebar global
- `aria-current="page"` en link activo
- `role="complementary"` + `aria-hidden={!isOpen}` en sidebars contextuales
- `role="log"` + `aria-live="polite"` en `.genesis-messages`
- Skip link: `<a href="#main-content" className="skip-to-content">`
- Focus visible con `outline: 2px solid var(--brand-primary)` en todos los elementos interactivos

**Contraste:** text-primary/bg-white: 18.2:1 · text-secondary/bg-white: 7.8:1 · brand-primary/bg-white: 4.6:1

**Atajos de teclado:**
`Cmd+\` toggle sidebar · `Cmd+G` Genesis IA · `Cmd+K` menú nodos · `/` búsqueda · `Escape` cierra contextual · `Tab/Shift+Tab` navega nodos · `Enter` edita nodo

---

## Responsive

| Breakpoint | Comportamiento |
|-----------|----------------|
| ≥1024px | Sidebar global relativo, sidebar contextual 400px |
| 768–1023px | Sidebar global fijo colapsado por defecto, contextual 350px |
| ≤767px | Ambos sidebars como overlay, contextual 100vw |

---

## Checklist de implementación

**Sidebar**
- [ ] Colapsa/expande en 250ms sin jank
- [ ] Tooltips en modo colapsado (CSS `::after`)
- [ ] Estado persiste en `localStorage`
- [ ] Escape cierra cualquier contextual
- [ ] Máximo 1 contextual visible
- [ ] Overlay en tablet/mobile
- [ ] Canvas se redimensiona suavemente
- [ ] No existe header en ninguna pantalla

**Funcional**
- [ ] Crear, conectar y eliminar nodos
- [ ] Validación de conexiones (tipos + ciclos)
- [ ] Genesis IA responde <2s con streaming
- [ ] Auto-save cada 3s
- [ ] Drag & drop de archivos
- [ ] Exportación JSON válido

**Visual (light mode)**
- [ ] Ningún elemento oscuro en todo el sitio
- [ ] Contraste WCAG AA en todos los textos
- [ ] 60fps en animaciones
- [ ] Estados de nodo visualmente distintos

**Git**
- [ ] Cada cambio genera commit automático
- [ ] Conventional Commits
- [ ] `git push` después de cada commit

---

## Próximos pasos (en orden)

1. Eliminar `TopHeader`, mover acciones al `SidebarGlobal`
2. Crear `SidebarContextual` base + migrar Genesis IA, Node Properties, Settings
3. Streaming + tool calling de Genesis IA dentro del contextual
4. Validación completa de conexiones (matriz de tipos)
5. Máquina de estados para nodos
6. Virtualización de canvas
