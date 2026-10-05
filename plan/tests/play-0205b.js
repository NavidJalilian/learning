// Finisher check for 0205: carried slips (stage 3), repeat-miss-free links (stage 5), verdict caps.
const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0205-boss-estimation-gauntlet.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  async function fresh() {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
    await page.goto(FILE); await page.waitForTimeout(400);
    return page;
  }
  const hearts = p => p.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const rec = p => p.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1:0205-interview') || '{}'));

  /* A: stage 3 carried slip: DAU off by 10x, then every downstream row computed from it */
  let page = await fresh();
  const ent = [['15m', 'users'], ['347', '/s'], ['694', '/s'], ['1736', '/s'], ['3', 'TB'], ['5.5', 'PB'], ['6', 'GB'], ['5', 'servers']];
  for (let i = 0; i < 8; i++) {
    const row = page.locator(`#wb .wrow[data-i="${i}"]`);
    await row.locator('input').fill(ent[i][0]); await row.locator('select').selectOption(ent[i][1]);
    await row.locator('.q-check').click(); await page.waitForTimeout(60);
  }
  console.log('A rows:', await page.$$eval('#wb .wrow', e => e.map(r => (r.className.match(/\b[gar]\b/) || ['?'])[0]).join('')),
    'carried msgs:', await page.$$eval('#wb .wres', e => e.filter(x => /Carried slip/.test(x.textContent)).length),
    'hearts', await hearts(page), 'miss', (await rec(page))[3]?.miss);
  console.log('A bonus:', (await page.textContent('#s3bonus')).slice(0, 70));

  /* B: stage 5: three wrong links on the same number = one heart */
  page = await fresh();
  const chip = page.locator('#match .mchip[data-i="0"]');
  for (const j of [1, 2, 3]) { await chip.click(); await page.click(`#match .mcard[data-i="${j}"]`); await page.waitForTimeout(50); }
  console.log('B hearts after 3 misses on one number:', await hearts(page), 'status:', (await page.textContent('#matchStatus')).slice(0, 40), 'miss', (await rec(page))[5]?.miss);
  await page.locator('#match .mchip[data-i="1"]').click(); await page.click('#match .mcard[data-i="0"]');
  console.log('B hearts after a miss on a second number:', await hearts(page));

  /* C: clean fast run: verdict should be Strong hire */
  page = await fresh();
  for (const t of ['monthly active', 'active daily', 'posts does a daily', 'carry media', 'keep all the data', 'load their timeline']) await page.locator('#qdeck .opt', { hasText: t }).first().click();
  await page.waitForSelector('#s1q .opt'); await page.locator('#s1q .opt', { hasText: 'Say your assumptions' }).click(); await page.waitForTimeout(1100);
  for (const k of ['dau', 'wq', 'pw', 'rq', 'sd', 's5', 'cache', 'srv']) await page.click(`#ptiles .opt[data-k="${k}"]`);
  await page.waitForSelector('#s2q .opt'); await page.locator('#s2q .opt', { hasText: 'app servers' }).click(); await page.waitForTimeout(1100);
  const good = [['150m', 'users'], ['3500', '/s'], ['7000', '/s'], ['17000', '/s'], ['30', 'TB'], ['55', 'PB'], ['60', 'GB'], ['50', 'servers']];
  for (let i = 0; i < 8; i++) { const row = page.locator(`#wb .wrow[data-i="${i}"]`); await row.locator('input').fill(good[i][0]); await row.locator('select').selectOption(good[i][1]); await row.locator('.q-check').click(); await page.waitForTimeout(50); }
  await page.waitForSelector('#s3q .opt'); await page.locator('#s3q .opt', { hasText: '300 million' }).click(); await page.waitForTimeout(1100);
  for (let i = 0; i < 7; i++) { await page.click('#barrage .choice .opt[data-c="a"]'); await page.click('#barrage .q-arena .row .btn.primary'); }
  await page.waitForTimeout(500);
  const P = ['~7,000', '~35,000', '~60 GB', '~55 PB', '~350 MB', '~50 app'];
  for (let i = 0; i < 6; i++) { await page.locator('#match .mchip', { hasText: P[i] }).click(); await page.click(`#match .mcard[data-i="${i}"]`); }
  await page.waitForSelector('#closing .slot');
  for (let s = 0; s < 4; s++) await page.click(`#closing .slot[data-s="${s}"] .opt[data-j="0"]`);
  await page.waitForSelector('#s5q .opt'); await page.locator('#s5q .opt', { hasText: 'object storage' }).click(); await page.waitForTimeout(1300);
  await page.fill('#drill textarea', 'Assumptions first: 300 million MAU, half daily, two posts, ten timeline loads, 10% media at 1 MB, five years. 150 million DAU, 3,500 writes per second, 7,000 peak, 17,000 reads per second, 35,000 peak, 30 TB a day, 55 PB in five years, 165 PB replicated, 60 GB cache, 50 servers, object storage and CDN.');
  await page.click('#drill .q-reveal');
  const boxes = page.locator('#drill .selfgrade input'); for (let i = 0; i < 6; i++) await boxes.nth(i).check();
  await page.click('#drill .q-finish'); await page.waitForTimeout(1500);
  console.log('C scorecard:', (await page.textContent('#scorecard .sc-overall')).replace(/\s+/g, ' '), '| capped note:', await page.$$eval('#scorecard p.small', e => e.length > 1));
  console.log('C victory', await page.$eval('#victory', e => e.classList.contains('show')), 'hearts', await hearts(page));

  /* D: verdict function with an injected record: on time but 6 mistakes; and 3 min over with 0 mistakes */
  for (const [label, mod] of [['6 mistakes, on time', d => { d[3].miss = 6; }], ['3 min over, clean', d => { d[3].sec += 300; }]]) {
    await page.evaluate(m => { const d = JSON.parse(localStorage.getItem('sdq:v1:0205-interview')); (new Function('d', m))(d); localStorage.setItem('sdq:v1:0205-interview', JSON.stringify(d)); }, `(${mod.toString()})(d)`);
    await page.reload(); await page.waitForTimeout(500);
    console.log('D', label, '→', (await page.textContent('#scorecard .sc-overall')).replace(/\s+/g, ' ').slice(0, 140));
    await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('sdq:v1:0205-interview')); d[3].miss = 0; d[3].sec = Math.min(d[3].sec, 200); localStorage.setItem('sdq:v1:0205-interview', JSON.stringify(d)); });
  }
  console.log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
})();
