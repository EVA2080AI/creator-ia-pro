// QA de sesión autenticada — patrón estándar de Playwright ("setup project"):
// loguea UNA vez con una cuenta de prueba dedicada y guarda la sesión
// (cookies) en tests/.auth/user.json para que el resto de los tests la
// reusen sin volver a loguearse. Nunca corre en CI (no está en el workflow).
//
// Requiere TEST_USER_EMAIL / TEST_USER_PASSWORD en .env.local — una cuenta
// de prueba dedicada, NO la cuenta real de producción. Estas credenciales
// las carga el usuario directamente en .env.local; este script solo lee
// process.env, nunca las tiene como texto en el código.
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '.auth/user.json');

setup('autenticar cuenta de QA', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Faltan TEST_USER_EMAIL / TEST_USER_PASSWORD en .env.local — ver tests/README.md'
    );
  }

  await page.goto('/auth');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

  await page.context().storageState({ path: authFile });
});
