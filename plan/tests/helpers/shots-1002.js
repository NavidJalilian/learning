const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light']]) {
    const page = await (await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme })).newPage();
    await page.goto('file:///home/user/learning/lessons/1002-notification-high-level-design.html'); await page.waitForTimeout(500);
    await page.screenshot({ path: `${SP}1002-${w}-hero.png` });
    for (const n of [1, 2, 3, 4, 5, 6]) await page.locator('#s' + n).screenshot({ path: `${SP}1002-${w}-s${n}.png` });
  }
  await b.close();
})();
