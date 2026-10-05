const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p.goto('file:///home/user/learning/lessons/1301-autocomplete-scope-and-estimation.html');
  await p.click('#pred4 .opt:has-text("Both: rows")'); await p.waitForTimeout(1200);
  await p.locator('#s4 .stage-b').screenshot({ path: 'scratch-1301-s4-light.png' });
  await b.close();
})();
