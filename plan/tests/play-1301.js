const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1301-autocomplete-scope-and-estimation.html';
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
  const xp = () => page.evaluate(() => (JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['1301']?.xp ?? null);
  const cleared = n => page.$eval('#s' + n, e => e.classList.contains('cleared'));
  const waitCleared = n => page.waitForFunction(k => document.querySelector('#s' + k).classList.contains('cleared'), n, { timeout: 30000 });
  const ok = (c, m) => { if (!c) { console.log('FAIL:', m); process.exitCode = 1; } else console.log('ok  ', m); };
  const setRange = (sel, v) => page.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);

  /* ---------- stage 1 ---------- */
  ok(await page.$eval('#s1q', e => e.disabled), 'search box starts disabled');
  await page.click('#s1cards .qcard[data-k="font"]');
  ok(await hearts() === 2, 'time-waster question costs a heart');
  ok((await page.textContent('#s1face')).includes('🤨'), 'interviewer raises an eyebrow');
  for (const k of ['match', 'count', 'rank', 'spell', 'lang', 'chars', 'users']) await page.click(`#s1cards .qcard[data-k="${k}"]`);
  ok(await page.$$eval('#s1pins .pin.on', a => a.length) === 7, '7 pins on the board');
  ok(!(await page.$eval('#s1q', e => e.disabled)), 'search box comes alive');
  await page.locator('#s1').screenshot({ path: SP + '1301-s1-board.png' });
  await page.click('#s1q');
  await page.keyboard.type('tw', { delay: 80 });
  const drop = await page.$$eval('#s1drop li', a => a.map(x => x.textContent));
  ok(JSON.stringify(drop) === JSON.stringify(['twitter', 'twitch', 'twilight', 'twin peak', 'twitch prime']), 'tw shows the book\'s top 5: ' + drop.join(', '));
  const reqs = await page.$$eval('#s1log div', a => a.map(x => x.textContent).filter(t => t.startsWith('GET')));
  ok(reqs.length === 2 && reqs[1].includes('q=tw'), 'request log shows one line per keystroke');
  await page.waitForSelector('#s1quiz .opt');
  await page.click('#s1quiz .opt:has-text("No, a match must start")');
  await page.waitForSelector('#s1quiz .quiz:nth-child(2) .opt');
  await page.click('#s1quiz .quiz:nth-child(2) .opt:has-text("How often each query")');
  await page.waitForSelector('#s1quiz .quiz:nth-child(3) .opt');
  await page.click('#s1quiz .quiz:nth-child(3) .opt:has-text("Treats it as a prefix")');
  await waitCleared(1);
  ok(true, 'stage 1 cleared; xp=' + await xp());
  await page.locator('#s1').screenshot({ path: SP + '1301-s1.png' });

  /* ---------- reload mid-quest ---------- */
  await page.reload();
  await page.waitForSelector('.banner.resume');
  ok(await cleared(1) && await hearts() === 2, 'resume after reload keeps stage 1 + hearts');

  /* ---------- stage 2 ---------- */
  await page.click('#pred2 .opt:has-text("100 ms")');
  await page.waitForSelector('#pred2 .explain.show', { timeout: 15000 });
  ok(await page.$eval('#pred2 .explain', e => e.classList.contains('good')), 'prediction 100 ms is right');
  ok(await page.$eval('#s2goals [data-g="fast"]', e => e.classList.contains('done')), 'fast goal from the prediction play');
  await setRange('#lat2', 4);
  await page.click('#play2');
  await page.waitForTimeout(1800);
  ok(await page.$('#g2wrap .stag') !== null, 'stale tag visible mid-play at 300 ms');
  await page.locator('#s2 .sim').screenshot({ path: SP + '1301-s2-stale.png' });
  await page.waitForFunction(() => document.querySelector('#s2goals [data-g="slow"]').classList.contains('done'), null, { timeout: 15000 });
  ok(true, 'slow goal done');
  // one wrong match first
  await page.click('#qchips2 .qchip[data-k="fast"]');
  await page.click('#defs2 .defrow[data-k="ha"] .slot');
  ok(await hearts() === 1, 'wrong match costs a heart');
  ok(await page.$('#qchips2 .qchip[data-k="fast"]') !== null, 'wrong chip bounces back');
  for (const k of ['fast', 'rel', 'sort', 'scale', 'ha']) {
    await page.click(`#qchips2 .qchip[data-k="${k}"]`);
    await page.click(`#defs2 .defrow[data-k="${k}"] .slot`);
  }
  await waitCleared(2);
  ok(true, 'stage 2 cleared; xp=' + await xp());

  /* ---------- stage 3 ---------- */
  await page.locator('#din3').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#din3n').textContent === '6', null, { timeout: 8000 });
  ok(true, 'dinner animation sends 6 requests');
  await page.locator('#s2 .tl').screenshot({ path: SP + '1301-s2-tl.png' });
  await page.locator('#s3 .din').screenshot({ path: SP + '1301-s3-din.png' });
  const fill = async (k, v) => { await page.fill(`#sheet3 .crow[data-k="${k}"] input`, v); await page.click(`#sheet3 .crow[data-k="${k}"] .btn.primary`); };
  await page.click('#sheet3 .crow[data-k="b"] .hb');
  ok((await page.textContent('#sheet3 .crow[data-k="b"] .hint')).includes('86,400'), 'hint shows the formula');
  await fill('a', '20');
  await fill('b', '1157');
  ok((await page.textContent('#sheet3 .crow[data-k="b"] .fb')).includes('× 20'), 'forgot-x20 diagnosis');
  ok(await hearts() === 0, 'first wrong on a row costs a heart');
  await fill('b', '1,200');
  ok(await hearts() === 0, 'second miss free (and hearts floor at 0)');
  await fill('b', '24,000');
  await fill('c', '48k');
  await fill('d', '400 MB');
  ok(await page.isVisible('#sum3'), 'summary card shown');
  await waitCleared(3);
  ok(true, 'stage 3 cleared; xp=' + await xp());
  await page.locator('#s3').screenshot({ path: SP + '1301-s3.png' });

  /* ---------- stage 4 ---------- */
  for (let i = 0; i < 4; i++) await page.click('#g4send');
  const gt = await page.$$eval('#g4tab tbody tr', a => a.map(r => r.textContent.trim().replace(/\s+/g, ' ')));
  ok(JSON.stringify(gt) === JSON.stringify(['twitch1', 'twitter2', 'twillo1']), 'gathering table: ' + gt.join(' | '));
  await page.click('#q4run');
  await page.waitForFunction(() => document.querySelector('#s4goals [data-g="query"]').classList.contains('done'), null, { timeout: 8000 });
  const top = await page.$$eval('#q4tab tr.top td:first-child', a => a.map(x => x.textContent));
  ok(JSON.stringify(top) === JSON.stringify(['twitter', 'twitch', 'twilight', 'twin peak', 'twitch prime']), 'query top 5: ' + top.join(', '));
  ok(await page.$eval('#rows4', e => e.disabled), 'sliders wait for the prediction');
  await page.click('#pred4 .opt:has-text("Both: rows")');
  await page.waitForSelector('#pred4 .explain.show');
  ok((await page.textContent('#status4')).includes('Both'), 'max sliders show both failing');
  await page.locator('#s4 .scale').screenshot({ path: SP + '1301-s4-scale.png' });
  await setRange('#qps4', 0); await setRange('#rows4', 3);
  ok(await page.$eval('#s4goals [data-g="rows"]', e => e.classList.contains('done')), 'rows-alone goal');
  await setRange('#rows4', 1); await setRange('#qps4', 3);
  ok(await page.$eval('#s4goals [data-g="traffic"]', e => e.classList.contains('done')), 'traffic-alone goal');
  await page.waitForSelector('#s4quiz .opt');
  await page.click('#s4quiz .opt:text-is("LIMIT 5")');
  await page.waitForSelector('#s4quiz .quiz:nth-child(2) .opt');
  await page.click(`#s4quiz .quiz:nth-child(2) .opt:text-is("WHERE query LIKE 'tw%'")`);
  await waitCleared(4);
  ok(true, 'stage 4 cleared; xp=' + await xp());
  await page.locator('#s4 .two').screenshot({ path: SP + '1301-s4-tables.png' });

  /* ---------- stage 5 ---------- */
  for (const a of ['park', 'char', '48', 'slow', '0.4']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    ok(await page.$eval('#boss .explain', e => e.classList.contains('good')), 'boss answer ' + a);
    await page.click('#boss .row .btn.primary');
  }
  await waitCleared(5);
  ok(true, 'stage 5 cleared');

  /* ---------- stage 6 ---------- */
  await page.fill('#drill textarea', 'Prefix only, top 5 by historical frequency, no spell check, English lowercase, 10M DAU, 100 ms. 24k QPS, 48k peak, 0.4 GB a day. Data gathering + query service, SQL LIKE breaks at scale.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show');
  ok(true, 'victory card shown');
  const store = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')));
  console.log('   saved lesson:', JSON.stringify(store.lessons['1301']));
  ok(!store.runs['1301'], 'run cleared after finish');
  const of = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(of <= 1, 'no horizontal overflow at 375 (' + of + ')');
  await page.screenshot({ path: SP + '1301-375-dark.png', fullPage: true });
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
  await browser.close();
})();
