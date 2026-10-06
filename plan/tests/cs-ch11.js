const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light'], [375, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errs.push(m.text()); });
    await p.goto('file:///home/user/learning/reference/ch11-news-feed-cheatsheet.html');
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, links: [...document.querySelectorAll('a.ql')].map(a => a.getAttribute('href')), wide: [...document.querySelectorAll('.wide')].filter(e => e.scrollWidth > e.clientWidth + 1).length }));
    console.log(w, scheme, JSON.stringify(r), 'errors:', errs);
    await p.screenshot({ path: `${process.argv[2]}/cs11-${w}-${scheme}.png`, fullPage: true });
    const fig = await p.$('.diagram'); await fig.screenshot({ path: `${process.argv[2]}/cs11-diagram-${w}-${scheme}.png` });
    await ctx.close();
  }
  await b.close();
})();
