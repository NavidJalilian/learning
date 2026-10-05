const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light'], [375, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto('file:///home/user/learning/reference/ch03-framework-cheatsheet.html', { waitUntil: 'load' });
    const o = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, links: [...document.querySelectorAll('a.ql')].map(a => a.getAttribute('href')) }));
    console.log(w, scheme, 'overflow', o.sw - o.cw, 'errs', errs.filter(e => !/fonts\.g/.test(e)), o.links.join(' '));
    await p.screenshot({ path: `${process.env.S}/cs03-${w}-${scheme}-full.png`, fullPage: true });
    await p.locator('.diagram').screenshot({ path: `${process.env.S}/cs03-${w}-${scheme}-diagram.png` });
    await p.locator('.tl').screenshot({ path: `${process.env.S}/cs03-${w}-${scheme}-tl.png` });
    await ctx.close();
  }
  await b.close();
})();
