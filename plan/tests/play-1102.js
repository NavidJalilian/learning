const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1102-news-feed-fanout-push-vs-pull.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(URL);
  await page.waitForTimeout(400);
  const hud = async () => page.evaluate(() => ({ xp: document.querySelector('.q-xp').textContent, hearts: document.querySelectorAll('.heart:not(.lost)').length, cleared: [...document.querySelectorAll('.stage.cleared')].map(s => s.dataset.stage) }));
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };
  const xp0 = await page.evaluate(() => parseInt(document.querySelector('.q-xp').textContent));

  /* ---- stage 3 first (any order) ---- */
  const CARDS = {
    'The feed is ready the moment': 'push-pro', 'Friends get the post in real time': 'push-pro',
    'millions of writes': 'push-con', 'Precomputes feeds for people': 'push-con',
    'No compute wasted': 'pull-pro', 'written only once': 'pull-pro',
    'gathers and merges': 'pull-con', 'get slower as you follow': 'pull-con',
  };
  // one deliberate wrong drop
  await page.locator('#pool .tcard', { hasText: 'No compute wasted' }).click();
  await page.click('#board .cell[data-cell="push-con"]');
  console.log('wrong drop msg:', (await page.textContent('#sortMsg')).slice(0, 40), await hud());
  for (const [t, c] of Object.entries(CARDS)) {
    await page.locator('#pool .tcard', { hasText: t }).click();
    await page.click(`#board .cell[data-cell="${c}"]`);
  }
  await page.locator('#s3 .board').screenshot({ path: SP + '1102-s3-board.png' });
  await page.waitForSelector('#q3 .opt', { timeout: 5000 });
  await clickOpt('#q3', 'Push: fanout on write');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* ---- stage 1 ---- */
  await clickOpt('#p1', '8 writes');
  await page.waitForSelector('#p1 .explain.show', { timeout: 10000 });
  console.log('s1 stats:', await page.textContent('#w1'), await page.textContent('#r1'), await page.textContent('#x1'));
  await page.locator('#p1 .btn.primary').click();
  await page.click('#cleoGo');
  await page.waitForSelector('#hotNote:not([style*="none"])', { timeout: 15000 });
  console.log('cleo clock:', await page.textContent('#cClock'), 'writes', await page.textContent('#cWrites'));
  await page.locator('#s1 .sim').screenshot({ path: SP + '1102-s1-sim.png' });
  await page.waitForSelector('#q1a .opt', { timeout: 5000 });
  await clickOpt('#q1a', 'Reads are fast');
  await page.waitForSelector('#q1b .opt', { timeout: 5000 });
  await clickOpt('#q1b', 'We precompute feeds');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());

  /* ---- reload mid-quest: resume ---- */
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), s3: document.querySelector('#s3').classList.contains('cleared'), text: (document.querySelector('.banner') || {}).textContent }));
  console.log('resume:', JSON.stringify(resume), await hud());

  /* ---- stage 2 ---- */
  await page.click('#cleoPost2');
  await page.waitForSelector('#p2 .opt', { timeout: 5000 });
  console.log('s2 writes:', await page.textContent('#w2'));
  await clickOpt('#p2', '1 read');  // deliberately wrong
  await page.waitForSelector('#p2 .explain.show', { timeout: 15000 });
  console.log('s2 reads/time:', await page.textContent('#r2'), await page.textContent('#t2'), 'merge:', await page.textContent('#merge2'));
  await page.$eval('#nIn', el => { el.value = 1500; el.dispatchEvent(new Event('input', { bubbles: true })); });
  console.log('s2 slider lat:', await page.textContent('#nLat'));
  await page.locator('#s2 .stage-b').screenshot({ path: SP + '1102-s2.png' });
  await page.waitForSelector('#q2a .opt', { timeout: 5000 });
  await clickOpt('#q2a', 'When Bo opens it');
  await page.waitForSelector('#q2b .opt', { timeout: 5000 });
  await clickOpt('#q2b', 'Feed loads are slow');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());

  /* ---- stage 4 ---- */
  await page.fill('#c1in', '3000'); await page.click('#c1go');
  console.log('c1 wrong:', await page.textContent('#c1msg'));
  await page.fill('#c1in', '34,722'); await page.click('#c1go');
  console.log('c1:', await page.textContent('#c1msg'));
  await page.fill('#c2in', '50M'); await page.press('#c2in', 'Enter');
  console.log('c2:', await page.textContent('#c2msg'));
  const setThr = async v => { await page.$eval('#thrIn', (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, v); return page.evaluate(() => [document.querySelector('#thrVal').textContent, document.querySelector('#g1v').textContent, document.querySelector('#g2v').textContent, document.querySelector('#gState').textContent]); };
  for (const v of [80, 70, 61, 60, 50, 40, 39, 38, 30, 20]) console.log('thr', v, JSON.stringify(await setThr(v)));
  // drag the line on the SVG to around 100k
  await page.locator('#hist').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  const box = await page.locator('#hist').boundingBox();
  const xFor = l => box.x + (26 + (l - 1) / 7 * 350) / 400 * box.width;
  await page.mouse.move(xFor(7.5), box.y + box.height * 0.5);
  await page.mouse.down(); await page.mouse.move(xFor(5), box.y + box.height * 0.5, { steps: 8 }); await page.mouse.up();
  console.log('after drag:', await page.textContent('#thrVal'), await page.textContent('#gState'));
  await page.locator('#s4 .hist').screenshot({ path: SP + '1102-s4-hist.png' });
  await page.click('#boOpen');
  await page.waitForSelector('#hread .explain', { timeout: 10000 });
  await page.locator('#hread').screenshot({ path: SP + '1102-s4-read.png' });
  await page.waitForSelector('#q4a .opt', { timeout: 5000 });
  await clickOpt('#q4a', 'Accounts above a follower');
  await page.waitForSelector('#q4b .opt', { timeout: 5000 });
  await clickOpt('#q4b', 'Spreading keys and load');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());

  /* ---- stage 5 ---- */
  for (const k of ['push', 'hybrid', 'pull', 'hybrid', 'push', 'hybrid']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', 'Two options. Fanout on write pushes post IDs into every follower feed cache: fast reads, real time, but celebrities cause millions of writes and inactive users waste work. Fanout on read builds at load time: slow reads. Hybrid with a follower threshold.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  const xp1 = await page.evaluate(() => parseInt(document.querySelector('.q-xp').textContent));
  console.log('VICTORY', await page.textContent('#victory h2'), await hud(), 'quest xp', xp1 - xp0);
  console.log('victory stats:', await page.textContent('#victory .vstats'));

  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  p2.on('pageerror', e => errs.push('p2 pageerror: ' + e.message));
  await p2.goto(URL); await p2.waitForTimeout(500);
  await p2.screenshot({ path: SP + '1102-375-dark.png', fullPage: true });
  console.log('overflow 375:', await p2.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  p3.on('pageerror', e => errs.push('p3 pageerror: ' + e.message));
  await p3.goto(URL); await p3.waitForTimeout(500);
  await p3.screenshot({ path: SP + '1102-1280-light.png', fullPage: true });
  console.log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
