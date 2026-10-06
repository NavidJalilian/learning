const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1401-youtube-scope-and-estimate.html';
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
  const xp = () => page.evaluate(() => (JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['1401']?.xp ?? null);
  const cleared = n => page.$eval('#s' + n, e => e.classList.contains('cleared'));
  const waitCleared = n => page.waitForFunction(k => document.querySelector('#s' + k).classList.contains('cleared'), n, { timeout: 30000 });
  const ok = (c, m) => { if (!c) { console.log('FAIL:', m); process.exitCode = 1; } else console.log('ok  ', m); };
  const setRange = (sel, v) => page.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  const quizClick = async (mount, text) => { await page.waitForSelector(`${mount} .opt`, { timeout: 15000 }); await page.click(`${mount} .opt:has-text("${text}")`); };

  /* ---------- stage 1 ---------- */
  // slider positions: true value for cards 0-5, way off for card 6 (languages)
  const G = [[2e9, 1e6, 1e10], [5e9, 1e7, 1e11], [73], [5e7, 1e5, 1e9], [15.1e9, 1e7, 1e12], [37], [80, 1, 1000]];
  for (let i = 0; i < G.length; i++) {
    const [v, mn, mx] = G[i];
    let t = mn === undefined ? v * 10 : Math.round(1000 * Math.log(v / mn) / Math.log(mx / mn));
    if (i === 6) t = 1000;
    await setRange('#gslide', t);
    if (i === 0) ok((await page.textContent('#gval')).includes('billion'), 'card 1 shows guess in words: ' + await page.textContent('#gval'));
    await page.click('#glock');
    const msg = await page.textContent('#gmsg');
    ok(i === 6 ? msg.startsWith('Way off') : msg.startsWith('✓'), `card ${i + 1}: ${msg.slice(0, 60)}`);
    if (i === 1) await page.locator('#giant').screenshot({ path: SP + '1401-s1-card.png' });
    await page.click('#glock');
  }
  ok((await page.textContent('#giant h3')).includes('6 of 7'), 'verdict: close on 6 of 7');
  await page.click('#fchips .fchip[data-k="comments"]');
  ok(await hearts() === 2, 'out-of-scope chip costs a heart');
  await page.click('#fchips .fchip[data-k="upload"]');
  await page.click('#fchips .fchip[data-k="watch"]');
  ok((await page.$$eval('#scope1 .blank.got', a => a.map(x => x.textContent))).join('+') === 'upload+watch', 'blanks filled upload + watch');
  await quizClick('#s1q1', 'Out of scope');
  await quizClick('#s1q2', '45 minutes');
  await waitCleared(1);
  ok(true, 'stage 1 cleared; xp=' + await xp());
  await page.locator('#s1').screenshot({ path: SP + '1401-375-dark-s1.png' });

  /* ---------- reload mid-quest ---------- */
  await page.reload();
  await page.waitForSelector('.banner.resume');
  ok(await cleared(1) && await hearts() === 2, 'resume after reload keeps stage 1 + hearts');
  const xpAfterReload = await xp();

  /* ---------- stage 2 ---------- */
  await page.click('#qdeck2 .opt:has-text("play button")');
  ok(await hearts() === 1, 'time-waster costs a heart');
  ok((await page.textContent('#ivav')) === '🤨', 'interviewer frowns');
  ok((await page.textContent('#clock2t')).startsWith('1.0'), 'clock burned 1 minute');
  for (const q of ['Which features', 'Which clients', 'How many daily', 'How long does', 'international', 'resolutions', 'encryption', 'maximum file size', 'existing cloud']) await page.click(`#qdeck2 .opt:has-text("${q}")`);
  ok(await page.$$eval('#reqs2 .req.got', a => a.length) === 9, '9 requirements pinned');
  await page.waitForFunction(() => document.querySelectorAll('#nfr2 li.in').length === 6, null, { timeout: 8000 });
  ok(true, 'six non-functional requirements assembled');
  await quizClick('#s2q1', 'You rent blob storage');
  await quizClick('#s2q2', 'It bounds the upload time');
  await waitCleared(2);
  ok(true, 'stage 2 cleared; xp=' + await xp());
  await page.locator('#s2').screenshot({ path: SP + '1401-375-dark-s2.png' });

  /* ---------- stage 3 ---------- */
  const fill = async (sheet, k, v, unit) => { await page.fill(`${sheet} .crow[data-k="${k}"] input`, v); if (unit) await page.selectOption(`${sheet} .crow[data-k="${k}"] select`, unit); await page.click(`${sheet} .crow[data-k="${k}"] .btn.primary`); };
  await fill('#sheet3', 'up', '25m');
  ok((await page.textContent('#sheet3 .crow[data-k="up"] .fb')).includes('views'), 'diagnoses views-instead-of-uploads');
  ok(await hearts() === 0, 'first miss costs a heart');
  ok(await page.$eval('#sheet3 .crow[data-k="up"] .hint', e => e.classList.contains('on')), 'hint revealed after a miss');
  await fill('#sheet3', 'up', '25m');
  ok(await hearts() === 0, 'second miss on the same row is free (and hearts never go negative)');
  await fill('#sheet3', 'up', '500k');
  ok(await page.$eval('#sheet3 .crow[data-k="up"]', e => e.classList.contains('ok')), 'A: 500k accepted');
  await fill('#sheet3', 'st', '150000', 'gb');
  ok(await page.$eval('#sheet3 .crow[data-k="st"]', e => e.classList.contains('ok')), 'B: 150000 GB accepted as 150 TB');
  await page.waitForSelector('#pred3 .opt');
  ok(await page.$eval('#r3v', e => e.disabled), 'sliders locked until the prediction');
  await page.click('#pred3 .opt:has-text("15×")');
  await page.waitForSelector('#pred3 .explain.show', { timeout: 15000 });
  ok((await page.textContent('#c3day')) === '2.25 PB', 'counter: 2.25 PB a day');
  ok(await page.$$eval('#blocks3 .blk', a => a.length) === 15, '15 blocks drawn');
  await setRange('#r3y', 5);
  ok((await page.textContent('#c3tot')).includes('EB'), 'five years → exabytes: ' + await page.textContent('#c3tot'));
  await page.locator('#s3 .sim').screenshot({ path: SP + '1401-375-dark-s3.png' });
  await quizClick('#s3quiz', 'Transcoded versions');
  await waitCleared(3);
  ok(true, 'stage 3 cleared; xp=' + await xp());

  /* ---------- stage 4 ---------- */
  await fill('#sheet4', 'cdn', '3000');
  ok((await page.textContent('#sheet4 .fb')).includes('uploads'), 'diagnoses uploads-instead-of-views');
  await fill('#sheet4', 'cdn', '$150,000');
  ok(await page.$eval('#sheet4 .crow', e => e.classList.contains('ok')), 'CDN $150,000 accepted');
  await page.waitForSelector('#pred4 .opt');
  await page.click('#pred4 .opt:has-text("4×")');
  await page.waitForSelector('#pred4 .explain.show', { timeout: 15000 });
  ok((await page.textContent('#b4day')) === '$637,500', 'bill at $0.085 = $637,500');
  await page.click('#k4reset');
  ok((await page.textContent('#b4day')) === '$150,000', 'reset → $150,000');
  await setRange('#k4dau', 20);
  ok(!(await page.$eval('#s4goals li', e => e.classList.contains('done'))), 'goal not met by changing DAU');
  await setRange('#k4dau', 5);
  await setRange('#k4share', 40);
  ok(await page.$eval('#s4goals li', e => e.classList.contains('done')), 'goal met with share watched 40%');
  await page.locator('#s4 .sim').screenshot({ path: SP + '1401-375-dark-s4.png' });
  await quizClick('#s4q1', 'Serving video bytes');
  await quizClick('#s4q2', 'Every view streams');
  await waitCleared(4);
  ok(true, 'stage 4 cleared; xp=' + await xp());

  /* ---------- stage 5 boss: lose once, then rematch ---------- */
  const playBoss = async answers => {
    for (const a of answers) {
      await page.waitForSelector('#boss5 .choice .opt');
      await page.click(`#boss5 .choice .opt[data-c="${a}"]`);
      await page.click('#boss5 .q-arena .btn.primary');
    }
  };
  await playBoss(['draw', 'views', 'cloud', 'trans', 'views']);
  ok(!(await cleared(5)), 'boss 3/5 does not clear');
  ok(await page.isVisible('#boss5again'), 'rematch offered');
  await page.click('#boss5again .btn');
  await playBoss(['ask', 'ups', 'cloud', 'trans', 'views']);
  await waitCleared(5);
  ok(true, 'stage 5 cleared; xp=' + await xp());

  /* ---------- stage 6 drill ---------- */
  await page.fill('#drill6 textarea', 'Upload and watch only. Mobile web TV, 5M DAU, 1 GB max, encrypted, cloud allowed. 150 TB a day storage and 150k a day CDN, so the CDN is the cost.');
  await page.click('#drill6 .q-reveal');
  const boxes = await page.$$('#drill6 .selfgrade input');
  for (const b of boxes.slice(0, 5)) await b.check();
  await page.click('#drill6 .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 10000 });
  ok(true, 'victory card shown');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).lessons['1401']);
  ok(saved && saved.xp > 0, 'lesson saved: ' + JSON.stringify(saved));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: SP + '1401-375-dark.png', fullPage: true });
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(ov <= 1, 'no horizontal overflow: ' + ov);
  ok(errs.length === 0, 'no page errors ' + errs.join(' | '));
  console.log('xp after reload was', xpAfterReload);
  await browser.close();
})();
