const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[1280, 'light'], [375, 'dark']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 1000 }, colorScheme: scheme })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file:///home/user/learning/reference/quest-map.html'); await p.waitForTimeout(500);
    console.log(w, scheme, 'errors:', errs, 'overflow:', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    await p.screenshot({ path: `map-${w}.png`, fullPage: true });
  }
  await b.close();
})();
