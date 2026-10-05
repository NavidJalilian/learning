const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0801-url-shortener-scope-and-api.html';
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
  const xp = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs?.['0801']?.xp ?? null);
  const cleared = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs?.['0801']?.cleared ?? null);
  async function answer(stage, text) {
    const b = page.locator(`#s${stage} .quiz .opt:not([disabled])`, { hasText: text }).first();
    await b.waitFor({ timeout: 8000 });
    await b.click();
  }
  async function waitCleared(n) {
    await page.waitForFunction(n => document.querySelector('#s' + n).classList.contains('cleared'), n, { timeout: 10000 });
    log(`stage ${n} cleared · xp=${await xp()} hearts=${await hearts()}`);
  }

  // ---- Stage 1
  await page.locator('#s1 .qcard[aria-label="Ask: Should I use Kubernetes?"]').click();
  log('after distractor hearts', await hearts(), 'bubble:', (await page.locator('#bubble').innerText()).slice(0, 60));
  await page.locator('#s1 .qcard[aria-label="Ask: Should I use Kubernetes?"]').click(); // no second heart
  log('after repeat distractor hearts', await hearts());
  for (const q of ['Can you give an example?', 'What is the traffic volume?', 'How short must the short URL be?', 'Which characters are allowed?', 'Can short URLs be deleted or updated?'])
    await page.locator(`#s1 .qcard[aria-label="Ask: ${q}"]`).click();
  log('sticky:', await page.locator('#sticky li').count(), await page.locator('#stickyCnt').innerText());
  await answer(1, 'Shortening and redirecting');
  await answer(1, 'Not allowed, to keep it simple');
  await answer(1, '62: 0–9');
  await waitCleared(1);

  // ---- Stage 2
  const box = k => page.locator(`#s2 .calc[data-k="${k}"]`);
  await box('w').locator('input').fill('116');
  await box('w').locator('.q-check').click();
  log('wrong msg:', await box('w').locator('.msg').innerText(), 'hearts', await hearts());
  await box('w').locator('.q-hint').click();
  await box('w').locator('input').fill('1,160');
  await box('w').locator('.q-check').click();
  await box('r').locator('input').fill('11.6');
  await box('r').locator('select').selectOption('K');
  await box('r').locator('input').press('Enter');
  await box('n').locator('input').fill('365');
  await box('n').locator('.q-check').click();
  await box('st').locator('input').fill('36.5');
  await box('st').locator('.q-check').click();
  log('calc ok count', await page.locator('#s2 .calc.ok').count(), 'knobs visible', await page.locator('#knobs').isVisible());
  log('outs', await page.locator('#oW').innerText(), await page.locator('#oR').innerText(), await page.locator('#oN').innerText(), await page.locator('#oS').innerText());
  await page.locator('#kBytes').evaluate(el => { el.value = 300; el.dispatchEvent(new Event('input', { bubbles: true })); });
  log('storage after knob', await page.locator('#oS').innerText(), 'reflect', await page.locator('#reflect').isVisible());
  await answer(2, 'About 116,000 reads/s');
  await answer(2, 'The 365 billion records');
  await waitCleared(2);

  // ---- Reload mid-quest
  await page.reload(); await page.waitForTimeout(500);
  log('RESUME banner:', await page.locator('.banner.resume').count(), 'cleared:', JSON.stringify(await cleared()), 'xp', await xp(), 'hearts', await hearts(),
    's1 cleared class', await page.locator('#s1.cleared').count(), 's2 cleared class', await page.locator('#s2.cleared').count());

  // ---- Stage 3
  const card = k => page.locator(`#s3 .req[data-k="${k}"]`);
  const pick = async (k, f, v) => card(k).locator(`.pick[data-f="${f}"] button[data-v="${v}"]`).click();
  await pick('shorten', 'm', 'GET'); await pick('shorten', 'p', 'api/v1/data/shorten'); await pick('shorten', 'b', '{longUrl}');
  await card('shorten').locator('.send').click();
  log('shorten GET ->', (await card('shorten').locator('.resp pre').innerText()).split('\n').find(l => l.startsWith('HTTP')));
  await pick('shorten', 'm', 'POST'); await card('shorten').locator('.send').click();
  log('shorten POST ->', (await card('shorten').locator('.resp pre').innerText()).split('\n').find(l => l.startsWith('HTTP')));
  await pick('redirect', 'm', 'POST'); await pick('redirect', 'p', 'api/v1/{shortUrl}'); await pick('redirect', 'b', 'none');
  await card('redirect').locator('.send').click();
  log('redirect POST ->', (await card('redirect').locator('.resp pre').innerText()).split('\n').find(l => l.startsWith('HTTP')));
  await pick('redirect', 'm', 'GET'); await card('redirect').locator('.send').click();
  log('redirect GET ->', (await card('redirect').locator('.resp pre').innerText()).split('\n').find(l => l.startsWith('HTTP')));
  await answer(3, 'It creates a new mapping');
  await answer(3, 'A redirect with the long URL inside');
  await waitCleared(3);

  // ---- Stage 4
  async function run3() {
    for (let i = 0; i < 3; i++) {
      await page.waitForFunction(() => !document.querySelector('#clickBtn').disabled, null, { timeout: 15000 });
      await page.locator('#clickBtn').click();
      await page.waitForTimeout(100);
    }
    await page.waitForFunction(() => !document.querySelector('#clickBtn').disabled, null, { timeout: 15000 });
  }
  await page.locator('#r4predict .opt[data-n="1"]').click();
  await run3();
  log('301 run: seen', await page.locator('#cSeen').innerText(), 'clicks', await page.locator('#cClicks').innerText());
  await page.locator('#s4').screenshot({ path: SHOT + 'shot-0801-s4.png' });
  await page.locator('#codeSeg button[data-c="302"]').click();
  await page.locator('#r4predict .opt[data-n="1"]').click(); // deliberately wrong: no heart
  const h4 = await hearts();
  await run3();
  log('302 run: seen', await page.locator('#cSeen').innerText(), 'hearts unchanged', h4 === await hearts());
  await answer(4, '302 Found, so every click');
  await answer(4, 'Location');
  await waitCleared(4);

  // ---- Stage 5
  await page.locator('#htChips .chip').nth(0).click();
  await page.locator('#htChips .chip').nth(1).click();
  await page.locator('#htChips .chip').nth(0).click();
  await page.locator('#htTbl .tr button').first().click();
  await page.locator('#ffBtn').click();
  await page.waitForFunction(() => document.querySelector('#ffBtn').textContent.includes('Back'), null, { timeout: 8000 });
  log('gauge msg:', await page.locator('#gMsg').innerText());
  await page.locator('#s5').screenshot({ path: SHOT + 'shot-0801-s5.png' });
  await answer(5, '10 years is ~36.5 TB');
  await waitCleared(5);
  await page.locator('#ffBtn').click();
  log('back to today:', await page.locator('#gUsed').innerText());

  // ---- Stage 6 boss
  for (const a of ['302', '301', '302', '301', '302', '301']) {
    await page.locator(`#boss .choice .opt[data-c="${a}"]`).click();
    await page.locator('#boss .row .btn.primary').click();
  }
  await waitCleared(6);

  // ---- Stage 7 drill
  await page.locator('#drill textarea').fill('First I would scope it: an example, traffic of 100 million a day, how short, which characters, and no deletes. Then about 1160 writes per second and 11600 reads.');
  await page.locator('#drill .q-reveal').click();
  for (const c of await page.locator('#drill .selfgrade input').all()) await c.check();
  await page.locator('#drill .q-finish').click();
  await waitCleared(7);

  await page.waitForSelector('#victory.show', { timeout: 5000 });
  log('VICTORY:', (await page.locator('#victory h2').innerText()), '|', (await page.locator('#victory .vstats').innerText()).replace(/\n/g, ' '));
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).lessons['0801']);
  log('saved lesson', JSON.stringify(saved));
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  log('overflowX', ov);
  await page.screenshot({ path: SHOT + 'shot-0801-375-dark.png', fullPage: false });
  await page.locator('#s1').screenshot({ path: SHOT + 'shot-0801-s1.png' });
  await page.locator('#s2').screenshot({ path: SHOT + 'shot-0801-s2.png' });
  await page.locator('#s3').screenshot({ path: SHOT + 'shot-0801-s3.png' });
  log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('FAILED', e); process.exit(2); });
