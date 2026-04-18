# Creator IA Pro — Design System

Sistema de diseño basado en las 8 filosofías estéticas clásicas, adaptado para una plataforma de IA generativa.

## Comandos Rápidos

| Comando | Descripción |
|---------|-------------|
| `/design-flow` | Orquesta flujo completo de diseño |
| `/grill-me` | Interroga decisiones de diseño hasta resolverlas |
| `/design-brief` | Brief estructurado con exploración de codebase |
| `/information-architecture` | Estructura: navegación, jerarquía, URLs, flujos |
| `/design-tokens` | Sistema completo de tokens (light/dark) |
| `/brief-to-tasks` | Checklist ordenado de "vertical slices" |
| `/frontend-design` | Implementación mobile-first con filosofía |
| `/design-review` | Crítica estructurada contra el brief |

## Filosofías Aplicables

1. **Dieter Rams** — "Less but better". Funcional. Sin decoración sin propósito.
2. **Swiss/International** — Grid-locked. Jerarquía tipográfica fuerte. Objetivo.
3. **Japanese Minimalism (Ma)** — El espacio negativo es contenido. Silencio. Restricción.
4. **Brutalist** — Estructura cruda visible. Anti-pulido. Contenido primero.
5. **Scandinavian** — Calidez + restricción. Redondeado. Accesible por defecto.
6. **Art Deco** — Lujo geométrico. Simetría audaz. Tipografía statement.
7. **Neo-Memphis** — Caos juguetón. Color chocante. Anti-corporativo.
8. **Editorial/Magazine** — Liderado por contenido. Tipografía display. Inspirado en print.

## Filosofía Actual: Dieter Rams + Swiss

La plataforma usa una combinación de **Dieter Rams** (funcionalidad pura) y **Swiss** (jerarquía tipográfica precisa, grid sistemático).

### Principios Clave Aplicados

- **Functional** — Cada elemento tiene un propósito
- **Grid-locked** — Sistema de 8pt, columnas consistentes
- **Type Hierarchy** — Peso y tamaño indican importancia
- **No decoration** — Sin gradients innecesarios, sin sombras excesivas
- **Content-first** — La IA y el contenido son el foco

## Estructura

```
.design/
├── README.md
├── skills/           # Comandos documentados
├── philosophies/     # Filosofías con ejemplos
├── tokens/          # Design tokens (colors, typography, spacing)
├── briefs/          # Briefs de features
└── reviews/         # Reviews de implementaciones
```

## Decisiones de Diseño Documentadas

- [2026-04-18] Hero con mockup de Studio — Proporciona contexto inmediato
- [2026-04-18] 6 planes de pricing — Transparencia total, escalado claro
- [2026-04-18] Dark mode por defecto en Studio — Reduce fatiga visual en sesiones largas
