const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0406-boss-throttle-it-live.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad';
const MOTION = process.argv[2] === 'motion';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: MOTION ? 'no-preference' : 'reduce' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(600);
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const xp = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs?.['0406']?.xp);
  const cleared = () => page.evaluate(() => [...document.querySelectorAll('.stage.cleared')].map(s => +s.dataset.stage));
  const clickText = async (sel, text) => { await page.locator(sel, { hasText: text }).first().click(); };
  const W = MOTION ? 2.5 : 1;

  /* stage 1 */
  await page.waitForSelector('#s1open .opt');
  await clickText('#s1open .opt', 'Ask questions');
  await page.waitForSelector('#qdeck .opt', { state: 'visible' });
  await clickText('#qdeck .opt', 'machine learning');
  for (const t of ['Client-side', 'Throttle by IP', 'What scale', 'distributed environment', 'Separate service', 'throttled users']) { await clickText('#qdeck .opt', t); await page.waitForTimeout(100 * W); }
  await page.waitForSelector('#s1lock .opt', { timeout: 8000 });
  await clickText('#s1lock .opt', 'Low latency');
  await page.waitForTimeout(1300);
  console.log('after s1: cleared', await cleared(), 'reqs', await page.$$eval('#reqs .req.got', e => e.length), 'hearts', await hearts(), 'xp', await xp(), 'clock', await page.textContent('#ivClock'));

  /* reload mid-quest */
  await page.reload(); await page.waitForTimeout(700);
  console.log('resume banner:', await page.$eval('.banner.resume', e => e.textContent.trim().slice(0, 80)).catch(() => 'NONE'), '| cleared', await cleared(), 'hearts', await hearts(), 'xp', await xp(), 'clock', await page.textContent('#ivClock'));

  /* stage 2 */
  await page.waitForSelector('#tiles2 .opt');
  await page.click('#tiles2 .opt[data-k="api"]');      // out of order
  await page.click('#tiles2 .opt[data-k="sql"]');      // distractor: heart
  for (const k of ['client', 'lim', 'api', 'redis']) { await page.click(`#tiles2 .opt[data-k="${k}"]`); await page.waitForTimeout(80 * W); }
  await page.waitForSelector('#algos .opt', { timeout: 8000 });
  await page.click('#algos .opt[data-a="swc"]');
  await page.waitForSelector('#justify .opt', { timeout: 8000 });
  await page.click('#justify .opt[data-k="swc"]');
  await page.waitForSelector('#s2pred .opt', { timeout: 8000 });
  await clickText('#s2pred .opt', '429');
  await page.waitForTimeout(MOTION ? 6000 : 1500);
  console.log('after s2: cleared', await cleared(), 'parts on', await page.$$eval('#archA .part.on', e => e.length), 'hearts', await hearts(), 'xp', await xp(), 'clock', await page.textContent('#ivClock'));
  await page.evaluate(() => document.querySelector('#archA').scrollIntoView());
  await page.screenshot({ path: SP + '/0406-s2.png' });

  /* stage 3 */
  await page.click('#tiles3 .opt[data-k="cache"]');    // out of order
  await page.click('#tiles3 .opt[data-k="hard"]');     // distractor
  for (const k of ['rules', 'workers', 'cache', 'mq']) { await page.click(`#tiles3 .opt[data-k="${k}"]`); await page.waitForTimeout(80 * W); }
  await page.waitForSelector('#statuses .opt', { timeout: 8000 });
  await page.click('#statuses .opt[data-s="429"]');
  await page.click('#hchips .opt[data-h="hit"]');      // decoy
  for (const k of ['lim', 'rem', 'ret']) await page.click(`#hchips .opt[data-h="${k}"]`);
  await page.waitForSelector('#goalcard h3', { timeout: 8000 });
  const G = { 'Allow short bursts': 'tb', 'Exact rolling limit': 'swl', 'Smooth edges, little memory': 'swc', 'Atomic check-and-increment': 'lua', 'One count across many servers': 'redis', 'Low latency far away': 'edge', 'Survive a Redis outage': 'open' };
  for (let i = 0; i < 7; i++) {
    const h = (await page.textContent('#goalcard h3')).trim();
    await page.click(`#tpal .opt[data-t="${G[h]}"]`);
    await page.waitForFunction(h => document.querySelector('#goalcard h3').textContent.trim() !== h, h, { timeout: 5000 });
  }
  await page.waitForTimeout(1300);
  console.log('after s3: cleared', await cleared(), 'parts on', await page.$$eval('#archB .part.on', e => e.length), 'slots', await page.$$eval('#s3resp .slot.ok', e => e.length), 'rows', await page.$$eval('#tmap tbody tr', e => e.length), 'hearts', await hearts(), 'xp', await xp());
  await page.evaluate(() => document.querySelector('#archB').scrollIntoView());
  await page.screenshot({ path: SP + '/0406-s3.png' });
  await page.evaluate(() => document.querySelector('#s3resp').scrollIntoView());
  await page.screenshot({ path: SP + '/0406-s3resp.png' });

  /* stage 4 */
  for (let i = 0; i < 9; i++) {
    await page.click('#barrage .opts .opt[data-i="0"]');
    await page.click('#barrage .q-arena .row .btn.primary');
  }
  await page.waitForTimeout(800);
  console.log('after s4: cleared', await cleared(), '|', await page.textContent('#barrage .scenario p'), 'xp', await xp());

  /* stage 5: weak close first (should NOT clear), then a strong one */
  for (const t of ['Hard vs soft', 'we\'re done', 'newer language']) await clickText('#wrapcards .opt', t);
  await page.click('#deliver');
  await page.waitForSelector('#s5replay .btn', { state: 'visible', timeout: 8000 });
  await page.waitForTimeout(1200);
  console.log('weak close: cleared', await cleared(), 'hearts', await hearts());
  await page.click('#s5replay .btn');
  for (const t of ['Hard vs soft', 'Layer 7', 'Client tips']) await clickText('#wrapcards .opt', t);
  await page.click('#deliver');
  await page.waitForTimeout(MOTION ? 4000 : 1500);
  console.log('after s5: cleared', await cleared(), 'xp', await xp());

  /* stage 6 */
  const words = 'Scope first: server side limiter, flexible rules by user or IP, distributed, inform users, fault tolerant. Middleware or API gateway in front of API servers. Token bucket allows bursts but two knobs to tune. Redis INCR EXPIRE in a Lua script for atomicity. 429 with X-Ratelimit headers, drop or queue. Central Redis for sync, edge servers for latency, fail open if Redis dies.';
  await page.fill('#drill textarea', words);
  await page.click('#drill .q-reveal');
  const boxes = await page.$$('#drill .selfgrade input');
  for (const b of boxes) await b.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 8000 });
  await page.waitForTimeout(900);
  console.log('VICTORY:', await page.$eval('#victory h2', e => e.textContent), '| badge', await page.$eval('#victory .badge-earned', e => e.textContent));
  console.log('scorecard:', (await page.textContent('#scorecard .sc-overall')).replace(/\s+/g, ' '));
  const st = await page.evaluate(() => ({ lesson: JSON.parse(localStorage.getItem('sdq:v1')).lessons['0406'], iv: localStorage.getItem('sdq:v1:0406-interview') }));
  console.log('saved:', JSON.stringify(st.lesson), '| iv key present:', !!st.iv);
  console.log('overflow:', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await page.screenshot({ path: SP + '/0406-dark-375-full.png', fullPage: true });
  await page.evaluate(() => document.querySelector('#s1').scrollIntoView());
  await page.screenshot({ path: SP + '/0406-s1.png' });
  await page.evaluate(() => document.querySelector('#scorecard').scrollIntoView());
  await page.screenshot({ path: SP + '/0406-score.png' });

  /* review-mode reload */
  await page.reload(); await page.waitForTimeout(700);
  console.log('review reload: banner', await page.$eval('.banner', e => e.textContent.trim().slice(0, 40)).catch(() => 'NONE'), '| victory shown', await page.$eval('#victory', e => e.classList.contains('show')));
  console.log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
})();
