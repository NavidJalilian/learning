const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1004-notification-guardrails.html';
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
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };
  const shot = async (sel, name) => { await page.locator(sel).screenshot({ path: SP + name }); };

  /* ---- stage 2 first (any order) ---- */
  for (const [id, v] of [['m1', 'pass'], ['m2', 'block'], ['m3', 'pass'], ['m4', 'block'], ['m5', 'pass'], ['m6', 'block']])
    await page.click(`#gate .grw[data-id="${id}"] .seg button[data-v="${v}"]`);
  await page.click('#gateRun');
  await page.waitForSelector('#realBtn:not(.hide):not([disabled])', { timeout: 10000 });
  console.log('gate log:', await page.textContent('#gateLog'));
  await page.click('#realBtn');
  await page.waitForSelector('#s2quiz .opt', { timeout: 10000 });
  console.log('flips:', await page.evaluate(() => [...document.querySelectorAll('#gate .grw.flip')].map(r => r.dataset.id).join(',')));
  await shot('#s2', '1004-s2.png');
  await clickOpt('#s2quiz', 'Before sending');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());

  /* ---- reload: resume ---- */
  await page.reload(); await page.waitForTimeout(500);
  console.log('resume:', await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s2: document.querySelector('#s2').classList.contains('cleared'), text: (document.querySelector('.banner') || {}).textContent })), await hud());

  /* ---- stage 1 ---- */
  await page.click('#tplSend'); // empty -> warning
  console.log('empty send log:', (await page.textContent('#tplLog')).slice(-90));
  await page.click('#s1 .sugg[data-for="pItem"]');
  await page.fill('#pDate', 'Oct 31');
  await page.click('#tplSend');
  await shot('#s1 .sim', '1004-s1.png');
  // flag only the missing-date one (miss the swapped one) -> heart lost
  await page.locator('#outbox .obx[data-id="b"]').click();
  await page.click('#shipBtn');
  console.log('ship:', await page.textContent('#shipEx'));
  await clickOpt('#guardBox', 'present and well-formed');
  await page.waitForSelector('#s1quiz .opt', { timeout: 5000 });
  await clickOpt('#s1quiz', 'guarantee');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());

  /* ---- stage 3 ---- */
  await page.click('#capPlay');
  await page.waitForFunction(() => !document.querySelector('#capPlay').disabled, null, { timeout: 20000 });
  console.log('run1:', await page.textContent('#capVerdict'));
  await page.$eval('#capSlider', el => { el.value = '4'; el.dispatchEvent(new Event('input')); });
  await page.click('#capPlay');
  await page.waitForFunction(() => !document.querySelector('#capPlay').disabled, null, { timeout: 20000 });
  console.log('run2 (cap 4, no bypass):', await page.textContent('#capVerdict'));
  await page.click('#bypass');
  await page.click('#capPlay');
  await page.waitForFunction(() => !document.querySelector('#capPlay').disabled, null, { timeout: 20000 });
  console.log('run3 (cap 4, bypass):', await page.textContent('#capVerdict'));
  await shot('#s3 .sim', '1004-s3.png');
  await page.waitForSelector('#s3quiz .opt', { timeout: 5000 });
  await clickOpt('#s3quiz', 'switch notifications off');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* ---- stage 4 ---- */
  for (const allow of [true, false, false, true]) {
    await page.waitForSelector('#dAllow:not([disabled])');
    await page.click(allow ? '#dAllow' : '#dReject');
    await page.waitForTimeout(700);
  }
  console.log('door:', (await page.textContent('#dLog')).slice(0, 200));
  // a wrong slot first
  await page.click('#lifeSim .tile[data-k="click"]');
  await page.click('#lifeSim .slot[data-k="start"]');
  console.log('wrong slot msg:', await page.textContent('#lifeSim .tinfo'));
  // place one by drag
  const tile = page.locator('#lifeSim .tile[data-k="start"]'), slot = page.locator('#lifeSim .slot[data-k="start"]');
  await tile.scrollIntoViewIfNeeded();
  const tb = await tile.boundingBox();
  await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2); await page.mouse.down();
  await slot.scrollIntoViewIfNeeded();
  const sb2 = await slot.boundingBox(), tb2 = await tile.boundingBox();
  await page.mouse.move(tb2.x + tb2.width / 2, tb2.y + tb2.height / 2);
  await page.mouse.move(tb2.x + tb2.width / 2 + 20, tb2.y + tb2.height / 2 - 20, { steps: 3 });
  await page.mouse.move(sb2.x + sb2.width / 2, sb2.y + sb2.height / 2, { steps: 8 });
  await page.mouse.up();
  console.log('drag placed start?', await page.evaluate(() => document.querySelector('#lifeSim .slot[data-k="start"]').classList.contains('filled')));
  for (const k of ['start', 'pending', 'sent', 'delivered', 'click', 'unsub', 'error']) {
    if (await page.evaluate(k => document.querySelector(`#lifeSim .slot[data-k="${k}"]`).classList.contains('filled'), k)) continue;
    await page.click(`#lifeSim .tile[data-k="${k}"]`);
    await page.click(`#lifeSim .slot[data-k="${k}"]`);
  }
  await shot('#lifeSim', '1004-life.png');
  await page.fill('#cDel', '95'); await page.fill('#cClk', '3'); await page.fill('#cUns', '0.26');
  await page.click('#calcBtn');
  console.log('calc hint (wrong):', await page.textContent('#hClk'));
  await page.fill('#cClk', '4');
  await page.click('#calcBtn');
  await page.waitForSelector('#s4quiz .opt', { timeout: 5000 });
  await clickOpt('#s4quiz', 'only verified clients');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());

  /* ---- stage 5 ---- */
  await page.click('#dzSim .tile[data-k="rate"]');
  await page.click('#dzSim .slot[data-k="retry"]');
  console.log('too-late msg:', await page.textContent('#dzSim .tinfo'));
  for (const k of ['auth', 'rate', 'tpl', 'retry', 'log', 'ana']) {
    await page.click(`#dzSim .tile[data-k="${k}"]`);
    await page.click(`#dzSim .slot[data-k="${k}"]`);
  }
  await shot('#dzSim', '1004-s5.png');
  await page.waitForSelector('#s5quiz .opt', { timeout: 5000 });
  await clickOpt('#s5quiz', 'On the notification servers');
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* ---- stage 6 ---- */
  for (const k of ['auth', 'rate', 'opt', 'tpl', 'tpl', 'auth']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForSelector('#s6.cleared', { timeout: 5000 });
  console.log('after s6', await hud());

  /* ---- stage 7 ---- */
  await page.fill('#drill textarea', 'Auth with appKey and appSecret on the notification servers, opt-in settings check before enqueue, per-user rate limits so users do not switch off, templates with validated parameters, and events tracked into an analytics service.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY', await page.textContent('#victory h2'), await hud());

  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  await p2.goto(URL); await p2.waitForTimeout(500);
  await p2.screenshot({ path: SP + '1004-375-dark.png', fullPage: true });
  const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p3.goto(URL); await p3.waitForTimeout(500);
  await p3.screenshot({ path: SP + '1004-1280-light.png', fullPage: true });

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
