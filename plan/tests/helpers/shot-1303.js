const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1303-data-gathering-service.html';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, sch] of [[375, 'dark'], [1280, 'light']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: sch })).newPage();
    await p.goto(URL); await p.waitForTimeout(400);
    await p.locator('#s1pred .opt', { hasText: 'blows' }).click();
    await p.waitForTimeout(2500);
    await p.locator('#liveSim').screenshot({ path: SP + `1303-live-${w}.png` });
    await p.locator('#s3pred .opt', { hasText: '6,000' }).click();
    await p.waitForSelector('#s3pred .explain.show', { timeout: 20000 });
    await p.locator('#s3 .sim').screenshot({ path: SP + `1303-agg-${w}.png` });
    await p.locator('#ivbox').screenshot({ path: SP + `1303-iv-${w}.png` });
    await p.click('#buildBtn'); await p.waitForTimeout(1500);
    await p.locator('#s5 .swap').screenshot({ path: SP + `1303-swap-${w}.png` });
    await p.locator('#s6').screenshot({ path: SP + `1303-boss-${w}.png` });
  }
  await b.close();
})();
