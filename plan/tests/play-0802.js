const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0802-url-shortener-hash-and-collisions.html';
const SHOTS = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/q0802/';
const ok = (c, m) => { if (!c) { console.log('ASSERT FAIL:', m); process.exitCode = 1; } else console.log('  ✓', m); };
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(300);
  const cleared = () => page.evaluate(() => document.querySelectorAll('.stage.cleared').length);
  const hearts = () => page.evaluate(() => document.querySelectorAll('.heart:not(.lost)').length);
  async function quizPair(sel) {
    for (let k = 0; k < 2; k++) {
      await page.waitForFunction(([s, k]) => document.querySelectorAll(s + ' .quiz').length > k, [sel, k], { timeout: 10000 });
      await page.locator(sel + ' .quiz').nth(k).locator('.opt[data-i="0"]').click();
    }
  }
  async function waitCleared(n) { await page.waitForFunction(n => document.querySelector('#s' + n).classList.contains('cleared'), n, { timeout: 90000 }); console.log('stage', n, 'cleared'); }

  // ---- stage 1
  for (const c of ['id', 'createdAt', 'shortURL']) await page.click(`#tray .col-chip[data-n="${c}"]`);
  ok(!(await page.isVisible('#s1prev')), 'preview hidden before all core cols');
  await page.click('#tray .col-chip[data-n="longURL"]');
  ok(await page.isVisible('#s1prev'), 'preview shown');
  ok((await page.textContent('#s1rows')).includes('zn9edcu') && (await page.textContent('#s1rows')).includes('createdAt'), 'preview has book row + extra column');
  await quizPair('#s1quiz'); await waitCleared(1);

  // ---- stage 2
  ok(await page.isDisabled('#nSlider'), 'slider disabled before guess');
  await page.click('#s2guess .opt[data-g="7"]');
  await page.focus('#nSlider');
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
  ok((await page.textContent('#readout')).includes('3,521,614,606,208'), '62^7 exact value shown');
  ok((await page.textContent('#s2guessMsg')).includes('Called it'), 'guess resolved as correct');
  await page.click('#alphaSeg button[data-a="36"]');
  await page.focus('#nSlider'); await page.keyboard.press('ArrowRight');
  ok((await page.textContent('#readout')).includes('2,821,109,907,456'), '36^8 exact value shown');
  await quizPair('#s2quiz'); await waitCleared(2);

  // ---- stage 3
  const crc = await page.innerText('#hrows');
  ok(crc.includes('5cb54054') && crc.includes('5a62509a84df9ee03fe1230b9df8b84e') && crc.includes('0eeae7916c06853901d9ccbefbfcaf4de57ed85b'), 'book hashes match');
  await page.click('#chopBtn');
  ok((await page.textContent('#pair')).match(/f60d675/g).length === 2, 'collision pair shares f60d675');
  await page.fill('#hIn', 'https://example.com/hello');
  await page.fill('#hexIn', '1000'); await page.click('#hexBtn');
  ok(await hearts() === 2, 'wrong hex answer costs a heart');
  await page.fill('#hexIn', '268,435,456'); await page.click('#hexBtn');
  ok((await page.textContent('#hexEx')).includes('2.7 days'), 'hex fill time shown');
  await quizPair('#s3quiz'); await waitCleared(3);

  // ---- reload mid-quest
  await page.reload(); await page.waitForTimeout(500);
  ok(await cleared() === 3, 'resume: 3 stages still cleared after reload');
  ok(await page.isVisible('.banner.resume'), 'resume banner shown');
  ok(await hearts() === 2, 'hearts persisted');

  // ---- stage 4
  await page.click('#addNext');
  await page.waitForFunction(() => document.querySelector('#s4goals [data-g="clash"]').classList.contains('done'), null, { timeout: 20000 });
  ok(true, 'first queued URL collided and retry resolved');
  ok(await page.isDisabled('#bulkBtn'), 'bulk disabled before prediction');
  await page.click('#s4predict .opt[data-i="2"]');
  await page.click('#bulkBtn');
  await page.waitForFunction(() => document.querySelector('#s4goals [data-g="bulk"]').classList.contains('done'), null, { timeout: 120000 });
  console.log('  stats:', await page.textContent('.stats'));
  await quizPair('#s4quiz'); await waitCleared(4);

  // ---- stage 5
  for (let i = 0; i < 8; i++) { await page.waitForFunction(() => !document.querySelector('#bAdd').disabled); await page.click('#bAdd'); }
  await page.waitForSelector('#fpBox', { state: 'visible' });
  for (let k = 0; k < 4; k++) {
    await page.waitForFunction(() => !document.querySelector('#bAdd') || true);
    await page.click(`#cands .cand[data-k="${k}"] .opt[data-p="${k === 2 ? 'maybe' : 'no'}"]`);
    await page.waitForFunction(k => document.querySelector(`#cands .cand[data-k="${k}"] .explain`).classList.contains('show'), k);
  }
  ok((await page.textContent('#bSaved')) === '3', '3 DB queries saved');
  await quizPair('#s5quiz'); await waitCleared(5);

  // ---- stage 6
  for (const a of ['len', 'retry', 'bloom', 'len', 'bloom', 'retry']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    await page.click('#boss .q-arena .btn.primary');
  }
  await waitCleared(6);

  // ---- stage 7
  await page.fill('#drill textarea', 'With 62 characters, 62^6 is 56.8 billion which is too small, 62^7 is 3.5 trillion so seven chars; hash with MD5, take 7, on collision append a string and rehash, and a Bloom filter skips DB lookups.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await waitCleared(7);

  await page.waitForSelector('#victory.show', { timeout: 5000 });
  ok(true, 'victory card shown');
  const res = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).lessons['0802']);
  console.log('  saved result:', JSON.stringify(res));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
  for (const n of [1, 2, 3, 4, 5]) { await page.locator('#s' + n).screenshot({ path: SHOTS + `s${n}-375-dark.png` }); }
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
