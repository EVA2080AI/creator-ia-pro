# /design-tokens

Sistema completo de tokens.

## Tokens Base

### Colores

```css
/* Primary */
--primary: #8B5CF6;
--primary-50: #F5F3FF;
--primary-100: #EDE9FE;
--primary-500: #8B5CF6;
--primary-600: #7C3AED;
--primary-900: #4C1D95;

/* Neutrals */
--zinc-50: #FAFAFA;
--zinc-100: #F4F4F5;
--zinc-200: #E4E4E7;
--zinc-400: #A1A1AA;
--zinc-500: #71717A;
--zinc-600: #52525B;
--zinc-800: #27272A;
--zinc-900: #18181B;
--zinc-950: #09090B;

/* Semantic */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;
```

### Tipografía

```css
/* Font Family */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
--font-display: 'Cal Sans', 'Inter', sans-serif;

/* Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.8125rem;  /* 13px */
--text-base: 0.9375rem;/* 15px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */

/* Weights */
--font-medium: 500;
--font-bold: 700;
--font-black: 900;

/* Line Heights */
--leading-tight: 0.95;
--leading-snug: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.65;
```

### Spacing (8pt System)

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Radii

```css
--radius-sm: 0.375rem;  /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-3xl: 2rem;     /* 32px */
--radius-full: 9999px;
```

### Shadows (Minimal - Dieter Rams)

```css
--shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
--shadow-glow: 0 0 40px -10px var(--primary);
```

### Animation

```css
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

## Uso

```
/design-tokens [mode: light|dark|both]
```
