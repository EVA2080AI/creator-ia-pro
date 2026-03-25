# PROJECT_JOURNAL.md — Creator IA Pro (Industrial V4.0 💎)

## Visión
SaaS de IA generativa industrial con lienzo infinito. Arquitectura multi-modelo, resiliente y de alto rendimiento.

## Stack (V4.0 - Antigravity Edition)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + React Flow + Zustand
- **Service Layer:** `aiService` (Antigravity Engine) & `stripeService`
- **AI Gateway:** OpenRouter (Primary: DeepSeek/Claude) + Gemini 2.0 Flash Failover
- **Media Processing:** Industrial Media Proxy (Replicate/GPU) via Supabase Edge Functions
- **Database:** Supabase (PostgreSQL, Realtime V3.8+, Auth)
- **Security:** RLS Hardened + RBAC (Admin/User)

## Arquitectura de BD (V4.0)
| Tabla | Propósito |
|-------|-----------|
| `profiles` | Balance de créditos, tier, email, auto-sync V3.93. |
| `canvas_nodes` | Persistencia con Realtime habilitado para UI sync. |
| `transactions` | Registro inmutable con `node_id` para tracking de IA. |
| `user_roles` | Seguridad de nivel industrial para funciones administrativas. |

## Decisiones Arquitectónicas (V4.0)
1. **Antigravity Engine:** Implementación de un gateway de IA con lógica de "Failover Silencioso" a Gemini si OpenRouter falla o no tiene créditos.
2. **Media Proxy Seguro:** Procesamiento pesado de imágenes (Fondo, Mejorar, Restaurar) delegado a un proxy seguro para proteger API Keys y evitar CORS.
3. **Auto-Sincronización:** Sistema de mitigación V3.93 para evitar que Stripe sobrescriba recargas manuales de créditos.
4. **Créditos Atómicos:** Débito y reembolso atómico vía RPC para máxima integridad financiera.

## Estado Final (V4.0)
- [x] Motor Antigravity V4.0 (Multi-modelo + Failover)
- [x] Media Proxy Industrial (Replicate GPU)
- [x] Sincronización Realtime (Canvas V3.8)
- [x] Auto-Aprovisionamiento (Gift de Bienvenida)
- [x] Dashboard de Diagnóstico V4.0
- [x] Industrial Roadmap 100% Completado
