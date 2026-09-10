// Screenshots de las superficies autenticadas — mismo patrón que
// responsive.spec.ts, pero reusando la sesión guardada por auth.setup.ts.
// Solo navega y captura: no crea, edita ni borra nada real.
import { test, expect } from '@playwright/test';

const breakpoints = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'desktop', width: 1440, height: 900 },
];

const pages = [
  { path: '/dashboard', name: 'dashboard' },
  { path: '/chat', name: 'genesis-ia' },
  { path: '/studio-flow', name: 'canvas-ia' },
  { path: '/tools', name: 'aplicaciones' },
  { path: '/spaces', name: 'espacios' },
  { path: '/tareas', name: 'tareas' },
  { path: '/profile', name: 'perfil' },
];

for (const page of pages) {
  for (const breakpoint of breakpoints) {
    test(`${page.name} - ${breakpoint.name}`, async ({ page: pg }) => {
      await pg.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await pg.goto(page.path);
      await pg.waitForLoadState('networkidle').catch(() => {});

      // No debe quedar redirigido a /auth (sesión inválida/expirada)
      await expect(pg).not.toHaveURL(/\/auth/);

      await pg.screenshot({
        path: `tests/screenshots/auth-${page.name}-${breakpoint.name}.png`,
        fullPage: true,
      });
    });
  }
}
