const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0705-boss-mint-it-live.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(500);
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const xp = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs?.['0705']?.xp);
  const cleared = () => page.evaluate(() => [...document.querySelectorAll('.stage.cleared')].map(s => +s.dataset.stage));
  const clickText = async (sel, text) => { const el = page.locator(sel, { hasText: text }).first(); await el.click(); };

  /* stage 1 */
  await page.waitForSelector('#qdeck .opt');
  await clickText('#qdeck .opt', 'One data center');
  await clickText('#qdeck .opt', 'Which programming language');
  for (const t of ['What properties', 'exactly 1', 'contain letters', 'How long is an ID', 'per second at peak']) { await clickText('#qdeck .opt', t); await page.waitForTimeout(150); }
  await page.waitForSelector('#playChips .opt', { timeout: 8000 });
  console.log('s1 board:', await page.$$eval('#reqs .req.got', e => e.length), 'bonus got', await page.$$eval('#bonus .req.got', e => e.length), 'missed', await page.$$eval('#bonus .req.missed', e => e.length));
  await clickText('#playChips .opt', '128 bits is fine');
  for (const t of ['IDs are unique', 'Ordered by time', 'Numbers only', 'Fit in 64 bits', '10,000+']) await clickText('#playChips .opt', t);
  await page.waitForTimeout(1500);
  console.log('after s1: cleared', await cleared(), 'hearts', await hearts(), 'xp', await xp(), 'clock', await page.textContent('#ivClock'));

  /* reload mid-quest */
  await page.reload(); await page.waitForTimeout(600);
  console.log('resume banner:', await page.$eval('.banner.resume', e => e.textContent.trim().slice(0, 70)).catch(() => 'NONE'), 'cleared', await cleared(), 'hearts', await hearts(), 'xp', await xp(), 'clock', await page.textContent('#ivClock'));

  /* stage 2 */
  await page.waitForSelector('#apps .opt');
  await page.click('#apps .opt[data-a="snow"]'); await page.waitForTimeout(300);
  for (const [a, r] of [['mm', 'time'], ['uuid', 'num'], ['ticket', 'spof']]) {
    await page.click(`#apps .opt[data-a="${a}"]`);
    await page.waitForSelector('#push .rchips .opt:not([disabled])');
    await page.click(`#push .rchips .opt[data-r="${r}"]`);
    await page.waitForFunction(a => document.querySelector(`#apps .opt[data-a="${a}"]`).classList.contains('out'), a);
  }
  await page.click('#apps .opt[data-a="snow"]');
  await page.waitForTimeout(1500);
  console.log('after s2: cleared', await cleared(), 'rows', await page.$$eval('#cmp tbody tr', e => e.length), 'hearts', await hearts(), 'xp', await xp());

  /* stage 3 */
  await page.click('#btiles .opt[data-t="x1"]');
  await page.click('#btiles .opt[data-t="ts"]'); // out of order
  for (const k of ['sign', 'ts', 'dc', 'mc', 'seq']) await page.click(`#btiles .opt[data-t="${k}"]`);
  console.log('bits:', await page.textContent('#bitsUsed'), await page.$eval('#bits', e => e.getAttribute('aria-label')));
  await page.fill('#in-yrs', '50'); await page.press('#in-yrs', 'Enter');
  await page.fill('#in-yrs', '69.7'); await page.press('#in-yrs', 'Enter');
  await page.fill('#in-seq', '4,096'); await page.press('#in-seq', 'Enter');
  await page.fill('#in-gen', '1024'); await page.locator('.cq-wrap[data-n="gen"] .btn').click();
  await page.click('#shiftBtn');
  await page.waitForSelector('#decodeQ .opt');
  await clickText('#decodeQ .opt', '2020-04-09');
  await page.waitForTimeout(1500);
  console.log('decode:', await page.$$eval('#decodeT td', e => e.map(x => x.textContent).join(' | ')));
  console.log('after s3: cleared', await cleared(), 'hearts', await hearts(), 'xp', await xp());

  /* stage 4 */
  const ANS = { 'NTP stepped': 'clock', 'past 2080': 'tune', 'ending in 00': 'api', '60 machines': 'tune', 'ID box reboots': 'ops', 'machine ID 7': 'ops', 'password-reset': 'api', 'smaller ID': 'clock' };
  for (let i = 0; i < 8; i++) {
    const h = await page.textContent('#barrage .scenario h3');
    const k = Object.entries(ANS).find(([t]) => h.includes(t))[1];
    await page.click(`#barrage .choice .opt[data-c="${k}"]`);
    await page.click('#barrage .q-arena .row .btn.primary');
  }
  await page.waitForTimeout(800);
  console.log('after s4: cleared', await cleared(), 'boss text', await page.textContent('#barrage .scenario p'), 'xp', await xp());

  /* stage 5 */
  for (const t of ['Clock synchronization', 'Section length tuning', 'High availability']) await clickText('#wrapcards .opt', t);
  await page.click('#deliver');
  await page.waitForSelector('#recapChips .opt', { timeout: 8000 });
  for (const t of ['64-bit Snowflake', 'Roughly time-ordered', '~69 years']) await clickText('#recapChips .opt', t);
  await page.waitForTimeout(1500);
  console.log('after s5: cleared', await cleared(), 'xp', await xp());

  /* stage 6 */
  const words = 'Requirements unique numeric 64 bit roughly time ordered ten thousand per second. Multi-master not ordered, UUID is 128 bits, ticket server single point of failure. Snowflake 1 41 5 5 12, 69 years, 4096 per ms, 1024 generators, NTP refuse or wait if clock goes back, tune bits, high availability.';
  await page.fill('#drill textarea', words);
  await page.waitForTimeout(1200);
  console.log('timer:', await page.textContent('#dtLeft'));
  await page.click('#drill .q-reveal');
  const boxes = await page.$$('#drill .selfgrade input');
  for (let i = 0; i < 8; i++) await boxes[i].check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 8000 });
  await page.waitForTimeout(800);
  console.log('VICTORY:', await page.$eval('#victory h2', e => e.textContent), '|', await page.$eval('#victory .sc-vic', e => e.textContent).catch(() => 'NO SCORE LINE'));
  console.log('scorecard h3:', await page.textContent('#scorecard h3'));
  const st = await page.evaluate(() => ({ lesson: JSON.parse(localStorage.getItem('sdq:v1')).lessons['0705'], iv: localStorage.getItem('sdq:v1:0705-interview') }));
  console.log('saved:', JSON.stringify(st.lesson));
  console.log('overflow:', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await page.screenshot({ path: SP + '/0705-dark-375-full.png', fullPage: true });
  await page.locator('#s3').scrollIntoViewIfNeeded(); await page.evaluate(() => document.querySelector('#s3').scrollIntoView());
  await page.screenshot({ path: SP + '/0705-dark-375-s3.png' });
  await page.evaluate(() => document.querySelector('#s2').scrollIntoView());
  await page.screenshot({ path: SP + '/0705-dark-375-s2.png' });

  /* review-mode reload */
  await page.reload(); await page.waitForTimeout(700);
  console.log('review reload: banner', await page.$eval('.banner', e => e.textContent.trim().slice(0, 40)).catch(() => 'NONE'), '| victory score', await page.$eval('#victory .sc-vic', e => e.textContent).catch(() => 'NONE'));

  console.log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
})();
