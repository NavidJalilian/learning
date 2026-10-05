const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1401-youtube-scope-and-estimate.html';
const DIR = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
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
  const click = async (scope, text) => { const b = page.locator(scope).locator('button', { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout: 20000 }); await b.click(); };
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const xp = () => page.evaluate(() => document.querySelector('.q-xp').textContent);
  const cleared = () => page.evaluate(() => [...document.querySelectorAll('.stage.cleared')].map(s => +s.dataset.stage));
  const waitCleared = async n => { await page.waitForFunction(n => document.querySelector('#s' + n).classList.contains('cleared'), n, { timeout: 30000 }); console.log('stage', n, 'cleared · hearts', await hearts(), '·', await xp()); };
  const setRange = (sel, v) => page.evaluate(([sel, v]) => { const e = document.querySelector(sel); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, [sel, v]);

  /* stage 1: 7 cards. Put the slider at the truth for all but card 3 (way off) */
  const truthPos = [
    Math.log(2e9 / 1e6) / Math.log(1e4), Math.log(5e9 / 1e7) / Math.log(1e4), 0.73, null,
    Math.log(15.1e9 / 1e8) / Math.log(1e3), 0.37, Math.log(80 / 2) / Math.log(250)];
  for (let i = 0; i < 7; i++) {
    await page.waitForSelector('#gslider:not([disabled])');
    const p = truthPos[i] === null ? 0.05 : truthPos[i];
    await setRange('#gslider', String(Math.round(p * 1000)));
    console.log(' card', i + 1, (await page.textContent('#gcard h3')), '→', await page.textContent('#gval'));
    await page.click('#glock');
    console.log('   ', (await page.textContent('#gverdict')).trim());
    await click('#grow', i < 6 ? 'Next card' : 'See the verdict');
  }
  await click('#fchips', 'comments');
  await click('#fchips', 'upload a video');
  await click('#fchips', 'watch a video');
  await click('#s1quiz', 'Uploading videos and watching them');
  await click('#s1quiz', '45 minutes only fits');
  await waitCleared(1);

  /* stage 2 */
  await page.waitForSelector('#qdeck .opt');
  await click('#qdeck', 'What colour should the play button be?');
  for (const q of ['Which features matter most?', 'Which clients', 'How many daily active users?', 'How long does a user spend', 'international users', 'resolutions and formats', 'Is encryption required?', 'maximum video file size', 'existing cloud services']) await click('#qdeck', q);
  console.log('clock:', await page.textContent('#ivMin'), '| reqs got:', await page.locator('#reqs .req.got').count());
  await page.waitForSelector('#nfr.on', { timeout: 20000 });
  await click('#s2quiz', 'You lean on managed storage');
  await click('#s2quiz', 'It caps upload and transcoding');
  await waitCleared(2);

  /* reload mid-quest */
  await page.reload();
  await page.waitForSelector('.banner.resume');
  console.log('after reload: banner =', (await page.textContent('.banner.resume')).trim().slice(0, 80), '| cleared', await cleared(), '| hearts', await hearts(), '|', await xp());

  /* stage 3 */
  await page.fill('#calc3 input', '500k'); await page.press('#calc3 input', 'Enter');
  await page.waitForSelector('#calc3 .explain.good');
  await click('#calc3', 'Next step');
  await page.fill('#calc3 input', '150'); await page.click('#calc3 .q-check'); // no unit → toast, no heart
  await page.selectOption('#calc3 select', 'GB'); await page.click('#calc3 .q-check'); // wrong unit
  console.log('slip:', (await page.textContent('#calc3 .explain')).slice(0, 90));
  await page.selectOption('#calc3 select', 'TB'); await page.click('#calc3 .q-check');
  await page.waitForSelector('#calc3 .explain.good');
  await click('#calc3', 'Make it real');
  await click('#pred3', 'Multiplies it by about 5');
  await page.waitForSelector('#slRep:not([disabled])');
  await setRange('#slRep', '3');
  console.log('storage counter:', (await page.textContent('#stBig')).trim(), '|', (await page.textContent('#stSub')).trim().slice(0, 70));
  await click('#s3quiz', 'Transcoded versions and replica');
  await waitCleared(3);

  /* stage 4 */
  await page.fill('#calc4 input', '3000'); await page.press('#calc4 input', 'Enter');
  console.log('slip:', (await page.textContent('#calc4 .explain')).slice(0, 80));
  await page.fill('#calc4 input', '$150,000'); await page.press('#calc4 input', 'Enter');
  await page.waitForSelector('#calc4 .explain.good');
  await click('#calc4', 'Open the bill meter');
  await click('#pred4', '4× the bill');
  await page.waitForSelector('#slPrice:not([disabled])');
  console.log('gauge @0.085:', await page.evaluate(() => document.querySelector('#gauge .gbig').textContent));
  await setRange('#slPrice', '0.02'); await setRange('#slShare', '20');
  await page.waitForSelector('#s4goals [data-g="cut"].done', { timeout: 10000 });
  console.log('gauge after knobs:', await page.evaluate(() => document.querySelector('#gauge .gbig').textContent));
  await click('#s4quiz', 'CDN egress');
  await click('#s4quiz', 'Every view streams the full');
  await waitCleared(4);

  /* stage 5: lose first run (2 wrong), rematch, win */
  const ANS = ['ask', 'up', 'buy', 'many', 'views'];
  const WRONG = ['draw', 'views', 'buy', 'many', 'views'];
  for (const run of [WRONG, ANS]) {
    for (let i = 0; i < 5; i++) {
      await page.click(`#boss .choice .opt[data-c="${run[i]}"]`);
      await click('#boss', i < 4 ? 'Next' : 'Final blow');
    }
    if (run === WRONG) { await page.waitForSelector('#rematch', { state: 'visible' }); console.log('boss lost:', (await page.textContent('#boss .scenario p')).trim()); await page.click('#rematch .btn'); }
  }
  await waitCleared(5);

  /* stage 6 */
  await page.fill('#drill textarea', 'I would scope it to upload and watch, mobile web and TV clients, 5M DAU, 1 GB max, encryption, cloud allowed, 150 TB a day and 150k a day of CDN.');
  await page.click('#drill .q-reveal');
  const boxes = page.locator('#drill .selfgrade input');
  for (let i = 0; i < await boxes.count(); i++) await boxes.nth(i).check();
  await page.click('#drill .q-finish');
  await waitCleared(6);

  await page.waitForSelector('#victory.show', { timeout: 10000 });
  console.log('VICTORY:', (await page.textContent('#victory h2')).trim(), '|', (await page.textContent('#victory .vstats')).replace(/\s+/g, ' ').trim());
  const store = await page.evaluate(() => localStorage.getItem('sdq:v1'));
  console.log('store:', store);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('overflowX:', ov);
  await page.screenshot({ path: DIR + '1401-375-dark.png', fullPage: true });
  for (const n of [1, 3, 4]) { await page.locator('#s' + n).screenshot({ path: DIR + `1401-375-dark-s${n}.png` }); }
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
