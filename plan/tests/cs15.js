const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const f = 'file:///home/user/learning/reference/ch15-google-drive-cheatsheet.html';
  for (const [w, s] of [[1280, 'light'], [375, 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: s });
    const p = await ctx.newPage(); const errs = [];
    p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(f); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ ov: document.documentElement.scrollWidth - innerWidth, links: [...document.querySelectorAll('a[href^="../lessons/"],a[href="quest-map.html"]')].map(a => a.getAttribute('href')),
      wide: [...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.wide')).map(e => e.tagName + '.' + e.className).slice(0, 5) }));
    console.log(w, s, 'overflow', r.ov, 'errors', errs, 'outside', r.wide);
    if (w === 1280) console.log(r.links.join(' '));
    await (await p.$('.diagram')).screenshot({ path: `cs15-diagram-${w}-${s}.png` });
    await p.screenshot({ path: `cs15-${w}-${s}.png`, fullPage: false });
    await ctx.close();
  }
  // print emulation
  const ctx = await b.newContext(); const p = await ctx.newPage(); await p.goto(f); await p.emulateMedia({ media: 'print' }); await p.pdf({ path: 'cs15.pdf' }); console.log('pdf ok');
  await b.close();
})();
