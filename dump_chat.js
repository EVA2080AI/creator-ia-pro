const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('response', response => {
    if (response.status() >= 400 && response.url().includes('creator-ia.com')) {
      console.log('BAD RESPONSE:', response.status(), response.url());
    }
  });

  try {
    console.log('Navigating to https://creator-ia.com/chat...');
    await page.goto('https://creator-ia.com/chat', { waitUntil: 'networkidle', timeout: 15000 });
    const content = await page.content();
    console.log('PAGE CONTENT LENGTH:', content.length);
    console.log('PAGE TITLE:', await page.title());
    
    // Check if there is an error overlay (like Vite/React error overlay)
    const bodyText = await page.locator('body').innerText();
    console.log('BODY TEXT PREVIEW:', bodyText.substring(0, 500).replace(/\n/g, ' '));
  } catch (error) {
    console.error('SCRIPT ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
