const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0402-token-and-leaking-bucket.html';
const DIR = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const RIGHT = ['The bucket size (capacity)', 'Its two parameters can be hard to tune', 'Leaking bucket: steady outflow'];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
  await page.goto(FILE);
  const xp = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('sdq:v1') || '{}'); const r = (d.runs || {})['0402'] || (d.lessons || {})['0402']; return r ? r.xp : 0; });
  const ok = async n => { await page.waitForSelector(`#s${n}.cleared`, { timeout: 40000 }); console.log('stage', n, 'cleared, xp', await xp()); };
  async function answerQuiz(sel) {
    await page.waitForSelector(`${sel} .quiz .opt:not([disabled])`, { timeout: 15000 });
    for (const o of await page.$$(`${sel} .quiz .opt:not([disabled])`)) { if (RIGHT.includes((await o.textContent()).trim())) { await o.click(); return; } }
    throw new Error('no right option in ' + sel);
  }
  // ---- stage 1
  await page.click('#tbFive');
  console.log('after burst: allowed', await page.textContent('#tbAllowed'), 'dropped', await page.textContent('#tbDropped'));
  await page.waitForTimeout(1300);
  console.log('tokens after ~1.3s:', await page.textContent('#tbTokens'), await page.textContent('#tbClock'));
  await page.click('#tbOne');
  await answerQuiz('#s1quiz');
  await ok(1);
  console.log('spilled check later; log:', (await page.textContent('#tbLog')).slice(0, 200));
  // ---- stage 2
  for (const v of [2, 3, 5]) {
    await page.fill('#r2in', String(v));
    await page.click('#r2go');
    await page.waitForSelector('#r2box .row .btn.primary', { timeout: 30000 });
    console.log('r2 explain:', (await page.textContent('#r2box .explain')).slice(0, 50), '| meter', await page.textContent('#meter2 .val'));
    await page.click('#r2box .row .btn.primary');
  }
  await ok(2);
  // ---- reload mid-quest
  await page.reload(); await page.waitForTimeout(500);
  console.log('resume banner:', !!(await page.$('.banner.resume')), 'cleared:', await page.$$eval('.stage.cleared', x => x.map(s => s.id)), 'xp', await xp());
  // ---- stage 3 (one wrong on purpose)
  for (const v of ['3', '3000', '5,000']) {
    await page.fill('#r3in', v); await page.click('#r3go');
    console.log('r3:', (await page.textContent('#r3box .explain')).slice(0, 40), '|', await page.textContent('#glegend .tot'));
    await page.click('#r3box .row .btn.primary');
  }
  await page.click('#hsGo');
  await page.waitForSelector('#hsAsk .opt', { timeout: 10000 });
  // pick hard: the limiter with 10 allowed
  const aTxt = await page.textContent('#hsA');
  await page.click(`#hsAsk .opt[data-k="${aTxt.startsWith('10') ? 'A' : 'B'}"]`);
  await answerQuiz('#s3quiz');
  await ok(3);
  // ---- stage 4
  for (const [id, v] of [['tAns', 4], ['tDrop', 4], ['lAns', 1], ['lDrop', 4]]) await page.click(`#pred4 .pcs[data-p="${id}"] .pc[data-v="${v}"]`);
  await page.click('#lkGo');
  await page.waitForSelector('#cmp4 table', { timeout: 20000 });
  console.log('race:', (await page.textContent('#cmp4')).replace(/\s+/g, ' '));
  console.log('vip:', await page.textContent('#aVip'), '|', await page.textContent('#bVip'));
  await answerQuiz('#s4quiz');
  await ok(4);
  // ---- stage 5
  const BOSS = { 'The app-launch flurry': 'tok', 'The fragile legacy database': 'leak', 'Throttled at launch': 'sizeUp', 'Too much, all day long': 'rateDown', 'The contract cap': 'hard' };
  for (let i = 0; i < 5; i++) {
    const t = (await page.textContent('#boss .scenario h3')).trim();
    await page.click(`#boss .choice .opt[data-c="${BOSS[t]}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await ok(5);
  // ---- stage 6
  await page.fill('#drill textarea', 'Token bucket refills tokens to a cap and allows bursts; leaking bucket is a FIFO queue drained at a fixed outflow rate for steady output.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await ok(6);
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY:', (await page.textContent('#victory h2')).trim(), '| xp', await page.textContent('#victory .vstats b'), '| hearts', await page.$$eval('.heart.lost', x => 3 - x.length));
  console.log('errors:', errs.length ? errs : 'none');
  await ctx.close();

  // screenshots at 375 dark
  const c2 = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const p2 = await c2.newPage(); const e2 = [];
  p2.on('pageerror', e => e2.push(e.message));
  await p2.goto(FILE); await p2.waitForTimeout(1500);
  await p2.click('#tbFive'); await p2.waitForTimeout(250);
  await (await p2.$('#s1')).screenshot({ path: DIR + '0402-s1.png' });
  await p2.fill('#r2in', '3'); await p2.click('#r2go'); await p2.waitForSelector('#r2box .row .btn', { timeout: 20000 });
  await (await p2.$('#s2')).screenshot({ path: DIR + '0402-s2.png' });
  await p2.fill('#r3in', '3'); await p2.click('#r3go'); await p2.click('#r3box .row .btn.primary');
  await p2.fill('#r3in', '3001'); await p2.click('#r3go'); await p2.waitForTimeout(900);
  await p2.click('#hsGo'); await p2.waitForTimeout(2500);
  await (await p2.$('#s3')).screenshot({ path: DIR + '0402-s3.png' });
  for (const [id, v] of [['tAns', 4], ['tDrop', 2], ['lAns', 1], ['lDrop', 4]]) await p2.click(`#pred4 .pcs[data-p="${id}"] .pc[data-v="${v}"]`);
  await p2.click('#lkGo'); await p2.waitForTimeout(1700);
  await (await p2.$('#s4 .sim')).screenshot({ path: DIR + '0402-s4-mid.png' });
  await p2.waitForSelector('#cmp4 table', { timeout: 20000 });
  await (await p2.$('#s4')).screenshot({ path: DIR + '0402-s4.png' });
  console.log('overflowX 375:', await p2.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'errors:', e2.length ? e2 : 'none');
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
