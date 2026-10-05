const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, cs] of [[375, 'dark'], [1280, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: cs });
    const p = await ctx.newPage();
    await p.goto('file:///home/user/learning/lessons/0401-rate-limiter-why-and-where.html'); await p.waitForTimeout(500);
    await p.evaluate(() => { document.querySelector('.hud').style.position = 'static'; });
    await p.locator('#psvg').screenshot({ path: `0401-svg-${w}.png` });
  }
  await b.close();
})();
