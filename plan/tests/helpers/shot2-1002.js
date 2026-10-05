const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await (await b.newContext({ viewport: { width: 375, height: 900 }, colorScheme: 'dark' })).newPage();
  await page.goto('file:///home/user/learning/lessons/1002-notification-high-level-design.html'); await page.waitForTimeout(400);
  await page.locator('#api').screenshot({ path: SP + '1002-api375.png' });
  console.log(await page.evaluate(() => { const a = document.querySelector('#api'); return [a.scrollWidth, a.clientWidth]; }));
  await b.close();
})();
