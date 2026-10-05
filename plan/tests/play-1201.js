const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1201-chat-connections.html';
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
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).last().click(); };
  const overflow = async (tag) => { const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 1) console.log('OVERFLOW', tag, o); };

  /* ---- stage 3 first (any order) ---- */
  // a wrong match first
  await page.click('#dcards .dcard[data-k="lb"]');
  await page.click('#scenes .scene[data-k="zzz"]');
  console.log('after wrong match', await hud());
  for (const k of ['lb', 'gone', 'zzz']) {
    await page.click(`#scenes .scene[data-k="${k}"]`);
    await page.click(`#dcards .dcard[data-k="${k}"]`);
  }
  await page.waitForTimeout(400);
  console.log('zzz counter:', await page.textContent('#zzzN'));
  await page.locator('#s3 .scenes').screenshot({ path: SP + '1201-s3.png' });
  await page.waitForSelector('#s3quiz .opt', { timeout: 5000 });
  await clickOpt('#s3quiz', 'not holding B');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* ---- stage 1 ---- */
  await page.fill('#msgIn', 'hello B');
  await page.click('#sendBtn');
  await page.waitForSelector('#s1goals [data-g="send"].done', { timeout: 5000 });
  await page.click('#directBtn', { force: true });
  await page.click('#bToggle');
  await page.click('#sendBtn');
  await page.waitForSelector('#s1goals [data-g="hold"].done', { timeout: 5000 });
  await page.fill('#msgIn', 'second one');
  await page.click('#sendBtn');
  await page.waitForFunction(() => document.querySelector('#trayN').textContent === '2', null, { timeout: 5000 });
  await page.locator('#s1 .sim').screenshot({ path: SP + '1201-s1-held.png' });
  await page.click('#bToggle');
  await page.waitForSelector('#s1goals [data-g="drain"].done', { timeout: 8000 });
  console.log('log1:', await page.evaluate(() => [...document.querySelectorAll('#log1 div')].map(d => d.textContent).join(' || ')));
  await page.waitForSelector('#legQ', { state: 'visible' });
  // answer via the SVG arrow
  await page.locator('#legB').click();
  await page.waitForSelector('#s1quiz .opt');
  await clickOpt('#s1quiz', 'Hold it until');
  await page.waitForFunction(() => document.querySelectorAll('#s1quiz .quiz').length === 2, null, { timeout: 5000 });
  await clickOpt('#s1quiz .quiz:nth-child(2)', 'keep-alive');
  await page.waitForFunction(() => document.querySelectorAll('#s1quiz .quiz').length === 3, null, { timeout: 5000 });
  await clickOpt('#s1quiz .quiz:nth-child(3)', 'server start delivery');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());
  await overflow('s1');

  /* ---- reload mid-quest ---- */
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), text: (document.querySelector('.banner') || {}).textContent }));
  console.log('resume:', JSON.stringify(resume), await hud());

  /* ---- stage 2 ---- */
  console.log('run disabled before predict:', await page.isDisabled('#run2'));
  await clickOpt('#pred2', 'About 8');
  await page.waitForSelector('#pred2 .explain.show', { timeout: 15000 });
  console.log('pred explain:', await page.textContent('#pred2 .explain'));
  console.log('counts 5s:', await page.textContent('#c2req'), await page.textContent('#c2empty'), await page.textContent('#c2wait'));
  for (const iv of ['1', '30', '15']) {
    await page.click(`#ivSeg button[data-iv="${iv}"]`);
    await page.click('#run2');
    await page.waitForFunction(() => !document.querySelector('#run2').disabled, null, { timeout: 15000 });
  }
  console.log('table:', await page.evaluate(() => [...document.querySelectorAll('#rtab2 tbody tr')].map(r => r.textContent).join(' | ')));
  await page.locator('#s2 .sim').screenshot({ path: SP + '1201-s2.png' });
  await page.waitForSelector('#s2quiz .opt', { timeout: 5000 });
  await clickOpt('#s2quiz', 'About twice the requests');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());

  /* ---- stage 4 ---- */
  // one wrong tap
  await page.locator('#ordPool .opt[data-i="2"]').click();
  for (const i of [0, 1, 2, 4, 3]) await page.locator(`#ordPool .opt[data-i="${i}"]`).click();
  console.log('order done:', await page.evaluate(() => document.querySelectorAll('#ordDone li').length));
  await page.fill('#calcIn', '5000000'); await page.click('#calcBtn');
  console.log('calc wrong:', await page.textContent('#calcMsg'));
  await page.fill('#calcIn', '200,000'); await page.click('#calcBtn');
  console.log('calc right:', await page.textContent('#calcMsg'));
  await page.click('#race');
  await page.waitForFunction(() => /again/.test(document.querySelector('#race').textContent), null, { timeout: 15000 });
  console.log('race counters:', await page.evaluate(() => [...document.querySelectorAll('#tl4 .lane-c')].map(t => t.textContent).join(' | ')));
  await page.locator('#s4 .sim').screenshot({ path: SP + '1201-s4.png' });
  await page.waitForSelector('#s4quiz .opt', { timeout: 5000 });
  await clickOpt('#s4quiz', 'simpler');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());
  await overflow('s4');

  /* ---- stage 5 ---- */
  for (const k of ['ws', 'poll', 'long', 'ws', 'poll', 'ws']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', 'Sending is easy since the client starts HTTP; receiving is hard because the server must speak first. Polling wastes requests, long polling hits wrong servers and idle reconnects, so WebSocket both ways; cost is stateful servers.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY', await page.textContent('#victory h2'), await hud());
  await overflow('end');

  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  await p2.goto(URL); await p2.waitForTimeout(800);
  await p2.screenshot({ path: SP + '1201-375-dark.png', fullPage: true });
  const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p3.goto(URL); await p3.waitForTimeout(800);
  await p3.screenshot({ path: SP + '1201-1280-light.png', fullPage: true });

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
