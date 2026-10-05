const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const scheme of ['dark', 'light']) {
    const ctx = await b.newContext({ viewport: { width: 375, height: 800 }, colorScheme: scheme, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto('file:///home/user/learning/lessons/1401-youtube-scope-and-estimate.html');
    await p.evaluate(() => { const e = document.querySelector('#gslider'); e.value = 650; e.dispatchEvent(new Event('input')); });
    await p.click('#glock');
    await p.locator('#giant').screenshot({ path: `1401-axis-${scheme}.png` });
    for (const q of ['Which features matter most?', 'How many daily active users?', 'Should we use microservices?']) await p.locator('#qdeck button', { hasText: q }).click();
    await p.waitForTimeout(1500);
    await p.locator('#s2').screenshot({ path: `1401-s2-${scheme}.png` });
    await ctx.close();
  }
  await b.close();
})();
