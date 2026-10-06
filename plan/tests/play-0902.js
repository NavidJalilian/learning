const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/0902-web-crawler-components-and-workflow.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(URL); await page.waitForTimeout(400);
  const hud = async () => page.evaluate(() => ({ xp: document.querySelector('.q-xp').textContent, hearts: document.querySelectorAll('.heart:not(.lost)').length, cleared: [...document.querySelectorAll('.stage.cleared')].map(s => s.dataset.stage) }));
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).last().click(); };
  const answerQuiz = async (scope, text) => { await page.waitForSelector(`${scope} .quiz:last-child .opt`); await page.locator(`${scope} .quiz`).last().locator('.opt', { hasText: text }).click(); await page.waitForTimeout(800); };

  /* stage 1: bad attempt then good */
  for (const n of [0, 8, 9, 10]) await page.locator(`#web1 .cand[data-n="${n}"]`).click();
  await page.click('#crawlBtn'); await page.waitForFunction(() => !document.querySelector('#crawlBtn').disabled, null, { timeout: 10000 });
  console.log('bad crawl cov', await page.textContent('#covVal'), '|', await page.evaluate(() => [...document.querySelectorAll('#log1 div')].slice(-3).map(d => d.textContent).join(' || ')));
  await page.click('#clearPins');
  for (const n of [0, 30, 40, 10]) await page.locator(`#web1 .cand[data-n="${n}"]`).click();
  await page.click('#crawlBtn');
  await page.waitForSelector('#s1quiz .opt', { timeout: 10000 });
  console.log('good crawl cov', await page.textContent('#covVal'));
  await page.locator('#s1 .webmap').screenshot({ path: SP + '0902-s1.png' });
  await answerQuiz('#s1quiz', 'locality');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());

  /* reload mid-quest */
  await page.reload(); await page.waitForTimeout(500);
  console.log('resume:', JSON.stringify(await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared') }))), await hud());

  /* stage 2 */
  const jobs = await page.evaluate(() => 0);
  const MAP = {
    'starting addresses': 'seed', 'to-do queue': 'frontier', 'Fetches the page': 'down', 'host name into the IP': 'dns', 'rejects broken': 'parser',
    'identical content': 'cseen', 'Keeps the pages': 'cstore', 'Pulls the links': 'extract', 'Throws out unwanted': 'filter', 'already fetched or already queued': 'useen', 'which URLs have been visited': 'ustore',
  };
  let wrongDone = false;
  for (let i = 0; i < 11; i++) {
    const t = await page.textContent('#jobText');
    const k = Object.entries(MAP).find(([s]) => t.includes(s))[1];
    if (!wrongDone) { const other = k === 'seed' ? 'dns' : 'seed'; await page.click(`#tiles .tile[data-k="${other}"]`); console.log('wrong-tile hint:', await page.textContent('#jobHint')); wrongDone = true; }
    await page.click(`#tiles .tile[data-k="${k}"]`);
  }
  await page.waitForSelector('#urlSort .sort-item');
  const items = page.locator('#urlSort .sort-item');
  for (let i = 0; i < 4; i++) await items.nth(i).locator('.opt[data-i="0"]').click();
  await answerQuiz('#s2quiz', 'slow parsing');
  await answerQuiz('#s2quiz', 'On disk');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  await page.locator('#s2 .tiles').screenshot({ path: SP + '0902-s2.png' });
  console.log('after s2', await hud());

  /* stage 3 */
  await page.click('#checkBtn'); await page.waitForFunction(() => !document.querySelector('#checkBtn').disabled, null, { timeout: 10000 });
  console.log('run1: slow', await page.textContent('#slowCtr'), await page.textContent('#slowTm'), 'bin', await page.textContent('#binCount'));
  await page.locator('#nSlider').fill('9');
  await page.click('#checkBtn'); await page.waitForFunction(() => !document.querySelector('#checkBtn').disabled, null, { timeout: 10000 });
  console.log('run2: slow', await page.textContent('#slowCtr'), await page.textContent('#slowTm'), '| fast', await page.textContent('#fastTm'), 'bin', await page.textContent('#binCount'), 'keep', await page.textContent('#keepCount'));
  await page.locator('#s3 .sim').screenshot({ path: SP + '0902-s3.png' });
  await page.waitForSelector('#twistOpts .opt');
  await page.locator('#twistOpts .opt', { hasText: 'No:' }).click();
  console.log('fps', await page.textContent('#fpA'), await page.textContent('#fpB'));
  await answerQuiz('#s3quiz', '29%');
  await answerQuiz('#s3quiz', 'tiny');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* stage 4 */
  for (const c of await page.$$('#addChips .chip')) await c.click();
  await page.locator('#probeChips .chip', { hasText: 'Silk' }).click();
  console.log('probe silk:', await page.textContent('#bloomOut'));
  await page.fill('#probeIn', '/wiki/Moth'); await page.click('#probeBtn');
  console.log('probe moth:', await page.textContent('#bloomOut'));
  await page.waitForSelector('#fpBox .opt');
  await page.locator('#fpBox .opt', { hasText: 'Probably seen' }).click();
  await page.waitForSelector('#fpBox .opts >> nth=1');
  await page.locator('#fpBox .opts').nth(1).locator('.opt', { hasText: 'Skips it' }).click();
  console.log('fp out:', await page.textContent('#bloomOut'));
  await page.locator('#szSlider').fill('7');
  console.log('size:', await page.evaluate(() => [...document.querySelectorAll('#sizeBars .sb')].map(r => r.textContent).join(' | ')));
  await answerQuiz('#s4quiz', 'off bit proves');
  await answerQuiz('#s4quiz', 'repeat fetches');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  await page.locator('#s4 .sim').first().screenshot({ path: SP + '0902-s4.png' });
  console.log('after s4', await hud());

  /* stage 5 */
  await page.locator('#pipe .bx[data-k="frontier"]').click();
  console.log('route hint:', await page.textContent('#routeHint'));
  for (const k of ['seed', 'frontier', 'down', 'dns', 'parser', 'cseen', 'extract', 'cstore', 'filter', 'useen', 'ustore']) { await page.locator(`#pipe .bx[data-k="${k}"]`).click(); await page.waitForTimeout(80); }
  console.log('route:', await page.textContent('#routeProg'));
  await page.click('#replayBtn'); await page.waitForFunction(() => !document.querySelector('#replayBtn').disabled, null, { timeout: 30000 });
  await page.click('#replayBtn'); await page.waitForSelector('#predBox .opt');
  await page.locator('#predBox .opt', { hasText: 'URL Seen?' }).click(); // wrong on purpose (no heart)
  await page.waitForFunction(() => !document.querySelector('#replayBtn').disabled, null, { timeout: 30000 });
  await page.click('#replayBtn'); await page.waitForSelector('#predBox .opt');
  await page.locator('#predBox .opt', { hasText: 'URL Filter' }).click();
  await page.waitForFunction(() => /Silk/.test(document.querySelector('#predBox h3').textContent), null, { timeout: 30000 });
  await page.locator('#predBox .opt', { hasText: 'URL Seen?' }).click();
  await page.locator('#s5 .pipe').screenshot({ path: SP + '0902-s5.png' });
  await answerQuiz('#s5quiz', 'Content Seen?, on');
  await page.waitForSelector('#s5.cleared', { timeout: 30000 });
  console.log('after s5', await hud());

  /* stage 6 */
  for (const k of ['cseen', 'useen', 'filter', 'parser', 'filter', 'useen', 'cseen']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForSelector('#s6.cleared', { timeout: 5000 });
  console.log('after s6', await hud());

  /* stage 7 */
  await page.fill('#drill textarea', 'Seed URLs go into the frontier queue; downloaders fetch after DNS; parser validates; content seen hashes; storage; extractor; filter; URL seen with bloom filter; back to frontier and URL storage.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY', await page.textContent('#victory h2'), await hud());

  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  await p2.goto(URL); await p2.waitForTimeout(500);
  await p2.screenshot({ path: SP + '0902-375-dark.png', fullPage: true });
  const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p3.goto(URL); await p3.waitForTimeout(500);
  await p3.screenshot({ path: SP + '0902-1280-light.png', fullPage: true });
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
