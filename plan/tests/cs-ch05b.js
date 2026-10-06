const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 1300 }, colorScheme: 'dark' });
  const p = await ctx.newPage();
  await p.goto('file:///home/user/learning/reference/ch05-consistent-hashing-cheatsheet.html'); await p.waitForTimeout(400);
  for (const [i, sel] of [[0, 'body'], [1, '#q51'], [2, '#q52'], [3, '#boss']]) {
    await p.evaluate(s => document.querySelector(s).scrollIntoView(), sel);
    await p.screenshot({ path: `${process.env.S}/ch05-v${i}.png` });
  }
  await b.close();
})();
