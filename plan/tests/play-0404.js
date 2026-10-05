const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/0404-counters-rules-and-429s.html';
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
  const hud = async () => page.evaluate(() => ({ xp: document.querySelector('.q-xp').textContent, hearts: document.querySelectorAll('.heart:not(.lost)').length, cleared: [...document.querySelectorAll('.stage.cleared')].map(s => s.dataset.stage) }));
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };
  const waitEnabled = async sel => page.waitForFunction(s => { const b = document.querySelector(s); return b && !b.disabled; }, sel, { timeout: 20000 });

  /* ---- stage 1 ---- */
  for (let i = 0; i < 6; i++) { await waitEnabled('#rSend'); await page.click('#rSend'); }
  await waitEnabled('#rSend');
  console.log('s1 status after 6:', await page.textContent('#rStatus'), '| val', await page.textContent('#rVal'), '| ttl', await page.textContent('#rTTL'));
  await page.click('#rWait'); await waitEnabled('#rSend');
  await page.click('#rSend'); await waitEnabled('#rSend');
  console.log('s1 goals:', await page.evaluate(() => [...document.querySelectorAll('#s1goals li.done')].map(l => l.dataset.g).join(',')), '| status', await page.textContent('#rStatus'));
  // bug: kill too early, then step to the gap and kill
  await page.click('#bugKill');
  console.log('early kill:', (await page.textContent('#bugLog')).slice(-90));
  for (let i = 0; i < 3; i++) await page.click('#bugStep');
  await page.click('#bugKill');
  await page.waitForSelector('#bugNext:not([style*="none"])');
  console.log('bugkey:', await page.textContent('#bugKey'));
  await page.click('#bugFF');
  await page.waitForSelector('#s1fix .opt', { timeout: 15000 });
  await page.screenshot({ path: SP + '0404-s1-bug.png' });
  await clickOpt('#s1fix', 'atomic Lua script');
  await page.waitForSelector('#s1quiz .opt', { timeout: 5000 });
  await clickOpt('#s1quiz', 'lives in memory');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());

  /* ---- reload mid-quest: resume ---- */
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), text: (document.querySelector('.banner') || {}).textContent }));
  console.log('resume:', JSON.stringify(resume), await hud());

  /* ---- stage 4 first (any order) ---- */
  await page.click('#tiles .opt[data-k="api"]'); // out of order -> minute
  console.log('s4 nudge:', await page.textContent('#wbMsg'), '| clock', await page.textContent('#wbClock'));
  await page.click('#tiles .opt[data-k="sql"]'); // distractor -> heart
  console.log('s4 distractor hearts:', (await hud()).hearts);
  for (const k of ['client', 'mw', 'api', 'redis', 'rules', 'workers', 'cache', 'queue']) { await page.click(`#tiles .opt[data-k="${k}"]`); await page.waitForTimeout(100); }
  for (const ans of ['API servers: 200 OK', 'back to client: 429', 'queue, plus a 429']) {
    await page.waitForSelector('#s4pred .opt:not([disabled])', { timeout: 8000 });
    await clickOpt('#s4pred', ans);
    await page.waitForSelector('#s4pred .row .btn.primary', { timeout: 15000 });
    if (ans.startsWith('queue')) await page.locator('#s4 .wb').screenshot({ path: SP + '0404-wb.png' });
    await page.click('#s4pred .row .btn.primary');
  }
  await page.waitForSelector('#s4quiz .opt', { timeout: 5000 });
  await clickOpt('#s4quiz', 'never reads the disk');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());

  /* ---- stage 2 ---- */
  const RULES = [
    { domain: 'messaging', key: 'message_type', value: 'marketing', unit: 'day', requests_per_unit: '5' },
    { domain: 'auth', key: 'auth_type', value: 'login', unit: 'minute', requests_per_unit: '5' },
    { domain: 'search', key: 'search_type', value: 'keyword', unit: 'hour', requests_per_unit: '100' },
  ];
  for (let i = 0; i < 3; i++) {
    const r = RULES[i];
    if (i === 0) { // wrong unit first
      for (const f in r) await page.selectOption(`#yaml select[data-f="${f}"]`, f === 'unit' ? 'minute' : r[f]);
      await page.click('#ruleCheck');
      console.log('s2 hint:', await page.textContent('#hints'));
    }
    for (const f in r) await page.selectOption(`#yaml select[data-f="${f}"]`, r[f]);
    await page.click('#ruleCheck');
    await page.click('#ruleRow .btn.primary'); // test it
    await page.waitForSelector('#evs .ev.no', { timeout: 10000 });
    if (i < 2) { await page.waitForSelector('#ruleRow .btn.primary'); await page.click('#ruleRow .btn.primary'); }
  }
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());

  /* ---- stage 3 ---- */
  const ANS = [null, ['200', '5', '3', ''], ['200', '5', '2', ''], ['200', '5', '1', ''], ['200', '5', '0', ''], ['429', '5', '0', '35']];
  for (let n = 2; n <= 6; n++) {
    const box = `#respWrap .resp[data-n="${n}"]`;
    await page.waitForSelector(box);
    const [st, li, re, ra] = ANS[n - 1];
    if (n === 6) { // a wrong attempt first
      await page.selectOption(`${box} select`, '200'); await page.fill(`${box} input[data-f="limit"]`, '5'); await page.fill(`${box} input[data-f="rem"]`, '0');
      await page.click(`${box} .q-chk`);
      console.log('s3 hint:', await page.textContent(`${box} .explain`));
    }
    await page.selectOption(`${box} select`, st);
    await page.fill(`${box} input[data-f="limit"]`, li);
    await page.fill(`${box} input[data-f="rem"]`, re);
    await page.fill(`${box} input[data-f="retry"]`, ra);
    await page.click(`${box} .q-chk`);
    await page.waitForTimeout(600);
  }
  await page.waitForSelector('#lanePred .opt', { timeout: 5000 });
  await clickOpt('#lanePred', 'Neither');
  await page.waitForSelector('#bpPart:not([style*="none"])', { timeout: 10000 });
  console.log('lanes wasted:', await page.textContent('#lnBad'), await page.textContent('#lnGood'));
  await page.locator('#s3 .lanes').screenshot({ path: SP + '0404-lanes.png' });
  // wrong set first
  for (const t of ['Cache API', 'Know the limit', 'Catch errors', 'retry immediately']) await clickOpt('#bp', t);
  await page.click('#bpCheck');
  console.log('bp wrong:', (await page.textContent('#bpEx')).slice(0, 60));
  await clickOpt('#bp', 'retry immediately');
  await clickOpt('#bp', 'back-off');
  await page.click('#bpCheck');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* ---- stage 5 ---- */
  for (const k of ['crash', 'workers', 'queue', 'wait', 'mem']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', 'Rules on disk, workers pull into cache; request hits middleware which loads rule and gets counter from Redis with atomic INCR and EXPIRE; under limit to API servers; over limit 429 with X-Ratelimit headers, dropped or queued.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY', await page.textContent('#victory h2'), await hud());

  // screenshots
  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  await p2.goto(URL); await p2.waitForTimeout(500);
  await p2.screenshot({ path: SP + '0404-375-dark.png', fullPage: true });
  for (const s of ['s1', 's2', 's3', 's4']) await p2.locator('#' + s).screenshot({ path: SP + `0404-375-${s}.png` });
  const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p3.goto(URL); await p3.waitForTimeout(500);
  await p3.locator('#s4').screenshot({ path: SP + '0404-1280-s4.png' });

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
