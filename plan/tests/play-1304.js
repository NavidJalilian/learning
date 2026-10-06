const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1304-query-service.html';
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
  const xp = () => page.evaluate(() => (JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['1304']?.xp ?? null);
  const cleared = n => page.$eval('#s' + n, e => e.classList.contains('cleared'));
  const waitCleared = n => page.waitForFunction(k => document.querySelector('#s' + k).classList.contains('cleared'), n, { timeout: 30000 });
  const goal = (st, g) => page.$eval(`#s${st}goals [data-g="${g}"]`, e => e.classList.contains('done'));
  const ok = (c, m) => { if (!c) { console.log('FAIL:', m); process.exitCode = 1; } else console.log('ok  ', m); };
  const setRange = (sel, v) => page.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  const tapPath = async ks => { for (const k of ks) await page.click(`#rp1 .nd[data-k="${k}"]`); };
  const runWait = async () => { const n = await page.$$eval('#strip1 .srow', a => a.length); await page.click('#run1'); await page.waitForFunction(k => document.querySelectorAll('#strip1 .srow').length > k || document.querySelectorAll('#strip1 .srow').length === 4, n, { timeout: 15000 }); await page.waitForFunction(() => !document.querySelector('#run1').disabled); };

  /* ---------- stage 1 ---------- */
  await page.click('#run1');
  ok((await page.textContent('#log1')).includes('Predict first'), 'run without prediction nudges');
  await tapPath(['lb', 'api', 'cache']);
  // keyboard on an svg node
  await page.focus('#rp1 .nd[data-k="db"]'); await page.keyboard.press('Enter');
  ok((await page.textContent('#pline1')).includes('DB'), 'keyboard Enter adds a node');
  await page.click('#undo1');
  await runWait();
  ok(await goal(1, 'hit'), 'warm cache run = hit');
  ok(await hearts() === 3, 'correct hit prediction keeps hearts');
  ok((await page.$$eval('#drop1 li', a => a.map(x => x.textContent)))[0] === 'twitter', 'dropdown shows twitter first');
  await page.click('#restart1');
  ok((await page.textContent('#cbox1')).includes('nothing'), 'restart empties cache');
  // wrong prediction for the miss: stop at DB
  await tapPath(['lb', 'api', 'cache', 'db']);
  await runWait();
  ok(await goal(1, 'miss'), 'miss after restart');
  ok(await hearts() === 2, 'wrong miss prediction costs a heart');
  ok((await page.textContent('#cbox1')).includes('tw'), 'cache replenished with tw');
  await page.locator('#s1 .sim').screenshot({ path: SP + '1304-s1-375-dark.png' });
  await tapPath(['lb', 'api', 'cache']);
  await runWait();
  ok(await goal(1, 'again'), 'same prefix again = hit');
  const strip = await page.$$eval('#strip1 .srow', a => a.map(x => x.textContent));
  ok(strip.length === 3 && strip[1].includes('miss') && strip[2].includes('hit'), 'latency strip: ' + strip.join(' | '));
  await page.waitForSelector('#s1quiz .opt');
  await page.click('#s1quiz .opt:has-text("Only when the Trie Cache misses")');
  await waitCleared(1);
  ok(true, 'stage 1 cleared; xp=' + await xp());

  /* ---------- reload mid-quest ---------- */
  await page.reload();
  await page.waitForSelector('.banner.resume');
  ok(await cleared(1) && await hearts() === 2, 'resume after reload keeps stage 1 + hearts');

  /* ---------- stage 2 ---------- */
  await page.click('#mkGo');
  ok(await goal(2, 'ajax'), 'ajax demo goal');
  await page.click('#q2');
  await page.keyboard.type('dinner', { delay: 40 });
  ok(await page.textContent('#srv2') === '6', '6 server requests on first pass');
  ok(await goal(2, 'first'), 'first-pass goal');
  for (let i = 0; i < 3; i++) await page.keyboard.press('Backspace');
  ok(await page.inputValue('#q2') === 'din', 'backspaced to din');
  await page.keyboard.type('ner', { delay: 40 });
  ok(await page.textContent('#srv2') === '6', 'still 6 after retype');
  ok(await goal(2, 'second'), 'retype goal');
  await page.click('#ff2');
  await page.click('#q2'); await page.keyboard.press('Backspace');
  ok(await page.textContent('#srv2') === '7', 'after fast-forward, a keystroke goes to the network');
  ok(await goal(2, 'expire'), 'expire goal');
  await page.click('#pub2');
  ok((await page.textContent('#hdr2')).includes('public'), 'header shows public');
  await page.locator('#s2 .px').screenshot({ path: SP + '1304-s2-375-dark.png' });
  await page.click('#pvt2');
  ok(await goal(2, 'proxy'), 'proxy goal');
  await page.waitForSelector('#s2quiz .opt');
  await page.click('#s2quiz .opt:has-text("Reuse this answer for up to 1 hour")');
  await page.waitForSelector('#s2quiz .quiz:nth-child(2) .opt');
  await page.click('#s2quiz .quiz:nth-child(2) .opt:has-text("Only the user")');
  await page.waitForSelector('#s2quiz .quiz:nth-child(3) .opt');
  await page.click('#s2quiz .quiz:nth-child(3) .opt:text-is("0")');
  await waitCleared(2);
  ok(true, 'stage 2 cleared; xp=' + await xp());
  await page.locator('#s2 .dev').screenshot({ path: SP + '1304-s2.png' });

  /* ---------- stage 4 (out of order on purpose) ---------- */
  await page.click('#s4 .chipbar .btn[data-p="w"]');
  ok(await page.$$eval('#drop4 li.harm', a => a.length) === 2, 'w shows 2 harmful placeholders');
  await page.click('#rules4 .rule[data-c="violent"]');
  await page.click('#rules4 .rule[data-c="explicit"]');
  ok(await page.$$eval('#drop4 li.harm', a => a.length) === 0, 'w clean after rules');
  ok((await page.textContent('#drop4')).includes('showing 3 of 5'), 'shows 3 of 5 note');
  await page.click('#s4 .chipbar .btn[data-p="din"]');
  ok(await page.$$eval('#drop4 li.harm', a => a.length) === 2, 'din still has 2 harmful');
  await page.click('#rules4 .rule[data-c="dangerous"]');
  await page.click('#rules4 .rule[data-c="hateful"]');
  ok(await goal(4, 'clean'), 'clean goal');
  for (const p of ['filter', 'purge', 'both']) {
    await page.click(`.whatif [data-plan="${p}"]`);
    await page.waitForFunction(() => document.querySelector('#wv4').textContent.length > 10 && !document.querySelector('.whatif [data-plan]').disabled, null, { timeout: 8000 });
  }
  ok(await goal(4, 'plans'), 'plans goal');
  await page.locator('#s4 .whatif').screenshot({ path: SP + '1304-s4.png' });
  await page.waitForSelector('#pick4 .opt');
  await page.click('#pick4 .opt:has-text("Both: filter now")');
  await page.waitForSelector('#s4quiz .opt');
  await page.click('#s4quiz .opt:has-text("The filter acts now")');
  await waitCleared(4);
  ok(true, 'stage 4 cleared; xp=' + await xp());
  await page.locator('#s4 .fl').screenshot({ path: SP + '1304-s4-fl.png' });

  /* ---------- stage 3 ---------- */
  ok(await page.$eval('#n3', e => e.disabled), 'slider waits for prediction');
  await page.click('#pred3 .opt:has-text("Top 5 holds")');
  await page.waitForSelector('#pred3 .explain.show');
  ok(await page.$eval('#pred3 .explain', e => e.classList.contains('good')), 'prediction right');
  console.log('   N=100 verdict:', await page.textContent('#ver3'));
  await setRange('#n3', 3);
  ok(await goal(3, 'big'), 'N=1000 goal');
  ok(await page.textContent('#rows3') === '100,000', 'N=1000 → 100,000 rows/day');
  console.log('   N=1000 verdict:', await page.textContent('#ver3'));
  await page.click('#re3'); await page.click('#re3');
  ok(await goal(3, 'dice'), 'resample goal');
  await page.locator('#s3 .smp').screenshot({ path: SP + '1304-s3.png' });
  await page.fill('#calc3 input', '100,000,000'); await page.click('#calc3 .btn.primary');
  ok((await page.textContent('#calc3 .fb')).includes('every search'), 'diagnosis for N=1 answer');
  const h = await hearts();
  await page.fill('#calc3 input', '10M'); await page.click('#calc3 .btn.primary');
  ok(await goal(3, 'calc'), 'calc goal');
  await waitCleared(3);
  ok(true, 'stage 3 cleared; xp=' + await xp() + ' hearts=' + h);

  /* ---------- stage 5 ---------- */
  for (const a of ['warm', 'cache', 'sample', 'both', 'priv']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    ok(await page.$eval('#boss .explain', e => e.classList.contains('good')), 'boss answer ' + a);
    await page.click('#boss .row .btn.primary');
  }
  await waitCleared(5);
  ok(true, 'stage 5 cleared');

  /* ---------- stage 6 ---------- */
  await page.fill('#drill textarea', 'AJAX request to the load balancer, API servers read Trie Cache, miss goes to Trie DB and replenishes. Cache-Control private max-age 3600, sample 1 in N, filter layer plus async delete.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show');
  ok(true, 'victory card shown');
  const store = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')));
  console.log('   saved lesson:', JSON.stringify(store.lessons['1304']));
  ok(!store.runs['1304'], 'run cleared after finish');
  const of = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(of <= 1, 'no horizontal overflow at 375 (' + of + ')');
  await page.screenshot({ path: SP + '1304-375-dark.png', fullPage: true });
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));

  /* desktop light shots */
  const c2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const p2 = await c2.newPage();
  await p2.goto(URL);
  await p2.locator('#s1 .sim').screenshot({ path: SP + '1304-s1-1280-light.png' });
  await p2.locator('#s2 .ajx').screenshot({ path: SP + '1304-s2-1280-light.png' });
  await browser.close();
})();
