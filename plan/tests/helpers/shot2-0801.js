const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p.goto('file:///home/user/learning/lessons/0801-url-shortener-scope-and-api.html');
  await p.locator('#r4predict .opt[data-n="1"]').click();
  await p.locator('#clickBtn').click(); await p.waitForTimeout(1300);
  await p.locator('.rsim').screenshot({ path: 'shot-0801-rsim-light.png' });
  await p.locator('#s1 .qcard').nth(0).click(); await p.waitForTimeout(800);
  await p.locator('#s1').screenshot({ path: 'shot-0801-s1-light.png' });
  await b.close();
})();
