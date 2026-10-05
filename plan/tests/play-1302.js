const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1302-trie-top-k.html';
const DIR = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const RIGHT = ['The string spelled from the root to it', 'Visiting the subtree, then sorting it', 'best (35) and bet (29)',
  'Real queries are almost never that long', 'Keeps the extra memory small; we show ~5', '13 lists'];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
  await page.goto(FILE);
  const xp = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('sdq:v1') || '{}'); return ((d.runs || {})['1302'] || (d.lessons || {})['1302'] || {}).xp; });
  const ok = async n => { await page.waitForSelector(`#s${n}.cleared`, { timeout: 40000 }); console.log('stage', n, 'cleared · xp', await xp()); };
  async function answerQuiz(sel, nth = 1) {
    const q = `${sel} .quiz:nth-of-type(${nth}) .opt:not([disabled])`;
    await page.waitForSelector(q, { timeout: 10000 });
    for (const o of await page.$$(q)) { const t = (await o.textContent()).trim(); if (RIGHT.includes(t)) { await o.click(); return; } }
    throw new Error('no right option in ' + sel);
  }
  async function plant(w, n) {
    await page.click(`#wchips .wchip[data-w="${w}"]`);
    for (let i = 0; i < n; i++) await page.click('#t1plus');
    await page.click('#t1grow');
    await page.waitForFunction(() => !document.querySelector('#t1grow').disabled || !document.querySelector('#wchips .wchip:not([disabled])'), null, { timeout: 10000 });
    await page.waitForFunction(() => document.querySelector('#t1fb').classList.contains('show'));
    await page.waitForTimeout(100);
    console.log('  ', w, '→', (await page.textContent('#t1fb')).slice(0, 70));
  }
  // ---- stage 1: one wrong, then three right
  await plant('tree', 3);
  console.log('hearts lost after wrong:', await page.$$eval('.heart.lost', x => x.length));
  await plant('try', 1); await plant('true', 2); await plant('toy', 2);
  console.log('nodes:', await page.textContent('#t1count'));
  await page.click('#trie1 g.tn[aria-label="node tr"]');
  console.log('note:', await page.textContent('#t1note'));
  await answerQuiz('#s1quiz');
  await ok(1);
  // ---- stage 2
  await page.fill('#s2in', 'be');
  await page.click('#s2find'); await page.waitForSelector('#s2col:not([disabled])');
  await page.click('#s2col'); await page.waitForSelector('#s2sort:not([disabled])');
  await page.click('#s2sort'); await page.waitForSelector('#s2goals [data-g="naive"].done');
  console.log('top:', await page.$$eval('#s2found .qcard.top', x => x.map(e => e.textContent)), 'stats', await page.$$eval('#s2 .stat b', x => x.map(e => e.textContent)));
  await page.click('#s2worst'); await page.waitForSelector('#s2goals [data-g="worst"].done', { timeout: 15000 });
  console.log('worst stats', await page.$$eval('#s2 .stat b', x => x.map(e => e.textContent)), 'bar bad:', await page.$eval('#s2bar', e => e.className));
  await page.screenshot({ path: DIR + '1302-s2-1280.png', clip: await (await page.$('#s2 .sim')).boundingBox() });
  await answerQuiz('#s2quiz', 1); await page.waitForTimeout(800);
  await answerQuiz('#s2quiz', 2);
  await ok(2);
  // ---- reload mid-quest
  await page.reload(); await page.waitForTimeout(500);
  console.log('resume banner:', !!(await page.$('.banner.resume')), 'cleared:', await page.$$eval('.stage.cleared', x => x.map(s => s.id)), 'xp', await xp());
  // ---- stage 3
  await page.click('#s3chips .chip:text-is("be")');
  await page.waitForSelector('#s3goals [data-g="slow"].done', { timeout: 10000 });
  console.log('slow touched:', await page.textContent('#s3v'), 'sort:', await page.textContent('#s3s'));
  console.log('cache disabled before predict:', await page.$eval('#cacheT', e => e.disabled));
  await page.click('#s3pred .seg[data-q="time"] button[data-v="down"]');
  await page.click('#s3pred .seg[data-q="mem"] button[data-v="up"]');
  await page.click('#s3lock');
  await page.click('#cacheT'); await page.click('#capT');
  console.log('formula:', await page.textContent('#formula'), '| mem', await page.textContent('#s3mem'));
  await page.click('#s3chips .chip:text-is("be")');
  await page.waitForSelector('#s3goals [data-g="fast"].done', { timeout: 10000 });
  console.log('fast touched:', await page.textContent('#s3v'), 'drop:', await page.$$eval('#s3drop li', x => x.map(e => e.textContent).join(' | ')));
  await page.click('#trie3 g.tn[aria-label="node bes"]');
  console.log('note3:', await page.textContent('#s3note'));
  await answerQuiz('#s3quiz', 1); await page.waitForTimeout(800);
  await answerQuiz('#s3quiz', 2);
  await ok(3);
  // ---- stage 4
  for (let i = 0; i < 4; i++) await page.click('#s4plus');
  await page.click('#s4check');
  const tap = async p => page.click(`#trie4 g.tn[aria-label^="node ${p}:"]`);
  const h0 = await page.$$eval('.heart.lost', x => x.length);
  await tap('bet');
  console.log('wrong tap hearts', h0, '→', await page.$$eval('.heart.lost', x => x.length));
  for (const p of ['root', 'b', 'be', 'bee', 'beer']) await tap(p);
  console.log('cost:', await page.textContent('#s4cost'));
  console.log('root list:', await page.textContent('#s4lists .lrow[data-p=""] .ents'));
  await answerQuiz('#s4quiz');
  await ok(4);
  // ---- stage 5
  const BOSS = { 'One letter, long wait': 'sub', 'Make it O(1)': 'two', '"Isn\'t that wasteful?"': 'yes', 'A 200-character paste': 'fifty', '"Why not a hash map?"': 'is' };
  for (let i = 0; i < 5; i++) {
    const t = (await page.textContent('#boss .scenario h3')).trim();
    await page.click(`#boss .choice .opt[data-c="${BOSS[t]}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await ok(5);
  // ---- stage 6
  await page.fill('#drill textarea', 'The root is the empty string and each node is a prefix; naive costs O(p) plus O(c) plus O(c log c); cap prefix and cache top k per node for O(1), costing memory.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await ok(6);
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY:', (await page.textContent('#victory h2')).trim(), '| xp', await page.textContent('#victory .vstats b'));
  console.log('errors:', errs.length ? errs : 'none');
  await ctx.close();

  // ---- 375 dark screenshots in a fresh context
  const c2 = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const p2 = await c2.newPage(); const e2 = [];
  p2.on('pageerror', e => e2.push(e.message));
  await p2.goto(FILE); await p2.waitForTimeout(400);
  for (const [w, n] of [['tree', 4], ['try', 1], ['wish', 4]]) {
    await p2.click(`#wchips .wchip[data-w="${w}"]`); for (let i = 0; i < n; i++) await p2.click('#t1plus'); await p2.click('#t1grow');
    await p2.waitForFunction(() => document.querySelector('#t1fb').classList.contains('show')); await p2.waitForTimeout(200);
  }
  await p2.fill('#s2in', 'be'); await p2.click('#s2find'); await p2.waitForSelector('#s2col:not([disabled])'); await p2.click('#s2col'); await p2.waitForSelector('#s2sort:not([disabled])'); await p2.click('#s2sort'); await p2.waitForTimeout(1200);
  await p2.click('#s3pred .seg[data-q="time"] button[data-v="down"]'); await p2.click('#s3pred .seg[data-q="mem"] button[data-v="up"]'); await p2.click('#s3lock');
  await p2.click('#cacheT'); await p2.click('#capT'); await p2.click('#s3chips .chip:text-is("be")'); await p2.waitForTimeout(1500);
  for (const s of [1, 2, 3, 4]) await (await p2.$('#s' + s)).screenshot({ path: `${DIR}1302-375-dark-s${s}.png` });
  await p2.screenshot({ path: DIR + '1302-375-dark.png', fullPage: true });
  console.log('overflowX 375:', await p2.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'errors:', e2.length ? e2 : 'none');
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
