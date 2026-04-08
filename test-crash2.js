const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));
    page.on('console', msg => {
      // Print everything so we don't miss it
      if (msg.text().includes('ErrorBoundary') || msg.text().includes('TypeError') || msg.text().includes('ReferenceError') || msg.type() === 'error') {
        console.log('CONSOLE:', msg.text());
      }
    });
    console.log('Navigating...');
    await page.goto('http://localhost:5173/chat', { waitUntil: 'load' });
    
    // Wait for the textarea
    await page.waitForSelector('textarea');
    console.log('Typing prompt...');
    await page.fill('textarea', 'crea una pagina web de prueba');
    
    // Wait for a second and press Enter
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    
    console.log('Waiting for crash...');
    await page.waitForTimeout(4000);
    const text = await page.content();
    if (text.includes('Algo salió mal')) {
      console.log('ERROR IS TRIGGERED!');
    } else {
      console.log('Error NOT triggered. Page content summary:', text.substring(0, 100));
    }
    await browser.close();
  } catch(e) { console.log('Script err:', e); }
})();
