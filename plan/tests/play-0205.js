const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0205-boss-estimation-gauntlet.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(500);
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const xp = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs?.['0205']?.xp);
  const cleared = () => page.evaluate(() => [...document.querySelectorAll('.stage.cleared')].map(s => +s.dataset.stage));
  const clickText = async (sel, text) => { await page.locator(sel, { hasText: text }).first().click(); };
  const ofl = () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

  /* stage 1 */
  await page.waitForSelector('#qdeck .opt');
  await clickText('#qdeck .opt', 'Which database');
  for (const t of ['monthly active', 'active daily', 'posts does a daily', 'carry media', 'keep all the data', 'load their timeline']) { await clickText('#qdeck .opt', t); }
  await page.waitForSelector('#s1q .opt', { timeout: 8000 });
  console.log('s1 notes:', await page.$$eval('#stageNotes .note:not(.empty)', e => e.length), 'clock', await page.textContent('#ivClock'));
  await clickText('#s1q .opt', 'Say your assumptions');
  await page.waitForTimeout(1300);
  console.log('after s1: cleared', await cleared(), 'hearts', await hearts(), 'xp', await xp(), 'clock', await page.textContent('#ivClock'), 'board', await page.textContent('#boardCount'));

  /* reload mid-quest */
  await page.reload(); await page.waitForTimeout(600);
  console.log('resume banner:', await page.$eval('.banner.resume', e => e.textContent.trim().slice(0, 70)).catch(() => 'NONE'), 'cleared', await cleared(), 'xp', await xp(), 'clock', await page.textContent('#ivClock'), 'board', await page.textContent('#boardCount'));
  await page.click('#boardBtn');
  console.log('board panel notes:', await page.$$eval('#barNotes .note:not(.empty)', e => e.length));
  await page.screenshot({ path: SP + '/0205-board-375-dark.png' });
  await page.click('#boardBtn');

  /* stage 2 */
  await page.click('#ptiles .opt[data-k="srv"]'); // out of order
  console.log('plan status:', await page.textContent('#planStatus'));
  for (const k of ['dau', 'wq', 'pw', 'rq', 'sd', 's5', 'cache', 'srv']) await page.click(`#ptiles .opt[data-k="${k}"]`);
  await page.waitForSelector('#s2q .opt', { timeout: 8000 });
  await page.locator('#s2 .sim').screenshot({ path: SP + '/0205-s2-375-dark.png' });
  await clickText('#s2q .opt', 'app servers');
  await page.waitForTimeout(1300);
  console.log('after s2: cleared', await cleared(), 'hearts', await hearts(), 'xp', await xp(), 'clock', await page.textContent('#ivClock'));

  /* stage 3 */
  const entries = [['150m', 'users'], ['3472', '/s'], ['7000', ''], ['35000', '/s'], ['30', 'TB'], ['55', 'GB'], ['60', 'GB'], ['50', 'servers']];
  for (let i = 0; i < 8; i++) {
    const row = page.locator(`#wb .wrow[data-i="${i}"]`);
    if (i === 1) await row.locator('.q-hint').click();
    await row.locator('input').fill(entries[i][0]);
    if (entries[i][1]) await row.locator('select').selectOption(entries[i][1]);
    if (i % 2) await row.locator('input').press('Enter'); else await row.locator('.q-check').click();
    await page.waitForTimeout(100);
  }
  console.log('rows:', await page.$$eval('#wb .wrow', e => e.map(r => (r.className.match(/\b[gar]\b/) || ['?'])[0]).join('')), 'round chip:', await page.$$eval('.rchip', e => e.length));
  await page.waitForSelector('#s3q .opt', { timeout: 8000 });
  await page.locator('#s3 .wb').screenshot({ path: SP + '/0205-s3-375-dark.png' });
  await clickText('#s3q .opt', '300 million');
  await page.waitForTimeout(1300);
  console.log('after s3: cleared', await cleared(), 'hearts', await hearts(), 'xp', await xp(), 'clock', await page.textContent('#ivClock'), 'over?', await page.$eval('#ivbar', e => e.classList.contains('over')));

  /* stage 4 */
  for (let i = 0; i < 7; i++) {
    const k = i === 1 ? 'b' : 'a';
    await page.click(`#barrage .choice .opt[data-c="${k}"]`);
    await page.click('#barrage .q-arena .row .btn.primary');
  }
  await page.waitForTimeout(800);
  console.log('after s4: cleared', await cleared(), 'boss', await page.textContent('#barrage .scenario p'), 'hearts', await hearts(), 'xp', await xp());

  /* stage 5 */
  const P = ['~7,000', '~35,000', '~60 GB', '~55 PB', '~350 MB', '~50 app'];
  await clickText('#match .mchip', P[0]);
  await page.click('#match .mcard[data-i="1"]'); // wrong
  console.log('match hint:', (await page.textContent('#matchStatus')).slice(0, 60));
  for (let i = 0; i < 6; i++) { await clickText('#match .mchip', P[i]); await page.click(`#match .mcard[data-i="${i}"]`); }
  console.log('links drawn:', await page.$$eval('#match svg.links path:not(.bad)', e => e.length));
  await page.waitForSelector('#closing .slot', { timeout: 8000 });
  for (let s = 0; s < 4; s++) {
    // pick the strong one (data-j=0) except slot 2
    await page.click(`#closing .slot[data-s="${s}"] .opt[data-j="${s === 2 ? 1 : 0}"]`);
  }
  await page.waitForSelector('#s5q .opt', { timeout: 8000 });
  console.log('speech:', (await page.textContent('#speech')).slice(0, 160));
  await page.locator('#s5 .stage-b').screenshot({ path: SP + '/0205-s5-375-dark.png' });
  await clickText('#s5q .opt', 'object storage');
  await page.waitForTimeout(1500);
  console.log('after s5: cleared', await cleared(), 'hearts', await hearts(), 'xp', await xp(), 'last chat', (await page.$$eval('#chat5 .msg', e => e.at(-1).textContent)).slice(0, 80));

  /* stage 6 */
  await page.fill('#drill textarea', 'I state assumptions first: 300 million MAU, half daily, two posts a day, 10% media at 1 MB, five years, ten timeline loads. That gives 150 million DAU, 3,500 writes per second, 7,000 peak, 17,000 reads per second, 30 TB a day, 55 PB in five years, 60 GB cache, 50 servers.');
  await page.click('#drill .q-reveal');
  const boxes = page.locator('#drill .selfgrade input');
  for (let i = 0; i < 5; i++) await boxes.nth(i).check();
  await page.click('#drill .q-finish');
  await page.waitForTimeout(1800);
  console.log('scorecard:', (await page.textContent('#scorecard .sc-overall')).replace(/\s+/g, ' '));
  console.log('cleared', await cleared(), 'victory', await page.$eval('#victory', e => e.classList.contains('show')), 'hearts', await hearts());
  console.log('stored lesson:', await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('sdq:v1')).lessons['0205'])));
  console.log('overflow', await ofl());
  await page.locator('#scorecard').screenshot({ path: SP + '/0205-s6-375-dark.png' });
  await page.screenshot({ path: SP + '/0205-375-dark-full.png', fullPage: true });

  /* review mode reload */
  await page.reload(); await page.waitForTimeout(600);
  console.log('review banner:', await page.$eval('.banner', e => e.textContent.trim().slice(0, 50)).catch(() => 'NONE'), 'victory', await page.$eval('#victory', e => e.classList.contains('show')));

  /* light mode desktop look */
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce' });
  const p2 = await ctx2.newPage(); p2.on('pageerror', e => errs.push('p2: ' + e.message));
  await p2.goto(FILE); await p2.waitForTimeout(500);
  await p2.locator('#s2').screenshot({ path: SP + '/0205-s2-1280-light.png' });
  console.log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
})();
