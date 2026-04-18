# Design Brief: Landing Hero Refresh

**Fecha:** 2026-04-18  
**Status:** En progreso  
**Philosophy:** Dieter Rams + Swiss  
**Scope:** Hero section + Pricing section de Index.tsx

---

## Contexto

El home actual necesita:
1. Hero banner más visual que muestre el producto real (Studio)
2. Sincronizar planes con página de pricing (/pricing tiene 6 planes, home solo mostraba 3)
3. Mejorar UX writing en navegación ("Computo" → "Planes")

## Usuarios

**Primary:** Creadores de contenido, developers, marketers en LATAM  
**Goal:** Entender inmediatamente qué es Creator IA y por qué usarlo  
**Pain point:** No visualizar el producto antes de signup

## Objetivos

- [ ] Aumentar comprehension del producto en 5 segundos
- [ ] Sincronizar pricing entre home y /pricing
- [ ] Mejorar navegación (claridad en labels)

## Exploración de Codebase

### Componentes existentes
- `LandingHeader.tsx` — Navegación global
- `Index.tsx` — Landing page completa
- `Pricing.tsx` — Página de pricing (source of truth)

### CSS Variables disponibles
- Tailwind config con custom colors
- `--primary` es el brand color (purple)
- Sistema de 8pt spacing ya implementado

### Patrones establecidos
- Botones con `font-black uppercase tracking-widest`
- Cards con `rounded-2xl` y borders sutiles
- Motion con `framer-motion` (fadeUp, cardEntrance)

## Requisitos

### Must Have
- [ ] Hero banner visual con mockup de Studio
- [ ] 6 planes de pricing visibles
- [ ] Navegación: "Planes" en lugar de "Computo"
- [ ] CTA: "Ver Planes" en lugar de "Adquirir Soberania"

### Should Have
- [ ] Floating cards con métricas
- [ ] Animaciones de entrada
- [ ] Responsive en todos los breakpoints

### Nice to Have
- [ ] Interacción en el mockup (hover states)
- [ ] Parallax sutil

## Information Architecture

```
/
├── Hero Section
│   ├── Badge (Plataforma IA #1)
│   ├── Headline (2 líneas)
│   ├── Subheadline
│   ├── CTAs (2 botones)
│   ├── Stats
│   └── Visual Banner (Studio mockup)
├── Stats Bar (dark)
├── Marquee Ticker
├── Product Browser Mockup
├── Product Deep-dive (2 sections)
├── How it Works
├── Testimonials
├── Canvas Section
├── Pricing Section (6 cards)
└── Final CTA
```

## Design Tokens Aplicados

### Color
- Primary: `#8B5CF6` (violet-500)
- Background: `white` / `zinc-900` (dark sections)
- Text: `zinc-900` / `zinc-500` (hierarchy)

### Typography
- Display: `font-black tracking-tight leading-[0.95]`
- Headings: Cal Sans o similar
- Body: Inter, 15px base

### Spacing
- Section padding: `py-24` (96px)
- Component gaps: `gap-6` (24px)
- Card padding: `p-6` (24px)

## Referencias

- Linear.app — Hero con product mockup
- Vercel — Clean typography
- Stripe — Gradiente sutil
- Tailwind UI — Component patterns

## Notas

- Mantener consistencia con Pricing.tsx existente
- Usar imágenes de Unsplash para planes
- Asegurar que todos los planes tengan badge o imagen distintiva
- Mobile: mockup se convierte en scroll horizontal o se oculta

## Checklist de Implementación

- [x] Crear estructura .design/
- [x] Documentar skills y filosofías
- [x] Crear design tokens
- [ ] Actualizar Index.tsx con nuevo hero
- [ ] Sincronizar planes con Pricing.tsx
- [ ] Actualizar LandingHeader.tsx
- [ ] Test responsive
- [ ] Design review
