const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1002-notification-high-level-design.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(URL); await page.waitForTimeout(400);
  const hud = async () => page.evaluate(() => ({ xp: document.querySelector('.q-xp').textContent, hearts: document.querySelectorAll('.heart:not(.lost)').length, cleared: [...document.querySelectorAll('.stage.cleared')].map(s => s.dataset.stage).join(',') }));
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };

  /* ---- stage 1 ---- */
  await page.locator('#s1').scrollIntoViewIfNeeded();
  await page.$eval('#rate', el => { el.value = 3000; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForSelector('#s1goals li[data-g="peak"].done', { timeout: 8000 });
  await page.screenshot({ path: SP + '1002-s1-peak.png' });
  await page.locator('#box1').screenshot({ path: SP + '1002-box1-peak.png' });
  await page.$eval('#rate', el => { el.value = 300; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('#bfBtn');
  await page.waitForSelector('#s1goals li[data-g="bf"].done', { timeout: 10000 });
  await page.click('#killBtn');
  await page.waitForTimeout(400);
  await page.locator('#box1').screenshot({ path: SP + '1002-box1-dead.png' });
  console.log('log1 tail:', await page.evaluate(() => [...document.querySelectorAll('#log1 div')].slice(-3).map(d => d.textContent).join(' || ')));
  await page.waitForSelector('#crack', { state: 'visible' });
  // marker before label
  await page.locator('#box1 .mk .hit').nth(0).click();
  console.log('no-label msg:', await page.textContent('#crackMsg'));
  // a wrong pairing
  await page.click('#lbls .lbl-btn[data-k="perf"]');
  await page.locator('#box1 .mk .hit').nth(0).click();
  console.log('wrong msg:', await page.textContent('#crackMsg'), await hud());
  // keyboard on one marker
  await page.click('#lbls .lbl-btn[data-k="spof"]');
  await page.locator('#box1 .mk').nth(0).focus(); await page.keyboard.press('Enter');
  await page.click('#lbls .lbl-btn[data-k="scale"]'); await page.locator('#box1 .mk .hit').nth(1).click();
  await page.click('#lbls .lbl-btn[data-k="perf"]'); await page.locator('#box1 .mk .hit').nth(2).click();
  await page.click('#killBtn');
  await page.waitForSelector('#s1quiz .opt', { timeout: 5000 });
  await page.locator('#box1').screenshot({ path: SP + '1002-box1-marks.png' });
  await clickOpt('#s1quiz', 'Performance bottleneck');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());

  /* ---- reload: resume ---- */
  await page.reload(); await page.waitForTimeout(500);
  console.log('resume:', JSON.stringify(await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), text: (document.querySelector('.banner') || {}).textContent, s1: document.querySelector('#s1').classList.contains('cleared') }))), await hud());

  /* ---- stage 2 ---- */
  await page.click('#hintBtn');
  const row = k => `#calc .crow[data-k="${k}"]`;
  await page.fill(row('push') + ' input', '50'); await page.click(row('push') + ' .btn');
  console.log('wrong calc:', await page.textContent(row('push') + ' .cmsg'));
  await page.fill(row('push') + ' input', '100'); await page.press(row('push') + ' input', 'Enter');
  await page.fill(row('sms') + ' input', '11.6'); await page.click(row('sms') + ' .btn');
  await page.fill(row('email') + ' input', '58'); await page.click(row('email') + ' .btn');
  await page.waitForSelector('#news.show');
  await page.fill('#burstIn', '3,333'); await page.click('#burstBtn');
  await page.waitForSelector('#s2quiz .opt', { timeout: 5000 });
  await page.locator('#s2 .news').screenshot({ path: SP + '1002-s2-news.png' });
  await clickOpt('#s2quiz', 'Traffic is bursty');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());

  /* ---- stage 3 ---- */
  await page.click('#tray .opt[data-k="mono"]');
  console.log('wrong tray:', await page.textContent('#bmsg'));
  for (const k of ['srv', 'store', 'q', 'wk', 'tp']) { await page.click(`#tray .opt[data-k="${k}"]`); await page.waitForTimeout(650); }
  await page.waitForSelector('#iso', { state: 'visible' });
  await page.locator('#s3 .duo').first().screenshot({ path: SP + '1002-s3-build.png' });
  await page.click('#iso .pq[data-l="shared"] .opt[data-v="late"]');
  await page.click('#iso .pq[data-l="split"] .opt[data-v="ok"]');
  await page.click('#watchBtn');
  await page.waitForSelector('#s3quiz .opt', { timeout: 20000 });
  console.log('iso msg:', (await page.textContent('#isoMsg')).slice(0, 200));
  await page.locator('#iso .qsim').screenshot({ path: SP + '1002-s3-iso.png' });
  await clickOpt('#s3quiz', 'one provider outage');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* ---- stage 4 ---- */
  const steps = ['A service calls', 'The server fetches', 'The server puts', 'Workers pull', 'Workers send', 'The third-party service delivers'];
  await page.locator('#pool .opt', { hasText: 'Workers pull' }).click(); // wrong first
  for (const s of steps) { await page.locator('#pool .opt', { hasText: s }).first().click(); await page.waitForTimeout(150); }
  await page.waitForTimeout(1500);
  await page.locator('#s4 .duo').screenshot({ path: SP + '1002-s4-ping.png' });
  await page.click('#api .tok[data-k="uid"]'); // wrong guess before bug
  console.log('uid early:', await page.textContent('#apiMsg'));
  await page.click('#api .tok[data-k="path"]');
  await page.click('#api .tok[data-k="uid"]');
  console.log('bonus:', (await page.textContent('#apiMsg')).slice(0, 80));
  await page.waitForSelector('#s4quiz .opt', { timeout: 20000 });
  await page.locator('#s4 .challenge').nth(1).screenshot({ path: SP + '1002-s4-api.png' });
  await clickOpt('#s4quiz', 'User info, device tokens');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());

  /* ---- stage 5 ---- */
  for (const k of ['q', 'srv', 'cache', 'wk', 'q', 'srv']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', 'One server is a SPOF, hard to scale and a bottleneck. Services call stateless autoscaled notification servers, which read cache and DB, enqueue on one queue per channel; workers call APNs FCM SMS email.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY', await page.textContent('#victory h2'), await hud());
  const store = await page.evaluate(() => localStorage.getItem('sdq:v1'));
  console.log('store:', store);

  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  await p2.goto(URL); await p2.waitForTimeout(600);
  await p2.screenshot({ path: SP + '1002-375-dark.png', fullPage: true });
  const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p3.goto(URL); await p3.waitForTimeout(600);
  await p3.screenshot({ path: SP + '1002-1280-light.png', fullPage: true });
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
