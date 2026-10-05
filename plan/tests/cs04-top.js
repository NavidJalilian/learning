const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 900 }, colorScheme: 'light' });
  const p = await ctx.newPage();
  await p.goto('file:///home/user/learning/reference/ch04-rate-limiter-cheatsheet.html'); await p.waitForTimeout(300);
  await p.screenshot({ path: process.argv[2] });
  await b.close();
})();
