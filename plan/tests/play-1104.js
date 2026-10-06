const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1104-news-feed-retrieval-and-caches.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const reduced = process.argv[2] !== 'motion';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto(FILE);
  await page.waitForTimeout(300);
  const T = reduced ? 1 : 6;
  const quiz = async (mount, text) => {
    const b = page.locator(`${mount} .quiz:last-of-type .opt`, { hasText: text }).first();
    await b.waitFor({ timeout: 8000 * T }); await b.click(); await page.waitForTimeout(150);
  };
  const xp = () => page.locator('.q-xp').textContent();
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);

  /* stage 1 */
  // one deliberate wrong tap
  await page.locator('#steps .opt[data-i="3"]').click(); await page.waitForTimeout(100);
  console.log('after wrong tap hearts', await hearts());
  for (let i = 1; i <= 6; i++) { await page.locator(`#steps .opt[data-i="${i}"]`).click(); await page.waitForFunction(n => document.querySelector('#stepCount').textContent.startsWith(n + ' '), i); await page.waitForTimeout(reduced ? 150 : 2200); }
  await page.locator('#cdnBox h3').waitFor();
  // wrong edge first (step 4), then CDN
  await page.locator('#flowSvg .ehit').nth(3).dispatchEvent('click'); await page.waitForTimeout(100);
  await page.locator('#flowSvg .ehit').nth(6).click({ force: true });
  await page.waitForTimeout(reduced ? 200 : 1500);
  await quiz('#s1quiz', 'Step 5');
  await page.waitForFunction(() => document.querySelector('#s1').classList.contains('cleared'), null, { timeout: 5000 });
  console.log('stage 1 cleared', await xp(), 'hearts', await hearts());
  await page.locator('#s1').screenshot({ path: SP + 'p1104-s1.png' });

  /* stage 2 */
  await page.locator('#tripBox .opt', { hasText: '2 trips' }).click();
  await page.waitForFunction(() => !document.querySelector('#fetchU').disabled);
  await page.locator('#fetchU').click();
  await page.locator('#countBox .opt', { hasText: '4 posts' }).click({ timeout: 10000 * T });
  await page.waitForFunction(() => !document.querySelector('#replayNB').disabled, null, { timeout: 10000 * T });
  console.log('cards visible', await page.locator('#feed .fcard:not(.gone)').count());
  await page.locator('#replayNB').click();
  await page.waitForFunction(() => document.querySelector('#cmp').classList.contains('on'), null, { timeout: 20000 * T });
  await quiz('#s2quiz', 'Fill bare post IDs');
  await quiz('#s2quiz', 'The post lives in one place');
  await page.waitForFunction(() => document.querySelector('#s2').classList.contains('cleared'), null, { timeout: 5000 });
  console.log('stage 2 cleared', await xp());
  await page.locator('#s2').screenshot({ path: SP + 'p1104-s2.png' });

  /* reload mid-quest */
  await page.reload(); await page.waitForTimeout(400);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), c1: document.querySelector('#s1').classList.contains('cleared'), c2: document.querySelector('#s2').classList.contains('cleared'), c3: document.querySelector('#s3').classList.contains('cleared'), xp: document.querySelector('.q-xp').textContent }));
  console.log('after reload', JSON.stringify(resume));

  /* stage 3 */
  const CDN = ['Profile picture image', '30-second video', 'Photo in a post', 'Thumbnail image'];
  while (await page.locator('#pool3 .tcard').count()) {
    const c = page.locator('#pool3 .tcard').first();
    const t = (await c.textContent()).trim();
    await c.click();
    await page.locator(`#bins3 .bin[data-bin="${CDN.includes(t) ? 'cdn' : 'api'}"]`).click();
  }
  await page.locator('#raceBox .opt', { hasText: '10×' }).click();
  await quiz('#s3quiz', 'Its CDN URL');
  await page.waitForFunction(() => document.querySelector('#s3').classList.contains('cleared'), null, { timeout: 8000 * T });
  console.log('stage 3 cleared', await xp());
  await page.locator('#s3').screenshot({ path: SP + 'p1104-s3.png' });

  /* stage 4 */
  const MAP = { 'u7’s list of post IDs': 'nf', 'Text and media URLs of post p981': 'ct', 'A viral post read 1M times an hour': 'ct', 'The accounts Bo follows': 'sg', 'The accounts that follow Bo': 'sg', 'Did Bo like p981?': 'ac', 'Did Bo reply to p955?': 'ac', 'Number of likes on p981': 'co', 'Number of replies on p955': 'co', 'Bo’s follower count': 'co', 'Cleo’s 2-minute-old post, going viral': 'ct', 'The last 500 post IDs for Ana': 'nf' };
  let wrongDone = false;
  while (await page.locator('#pool4 .tcard').count()) {
    const c = page.locator('#pool4 .tcard').first();
    const t = (await c.textContent()).trim();
    if (!MAP[t]) throw new Error('unknown card ' + t);
    await c.click();
    if (!wrongDone) { wrongDone = true; await page.locator(`#trays .tray[data-bin="${MAP[t] === 'co' ? 'ac' : 'co'}"]`).click(); await c.click(); }
    await page.locator(`#trays .tray[data-bin="${MAP[t]}"]`).click();
  }
  await page.locator('#buildBtn').click();
  await quiz('#s4quiz', 'Action');
  await quiz('#s4quiz', 'They change constantly');
  await page.waitForFunction(() => document.querySelector('#s4').classList.contains('cleared'), null, { timeout: 15000 * T });
  console.log('stage 4 cleared', await xp());
  await page.locator('#s4').screenshot({ path: SP + 'p1104-s4.png' });

  /* stage 5 boss */
  for (const a of ['cdn', 'hot', 'batch', 'drop', 'ctr', 'act']) {
    await page.locator(`#boss .choice .opt[data-c="${a}"]`).click();
    await page.locator('#boss .row .btn.primary').click();
  }
  await page.waitForFunction(() => document.querySelector('#s5').classList.contains('cleared'), null, { timeout: 5000 });
  console.log('stage 5 cleared', await xp());

  /* stage 6 drill */
  await page.locator('#drill textarea').fill('The phone calls GET me feed, load balancer, web server, news feed service reads IDs from the news feed cache, hydrates from user and post caches with DB fallback, drops deleted posts, media from CDN URLs, five cache layers.');
  await page.locator('#drill .q-reveal').click();
  for (const cb of await page.locator('#drill .selfgrade input').all()) await cb.check();
  await page.locator('#drill .q-finish').click();
  await page.waitForFunction(() => document.querySelector('#victory').classList.contains('show'), null, { timeout: 5000 });
  console.log('VICTORY', await xp(), 'hearts', await hearts());
  const store = await page.evaluate(() => localStorage.getItem('sdq:v1'));
  console.log('store', store);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('overflowX', ov);
  await page.screenshot({ path: SP + 'p1104-full.png', fullPage: true });
  console.log('errors', errs.length ? errs : 'none');
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
