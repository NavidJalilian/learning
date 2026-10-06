const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1306-boss-autocomplete-live.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
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
  const run = () => page.evaluate(() => JSON.stringify((JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['1306']));
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

  /* ---- stage 3 first (any order) ---- */
  await page.click('#tiles3 .opt[data-k="cache"]'); // out of order
  for (const k of ['logs', 'browser', 'agg', 'lb', 'aggd', 'api', 'workers', 'filter', 'triedb', 'smm', 'cache']) await page.click(`#tiles3 .opt[data-k="${k}"]`);
  log('wb3 status:', await page.textContent('#wb3Status'), 'arrows:', await page.evaluate(() => document.querySelectorAll('#wb3 .ar').length));
  await page.locator('#goalcard h3').waitFor({ timeout: 10000 });
  const MAP = { 'Top 5 in well under 100 ms': 'trie', 'Too many requests from the same users': 'bc', 'Logs are huge': 'samp', 'Fresh enough, without slowing reads': 'week', 'A harmful suggestion appears': 'filt', 'The trie doesn\'t fit on one server': 'shard', 'A Trie Cache server is lost': 'db' };
  for (let i = 0; i < 7; i++) {
    await page.waitForFunction(i => document.querySelector('#goalcard .k') && document.querySelector('#goalcard .k').textContent.includes(`Card ${i + 1} `), i, { timeout: 8000 });
    const g = (await page.textContent('#goalcard h3')).trim();
    if (!MAP[g]) { errs.push('unknown goal ' + g); break; }
    if (i === 2) { // one wrong answer
      await page.click('#palette .opt[data-t="live"]');
      await page.click('#mapNext .btn');
    } else await page.click(`#palette .opt[data-t="${MAP[g]}"]`);
  }
  await page.waitForSelector('#s3.cleared', { timeout: 10000 });
  log('stage 3 cleared', await run(), 'hearts', await hearts(), 'rows', await page.evaluate(() => document.querySelectorAll('#tmap tbody tr').length));
  await page.locator('#s3 .sim').screenshot({ path: SP + '1306-wb3-375-dark.png' });

  /* ---- stage 1 ---- */
  await page.locator('#s1open .opt').first().waitFor();
  await clickOpt('#s1open', 'Ask questions');
  await page.locator('#qdeck .opt').first().waitFor({ timeout: 5000 });
  await page.locator('#qdeck .opt', { hasText: 'logo' }).click(); // waste
  for (const q of ['start of a query', 'How many suggestions', 'which five', 'spell check', 'languages and characters', 'How many users', 'How fast must it be']) {
    await page.locator('#qdeck .opt', { hasText: q }).click(); await page.waitForTimeout(80);
  }
  log('reqs lit:', await page.evaluate(() => document.querySelectorAll('#reqs .req.got').length), '/', await page.evaluate(() => document.querySelectorAll('#reqs .req').length));
  await page.locator('#est .erow[data-k="qps"] input').waitFor({ timeout: 8000 });
  await page.fill('#est .erow[data-k="qps"] input', '2,000,000,000'); await page.click('#est .erow[data-k="qps"] .btn');
  log('qps wrong msg:', (await page.textContent('#est .erow[data-k="qps"] .explain')).slice(0, 120));
  await page.fill('#est .erow[data-k="qps"] input', '24k'); await page.press('#est .erow[data-k="qps"] input', 'Enter');
  await page.fill('#est .erow[data-k="peak"] input', '48000'); await page.click('#est .erow[data-k="peak"] .btn');
  await page.fill('#est .erow[data-k="store"] input', '400 MB'); await page.click('#est .erow[data-k="store"] .btn');
  await page.waitForSelector('#s1.cleared', { timeout: 6000 });
  log('stage 1 cleared', await run(), 'hearts', await hearts(), 'clock', await page.textContent('#ivClock'));
  await page.locator('#s1 .stage-b').screenshot({ path: SP + '1306-s1-375-dark.png' });

  /* ---- stage 2 ---- */
  await page.click('#tiles2 .opt[data-k="spell"]'); // decoy
  await page.click('#tiles2 .opt[data-k="qs"]'); // out of order
  for (const k of ['user', 'dgs', 'ft', 'qs']) await page.click(`#tiles2 .opt[data-k="${k}"]`);
  await page.waitForFunction(() => !document.querySelector('#runSearch').disabled);
  await page.click('#runSearch');
  await page.waitForFunction(() => !document.querySelector('#runPrefix').disabled, null, { timeout: 8000 });
  await page.click('#runPrefix');
  await page.locator('#s2q .opt').first().waitFor({ timeout: 10000 });
  log('drop:', (await page.textContent('#drop2')).replace(/\s+/g, ' '));
  await clickOpt('#s2q', 'No: every keystroke');
  await page.waitForSelector('#s2.cleared', { timeout: 6000 });
  log('stage 2 cleared', await run(), 'hearts', await hearts());
  await page.locator('#s2 .sim').screenshot({ path: SP + '1306-wb2-375-dark.png' });

  /* ---- reload mid-quest ---- */
  await page.reload(); await page.waitForTimeout(600);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), s2: document.querySelector('#s2').classList.contains('cleared'), s3: document.querySelector('#s3').classList.contains('cleared'), s4: document.querySelector('#s4').classList.contains('cleared'), clock: document.querySelector('#ivClock').textContent }));
  log('after reload:', JSON.stringify(resume), 'hearts', await hearts());
  if (!resume.banner || !resume.s1 || !resume.s2 || !resume.s3 || resume.s4) errs.push('resume failed');

  /* ---- stage 4 ---- */
  const RIGHT = ['Misses fall through', 'The new cache starts cold', 'every ancestor', 'Shard map manager:', 'Filter layer drops it', 'Aggregate counts per week', 'Every keystroke scans', 'Cache results in the browser', 'By design'];
  for (let i = 0; i < 9; i++) {
    await page.locator('#barrage .opts .opt').first().waitFor({ timeout: 5000 });
    const texts = await page.locator('#barrage .opts .opt').allTextContents();
    let t = texts.find(x => x.includes(RIGHT[i]));
    if (!t) { errs.push('no right option at curveball ' + i + ': ' + texts.join(' | ')); break; }
    if (i === 4) t = texts.find(x => !x.includes(RIGHT[i]));
    await clickOpt('#barrage .opts', t);
    await page.click('#barrage .q-arena .btn.primary');
  }
  await page.waitForSelector('#s4.cleared', { timeout: 6000 });
  log('stage 4 cleared', await run(), 'hearts', await hearts());

  /* ---- stage 5 ---- */
  await page.locator('#wrapcards .opt').first().waitFor();
  for (const t of ['Unicode', 'Per-country', 'Trending']) await clickOpt('#wrapcards', t);
  await page.click('#deliver');
  await page.locator('#s5q .opt').first().waitFor({ timeout: 10000 });
  await clickOpt('#s5q', 'rebuilt weekly');
  await page.waitForSelector('#s5.cleared', { timeout: 6000 });
  log('stage 5 cleared', await run(), 'hearts', await hearts());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', Array.from({ length: 60 }, (_, i) => 'word' + i).join(' '));
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 8000 });
  const end = await page.evaluate(() => ({ lesson: JSON.parse(localStorage.getItem('sdq:v1')).lessons['1306'], iv: Object.keys(JSON.parse(localStorage.getItem('sdq:v1:1306-interview') || '{}')), stats: document.querySelector('.sc-stats') && document.querySelector('.sc-stats').textContent.replace(/\s+/g, ' '), score: document.querySelector('.sc-overall') && document.querySelector('.sc-overall').textContent.replace(/\s+/g, ' '), review: document.querySelector('.sc-review') && document.querySelector('.sc-review').textContent.replace(/\s+/g, ' ') }));
  log('VICTORY', JSON.stringify(end), 'overflow', await overflow());
  await page.screenshot({ path: SP + '1306-375-dark.png', fullPage: true });
  await page.locator('#s6 .stage-b').screenshot({ path: SP + '1306-score-375-dark.png' });

  /* ---- review mode reload ---- */
  await page.reload(); await page.waitForTimeout(600);
  log('review banner:', await page.evaluate(() => !!document.querySelector('.banner') && !document.querySelector('.banner.resume')), 'victory shown:', await page.evaluate(() => document.querySelector('#victory').classList.contains('show')));

  /* light desktop shots */
  const c2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const p2 = await c2.newPage(); p2.on('pageerror', e => errs.push('pageerror(light): ' + e.message));
  await p2.goto(FILE); await p2.waitForTimeout(300);
  for (const k of ['user', 'dgs', 'ft', 'qs']) await p2.click(`#tiles2 .opt[data-k="${k}"]`);
  await p2.waitForFunction(() => !document.querySelector('#runPrefix').disabled);
  await p2.click('#runPrefix'); await p2.waitForTimeout(3000);
  await p2.locator('#s2 .sim').screenshot({ path: SP + '1306-wb2-1280-light.png' });
  for (const k of ['logs', 'agg', 'aggd', 'workers', 'triedb', 'cache', 'browser', 'lb', 'api', 'filter', 'smm']) await p2.click(`#tiles3 .opt[data-k="${k}"]`);
  await p2.locator('#s3 .sim').screenshot({ path: SP + '1306-wb3-1280-light.png' });

  log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})();
