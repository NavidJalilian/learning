const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1204-chat-message-flows.html';
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
  const overflow = async () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

  /* ---- stage 1: order ---- */
  await page.click('#pool .stepc[data-k="6"]');
  console.log('wrong-order msg:', await page.textContent('#ordMsg'));
  for (const k of ['1', '2', '3', '4', '5b', '5a', '6']) {
    await page.click(`#pool .stepc[data-k="${k}"]`);
    await page.waitForTimeout(80);
  }
  console.log('order msg:', await page.textContent('#ordMsg'), await hud());
  /* ---- stage 1: map online ---- */
  for (const id of ['cs1', 'id', 'q', 'kv', 'cs2', 'b']) await page.locator(`#map1 .node[data-id="${id}"]`).click();
  await page.click('#sendBtn');
  await page.waitForSelector('#scOn.done', { timeout: 15000 });
  console.log('online hint:', await page.textContent('#mapHint'));
  await page.locator('#s1 .map').screenshot({ path: SP + '1204-s1-map-on.png' });
  await page.click('#bobSeg button[data-m="off"]');
  // deliberately miss Bob to exercise the "missed" path
  for (const id of ['cs1', 'id', 'q', 'kv', 'pn']) await page.locator(`#map1 .node[data-id="${id}"]`).click();
  await page.click('#sendBtn');
  await page.waitForSelector('#scOff.done', { timeout: 15000 });
  console.log('offline hint:', await page.textContent('#mapHint'), await hud());
  await page.locator('#s1 .map').screenshot({ path: SP + '1204-s1-map-off.png' });
  await page.waitForSelector('#s1quiz .opt', { timeout: 5000 });
  await clickOpt('#s1quiz', 'in the KV store');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud(), 'overflow', await overflow());

  /* ---- reload mid-quest: resume ---- */
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), text: (document.querySelector('.banner') || {}).textContent }));
  console.log('resume:', JSON.stringify(resume), await hud());

  /* ---- stage 2 ---- */
  await page.click('#fiveBtn'); // before closing: should nudge
  console.log('s2 nudge log:', await page.evaluate(() => [...document.querySelectorAll('#s2log div')].pop().textContent));
  await page.click('#lidBtn');
  await page.click('#fiveBtn');
  await page.waitForSelector('#pickBox .idpick', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('#lidBtn').textContent.includes('Predict'));
  for (const id of [106, 107, 108, 109, 110]) await page.click(`#idPicks .idpick[data-id="${id}"]`);
  await page.click('#openBtn');
  await page.waitForSelector('#bonusBox .opt', { timeout: 15000 });
  console.log('s2 laptop cursor:', await page.textContent('#devLaptop .cur'), 'hits:', await page.evaluate(() => document.querySelectorAll('#kvList .mid.hit').length));
  await page.locator('#s2 .sim').first().screenshot({ path: SP + '1204-s2.png' });
  await clickOpt('#bonusBox', 'All ten messages');
  await page.waitForSelector('#s2quiz .opt', { timeout: 15000 });
  await clickOpt('#s2quiz', 'Each device misses');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud(), 'overflow', await overflow());

  /* ---- stage 3 ---- */
  await page.click('#fanSend');
  await page.waitForFunction(() => !document.querySelector('#fanSend').disabled);
  await clickOpt('#fanPred', '99,999 copies');
  await page.waitForSelector('#fanPred .explain.show', { timeout: 10000 });
  console.log('s3 after predict stats:', await page.textContent('#stCopies'), await page.textContent('#stStore'));
  await page.locator('#s3 .sim').first().screenshot({ path: SP + '1204-s3.png' });
  await page.click('#modeSeg button[data-m="once"]');
  await page.click('#fanSend');
  await page.waitForFunction(() => !document.querySelector('#fanSend').disabled);
  console.log('s3 once stats:', await page.textContent('#stCopies'), await page.textContent('#stStore'));
  await page.click('#bobPlay');
  await page.waitForSelector('#s3quiz .opt', { timeout: 10000 });
  await page.locator('#s3 .sim').nth(1).screenshot({ path: SP + '1204-s3-inbox.png' });
  await clickOpt('#s3quiz', 'Each client reads only');
  await page.waitForFunction(() => document.querySelectorAll('#s3quiz .quiz').length === 2, null, { timeout: 5000 });
  await clickOpt('#s3quiz .quiz:nth-child(2)', 'Writes: one post');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud(), 'overflow', await overflow());

  /* ---- stage 4 ---- */
  await page.click('#flows .flow[data-f="0"] .ln[data-l="1"]');
  await page.click('#flows .flow[data-f="1"] .ln[data-l="3"]');
  await page.click('#flows .flow[data-f="2"] .nobug');
  await page.waitForTimeout(1300);
  await page.locator('#flows').screenshot({ path: SP + '1204-s4.png' });
  await page.waitForSelector('#s4quiz .opt', { timeout: 5000 });
  await clickOpt('#s4quiz', 'A client-made message ID');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());

  /* ---- stage 5 ---- */
  await page.locator('#s5').scrollIntoViewIfNeeded();
  await page.locator('#s5').screenshot({ path: SP + '1204-s5.png' });
  for (const k of ['fwd', 'push', 'cur', 'copy', 'once', 'cur', 'copy']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', 'Alice sends over WebSocket to chat server 1, gets an ID, sync queue, KV store; online forward to Bob server, offline push notification; each device keeps cur_max_message_id; small groups copy to each inbox, big groups store once.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY', await page.textContent('#victory h2'), await hud(), 'overflow', await overflow());
  await page.screenshot({ path: SP + '1204-victory.png' });

  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  await p2.goto(URL); await p2.waitForTimeout(500);
  await p2.screenshot({ path: SP + '1204-375-dark.png', fullPage: true });
  const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p3.goto(URL); await p3.waitForTimeout(500);
  await p3.locator('#s1 .map').screenshot({ path: SP + '1204-1280-light-map.png' });
  await p3.locator('#s5').screenshot({ path: SP + '1204-1280-light-boss.png' });

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
