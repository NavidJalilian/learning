const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/0204-twitter-qps-storage.html';
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
  const xp = () => page.evaluate(() => (JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['0204']?.xp ?? null);
  const cleared = n => page.$eval('#s' + n, e => e.classList.contains('cleared'));
  const ok = (c, m) => { if (!c) { console.log('FAIL:', m); process.exitCode = 1; } else console.log('ok  ', m); };

  /* stage 1 */
  await page.click('#deck .acard[data-k="scala"]');
  ok(await hearts() === 2, 'distractor costs a heart');
  for (const k of ['mau', 'daily', 'tw', 'media', 'keep']) await page.click(`#deck .acard[data-k="${k}"]`);
  ok(await page.$$eval('#slots .note', a => a.length) === 5, '5 notes pinned');
  await page.waitForSelector('#s1quiz .opt');
  ok(await page.isVisible('#s1ok'), 'interviewer replied');
  await page.click('#s1quiz .opt:has-text("So you both can check")');
  await page.waitForFunction(() => document.querySelector('#s1').classList.contains('cleared'));
  ok(true, 'stage 1 cleared');
  console.log('   xp after s1', await xp());

  /* reload mid-quest */
  await page.reload();
  await page.waitForSelector('.banner.resume');
  ok(await cleared(1) && await hearts() === 2, 'resume after reload keeps stage 1 + hearts');

  /* stage 2 */
  const rows2 = '#qpsChain .crow';
  const fillRow = async (sel, i, val) => { const r = (await page.$$(sel))[i]; await (await r.$('input')).fill(val); await (await r.$('button')).click(); };
  await fillRow(rows2, 0, '300');
  ok(await hearts() === 1, 'wrong DAU costs a heart');
  await fillRow(rows2, 0, '300');
  ok(await hearts() === 1, 'second miss on same row is free');
  await fillRow(rows2, 0, '150 million');
  await fillRow(rows2, 1, '300m');
  await fillRow(rows2, 2, '34,722');
  ok(await hearts() === 1, 'zeros slip is soft (no heart)');
  await fillRow(rows2, 2, '3,472.22');
  ok(await page.isVisible('#qpsChain .pchip'), 'precision chip shown');
  await fillRow(rows2, 3, '7000');
  await page.waitForSelector('#s2quiz .opt');
  ok(await page.isVisible('#daySim'), 'day chart shown');
  await page.click('#s2quiz .opt:has-text("busiest moments")');
  await page.waitForFunction(() => document.querySelector('#s2').classList.contains('cleared'));
  ok(true, 'stage 2 cleared');

  /* stage 3 */
  await page.click('#s3predict .opt:has-text("Media:")');
  await page.waitForSelector('#s3work', { state: 'visible' });
  const rows3 = '#dayChain .crow';
  await fillRow(rows3, 0, '61 GB');
  await fillRow(rows3, 1, '30000 TB');
  ok(await hearts() === 1, 'unit slip is soft');
  ok((await page.$eval('#dayChain .crow:nth-child(2) .fb', e => e.textContent)).includes('wrong unit'), 'unit slip message');
  await fillRow(rows3, 1, '30');
  await page.waitForSelector('#s3years', { state: 'visible' });
  await fillRow('#yearChain .crow', 0, '54,750 TB');
  await page.waitForSelector('#s3quiz .opt');
  ok(await page.$$eval('#yearGrid rect.on', a => a.length) === 1825, 'year grid filled (1825 days)');
  await page.click('#s3quiz .opt >> text="55 PB"');
  await page.waitForFunction(() => document.querySelector('#s3').classList.contains('cleared'));
  ok(true, 'stage 3 cleared');

  /* stage 4 */
  const press = async (id, key, n) => { await page.focus(id); for (let i = 0; i < n; i++) await page.keyboard.press(key); };
  await press('#kn-repl', 'ArrowRight', 2);
  ok(await page.$eval('#s4goals [data-g="rep"]', e => e.classList.contains('done')), 'goal: 165 PB via replication');
  console.log('   total:', await page.$eval('.out[data-o="total"] .v', e => e.textContent));
  await page.click('#calcReset');
  await press('#kn-daily', 'ArrowRight', 10);
  ok(await page.$eval('#s4goals [data-g="dbl"]', e => e.classList.contains('done')), 'goal: double QPS with one slider');
  console.log('   qps:', await page.$eval('.out[data-o="qps"] .v', e => e.textContent));
  await page.click('#calcReset');
  await press('#kn-peak', 'ArrowRight', 1);
  ok(await page.$eval('#s4goals [data-g="peak"]', e => e.classList.contains('done')), 'goal: peak without storage');
  await page.waitForSelector('#s4quiz .opt');
  await page.click('#s4quiz .opt >> text="About 165 PB"');
  await page.waitForFunction(() => document.querySelector('#s4').classList.contains('cleared'));
  ok(true, 'stage 4 cleared');

  /* stage 5 */
  for (const a of ['x2', 'same', 'half', 'x2', 'same', 'x10', 'x2']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    ok(await page.$eval('#boss .explain', e => e.classList.contains('good')), 'boss answer ' + a);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForFunction(() => document.querySelector('#s5').classList.contains('cleared'));
  ok(true, 'stage 5 cleared');

  /* screenshot before the drill (sections visible) */
  await page.locator('#s3').screenshot({ path: SP + 'q0204-s3-375-dark.png' });
  await page.locator('#s4').screenshot({ path: SP + 'q0204-s4-375-dark.png' });
  await page.locator('#s2').screenshot({ path: SP + 'q0204-s2-375-dark.png' });
  await page.locator('#s1').screenshot({ path: SP + 'q0204-s1-375-dark.png' });

  /* stage 6 */
  await page.fill('#drill textarea', 'Assumptions first: 300 million MAU, half daily, two tweets each, ten percent media at one MB, five years. That is about 3,500 QPS and 7,000 peak, 30 TB a day and 55 PB.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show');
  ok(true, 'victory card shown');
  const store = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')));
  console.log('   saved lesson:', JSON.stringify(store.lessons['0204']));
  ok(!store.runs['0204'], 'run cleared after finish');
  const of = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(of <= 1, 'no horizontal overflow at 375 (' + of + ')');
  await page.locator('#victory').screenshot({ path: SP + 'q0204-victory.png' });
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
  await browser.close();
})();
