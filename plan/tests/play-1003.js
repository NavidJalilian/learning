const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1003-notification-reliability.html';
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
  const opt = async (scope, text) => { await page.locator(`${scope} .opt:not([disabled])`, { hasText: text }).first().click(); };
  const btn = async (scope, text) => { await page.locator(`${scope} button:not([disabled])`, { hasText: text }).first().click(); };

  /* ---- stage 1 ---- */
  await opt('#s1box', 'lost for good');
  await page.waitForSelector('#s1box .explain.show', { timeout: 15000 });
  await page.click('#ackSeg button[data-v="after"]');
  await opt('#s1box', 'still arrives');
  await page.waitForSelector('#s1box .explain.show', { timeout: 15000 });
  await page.screenshot({ path: SP + '1003-s1.png' });
  await page.locator('#s1 .sim').screenshot({ path: SP + '1003-s1-sim.png' });
  await page.click('#logSeg button[data-v="1"]');
  await opt('#s1box', 'still arrives');
  await page.waitForSelector('#s1box .explain.show', { timeout: 15000 });
  console.log('s1 tiles:', await page.evaluate(() => [...document.querySelectorAll('.combo .res')].map(x => x.textContent).join(' | ')));
  await opt('#s1quiz', 'Lose a notification');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());

  /* ---- reload: resume ---- */
  await page.reload(); await page.waitForTimeout(500);
  console.log('resume:', JSON.stringify(await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared') }))), await hud());

  /* ---- stage 2 ---- */
  const answers = [['1 banner', 'Next: run B'], ['2 banners', 'Next: run C'], ['2 banners', 'Switch to at-most-once']];
  for (const [a, n] of answers) {
    await opt('#s2box', a);
    await page.waitForSelector('#s2box .explain.show', { timeout: 20000 });
    await btn('#s2box', n);
  }
  await opt('#s2box', 'Run A');
  await page.waitForSelector('#s2box .explain.show', { timeout: 30000 });
  console.log('s2 table:', await page.evaluate(() => [...document.querySelectorAll('table.score td.v')].map(x => x.textContent).join(' | ')));
  await page.locator('#s2 .sim').screenshot({ path: SP + '1003-s2-sim.png' });
  await page.waitForSelector('#s2quiz .opt', { timeout: 5000 });
  await opt('#s2quiz', 'lost reply');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());

  /* ---- stage 3 ---- */
  for (const send of [true, true, false, true, false, true, false]) {
    await page.click(send ? '#gSend' : '#gDrop');
    await page.waitForTimeout(450);
  }
  console.log('gate msg:', await page.textContent('#gmsg'));
  await page.click('#raceBtn');
  await page.waitForSelector('#bugBtn:not([style*="none"])', { timeout: 15000 });
  await page.locator('#s3 .wks').screenshot({ path: SP + '1003-s3-race.png' });
  await page.click('#code .cl[data-l="2"]');
  await page.click('#code .cl[data-l="4"]');
  await page.click('#bugBtn');
  await opt('#fixQuiz', 'atomic');
  await page.waitForSelector('#raceBtn:not([disabled])', { timeout: 5000 });
  await page.click('#raceBtn');
  await page.waitForSelector('#s3quiz .opt', { timeout: 15000 });
  console.log('race msg:', await page.textContent('#rmsg'));
  await opt('#s3quiz', 'calling service');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* ---- stage 4 ---- */
  for (const b of ['retry', 'retry', 'retry', 'drop', 'drop', 'dlq', 'drop']) {
    await page.waitForSelector(`#bins .bin[data-b="${b}"]:not([disabled])`, { timeout: 5000 });
    await page.click(`#bins .bin[data-b="${b}"]`);
  }
  await page.waitForTimeout(1700);
  await page.click('#boRun');
  await page.waitForSelector('#boRun:not([disabled])', { timeout: 10000 });
  console.log('storm off:', await page.textContent('#boStats'));
  await page.locator('#s4 .bo').screenshot({ path: SP + '1003-s4-nojit.png' });
  await page.click('#jitSeg button[data-v="1"]');
  await page.click('#boRun');
  await page.waitForSelector('#boRun:not([disabled])', { timeout: 10000 });
  console.log('storm on:', await page.textContent('#boStats'));
  await page.locator('#s4 .bo').screenshot({ path: SP + '1003-s4-jit.png' });
  await page.waitForSelector('#s4quiz .opt', { timeout: 5000 });
  await opt('#s4quiz', 'stale token');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());

  /* ---- stage 5 ---- */
  await page.click('#qRun');
  await page.waitForSelector('#qRun:not([disabled])', { timeout: 10000 });
  await page.waitForTimeout(300);
  console.log('p1 fail?', await page.textContent('#qmsg'));
  await page.click('#wPlus');
  await page.click('#qRun');
  await page.waitForSelector('#qNext button', { timeout: 10000 });
  console.log('p1:', await page.textContent('#qmsg'));
  await page.click('#qNext button');
  for (let i = 0; i < 17; i++) await page.click('#wPlus');
  await page.click('#qRun');
  await page.waitForSelector('#qNext button', { timeout: 10000 });
  console.log('p2:', await page.textContent('#qmsg'));
  await page.click('#qNext button');
  await opt('#qbox', '15 workers');
  await btn('#qbox', 'Run the afternoon');
  await page.waitForSelector('#qbox button:has-text("Next phase")', { timeout: 10000 });
  console.log('p3:', await page.textContent('#qmsg3'));
  await btn('#qbox', 'Next phase');
  await page.click('#qRun');
  await page.waitForSelector('#qDecide .opt', { timeout: 10000 });
  console.log('p4:', await page.textContent('#qmsg'));
  await opt('#qDecide', 'Add 5 more');
  await page.waitForSelector('#qDecide .explain.show', { timeout: 10000 });
  await opt('#qDecide', 'Back off');
  await page.waitForSelector('#s5quiz .opt', { timeout: 10000 });
  await page.locator('#s5 .sim').screenshot({ path: SP + '1003-s5.png' });
  await opt('#s5quiz', 'Add more workers');
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* ---- stage 6 ---- */
  for (const k of ['once', 'dup', 'lost', 'once', 'dup', 'once']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForSelector('#s6.cleared', { timeout: 5000 });
  console.log('after s6', await hud());

  /* ---- stage 7 ---- */
  await page.fill('#drill textarea', 'Delayed or reordered is fine but never lost: notification log, ack only after the provider accepts, retries with backoff and jitter then a dead-letter queue. Exactly-once is impossible so dedupe by event ID from the caller with atomic set-if-absent. Monitor queue depth.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY', await page.textContent('#victory h2'), await hud());

  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  await p2.goto(URL); await p2.waitForTimeout(500);
  await p2.screenshot({ path: SP + '1003-375-dark.png', fullPage: true });
  const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p3.goto(URL); await p3.waitForTimeout(500);
  await p3.locator('#s1 .sim').screenshot({ path: SP + '1003-1280-s1.png' });
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
