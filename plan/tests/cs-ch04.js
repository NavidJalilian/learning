const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const f = 'file:///home/user/learning/reference/ch04-rate-limiter-cheatsheet.html';
  let bad = 0;
  for (const [w, h, scheme] of [[1280, 900, 'light'], [375, 800, 'dark'], [375, 800, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
    const p = await ctx.newPage(); const errs = [];
    p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(f, { waitUntil: 'load' }); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ ox: document.documentElement.scrollWidth - innerWidth, secs: document.querySelectorAll('section').length,
      links: [...document.querySelectorAll('a[href^="../lessons/"]')].map(a => a.getAttribute('href')), bg: getComputedStyle(document.body).backgroundColor }));
    console.log(w, scheme, JSON.stringify(r), errs.length ? 'ERRORS ' + errs.join(' | ') : 'no errors');
    if (r.ox > 1 || errs.length) bad++;
    if (w === 375) { await p.locator('#boss .diagram').screenshot({ path: `${process.env.S}/cs04-diagram-${scheme}.png` }); await p.screenshot({ path: `${process.env.S}/cs04-375-${scheme}.png`, fullPage: false }); }
    if (w === 1280) await p.locator('#boss .diagram').screenshot({ path: `${process.env.S}/cs04-diagram-1280.png` });
    await ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
