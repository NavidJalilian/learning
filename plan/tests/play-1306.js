const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1306-boss-autocomplete-live.html';
const DIR = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(300);
  const log = (...a) => console.log(...a);
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const run = () => page.evaluate(() => (JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['1306']);
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };

  /* ---- stage 1 ---- */
  await clickOpt('#s1open', 'Ask questions to pin down');
  await page.locator('#qdeck .opt').first().waitFor();
  await page.locator('#qdeck .opt', { hasText: 'logo' }).click(); // time-waster
  for (const q of ['start of a query', 'How many suggestions', 'pick which five', 'spell check', 'in English', 'capitals', 'How many users']) {
    await page.locator('#qdeck .opt', { hasText: q }).click(); await page.waitForTimeout(100);
  }
  await page.locator('#s1nfr .opt').first().waitFor({ timeout: 8000 });
  await clickOpt('#s1nfr', 'Under 100 ms');
  await page.locator('#inQps').waitFor({ timeout: 8000 });
  await page.fill('#inQps', '2400'); await page.fill('#inPeak', '48000'); await page.fill('#inStore', '0.4');
  await page.click('#estGo');
  log('after wrong estimate hearts =', await hearts());
  await page.fill('#inQps', '24000'); await page.click('#estGo');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  log('stage 1 cleared', JSON.stringify(await run()), 'clock', await page.textContent('#ivClock'));

  /* ---- stage 2 ---- */
  await page.click('#tiles2 .opt[data-k="query"]'); // dependency missing -> -1 min
  await page.click('#tiles2 .opt[data-k="spell"]'); // decoy -> heart
  for (const k of ['user', 'gather', 'freq', 'query']) await page.click(`#tiles2 .opt[data-k="${k}"]`);
  log('wb2 wires:', await page.evaluate(() => document.querySelectorAll('#wb2 .wire').length), await page.textContent('#wb2Status'));
  await page.locator('#s2q .opt').first().waitFor({ timeout: 10000 });
  log('sql top rows:', await page.evaluate(() => document.querySelectorAll('#s2sql tr.top').length));
  await clickOpt('#s2q', 'No: each keystroke');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  log('stage 2 cleared', JSON.stringify(await run()), 'hearts', await hearts());

  /* ---- reload mid-quest ---- */
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), s2: document.querySelector('#s2').classList.contains('cleared'), clock: document.querySelector('#ivClock').textContent, hearts: document.querySelectorAll('.hud .heart:not(.lost)').length }));
  log('after reload:', JSON.stringify(resume));
  if (!resume.banner || !resume.s1 || !resume.s2) errs.push('resume failed');

  /* ---- stage 3 ---- */
  await page.click('#tiles3 .opt[data-k="workers"]'); // out of order
  for (const k of ['logs', 'agg', 'aggd', 'workers', 'triedb', 'smm', 'browser', 'lb', 'api', 'filter', 'cache']) await page.click(`#tiles3 .opt[data-k="${k}"]`);
  log('wb3:', await page.textContent('#wb3Status'), 'wires', await page.evaluate(() => document.querySelectorAll('#wb3 .wire').length));
  await page.locator('#palette .opt').first().waitFor({ timeout: 10000 });
  const GA = { 'Top 5 in under': 'trie', 'Fewer requests': 'browser', 'Logs grow': 'sample', 'Fresh enough': 'weekly', 'harmful suggestion': 'filter', 'outgrows one': 'shard', 'far more traffic': 'shard', 'cache server goes': 'db' };
  let first = true;
  for (let i = 0; i < 8; i++) {
    await page.waitForFunction(i => document.querySelector('#goalcard .k') && document.querySelector('#goalcard .k').textContent.startsWith(`Problem ${i + 1} `), i, { timeout: 5000 });
    const g = await page.textContent('#goalcard h3');
    const k = Object.entries(GA).find(([s]) => g.includes(s))[1];
    if (first) { first = false; await page.click('#palette .opt[data-t="sql"]'); await page.click('#mapNext .btn'); continue; }
    await page.click(`#palette .opt[data-t="${k}"]`);
  }
  await page.waitForSelector('#s3.cleared', { timeout: 6000 });
  log('stage 3 cleared', JSON.stringify(await run()), 'hearts', await hearts(), 'rows', await page.evaluate(() => document.querySelectorAll('#tmap tbody tr').length));
  await page.locator('#wb3').scrollIntoViewIfNeeded();
  await page.locator('#s3').screenshot({ path: DIR + '1306-s3-375-dark.png' });

  /* ---- stage 4 ---- */
  for (let i = 0; i < 9; i++) {
    await page.click('#barrage .opts .opt[data-i="0"]');
    await page.click('#barrage .q-arena .btn.primary');
  }
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  log('stage 4 cleared', JSON.stringify(await run()), 'hearts', await hearts());

  /* ---- stage 5 ---- */
  await clickOpt('#wrapcards', 'Unicode'); await clickOpt('#wrapcards', 'per country'); await clickOpt('#wrapcards', 'streaming path');
  await page.click('#deliver');
  await page.waitForSelector('#s5.cleared', { timeout: 10000 });
  log('stage 5 cleared', JSON.stringify(await run()), 'hearts', await hearts());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', Array.from({ length: 60 }, (_, i) => 'word' + i).join(' '));
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 6000 });
  const end = await page.evaluate(() => ({ lesson: JSON.parse(localStorage.getItem('sdq:v1')).lessons['1306'], iv: Object.keys(JSON.parse(localStorage.getItem('sdq:v1:1306-interview') || '{}')), score: document.querySelector('.sc-overall') && document.querySelector('.sc-overall').textContent.replace(/\s+/g, ' '), review: (document.querySelector('.sc-review') || {}).textContent, overflow: document.documentElement.scrollWidth - innerWidth }));
  log('VICTORY', JSON.stringify(end));
  await page.locator('#scorecard').screenshot({ path: DIR + '1306-score-375-dark.png' });
  await page.screenshot({ path: DIR + '1306-375-dark.png', fullPage: true });

  /* ---- review mode reload ---- */
  await page.reload(); await page.waitForTimeout(600);
  log('review banner:', await page.evaluate(() => !!document.querySelector('.banner') && !document.querySelector('.banner.resume')), 'victory shown:', await page.evaluate(() => document.querySelector('#victory').classList.contains('show')));

  /* ---- desktop light shot of stage 2 + 3 ---- */
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const p2 = await ctx2.newPage(); p2.on('pageerror', e => errs.push('pageerror(light): ' + e.message));
  await p2.goto(FILE); await p2.waitForTimeout(300);
  for (const k of ['logs', 'agg', 'aggd', 'workers', 'triedb', 'smm', 'browser', 'lb', 'api', 'filter', 'cache']) await p2.click(`#tiles3 .opt[data-k="${k}"]`);
  for (const k of ['user', 'gather', 'freq', 'query']) await p2.click(`#tiles2 .opt[data-k="${k}"]`);
  await p2.waitForTimeout(2500);
  await p2.locator('#s2 .sim').screenshot({ path: DIR + '1306-wb2-1280-light.png' });
  await p2.locator('#s3 .sim').screenshot({ path: DIR + '1306-wb3-1280-light.png' });
  log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})();
