const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 1000 }, colorScheme: 'dark' });
  const p = await ctx.newPage();
  await p.goto('file:///home/user/learning/reference/ch10-notification-cheatsheet.html');
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  console.log('height', H);
  for (let i = 0, y = 0; y < H; i++, y += 1000) await p.screenshot({ path: `${process.argv[2]}/cs10-p${i}.png`, fullPage: true, clip: { x: 0, y, width: 375, height: Math.min(1000, H - y) } });
  await b.close();
})();
