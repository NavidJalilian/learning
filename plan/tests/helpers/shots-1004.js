const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 800 }, colorScheme: scheme })).newPage();
    await p.goto('file:///home/user/learning/lessons/1004-notification-guardrails.html'); await p.waitForTimeout(400);
    await p.screenshot({ path: SP + `1004-hero-${w}.png` });
    await p.locator('#s4 .door').screenshot({ path: SP + `1004-door-${w}.png` });
    await p.locator('#s4 .calc').screenshot({ path: SP + `1004-calc-${w}.png` });
    await p.locator('#s5 .dz').screenshot({ path: SP + `1004-dz-${w}.png` });
  }
  await b.close();
})();
