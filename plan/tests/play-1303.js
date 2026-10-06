const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1303-data-gathering-service.html';
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
  const xp = () => page.evaluate(() => (JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['1303']?.xp ?? null);
  const cleared = n => page.$eval('#s' + n, e => e.classList.contains('cleared'));
  const waitCleared = n => page.waitForFunction(k => document.querySelector('#s' + k).classList.contains('cleared'), n, { timeout: 30000 });
  const ok = (c, m) => { if (!c) { console.log('FAIL:', m); process.exitCode = 1; } else console.log('ok  ', m); };
  const setRange = (sel, v) => page.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

  ok(await page.$eval('#run1', e => e.disabled), 'stage 1 run button waits for a prediction');
  ok(await page.evaluate(() => [1,2,3,4,5,6,7].every(n => !document.querySelector('#s' + n).classList.contains('locked'))), 'no stage is locked');

  /* ---------- stage 1 ---------- */
  await page.click('#pred1 .opt:has-text("Climbs past")');
  await page.waitForTimeout(2200);
  await page.locator('#s1 .sim').screenshot({ path: SP + '1303-s1-mid.png' });
  await page.waitForSelector('#pred1 .explain.show', { timeout: 15000 });
  ok(await page.$eval('#pred1 .explain', e => e.classList.contains('good')), 'prediction "past 100 ms" is right');
  const lat = await page.textContent('#lat1');
  ok(parseInt(lat) > 100, 'live latency ends past 100 ms: ' + lat);
  ok(await page.$eval('#top5', e => e.classList.contains('on')), 'top-5 comparison shown');
  const t5a = await page.$$eval('#t5a li', a => a.map(x => x.textContent.split(' ')[0]));
  const t5b = await page.$$eval('#t5b li', a => a.map(x => x.textContent.split(' ')[0]));
  ok(JSON.stringify(t5a) === JSON.stringify(t5b), 'top 5 order identical before/after: ' + t5a.join(','));
  ok(await page.textContent('#c1w') === '90,000', 'node rewrites counter = 90,000');
  await page.click('#mode1 button[data-m="batch"]');
  await page.click('#run1');
  await page.waitForFunction(() => document.querySelector('#s1goals [data-g="batch"]').classList.contains('done'), null, { timeout: 15000 });
  ok(parseInt(await page.textContent('#lat1')) < 20, 'batch latency stays flat');
  ok(await page.textContent('#c1l') === '10,000', 'log holds 10,000 lines');
  await page.waitForSelector('#s1quiz .opt');
  await page.click('#s1quiz .opt:has-text("Too many writes")');
  await waitCleared(1);
  ok(true, 'stage 1 cleared; xp=' + await xp());

  /* ---------- reload mid-quest ---------- */
  await page.reload();
  await page.waitForSelector('.banner.resume');
  ok(await cleared(1) && await hearts() === 3, 'resume after reload keeps stage 1 + hearts');

  /* ---------- stage 2 ---------- */
  await page.click('#tiles2 .tile[data-i="3"]');
  ok(await hearts() === 2, 'wrong pipeline tap costs a heart');
  ok((await page.textContent('#hint2')).includes('Not yet'), 'wrong tap shows a hint');
  for (let i = 0; i < 6; i++) await page.click(`#tiles2 .tile[data-i="${i}"]`);
  ok(await page.$$eval('#pipe2 .slot.on', a => a.length) === 6, 'all six slots placed');
  ok(await overflow() <= 1, 'no overflow after pipeline at 375px');
  await page.click('#sample2');
  await page.waitForSelector('#s2quiz .opt', { timeout: 15000 });
  ok((await page.textContent('#pipe2 .slot[data-i="2"] .smp')).includes('12000'), 'sample row flows through aggregated data');
  await page.locator('#s2').screenshot({ path: SP + '1303-s2.png' });
  await page.click('#s2quiz .opt:has-text("Trie cache")');
  await waitCleared(2);
  ok(true, 'stage 2 cleared; xp=' + await xp());

  /* ---------- stage 3 ---------- */
  ok(await page.$eval('#run3', e => e.disabled), 'aggregator waits for the learner\'s count');
  await page.fill('#cnt3', '14000');
  await page.click('#cnt3go');
  ok(await hearts() === 1, 'wrong count costs a heart');
  ok((await page.textContent('#cnt3fb')).includes('next week'), 'boundary hint for 14000');
  await page.fill('#cnt3', '6');
  await page.click('#cnt3go');
  ok(await hearts() === 1, 'second wrong count is free');
  await page.fill('#cnt3', '12k');
  await page.click('#cnt3go');
  ok(await page.$eval('#s3goals [data-g="count"]', e => e.classList.contains('done')), 'count accepted (12k)');
  await page.click('#run3');
  await page.waitForFunction(() => document.querySelector('#s3goals [data-g="run"]').classList.contains('done'), null, { timeout: 20000 });
  const hl = await page.$eval('#agg3 tr.hl', e => e.textContent);
  ok(hl.includes('tree') && hl.includes('2019-10-01') && hl.includes('12000'), 'aggregated row matches: ' + hl);
  ok(await page.textContent('#bk3 td[data-c="0-0"]') === '12,000', 'bucket tree/wk1 = 12,000');
  for (const v of [2, 1, 0]) await setRange('#iv3', v);
  ok(await page.$eval('#s3goals [data-g="dial"]', e => e.classList.contains('done')), 'all four intervals tried');
  await page.click('#prod3 .pcard[data-i="0"] .opt[data-k="week"]');
  await page.click('#prod3 .pcard[data-i="1"] .opt[data-k="rt"]');
  await page.click('#prod3 .pcard[data-i="2"] .opt[data-k="week"]');
  await waitCleared(3);
  ok(true, 'stage 3 cleared; xp=' + await xp());

  /* ---------- stage 4 ---------- */
  await page.click('#trie4 [data-id="bee"]');
  await page.click('#insp4 .opt[data-o="e"]');
  ok(await hearts() === 0, 'letter-only key costs a heart');
  ok((await page.textContent('#insp4')).includes('isn\'t unique'), 'explains why the letter is not the key');
  await page.click('#insp4 .opt[data-o="bee"]');
  for (const id of ['b', 'be', 'best']) { await page.click(`#trie4 [data-id="${id}"]`); await page.click(`#insp4 .opt[data-o="${id}"]`); }
  await page.waitForSelector('#store4:not([style*="none"])', { timeout: 10000 });
  await page.waitForFunction(() => document.querySelectorAll('#kv4 tr').length === 7, null, { timeout: 10000 });
  const keys = await page.$$eval('#kv4 tr', a => a.map(r => r.dataset.k));
  ok(JSON.stringify(keys) === JSON.stringify(['b', 'be', 'bee', 'bes', 'bet', 'beer', 'best']), 'every row key = prefix: ' + keys.join(','));
  const beRow = await page.$eval('#kv4 tr[data-k="be"]', e => e.textContent);
  ok(beRow.includes('best:35') && beRow.indexOf('best:35') < beRow.indexOf('bet:29') && beRow.includes('beer:10'), 'be → [best:35, bet:29, bee:20, be:15, beer:10]');
  await page.locator('#s4').screenshot({ path: SP + '1303-s4.png' });
  await page.click('#sort4 .sort-item[data-i="0"] .opt[data-k="doc"]');
  await page.click('#sort4 .sort-item[data-i="1"] .opt[data-k="kv"]');
  await waitCleared(4);
  ok(true, 'stage 4 cleared; xp=' + await xp());

  /* ---------- stage 5 ---------- */
  for (const id of ['beer', 'bee', 'be', 'b', 'bet']) await page.click(`#trie5 [data-id="${id}"]`);
  await page.click('#done5');
  await page.waitForFunction(() => !document.querySelector('#done5').disabled, null, { timeout: 10000 });
  ok(await page.$eval('#cache5 .crow5[data-id=""]', e => e.classList.contains('stale')), 'forgotten root shows STALE');
  ok(await page.$eval('#cache5 .crow5[data-id="bet"]', e => e.classList.contains('waste')), 'off-path bet shows wasted');
  ok(await page.$eval('#swap5', e => e.style.display === 'none'), 'swap section waits for a correct patch');
  await page.locator('#s5 .sim').screenshot({ path: SP + '1303-s5-stale.png' });
  await page.click('#reset5');
  for (const id of ['beer', 'bee', 'be', 'b', '']) await page.click(`#trie5 [data-id="${id}"]`);
  await page.click('#done5');
  await page.waitForSelector('#swap5:not([style*="none"])', { timeout: 10000 });
  const beNow = await page.$eval('#cache5 .crow5[data-id="be"]', e => e.textContent);
  ok(beNow.indexOf('beer:30') > beNow.indexOf('best:35') && beNow.indexOf('beer:30') < beNow.indexOf('bet:29'), 'be re-ranked: best:35, beer:30, bet:29…');
  await page.click('#build5');
  await page.waitForSelector('#s5quiz .opt', { timeout: 15000 });
  ok(await page.$eval('#new5', e => e.classList.contains('live')) && !(await page.$eval('#old5', e => e.classList.contains('live'))), 'new trie swapped in as LIVE');
  const reads = await page.textContent('#reads5');
  ok(reads.includes('old trie') && reads.includes('best:35, beer:30, bet:29'), 'reads see old then new, never mixed');
  await page.click('#s5quiz .opt:has-text("Simpler")');
  await waitCleared(5);
  ok(true, 'stage 5 cleared; xp=' + await xp());

  /* ---------- stage 6 ---------- */
  for (const k of ['agg', 'short', 'ok', 'db', 'wait']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await waitCleared(6);
  ok(true, 'stage 6 cleared; xp=' + await xp());

  /* ---------- stage 7 ---------- */
  await page.fill('#drill textarea', 'The search goes into the analytics log, append only. Aggregators count it weekly into query week frequency. Workers build the trie into the trie DB, and the trie cache snapshots it weekly. Not live because writes slow reads and top k barely changes.');
  await page.click('#drill .q-reveal');
  for (const b of await page.$$('#drill .selfgrade input')) await b.check();
  await page.click('#drill .q-finish');
  await waitCleared(7);
  await page.waitForSelector('#victory.show', { timeout: 10000 });
  ok(true, 'victory card shown');
  const best = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).lessons['1303']);
  ok(best && best.xp > 0, 'lesson saved: ' + JSON.stringify(best));
  ok(await overflow() <= 1, 'no horizontal overflow at the end');
  await page.screenshot({ path: SP + '1303-375-dark.png', fullPage: true });
  await page.locator('#victory').screenshot({ path: SP + '1303-victory.png' });
  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await browser.close();
})();
