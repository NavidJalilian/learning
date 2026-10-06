const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0905-web-crawler-traps-and-extensibility.html';
const SHOT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/q0905';
require('fs').mkdirSync(SHOT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.goto(FILE); await page.waitForTimeout(300);
  const cleared = n => page.evaluate(n => document.querySelector('#s' + n).classList.contains('cleared'), n);
  const opt = (scope, text) => page.locator(`${scope} .opt`, { hasText: text }).first().click();
  const run = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs?.['0905']);

  // ---- Stage 1
  await page.click('#tray .mod[data-mod="pdf"]');
  await page.click('.sock[data-sock="fetch"]'); // jam
  console.log('jam log:', (await page.textContent('#pipeLog')).includes('Jam'));
  await page.click('.sock[data-sock="parse"]');
  for (const [m, s] of [['png', 'page'], ['mon', 'page'], ['spam', 'rule']]) { await page.click(`#tray .mod[data-mod="${m}"]`); await page.click(`.sock[data-sock="${s}"]`); }
  await page.waitForSelector('#crBox:not(.hidden)');
  await page.click('#crToggles .opt[data-k="dl"]');
  await page.click('#crSubmit');
  console.log('cr wrong:', await page.textContent('#crExplain'));
  await page.click('#crToggles .opt[data-k="dl"]');
  await page.click('#crToggles .opt[data-k="new"]');
  await page.click('#crSubmit');
  await page.waitForSelector('#s1quiz .opt');
  await opt('#s1quiz', 'PNG Downloader and Web Monitor');
  await page.waitForTimeout(1200);
  console.log('stage1 cleared', await cleared(1), await run());

  // ---- Stage 2
  await page.click('#trRun'); // default 2000: too many junk
  await page.waitForFunction(() => !document.querySelector('#trRun').disabled, null, { timeout: 20000 });
  console.log('junk@2000', await page.textContent('#trJunk'));
  await page.$eval('#lenR', e => { e.value = 80; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('#trRun');
  await page.waitForFunction(() => !document.querySelector('#trRun').disabled, null, { timeout: 20000 });
  console.log('lost@80', await page.textContent('#trLost'), 'junk', await page.textContent('#trJunk'));
  await page.$eval('#lenR', e => { e.value = 200; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('#trRun');
  await page.locator('#trapBox .btn', { hasText: 'Round 2' }).click({ timeout: 20000 });
  console.log('junk@200', await page.textContent('#trJunk'));
  await opt('#trapBox', 'No: these URLs never get longer');
  await page.locator('#trapBox .btn', { hasText: 'Crawl the calendar' }).click();
  await page.waitForFunction(() => !document.querySelector('#trFlag').disabled, null, { timeout: 20000 });
  await page.screenshot({ path: SHOT + '/s2-anom-1280.png', clip: await page.locator('#trapSim').boundingBox() });
  await page.click('#trFlag');
  await opt('#trapBox', 'Exclude the whole site');
  await opt('#trapBox', 'Add a custom filter');
  await page.locator('#trapBox .btn', { hasText: 'Round 3' }).click({ timeout: 20000 });
  await page.locator('#trapBox .btn', { hasText: 'Crawl the encyclopedia' }).click();
  await page.waitForFunction(() => !document.querySelector('#trFlag').disabled, null, { timeout: 20000 });
  await page.click('#trFlag');
  await opt('#trapBox', 'Let it through');
  await page.waitForSelector('#s2quiz .opt');
  await opt('#s2quiz', 'Set a maximum length for URLs');
  await page.waitForSelector('#s2quiz .quiz:nth-of-type(2) .opt', { timeout: 5000 });
  await opt('#s2quiz .quiz:nth-of-type(2)', 'Big real sites have huge page counts too');
  await page.waitForTimeout(1500);
  console.log('stage2 cleared', await cleared(2), await run());

  // ---- reload mid-quest
  await page.reload(); await page.waitForTimeout(500);
  console.log('after reload: banner', await page.isVisible('.banner.resume'), 'c1', await cleared(1), 'c2', await cleared(2), 'c3', await cleared(3), 'hearts', await page.$$eval('.hud .heart:not(.lost)', x => x.length));

  // ---- Stage 3
  const ANS = { 'City opens new river bridge': 'dup', 'Index of': 'trap', 'Win a phone': 'noise', 'cheap shoes cheap': 'noise', 'Council votes on new bike lanes (print)': 'dup', 'Council votes on new bike lanes': 'keep', 'Archive, page': 'trap', 'Download our FREE': 'noise', 'Trail Shoe X2': 'keep', 'Shoes': 'dup', 'Posts tagged': 'trap', 'Lemon risotto': 'keep' };
  for (let i = 0; i < 12; i++) {
    await page.waitForSelector('#cardSlot .pcard h4');
    const h = await page.textContent('#cardSlot .pcard h4');
    const key = Object.keys(ANS).find(k => h.startsWith(k));
    let a = ANS[key];
    if (i === 0) a = a === 'keep' ? 'noise' : 'keep'; // one warm-up mistake
    await page.click(`#bins .bin[data-k="${a}"]`);
    await page.waitForTimeout(650);
  }
  console.log('belt score', await page.textContent('#beltScore'), 'hearts', await page.$$eval('.hud .heart:not(.lost)', x => x.length));
  await page.waitForSelector('#s3quiz .opt');
  await opt('#s3quiz', 'Hashes or checksums');
  await page.waitForTimeout(1200);
  console.log('stage3 cleared', await cleared(3));

  // ---- Stage 4
  await page.click('#exRaw');
  await page.click('#runJs');
  await page.waitForFunction(() => !document.querySelector('#exDom').disabled, null, { timeout: 10000 });
  await page.click('#exDom');
  console.log('dom found', await page.textContent('#domFound'));
  for (const t of ['Render JavaScript', 'Filter out spam', 'Replicate and shard', 'Keep crawl servers stateless', 'Add analytics']) await opt('#wcards', t);
  await page.waitForSelector('#s4quiz .opt');
  await opt('#s4quiz', 'Scripts build the links');
  await page.waitForSelector('#s4quiz .quiz:nth-of-type(2) .opt', { timeout: 5000 });
  await opt('#s4quiz .quiz:nth-of-type(2)', 'Keep the crawl servers stateless');
  await page.waitForTimeout(1500);
  console.log('stage4 cleared', await cleared(4));

  // ---- Stage 5 boss
  for (const a of ['trap', 'render', 'module', 'noise', 'dup', 'trap', 'module', 'noise']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForTimeout(500);
  console.log('stage5 cleared', await cleared(5));

  // ---- Stage 6 drill
  await page.fill('#drill textarea', 'Duplicates via hashing, spider traps via max URL length plus anomaly detection and human review, noise via anti-spam filter. New content types are plug-in modules like a PNG downloader. With more time: render JavaScript, shard storage, stateless servers, analytics.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForTimeout(1500);
  console.log('stage6 cleared', await cleared(6));
  console.log('victory shown', await page.isVisible('#victory.show'));
  console.log('lessons', await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).lessons['0905']));
  console.log('errors', errs);

  // ---- mobile dark screenshots (fresh context)
  const m = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const mp = await m.newPage();
  mp.on('pageerror', e => errs.push('m pageerror: ' + e.message));
  await mp.goto(FILE); await mp.waitForTimeout(400);
  await mp.click('#tray .mod[data-mod="png"]'); await mp.click('.sock[data-sock="page"]');
  await mp.click('#tray .mod[data-mod="mon"]');
  await mp.click('#trRun');
  await mp.waitForTimeout(2500);
  await mp.click('#exRaw'); await mp.click('#runJs'); await mp.waitForTimeout(1800); await mp.click('#exDom');
  for (const s of ['s1', 's2', 's3', 's4', 's5']) await mp.locator('#' + s).screenshot({ path: `${SHOT}/m-${s}.png` });
  await mp.screenshot({ path: SHOT + '/m-full.png', fullPage: true });
  console.log('mobile overflow', await mp.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  console.log('errors after mobile', errs);
  await browser.close();
})();
