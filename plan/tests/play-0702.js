// Playthrough for quest 0702: clears every stage via real clicks, reloads mid-quest, checks victory.
const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0702-uuid-and-ticket-server.html';
const SHOT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/0702-375-dark.png';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const reduced = process.argv[2] === 'reduced';
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.goto(FILE, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  const log = (...a) => console.log(...a);

  async function clickOpt(scope, prefix) {
    const loc = page.locator(`${scope} .opt:not([disabled])`).filter({ hasText: prefix }).first();
    await loc.waitFor({ state: 'visible', timeout: 15000 });
    await loc.click();
  }
  async function answerQuizzes(mount, prefixes) {
    for (let i = 0; i < prefixes.length; i++) {
      await page.locator(`${mount} .quiz`).nth(i).waitFor({ timeout: 15000 });
      await clickOpt(`${mount} .quiz >> nth=${i} >>`, prefixes[i]).catch(async () => {
        // fallback: locate inside nth quiz
        const q = page.locator(`${mount} .quiz`).nth(i);
        await q.locator('.opt:not([disabled])').filter({ hasText: prefixes[i] }).first().click();
      });
    }
  }
  async function quizN(mount, prefixes) {
    for (let i = 0; i < prefixes.length; i++) {
      const q = page.locator(`${mount} .quiz`).nth(i);
      await q.waitFor({ timeout: 15000 });
      const o = q.locator('.opt').filter({ hasText: new RegExp('^' + prefixes[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first();
      await o.click();
      const cls = await o.getAttribute('class');
      if (!/right/.test(cls)) throw new Error(`quiz ${mount}#${i} answer "${prefixes[i]}" not right`);
    }
  }
  const cleared = n => page.waitForFunction(n => document.querySelector('#s' + n).classList.contains('cleared'), n, { timeout: 20000 });

  /* stage 1 */
  for (let i = 0; i < 5; i++) await page.click('#uuGen');
  const uu = await page.locator('#uuList .uu').first().textContent();
  log('uuid sample', uu);
  await page.click('#gA .gcol[data-g="3"]'); // near miss, no heart
  await page.click('#gA .gcol[data-g="2"]');
  await page.click('#gBc .gcol[data-i="0"]');
  await page.click('#raceGo');
  await clickOpt('#raceQ', 'No, the order');
  await page.waitForSelector('#raceQ .explain.show');
  const raceOk = await page.$$eval('#race .rrow.off', e => e.length);
  log('race rows out of place', raceOk);
  await quizN('#s1quiz', ['128 bits', 'Too long, unsorted', 'Each server makes its own']);
  await cleared(1); log('stage 1 cleared');

  /* stage 2 */
  await page.$eval('#yrs', el => { el.value = 30; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('#bc1go'); // wrong on purpose? -> costs a heart; skip: we test correct path only
  log('after deliberate wrong lock-in hearts', await page.$$eval('.hud .heart:not(.lost)', e => e.length));
  await page.$eval('#yrs', el => { el.value = 193; el.dispatchEvent(new Event('input', { bubbles: true })); });
  log('gauge at 193:', await page.textContent('#gauge .pc'), await page.textContent('#yrsVal'));
  await page.click('#bc1go');
  await page.fill('#bc2in', '8.6 million');
  await page.click('#bc2go');
  await quizN('#s2quiz', ['No: they']);
  await cleared(2); log('stage 2 cleared');

  /* reload mid-quest */
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(300);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), c1: document.querySelector('#s1').classList.contains('cleared'), c2: document.querySelector('#s2').classList.contains('cleared'), c3: document.querySelector('#s3').classList.contains('cleared'), xp: document.querySelector('.q-xp').textContent, hearts: document.querySelectorAll('.hud .heart:not(.lost)').length }));
  log('resume', JSON.stringify(resume));
  if (!resume.banner || !resume.c1 || !resume.c2 || resume.c3) throw new Error('resume failed');

  /* stage 3 */
  await page.click('#tkRun');
  await clickOpt('#tkBox', 'Every web server');
  await page.locator('#tkBox .btn.primary').filter({ hasText: 'second ticket' }).click();
  await clickOpt('#tkBox', 'One counts odd');
  await page.waitForSelector('#tkBox .explain.show');
  log('ordered badge after two servers:', await page.textContent('#tbOrd'), '| issued:', (await page.textContent('#tkIssued')).replace(/\s+/g, ' '));
  await page.locator('#tkBox .btn.primary').filter({ hasText: 'kill ticket server A' }).click();
  await page.click('#tkKillA');
  await quizN('#s3quiz', ['One part whose crash', 'Count by k', 'A network round trip']);
  await cleared(3); log('stage 3 cleared');

  /* stage 4 */
  const ANS = { mm: [1, 1, 1, 0, 0], uu: [1, 0, 0, 0, 1], ts: [1, 1, 1, 1, 0] };
  const ROWS = ['uniq', 'num', 'b64', 'ord', 'scale'];
  await page.click('#scoreGo'); // blank -> toast only
  for (const c of Object.keys(ANS)) for (let r = 0; r < 5; r++) {
    const sel = `#score .cell[data-c="${c}"][data-r="${ROWS[r]}"]`;
    await page.click(sel); if (ANS[c][r] === 0) await page.click(sel);
  }
  await page.click('#scoreGo');
  await cleared(4); log('stage 4 cleared', await page.textContent('#scoreMsg'));

  /* stage 5 */
  for (const a of ['uuid', 'ticket', 'multi', 'uuid', 'ticket', 'uuid']) {
    const b = page.locator(`#boss .choice .opt[data-c="${a}"]`);
    await b.click();
    if (!/right/.test(await b.getAttribute('class'))) throw new Error('boss wrong ' + a);
    await page.locator('#boss .row .btn.primary').click();
  }
  await cleared(5); log('stage 5 cleared');

  /* stage 6 */
  await page.fill('#drill textarea', 'UUIDs need no coordination but they are 128 bits not 64 and not sorted by time; a ticket server is a single point of failure and more servers need sync.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await cleared(6); log('stage 6 cleared');

  await page.waitForSelector('#victory.show', { timeout: 10000 });
  const fin = await page.evaluate(() => ({ v: document.querySelector('#victory').innerText.replace(/\s+/g, ' ').slice(0, 200), store: localStorage.getItem('sdq:v1'), ovf: document.documentElement.scrollWidth - innerWidth }));
  log('victory:', fin.v);
  log('store:', fin.store);
  log('overflowX', fin.ovf);
  await page.evaluate(() => document.querySelector('#s3').scrollIntoView());
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOT, fullPage: false });
  await page.evaluate(() => document.querySelector('#s4').scrollIntoView());
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOT.replace('.png', '-s4.png') });
  await page.evaluate(() => document.querySelector('#s2').scrollIntoView());
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOT.replace('.png', '-s2.png') });
  await page.evaluate(() => document.querySelector('#s1').scrollIntoView());
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOT.replace('.png', '-s1.png'), fullPage: false });
  log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('FAILED', e); process.exit(1); });
