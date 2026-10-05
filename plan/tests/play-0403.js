const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0403-window-algorithms.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const RIGHT = ['Up to 10 requests', 'It keeps timestamps of rejected requests too', 'Its requests were spread out evenly'];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
  await page.goto(FILE);
  const xp = () => page.evaluate(() => { try { const d = JSON.parse(localStorage.getItem('sdq:v1')); const r = d.runs['0403'] || d.lessons['0403']; return `xp=${r.xp} hearts=${r.hearts ?? r.stars}`; } catch (e) { return e.message; } });
  const ok = async n => { await page.waitForSelector(`#s${n}.cleared`, { timeout: 40000 }); console.log('stage', n, 'cleared', await xp()); };
  async function answerQuiz(sel) {
    await page.waitForSelector(`${sel} .quiz .opt:not([disabled])`, { timeout: 10000 });
    for (const o of await page.$$(`${sel} .quiz .opt:not([disabled])`)) { const t = (await o.textContent()).trim(); if (RIGHT.includes(t)) { await o.click(); return; } }
    throw new Error('no right option in ' + sel);
  }
  // ---- stage 1 ----
  const box1 = await (await page.$('#tl1')).boundingBox();
  const sc = box1.width / 400;
  const at = (t, y) => [box1.x + (20 + 3 * t) * sc, box1.y + y * sc];
  await page.locator('#s1').scrollIntoViewIfNeeded();
  const b1 = await (await page.$('#tl1')).boundingBox();
  const at2 = (t, y) => [b1.x + (20 + 3 * t) * sc, b1.y + y * sc];
  for (const t of [45, 48, 51, 54, 57, 61, 64, 67, 70, 73, 76]) { const [x, y] = at2(t, 90); await page.mouse.click(x, y); }
  console.log('window counters:', await page.$$eval('#tl1 .wc', e => e.map(x => x.textContent)), 'red dots:', await page.$$eval('#tl1 .rq.no', e => e.length));
  // drag the ruler handle from start 0 to start 45
  const [hx, hy] = at2(30, 168), [tx] = at2(75, 168);
  await page.mouse.move(hx, hy); await page.mouse.down(); await page.mouse.move((hx + tx) / 2, hy, { steps: 5 }); await page.mouse.move(tx, hy, { steps: 5 }); await page.mouse.up();
  console.log('ruler after drag:', await page.textContent('#r1lab'), 'count', await page.textContent('#r1count'));
  await answerQuiz('#s1quiz');
  await ok(1);
  // ---- stage 2 ----
  const pick = async k => { await page.click(`#l2box .decide .opt[data-k="${k}"]`); await page.waitForSelector('#l2box .explain.show', { timeout: 15000 }); };
  await pick('acc'); await page.click('#l2box .row:last-child .btn.primary');
  await pick('acc'); await page.click('#l2box .row:last-child .btn.primary');
  await pick('rej');
  console.log('after req 3 log:', await page.$$eval('#l2chips .lchip', e => e.map(x => x.textContent + ':' + x.className)));
  await page.click('#l2box .row:last-child .btn.primary');
  await page.waitForSelector('#evGo');
  for (const t of ['1:00:01', '1:00:30']) await page.click(`#l2chips .lchip:has-text("${t}")`);
  await page.click('#evGo');
  console.log('eviction:', (await page.textContent('#l2box .explain')).slice(0, 30));
  await page.click('#l2box .row:last-child .btn.primary');
  await pick('acc');
  console.log('final log:', await page.$$eval('#l2chips .lchip', e => e.map(x => x.textContent)));
  await page.click('#l2box .row:last-child .btn.primary');
  await page.waitForSelector('#memBox', { state: 'visible' });
  await page.fill('#memIn', '40'); await page.click('#memGo');
  console.log('mem wrong:', (await page.textContent('#memEx')).slice(0, 40), await xp());
  await page.fill('#memIn', '4'); await page.click('#memGo');
  await answerQuiz('#s2quiz');
  await ok(2);
  // ---- reload mid-quest ----
  await page.reload(); await page.waitForTimeout(500);
  console.log('resume banner:', !!(await page.$('.banner.resume')), 'cleared after reload:', await page.$$eval('.stage.cleared', x => x.map(s => s.id)), await xp());
  // ---- stage 3 ----
  await page.$eval('#r3', el => { el.value = 30; el.dispatchEvent(new Event('input', { bubbles: true })); });
  console.log('book estimate:', await page.textContent('#r3est'), '| real', await page.textContent('#r3real'));
  for (const [est, dec] of [['6.5', 'allow'], ['10', 'reject'], ['6', 'allow'], ['90', 'allow']]) {
    await page.fill('#r3in', est); await page.click(`#r3box .decide .opt[data-d="${dec}"]`); await page.click('#r3go');
    const ex = await page.textContent('#r3box .explain'); if (!ex.startsWith('Spot on')) console.log('ROUND WRONG', ex);
    await page.click('#r3box .row .btn.primary');
  }
  await page.click('#distSeg button[data-d="end"]');
  console.log('blind spot:', await page.textContent('#r3est'), '| real', await page.textContent('#r3real'));
  await answerQuiz('#s3quiz');
  await ok(3);
  // ---- stage 4 ----
  const MAP = { 'Lets short bursts': 'tb', 'Bucket size and': 'tb', 'Sends requests on': 'lb', 'A burst fills': 'lb', 'One counter per window': 'fw', 'Bursts at window edges': 'fw', 'Exact: no rolling': 'sl', 'Stores a timestamp': 'sl', 'Smooths spikes': 'sc', 'An estimate that': 'sc' };
  const algOf = t => MAP[Object.keys(MAP).find(k => t.includes(k))];
  let first = true;
  while (await page.$('#pool .tcard')) {
    const c = await page.$('#pool .tcard'); const t = (await c.textContent()).trim(); const a = algOf(t);
    await c.click();
    if (first) { first = false; await page.click(`#cols .col[data-a="${a === 'tb' ? 'lb' : 'tb'}"]`); console.log('bounced:', await page.$$eval('#pool .tcard.nope', e => e.length)); }
    await page.click(`#cols .col[data-a="${a}"]`);
  }
  await page.waitForSelector('#refWrap', { state: 'visible' });
  console.log('ref rows:', await page.$$eval('#reftab .refrow', e => e.length));
  const PICK = ['sl', 'sc', 'fw'];
  for (const item of await page.$$('#pickList .sort-item')) { const i = +(await item.getAttribute('data-i')); await (await item.$(`.opt[data-k="${PICK[i]}"]`)).click(); }
  await ok(4);
  // ---- stage 5 ----
  const BOSS = { 'Double dip at :00': 'fw', 'Fix it, cheaply': 'sc', 'The auditor\'s rule': 'sl', 'Memory blew up': 'rej', 'How wrong is the estimate?': 'a' };
  for (let i = 0; i < 5; i++) {
    const t = (await page.textContent('#boss .scenario h3')).trim();
    await page.click(`#boss .choice .opt[data-c="${BOSS[t]}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await ok(5);
  // ---- stage 6 ----
  await page.fill('#drill textarea', 'Fixed window counts per round minute and lets 10 through at the edge; sliding log stores timestamps in a sorted set, exact but heavy; sliding counter blends current plus previous times overlap.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await ok(6);
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY:', (await page.textContent('#victory h2')).trim(), '| xp', await page.textContent('#victory .vstats b'));
  console.log('errors:', errs.length ? errs : 'none');
  await ctx.close();

  // ---- 375 dark screenshots, fresh context ----
  const c2 = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const p2 = await c2.newPage(); const e2 = [];
  p2.on('pageerror', e => e2.push(e.message));
  await p2.goto(FILE); await p2.waitForTimeout(400);
  // show me on stage 1, and play a bit of stage 2 and 3
  await p2.click('#t1show'); await p2.waitForSelector('#s1quiz .quiz', { timeout: 15000 });
  await p2.click('#l2box .decide .opt[data-k="acc"]'); await p2.waitForSelector('#l2box .explain.show', { timeout: 15000 });
  await p2.$eval('#r3', el => { el.value = 30; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await p2.click('#distSeg button[data-d="end"]');
  await p2.screenshot({ path: SP + '0403-375-dark.png', fullPage: true });
  for (const s of ['s1', 's2', 's3', 's4']) { await p2.locator('#' + s).screenshot({ path: SP + `0403-375-${s}.png` }); }
  console.log('overflowX 375:', await p2.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'errors:', e2.length ? e2 : 'none');
  await c2.close();
  const c3 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const p3 = await c3.newPage(); await p3.goto(FILE); await p3.waitForTimeout(300);
  for (const s of ['s1', 's3']) await p3.locator('#' + s).screenshot({ path: SP + `0403-1280-${s}.png` });
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
