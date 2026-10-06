// Checks every ch1 drill retry re-mounts into the same element and pays reveal/check XP only once.
const { chromium } = require('playwright');
const L = '/home/user/learning/lessons/';
const T = [
  ['0101', '0101-scale-one-box-to-load-balancer.html', '#drillAgain'],
  ['0102', '0102-scale-database-replication.html', '#drillAgain'],
  ['0103', '0103-scale-cache-and-cdn.html', '#drillMsg button'],
  ['0104', '0104-scale-stateless-and-data-centers.html', '#drillAgain'],
  ['0105', '0105-scale-queues-observability-sharding.html', '#drillAgain'],
  ['0106', '0106-scale-boss-millions-live.html', '#s6replay .btn'],
];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  let bad = 0;
  for (const [id, f, again] of T) {
    const ctx = await b.newContext({ viewport: { width: 375, height: 800 } });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + L + f); await p.waitForTimeout(500);
    const xp = () => p.evaluate(id => { try { return JSON.parse(localStorage['sdq:v1']).runs[id].xp || 0; } catch { return 0; } }, id);
    const words = Array.from({ length: 50 }, (_, i) => 'word' + i).join(' ');
    const mountEl = await p.$('#drill');
    async function round(ticks) {
      await p.fill('#drill textarea', words);
      await p.click('#drill .q-reveal');
      const boxes = await p.$$('#drill .selfgrade input');
      for (let i = 0; i < ticks; i++) await boxes[i].check();
      await p.click('#drill .q-finish'); await p.waitForTimeout(300);
      return boxes.length;
    }
    const x0 = await xp();
    await round(1); const x1 = await xp();
    await p.click(again); await p.waitForTimeout(200);
    const same = await p.evaluate(el => el === document.querySelector('#drill') && el.isConnected && !!el.querySelector('textarea:not([readonly])'), mountEl);
    await round(1); const x2 = await xp();
    await p.click(again); await p.waitForTimeout(200);
    const n = await round(99 > 0 ? 3 : 0); const x3 = await xp();
    const ok = x1 - x0 === 20 && x2 === x1 && x3 - x2 === 20 && same && !errs.length;
    if (!ok) bad++;
    console.log(ok ? 'ok  ' : 'FAIL', id, { first: x1 - x0, retrySame: x2 - x1, retryMore: x3 - x2, sameMount: same, checks: n, errs });
    await ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
