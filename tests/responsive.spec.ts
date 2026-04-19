import { test, expect } from '@playwright/test';

const breakpoints = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
];

const pages = [
  { path: '/', name: 'home' },
  { path: '/pricing', name: 'pricing' },
  { path: '/auth', name: 'auth' },
  { path: '/dashboard', name: 'dashboard' },
];

for (const page of pages) {
  for (const breakpoint of breakpoints) {
    test(`${page.name} - ${breakpoint.name}`, async ({ page: pg }) => {
      await pg.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await pg.goto(page.path);

      // Check no horizontal overflow
      const body = await pg.$('body');
      const scrollWidth = await body?.evaluate(el => el.scrollWidth);
      const clientWidth = await body?.evaluate(el => el.clientWidth);

      expect(scrollWidth).toBeLessThanOrEqual((clientWidth || 0) + 1);

      // Take screenshot
      await pg.screenshot({
        path: `tests/screenshots/${page.name}-${breakpoint.name}.png`,
        fullPage: true,
      });
    });
  }
}
