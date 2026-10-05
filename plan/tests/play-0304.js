// Playthrough for quest 0304: clears every stage via real clicks, checks resume + victory.
const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0304-dive-deep-land-clean.html';
const SHOTS = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/q0304-';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  const log = (...a) => console.log(...a);
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}'));
  const hearts = () => page.evaluate(() => 3 - document.querySelectorAll('.heart.lost').length);
  const xp = async () => ((await state()).runs || {})['0304']?.xp;
  const cleared = n => page.waitForSelector(`#s${n}.cleared`, { timeout: 30000 });
  async function quiz(sel) {
    await page.waitForSelector(`${sel} .quiz .opt`, { timeout: 15000 });
    await page.click(`${sel} .quiz .opt[data-i="0"]`);
  }
  await page.goto(FILE);
  await page.waitForSelector('.hud .hud-in');

  /* ---- stage 1 ---- */
  // wrong on a preview pair (free), wrong on a chapter pair (heart)
  await page.click('#tray .tchip[data-t="rl"]'); await page.click('#pcards .pcard[data-p="id"]');
  log('s1 preview wrong → hearts', await hearts(), '|', await page.textContent('#mmsg'));
  await page.click('#tray .tchip[data-t="url"]'); await page.click('#pcards .pcard[data-p="chat"]');
  log('s1 chapter wrong → hearts', await hearts());
  for (const k of ['url', 'chat', 'feed', 'rl', 'id', 'crawl']) {
    if (!(await page.$(`#tray .tchip[data-t="${k}"].sel`))) await page.click(`#tray .tchip[data-t="${k}"]`);
    await page.click(`#pcards .pcard[data-p="${k}"]`);
  }
  log('s1 matched:', await page.locator('.pcard.matched').count(), 'xp', await xp());
  await page.waitForSelector('#prioBox', { state: 'visible' });
  for (const k of ['fan', 'ret', 'ui']) await page.click(`#prio .popt[data-k="${k}"]`);
  await page.click('#prioLock');
  log('s1 prio:', (await page.textContent('#prioEx')).slice(0, 40));
  await page.screenshot({ path: SHOTS + 's1.png' });
  await quiz('#s1quiz');
  await cleared(1);
  log('stage 1 cleared, xp', await xp(), 'hearts', await hearts());

  /* ---- stage 2 ---- */
  for (const k of ['edge', 'fan', 'json']) await page.click(`#tiles .tile[data-k="${k}"]`);
  // over budget attempt
  await page.click('#tiles .tile[data-k="ret"]');
  log('s2 planned:', await page.textContent('#used'), '(ret rejected? 17 expected)');
  await page.click('#runDive');
  await page.waitForSelector('#s2goals [data-g="run"].done', { timeout: 20000 });
  log('s2 bad run signal:', await page.textContent('#sigVal'), 'hearts', await hearts());
  await page.click('#clearDive');
  for (const k of ['fan', 'ret', 'celeb', 'media']) await page.click(`#tiles .tile[data-k="${k}"]`);
  await page.click('#runDive');
  await page.waitForSelector('#s2goals [data-g="max"].done', { timeout: 20000 });
  log('s2 optimal signal:', await page.textContent('#sigVal'));
  await page.locator('#dive').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SHOTS + 's2.png' });
  await quiz('#s2quiz');
  await cleared(2);
  log('stage 2 cleared, xp', await xp());

  /* ---- reload mid-quest: resume ---- */
  const before = await state();
  await page.reload();
  await page.waitForSelector('.hud .hud-in');
  const resume = await page.evaluate(() => ({
    banner: !!document.querySelector('.banner.resume'),
    c1: document.querySelector('#s1').classList.contains('cleared'),
    c2: document.querySelector('#s2').classList.contains('cleared'),
    c3: document.querySelector('#s3').classList.contains('cleared'),
    hearts: 3 - document.querySelectorAll('.heart.lost').length,
  }));
  log('resume:', JSON.stringify(resume), 'saved run:', JSON.stringify(before.runs && before.runs['0304']));

  /* ---- stage 3 ---- */
  await page.click('#s3 .fbox[data-b="fan"]'); await page.click('#s3 .fbox[data-b="nfs"]'); await page.click('#s3 .fbox[data-b="hyd"]');
  log('s3 note:', (await page.textContent('#fnote')).slice(0, 50));
  for (let r = 0; r < 3; r++) {
    await page.waitForSelector('#p3box .opt:not([disabled])');
    await page.click('#p3box .opt[data-i="0"]');
    await page.waitForSelector('#p3box .explain.show', { timeout: 20000 });
    if (r === 1) { await page.locator('#foSvg').scrollIntoViewIfNeeded(); await page.screenshot({ path: SHOTS + 's3-celeb.png' }); }
    log(`s3 round ${r + 1}: pub=${await page.textContent('#pubN')} read=${await page.textContent('#readN')}`);
    await page.click('#p3box .row .btn.primary');
  }
  // sandbox: pull + celebrity
  await page.click('#modeSeg button[data-m="pull"]');
  await page.$eval('#fSlider', el => { el.value = 2; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('#btnPub'); await page.waitForTimeout(800);
  await page.click('#btnRead'); await page.waitForTimeout(2000);
  log('s3 sandbox pull celeb: pub=', await page.textContent('#pubN'), 'read=', await page.textContent('#readN'));
  await quiz('#s3quiz');
  await cleared(3);
  log('stage 3 cleared, xp', await xp());

  /* ---- stage 4 ---- */
  for (const k of ['redo', 'search', 'bott']) await page.click(`#ccards .ccard[data-k="${k}"]`);
  await page.click('#deliver');
  await page.waitForFunction(() => document.querySelector('#closeReset').textContent.includes('Try'), null, { timeout: 20000 });
  log('s4 trap run: cut cards', await page.locator('.ccard.cut').count(), 'clock', await page.textContent('#clock'), 'hearts', await hearts());
  await page.click('#closeReset');
  for (const k of ['bott', 'fail', 'ops']) await page.click(`#ccards .ccard[data-k="${k}"]`);
  await page.click('#deliver');
  await page.waitForSelector('#s4quiz .quiz', { timeout: 20000 });
  log('s4 good run: clock', await page.textContent('#clock'));
  await page.locator('#ccards').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SHOTS + 's4.png' });
  await quiz('#s4quiz');
  await cleared(4);
  log('stage 4 cleared, xp', await xp());

  /* ---- stage 5 boss: lose once, rematch, win ---- */
  const A = ['out', 'deep', 'ask', 'weak', 'out', 'deep', 'weak'];
  const W = ['deep', 'out', 'out', 'ask', 'deep', 'ask', 'out'];
  for (const a of W) { await page.click(`#boss .choice .opt[data-c="${a}"]`); await page.click('#boss .q-arena .btn.primary'); }
  await page.waitForSelector('#boss button:has-text("Rematch")');
  log('s5 lost first fight, cleared?', await page.evaluate(() => document.querySelector('#s5').classList.contains('cleared')));
  await page.click('#boss button:has-text("Rematch")');
  for (const a of A) { await page.click(`#boss .choice .opt[data-c="${a}"]`); await page.click('#boss .q-arena .btn.primary'); }
  await cleared(5);
  log('stage 5 cleared');

  /* ---- stage 6 drill ---- */
  await page.fill('#drill textarea', 'The biggest bottleneck is celebrity fan-out, so I would pull for them and push for everyone else. If a cache node dies, rebuild from the post DB. Watch latency and queue depth, roll out gradually, and shard at 10x.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 10000 });
  const fin = await state();
  log('victory shown; lesson record:', JSON.stringify(fin.lessons['0304']));
  await page.screenshot({ path: SHOTS + 'victory.png' });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: SHOTS + '375-dark.png', fullPage: true });
  log('overflowX:', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
