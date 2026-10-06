const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 1300 }, colorScheme: 'dark' });
  const p = await ctx.newPage();
  await p.goto('file:///home/user/learning/reference/ch11-news-feed-cheatsheet.html');
  await p.screenshot({ path: process.argv[2] + '/cs11-top.png' });
  await b.close();
})();
