# PROJECT_JOURNAL.md — Creator IA Pro (Nexus V7.0 Industrial 💎)

## Visión
SaaS de IA generativa industrial multimodal con lienzo infinito. Arquitectura resiliente, multi-modelo y diseño minimalista de alto rendimiento.

## Stack (Nexus V7.0 - Industrial Edition)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + React Flow + Zustand
- **Service Layer:** `aiService` (Nexus Industrial Engine)
- **Design System:** Nexus V7.0 Monochrome / Stealth (High Density)
- **AI Gateway:** OpenRouter (DeepSeek/Claude/Gemini/Llama) with Universal Fallback
- **Database:** Supabase (PostgreSQL, Realtime V3.8+, Auth)

## Arquitectura de BD (V4.5)
| Tabla | Propósito |
|-------|-----------|
| `canvas_nodes` | Persistencia de nodos con `data_payload` para modelos y prompts. |
| `profiles` | Gestión de créditos y tiers de usuario. |
| `transactions` | Registro inmutable de operaciones de IA. |

## Decisiones Arquitectónicas (V4.5)
1. **Universal Fallback Selector:** Integración de selectores de modelo por nodo para Imagen, Video, Texto y Layout.
2. **Nexus Industrial UI:** Rediseño total a estética monocromática/stealth, reduciendo el tamaño de nodos para mayor densidad operativa.
3. **Real AI Sync:** Eliminación de mocks en nodos de Layout y Personaje, conectándolos al motor de IA real.

## Estado Final (V4.5 - Live 🚀)
- [x] Nexus V7.0 Industrial Engine (Operational)
- [x] Universal Model Selection (Image/Video/Text/UI)
- [x] Real-time Supabase Persistence (100% Sync)
- [x] Production Deployment (Live at creator-ia.com)
- [x] E2E Aesthetic Harmonization (Monochrome Stealth)
