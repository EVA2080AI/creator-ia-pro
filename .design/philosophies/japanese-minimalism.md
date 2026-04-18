# Japanese Minimalism (Ma)

> "Negative space is content. Quiet. Restrained."

## Principios

- **Ma (間)** — El espacio entre elementos es tan importante como los elementos
- **Wabi-sabi** — Belleza en la imperfección y simplicidad
- **Kanso** — Eliminar lo innecesario
- **Seijaku** — Tranquilidad, ausencia de ruido

## Visual

- Mucho espacio negativo
- Paleta neutra con acentos sutiles
- Líneas finas y limpias
- Sin bordes pesados
- Tipografía ligera

## Aplicación en Creator IA

### Studio
- Interfase limpia sin distracciones
- Canvas con grid invisible
- Controles flotantes mínimos
- Foco total en el contenido generado

### Ejemplo
```css
.studio-interface {
  background: var(--zinc-950);
  /* Sin borders innecesarios */
  border: none;
  
  /* Espacio negativo es contenido */
  padding: calc(var(--space-8) * 2);
  
  /* Elementos flotantes sutiles */
  .toolbar {
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(10px);
  }
}
```

## Aplicar a: Studio, Editor
