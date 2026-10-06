const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0103-scale-cache-and-cdn.html';
const DIR = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const RIGHT = [
  'Reads the database, then stores the result in the cache', 'Expire this entry after one hour',
  'Cache memory is wiped when a server restarts', 'A single point of failure', 'LRU: least recently used',
  'No: it’s a miss, so the edge asks the origin', 'Hit: the Tokyo edge serves its cached copy', 'Miss: the copy expired, so refetch from origin',
  'From the origin: a web server or S3-style storage', 'The TTL, often sent in an HTTP header',
];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
  await page.goto(FILE);
  const xp = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('sdq:v1') || '{}'); const r = (d.runs || {})['0103'] || (d.lessons || {})['0103']; return r ? r.xp : 0; });
  const ok = async n => { await page.waitForSelector(`#s${n}.cleared`, { timeout: 40000 }); console.log('stage', n, 'cleared, xp', await xp()); };
  async function answerRight(sel) {
    await page.waitForSelector(`${sel} .opt:not([disabled])`, { timeout: 20000 });
    for (const o of await page.$$(`${sel} .opt:not([disabled])`)) { if (RIGHT.includes((await o.textContent()).trim())) { await o.click(); return; } }
    throw new Error('no right option in ' + sel + ': ' + (await page.$$eval(`${sel} .opt:not([disabled])`, x => x.map(e => e.textContent))));
  }
  async function quizzes(sel, n) { for (let i = 0; i < n; i++) { await answerRight(`${sel} .quiz:nth-of-type(${i + 1})`); await page.waitForTimeout(800); } }

  // ---- stage 1: wrong order first (shake, no heart), then the right loop
  await page.click('#rtActs [data-a="db"]');
  console.log('hint after wrong:', await page.textContent('#rtHint'), '| hearts lost', await page.$$eval('.heart.lost', x => x.length));
  const MAN = ['user:1', 'user:2', 'user:1', 'user:7', 'user:1', 'user:2'];
  const seen = new Set();
  for (const k of MAN) {
    await page.click('#rtActs [data-a="check"]');
    if (seen.has(k)) await page.click('#rtActs [data-a="ret"]');
    else { for (const a of ['db', 'store', 'ret']) await page.click(`#rtActs [data-a="${a}"]`); seen.add(k); }
  }
  console.log('after manual: hit', await page.textContent('#gHit'), 'db', await page.textContent('#gDb'));
  await page.click('#rtAuto');
  await page.waitForSelector('#s1goals [data-g="auto"].done', { timeout: 30000 });
  console.log('after autoplay: hit', await page.textContent('#gHit'), 'db', await page.textContent('#gDb'), 'lat', await page.textContent('#gLat'));
  await quizzes('#s1quiz', 2);
  await ok(1);

  // ---- stage 2
  for (const v of [2, 8, 5]) {
    await page.$eval('#ttlIn', (el, v) => { el.value = v; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); }, v);
    console.log('TTL', await page.textContent('#ttlVal'), 'db', await page.textContent('#mDb'), 'stale', await page.textContent('#mSt'), '|', (await page.textContent('#ttlMsg')).slice(0, 40));
  }
  for (const [p, k] of [['LRU', 'B'], ['LFU', 'C'], ['FIFO', 'A']]) {
    await page.click(`#evRows .evrow[data-p="${p}"] .opt[data-k="${k}"]`);
    await page.waitForSelector(`#evRows .evrow[data-p="${p}"] .explain.show`, { timeout: 10000 });
    console.log(p, 'pick', k, '→', (await page.textContent(`#evRows .evrow[data-p="${p}"] .explain`)).slice(0, 60));
  }
  console.log('hearts lost after LFU wrong:', await page.$$eval('.heart.lost', x => x.length));
  await quizzes('#s2quiz', 3);
  await ok(2);

  // ---- reload mid-quest: resume
  await page.reload(); await page.waitForTimeout(600);
  console.log('resume banner:', !!(await page.$('.banner.resume')), 'cleared:', await page.$$eval('.stage.cleared', x => x.map(s => s.id)), 'xp', await xp(), 'hearts lost', await page.$$eval('.heart.lost', x => x.length));

  // ---- stage 3
  for (let r = 0; r < 3; r++) {
    if (r === 2) await page.click('#cdnFF');
    await answerRight('#cdnBox');
    await page.waitForSelector('#cdnBox .row .btn.primary', { timeout: 20000 });
    console.log('cdn round', r + 1, 'origin', await page.textContent('#cOrig'), '| edge', await page.textContent('#cEdge'), '| lat', await page.textContent('#cLat'));
    await page.click('#cdnBox .row .btn.primary');
  }
  await quizzes('#s3quiz', 2);
  await ok(3);

  // ---- stage 4
  for (const it of await page.$$('#incs .sort-item')) {
    const b = await it.$('.opt[data-j="0"]'); await b.click();
  }
  // one drag, two taps
  await page.dragAndDrop('#webAssets .asset[data-k="js"]', '#cdnZone');
  console.log('after drag: bw', await page.textContent('#bwVal'));
  await page.click('#webAssets .asset[data-k="css"]');
  await page.click('#webAssets .asset[data-k="img"]');
  console.log('bw final', await page.textContent('#bwVal'));
  await ok(4);

  // ---- stage 5
  const BOSS = { 'The popular profile': 'cache', 'Shoppers on five continents': 'cdn', 'The balance after a transfer': 'origin', 'The ghost of app.js': 'expiry', 'The leaderboard': 'cache', 'The one-off export': 'origin', 'The undead “in stock”': 'expiry' };
  for (let i = 0; i < 7; i++) {
    const t = (await page.textContent('#boss .scenario h3')).trim();
    await page.click(`#boss .choice .opt[data-c="${BOSS[t]}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await ok(5);

  // ---- stage 6: first a 3/5 grade (retry), then 5/5
  const ANS = 'Two layers: a cache tier between web servers and DB, check cache, on miss read DB and fill with a TTL; LRU eviction; several nodes. Then a CDN for static files with versioned URLs.';
  await page.fill('#drill textarea', ANS);
  await page.click('#drill .q-reveal');
  const cbs = await page.$$('#drill .selfgrade input');
  for (const cb of cbs.slice(0, 3)) await cb.check();
  await page.click('#drill .q-finish');
  console.log('after 3/5: cleared?', !!(await page.$('#s6.cleared')), '| msg', (await page.textContent('#drillMsg')).slice(0, 30));
  await page.click('#drillMsg .btn');
  await page.fill('#drill textarea', ANS);
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await ok(6);
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY:', (await page.textContent('#victory h2')).trim(), '| xp', await page.textContent('#victory .vstats b'), '| hearts', 3 - await page.$$eval('.heart.lost', x => x.length));
  console.log('errors:', errs.length ? errs : 'none');
  await ctx.close();

  // ---- screenshots at 375 dark
  const c2 = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const p2 = await c2.newPage(); const e2 = [];
  p2.on('pageerror', e => e2.push(e.message));
  await p2.goto(FILE); await p2.waitForTimeout(800);
  await p2.click('#rtActs [data-a="check"]'); await p2.click('#rtActs [data-a="db"]');
  await (await p2.$('#s1')).screenshot({ path: DIR + '0103-s1.png' });
  await p2.$eval('#ttlIn', el => { el.value = 5; el.dispatchEvent(new Event('input')); });
  await p2.click('#evRows .evrow[data-p="LRU"] .opt[data-k="B"]'); await p2.waitForTimeout(2200);
  await (await p2.$('#s2')).screenshot({ path: DIR + '0103-s2.png' });
  await (await p2.$$('#cdnBox .opt'))[0].click(); await p2.waitForTimeout(2400);
  await (await p2.$('#s3 .sim')).screenshot({ path: DIR + '0103-s3-mid.png' });
  await p2.waitForSelector('#cdnBox .row .btn.primary', { timeout: 20000 });
  await (await p2.$('#s3')).screenshot({ path: DIR + '0103-s3.png' });
  await p2.click('#webAssets .asset[data-k="css"]');
  await (await p2.$('#s4')).screenshot({ path: DIR + '0103-s4.png' });
  await (await p2.$('#s5')).screenshot({ path: DIR + '0103-s5.png' });
  console.log('overflowX 375:', await p2.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'errors:', e2.length ? e2 : 'none');
  // light desktop map
  const c3 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const p3 = await c3.newPage(); await p3.goto(FILE); await p3.waitForTimeout(500);
  await (await p3.$('#s3 .sim')).screenshot({ path: DIR + '0103-s3-light.png' });
  await (await p3.$('#s1 .sim')).screenshot({ path: DIR + '0103-s1-light.png' });
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
