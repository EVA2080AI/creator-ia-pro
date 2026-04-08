const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on('pageerror', err => console.log('REACT RUNTIME CRASH:', err));
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('CONSOLE:', msg.text());
    });
    console.log('Navigating...');
    await page.goto('http://localhost:5173/chat', { waitUntil: 'networkidle' });
    console.log('Typing prompt...');
    await page.fill('input[type="text"]', 'crea un apagina web de perros calientes');
    await page.keyboard.press('Enter');
    console.log('Waiting for crash...');
    await page.waitForTimeout(3000);
    const text = await page.content();
    if (text.includes('Algo salió mal')) {
      console.log('ERROR IS TRIGGERED!');
    }
    await browser.close();
  } catch(e) { console.log('Script err:', e); }
})();
