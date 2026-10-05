const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 760 }, colorScheme: 'dark' });
  const p = await ctx.newPage();
  await p.goto('file:///home/user/learning/reference/ch02-estimation-cheatsheet.html'); await p.waitForTimeout(400);
  await p.screenshot({ path: __dirname + '/cs02-top.png' });
  await p.locator('#q22').screenshot({ path: __dirname + '/cs02-q22.png' });
  await p.locator('#q23 .wide').screenshot({ path: __dirname + '/cs02-q23.png' });
  await b.close();
})();
