const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [900, 'light']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('file:///home/user/learning/lessons/0705-boss-mint-it-live.html'); await page.waitForTimeout(500);
    for (const [a, r] of [['mm', 'time'], ['uuid', 'b64']]) {
      await page.click(`#apps .opt[data-a="${a}"]`);
      await page.waitForSelector('#push .rchips .opt:not([disabled])');
      await page.click(`#push .rchips .opt[data-r="${r}"]`);
      await page.waitForFunction(a => document.querySelector(`#apps .opt[data-a="${a}"]`).classList.contains('out'), a);
    }
    await page.click(`#apps .opt[data-a="ticket"]`);
    await page.waitForSelector('#push .rchips .opt:not([disabled])');
    await page.locator('#s2 .stage-b').screenshot({ path: `0705-s2-${scheme}.png` });
    await page.click('#barrage .choice .opt[data-c="tune"]');
    await page.locator('#s4 .stage-b').screenshot({ path: `0705-s4-${scheme}.png` });
    await page.click('#shiftBtn');
    await page.locator('#taskC').screenshot({ path: `0705-s3c-${scheme}.png` });
    await page.locator('#s1 .stage-b').screenshot({ path: `0705-s1-${scheme}.png` });
    await ctx.close();
  }
  await browser.close();
})();
