const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const f = 'file:///home/user/learning/reference/ch01-scaling-cheatsheet.html';
  for (const [w, scheme] of [[1280, 'light'], [375, 'dark'], [375, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const p = await ctx.newPage(); const errs = [];
    p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(f); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ ov: document.documentElement.scrollWidth - innerWidth, links: [...document.querySelectorAll('a[href^="../lessons/"], a[href="quest-map.html"]')].map(a => a.getAttribute('href')) }));
    console.log(w, scheme, 'overflow', r.ov, 'errs', errs, r.links.length);
    if (w === 375) { await p.screenshot({ path: `cs01-375-${scheme}-full.png`, fullPage: true }); const d = await p.$('.diagram'); await d.screenshot({ path: `cs01-diagram-375-${scheme}.png` }); const k = await p.$('.evo'); await k.screenshot({ path: `cs01-evo-375-${scheme}.png` }); }
    else { const d = await p.$('.diagram'); await d.screenshot({ path: 'cs01-diagram-1280-light.png' }); }
    if (w === 375 && scheme === 'dark') console.log(r.links.join('\n'));
    await ctx.close();
  }
  await b.close();
})();
