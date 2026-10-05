const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[1280, 'light'], [375, 'dark'], [375, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
    await p.goto('file:///home/user/learning/reference/ch02-estimation-cheatsheet.html'); await p.waitForTimeout(400);
    const r = await p.evaluate(() => ({ ofl: document.documentElement.scrollWidth - innerWidth, links: [...document.querySelectorAll('a[href^="../lessons/"], a[href="quest-map.html"]')].map(a => a.getAttribute('href')) }));
    console.log(w, scheme, 'overflow', r.ofl, 'errors', errs.length ? errs : 'none');
    if (w === 1280) console.log('links', r.links.join(' '));
    await p.screenshot({ path: `${__dirname}/cs02-${w}-${scheme}.png`, fullPage: true });
    if (w === 375 && scheme === 'dark') await p.locator('.fig').screenshot({ path: `${__dirname}/cs02-fig-375-dark.png` });
    await ctx.close();
  }
  await b.close();
})();
