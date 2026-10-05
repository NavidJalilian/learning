const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1504-drive-upload-download-notify.html';
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

  /* ---- stage 1 ---- */
  // a wrong-lane tap first
  await page.click('#pool .stepc[data-id="b1"] .go[data-l="A"]');
  console.log('wrong-lane msg:', await page.textContent('#bmsg'));
  await page.click('#pool .stepc[data-id="a3"] .go[data-l="A"]');
  console.log('wrong-order msg:', await page.textContent('#bmsg'));
  for (const id of ['a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6']) {
    await page.click(`#pool .stepc[data-id="${id}"] .go[data-l="${id[0].toUpperCase()}"]`);
    await page.waitForSelector(`#pool .stepc[data-id="${id}"]`, { state: 'detached' });
    await page.waitForTimeout(650);
  }
  console.log('build msg:', await page.textContent('#bmsg'), '| note:', await page.textContent('#m1note'));
  await page.screenshot({ path: SP + '1504-s1.png', fullPage: false });
  await clickOpt('#s1pred', 'still uploading');
  await page.waitForSelector('#s1playRow:not([style*="none"])');
  await page.click('#s1play');
  await page.waitForSelector('#s1quiz .opt', { timeout: 15000 });
  await clickOpt('#s1quiz', 'upload-complete callback');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());

  /* ---- reload mid-quest: resume ---- */
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), text: (document.querySelector('.banner') || {}).textContent }));
  console.log('resume:', JSON.stringify(resume), await hud());

  /* ---- stage 2 ---- */
  await page.locator('#map2 .node[data-id="mdb"]').click();
  console.log('wrong hop hint:', await page.textContent('#m2hint'));
  for (const id of ['c2', 'api', 'mdb', 'api', 'c2', 'blk', 's3', 'blk', 'c2']) {
    await page.locator(`#map2 .node[data-id="${id}"]`).click();
    await page.waitForTimeout(650);
  }
  console.log('trace hint:', await page.textContent('#m2hint'));
  await page.click('#offBtn');
  for (let i = 0; i < 3; i++) { await page.click('#editBtn'); await page.waitForTimeout(1600); }
  console.log('obq sub:', await page.textContent('#map2 .node[data-id="obq"] .sb'));
  await page.click('#offBtn');
  await page.waitForSelector('#s2pred .opt', { timeout: 15000 });
  await clickOpt('#s2pred', '2 blocks');
  await page.waitForSelector('#s2quiz .opt', { timeout: 8000 });
  await clickOpt('#s2quiz', 'A signal that something changed');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());

  /* ---- stage 3 ---- */
  await page.click('#tlBtn');
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    const st = await page.evaluate(() => { const b = document.querySelector('#tlBtn'); return { dis: b.disabled, t: b.textContent }; });
    if (/Run it again/.test(st.t)) break;
    if (!st.dis && /Reopen/.test(st.t)) await page.click('#tlBtn');
    await page.waitForTimeout(250);
  }
  console.log('timeline took', Math.round((Date.now() - t0) / 1000), 's; goals:', await page.evaluate(() => [...document.querySelectorAll('#s3goals li.done')].map(l => l.dataset.g).join(',')), '| missed', await page.textContent('#tlMiss'));
  await page.locator('#s3 .tl').screenshot({ path: SP + '1504-tl.png' });
  const items = page.locator('#chooseList .sort-item');
  await items.nth(0).locator('.opt[data-k="lp"]').click();
  await items.nth(1).locator('.opt[data-k="ws"]').click();
  await items.nth(2).locator('.opt[data-k="ws"]').click();
  await page.waitForSelector('#s3quiz .opt', { timeout: 5000 });
  await clickOpt('#s3quiz', 'one-way and infrequent');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  // second run: be slow once to exercise the missed -> catch-up path
  await page.click('#tlBtn');
  let slow = true; const t1 = Date.now();
  while (Date.now() - t1 < 60000) {
    const st = await page.evaluate(() => { const b = document.querySelector('#tlBtn'); return { dis: b.disabled, t: b.textContent }; });
    if (/Run it again/.test(st.t)) break;
    if (!st.dis && /Reopen/.test(st.t)) { if (slow) { await page.waitForTimeout(5500); slow = false; } await page.click('#tlBtn'); }
    await page.waitForTimeout(250);
  }
  console.log('slow run: missed', await page.textContent('#tlMiss'), 'delivered', await page.textContent('#tlOk'));
  console.log('slow log tail:', await page.evaluate(() => [...document.querySelectorAll('#tlLog div')].slice(-6).map(d => d.textContent).join(' || ')));
  await page.locator('#s3 .tl').screenshot({ path: SP + '1504-tl2.png' });
  await page.locator('#s2 .map').screenshot({ path: SP + '1504-map2.png' });

  /* ---- stage 4 ---- */
  for (const k of ['poll', 'pend', 'one', 'q', 'cb']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());

  /* ---- stage 5 ---- */
  await page.fill('#drill textarea', 'Two parallel requests: metadata via API servers marked pending, content via block servers to S3; S3 callback flips to uploaded; notification service pings phone over long polling; phone pulls metadata then blocks; offline queue.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY', await page.textContent('#victory h2'), await hud());
  await page.screenshot({ path: SP + '1504-victory.png' });

  // full-page dark screenshot at 375
  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  await p2.goto(URL); await p2.waitForTimeout(500);
  await p2.screenshot({ path: SP + '1504-375-dark.png', fullPage: true });
  const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p3.goto(URL); await p3.waitForTimeout(500);
  await p3.screenshot({ path: SP + '1504-1280-light.png', fullPage: true });

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
