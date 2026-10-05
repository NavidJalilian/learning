// Usage: NODE_PATH=/opt/node22/lib/node_modules node smoke.js /abs/path/lesson.html [more.html ...]
// Loads each page at desktop + phone width, light + dark; reports console/page errors,
// HUD presence, stage count, horizontal overflow, and whether Quest.CATALOG knows the id.
const { chromium } = require('playwright');
(async () => {
  const files = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  let bad = 0;
  for (const f of files) {
    for (const [w, h, scheme] of [[1280, 900, 'light'], [375, 800, 'dark']]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
      const page = await ctx.newPage();
      const errs = [];
      page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
      page.on('pageerror', e => errs.push('pageerror: ' + e.message));
      await page.goto('file://' + f, { waitUntil: 'load' });
      await page.waitForTimeout(400);
      const r = await page.evaluate(() => ({
        hud: !!document.querySelector('.hud .hud-in'),
        stages: document.querySelectorAll('.stage[data-stage]').length,
        dots: document.querySelectorAll('.hud .dot').length,
        overflowX: document.documentElement.scrollWidth - innerWidth,
        title: document.title,
        victory: !!document.querySelector('#victory'),
      }));
      const problems = [...errs];
      if (!r.hud) problems.push('HUD not rendered (Quest.init/start not run?)');
      if (!r.stages) problems.push('no .stage[data-stage] sections');
      if (!r.victory) problems.push('no #victory element');
      if (r.overflowX > 1) problems.push(`horizontal overflow ${r.overflowX}px at ${w}px`);
      const tag = `${f.split('/').pop()} @${w} ${scheme}`;
      if (problems.length) { bad++; console.log('FAIL', tag, JSON.stringify(r)); problems.forEach(p => console.log('   -', p)); }
      else console.log('ok  ', tag, `stages=${r.stages} title="${r.title}"`);
      await ctx.close();
    }
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
