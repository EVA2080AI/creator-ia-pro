# Dieter Rams

> "Less but better. Functional. No decoration without purpose."

## Principios

1. **Good design is innovative**
2. **Good design makes a product useful**
3. **Good design is aesthetic**
4. **Good design makes a product understandable**
5. **Good design is unobtrusive**
6. **Good design is honest**
7. **Good design is long-lasting**
8. **Good design is thorough**
9. **Good design is environmentally friendly**
10. **Good design is as little design as possible**

## Aplicación en Creator IA

### Visual
- Colores restringidos (primario + neutros)
- Tipografía clara y legible
- Sin gradients excesivos
- Sombras sutiles y funcionales

### UI
- Cada elemento tiene un propósito
- Botones son acciones claras
- Espacio blanco es intencional
- Sin "fluff" visual

### Ejemplos
```css
/* Bien: Clara jerarquía */
.button-primary {
  background: var(--primary-600);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-lg);
  font-weight: var(--font-bold);
}

/* Mal: Decoración innecesaria */
.button-bad {
  background: linear-gradient(45deg, #ff00ff, #00ffff);
  box-shadow: 0 0 20px #ff00ff;
  /* etc... */
}
```

## Aplicar a: Landing, Pricing
