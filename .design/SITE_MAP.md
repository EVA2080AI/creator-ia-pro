# Creator IA Pro — Site Map Completo

**Fecha:** 2026-04-18  
**Versión:** v21.0  
**Estado:** Pre-producción

---

## 1. PÁGINAS PÚBLICAS (Sin autenticación)

### 1.1 Landing & Marketing

| Ruta | Archivo | Estado | Completo | Notas |
|------|---------|--------|----------|-------|
| `/` | `Index.tsx` | ✅ | 95% | Landing principal con hero, features, testimonials |
| `/home` | `Home.tsx` | ✅ | 90% | Versión alternativa del home |
| `/inicio` | `Inicio.tsx` | ⚠️ | 80% | Necesita mejorar UX writing y diseño |
| `/landing-test` | `Landing.tsx` | ⚠️ | 70% | Versión de test incompleta |

### 1.2 Autenticación

| Ruta | Archivo | Estado | Completo | Notas |
|------|---------|--------|----------|-------|
| `/auth` | `Auth.tsx` | ✅ | 95% | Login/registro con Supabase |
| `/reset-password` | `ResetPassword.tsx` | ✅ | 90% | Recuperación de contraseña |

### 1.3 Pricing & Información

| Ruta | Archivo | Estado | Completo | Notas |
|------|---------|--------|----------|-------|
| `/pricing` | `Pricing.tsx` | ✅ | 95% | 6 planes + FAQ + comparativa |
| `/documentation` | `Documentation.tsx` | ✅ | 85% | Docs con búsqueda (placeholder) |
| `/docs` | `Docs.tsx` | ✅ | 80% | Docs técnica (versión oscura) |

### 1.4 Producto (Landing Tools)

| Ruta | Archivo | Estado | Completo | Notas |
|------|---------|--------|----------|-------|
| `/herramienta/:toolSlug` | `ToolLanding.tsx` | ✅ | 90% | 12 herramientas con demo interactivo |
| `/product-backlog` | `ProductBacklog.tsx` | ✅ | 95% | Página interna de desarrollo |
| `/descargar` | `Downloads.tsx` | ⚠️ | 30% | Sin apps nativas reales |

---

## 2. PÁGINAS DE PLATAFORMA (Requieren Auth)

### 2.1 Dashboard & Navegación

| Ruta | Archivo | Estado | Completo | Notas |
|------|---------|--------|----------|-------|
| `/dashboard` | `Dashboard.tsx` | ✅ | 90% | Panel principal del usuario |
| `/spaces` | `Spaces.tsx` | ✅ | 85% | Espacios/proyectos del usuario |
| `/spaces` | `HubView.tsx` | ✅ | 85% | Hub de templates (redirect) |
| `/assets` | → redirect to `/spaces` | ✅ | - | Redirección a spaces |

### 2.2 Studio & Canvas

| Ruta | Archivo | Estado | Completo | Notas |
|------|---------|--------|----------|-------|
| `/studio` | `StudioLite.tsx` | ✅ | 90% | Studio simplificado |
| `/studio-flow` | `Formarketing.tsx` | ✅ | 85% | Canvas IA con nodos |
| `/canvas` | Redirect → `/studio-flow` | ✅ | - | Redirección |
| `/formarketing` | Redirect → `/studio-flow` | ✅ | - | Redirección |

### 2.3 Genesis IDE (AI Chat)

| Ruta | Archivo | Estado | Completo | Notas |
|------|---------|--------|----------|-------|
| `/chat` | `Chat.tsx` | ✅ | 90% | Chat con IA (Genesis IDE) |
| `/genesis` | Redirect → `/chat` | ✅ | - | Redirección |

### 2.4 Code IDE

| Ruta | Archivo | Estado | Completo | Notas |
|------|---------|--------|----------|-------|
| `/ide` | `CodeIDE.tsx` | ✅ | 85% | Editor de código |
| `/code` | `CodeIDE.tsx` | ✅ | 85% | Alias |
| `/code-editor` | `CodeIDE.tsx` | ✅ | 85% | Alias |

### 2.5 Tools

| Ruta | Archivo | Estado | Completo | Notas |
|------|---------|--------|----------|-------|
| `/tools` | `Tools.tsx` | ✅ | 85% | Lista de herramientas IA |
| `/apps/:appId` | `Tools.tsx` | ✅ | 85% | Tool específica |

### 2.6 Admin & Sistema

| Ruta | Archivo | Estado | Completo | Notas |
|------|---------|--------|----------|-------|
| `/admin` | `Admin.tsx` | ✅ | 90% | Panel de administración |
| `/system-status` | `SystemStatus.tsx` | ✅ | 80% | Health checks de sistema |
| `/design-system` | `DesignSystem.tsx` | ✅ | 95% | Documentación de diseño |

### 2.7 Usuario

| Ruta | Archivo | Estado | Completo | Notas |
|------|---------|--------|----------|-------|
| `/profile` | `Profile.tsx` | ⚠️ | 60% | Falta edición de avatar/nombre |
| `/sharescreen` | `ShareScreen.tsx` | ✅ | 85% | P2P screen sharing |

---

## 3. ECOSISTEMAS ESPECIALES

### 3.1 Lumina Bistro (Food Ordering)

| Ruta | Archivo | Estado | Completo | Notas |
|------|---------|--------|----------|-------|
| `/menu` | `LuminaMenu.tsx` | ✅ | 90% | Menú del restaurante |
| `/customize` | `LuminaCustomize.tsx` | ✅ | 85% | Personalización de items |
| `/summary` | `LuminaSummary.tsx` | ✅ | 85% | Resumen del pedido |
| `/success` | `ConfirmacionDeEnvio.tsx` | ✅ | 85% | Confirmación de envío |

### 3.2 Nebula Finance

| Ruta | Archivo | Estado | Completo | Notas |
|------|---------|--------|----------|-------|
| `/nebula` | `NebulaDashboard.tsx` | ⚠️ | 70% | Dashboard financiero (incompleto) |

---

## 4. ESTADO POR MÓDULOS

### 4.1 Core Platform (P0)

```
✅ Auth (Login/Register/Reset)
✅ Dashboard principal
✅ Studio Canvas (ReactFlow)
✅ Genesis Chat (AI)
✅ Pricing con Bold.co
✅ Edge Functions (AI Proxy, Bold)
⚠️ Profile (falta edición completa)
```

### 4.2 AI Tools (P0)

```
✅ Texto a Imagen
✅ Mejorar Imagen
✅ Ampliar 4x
✅ Quitar Fondo
✅ Borrar Objetos
✅ Restaurar Foto
✅ Logo Maker
✅ AI Copywriter
✅ AI Blog Writer
✅ Ad Generator
⚠️ Generación de Video (placeholder)
```

### 4.3 Payments (P0)

```
✅ Bold Checkout Links
✅ Bold Webhooks (HMAC)
✅ Deducción de créditos
✅ Rollback en errores
✅ Admin credit management
```

### 4.4 Canvas IA (P1)

```
✅ Lienzo infinito
✅ Nodos de imagen
✅ Persistencia de posición
✅ Espacios/Proyectos
⚠️ Conexión entre nodos (40%)
⚠️ Flujo de datos entre nodos
```

### 4.5 UX & Polish (P1)

```
✅ Dark mode
✅ Toast notifications
✅ Loading states
⚠️ Responsive mobile (70%)
⚠️ SEO dinámico (40%)
⚠️ Canvas mobile optimization
```

---

## 5. PÁGINAS CON ISSUES PARA PRODUCCIÓN

### 🔴 CRÍTICO (Bloqueante)

1. **`/descargar`** — Apps nativas no existen
   - **Fix:** Agregar "Próximamente" o remover página
   
2. **Demo de landing de imágenes** — Son estáticos, no reales
   - **Fix:** Implementar demo limitado real (1 gratis)

3. **SEO dinámico** — Meta tags incompletos
   - **Fix:** Agregar react-helmet-async por página

### 🟡 MEDIO (Debería tener)

1. **`/profile`** — Falta edición completa
   - **Fix:** Agregar edición de avatar, nombre, email

2. **Canvas responsive** — No funciona bien en móvil
   - **Fix:** Optimizar touch gestures

3. **Rate limiting** — Depende de Google API limits
   - **Fix:** Implementar rate limit propio

### 🟢 BAJO (Nice to have)

1. **`/nebula`** — Ecosistema incompleto
2. **Storage Bucket** — Imágenes en base64
3. **Analytics admin** — Métricas de uso

---

## 6. ESTRUCTURA DE NAVEGACIÓN

```
Creator IA Pro
├── 🌐 PUBLIC
│   ├── / (Landing)
│   ├── /auth (Login/Register)
│   ├── /pricing (Planes)
│   ├── /documentation (Docs)
│   └── /herramienta/:slug (12 tools)
│
├── 🔒 PLATFORM (Auth required)
│   ├── /dashboard
│   ├── /spaces (Projects)
│   ├── /studio-flow (Canvas)
│   ├── /chat (Genesis IDE)
│   ├── /ide (Code Editor)
│   ├── /tools (AI Tools)
│   ├── /profile
│   └── /admin (Admin only)
│
└── 🍽️ LUMINA (Food ordering)
    ├── /menu
    ├── /customize
    ├── /summary
    └── /success
```

---

## 7. RUTAS FALTANTES / POR IMPLEMENTAR

### Para Producción (Must Have)
- [x] `/terms` — Términos de servicio ✅
- [x] `/privacy` — Política de privacidad completa ✅
- [x] `/security` — Página de seguridad ✅
- [x] `/contact` — Página de contacto/soporte ✅
- [ ] `/help` — Centro de ayuda (documentación funciona como help)

### Post-Launch (Should Have)
- [ ] `/blog` — Blog de contenido
- [ ] `/affiliates` — Programa de afiliados
- [ ] `/enterprise` — Plan empresarial detallado
- [ ] `/partners` — Partners e integraciones

---

## 8. RECURSOS ESTÁTICOS

### Imágenes (Faltan algunas)
```
src/assets/
├── demo-enhance.jpg ✅
├── demo-upscale.jpg ✅
├── demo-generate.jpg ✅
├── demo-background.jpg ✅
├── demo-logo.jpg ✅
├── demo-restore.jpg ✅
├── demo-social.jpg ✅
└── (Verificar todas existen)
```

### Favicons & SEO
```
public/
├── favicon.ico ❓ (Verificar)
├── og-image.jpg ❓ (Necesita crearse)
├── robots.txt ⚠️ (Revisar contenido)
└── sitemap.xml ❌ (No existe)
```

---

## 9. INTEGRACIONES EXTERNAS

### ✅ Configuradas
- Supabase (Auth + DB + Edge Functions)
- Bold.co (Pagos)
- Google Gemini (AI)

### ⚠️ Verificar
- Vercel Analytics
- Error Tracking (Sentry?)
- Email service (Resend?)

---

## 10. CHECKLIST PRE-PRODUCCIÓN

### Funcionalidad Core
- [ ] Auth flujo completo
- [ ] Todos los AI tools funcionan
- [ ] Canvas guarda y carga
- [ ] Pagos con Bold funcionan
- [ ] Créditos se deducen correctamente
- [ ] Admin panel funciona

### UX/UI
- [ ] Responsive en mobile/tablet/desktop
- [ ] Dark mode funciona en todas las páginas
- [ ] Loading states en todas las acciones
- [ ] Error boundaries funcionan
- [ ] 404 page custom existe

### Legal/SEO
- [ ] Términos de servicio
- [ ] Política de privacidad
- [ ] OG images para redes sociales
- [ ] Meta tags por página
- [ ] Sitemap.xml

### Performance
- [ ] Imágenes optimizadas
- [ ] Lazy loading implementado
- [ ] Bundle size optimizado
- [ ] Core Web Vitals > 90

### Seguridad
- [ ] RLS en todas las tablas
- [ ] Edge functions verifican JWT
- [ ] Webhooks validan HMAC
- [ ] No secrets en frontend

---

**Documento generado:** 2026-04-18  
**Responsable:** Design/Dev Team  
**Próxima revisión:** Antes del deploy a producción
