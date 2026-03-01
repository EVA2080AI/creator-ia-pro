# PROJECT_JOURNAL.md — CanvasAI

## Visión
SaaS de IA generativa con lienzo infinito. Modelo credit-based.

## Stack
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + React Flow (@xyflow/react)
- **Backend:** Lovable Cloud (Supabase) — PostgreSQL, Auth, Edge Functions, Storage
- **Design:** Dark-first (slate-950), cyan/emerald accents, Space Grotesk + JetBrains Mono

## Arquitectura de BD (V1)

| Tabla | Propósito |
|-------|-----------|
| `profiles` | Balance de créditos, datos del usuario. Auto-creado vía trigger en signup. |
| `canvas_nodes` | Nodos del lienzo: posición (x,y), tipo (image/video), status, asset_url, prompt |
| `transactions` | Registro de débitos, créditos y rollbacks |

### RLS
- Todas las tablas tienen RLS habilitado.
- `user_id = auth.uid()` en todas las políticas.

## Decisiones Arquitectónicas

1. **React Flow vs tldraw:** Se eligió React Flow (@xyflow/react) por mejor compatibilidad con Vite y API más simple para nodos custom.
2. **Persistencia Debounced:** Las posiciones de nodos se guardan con debounce de 500ms para no saturar la BD durante drag.
3. **Credit-Aware:** Los créditos se verifican en el cliente antes de generar. La V2 moverá esta lógica a Edge Functions para seguridad transaccional.
4. **Generación de IA (Placeholder):** V1 usa imágenes de picsum.photos como placeholder. V2 integrará APIs reales vía Edge Functions.

## Estado Actual
- [x] Design system (dark slate-950, cyan/emerald)
- [x] Auth (login/signup con email)
- [x] Lienzo infinito con React Flow
- [x] Nodos custom con estados (loading/ready/error)
- [x] Persistencia debounced de posiciones
- [x] Sistema de créditos (client-side)
- [ ] Edge Function para generación real (Fal.ai/Replicate)
- [ ] Edge Function credit-aware con rollback
- [ ] Vista galería para móvil
- [ ] Stripe para compra de créditos
