const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, sch] of [[375, 'dark'], [1280, 'light']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 800 }, colorScheme: sch })).newPage();
    await p.goto('file:///home/user/learning/lessons/1001-notification-channels.html'); await p.waitForTimeout(400);
    await p.click('#st1'); await p.waitForTimeout(2500);
    await p.locator('#s4 .flow').screenshot({ path: SP + `1001-flow-${w}.png` });
    await p.locator('#s3').screenshot({ path: SP + `1001-s3full-${w}.png` });
  }
  await b.close();
})();
