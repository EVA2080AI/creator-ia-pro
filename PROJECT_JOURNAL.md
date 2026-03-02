# PROJECT_JOURNAL.md — CanvasAI

## Visión
SaaS de IA generativa con lienzo infinito. Modelo credit-based.

## Stack
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + React Flow (@xyflow/react) + Zustand
- **Backend:** Lovable Cloud — PostgreSQL, Auth, Edge Functions, Storage, Realtime
- **AI:** Lovable AI Gateway (google/gemini-3-pro-image-preview para imágenes)
- **Design:** Dark-first (slate-950), cyan/emerald accents, Space Grotesk + JetBrains Mono

## Arquitectura de BD (V2)

| Tabla | Propósito |
|-------|-----------|
| `profiles` | Balance de créditos, datos del usuario. Auto-creado vía trigger en signup. |
| `canvas_nodes` | Nodos del lienzo: posición (x,y), tipo (image/video), status, asset_url, prompt, **data_payload (JSONB)** |
| `transactions` | Registro de débitos, créditos y rollbacks |

### Columna `data_payload`
Campo JSONB que almacena configuraciones del modelo por nodo: `model`, `seed`, `aspect_ratio`, etc. Se persiste con debounce de 800ms.

### RLS
- Todas las tablas tienen RLS habilitado.
- `user_id = auth.uid()` en todas las políticas.

### Realtime
- `canvas_nodes` está publicada en `supabase_realtime` para recibir cambios de status/asset_url en tiempo real.

## Decisiones Arquitectónicas

1. **React Flow vs tldraw:** Se eligió React Flow (@xyflow/react) por mejor compatibilidad con Vite y API más simple para nodos custom.
2. **Zustand vs Context API:** Se usa Zustand para el estado global del canvas (nodes, edges, selectedNodeId). Prohibido Context API para datos espaciales por rendimiento.
3. **Persistencia Debounced:** Posiciones de nodos: 500ms. data_payload: 800ms.
4. **Credit-Aware Edge Functions:** La Edge Function `generate-image` valida créditos, debita, llama a Lovable AI Gateway, y hace rollback automático si falla.
5. **Realtime Subscription:** Hook `useNodeSubscription` escucha cambios UPDATE en `canvas_nodes` filtrado por `user_id` y actualiza Zustand automáticamente.
6. **Ejecución Intencional:** La generación SOLO se dispara con un botón explícito ("Generar" en toolbar o "Re-generar" en sidebar). No hay auto-ejecución.
7. **Properties Sidebar:** Panel lateral derecho que expone propiedades del nodo seleccionado (prompt, modelo, aspect ratio, seed). Mantiene el canvas limpio.

## Edge Functions

| Función | Propósito |
|---------|-----------|
| `generate-image` | Valida créditos → Debita → Llama a Lovable AI (gemini-3-pro-image-preview) → Actualiza nodo → Rollback si falla |

## Estado Actual
- [x] Design system (dark slate-950, cyan/emerald)
- [x] Auth (login/signup con email)
- [x] Lienzo infinito con React Flow
- [x] Nodos custom con estados (loading/ready/error)
- [x] Persistencia debounced de posiciones
- [x] Sistema de créditos (client-side)
- [x] **Zustand store global (useCanvasStore)**
- [x] **Properties Sidebar con modelo/seed/aspect ratio**
- [x] **Edge Function credit-aware con rollback**
- [x] **Suscripción Realtime (WebSockets)**
- [ ] Vista galería para móvil
- [ ] Stripe para compra de créditos
