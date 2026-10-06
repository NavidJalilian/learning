const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1302-trie-top-k.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(URL);
  const hearts = () => page.$$eval('.hud .heart:not(.lost)', a => a.length);
  const xp = () => page.evaluate(() => (JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['1302']?.xp ?? null);
  const waitCleared = n => page.waitForFunction(k => document.querySelector('#s' + k).classList.contains('cleared'), n, { timeout: 30000 });
  const ok = (c, m) => { if (!c) { console.log('FAIL:', m); process.exitCode = 1; } else console.log('ok  ', m); };
  const quizPick = async (mount, text) => { const b = page.locator(`${mount} .opt:not([disabled])`, { hasText: text }).first(); await b.waitFor({ timeout: 15000 }); await b.click(); };

  /* ---------- stage 1 ---------- */
  async function plant(w, n) {
    await page.click(`#w1 .wchip[data-w="${w}"]`);
    for (let i = 0; i < n; i++) await page.click('#p1p');
    await page.click('#p1go');
    await page.waitForFunction(() => document.querySelector('#p1ctl').hidden, null, { timeout: 15000 });
  }
  await plant('tree', 3); // wrong (4)
  ok(await hearts() === 2, 's1 wrong prediction costs a heart');
  ok((await page.textContent('#p1ex')).includes('4 new node'), 's1 explains tree added 4');
  await plant('try', 1);
  await plant('true', 2);
  await page.locator('#s1 .sim').screenshot({ path: SP + '1302-375-s1-sim.png' });
  await plant('toy', 2);
  ok(await page.$$eval('#streak1 span.on', a => a.length) === 3, 's1 streak hits 3');
  await quizPick('#s1quiz', 'The prefix spelled');
  await waitCleared(1); ok(true, 'stage 1 cleared');
  ok(await xp() === 50, 's1 xp = 50 (got ' + await xp() + ')');
  // dig up and replant check
  await page.click('#p1reset');
  ok(await page.$$eval('#w1 .wchip:not([disabled])', a => a.length) === 6, 's1 reset re-enables all chips');

  /* ---------- stage 2 ---------- */
  await page.fill('#in2', 'xy');
  ok(await page.$eval('#b2find', b => b.disabled), 's2 bad prefix keeps Find disabled');
  await page.fill('#in2', 'be');
  await page.click('#b2find');
  await page.waitForFunction(() => !document.querySelector('#b2col').disabled, null, { timeout: 15000 });
  ok(await page.textContent('#mp') === '2', 's2 p = 2');
  await page.click('#b2col');
  await page.waitForFunction(() => !document.querySelector('#b2sort').disabled, null, { timeout: 15000 });
  ok(await page.textContent('#mc') === '6', 's2 c = 6 nodes visited');
  await page.click('#b2sort');
  await page.waitForFunction(() => document.querySelectorAll('#drop2 li').length === 2, null, { timeout: 15000 });
  const d2 = await page.textContent('#drop2');
  ok(d2.indexOf('best') > -1 && d2.indexOf('bet') > d2.indexOf('best'), 's2 top 2 = best, bet');
  await page.locator('#s2 .sim').screenshot({ path: SP + '1302-375-s2-sim.png' });
  await page.click('#b2worst');
  await page.waitForSelector('#b2back:not([hidden])', { timeout: 15000 });
  ok((await page.textContent('#ms2')).startsWith('214'), 's2 worst case ≈ 214 ms: ' + await page.textContent('#ms2'));
  await page.locator('#s2 .sim').screenshot({ path: SP + '1302-375-s2-worst.png' });
  await page.click('#b2back');
  await quizPick('#s2quiz', 'Walking the whole subtree');
  await quizPick('#s2quiz', 'best (35) and bet');
  await waitCleared(2); ok(true, 'stage 2 cleared');

  /* ---------- stage 3 ---------- */
  ok(await page.$eval('#swCache', b => b.disabled), 's3 cache switch locked until prediction');
  await page.click('#b3look');
  await page.waitForSelector('#s3goals [data-g="slow"].done', { timeout: 15000 });
  ok(await page.textContent('#v3t') === '7', 's3 slow lookup touches 7 nodes');
  await page.click('#pred3 .seg[data-p="time"] button[data-v="down"]');
  await page.click('#pred3 .seg[data-p="mem"] button[data-v="up"]');
  await page.click('#lock3');
  await page.click('#swCache');
  await page.waitForFunction(() => document.querySelector('#pex3').textContent.includes('Lookup time'), null, { timeout: 15000 });
  ok(await page.textContent('#v3t') === '2', 's3 cached lookup touches 2 nodes');
  ok((await page.textContent('#memv')).includes('21 cached'), 's3 memory gauge shows 21 cached entries');
  await page.click('#swCap');
  await page.click('#b3look');
  await page.waitForSelector('#s3goals [data-g="o1"].done', { timeout: 15000 });
  ok((await page.textContent('#bigo3')).includes('Total per keystrokeO(1)'), 's3 total O(1)');
  await page.locator('#t3 .tn[aria-label^="Node be:"]').click();
  ok((await page.textContent('#insp3')).includes('best 35'), 's3 inspector shows be cached list');
  await page.locator('#s3 .sim').screenshot({ path: SP + '1302-375-s3-sim.png' });
  await quizPick('#s3quiz', 'Real queries are almost');
  await quizPick('#s3quiz', 'We only show');
  await waitCleared(3); ok(true, 'stage 3 cleared');

  /* ---------- reload mid-quest ---------- */
  const xpBefore = await xp(), hBefore = await hearts();
  await page.reload();
  await page.waitForSelector('.banner.resume');
  ok(await page.$$eval('.stage.cleared', a => a.length) === 3, 'resume: 3 stages still cleared');
  ok(await xp() === xpBefore && await hearts() === hBefore, `resume: xp ${xpBefore} and hearts ${hBefore} kept`);

  /* ---------- stage 4 ---------- */
  await quizPick('#q4a', 'In 5 of');
  await page.locator('#t4 .tn[aria-label^="Node bet:"]').click();
  ok(await hearts() === hBefore - 1, 's4 tapping bet costs a heart');
  for (const id of ['root', 'b', 'be', 'bee', 'beer']) await page.locator(`#t4 .tn[aria-label^="Node ${id}:"]`).click();
  await page.waitForSelector('#bump4:not([hidden])');
  await page.click('#bump4');
  await page.waitForFunction(() => document.querySelector('#ex4').classList.contains('show'), null, { timeout: 15000 });
  ok(await page.$$eval('#tab4 tr.chg', a => a.length) === 5, 's4 exactly 5 lists changed');
  await page.locator('#s4 .sim').screenshot({ path: SP + '1302-375-s4-sim.png' });
  await quizPick('#s4quiz', 'L + 1');
  await waitCleared(4); ok(true, 'stage 4 cleared');

  /* ---------- stage 5 boss ---------- */
  for (const k of ['sub', 'cc', 'trade', 'cut', 'same']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .q-arena .row .btn.primary');
  }
  await waitCleared(5); ok(true, 'stage 5 boss cleared');

  /* ---------- stage 6 drill ---------- */
  await page.fill('#drill textarea', 'A trie stores prefixes from an empty root; naive top k is O(p) plus O(c) plus O(c log c); cap prefix at 50 and cache top 5 per node to get O(1), costs memory and ripple updates.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await waitCleared(6); ok(true, 'stage 6 cleared');

  await page.waitForSelector('#victory.show', { timeout: 10000 });
  ok(true, 'victory card shown');
  const final = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).lessons['1302']);
  console.log('final', JSON.stringify(final));
  await page.screenshot({ path: SP + '1302-375-dark.png', fullPage: true });
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await browser.close();
})();
