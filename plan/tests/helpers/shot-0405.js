const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const scheme of ['dark','light']) {
  const ctx = await b.newContext({ viewport: { width: 375, height: 800 }, colorScheme: scheme, reducedMotion: 'reduce', deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('file:///home/user/learning/lessons/0405-distributed-rate-limiting.html'); await p.waitForTimeout(300);
  await p.click('#racePredict [data-m="plain"] .opt[data-i="1"]');
  for (const [l, s] of [['A', 0], ['B', 0], ['A', 1]]) await p.click(`#lane${l} [data-s="${s}"]`);
  await p.locator('#raceSim').screenshot({ path: `z5-race-${scheme}.png` });
  await p.click('#topoMode [data-m="central"]');
  await p.click('#topoPredict [data-m="central"] .opt[data-i="0"]');
  await p.click('#topoSend'); await p.waitForTimeout(300);
  await p.locator('.topo').screenshot({ path: `z5-topo-${scheme}.png` });
  await p.click('#mapMode [data-m="edge"]');
  await p.locator('.mapsim').screenshot({ path: `z5-map-${scheme}.png` });
  await p.click('#incBox .diag .opt[data-k="algo"]'); await p.click('#incBox .row .btn.primary'); await p.click('#incBox .row .btn.primary').catch(()=>{});
  await p.locator('#incBox').screenshot({ path: `z5-inc-${scheme}.png` });
  await p.click('#redisInc [data-ep="search"] [data-v="open"]'); await p.click('#redisInc [data-ep="login"] [data-v="open"]'); await p.click('#applyFail'); await p.waitForTimeout(300);
  await p.locator('#redisInc').screenshot({ path: `z5-redis-${scheme}.png` });
  await ctx.close(); }
  await b.close();
})();
