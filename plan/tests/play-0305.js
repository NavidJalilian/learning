const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0305-boss-run-the-room.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(300);
  const log = (...a) => console.log(...a);
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const run = () => page.evaluate(() => JSON.stringify((JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['0305']));
  const clickOpt = async (scope, text) => { const l = page.locator(`${scope} .opt`, { hasText: text }).first(); await l.waitFor({ timeout: 8000 }); await l.click(); };
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

  /* ---- stage 1 ---- */
  let wasted = false;
  for (let turn = 0; turn < 20; turn++) {
    if (await page.evaluate(() => document.querySelectorAll('#reqs .req.got').length) === 6) break;
    const ok = await page.locator('#s1menu .opt:not([disabled])').first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
    if (!ok) { await page.waitForTimeout(500); continue; }
    const keys = await page.$$eval('#s1menu .opt:not([disabled])', bs => bs.map(b => b.dataset.k));
    let k;
    if (!wasted && keys.includes('brand')) { k = 'brand'; wasted = true; }
    else k = keys.find(x => ['feat', 'plat', 'scale', 'friends', 'media', 'order', 'stack'].includes(x));
    await page.click(`#s1menu .opt[data-k="${k}"]`);
    if (k === 'order') { await clickOpt('#s1follow', 'newest first for v1'); }
    await page.waitForTimeout(1300);
  }
  await clickOpt('#s1lock', 'newest first, by time posted');
  await page.waitForSelector('#s1.cleared', { timeout: 6000 });
  log('stage 1 cleared', await run(), 'hearts', await hearts(), 'clock', await page.textContent('#ivClock'), 'sig', await page.textContent('#ivSig'));

  /* ---- stage 2 ---- */
  await page.locator('#tiles .opt').first().waitFor();
  await page.click('#tiles .opt[data-k="fanout"]'); // dependency miss
  await page.click('#tiles .opt[data-k="chain"]');  // trap: heart
  for (const k of ['user', 'lb', 'web', 'notif', 'post', 'pcache', 'pdb', 'fanout', 'feedsvc', 'feedcache']) await page.click(`#tiles .opt[data-k="${k}"]`);
  log('wb status:', await page.textContent('#wbStatus'), 'edges on:', await page.evaluate(() => document.querySelectorAll('#wb .ed.on').length));
  await clickOpt('#s2check', 'Does this shape work');
  await clickOpt('#s2media', 'object storage');
  await clickOpt('#s2fan', 'Lead the deep dive');
  await page.waitForSelector('#s2.cleared', { timeout: 6000 });
  log('stage 2 cleared', await run(), 'hearts', await hearts(), 'clock', await page.textContent('#ivClock'));
  await page.locator('#s2 .sim').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SP + '0305-375-dark-wb.png' });

  /* ---- reload mid-quest ---- */
  await page.reload(); await page.waitForTimeout(600);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), s2: document.querySelector('#s2').classList.contains('cleared'), clock: document.querySelector('#ivClock').textContent, sig: document.querySelector('#ivSig').textContent }));
  log('after reload:', JSON.stringify(resume), 'hearts', await hearts());
  if (!resume.banner || !resume.s1 || !resume.s2) errs.push('resume failed');

  /* ---- stage 3 ---- */
  await page.locator('#topics .opt').first().waitFor();
  await page.click('#topics .opt[data-k="lbalg"]'); await page.click('#topics .opt[data-k="fan"]');
  await page.click('#pitch');
  await page.locator('#planEx.show').waitFor({ timeout: 6000 });
  log('bad pitch ->', (await page.textContent('#planEx')).slice(0, 60));
  await page.waitForFunction(() => !document.querySelector('#pitch').disabled, null, { timeout: 6000 });
  await page.click('#planClear');
  for (const k of ['fan', 'ret', 'cel']) await page.click(`#topics .opt[data-k="${k}"]`);
  await page.click('#topics .opt[data-k="store"]'); // won't fit (14+3 > 15)
  await page.click('#pitch');
  await clickOpt('#s3b', 'Think aloud');
  await clickOpt('#s3c', 'Compare');
  await page.waitForSelector('#s3.cleared', { timeout: 8000 });
  log('stage 3 cleared', await run(), 'hearts', await hearts(), 'clock', await page.textContent('#ivClock'));

  /* ---- stage 4 ---- */
  await page.locator('#wrapcards .opt').first().waitFor();
  for (const t of ['Name the bottleneck', 'Walk through failures', 'Cover operations']) await clickOpt('#wrapcards', t);
  await page.click('#deliver');
  await clickOpt('#s4beat', 'real feed challenges');
  await page.waitForSelector('#s4.cleared', { timeout: 10000 });
  log('stage 4 cleared', await run(), 'hearts', await hearts(), 'clock', await page.textContent('#ivClock'));

  /* ---- stage 5: fail once, then pass ---- */
  const ANS = ['R', 'N', 'N', 'S', 'R', 'R', 'S', 'R', 'N', 'S', 'N', 'R', 'R', 'S'];
  for (let i = 0; i < 14; i++) await page.click(`#tx .tline[data-i="${i}"] .opt[data-t="S"]`);
  await page.click('#decide .opt[data-d="Strong hire"]');
  await page.click('#submitGrade');
  await page.locator('#s5retry').waitFor({ state: 'visible', timeout: 4000 });
  log('stage 5 fail ->', (await page.textContent('#gradeEx')).slice(0, 50), 'hearts', await hearts());
  await page.click('#s5retry .btn');
  for (let i = 0; i < 14; i++) await page.click(`#tx .tline[data-i="${i}"] .opt[data-t="${ANS[i]}"]`);
  await page.click('#decide .opt[data-d="Lean no hire"]');
  await page.click('#submitGrade');
  await page.waitForSelector('#s5.cleared', { timeout: 6000 });
  log('stage 5 cleared', await run(), 'hearts', await hearts());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', 'I started by scoping: mobile and web, posting and reading friends posts, newest first, 5000 friends, 10 million daily users, images and video. Then two flows: publish via post service and fanout into the feed cache; read via the news feed service. Deep dive on fan-out with push and pull for celebrities. Closed with bottlenecks and metrics.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 8000 });
  const end = await page.evaluate(() => ({ lesson: JSON.parse(localStorage.getItem('sdq:v1')).lessons['0305'], card: (JSON.parse(localStorage.getItem('sdq:v1:0305-interview') || '{}')).card, score: document.querySelector('.sc-overall').textContent.replace(/\s+/g, ' '), flags: document.querySelector('.sc-flags').textContent }));
  log('VICTORY', JSON.stringify(end));
  log('overflow at 375:', await overflow());
  await page.locator('#scorecard').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SP + '0305-375-dark-score.png' });
  await page.screenshot({ path: SP + '0305-375-dark.png', fullPage: true });

  /* ---- review mode reload ---- */
  await page.reload(); await page.waitForTimeout(600);
  log('review banner:', await page.evaluate(() => !!document.querySelector('.banner') && !document.querySelector('.banner.resume')), 'victory shown:', await page.evaluate(() => document.querySelector('#victory').classList.contains('show')));

  log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})();
