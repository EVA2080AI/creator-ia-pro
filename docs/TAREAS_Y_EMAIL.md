# Tareas (Kanban móvil) + Correo con Resend

Fecha: 2026-08-25

## Qué se agregó

| Pieza | Ruta | Descripción |
|---|---|---|
| Página | `src/pages/Tasks.tsx` → `/tareas` (alias `/tasks`) | Tablero Kanban personal: **Por hacer · En progreso · Hecho**. Requiere sesión (plan `free` o superior). |
| Componentes | `src/components/tasks/TaskCard.tsx`, `TaskColumn.tsx`, `TaskSheet.tsx` | Tarjeta, columna y hoja de edición (Drawer en móvil / Dialog en escritorio). |
| Hook | `src/hooks/useTasks.ts` | CRUD con actualizaciones optimistas contra `public.tasks`. |
| Helpers | `src/lib/tasks.ts` (+ `tasks.test.ts`) | Orden, agrupación, movimiento entre columnas, fechas sin desfase de zona horaria, recordatorios. |
| Correo (cliente) | `src/services/email-service.ts` | `sendEmail()` → invoca la edge function; nunca lanza, devuelve `{ ok, error, code }`. |
| Correo (servidor) | `supabase/functions/send-email/index.ts` | Edge function (Deno) que envía con la API de Resend, valida al usuario, aplica límites diarios y registra en `email_logs`. |
| Base de datos | `supabase/migrations/20260825120000_tasks_and_email_logs.sql` | Tablas `tasks` y `email_logs` con RLS + triggers. Idempotente. |
| Navegación | Sidebar (“Tareas”), Dashboard (acceso rápido, reemplaza el duplicado “Hub”), buscador ⌘K, atajo **⌘⇧T**, acceso directo PWA en `manifest.json`. |

### Experiencia móvil (100 %)
- Una columna a la vez con selector superior y **deslizar** horizontal para cambiar (framer-motion).
- Botón flotante “+” respetando `env(safe-area-inset-bottom)` (se añadió `viewport-fit=cover` en `index.html`).
- Botones “← →” de 40 px en cada tarjeta para mover sin arrastrar; toque en la tarjeta abre la hoja inferior.
- Inputs con `text-base` (16 px) para evitar el zoom automático de iOS; selector de fecha nativo + atajos “Hoy / Mañana / En 1 semana”.
- Escritorio: tres columnas con **arrastrar y soltar** (soltar sobre una tarjeta la inserta antes; sobre la columna la manda al final).

### Cuándo se envía correo
| Evento | Plantilla | Destinatario |
|---|---|---|
| Crear tarea con “Avisarme por correo” activo | `task_created` | correo del usuario |
| Completar una tarea con aviso activo | `task_completed` | correo del usuario |
| Abrir `/tareas` con tareas con aviso que vencen hoy o están atrasadas (una vez por tarea, campo `reminder_sent_at`) | `task_reminder` | correo del usuario |
| “Enviar por correo” desde la hoja de edición | `task_share` | cualquier dirección (con `reply_to` = usuario) |
| Uso genérico desde código (`template: "custom"`, `subject`, `message`, `to`) | `custom` | cualquier dirección |

Límites aplicados en la función (plan gratuito de Resend = 100/día, 3.000/mes): **30 correos/usuario/día** y **90/día en total**, contados en `email_logs`.

## Puesta en marcha (pendiente — el proyecto de Supabase está pausado)

> El 2026-08-25 la API devolvió `status 'INACTIVE'` para `zfzkohjdwggctogehlkw` y el host no resuelve en DNS: el proyecto está **pausado** por inactividad (plan gratuito). Nada de lo siguiente funciona hasta restaurarlo.

1. **Restaurar el proyecto**: Supabase Dashboard → proyecto `creator-ia-pro` → “Restore project” (o pasar a plan Pro para que no vuelva a pausarse; ver `PROXIMOS_PASOS.md` #1).

2. **Aplicar la migración** (crea `tasks` y `email_logs`):
   ```bash
   cd creator-ia-pro
   npx supabase db push
   # si pide contraseña: SUPABASE_DB_PASSWORD='...' npx supabase db push
   # alternativa: pegar el contenido del .sql en Dashboard → SQL Editor → Run
   ```

3. **Crear la cuenta de Resend (gratis)** en https://resend.com → API Keys → “Create API Key” (permiso *Sending access*).

4. **Configurar secretos** de la edge function:
   ```bash
   npx supabase secrets set RESEND_API_KEY='re_xxxxxxxxx'
   # Opcional, solo cuando el dominio esté verificado:
   npx supabase secrets set RESEND_FROM='Creator IA Pro <tareas@creator-ia.com>'
   ```

5. **Desplegar la función**:
   ```bash
   npx supabase functions deploy send-email
   ```

6. **Probar**: entrar a `/tareas` en el móvil, crear una tarea con “Avisarme por correo” activo → debe llegar “✅ Nueva tarea: …”.

### Sobre el plan gratuito de Resend
- Sin dominio verificado, Resend solo permite el remitente `onboarding@resend.dev` **y solo enviar al correo con el que te registraste en Resend**. Los envíos a otras direcciones fallan con un mensaje que la función traduce a: *“Resend (plan gratuito) solo permite enviar a tu propio correo hasta que verifiques un dominio…”*.
- Para enviar a cualquier usuario: Resend → Domains → Add `creator-ia.com` → agregar los registros DNS (SPF/DKIM) que indique → cuando aparezca *Verified*, configurar `RESEND_FROM` como en el paso 4.
- El plan gratuito incluye 1 dominio, 100 correos/día y 3.000/mes; suficiente para las notificaciones de tareas.

### Auditoría
Cada envío (exitoso o fallido) queda en `public.email_logs` (solo lo lee su dueño; solo la función escribe). Desde el cliente: `fetchEmailLogs()` en `src/services/email-service.ts`.

## Verificación local realizada
- `npx vitest run src/lib/tasks.test.ts` → 13/13 ✓
- `tsc --noEmit` → 0 errores en los archivos nuevos/editados (quedan 47 errores **preexistentes** en otros módulos; Vite compila con esbuild y no los bloquea).
- `npm run build` → ✓ (`dist/assets/Tasks-*.js`).
- `eslint` en los archivos nuevos → 0 errores.

## Ideas siguientes
- Cron diario de recordatorios sin abrir la app: `pg_cron` + `pg_net` llamando a `send-email` con `template: "task_reminder"` por usuario.
- Conectar el formulario público de `/contact` (hoy solo muestra un toast) usando la plantilla `custom` desde una función sin JWT con captcha.
