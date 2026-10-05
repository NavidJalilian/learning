const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  await p.goto('file:///home/user/learning/lessons/1003-notification-reliability.html'); await p.waitForTimeout(500);
  const H = await p.evaluate(() => document.documentElement.scrollHeight); console.log('height', H);
  const n = 5, step = Math.ceil(H / n);
  for (let i = 0; i < n; i++) await p.screenshot({ path: `1003-part${i}.png`, fullPage: true, clip: { x: 0, y: i * step, width: 375, height: Math.min(step, H - i * step) } });
  await b.close();
})();
