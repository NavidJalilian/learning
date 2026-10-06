const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0503-consistent-hashing-boss-hash-it-live.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad';
const REDUCED = process.argv[2] !== 'motion';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: REDUCED ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(500);
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const xp = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs?.['0503']?.xp);
  const cleared = () => page.evaluate(() => [...document.querySelectorAll('.stage.cleared')].map(s => +s.dataset.stage));
  const clickText = async (sel, text) => { await page.locator(sel, { hasText: text }).first().click(); };
  const W = REDUCED ? 1 : 3;

  /* stage 1 */
  await page.waitForSelector('#s1open .opt', { timeout: 8000 });
  await clickText('#s1open .opt', 'Ask what the servers hold');
  await page.waitForSelector('#qdeck .opt', { timeout: 8000 });
  await clickText('#qdeck .opt', 'Redis or Memcached');
  for (const t of ['cache, or the system', 'join or leave', 'same size', 'How many keys', 'much hotter', 'Who does the routing']) { await clickText('#qdeck .opt', t); await page.waitForTimeout(150 * W); }
  await page.waitForSelector('#in-per', { timeout: 8000 });
  await page.fill('#in-per', '50'); await page.press('#in-per', 'Enter');   // wrong -> heart
  await page.fill('#in-per', '25'); await page.press('#in-per', 'Enter');
  await page.fill('#in-ring', '23.8'); await page.locator('.cq-wrap[data-n="ring"] .btn').click();
  await page.fill('#in-mod', '476'); await page.press('#in-mod', 'Enter');
  await page.waitForTimeout(1500 * W);
  console.log('after s1: cleared', await cleared(), 'reqs', await page.$$eval('#reqs .req.got', e => e.length), 'hearts', await hearts(), 'xp', await xp(), 'clock', await page.textContent('#ivClock'));
  await page.screenshot({ path: SP + '/0503-s1-375-dark.png', fullPage: false });
  await page.evaluate(() => document.querySelector('#napkin').scrollIntoView());
  await page.screenshot({ path: SP + '/0503-napkin-375-dark.png' });

  /* reload mid-quest */
  await page.reload(); await page.waitForTimeout(700);
  console.log('resume banner:', await page.$eval('.banner.resume', e => e.textContent.trim().slice(0, 80)).catch(() => 'NONE'), '| cleared', await cleared(), 'hearts', await hearts(), 'xp', await xp(), 'clock', await page.textContent('#ivClock'));

  /* stage 2 */
  await page.waitForSelector('#tiles .opt');
  await page.click('#tiles .opt[data-k="srv"]');     // out of order -> -1 min
  await page.click('#tiles .opt[data-k="tbl"]');     // distractor -> heart
  for (const k of ['cli', 'ring', 'srv', 'mem', 'db']) { await page.click(`#tiles .opt[data-k="${k}"]`); await page.waitForTimeout(100 * W); }
  await page.waitForSelector('#ocards .opt', { timeout: 8000 });
  await page.click('#ocards .opt[data-i="2"]');      // wrong order -> heart
  for (const i of [0, 1, 2, 3]) await page.click(`#ocards .opt[data-i="${i}"]`);
  await page.waitForSelector('#s2q .opt', { timeout: 15000 });
  console.log('lookup log:', await page.textContent('#bslog'), '| A hit:', await page.$eval('#pSrv .srv[data-s="A"]', e => e.classList.contains('hit')));
  await page.evaluate(() => document.querySelector('#archSim').scrollIntoView());
  await page.screenshot({ path: SP + '/0503-s2-375-dark.png' });
  await clickText('#s2q .opt', 'A few keys');
  await page.waitForTimeout(1500 * W);
  console.log('after s2: cleared', await cleared(), 'hearts', await hearts(), 'xp', await xp(), 'clock', await page.textContent('#ivClock'));

  /* stage 3 */
  const MAP = { 'Few keys move': 'ring', 'even share': 'vn', '2× server': 'wvn', 'dead server': 'vn', 'what to copy': 'anti', 'server fast': 'bs', 'copies on other': 'cw', '40% of all reads': 'hot' };
  for (let i = 0; i < 8; i++) {
    await page.waitForSelector('#palette .opt:not([disabled])');
    const h = await page.textContent('#goalcard h3');
    const k = Object.entries(MAP).find(([t]) => h.includes(t));
    if (!k) throw new Error('no map for ' + h);
    const pick = i === 0 ? (k[1] === 'ring' ? 'bs' : 'ring') : k[1];   // first one wrong on purpose
    await page.click(`#palette .opt[data-t="${pick}"]`);
    if (i === 0) await page.click('#mapNext .btn');
    else await page.waitForTimeout(REDUCED ? 700 : 1600);
  }
  await page.waitForSelector('#twist .opt', { timeout: 8000 });
  await clickText('#twist .opt', 'About 9%');
  await page.waitForTimeout(1500 * W);
  console.log('after s3: cleared', await cleared(), 'rows', await page.$$eval('#tmap tbody tr', e => e.length), 'hearts', await hearts(), 'xp', await xp());

  /* stage 4 */
  for (let i = 0; i < 9; i++) {
    await page.click(`#barrage .opts .opt[data-i="${i === 4 ? 1 : 0}"]`);
    await page.click('#barrage .q-arena .row .btn.primary');
  }
  await page.waitForTimeout(800);
  console.log('after s4: cleared', await cleared(), '|', await page.textContent('#barrage .scenario p'), 'xp', await xp());

  /* stage 5: a weak close first, then a strong one */
  await page.waitForSelector('#wrapcards .opt');
  for (const t of ['Re-derive', 'List every hash', 'Recap']) await clickText('#wrapcards .opt', t);
  await page.click('#deliver');
  await page.waitForSelector('#s5again .btn', { state: 'visible', timeout: 8000 });
  console.log('weak close: cleared?', (await cleared()).includes(5));
  await page.click('#s5again .btn');
  for (const t of ['Recap', 'Name who runs it', 'Admit the limits']) await clickText('#wrapcards .opt', t);
  await page.click('#deliver');
  await page.waitForTimeout(2000 * W);
  console.log('after s5: cleared', await cleared(), 'xp', await xp());

  /* stage 6 */
  const words = 'hash mod N moves about N over N plus one of the keys so twenty to twenty one moves 95 percent. Use a ring: servers and keys hashed with the same function, first server clockwise via binary search. Join or leave moves k over n keys. Virtual nodes for even load, more for bigger machines. Membership service. Hot key needs caching; Dynamo and Cassandra use it.';
  await page.fill('#drill textarea', words);
  await page.click('#drill .q-reveal');
  const boxes = await page.$$('#drill .selfgrade input');
  for (const b of boxes) await b.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 8000 });
  await page.waitForTimeout(900);
  console.log('VICTORY:', await page.$eval('#victory h2', e => e.textContent), '|', await page.$eval('#victory .sc-vic', e => e.textContent).catch(() => 'NO SCORE LINE'));
  console.log('scorecard:', (await page.textContent('#scorecard')).replace(/\s+/g, ' ').slice(0, 400));
  const st = await page.evaluate(() => ({ lesson: JSON.parse(localStorage.getItem('sdq:v1')).lessons['0503'], iv: !!localStorage.getItem('sdq:v1:0503-interview') }));
  console.log('saved:', JSON.stringify(st));
  console.log('overflow:', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await page.screenshot({ path: SP + '/0503-dark-375-full.png', fullPage: true });
  for (const s of ['s3', 's4', 's6']) { await page.evaluate(s => document.querySelector('#' + s).scrollIntoView(), s); await page.screenshot({ path: SP + `/0503-${s}-375-dark.png` }); }

  for (const sel of ['#s2order', '#twist', '#barrage', '#wrapcards', '#mapGame']) await page.locator(sel).screenshot({ path: SP + `/0503-el-${sel.slice(1)}.png` });
  /* review-mode reload */
  await page.reload(); await page.waitForTimeout(700);
  console.log('review reload: banner', await page.$eval('.banner', e => e.textContent.trim().slice(0, 40)).catch(() => 'NONE'), '| victory', await page.$eval('#victory .sc-vic', e => e.textContent).catch(() => 'NONE'));

  /* light desktop shot of the whiteboard */
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const p2 = await ctx2.newPage(); p2.on('pageerror', e => errs.push('p2: ' + e.message));
  await p2.goto(FILE); await p2.waitForTimeout(500);
  await p2.evaluate(() => document.querySelectorAll('#arch .part').forEach(p => p.classList.add('on')));
  await p2.evaluate(() => document.querySelector('#archSim').scrollIntoView());
  await p2.screenshot({ path: SP + '/0503-arch-1280-light.png' });

  console.log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
})();
