const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 1400 }, colorScheme: 'dark' });
  const p = await ctx.newPage();
  await p.goto('file:///home/user/learning/reference/ch07-unique-id-cheatsheet.html'); await p.waitForTimeout(300);
  for (const id of ['q72', 'q74', 'boss']) { await p.$eval('#' + id, e => e.scrollIntoView()); await p.screenshot({ path: `${process.argv[2]}/cs07-${id}.png` }); }
  await p.evaluate(() => scrollTo(0, 0)); await p.screenshot({ path: `${process.argv[2]}/cs07-top.png` });
  await b.close();
})();
