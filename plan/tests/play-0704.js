// Playthrough for quest 0704. Usage: NODE_PATH=... node play-0704.js [reduce|no-preference]
const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0704-snowflake-clocks-and-tuning.html';
const SHOT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/0704-375-dark.png';
const motion = process.argv[2] || 'reduce';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: motion });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE);
  await page.waitForTimeout(300);
  const ok = (c, msg) => { if (!c) { console.log('FAIL:', msg); process.exitCode = 1; } else console.log('ok  ', msg); };
  const txt = s => page.locator(s).innerText();
  const lastQuiz = (mount) => page.locator(`${mount} .quiz`).last();
  async function answer(mount, i) { const q = lastQuiz(mount); await q.locator(`.opt[data-i="${i}"]`).click(); await page.waitForTimeout(700); }
  const cleared = n => page.locator(`#s${n}.cleared`).waitFor({ timeout: 15000 });
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);

  /* ---- stage 1 ---- */
  ok(await page.locator('#burstSeg [data-b="5000"]').isDisabled(), 's1: 5,000 locked before predicting');
  await page.locator('#s1predict .opt[data-i="1"]').click();
  await page.waitForTimeout(300);
  ok(!(await page.locator('#burstSeg [data-b="5000"]').isDisabled()), 's1: 5,000 unlocked after predicting');
  await page.click('#fire1');
  await page.locator('#s1goals [data-g="fit"].done').waitFor();
  await page.click('#burstSeg [data-b="5000"]');
  await page.click('#modeSeg [data-m="wrap"]');
  await page.click('#fire1');
  await page.locator('#s1goals [data-g="wrap"].done').waitFor({ timeout: 15000 });
  ok((await txt('#s1dups')) === '904', 's1: wrap mode gives 904 duplicates (' + await txt('#s1dups') + ')');
  await page.click('#modeSeg [data-m="wait"]');
  await page.click('#fire1');
  await page.locator('#s1goals [data-g="wait"].done').waitFor({ timeout: 15000 });
  ok((await txt('#s1dups')) === '0' && (await txt('#s1next')) === '904', 's1: wait mode gives 0 dups, 904 in next ms');
  ok((await txt('#s1clock')) === '500000000001', 's1: clock ticked to next ms');
  await page.locator('#s1quiz .quiz').first().waitFor();
  await answer('#s1quiz', 0);
  await page.waitForFunction(() => document.querySelectorAll('#s1quiz .quiz').length === 2);
  await answer('#s1quiz', 0);
  await cleared(1);
  ok(true, 's1 cleared');

  /* ---- reload mid-quest ---- */
  await page.reload(); await page.waitForTimeout(400);
  ok(await page.locator('#s1.cleared').count() === 1, 'resume: stage 1 still cleared after reload');
  ok(await page.locator('.banner.resume').count() === 1, 'resume: welcome-back banner shown');
  const xpAfterReload = await txt('.q-xp');
  console.log('     XP after reload:', xpAfterReload);

  /* ---- stage 2 ---- */
  ok(await page.locator('#ntp2').isDisabled(), 's2: NTP locked before 5 mints');
  for (let i = 0; i < 5; i++) { await page.click('#mint2'); }
  await page.waitForTimeout(200);
  await page.click('#ntp2');
  await page.locator('#s2predict .opt').first().waitFor();
  await page.locator('#s2predict .opt[data-i="1"]').click();
  await page.waitForTimeout(500);
  ok((await txt('#c2dups')) === '1', 's2: guard OFF → duplicate minted (' + await txt('#c2dups') + ')');
  ok(await page.locator('#idlog2 .idrow.dup').count() === 2, 's2: both copies flagged red');
  await page.click('#guardSeg [data-g="1"]');
  await page.click('#ntp2');
  await page.click('#mint2');
  await page.locator('#s2goals [data-g="guard"].done').waitFor({ timeout: 10000 });
  ok((await txt('#c2dups')) === '1', 's2: guard ON → no new duplicate');
  await page.locator('#s2quiz .quiz').first().waitFor();
  await answer('#s2quiz', 0);
  await page.waitForFunction(() => document.querySelectorAll('#s2quiz .quiz').length === 2);
  const mq = lastQuiz('#s2quiz');
  ok(await mq.locator('.q-check').isDisabled(), 's2: multi-select check disabled until two picks');
  await mq.locator('.opt[data-i="0"]').click(); await mq.locator('.opt[data-i="1"]').click();
  await mq.locator('.q-check').click();
  await cleared(2);
  ok(true, 's2 cleared');

  /* ---- stage 3 ---- */
  const h0 = await hearts();
  await page.locator('#evlist .evbtn[data-i="1"]').click(); // wrong: E2 is not the smallest
  ok(await hearts() === h0 - 1, 's3: wrong tap costs a heart');
  for (const i of [0, 3, 2, 1, 5, 4]) await page.locator(`#evlist .evbtn[data-i="${i}"]`).click();
  await page.locator('#s3step2').waitFor({ state: 'visible' });
  const nd = i => page.locator('#ord3 .nd').nth(i);
  await nd(0).click(); await nd(1).click(); // wrong pair
  ok(await hearts() === h0 - 2, 's3: wrong pair costs a heart');
  for (const [a, b] of [[1, 2], [1, 3], [2, 3], [4, 5]]) { await nd(a).click(); await nd(b).click(); }
  ok(await page.locator('#found span').count() === 4, 's3: all 4 crossings found');
  await page.locator('#skewBox').waitFor({ state: 'visible' });
  await page.locator('#skew').fill('0');
  ok((await txt('#crossVal')) === '1', 's3: skew 0 → 1 crossing (' + await txt('#crossVal') + ')');
  await page.locator('#skew').fill('10');
  ok((await txt('#crossVal')) === '5', 's3: skew 10 → 5 crossings (' + await txt('#crossVal') + ')');
  await page.locator('#s3quiz .quiz').first().waitFor();
  await answer('#s3quiz', 0);
  await page.waitForFunction(() => document.querySelectorAll('#s3quiz .quiz').length === 2);
  await answer('#s3quiz', 1);
  await cleared(3);
  ok(true, 's3 cleared');

  /* ---- stage 4 ---- */
  const st = async (k, d, n = 1) => { for (let i = 0; i < n; i++) await page.click(`#bitrows .btn[data-k="${k}"][data-d="${d}"]`); };
  ok((await txt('#roLife')) === '69.7 yrs', 's4: default lifetime 69.7 yrs (' + await txt('#roLife') + ')');
  await st('ts', 1);
  ok((await page.locator('#budget.bad').count()) === 1, 's4: over-budget warning shows');
  ok((await txt('#roLife')) === '139 yrs', 's4: 42 bits → 139 yrs');
  await st('seq', -1);
  ok(await page.locator('#missions .mission.won').count() === 1, 's4: mission 1 won');
  await st('dc', -1, 5); await st('m', -1, 2); await st('ts', -1); await st('seq', 1, 8);
  ok(await page.locator('#missions .mission.won').count() === 2, 's4: mission 2 won');
  await page.click('#unitSeg [data-u="10"]');
  await page.click('#bitsReset');
  ok(await page.locator('#missions .mission.won').count() === 3, 's4: mission 3 won');
  await page.locator('#s4quiz .quiz').waitFor();
  await answer('#s4quiz', 0);
  await cleared(4);
  ok(true, 's4 cleared');

  /* ---- stage 5 ---- */
  await page.waitForTimeout(1200);
  for (const a of ['clock', 'ids', 'bits', 'ha', 'clock', 'bits', 'bits']) {
    console.log('     boss', await txt('#boss .q-count'), a); await page.click(`#boss .choice .opt[data-c="${a}"]`, { timeout: 4000 });
    await page.click('#boss .btn.primary');
  }
  await cleared(5);
  ok(true, 's5 cleared');

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', 'Past 4096 per ms I wait for the next millisecond. If the clock goes backwards I refuse until it passes the last timestamp. NTP slews. Order is rough. Tune bits. Unique machine IDs. Replicate.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.locator('#drill .selfgrade input').all()) await cb.check();
  await page.click('#drill .q-finish');
  await cleared(6);
  await page.locator('#victory.show').waitFor({ timeout: 5000 });
  ok(true, 'victory card shown');
  console.log('     final XP text:', await txt('.vstats'));
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(ov <= 1, 'no horizontal overflow at 375 (' + ov + ')');
  await page.locator('#s3').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SHOT, fullPage: true });
  for (let n = 1; n <= 6; n++) await page.locator('#s' + n).screenshot({ path: 'shot0704-s' + n + '.png' });
  await page.locator('.hero').screenshot({ path: 'shot0704-hero.png' });
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
  await browser.close();
})();
