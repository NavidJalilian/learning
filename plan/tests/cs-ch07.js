const { chromium } = require('playwright');
(async () => {
  const f = 'file:///home/user/learning/reference/ch07-unique-id-cheatsheet.html';
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  let bad = 0;
  for (const [w, scheme] of [[1280, 'light'], [375, 'dark'], [375, 'light'], [1280, 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const p = await ctx.newPage(); const errs = [];
    p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(f, { waitUntil: 'load' }); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ ov: document.documentElement.scrollWidth - innerWidth, bg: getComputedStyle(document.body).backgroundColor,
      wides: [...document.querySelectorAll('.box,.kn div,td')].filter(e => e.scrollWidth > e.clientWidth + 1 && !e.closest('.wide')).length,
      links: [...document.querySelectorAll('a[href^="../lessons"], a[href="quest-map.html"]')].map(a => a.getAttribute('href')) }));
    console.log(w, scheme, JSON.stringify(r), errs.length ? 'ERR ' + errs.join('|') : 'no errors');
    if (r.ov > 1 || errs.length) bad++;
    if (w === 375) {
      await p.screenshot({ path: `/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/cs07-375-${scheme}-full.png`, fullPage: true });
      const fig = await p.$$('.fig'); for (let i = 0; i < fig.length; i++) await fig[i].screenshot({ path: `/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/cs07-375-${scheme}-fig${i}.png` });
    }
    await ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
