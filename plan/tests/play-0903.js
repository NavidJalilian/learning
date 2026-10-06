const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/0903-web-crawler-url-frontier.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(URL); await page.waitForTimeout(400);
  const hud = async () => page.evaluate(() => ({ xp: document.querySelector('.q-xp').textContent, hearts: document.querySelectorAll('.heart:not(.lost)').length, cleared: [...document.querySelectorAll('.stage.cleared')].map(s => s.dataset.stage).join(',') }));
  const opt = async (scope, text) => { const l = page.locator(`${scope} .opt:not([disabled])`, { hasText: text }).first(); await l.waitFor({ timeout: 10000 }); await l.click(); };
  const overflow = async () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

  /* stage 1 */
  await opt('#s1pred', 'Only 1 of them');
  await page.waitForSelector('#s1pred .explain.show', { timeout: 15000 });
  console.log('s1 after dfs: sites', await page.textContent('#s1sites'), 'deep', await page.textContent('#s1deep'));
  await page.locator('#s1 .web').screenshot({ path: SP + '0903-s1-dfs.png' });
  await page.waitForSelector('#bfsBtn:not([disabled])');
  await page.click('#bfsBtn');
  await page.waitForSelector('#s1quiz .opt', { timeout: 15000 });
  console.log('s1 after bfs: sites', await page.textContent('#s1sites'), 'deep', await page.textContent('#s1deep'), 'wiki meter', await page.textContent('#mets1 .met[data-h="wiki"] .v'));
  await page.locator('#s1 .web').screenshot({ path: SP + '0903-s1-bfs.png' });
  await opt('#s1quiz', 'A FIFO queue');
  await opt('#s1quiz', 'It bursts at one host');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());

  /* reload: resume */
  await page.reload(); await page.waitForTimeout(500);
  console.log('resume:', await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared') })), await hud());

  /* stage 2 */
  await page.click('#naiveBtn');
  await page.waitForSelector('#naiveBtn:not([disabled])', { timeout: 15000 });
  console.log('naive faces:', await page.evaluate(() => [...document.querySelectorAll('#hosts .hostc')].map(h => h.className + ':' + h.textContent.trim()).join(' | ')));
  await page.locator('#polSim').screenshot({ path: SP + '0903-s2-naive.png' });
  // wrong placement first
  await page.click('#tray2 .tile[data-t="B"]'); await page.click('#pipe .pslot[data-slot="A"]');
  console.log('wrong slot msg:', await page.textContent('#bmsg'));
  for (const k of ['A', 'B', 'C']) { await page.click(`#tray2 .tile[data-t="${k}"]`); await page.click(`#pipe .pslot[data-slot="${k}"]`); }
  const hosts = ['wiki', 'apple', 'nike', 'bbc'];
  for (let q = 0; q < 4; q++) { await page.click(`#hostChips .hchip[data-h="${hosts[q]}"]`); await page.click(`#mtab .mrow[data-q="${q}"]`); }
  console.log('map msg:', await page.textContent('#bmsg'));
  await page.click('#politeBtn');
  await page.waitForSelector('#politeBtn:not([disabled])', { timeout: 20000 });
  console.log('polite d=0 faces:', await page.evaluate(() => [...document.querySelectorAll('#hosts .hostc')].map(h => h.className).join(' | ')));
  await page.$eval('#delay', el => { el.value = '0.5'; el.dispatchEvent(new Event('input')); });
  await page.click('#politeBtn');
  await page.waitForSelector('#s2quiz .opt', { timeout: 20000 });
  console.log('polite d=0.5 faces:', await page.evaluate(() => [...document.querySelectorAll('#hosts .hostc')].map(h => h.className).join(' | ')), '| rate', await page.textContent('#p2rate'));
  await page.locator('#polSim').screenshot({ path: SP + '0903-s2-polite.png' });
  await opt('#s2quiz', 'Each host has one queue');
  await opt('#s2quiz', 'Which back queue each host');
  await opt('#s2quiz', 'To spread requests out');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());

  /* stage 3 */
  const pick = [1, 1, 3, 3, 1, 2, 2, 3];
  for (let i = 0; i < 8; i++) await page.click(`#pcards .pcard[data-i="${i}"] .opt[data-f="${pick[i]}"]`);
  await page.click('#pickBtn'); await page.waitForSelector('#pickBtn:not([disabled])', { timeout: 10000 });
  console.log('bias counts', await page.evaluate(() => [...document.querySelectorAll('#selq .cnt')].map(c => c.textContent).join(':')));
  await page.click('#selMode button[data-m="strict"]');
  await page.click('#pickBtn'); await page.waitForSelector('#s3quiz .opt', { timeout: 10000 });
  console.log('strict counts', await page.evaluate(() => [...document.querySelectorAll('#selq .cnt')].map(c => c.textContent).join(':')), 'starving', await page.locator('#selq .qcol.starve').count());
  await page.locator('#s3partB .sim').screenshot({ path: SP + '0903-s3-sel.png' });
  await opt('#s3quiz', 'So lower-priority queues');
  await opt('#s3quiz', 'PageRank and how often');
  await opt('#s3quiz', 'Picks a front queue at random');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* stage 4 */
  await page.click('#ttray4 .tile[data-k="lb"]');
  console.log('lb msg:', await page.textContent('#amsg'));
  for (const k of ['pri', 'fq', 'fs', 'br', 'mt', 'bq', 'bs', 'wt']) await page.click(`#ttray4 .tile[data-k="${k}"]`);
  console.log('asm msg:', await page.textContent('#amsg'));
  const ans = ['The front queues and their biased', 'wiki is inside its politeness pause', 'The router refills b3'];
  for (let guard = 0; guard < 30; guard++) {
    if (await page.locator('#s4quiz .opt').count()) break;
    const live = page.locator('#ask4 .opt:not([disabled])');
    if (await live.count()) {
      const q = await page.textContent('#ask4 .q');
      const a = q.includes('apple.com/') ? ans[0] : q.includes('wiki/Crawler') ? ans[1] : ans[2];
      if (a === ans[1]) await page.locator('#s4 .sim').last().screenshot({ path: SP + '0903-s4-run.png' });
      await opt('#ask4', a); continue;
    }
    if (await page.isEnabled('#next4')) await page.click('#next4');
    await page.waitForTimeout(150);
  }
  await opt('#s4quiz', 'The back queues');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());

  /* stage 5 */
  const rowBtn = async (i, d, n) => { for (let k = 0; k < n; k++) await page.click(`#frows .frow[data-i="${i}"] .btn[data-d="${d}"]`); };
  await rowBtn(5, -1, 3); await rowBtn(4, -1, 2); await rowBtn(3, -1, 2); await rowBtn(2, -1, 1);
  await rowBtn(0, 1, 6); await rowBtn(1, 1, 2);
  console.log('fresh:', await page.textContent('#fScore'), await page.textContent('#fPct'), await page.textContent('#fBudget'));
  await page.locator('#frows').screenshot({ path: SP + '0903-s5-fresh.png' });
  for (const k of ['ram', 'disk', 'hyb']) {
    await page.click(`.store button[data-k="${k}"]`);
    await page.waitForSelector(`.store button[data-k="${k}"]:not([disabled])`, { timeout: 10000 });
  }
  console.log('store table:', await page.evaluate(() => [...document.querySelectorAll('#rtab tr')].map(r => r.textContent.trim().replace(/\s+/g, ' ')).join(' | ')));
  await page.locator('.store').screenshot({ path: SP + '0903-s5-store.png' });
  await opt('#s5quiz', 'Use update history');
  await opt('#s5quiz', 'too big, and a crash');
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* stage 6 */
  for (const k of ['back', 'front', 'fresh', 'store', 'back', 'front', 'fresh', 'store']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForSelector('#s6.cleared', { timeout: 5000 });
  console.log('after s6', await hud());

  /* stage 7 */
  await page.fill('#drill textarea', 'BFS beats DFS because the web is too deep, but plain BFS hammers one host and has no priority. Front queues with a biased selector for priority, back queues with host to queue mapping, one worker per queue and a pause. Recrawl by update history, disk plus memory buffers.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY', await page.textContent('#victory h2'), await hud(), 'overflow', await overflow());
  console.log('errors:', errs.length ? errs : 'none');
  await page.screenshot({ path: SP + '0903-victory.png' });

  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  await p2.goto(URL); await p2.waitForTimeout(500);
  await p2.screenshot({ path: SP + '0903-375-dark.png', fullPage: true });
  const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p3.goto(URL); await p3.waitForTimeout(500);
  await p3.screenshot({ path: SP + '0903-1280-light.png', fullPage: true });
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
