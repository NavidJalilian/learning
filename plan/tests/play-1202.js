const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1202-chat-high-level-design.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(URL);
  await page.waitForTimeout(500);
  const hud = async () => page.evaluate(() => ({ xp: document.querySelector('.q-xp').textContent, hearts: document.querySelectorAll('.heart:not(.lost)').length, cleared: [...document.querySelectorAll('.stage.cleared')].map(s => s.dataset.stage).join(',') }));
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };

  // text-fit check for SVG labels
  const fit = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('#board3 .slot, #lmap .ln, #herd .srv').forEach(g => {
      const r = g.querySelector('rect').getBBox();
      g.querySelectorAll('text').forEach(t => { const b = t.getBBox(); if (b.x < r.x - 0.5 || b.x + b.width > r.x + r.width + 0.5) bad.push(t.textContent + ' ' + b.width.toFixed(0) + '>' + r.width); });
    });
    return bad;
  });
  console.log('text overflow:', fit.length ? fit : 'none');

  /* ---- stage 1 ---- */
  const ANS = { login: 'sl', signup: 'sl', pic: 'sl', group: 'sl', msg: 'sf', dot: 'sf', push: 'tp', which: 'sl' };
  // one wrong drop
  await page.click('#tray1 .tcard[data-k="which"]');
  await page.click('#bins1 .bin[data-b="sf"]');
  console.log('s1 wrong msg:', (await page.textContent('#s1msg')).slice(0, 80));
  for (const [k, b] of Object.entries(ANS)) {
    await page.click(`#tray1 .tcard[data-k="${k}"]`);
    await page.click(`#bins1 .bin[data-b="${b}"]`);
  }
  await page.waitForSelector('#s1quiz .opt', { timeout: 5000 });
  await clickOpt('#s1quiz', 'Your open connection lives');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());

  /* ---- reload mid-quest: resume ---- */
  await page.reload(); await page.waitForTimeout(600);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared') }));
  console.log('resume:', JSON.stringify(resume), await hud());

  /* ---- stage 2 ---- */
  await page.fill('#calcIn', '10000');
  await page.click('#calcBtn');
  console.log('calc wrong:', (await page.textContent('#calcMsg')).slice(0, 60));
  await page.fill('#calcIn', '10');
  await page.click('#calcBtn');
  await page.click('#plugBtn');
  await page.waitForTimeout(1300);
  console.log('dc after plug:', await page.textContent('#dc'));
  await page.locator('#s2 .sim').screenshot({ path: SP + '1202-s2-plug.png' });
  await page.click('#splitBtn');
  await page.waitForTimeout(1200);
  await page.locator('#box2 .srv.tap').nth(3).click();
  await page.waitForTimeout(3200);
  console.log('dc after kill:', await page.textContent('#dc'));
  await page.locator('#s2 .sim').screenshot({ path: SP + '1202-s2-ten.png' });
  // keyboard kill on another server
  await page.locator('#box2 .srv.tap:not(.dead)').nth(6).focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3200);
  const boxCounts = await page.evaluate(() => document.querySelectorAll('#box2 .cd.off').length);
  console.log('offline dots after 2nd kill (expect 0):', boxCounts);
  await page.waitForSelector('#s2quiz .opt', { timeout: 5000 });
  await clickOpt('#s2quiz', 'One crash would disconnect');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());

  /* ---- stage 3 ---- */
  // trap + wrong slot
  await page.click('#tiles3 .tcard[data-k="xp2p"]');
  await page.locator('#board3 .slot[data-k="chat"]').click();
  await page.click('#tiles3 .tcard[data-k="kv"]');
  await page.locator('#board3 .slot[data-k="api"]').click();
  for (const k of ['lb', 'chat', 'pres', 'api', 'notif', 'sd', 'kv']) {
    await page.click(`#tiles3 .tcard[data-k="${k}"]`);
    await page.locator(`#board3 .slot[data-k="${k}"]`).click();
  }
  // protocols: e1 HTTP (1 tap), e2 WS (2 taps), e3 WS (2 taps)
  await page.locator('#board3 .proto[data-k="e1"]').click();
  await page.locator('#board3 .proto[data-k="e2"]').click();
  await page.locator('#board3 .proto[data-k="e3"]').click();
  await page.click('#protoCheck'); // wrong (e2,e3 http)
  await page.locator('#board3 .proto[data-k="e2"]').click();
  await page.locator('#board3 .proto[data-k="e3"]').focus();
  await page.keyboard.press(' ');
  await page.click('#protoCheck');
  console.log('s3 log tail:', await page.evaluate(() => [...document.querySelectorAll('#log3 div')].slice(-2).map(d => d.textContent).join(' || ')));
  await page.locator('#s3 .sim').screenshot({ path: SP + '1202-s3-board.png' });
  await page.waitForSelector('#s3quiz .opt', { timeout: 5000 });
  await clickOpt('#s3quiz', 'The key-value store');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* ---- stage 4 ---- */
  await page.click('#ordPool .tcard[data-s="4"]'); // wrong
  for (const s of [1, 2, 3, 4]) await page.click(`#ordPool .tcard[data-s="${s}"]`);
  await page.locator('#s4 .lmap').screenshot({ path: SP + '1202-s4-map.png' });
  await page.click('#reg .regrow[data-k="cs3"]'); // wrong
  await page.click('#reg .regrow[data-k="cs2"]');
  await page.click('#crashBtn');
  await page.waitForFunction(() => !document.querySelector('#herdReset').disabled, null, { timeout: 30000 });
  await page.locator('#s4 #herd').screenshot({ path: SP + '1202-s4-herd.png' });
  await page.click('#herdReset');
  await page.click('#boSeg button[data-b="1"]');
  await page.click('#crashBtn');
  await page.waitForFunction(() => !document.querySelector('#herdReset').disabled, null, { timeout: 30000 });
  console.log('s4 log tail:', await page.evaluate(() => [...document.querySelectorAll('#log4 div')].slice(-3).map(d => d.textContent).join(' || ')));
  await page.locator('#s4 #herd').screenshot({ path: SP + '1202-s4-jitter.png' });
  await page.waitForSelector('#s4quiz .opt', { timeout: 5000 });
  await clickOpt('#s4quiz', 'Clients notice');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());

  /* ---- stage 5 ---- */
  for (const k of ['api', 'chat', 'notif', 'pres', 'api', 'pres', 'api']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', 'Stateless API servers behind a load balancer, stateful chat servers over WebSocket, presence servers, notification servers for push, KV store for history, ZooKeeper service discovery picks a chat server; reconnect on failure.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY', await page.textContent('#victory h2'), await hud());

  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('overflowX', ov);

  // fresh full-page screenshot at 375 dark + desktop light
  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  await p2.goto(URL); await p2.waitForTimeout(600);
  await p2.screenshot({ path: SP + '1202-375-dark.png', fullPage: true });
  const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p3.goto(URL); await p3.waitForTimeout(600);
  await p3.locator('#s3 .sim').screenshot({ path: SP + '1202-s3-light.png' });
  await p3.locator('#s4 .lmap').screenshot({ path: SP + '1202-s4-light.png' });

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})();
