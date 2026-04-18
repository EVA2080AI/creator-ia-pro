# /information-architecture

Estructura: navegación, jerarquía, URLs, flujos.

## Output Esperado

### Navegación Global
- Header items
- Footer items
- Sidebar (si aplica)

### Jerarquía de Páginas
```
/
├── /dashboard
├── /studio
│   └── /studio/[tool]
├── /canvas
├── /pricing
└── /auth
```

### Flujos de Usuario
1. Landing → Auth → Dashboard
2. Dashboard → Studio → Export

### URLs
- Convención: kebab-case
- Parámetros: ?tab=settings

## Uso

```
/information-architecture [scope]
```
