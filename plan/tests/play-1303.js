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
  await page.waitForTimeout(400);
  const hud = async () => page.evaluate(() => ({ xp: document.querySelector('.q-xp').textContent, hearts: document.querySelectorAll('.heart:not(.lost)').length, cleared: [...document.querySelectorAll('.stage.cleared')].map(s => s.dataset.stage).join(',') }));
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };

  /* ---- stage 1 ---- */
  await clickOpt('#s1pred', 'blows well past');
  await page.waitForSelector('#s1pred .explain.show', { timeout: 20000 });
  console.log('s1 live lat:', await page.textContent('#latVal'), '|', await page.textContent('#s1stats'));
  await page.screenshot({ path: SP + '1303-s1-live.png' });
  await page.click('#modeSeg button[data-m="batch"]');
  await page.click('#s1play');
  await page.waitForSelector('#s1goals [data-g="batch"].done', { timeout: 20000 });
  console.log('s1 batch lat:', await page.textContent('#latVal'), '|', await page.textContent('#s1stats'));
  await page.click('#diffBtn');
  await page.waitForSelector('#s1quiz .opt', { timeout: 5000 });
  await clickOpt('#s1quiz', 'Writes at that volume');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());

  /* ---- stage 2 ---- */
  await page.click('#tiles .tile[data-id="workers"]');
  console.log('wrong tap hint:', await page.textContent('#pipeHint'));
  for (const id of ['logs', 'aggr', 'agdata', 'workers', 'db', 'cache']) { await page.click(`#tiles .tile[data-id="${id}"]`); await page.waitForTimeout(100); }
  console.log('pipe hint:', await page.textContent('#pipeHint'));
  await page.click('#flowBtn');
  await page.waitForSelector('#s2quiz .opt', { timeout: 15000 });
  await page.locator('#s2 .pipe').screenshot({ path: SP + '1303-pipe.png' });
  await clickOpt('#s2quiz', 'The Trie Cache');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());

  /* ---- reload mid-quest: resume ---- */
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), s2: document.querySelector('#s2').classList.contains('cleared'), text: (document.querySelector('.banner') || {}).textContent }));
  console.log('resume:', JSON.stringify(resume), await hud());

  /* ---- stage 3 ---- */
  await clickOpt('#s3pred', '6,000');
  await page.waitForSelector('#s3pred .explain.show', { timeout: 20000 });
  console.log('agg status:', await page.textContent('#aggStatus'));
  console.log('agg tree wk1 row:', await page.textContent('#aggtable tr.hl'));
  for (const v of ['0', '3']) await page.evaluate(v => { const s = document.querySelector('#ivSlider'); s.value = v; s.dispatchEvent(new Event('input')); }, v);
  const items = page.locator('#ivSort .sort-item');
  await items.nth(0).locator('.opt[data-k="wk"]').click();
  await items.nth(1).locator('.opt[data-k="rt"]').click();
  await items.nth(2).locator('.opt[data-k="wk"]').click();
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* ---- stage 4 ---- */
  await page.locator('#s4svg').scrollIntoViewIfNeeded();
  // real drag of node "b" into the table
  const nb = await page.locator('#s4svg g.nd[data-id="b"]').boundingBox();
  const dz = await page.locator('#kvDrop').boundingBox();
  await page.mouse.move(nb.x + nb.width / 2, nb.y + nb.height / 2);
  await page.mouse.down();
  await page.mouse.move(nb.x + 40, nb.y + 60, { steps: 5 });
  await page.mouse.move(dz.x + dz.width / 2, dz.y + 30, { steps: 8 });
  await page.mouse.up();
  await page.waitForSelector('#kvRows .kvrow .opt');
  await page.click('#kvRows .kvrow .opt[data-o="b"]');
  await page.waitForTimeout(800);
  // taps for the others; deliberately wrong key on "bee"
  const order = [['be', 'be'], ['bee', 'e'], ['beer', 'beer']];
  for (const [p, pick] of order) {
    await page.locator(`#s4svg g.nd[data-id="${p}"]`).click();
    await page.waitForSelector(`#kvRows .kvrow .opt[data-o="${pick}"]`);
    await page.click(`#kvRows .kvrow .opt[data-o="${pick}"]`);
    await page.waitForTimeout(800);
  }
  await page.waitForSelector('#storeSort .sort-item', { timeout: 8000 });
  const keys = await page.$$eval('#kvRows .kvrow .k', a => a.map(x => x.textContent));
  console.log('kv keys:', keys.join(','));
  await page.locator('#s4 .sim').screenshot({ path: SP + '1303-kv.png' });
  const st = page.locator('#storeSort .sort-item');
  await st.nth(0).locator('.opt[data-k="doc"]').click();
  await st.nth(1).locator('.opt[data-k="kv"]').click();
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());

  /* ---- stage 5 ---- */
  // wrong attempt: only beer + an off-path node
  await page.click('#cacheList .crow[data-id="beer"]');
  await page.click('#cacheList .crow[data-id="bet"]');
  await page.click('#patchDone');
  await page.waitForFunction(() => !document.querySelector('#patchDone') || [...document.querySelectorAll('#s5log div')].some(d => /try again/.test(d.textContent)), null, { timeout: 15000 });
  console.log('s5 fail log:', await page.evaluate(() => [...document.querySelectorAll('#s5log div')].slice(-6).map(d => d.textContent).join(' || ')));
  await page.locator('#s5 .sim.trie').screenshot({ path: SP + '1303-patch-fail.png' });
  // toggling auto-resets; then mark the right set
  for (const id of ['root', 'b', 'be', 'bee', 'beer']) await page.click(`#cacheList .crow[data-id="${id}"]`);
  console.log('marked:', await page.textContent('#patchCount'));
  await page.click('#patchDone');
  await page.waitForSelector('#s5goals [data-g="patch"].done', { timeout: 15000 });
  console.log('s5 ok log:', await page.evaluate(() => [...document.querySelectorAll('#s5log div')].slice(-2).map(d => d.textContent).join(' || ')));
  await page.click('#buildBtn');
  await page.waitForSelector('#s5goals [data-g="swap"].done', { timeout: 15000 });
  console.log('swap:', await page.textContent('#swReads'), await page.textContent('#swMem'));
  await page.waitForSelector('#s5quiz .opt', { timeout: 5000 });
  await clickOpt('#s5quiz', 'It is simpler');
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* ---- stage 6 ---- */
  for (const k of ['agg', 'short', 'dbc', 'db', 'wait']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForSelector('#s6.cleared', { timeout: 5000 });
  console.log('after s6', await hud());

  /* ---- stage 7 ---- */
  await page.fill('#drill textarea', 'The search is appended to the analytics log; aggregators roll it up weekly into query week frequency; workers build the trie and save to Trie DB; Trie Cache snapshots weekly; not real-time due to write volume.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY', await page.textContent('#victory h2'), await hud());

  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  p2.on('pageerror', e => errs.push('p2 pageerror: ' + e.message));
  await p2.goto(URL); await p2.waitForTimeout(500);
  await p2.screenshot({ path: SP + '1303-375-dark.png', fullPage: true });
  const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p3.goto(URL); await p3.waitForTimeout(500);
  await p3.screenshot({ path: SP + '1303-1280-light.png', fullPage: true });
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close();
})();
