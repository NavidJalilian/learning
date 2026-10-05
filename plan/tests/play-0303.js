// Playthrough for quest 0303: clears every stage via real clicks, checks resume + victory.
const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0303-blueprint-and-buy-in.html';
const SHOTS = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: process.env.RM ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  const log = (...a) => console.log(...a);
  const xp = () => page.evaluate(() => (JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['0303']);
  const cleared = n => page.waitForSelector(`#s${n}.cleared`, { timeout: 30000 });
  async function quizRight(sel, correctText) {
    await page.waitForSelector(`${sel} .quiz .opt`, { timeout: 15000 });
    await page.click(`${sel} .quiz .opt:has-text("${correctText}")`);
  }
  await page.goto(FILE);
  await page.waitForSelector('.hud .hud-in');

  /* ---- stage 1 ---- */
  await page.click('#appr .opt[data-a="b"]');
  await page.waitForSelector('#verdict .explain.show', { timeout: 20000 });
  log('s1 verdict:', (await page.textContent('#verdict')).slice(0, 40), 'meter', await page.getAttribute('#meterW', 'aria-valuenow'));
  await page.click('#appr .opt[data-a="c"]');
  await page.waitForFunction(() => document.querySelector('#verdict .explain.bad'), null, { timeout: 20000 });
  await quizRight('#s1quiz', 'sound base');
  await cleared(1);
  log('stage 1 cleared', JSON.stringify(await xp()));

  /* ---- stage 2 ---- */
  // one wrong pair
  await page.click('#mBoxes .opt[data-box="cdn"]');
  await page.click('#mJobs .opt[data-job="mq"]');
  log('s2 hint after wrong:', await page.textContent('#mHint'));
  for (const k of ['client', 'lb', 'web', 'db', 'cache', 'cdn', 'mq']) {
    await page.click(`#mBoxes .opt[data-box="${k}"]`);
    await page.click(`#mJobs .opt[data-job="${k}"]`);
  }
  log('s2 board on:', await page.locator('#wbSvg .gbox.on').count(), 'edges on:', await page.locator('#wbSvg .gedge.on').count());
  await page.locator('#s2').screenshot({ path: SHOTS + 'q0303-s2.png' });
  await quizRight('#s2quiz', 'CDN');
  await cleared(2);
  log('stage 2 cleared', JSON.stringify(await xp()));

  /* ---- reload mid-quest: resume ---- */
  await page.reload();
  await page.waitForSelector('.hud .hud-in');
  log('resume:', JSON.stringify(await page.evaluate(() => ({
    banner: !!document.querySelector('.banner.resume'),
    c1: document.querySelector('#s1').classList.contains('cleared'), c2: document.querySelector('#s2').classList.contains('cleared'),
    c3: document.querySelector('#s3').classList.contains('cleared'), hearts: document.querySelectorAll('.heart.lost').length,
  }))));

  /* ---- stage 3 ---- */
  // out of order + distractor
  await page.click('#palette .opt[data-t="web"]');
  log('s3 ooo hint:', await page.textContent('#laneHint'));
  await page.click('#palette .opt[data-t="pay"]');
  log('s3 distractor hint:', await page.textContent('#laneHint'));
  for (const k of ['user', 'lb', 'web', 'post', 'pcache', 'pdb', 'fanout', 'nfcache', 'notif']) await page.click(`#palette .opt[data-t="${k}"]`);
  await page.waitForTimeout(1100);
  log('s3 pub count', await page.textContent('#pubCount'), 'active lane:', await page.getAttribute('#lanes .lane.active', 'data-lane'));
  await page.click('#lanes .lane[data-lane="read"]');
  await page.click('#palette .opt[data-t="post"]');
  log('s3 wrong-lane hint:', await page.textContent('#laneHint'));
  for (const k of ['user', 'lb', 'web', 'nfsvc', 'nfcache']) await page.click(`#palette .opt[data-t="${k}"]`);
  log('s3 read count', await page.textContent('#readCount'));
  await page.click('#btnPub');
  await page.click('#pred3 .opt:has-text("News feed cache")');
  await page.waitForSelector('#pred3 .explain.show', { timeout: 20000 });
  await page.click('#btnRead');
  await page.waitForSelector('#s3goals [data-g="bob"].done', { timeout: 20000 });
  log('s3 log tail:', await page.evaluate(() => [...document.querySelectorAll('#feedLog div')].slice(-1)[0].textContent.slice(0, 80)));
  await page.locator('#s3 .feed').screenshot({ path: SHOTS + 'q0303-s3.png' });
  await page.locator('#lanes').screenshot({ path: SHOTS + 'q0303-s3-lanes.png' });
  await quizRight('#s3quiz', 'Fanout service');
  await cleared(3);
  log('stage 3 cleared', JSON.stringify(await xp()));

  /* ---- stage 4 ---- */
  const ans = [0, 2, 1, 1, 0]; // card 3 (URL shortener) one notch off → half credit
  for (let c = 0; c < 5; c++) await page.click(`#zgrid .zcard[data-c="${c}"] .opt[data-i="${ans[c]}"]`);
  await page.locator('#s4').screenshot({ path: SHOTS + 'q0303-s4.png' });
  await quizRight('#s4quiz', 'Ask the interviewer');
  await cleared(4);
  log('stage 4 cleared', JSON.stringify(await xp()));

  /* ---- stage 5: lose first (3 wrong), rematch, then win ---- */
  const A = ['defend', 'adjust', 'park', 'ask', 'adjust', 'defend'];
  async function fight(wrongN) {
    for (let i = 0; i < 6; i++) {
      await page.waitForSelector('#boss .choice .opt:not([disabled])');
      const pick = i < wrongN ? (A[i] === 'ask' ? 'park' : 'ask') : A[i];
      await page.click(`#boss .choice .opt[data-c="${pick}"]`);
      await page.click('#boss .q-arena .row .btn.primary');
    }
  }
  await fight(3);
  await page.waitForSelector('#bossRetry .btn');
  log('s5 after loss: cleared?', await page.evaluate(() => document.querySelector('#s5').classList.contains('cleared')), (await page.textContent('#bossRetry')).slice(0, 50));
  await page.click('#bossRetry .btn');
  await fight(0);
  await cleared(5);
  log('stage 5 cleared', JSON.stringify(await xp()));

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', 'I would split it into two flows: publish goes through load balancer and web servers to the post service and fanout service into the news feed cache, read goes via news feed service. Does this shape work?');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 15000 });
  const fin = await page.evaluate(() => ({ lesson: JSON.parse(localStorage.getItem('sdq:v1')).lessons['0303'], vic: document.querySelector('#victory h2').textContent, overflow: document.documentElement.scrollWidth - innerWidth }));
  log('victory:', JSON.stringify(fin));
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: SHOTS + 'q0303-375-dark.png', fullPage: true });
  log('errors:', errs.length ? errs : 'none');
  await browser.close();
})();
