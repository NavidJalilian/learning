const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1501-drive-scope-and-apis.html';
const SHOT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/1501-375-dark.png';
const reduced = process.argv[2] !== 'motion';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE);
  const btn = (scope, text) => page.locator(scope).locator('button', { hasText: text }).first();
  const click = async (scope, text) => { const b = btn(scope, text); await b.waitFor({ state: 'visible', timeout: 20000 }); await b.click(); };
  const cleared = () => page.evaluate(() => [...document.querySelectorAll('.stage.cleared')].map(s => +s.dataset.stage));
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const waitCleared = async n => { await page.waitForFunction(n => document.querySelector('#s' + n).classList.contains('cleared'), n, { timeout: 30000 }); console.log('stage', n, 'cleared · hearts', await hearts()); };

  /* stage 1 */
  const MAP = { 'Drag & drop upload': 'F', 'Download a file': 'F', 'Sync across my laptop and phone': 'F', 'See old revisions': 'F', 'Share with a coworker': 'F', 'Notify me when a shared file is edited': 'F', 'Two people typing in the same doc, live': 'O', 'Encrypt files at rest': 'N', 'Reject files over 10 GB': 'F', 'Built-in photo editor': 'O', 'Never lose a byte': 'N', 'Sync must feel fast': 'N' };
  let wrongOnce = true;
  for (let k = 0; k < 12; k++) {
    await page.waitForSelector('#dealt .fcard.drop, #dealt .fcard.shake', { timeout: 10000 });
    await page.waitForFunction(() => !document.querySelector('#bins .binbtn').disabled);
    const t = (await page.locator('#dealt .fcard b').textContent()).trim();
    let bin = MAP[t];
    if (!bin) throw new Error('unknown card ' + t);
    if (wrongOnce && t === 'Built-in photo editor') { bin = 'F'; wrongOnce = false; }
    const before = await page.locator('#dealt .fcard b').textContent();
    await page.click(`#bins .binbtn[data-b="${bin}"]`);
    if (k < 11) await page.waitForFunction(b => document.querySelector('#dealt .fcard b').textContent !== b, before, { timeout: 10000 });
  }
  console.log('sorted; hearts', await hearts(), 'tray:', await page.textContent('#trayCount'));
  await click('#nfr', 'Reliability');
  await click('#s1quiz', 'live co-editing');
  await waitCleared(1);

  /* stage 2 */
  const answers = ['600', '500', '231', '480', '10'];
  // first deliberately wrong on card 1 (600), then correct
  await page.fill('#calc input', '100'); await page.click('#calc .q-check');
  console.log('slip msg:', (await page.textContent('#calc .explain')).slice(0, 80));
  for (const [i, v] of [[0, '500'], [1, '231'], [2, '480'], [3, '10']].entries()) {
    await page.fill('#calc input', v[1]); await page.press('#calc input', 'Enter');
    await page.waitForSelector('#calc .explain.good');
    const label = i < 2 ? 'Next card' : i === 2 ? 'Bonus card' : 'Finish';
    await click('#calc', label);
  }
  await click('#s2quiz', 'Quota is promised');
  await waitCleared(2);

  /* reload mid-quest */
  await page.reload();
  await page.waitForSelector('.banner.resume');
  console.log('after reload: banner =', (await page.textContent('.banner.resume')).trim().slice(0, 70), '| cleared', await cleared(), '| hearts', await hearts());

  /* stage 3 */
  for (const d of ['up', 'down', 'rev']) await page.click(`#doors .door[data-d="${d}"]`);
  await page.click('#upGo');
  await page.waitForSelector('#s3goals [data-g="simple"].done', { timeout: 30000 });
  await page.click('#modeSeg button[data-m="resumable"]');
  await page.click('#upGo');
  await page.waitForSelector('#upResume', { state: 'visible', timeout: 30000 });
  await page.click('#upResume');
  await page.waitForSelector('#s3goals [data-g="resumable"].done', { timeout: 30000 });
  console.log('upload log tail:', (await page.locator('#uplog div').nth(-3).textContent()).trim());
  await click('#photoBox', 'Simple: one request');
  await page.waitForSelector('#order.on');
  for (const t of ['Send the first request', 'Upload the data in chunks', 'After a drop']) await click('#order', t);
  await click('#s3quiz', 'limit:');
  await waitCleared(3);

  /* stage 4 */
  await page.click('#fillBtn');
  await click('#abox', 'Shard files by user_id');
  await click('#abox', 'Round 2');
  await click('#abox', 'Every file of the users');
  await click('#abox', 'Move the files to S3');
  await click('#abox', 'Take Region A offline');
  await click('#abox', 'Round 3');
  await page.locator('#arch g[role="button"][aria-label^="S3 in region A"]').click();
  await page.locator('#arch g[role="button"][aria-label^="Web server"]').click();
  await click('#spof', 'A load balancer plus');
  await page.waitForSelector('#spof .explain.show');
  await page.locator('#arch g[role="button"][aria-label^="MySQL"]').click();
  await click('#spof', 'Move it off the box');
  await click('#s4quiz', 'It survives a whole region');
  await waitCleared(4);

  /* stage 5 */
  for (let k = 0; k < 5; k++) {
    await page.locator('#boss .choice .opt[data-c="a"]').click();
    await click('#boss', k < 4 ? 'Next' : 'Final blow');
  }
  await waitCleared(5);

  /* stage 6 */
  await page.fill('#drill textarea', 'I would scope upload download sync revisions sharing notifications, leave out co-editing, reliability first, 500 PB, 240 QPS peak 480, resumable upload, auth and HTTPS.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.locator('#drill .selfgrade input').all()) await cb.check();
  await page.click('#drill .q-finish');
  await waitCleared(6);

  await page.waitForSelector('#victory.show', { timeout: 10000 });
  const v = await page.evaluate(() => ({ text: document.querySelector('#victory').innerText.replace(/\s+/g, ' ').slice(0, 200), store: JSON.parse(localStorage.getItem('sdq:v1')).lessons['1501'] }));
  console.log('VICTORY:', v.text, JSON.stringify(v.store));
  await page.evaluate(() => document.querySelector('#s4').scrollIntoView());
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOT, fullPage: false });
  await page.evaluate(() => document.querySelector('#s3').scrollIntoView());
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOT.replace('.png', '-s3.png') });
  await page.evaluate(() => document.querySelector('#s1 .tray').scrollIntoView());
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOT.replace('.png', '-s1.png') });
  await page.evaluate(() => document.querySelector('#rack').scrollIntoView());
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOT.replace('.png', '-s2.png') });
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('overflowX', ov, '| errors:', errs.length ? errs : 'none');
  await browser.close();
  process.exit(errs.length || ov > 1 ? 1 : 0);
})().catch(e => { console.error('FAILED', e); process.exit(1); });
