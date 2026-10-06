const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const url = 'file:///home/user/learning/reference/ch05-consistent-hashing-cheatsheet.html';
  for (const [w, scheme] of [[375, 'dark'], [1280, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    p.on('requestfailed', r => { if (!/fonts\.g/.test(r.url())) errs.push('reqfail ' + r.url()); });
    await p.goto(url); await p.waitForTimeout(500);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const wide = await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && !e.closest('.wide') && !e.closest('pre')).map(e => e.tagName + '.' + e.className).slice(0, 8));
    console.log(w, scheme, 'overflowX', ov, 'wide', JSON.stringify(wide), 'errors', errs.length ? errs : 'none');
    await p.screenshot({ path: `${process.env.S}/ch05-cs-${w}-${scheme}.png`, fullPage: true });
    const d = await p.$('.diagram'); await d.screenshot({ path: `${process.env.S}/ch05-cs-diag-${w}-${scheme}.png` });
    await ctx.close();
  }
  // links to lessons resolve
  const fs = require('fs'), html = fs.readFileSync('/home/user/learning/reference/ch05-consistent-hashing-cheatsheet.html', 'utf8');
  for (const m of html.matchAll(/href="(\.\.\/lessons\/[^"#]+|quest-map\.html)(#[^"]*)?"/g)) {
    const f = require('path').resolve('/home/user/learning/reference', m[1]);
    const ok = fs.existsSync(f) && (!m[2] || fs.readFileSync(f, 'utf8').includes(`id="${m[2].slice(1)}"`));
    console.log(ok ? 'ok  ' : 'BAD ', m[1] + (m[2] || ''));
  }
  await b.close();
})();
