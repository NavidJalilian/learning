const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0901-web-crawler-scope-and-estimates.html';
const SHOT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
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
  const xp = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs?.['0901']?.xp ?? null);
  async function answer(stage, text) {
    const b = page.locator(`#s${stage} .quiz .opt:not([disabled])`, { hasText: text }).first();
    await b.waitFor({ timeout: 8000 });
    await b.click();
  }
  async function waitCleared(n) {
    await page.waitForFunction(n => document.querySelector('#s' + n).classList.contains('cleared'), n, { timeout: 15000 });
    log(`stage ${n} cleared · xp=${await xp()} hearts=${await hearts()}`);
  }
  const overflow = async tag => { const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 1) errs.push(`overflow ${o}px at ${tag}`); };

  // ---- Stage 1: sort 8 cards. Answer key by text.
  const KEY = { 'search engine refreshes': 'idx', 'national library': 'arch', 'hedge fund': 'mine', 'record label': 'mon', 'price-comparison': 'mine', 'brand checks': 'mon', 'yesterday': 'idx', 'game studio': 'arch' };
  let wrongDone = false, dragDone = false;
  for (let n = 0; n < 8; n++) {
    const t = await page.locator('#dropCard').innerText();
    const k = Object.entries(KEY).find(([s]) => t.includes(s))[1];
    if (!wrongDone) {
      const wrong = ['idx', 'arch', 'mine', 'mon'].find(x => x !== k);
      await page.locator(`.basket[data-k="${wrong}"]`).click();
      log('wrong drop hint:', await page.locator('#sortHint').innerText(), 'hearts', await hearts());
      wrongDone = true;
    }
    if (!dragDone) {
      // real pointer drag onto the basket
      const cb = await page.locator('#dropCard').boundingBox();
      const bb = await page.locator(`.basket[data-k="${k}"]`).boundingBox();
      await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2);
      await page.mouse.down();
      await page.mouse.move(cb.x + cb.width / 2 + 10, cb.y + cb.height / 2 + 10, { steps: 3 });
      await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 8 });
      await page.mouse.up();
      dragDone = true;
      log('drag drop hint:', await page.locator('#sortHint').innerText());
    } else {
      await page.locator(`.basket[data-k="${k}"]`).click();
    }
    await page.waitForTimeout(450);
  }
  log('spider transform:', await page.locator('#webSvg .spider').evaluate(e => e.style.transform), 'usesNote', await page.locator('#usesNote').isVisible());
  await page.screenshot({ path: SHOT + '0901-s1.png', fullPage: false });
  await answer(1, 'Search engine indexing');
  await waitCleared(1);

  // ---- Stage 2: the crawl loop
  await page.locator('#s2').scrollIntoViewIfNeeded();
  const stepBtn = s => page.locator(`#loopBtns .btn[data-step="${s}"]`);
  log('initial enabled:', await stepBtn('dl').isEnabled(), await stepBtn('ex').isEnabled(), await stepBtn('add').isEnabled());
  await stepBtn('dl').click(); await stepBtn('ex').click(); await stepBtn('add').click();
  log('after round 1 queue:', await page.locator('#qChips').innerText(), 'dl enabled (should be false until predict):', await stepBtn('dl').isEnabled());
  await page.locator('#gPredict .opt', { hasText: '1 time' }).click(); // wrong on purpose: no heart
  for (let r = 0; r < 2; r++) { await stepBtn('dl').click(); await stepBtn('ex').click(); await stepBtn('add').click(); }
  log('predict explain:', (await page.locator('#gPredict .explain').innerText()).slice(0, 90), 'hearts', await hearts());
  await page.screenshot({ path: SHOT + '0901-s2.png', fullPage: false });
  await page.locator('#ffBtn').click();
  await page.locator('#gEnd.show').waitFor({ timeout: 15000 });
  log('end banner:', (await page.locator('#gEnd').innerText()).slice(0, 160));
  log('counters:', await page.locator('#dlN').innerText(), await page.locator('#wasteN').innerText(), await page.locator('#qCount').innerText());
  await overflow('s2');
  await answer(2, 'Download pages → extract links → add new URLs');
  await answer(2, 'A starting URL the crawl begins from');
  await waitCleared(2);

  // ---- Reload mid-quest
  await page.reload(); await page.waitForTimeout(500);
  log('RESUME banner:', await page.locator('.banner.resume').count(), 'xp', await xp(), 'hearts', await hearts(),
    's1/s2 cleared class', await page.locator('#s1.cleared').count(), await page.locator('#s2.cleared').count());

  // ---- Stage 3: deck
  await page.locator('#s3').scrollIntoViewIfNeeded();
  await page.locator('#s3 .qcard[aria-label="Ask: Can we skip robots.txt to go faster?"]').click();
  log('trap bubble:', (await page.locator('#bubble').innerText()).slice(0, 80), 'hearts', await hearts());
  for (const q of ['What is the crawler for?', 'How many pages per month?', 'HTML only, or images and PDFs too?', 'Do we pick up new and edited pages?', 'Do we store the pages, and for how long?', 'What about pages with duplicate content?'])
    await page.locator(`#s3 .qcard[aria-label="Ask: ${q}"]`).click();
  log('sticky:', await page.locator('#sticky li').count(), await page.locator('#stickyCnt').innerText());
  await page.waitForTimeout(800);
  await page.screenshot({ path: SHOT + '0901-s3.png', fullPage: false });
  await answer(3, 'Ignore it and don’t store it again');
  await answer(3, 'Up to five years');
  await waitCleared(3);

  // ---- Stage 4: traits
  await page.locator('#s4').scrollIntoViewIfNeeded();
  const TK = { 'unclosed tags': 'robust', 'bakery': 'polite', 'PDFs crawled': 'ext', 'fetches 50 pages': 'scale', 'calendar': 'robust', 'emails to complain': 'polite', 'new crawl server': 'scale', 'copyright-monitoring': 'ext' };
  await page.locator('.shield[data-k="scale"]').click(); // nothing selected
  log('no-select hint:', await page.locator('#trHint').innerText());
  let firstWrong = true;
  for (const [s, k] of Object.entries(TK)) {
    await page.locator('.inc:not(.placed)', { hasText: s }).click();
    if (firstWrong) { await page.locator(`.shield[data-k="${k === 'ext' ? 'scale' : 'ext'}"]`).click(); log('wrong trait hint:', await page.locator('#trHint').innerText(), 'hearts', await hearts()); firstWrong = false; }
    await page.locator(`.shield[data-k="${k}"]`).click();
  }
  log('full shields:', await page.locator('.shield.full').count());
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOT + '0901-s4.png', fullPage: false });
  await answer(4, 'Politeness');
  await waitCleared(4);

  // ---- Stage 5: napkin math
  await page.locator('#s5').scrollIntoViewIfNeeded();
  const box = k => page.locator(`#s5 .calc[data-k="${k}"]`);
  await box('avg').locator('input').fill('40');
  await box('avg').locator('.q-check').click();
  log('wrong msg:', await box('avg').locator('.msg').innerText(), 'hearts', await hearts());
  await box('avg').locator('.q-hint').click();
  await box('avg').locator('input').fill('386');
  await box('avg').locator('.q-check').click();
  await box('peak').locator('input').fill('800');
  await box('peak').locator('input').press('Enter');
  await box('mon').locator('input').fill('500');
  await box('mon').locator('.q-check').click();
  await box('tot').locator('input').fill('30000');
  await box('tot').locator('select').selectOption('TB');
  await box('tot').locator('.q-check').click();
  log('calc ok', await page.locator('#s5 .calc.ok').count(), 'knobs', await page.locator('#knobs').isVisible());
  log('outs', await page.locator('#oAvg').innerText(), await page.locator('#oPeak').innerText(), await page.locator('#oMon').innerText(), await page.locator('#oTot').innerText(), await page.locator('#oSrv').innerText());
  await page.locator('#kSize').evaluate(el => { el.value = 1; el.dispatchEvent(new Event('input', { bubbles: true })); });
  log('after 100KB total', await page.locator('#oTot').innerText(), 'sizeNote', await page.locator('#sizeNote').isVisible());
  await page.locator('#kPages').evaluate(el => { el.value = 6; el.dispatchEvent(new Event('input', { bubbles: true })); });
  log('10B pages avg', await page.locator('#oAvg').innerText());
  await page.screenshot({ path: SHOT + '0901-s5.png', fullPage: false });
  await overflow('s5');
  await answer(5, 'About 4,000 pages a second');
  await answer(5, 'Pages per month × page size × years kept');
  await waitCleared(5);

  // ---- Stage 6: boss
  await page.locator('#s6').scrollIntoViewIfNeeded();
  const BK = ['scale', 'robust', 'polite', 'ext', 'robust', 'polite', 'scale'];
  for (let i = 0; i < BK.length; i++) {
    await page.locator(`#boss .choice .opt[data-c="${BK[i]}"]`).click();
    if (i === 0) await page.screenshot({ path: SHOT + '0901-s6.png', fullPage: false });
    await page.locator('#boss .row .btn.primary').click();
  }
  await waitCleared(6);

  // ---- Stage 7: drill
  await page.locator('#s7 textarea').fill('I would ask what it is for, the scale of a billion pages per month, html only, new and edited pages, five years of storage, duplicates. It must be scalable robust polite extensible. 400 pages per second, 800 at peak, 500 TB a month, 30 PB.');
  await page.locator('#s7 .q-reveal').click();
  for (const c of await page.locator('#s7 .selfgrade input').all()) await c.check();
  await page.locator('#s7 .q-finish').click();
  await page.locator('#victory.show').waitFor({ timeout: 8000 });
  log('VICTORY:', (await page.locator('#victory').innerText()).replace(/\s+/g, ' ').slice(0, 200));
  const lesson = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).lessons['0901']);
  log('saved lesson:', JSON.stringify(lesson));
  await overflow('end');
  await page.screenshot({ path: SHOT + '0901-375-dark.png', fullPage: true });
  log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})();
