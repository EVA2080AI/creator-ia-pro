# PROJECT_JOURNAL.md — Creator IA Pro (Industrial V3.4)

## Visión
SaaS de IA generativa industrial con lienzo infinito. Arquitectura descentralizada y resiliente.

## Stack (V3.4 - Industrial Ecosystem)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + React Flow + Zustand
- **Service Layer:** `aiService` & `stripeService` (Centralized Frontend Logic)
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **AI Models:** Google Gemini 1.5 Flash (Direct API), Nano-Banana (Replicate Proxy Ready)
- **Design:** Premium Dark Mode (slate-950), interactive glassmorphism, modern typography.

## Arquitectura de BD (V3.4)
| Tabla | Propósito |
|-------|-----------|
| `profiles` | Balance de créditos, datos del usuario, tier de suscripción. |
| `canvas_nodes` | Nodos del lienzo: persistencia de assets, prompts y estados (loading/ready). |
| `transactions` | Registro inmutable de débitos/créditos vía RPC. |
| `user_roles` | RBAC (Admin/Moderator/User) con seguridad DEFINER. |

## Decisiones Arquitectónicas (V3.4)
1. **Centralización AI (No Edge Functions):** Se eliminó la dependencia de Supabase Functions para la generación, moviendo la lógica al `aiService` del frontend para mayor control y menor latencia.
2. **Créditos Atómicos (RPC):** Se implementó la función `spend_credits` en Postgres para asegurar que el débito de créditos sea atómico y ocurra ANTES de llamar a la IA, evitando fugas de ingresos.
3. **Servicio de Facturación:** `stripeService` actúa como wrapper para futuras migraciones a un backend de facturación dedicado del Ecosistema Creator.
4. **Resiliencia V3.4:** Manejo de errores granular con rollback de créditos si el proceso de IA falla (refund_credits).

## Estado Actual
- [x] Design system Industrial (Dark Premium)
- [x] Auth & RBAC (Admin/User)
- [x] Lienzo Infinito (Canvas V3)
- [x] Gestión de Créditos Segura (SQL RPC)
- [x] Integración Directa Gemini (aiService)
- [x] Dashboard Admin Industrial
- [x] Roadmap 100% Completado (Industrial V3.4)
- [x] Depuración completa de Edge Functions
