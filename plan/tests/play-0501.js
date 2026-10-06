const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0501-consistent-hashing-ring-math.html';
const SHOTS = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const reduced = process.argv[2] === 'reduce';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE);
  await page.waitForTimeout(300);
  const log = (...a) => console.log(...a);
  const cleared = () => page.evaluate(() => [...document.querySelectorAll('.stage.cleared')].map(s => +s.dataset.stage));
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const xp = () => page.textContent('.q-xp');
  const quiz = async (scope, text) => { const b = page.locator(`${scope} .quiz button.opt`, { hasText: text }).first(); await b.waitFor(); await b.click(); };

  /* ---- stage 1 ---- */
  const H = [1044, 2208, 3917, 4521, 5374, 6610, 7085, 8862];
  for (let i = 0; i < 8; i++) {
    if (i === 2) { await page.click(`#modTable .mrow[data-i="2"] .mbtn[data-v="0"]`); log('s1 hint:', await page.textContent('#modTable .mrow[data-i="2"] .mhint'), '| hearts', await hearts()); }
    await page.click(`#modTable .mrow[data-i="${i}"] .mbtn[data-v="${H[i] % 3}"]`);
  }
  log('s1 count:', (await page.textContent('#modCount')).slice(0, 40));
  await page.fill('#ringGuess', '2'); await page.click('#ringGuessBtn');
  log('s1 ring guess:', (await page.textContent('#ringGuessFb')).slice(0, 30));
  log('slider disabled before predict:', await page.isDisabled('#nSlider'));
  await quiz('#curvePredict', 'About 98%');
  await page.waitForTimeout(300);
  await page.$eval('#nSlider', el => { el.value = '9'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  log('s1 readout N=9:', await page.textContent('#nVal'), await page.textContent('#rMod'), await page.textContent('#rRing'));
  await page.$eval('#nSlider', el => { el.value = '99'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  log('s1 readout N=99:', await page.textContent('#rMod'), await page.textContent('#rRing'), await page.textContent('#rModK'));
  await page.locator('#curveSim').screenshot({ path: SHOTS + '0501-chart.png' });
  await quiz('#s1quiz', 'About 95%');
  await page.waitForTimeout(1200);
  log('after s1:', await cleared(), await xp(), 'hearts', await hearts());

  /* ---- stage 2 ---- */
  await page.click('#bendBtn');
  await page.waitForSelector('#afterBend', { state: 'visible', timeout: 10000 });
  await page.fill('#cardIn', '50'); await page.click('#cardBtn');
  await page.click('#cardRow button');
  await page.fill('#cardIn', '25'); await page.click('#cardBtn');
  log('s2 card2 wrong fb:', (await page.textContent('#cardFb')).slice(0, 60), '| hearts', await hearts());
  await page.waitForTimeout(reduced ? 50 : 1200);
  await page.locator('#s2 .ring').screenshot({ path: SHOTS + '0501-s2-wrap.png' });
  await page.fill('#cardIn', '18.75%'); await page.click('#cardBtn');
  await page.click('#cardRow button');
  await page.click('.srvpick .opt[data-n="s2"]');
  await page.click('.srvpick .opt[data-n="s0"]');
  await page.waitForSelector('#cardRow button', { timeout: 10000 });
  await page.click('#cardRow button');
  await page.click('#collBtn');
  log('s2 scale on:', await page.isVisible('#scaleBox'), (await page.textContent('#collMath')).slice(0, 40));
  await quiz('#s2quiz', 'So positions almost never collide');
  await page.waitForTimeout(1200);
  log('after s2:', await cleared(), await xp(), 'hearts', await hearts());

  /* ---- stage 3 ---- */
  const ANS = [0, 1, 2, 0];
  for (let k = 0; k < 4; k++) {
    const pick = k === 3 ? 3 : ANS[k]; // pick 93 for key 97 (wrong) to test
    await page.click(`#arr .acell[data-i="${pick}"]`);
    await page.waitForSelector('#s3next button', { timeout: 15000 });
    if (k === 3) log('s3 wrong key 97 hearts', await hearts(), '| log tail:', await page.locator('#log3 > div').last().textContent());
    await page.click('#s3next button');
  }
  log('s3 keyAsk:', await page.textContent('#keyAsk'));
  await page.click('#code3 button.cl[data-n="2"]');
  log('s3 bug fb:', (await page.textContent('#bugFb')).slice(0, 50));
  await quiz('#s3quiz', 'About 18');
  await page.waitForTimeout(1200);
  log('after s3:', await cleared(), await xp(), 'hearts', await hearts());

  /* ---- reload mid-quest ---- */
  const xpBefore = await xp();
  await page.reload(); await page.waitForTimeout(500);
  log('reload banner:', (await page.textContent('.banner.resume')).slice(0, 80));
  log('reload cleared', await cleared(), '| xp', xpBefore, '->', await xp(), '| hearts', await hearts());

  /* ---- stage 4 ---- */
  const R = [
    { keys: [41, 47], ans: 'C' },
    { keys: [88, 95, 3, 30], ans: 'B' }, // 30 is a false positive
    { keys: [14, 41, 47, 88], tags: { 14: 'B', 41: 'C', 47: 'C', 88: 'A' } },
  ];
  for (let r = 0; r < 3; r++) {
    for (const k of R[r].keys) {
      if (k === 41 && r === 0) await page.click(`#ring4 .key[aria-label="Key at 41"]`); // tap on the ring once
      else await page.click(`#kchips .kchip[data-k="${k}"]`);
    }
    if (R[r].ans) await page.click(`#q4 .seg4 button[data-o="${R[r].ans}"]`);
    else for (const [k, o] of Object.entries(R[r].tags)) await page.click(`#q4 .seg4 button[data-k="${k}"][data-o="${o}"]`);
    await page.click('#apply4');
    await page.waitForSelector('#row4 button', { timeout: 15000 });
    log(`s4 round ${r + 1}:`, (await page.textContent('#ex4')).slice(0, 70), '| hearts', await hearts());
    if (r === 2) await page.locator('#s4 .ring').screenshot({ path: SHOTS + '0501-s4-r3.png' });
    await page.click('#row4 button');
  }
  log('s4 tally:', (await page.textContent('#round4')).replace(/\s+/g, ' ').slice(0, 120));
  await quiz('#s4quiz', 'Keys between X and its anticlockwise');
  await page.waitForTimeout(1200);
  log('after s4:', await cleared(), await xp(), 'hearts', await hearts());

  /* ---- stage 5 boss ---- */
  const A = { 'A server joins a basic ring': 'one', 'A server joins a virtual-node ring': 'few', 'A 13th cache box': 'all', 'Maintenance on a basic ring': 'one', 'A crash on a virtual-node ring': 'few', 'Swap the hash function': 'all', 'A reboot with a new IP': 'few' };
  for (let i = 0; i < 7; i++) {
    const t = (await page.textContent('#boss .scenario h3')).trim();
    if (!A[t]) log('UNKNOWN boss scenario', t);
    await page.click(`#boss .choice .opt[data-c="${A[t]}"]`);
    await page.click('#boss .q-arena .row .btn.primary');
  }
  await page.waitForTimeout(600);
  log('boss end:', (await page.textContent('#boss .scenario')).replace(/\s+/g, ' ').slice(0, 60), '| cleared', await cleared());

  /* ---- stage 6 drill ---- */
  await page.fill('#drill textarea', 'With hash mod N going from 20 to 21 moves about 95 percent of keys. A ring with binary search over sorted positions moves only the arc next to the new server, from its clockwise neighbour.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForTimeout(1500);
  const v = await page.evaluate(() => ({ show: document.querySelector('#victory').classList.contains('show'), text: document.querySelector('#victory').innerText.replace(/\s+/g, ' ').slice(0, 160), store: localStorage.getItem('sdq:v1') }));
  log('victory:', v.show, v.text);
  log('store:', v.store);
  log('overflowX:', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  for (const id of ['s1', 's2', 's3', 's4']) await page.locator('#' + id).screenshot({ path: SHOTS + `0501-${id}${reduced ? '-r' : ''}.png` });
  log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
})();
