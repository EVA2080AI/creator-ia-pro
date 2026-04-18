# Creator IA Pro

Plataforma de IA generativa para crear apps, imágenes y contenido.

## Design System

Sistema de diseño basado en 8 filosofías estéticas, ubicado en `.design/`.

### Filosofía Actual

**Dieter Rams + Swiss**
- Funcionalidad pura, sin decoración innecesaria
- Grid matemático, jerarquía tipográfica clara
- "Less but better"

### Comandos de Diseño

| Comando | Descripción |
|---------|-------------|
| `/design-flow` | Flujo completo de diseño |
| `/grill-me` | Interrogar decisiones de diseño |
| `/design-brief` | Crear brief estructurado |
| `/information-architecture` | Definir estructura |
| `/design-tokens` | Sistema de tokens |
| `/frontend-design` | Implementar con filosofía |
| `/design-review` | Revisar contra brief |

### Filosofías Disponibles

1. **Dieter Rams** — Funcional, minimalista
2. **Swiss** — Grid, tipografía precisa
3. **Japanese Minimalism (Ma)** — Espacio negativo es contenido
4. **Brutalist** — Estructura cruda visible
5. **Scandinavian** — Calidez + restricción
6. **Art Deco** — Lujo geométrico
7. **Neo-Memphis** — Caos juguetón
8. **Editorial** — Content-led, print-inspired

### Tokens

Ver `.design/tokens/index.css` para variables CSS completas.

```css
/* Primary */
--color-primary-500: #8B5CF6;

/* Spacing (8pt) */
--space-4: 1rem; /* 16px */

/* Typography */
--font-family-display: 'Cal Sans', sans-serif;
--font-size-base: 0.9375rem; /* 15px */
```

## Stack Técnico

- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Animation:** Framer Motion
- **Backend:** Supabase
- **Deployment:** Vercel

## Estructura de Carpetas

```
src/
├── components/
│   ├── ui/           # shadcn components
│   ├── landing/      # Landing page sections
│   ├── studio/       # Studio IDE components
│   └── ...
├── pages/            # Route components
├── lib/             # Utilities
└── integrations/    # Supabase, etc.

.design/
├── skills/          # Comandos documentados
├── philosophies/    # Filosofías con ejemplos
├── tokens/          # Design tokens
└── briefs/          # Briefs de features
```

## Comandos Comunes

```bash
# Dev server
npm run dev

# Build
npm run build

# Deploy
vercel --prod
```

## Decisiones de Diseño Recientes

- [2026-04-18] Sistema de design skills implementado
- [2026-04-18] Hero banner visual en landing
- [2026-04-18] 6 planes de pricing sincronizados
- [2026-04-18] Navegación: "Planes" en lugar de "Computo"
