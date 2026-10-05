const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/user/learning/lessons/0401-rate-limiter-why-and-where.html'); await p.waitForTimeout(300);
  for (let i = 0; i < 7; i++) {
    const t = await p.locator('#incCard p').innerText();
    const k = /sign-up|database/.test(t) ? 'over' : /retries|scraper/.test(t) ? 'starve' : /botnet/.test(t) ? 'cost' : 'none';
    await p.locator(`#bins .bin[data-k="${k}"]`).click();
    console.log(k, await p.locator('#incEx').getAttribute('class'), 'hearts', await p.locator('.hud .heart:not(.lost)').count());
    await p.locator('#incRow .btn.primary').click();
  }
  console.log('counts', await p.locator('#bins .ct').allInnerTexts());
  // stage 3 in reduced motion
  await p.locator('#pbox .opt', { hasText: /^3$/ }).click();
  await p.waitForSelector('#pbox .explain.show');
  console.log('r1', (await p.locator('.counters').innerText()).replace(/\n/g,' '));
  await p.locator('#s3 .sim').screenshot({ path: '0401-sim.png' });
  console.log('errs', errs);
  await b.close();
})();
