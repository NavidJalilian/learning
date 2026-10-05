const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1205-chat-online-presence.html';
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
  const xp0 = await page.evaluate(() => parseInt(document.querySelector('.q-xp').textContent));

  /* ---- stage 4 first (any order) ---- */
  await page.click('#flipA');
  await page.waitForTimeout(1000);
  console.log('s4 flip log:', await page.evaluate(() => document.querySelector('#pslog').lastElementChild.textContent));
  await clickOpt('#s4pred', '100,000 events');
  await page.waitForSelector('#s4pred .explain.show', { timeout: 8000 });
  console.log('s4 evPer/tot:', await page.textContent('#evPer'), await page.textContent('#evTot'));
  await page.screenshot({ path: SP + '1205-s4-big.png' });
  await page.click('#modeSeg button[data-m="fetch"]');
  await page.click('#flipA'); await page.waitForTimeout(300);
  await page.click('#openG');
  await page.waitForSelector('#s4quiz .opt', { timeout: 5000 });
  await page.locator('#s4 .sim').screenshot({ path: SP + '1205-s4-fetch.png' });
  await clickOpt('#s4quiz', 'Fetch status when');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());

  /* ---- stage 1 ---- */
  await page.locator('#arch .nd[data-id="pres"]').click();
  await page.waitForSelector('#loginBtn:not([disabled])');
  await page.click('#loginBtn');
  await page.waitForSelector('#logoutBtn:not([disabled])', { timeout: 8000 });
  console.log('kv after login:', await page.textContent('#kvStatus'), await page.textContent('#kvTime'));
  await page.click('#logoutBtn');
  await page.waitForSelector('#s1quiz .opt', { timeout: 8000 });
  console.log('kv after logout:', await page.textContent('#kvStatus'));
  await page.locator('#s1 .sim').screenshot({ path: SP + '1205-s1.png' });
  await clickOpt('#s1quiz', 'Online status and a last_active_at');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());

  /* ---- reload mid-quest: resume ---- */
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), s4: document.querySelector('#s4').classList.contains('cleared'), text: (document.querySelector('.banner') || {}).textContent }));
  console.log('resume:', JSON.stringify(resume), await hud());

  /* ---- stage 2 ---- */
  await clickOpt('#s2pred', '6 changes');
  await page.waitForSelector('#s2pred .explain.show', { timeout: 20000 });
  console.log('s2 count:', await page.textContent('#r2count'));
  await page.locator('#s2 .sim').screenshot({ path: SP + '1205-s2.png' });
  await page.waitForSelector('#s2quiz .opt', { timeout: 5000 });
  await clickOpt('#s2quiz', 'Short drops cause flapping');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());

  /* ---- stage 3 ---- */
  await page.click('#tpred .sort-item[data-k="0"] .opt[data-v="on"]');
  await page.click('#tpred .sort-item[data-k="1"] .opt[data-v="off"]'); // deliberately wrong
  await page.click('#tpred .sort-item[data-k="2"] .opt[data-v="off"]');
  await page.click('#r3run');
  await page.waitForSelector('#r3after:not([style*="none"])', { timeout: 20000 });
  console.log('s3 count:', await page.textContent('#r3count'), 'ring:', await page.textContent('#cNum'), await hud());
  await page.locator('#s3 .sim').screenshot({ path: SP + '1205-s3.png' });
  await page.fill('#calcIn', '100000'); await page.click('#calcBtn');
  console.log('calc wrong:', await page.textContent('#calcEx'));
  await page.fill('#calcIn', '200,000'); await page.click('#calcBtn');
  await page.waitForSelector('#labWrap:not([style*="none"])');
  const setRange = async (sel, v) => page.$eval(sel, (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  await setRange('#xIn', 10);
  console.log('x=10 flips', await page.textContent('#flipVal'), 'ghost', await page.textContent('#ghostVal'));
  await setRange('#xIn', 65);
  console.log('x=65 flips', await page.textContent('#flipVal'), 'ghost', await page.textContent('#ghostVal'));
  await setRange('#hIn', 3); await setRange('#xIn', 5);
  console.log('h=3,x=5 warn:', await page.textContent('#labWarn'), 'flips', await page.textContent('#flipVal'));
  await setRange('#hIn', 5); await setRange('#xIn', 30);
  console.log('book flips', await page.textContent('#flipVal'), 'ghost', await page.textContent('#ghostVal'), 'load', await page.textContent('#loadVal'));
  await page.locator('#s3 .lab').screenshot({ path: SP + '1205-lab.png' });
  await page.waitForSelector('#s3quiz .opt', { timeout: 5000 });
  await clickOpt('#s3quiz', 'Once 30 seconds pass');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* ---- stage 5 ---- */
  for (const k of ['hb', 'push', 'fetch', 'kv', 'hb', 'fetch']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', 'Presence servers hold websockets; login writes online and last_active_at to KV; heartbeat every 5s, offline after 30s silence; pub/sub per friend pair; big groups fetch on entry.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  const xp1 = await page.evaluate(() => parseInt(document.querySelector('.q-xp').textContent));
  console.log('VICTORY', await page.textContent('#victory h2'), await hud(), 'quest xp', xp1 - xp0);
  console.log('victory stats:', await page.textContent('#victory .vstats'));

  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  p2.on('pageerror', e => errs.push('p2 pageerror: ' + e.message));
  await p2.goto(URL); await p2.waitForTimeout(500);
  await p2.screenshot({ path: SP + '1205-375-dark.png', fullPage: true });
  const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  p3.on('pageerror', e => errs.push('p3 pageerror: ' + e.message));
  await p3.goto(URL); await p3.waitForTimeout(500);
  await p3.screenshot({ path: SP + '1205-1280-light.png', fullPage: true });
  console.log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
