// Playthrough for quest 0804: clears every stage via real clicks, checks resume + victory.
const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0804-url-shortener-flows-and-scale.html';
const SHOTS = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  const log = (...a) => console.log(...a);
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}'));
  const cleared = n => page.waitForSelector(`#s${n}.cleared`, { timeout: 20000 });
  async function answerQuizzes(sel, count) {
    for (let k = 0; k < count; k++) {
      await page.waitForSelector(`${sel} .quiz:nth-of-type(${k + 1}) .opt`, { timeout: 15000 });
      await page.click(`${sel} .quiz:nth-of-type(${k + 1}) .opt[data-i="0"]`);
      await page.waitForTimeout(150);
    }
  }
  await page.goto(FILE);
  await page.waitForSelector('.hud .hud-in');

  /* ---- stage 1 ---- */
  // one deliberate wrong tap first (step 6 can't be first)
  await page.click('#pool .opt[data-i="5"]');
  const h1 = await page.evaluate(() => document.querySelectorAll('.heart.lost').length);
  log('stage1 wrong tap → hearts lost:', h1);
  for (let i = 0; i < 6; i++) await page.click(`#pool .opt[data-i="${i}"]`);
  log('stage1 slots filled:', await page.locator('#slots li.filled').count());
  await page.click('#runBtn');
  await page.waitForSelector('#s1goals [data-g="run"].done', { timeout: 15000 });
  log('stage1 b62:', await page.evaluate(() => [...document.querySelectorAll('#b62 span')].map(s => s.textContent).join('')), 'row:', await page.textContent('#t1 tbody tr'));
  await answerQuizzes('#s1quiz', 2);
  await cleared(1);
  // second run takes the "yes" branch
  await page.click('#runBtn');
  await page.waitForTimeout(3000);
  log('stage1 rows after rerun:', await page.locator('#t1 tbody tr').count());
  log('stage 1 cleared');

  /* ---- stage 2 ---- */
  await page.click('#sub2');
  await page.waitForSelector('#p2 .opt');
  await page.click('#p2 .opt[data-i="0"]');
  await page.waitForSelector('#p2 .explain.show');
  log('stage2 rows after predict:', await page.textContent('#c2rows'), 'result:', (await page.textContent('#res2')).slice(0, 60));
  await page.click('#chk2 button[data-v="off"]');
  await page.click('#sub2'); await page.click('#sub2');
  log('stage2 wasted:', await page.textContent('#c2waste'));
  await answerQuizzes('#s2quiz', 1);
  await cleared(2);
  log('stage 2 cleared');

  /* ---- reload mid-quest: resume ---- */
  const before = await state();
  await page.reload();
  await page.waitForSelector('.hud .hud-in');
  const resume = await page.evaluate(() => ({
    banner: !!document.querySelector('.banner.resume'),
    c1: document.querySelector('#s1').classList.contains('cleared'),
    c2: document.querySelector('#s2').classList.contains('cleared'),
    c3: document.querySelector('#s3').classList.contains('cleared'),
  }));
  log('resume:', JSON.stringify(resume), 'saved run:', JSON.stringify(before.runs && before.runs['0804']));

  /* ---- stage 3 ---- */
  await page.click('#traceBtn');
  await page.waitForSelector('#s3goals [data-g="trace"].done', { timeout: 10000 });
  await page.$eval('#tSlider', el => { el.value = 11600; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForSelector('#s3goals [data-g="melt"].done', { timeout: 5000 });
  log('stage3 no-cache DB:', await page.textContent('#gDb'), await page.textContent('#heatTxt'));
  await page.screenshot({ path: SHOTS + 'shot-0804-s3-hot.png', fullPage: false });
  await page.click('#p3 .opt[data-i="0"]');
  await page.waitForSelector('#p3 .explain.show', { timeout: 10000 });
  log('stage3 warm:', await page.textContent('#gHit'), await page.textContent('#gDb'), '|', (await page.textContent('#p3 .explain')).slice(0, 90));
  await page.click('#badBtn');
  await page.waitForSelector('#card404.show', { timeout: 10000 });
  await answerQuizzes('#s3quiz', 2);
  await cleared(3);
  log('stage 3 cleared');

  /* ---- stage 4 ---- */
  const F = ['rl', 'web', 'shard', 'an', 'repl', 'crep'];
  // one wrong match
  await page.click('#plist .opt[data-i="0"]');
  await page.click('#fixes .opt[data-k="web"]');
  for (let i = 0; i < 6; i++) {
    await page.click(`#plist .opt[data-i="${i}"]`);
    await page.click(`#fixes .opt[data-k="${F[i]}"]`);
  }
  log('stage4 pinned:', await page.textContent('#pinCount'));
  await page.locator('#boardSvg').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: SHOTS + 'shot-0804-s4.png' });
  await answerQuizzes('#s4quiz', 1);
  await cleared(4);
  log('stage 4 cleared');

  /* ---- stage 5 boss ---- */
  const A = ['cache', 'rl', 'db', 'db', 'web', 'rl', 'cache'];
  for (const a of A) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    await page.click('#boss .q-arena .btn.primary');
  }
  await cleared(5);
  log('stage 5 cleared');

  /* ---- stage 6 drill ---- */
  await page.fill('#drill textarea', 'To shorten, check whether the long URL exists, else get an ID, base 62 encode it and save the row. To redirect, load balancer, web server, cache, then DB, 404 if missing.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 10000 });
  const fin = await state();
  log('victory shown; lesson record:', JSON.stringify(fin.lessons['0804']));
  await page.screenshot({ path: SHOTS + 'shot-0804-victory.png' });

  // full-page screenshots at 375 dark
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: SHOTS + 'shot-0804-375-dark.png', fullPage: true });
  const ox = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  log('overflowX:', ox);
  log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
