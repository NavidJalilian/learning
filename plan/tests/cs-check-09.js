const { chromium } = require('playwright');
(async () => {
  const f = '/home/user/learning/reference/ch09-web-crawler-cheatsheet.html';
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, h, scheme] of [[1280, 900, 'light'], [375, 800, 'dark'], [375, 800, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
    const p = await ctx.newPage(); const errs = [];
    p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + f, { waitUntil: 'load' }); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ ox: document.documentElement.scrollWidth - innerWidth, links: [...document.querySelectorAll('a.ql')].map(a => a.getAttribute('href')), bg: getComputedStyle(document.body).backgroundColor }));
    console.log(w, scheme, JSON.stringify(r), errs);
    if (w === 375 && scheme === 'dark') {
      const el = await p.$('#boss .diagram'); await el.screenshot({ path: process.env.S + '/cs09-diagram-375-dark.png' });
      await p.screenshot({ path: process.env.S + '/cs09-top-375-dark.png' });
      const q = await p.$('#q93'); await q.screenshot({ path: process.env.S + '/cs09-q93-375-dark.png' });
    }
    if (w === 1280) { const el = await p.$('#boss .diagram'); await el.screenshot({ path: process.env.S + '/cs09-diagram-1280-light.png' }); }
    await ctx.close();
  }
  await b.close();
})();
