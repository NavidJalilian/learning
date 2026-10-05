const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0703-snowflake-bit-layout.html';
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
  const clickText = async (scope, text) => { const b = page.locator(`${scope} button:not([disabled])`, { hasText: text }).first(); await b.click(); };
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);

  /* ---- stage 1 ---- */
  for (const k of ['sign', 'ts', 'dc', 'm', 'seq']) await page.click(`#tiles1 .tile[data-k="${k}"]`);
  const wrongSizes = ['5', '41', '1', '5', '12'];
  for (let i = 0; i < 5; i++) await page.selectOption(`#slots1 select[data-i="${i}"]`, wrongSizes[i]);
  log('s1 used:', await page.textContent('#used1'), 'check enabled:', await page.isEnabled('#check1'));
  await page.click('#check1');
  log('s1 wrong hint:', (await page.textContent('#hint1')).slice(0, 90), '| hearts', await hearts());
  const sizes = ['1', '41', '5', '5', '12'];
  for (let i = 0; i < 5; i++) await page.selectOption(`#slots1 select[data-i="${i}"]`, sizes[i]);
  await page.click('#check1');
  log('s1 good hint:', (await page.textContent('#hint1')).slice(0, 50));
  const s1ans = ['Top bits win any comparison', 'Their datacenter and machine bits differ', 'Always 0, so the ID stays positive'];
  for (const a of s1ans) {
    await page.waitForSelector(`#s1quiz .quiz:last-child button:has-text("${a}")`);
    await clickText('#s1quiz .quiz:last-child', a);
    await page.waitForTimeout(650);
  }
  await page.waitForTimeout(900);
  log('after s1 cleared:', await cleared());

  /* ---- stage 2 ---- */
  const s2ans = ['The sequence section', 'It resets back to 0', 'Machine 1’s, minted one tick later', 'Machine 30’s, the higher machine'];
  await page.click('#gen2'); await page.click('#gen2');
  for (let i = 0; i < 4; i++) {
    // answer round 3 wrong once to test the heart + replay button
    const pick = i === 2 ? 'Machine 30’s, the higher machine' : s2ans[i];
    await page.waitForSelector(`#r2box button.opt:has-text("${pick}")`);
    await clickText('#r2box', pick);
    await page.waitForSelector('#r2box .row button.primary', { timeout: 15000 });
    if (i === 2) {
      log('s2 wrong round 3 -> replay button present:', await page.locator('#r2box button', { hasText: 'Watch it again' }).count(), '| hearts', await hearts());
      log('s2 verdict:', await page.textContent('#verdict2'));
    }
    if (i === 3) log('s2 verdict r4:', await page.textContent('#verdict2'));
    if (i === 0) log('s2 log tail:', (await page.locator('#log2 > div').last().textContent()).slice(0, 60));
    await page.click('#r2box .row button.primary');
  }
  await page.waitForTimeout(900);
  log('after s2 cleared:', await cleared());

  /* ---- stage 3 ---- */
  await page.fill('#shift3', '12'); await page.click('#shiftBtn3');
  await page.waitForTimeout(reduced ? 200 : 1100);
  log('s3a wrong:', (await page.textContent('#ex3a')).slice(0, 70));
  await page.fill('#shift3', '22'); await page.click('#shiftBtn3');
  await page.waitForSelector('#st3a.solved', { timeout: 5000 });
  log('s3a:', (await page.textContent('#ex3a')).slice(0, 50));
  await page.fill('#sum3', '1,586,451,091,225'); await page.click('#sumBtn3');
  await page.waitForSelector('#st3b.solved');
  await clickText('#dates3', '2020-04-09');
  await page.waitForSelector('#st3c.solved');
  await page.fill('#dcIn3', '3'); await page.fill('#mIn3', '17'); await page.fill('#seqIn3', '5');
  await page.click('#fieldsBtn3');
  await page.waitForSelector('#st3d.solved');
  await page.waitForTimeout(1100);
  log('after s3 cleared:', await cleared());
  // decoder toy
  for (const v of ['1248292468186091525', '20', '9223372036854775807']) {
    await page.click(`#toyChips .chip[data-v="${v}"]`);
    log('toy', v, '->', (await page.textContent('#toyOut')).replace(/\s+/g, ' ').slice(0, 170));
  }
  await page.fill('#toyIn', '99999999999999999999'); await page.click('#toyBtn');
  log('toy err:', await page.textContent('#toyErr'));

  /* ---- reload mid-quest ---- */
  const xpBefore = await page.textContent('.q-xp');
  await page.reload(); await page.waitForTimeout(500);
  log('reload: banner:', (await page.textContent('.banner.resume')).slice(0, 80));
  log('reload: cleared', await cleared(), '| xp before', xpBefore, 'after', await page.textContent('.q-xp'), '| hearts', await hearts());

  /* ---- stage 4 ---- */
  const cardAns = ['69.7', '2080', '1,024', '4.1 million', '1'];
  for (let i = 0; i < 5; i++) {
    if (i === 1) { await page.fill('#cIn', '2070'); await page.click('#cCheck'); log('s4 wrong card shows working:', await page.isVisible('#cW')); }
    await page.fill('#cIn', cardAns[i]); await page.click('#cCheck');
    await page.waitForSelector('#cRow button');
    await page.click('#cRow button');
  }
  await page.$eval('#ep4', el => { el.value = '2026'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  log('s4 epoch 2026:', await page.textContent('#epEnd'), await page.textContent('#epLeft'));
  await page.waitForTimeout(1000);
  log('after s4 cleared:', await cleared());

  /* ---- stage 5 boss ---- */
  const A = { 'Same machine, same millisecond': 'seq', 'Same millisecond, two machines': 'node', 'Newest tweet, biggest ID': 'ts', 'Never negative in Java': 'sign', 'The year-2080 problem': 'ts', 'No room for server #33': 'node', 'A speed cap': 'seq' };
  for (let i = 0; i < 7; i++) {
    const t = (await page.textContent('#boss5 .scenario h3')).trim();
    await page.click(`#boss5 .choice .opt[data-c="${A[t]}"]`);
    await page.click('#boss5 .q-arena .row .btn.primary');
  }
  await page.waitForTimeout(600);
  log('boss end:', (await page.textContent('#boss5 .scenario')).replace(/\s+/g, ' ').slice(0, 60), '| cleared', await cleared());

  /* ---- stage 6 drill ---- */
  await page.fill('#drill6 textarea', 'One sign bit, then forty one bits of milliseconds since a custom epoch, five datacenter bits, five machine bits and twelve sequence bits for 4096 per ms.');
  await page.click('#drill6 .q-reveal');
  for (const cb of await page.$$('#drill6 .selfgrade input')) await cb.check();
  await page.click('#drill6 .q-finish');
  await page.waitForTimeout(1500);
  const v = await page.evaluate(() => ({ show: document.querySelector('#victory').classList.contains('show'), text: document.querySelector('#victory').innerText.replace(/\s+/g, ' ').slice(0, 160), store: localStorage.getItem('sdq:v1') }));
  log('victory:', v.show, v.text);
  log('store:', v.store);
  log('overflowX:', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  // screenshots
  for (const id of ['s1', 's2', 's3', 's4']) {
    await page.locator('#' + id).screenshot({ path: SHOTS + `shot-0703-${id}${reduced ? '-r' : ''}.png` });
  }
  log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
})();
