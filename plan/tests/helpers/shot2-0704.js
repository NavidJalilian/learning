const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const scheme of ['dark', 'light']) {
    const ctx = await b.newContext({ viewport: { width: 375, height: 800 }, colorScheme: scheme, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto('file:///home/user/learning/lessons/0704-snowflake-clocks-and-tuning.html');
    for (const i of [0, 3, 2, 1, 5, 4]) await p.locator(`#evlist .evbtn[data-i="${i}"]`).click();
    for (const [a, c] of [[1, 2], [4, 5]]) { await p.locator('#ord3 .nd').nth(a).click(); await p.locator('#ord3 .nd').nth(c).click(); }
    await p.locator('#ord3').screenshot({ path: `z-ord3-${scheme}.png` });
    await p.locator('#evlist').screenshot({ path: `z-ev-${scheme}.png` });
    await p.locator('#s4 .sim').screenshot({ path: `z-s4-${scheme}.png` });
    await p.locator('#s2predict').evaluate(e => e.style.display = '');
    for (let i = 0; i < 5; i++) await p.click('#mint2');
    await p.click('#ntp2'); await p.locator('#s2predict .opt[data-i="1"]').click(); await p.waitForTimeout(300);
    await p.locator('#s2 .sim').screenshot({ path: `z-s2-${scheme}.png` });
    await p.locator('#s1predict .opt[data-i="1"]').click();
    await p.click('#burstSeg [data-b="5000"]'); await p.click('#modeSeg [data-m="wrap"]'); await p.click('#fire1'); await p.waitForTimeout(500);
    await p.locator('#seqSim').screenshot({ path: `z-s1-${scheme}.png` });
    await ctx.close();
  }
  await b.close();
})();
