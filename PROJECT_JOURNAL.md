# PROJECT_JOURNAL.md — CanvasAI

## Visión
SaaS de IA generativa con lienzo infinito. Modelo credit-based.

## Stack
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + React Flow (@xyflow/react) + Zustand
- **Backend:** Lovable Cloud — PostgreSQL, Auth, Edge Functions, Storage, Realtime
- **AI:** Lovable AI Gateway (google/gemini-3-pro-image-preview para imágenes)
- **Design:** Dark-first (slate-950), cyan/emerald accents, Space Grotesk + JetBrains Mono

## Arquitectura de BD (V3)

| Tabla | Propósito |
|-------|-----------|
| `profiles` | Balance de créditos, datos del usuario. Auto-creado vía trigger en signup. |
| `canvas_nodes` | Nodos del lienzo: posición (x,y), tipo (image/video), status, asset_url, prompt, **data_payload (JSONB)** |
| `transactions` | Registro de débitos, créditos y rollbacks |
| `user_roles` | Sistema de roles (admin/moderator/user) con función `has_role()` SECURITY DEFINER |
| `spaces` | Proyectos/espacios organizados del usuario |
| `saved_assets` | Biblioteca personal de assets generados (favoritos, tags) |

### RLS
- Todas las tablas tienen RLS habilitado.
- `user_id = auth.uid()` en políticas de usuario.
- `user_roles` protegida con `has_role(auth.uid(), 'admin')`.
- Funciones admin (`admin_list_users`, `admin_update_credits`, `admin_set_user_status`) son SECURITY DEFINER con validación de rol.

### Realtime
- `canvas_nodes` está publicada en `supabase_realtime`.

## Decisiones Arquitectónicas

1. **React Flow vs tldraw:** React Flow por compatibilidad con Vite.
2. **Zustand vs Context API:** Zustand para estado global del canvas. Context prohibido para datos espaciales.
3. **Persistencia Debounced:** Posiciones: 500ms. data_payload: 800ms.
4. **Credit-Aware Edge Functions:** Validación, débito, rollback automático.
5. **Realtime Subscription:** Hook `useNodeSubscription` con filtro por `user_id`.
6. **Ejecución Intencional:** Solo con botón explícito.
7. **Properties Sidebar:** Panel lateral derecho para propiedades del nodo.
8. **Roles con SECURITY DEFINER:** `has_role()` evita recursión RLS.
9. **Admin Dashboard:** Ruta protegida /admin con gestión de usuarios, rutas y esquema DB.
10. **Spaces Explorer:** Organización de proyectos generativos.
11. **Asset Library:** Biblioteca personal con favoritos y tags.

## Rutas

| Ruta | Propósito | Auth |
|------|-----------|------|
| `/` | Landing page | No |
| `/auth` | Login/Signup | No |
| `/canvas` | Lienzo infinito | Sí |
| `/pricing` | Planes de precios | No |
| `/spaces` | Explorador de spaces | Sí |
| `/assets` | Biblioteca de assets | Sí |
| `/admin` | Dashboard admin | Sí + Admin |
| `/reset-password` | Reseteo de contraseña | No |

## Edge Functions

| Función | Propósito |
|---------|-----------|
| `generate-image` | Valida créditos → Debita → Llama a Lovable AI → Actualiza nodo → Rollback si falla |

## Estado Actual
- [x] Design system (dark slate-950, cyan/emerald, gold accents)
- [x] Auth (login/signup con email)
- [x] Lienzo infinito con React Flow
- [x] Nodos custom con estados (loading/ready/error)
- [x] Persistencia debounced de posiciones
- [x] Sistema de créditos (client-side)
- [x] Zustand store global (useCanvasStore)
- [x] Properties Sidebar con modelo/seed/aspect ratio
- [x] Edge Function credit-aware con rollback
- [x] Suscripción Realtime (WebSockets)
- [x] Sistema de roles (admin/moderator/user)
- [x] Admin Dashboard con gestión de usuarios
- [x] Spaces Explorer
- [x] Asset Library con favoritos
- [x] Reset Password flow
- [x] Pricing page (Free/Pro/Delux)
- [ ] Stripe para compra de créditos
- [ ] Vista galería para móvil
- [ ] Auto-save assets al generar
