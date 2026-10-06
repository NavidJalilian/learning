const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1406-youtube-boss-design-it-live.html';
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
  const run = () => page.evaluate(() => JSON.stringify((JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['1406']));
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };
  const bar = () => page.evaluate(() => document.querySelector('#ivbar').textContent.replace(/\s+/g, ' ').trim());

  /* ---- stage 1 ---- */
  await page.locator('#s1open .opt').first().waitFor();
  await clickOpt('#s1open', 'Ask questions');
  await page.locator('#qdeck .opt').first().waitFor({ state: 'visible' });
  await clickOpt('#qdeck', 'programming language');
  for (const q of ['features matter', 'Which clients', 'daily active', 'watch per day', 'international', 'resolutions', 'encryption', 'maximum file size', 'existing cloud']) {
    await clickOpt('#qdeck', q); await page.waitForTimeout(80);
  }
  await page.locator('#inSt').waitFor({ timeout: 8000 });
  await page.fill('#inSt', '1500'); await page.fill('#inCdn', '150k');
  await page.click('#estGo');
  log('wrong estimate: hearts', await hearts(), 'cdn ok?', await page.evaluate(() => document.querySelector('#eCdn').classList.contains('ok')));
  await page.fill('#inSt', '150'); await page.click('#estGo');
  await page.locator('#s1so .opt').first().waitFor({ timeout: 8000 });
  await clickOpt('#s1so', 'Serving video from the CDN');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  log('stage 1 cleared', await run(), '|', await bar());

  /* ---- stage 2 ---- */
  await page.click('#tiles .opt[data-k="api"]'); // needs lb first -> minute
  await page.click('#tiles .opt[data-k="gql"]'); // decoy -> heart
  for (const k of ['lb', 'api', 'db', 'cache', 'orig', 'tx', 'txs', 'cdn', 'cq', 'ch']) { await page.click(`#tiles .opt[data-k="${k}"]`); await page.waitForTimeout(60); }
  await page.locator('#hops .opt').first().waitFor({ state: 'visible', timeout: 8000 });
  log('arch:', await page.textContent('#archStatus'), 'hearts', await hearts());
  const hop = async k => { await page.click(`#hops .opt[data-k="${k}"]`); await page.waitForTimeout(60); };
  await hop('4'); // wrong: too early
  await hop('1');
  await page.evaluate(() => document.querySelector('#arch .hop[data-k="2"]').focus()); await page.keyboard.press('Enter'); // SVG arrow via keyboard
  await page.waitForTimeout(100);
  await page.evaluate(() => document.querySelector('#arch').scrollIntoView({ block: 'center', behavior: 'instant' })); await page.waitForTimeout(200);
  await page.mouse.click(...(await page.evaluate(() => { const r = document.querySelector('#arch .hop[data-k="3a"] .ln').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }))); // SVG arrow via pointer
  await hop('3a.1'); // wrong: pair still open
  for (const k of ['3b', '3a.1', '3b.1', '3b.1.b', '3b.1.a', '4']) await hop(k);
  const lit = await page.evaluate(() => document.querySelectorAll('#arch .hop.lit').length);
  log('lit hops', lit, 'hearts', await hearts(), await page.evaluate(() => [...document.querySelectorAll('#arch .hop.lit')].map(g => g.dataset.k).join(',')));
  log(await page.evaluate(() => [...document.querySelectorAll('#chat2 .msg')].slice(-8).map(m => m.textContent).join(' || ')));
  await page.locator('#s2q1 .opt').first().waitFor({ timeout: 8000 });
  await clickOpt('#s2q1', 'In parallel');
  await page.locator('#s2q2 .opt').first().waitFor({ timeout: 8000 });
  await clickOpt('#s2q2', 'nearest CDN edge');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  log('stage 2 cleared', await run(), '|', await bar());
  await page.locator('#s2 .sim').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SP + '1406-s2-375-dark.png' });

  /* ---- reload mid-quest ---- */
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), s2: document.querySelector('#s2').classList.contains('cleared') }));
  log('after reload:', JSON.stringify(resume), 'hearts', await hearts(), '|', await bar());
  if (!resume.banner || !resume.s1 || !resume.s2) errs.push('resume failed');

  /* ---- stage 3 ---- */
  const MAP = { 'Fast uploads': 'gop', 'Smooth streaming': 'cdn', 'Change video quality': 'abr', 'Plays on every device': 'codec', 'Flexible processing': 'dag', 'Transcoding throughput': 'sched', 'Only owners can upload': 'psu', 'Protect copyrighted videos': 'drm', 'Keep the CDN bill down': 'tail', 'High availability': 'ha' };
  await page.locator('#goalcard h3').waitFor();
  for (let i = 0; i < 10; i++) {
    const g = (await page.textContent('#goalcard h3')).trim();
    if (i === 0) { await page.click('#palette .opt[data-t="tpc"]'); await page.click('#palette .opt[data-t="chu"]'); }
    await page.click(`#palette .opt[data-t="${MAP[g]}"]`);
    if (i < 9) await page.waitForFunction(prev => document.querySelector('#goalcard h3').textContent.trim() !== prev, g, { timeout: 5000 });
  }
  log('table rows', await page.evaluate(() => document.querySelectorAll('#tmap tbody tr').length), 'hearts', await hearts());
  await page.locator('.ddpick .opt[data-d="tx"]').waitFor({ timeout: 8000 });
  await page.click('.ddpick .opt[data-d="tx"]');
  await page.click('#ddBank .opt[data-i="2"]'); // out of order
  for (const i of [0, 1, 2, 3, 4]) await page.click(`#ddBank .opt[data-i="${i}"]`);
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  log('stage 3 cleared', await run(), '|', await bar());

  /* ---- stage 4: lose first (6/9), then win (8/9) ---- */
  const barrage = async wrongs => {
    for (let i = 0; i < 9; i++) {
      await page.click(`#barrage .opts .opt[data-i="${i < wrongs ? 1 : 0}"]`);
      await page.click('#barrage .q-arena .btn.primary');
    }
  };
  await barrage(3);
  await page.waitForTimeout(300);
  log('after 6/9: cleared?', await page.evaluate(() => document.querySelector('#s4').classList.contains('cleared')), (await page.textContent('#barrage .scenario h3')).trim());
  await page.click('#replay4');
  await barrage(1);
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  log('stage 4 cleared', await run(), '|', await bar());

  /* ---- stage 5 ---- */
  await clickOpt('#wrapcards', 'Rust'); await clickOpt('#wrapcards', 'Scale the API tier'); await clickOpt('#wrapcards', 'live streaming');
  await page.click('#lockClose');
  await page.waitForFunction(() => !document.querySelector('#lockClose').disabled || document.querySelectorAll('#wrapcards .opt.picked').length === 2, null, { timeout: 8000 });
  await page.waitForTimeout(800);
  await clickOpt('#wrapcards', 'takedowns');
  await page.click('#lockClose');
  await page.locator('#closes .blank').first().waitFor({ timeout: 8000 });
  const nBlanks = await page.locator('#closes .blank').count();
  // first: pick wrong everywhere
  for (let i = 0; i < nBlanks; i++) {
    const bl = page.locator('#closes .blank').nth(i); const r = await bl.getAttribute('data-right');
    await bl.locator(`button:not([data-k="${r}"])`).first().click();
  }
  await page.click('#deliver');
  log('wrong delivery: bad blanks', await page.evaluate(() => document.querySelectorAll('#closes .blank.bad').length), 'hearts', await hearts());
  for (let i = 0; i < nBlanks; i++) {
    const bl = page.locator('#closes .blank').nth(i); const r = await bl.getAttribute('data-right');
    await bl.locator(`button[data-k="${r}"]`).click();
  }
  await page.click('#deliver');
  await page.waitForSelector('#s5.cleared', { timeout: 10000 });
  log('stage 5 cleared', await run(), '|', await bar());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', Array.from({ length: 60 }, (_, i) => 'word' + i).join(' '));
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 6000 });
  const end = await page.evaluate(() => ({ lesson: JSON.parse(localStorage.getItem('sdq:v1')).lessons['1406'], iv: Object.keys(JSON.parse(localStorage.getItem('sdq:v1:1406-interview') || '{}')), log: JSON.parse(localStorage.getItem('sdq:v1:1406-interview-log') || '[]'), score: document.querySelector('.sc-overall') && document.querySelector('.sc-overall').textContent.replace(/\s+/g, ' '), overflow: document.documentElement.scrollWidth - innerWidth }));
  log('VICTORY', JSON.stringify(end));
  await page.locator('#scorecard').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SP + '1406-s6-375-dark.png' });
  await page.locator('#s5').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SP + '1406-s5-375-dark.png' });
  await page.screenshot({ path: SP + '1406-full-375-dark.png', fullPage: true });

  /* ---- review mode reload ---- */
  await page.reload(); await page.waitForTimeout(500);
  log('review banner:', await page.evaluate(() => !!document.querySelector('.banner') && !document.querySelector('.banner.resume')), 'victory shown:', await page.evaluate(() => document.querySelector('#victory').classList.contains('show')), '|', await bar());

  log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})();
