const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0105-scale-queues-observability-sharding.html';
const DIR = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const RIGHT = [
  'Producers publish, consumers process', 'Add more consumer workers',
  'Search the centralized error logs once',
  'Hardware tops out, and one box is a SPOF', 'Same schema, different rows on each',
  'Some shards fill up faster than others', 'Give each celebrity a dedicated shard', 'Duplicated data you must keep in sync',
];
const BINS = {
  'CPU usage on web-7': 'host', 'Disk I/O on db-2': 'host', 'Memory used on cache-1': 'host',
  'p99 latency of the whole database tier': 'agg', 'Hit rate of the cache tier': 'agg',
  'Daily active users': 'biz', 'Week-4 retention': 'biz', 'Revenue per day': 'biz',
  'Search every server’s error logs in one place': 'not', 'Every commit runs the test suite automatically': 'not',
};
const BOSS = { 'Filters that take forever': 'queue', 'The holiday spike': 'queue', 'Which of 40 is broken?': 'observe', 'The CEO’s question': 'observe', 'Out of road': 'shard', 'One very loud shard': 'fixshard', 'The feed that can’t join': 'fixshard', 'Lopsided by country': 'fixshard' };
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
  await page.goto(FILE);
  const xp = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('sdq:v1') || '{}'); const r = (d.runs || {})['0105'] || (d.lessons || {})['0105']; return r ? r.xp : 0; });
  const ok = async n => { await page.waitForSelector(`#s${n}.cleared`, { timeout: 60000 }); console.log('stage', n, 'cleared, xp', await xp()); };
  async function answerQuiz(sel, count = 1) {
    for (let k = 0; k < count; k++) {
      await page.waitForSelector(`${sel} .quiz:nth-of-type(${k + 1}) .opt:not([disabled])`, { timeout: 15000 });
      let hit = false;
      for (const o of await page.$$(`${sel} .quiz:nth-of-type(${k + 1}) .opt`)) { if (RIGHT.includes((await o.textContent()).trim())) { await o.click(); hit = true; break; } }
      if (!hit) throw new Error('no right option in ' + sel + ' #' + k);
    }
  }

  // ---- stage 1: inline
  await page.click('#inGo');
  await page.$eval('#rate1', el => { el.value = 5; el.dispatchEvent(new Event('input')); });
  await page.waitForSelector('#s1goals [data-g="inline"].done', { timeout: 20000 });
  console.log('inline stats:', (await page.textContent('#stats1')).replace(/\s+/g, ' '));
  await page.click('#toQueue');
  await page.click('.ctl1 .seg button[data-sp="2"]');
  await page.click('#dayGo');
  // auto-pilot the workers
  let maxDepth = 0;
  for (let i = 0; i < 200; i++) {
    if (await page.$('#s1goals [data-g="day"].done')) break;
    if (await page.$('#dayGo')) { console.log('day ended without success:', (await page.textContent('#q1log')).slice(-200)); break; }
    const st = await page.evaluate(() => ({ depth: +document.querySelector('#qDepth').textContent, w: +document.querySelector('#wCount').textContent, rate: +document.querySelector('#stats1 b').textContent, t: document.querySelector('#qClock').textContent }));
    maxDepth = Math.max(maxDepth, st.depth);
    const tN = +st.t.replace(/\D/g, '');
    const target = Math.min(15, 3 * Math.max(1, st.rate) + Math.ceil(st.depth / 4));
    const want = tN >= 55 ? Math.min(target, 4) : target;
    if (st.w < want) await page.click('#wAdd').catch(() => {});
    else if (st.w > want) await page.click('#wRem').catch(() => {});
    await page.waitForTimeout(120);
  }
  console.log('day max depth seen', maxDepth);
  await page.waitForSelector('#s1goals [data-g="day"].done', { timeout: 5000 });
  await page.screenshot({ path: DIR + '0105-s1-day.png', clip: await (await page.$('#qsimWrap')).boundingBox() });
  // crash predict
  await page.waitForSelector('#s1pred .opt', { timeout: 10000 });
  await page.click('#s1pred .opt:has-text("Uploads still work; jobs pile up")');
  await page.waitForSelector('#s1pred .explain.show', { timeout: 30000 });
  console.log('crash log tail:', (await page.textContent('#q1log')).slice(-160));
  await answerQuiz('#s1quiz', 2);
  await ok(1);

  // ---- stage 2 (one wrong on purpose)
  for (let i = 0; i < 10; i++) {
    const t = (await page.textContent('#mCard')).trim();
    const b = BINS[t]; if (!b) throw new Error('unknown card ' + t);
    if (i === 0) { const wrong = b === 'host' ? 'biz' : 'host'; await page.click(`#bins .bin[data-b="${wrong}"]`); await page.waitForTimeout(100); }
    await page.click(`#bins .bin[data-b="${b}"]`);
    await page.waitForTimeout(550);
  }
  await answerQuiz('#s2quiz');
  await ok(2);
  console.log('hearts after stage 2:', await page.$$eval('.heart.lost', x => 3 - x.length));

  // ---- reload mid-quest
  await page.reload(); await page.waitForTimeout(600);
  console.log('resume banner:', !!(await page.$('.banner.resume')), 'cleared:', await page.$$eval('.stage.cleared', x => x.map(s => s.id)), 'xp', await xp());

  // ---- stage 3
  for (const id of [17, 42, 1000, 7, 2023]) {
    await page.waitForFunction(i => document.querySelector('#uidBig').textContent === 'user_id ' + i, id);
    await page.click(`#shards3 .shardbox[data-s="${id % 4}"]`);
    await page.waitForTimeout(950);
  }
  await page.click('#keycards .keycard[data-i="1"] .btn');
  await answerQuiz('#s3quiz', 2);
  await ok(3);

  // ---- stage 4: C, then B, then A (any order)
  await page.click('#joinOpts .opt:has-text("De-normalize")');
  for (let i = 0; i < 3; i++) await page.click(`#celebs .btn[data-i="${i}"]`);
  await page.waitForSelector('#hotFix .opt', { timeout: 5000 });
  console.log('hot shard row:', (await page.textContent('#hot')).replace(/\s+/g, ' ').slice(0, 120));
  await page.click('#hotFix .opt:has-text("Give each celebrity their own shard")');
  await page.click('#rsPred .opt:has-text("About 80% of users")');
  await page.waitForSelector('#rsCHrow[style*="flex"]', { timeout: 10000 });
  console.log('mod reshard:', await page.textContent('#rsNote'));
  await page.click('#rsCH');
  await page.waitForSelector('#s4goals [data-g="reshard"].done', { timeout: 10000 });
  console.log('ring reshard:', await page.textContent('#rsNote'));
  await answerQuiz('#s4quiz', 3);
  await ok(4);

  // ---- stage 5
  for (let i = 0; i < 8; i++) {
    const t = (await page.textContent('#boss .scenario h3')).trim();
    await page.click(`#boss .choice .opt[data-c="${BOSS[t]}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await ok(5);

  // ---- stage 6: first low self-grade, then retry
  await page.fill('#drill textarea', 'Web servers publish jobs to a message queue and workers consume them; then shard the database by user_id with the same schema everywhere.');
  await page.click('#drill .q-reveal');
  await page.check('#drill .selfgrade label:nth-of-type(1) input');
  await page.click('#drill .q-finish');
  await page.waitForSelector('#drillAgain');
  console.log('stage 6 cleared after 1 tick?', !!(await page.$('#s6.cleared')));
  await page.click('#drillAgain');
  await page.fill('#drill textarea', 'Web servers publish jobs to a message queue and workers consume them; then shard the database by user_id with the same schema everywhere.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await ok(6);
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY:', (await page.textContent('#victory h2')).trim(), '| xp', await page.textContent('#victory .vstats b'), '| hearts', await page.$$eval('.heart.lost', x => 3 - x.length));
  console.log('errors:', errs.length ? errs : 'none');
  await ctx.close();

  // ---- screenshots at 375 dark
  const c2 = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const p2 = await c2.newPage();
  p2.on('pageerror', e => console.log('375 pageerror', e.message));
  await p2.goto(FILE); await p2.waitForTimeout(1500);
  await p2.screenshot({ path: DIR + '0105-375-dark.png', fullPage: true });
  for (const s of [1, 2, 3, 4]) { const el = await p2.$('#s' + s); await el.screenshot({ path: DIR + `0105-375-dark-s${s}.png` }); }
  console.log('overflow 375:', await p2.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await c2.close();
  await browser.close();
})();
