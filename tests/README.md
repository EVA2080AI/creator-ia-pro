# Tests

## `npm run test:e2e`

Screenshots + chequeo de overflow horizontal de las páginas públicas
(`responsive.spec.ts`), en Chromium/Firefox/WebKit + mobile. No requiere
sesión. Resultado en `tests/screenshots/`.

## `npm run test:qa` — QA visual de las superficies autenticadas

Permite verificar visualmente el producto logueado (Dashboard, Genesis IA,
Canvas IA, Aplicaciones, Espacios, Tareas, Perfil) sin que nadie tenga que
iniciar sesión manualmente en cada verificación.

**Cómo funciona**: `auth.setup.ts` loguea una vez con una cuenta de prueba
y guarda la sesión (cookies) en `tests/.auth/user.json`. `authenticated.spec.ts`
reusa esa sesión para navegar cada página y guardar un screenshot en
`tests/screenshots/auth-*.png` — nunca crea, edita ni borra nada.

**Configuración (una sola vez)**:

1. Creá una cuenta de prueba dedicada (NO tu cuenta real de producción) —
   registrate normalmente en `/auth` con un email propio para esto, por
   ejemplo `qa+claude@tudominio.com`.
2. Agregá a `.env.local` (nunca se commitea, ya está en `.gitignore`):
   ```
   TEST_USER_EMAIL=tu-cuenta-de-prueba@ejemplo.com
   TEST_USER_PASSWORD=la-contraseña-de-esa-cuenta
   ```
3. Corré `npm run test:qa`. Los screenshots quedan en `tests/screenshots/auth-*.png`.

**Seguridad**:
- `tests/.auth/user.json` contiene una sesión real logueada — equivale a
  una cookie robada si se filtra. Está en `.gitignore`, nunca se commitea,
  y se regenera en cada corrida.
- No corre en CI (no está en `.github/workflows/ci.yml`) — es una
  herramienta de verificación local/manual.
- Usá una cuenta de prueba separada, no la cuenta real — los tests solo
  navegan y capturan pantalla, pero aislar el radio de impacto es más
  seguro que confiar en que nunca se agregue un test que sí mute datos.
