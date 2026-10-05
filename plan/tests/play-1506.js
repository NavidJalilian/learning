const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1506-drive-boss-design-it-live.html';
const SHOT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/1506-375-dark.png';
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
  const xp = () => page.evaluate(() => (JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['1506']);
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };

  /* ---- stage 1 ---- */
  await clickOpt('#s1open', 'Ask questions to pin down scope');
  for (const q of ['most important features', 'Mobile app, web app', 'maximum file size', 'stored files need', 'daily active users']) {
    await page.locator('#qdeck .opt', { hasText: q }).click(); await page.waitForTimeout(150);
  }
  await page.locator('#s1nfr .opt').first().waitFor();
  await clickOpt('#s1nfr', 'Reliability');
  await page.locator('#inStore').waitFor();
  await page.fill('#inStore', '5000'); await page.fill('#inQps', '240'); await page.fill('#inPeak', '480');
  await page.click('#estGo');
  log('after wrong estimate hearts =', await hearts());
  await page.fill('#inStore', '500'); await page.click('#estGo');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  log('stage 1 cleared', await xp());

  /* ---- stage 2 ---- */
  for (const k of ['block', 'cloud', 'cold', 'lb', 'api', 'cache', 'db', 'notif', 'queue']) await page.click(`#tiles .opt[data-k="${k}"]`);
  const link = async (a, b) => { await page.click(`#arch .nd[data-k="${a}"]`); await page.click(`#arch .nd[data-k="${b}"]`); };
  await link('user', 'cloud'); // bad link: costs time only
  await page.click('#nudgeBtn');
  await link('api', 'cloud'); // optional callback link
  for (const [a, b] of [['user', 'block'], ['block', 'cloud'], ['cloud', 'cold'], ['user', 'lb'], ['lb', 'api'], ['api', 'cache'], ['cache', 'db'], ['api', 'notif'], ['notif', 'user'], ['notif', 'queue']]) await link(a, b);
  log('arch status:', await page.textContent('#archStatus'));
  await page.locator('#s2api .sort-item').first().waitFor({ timeout: 5000 });
  for (const [i, p] of [[0, 'data'], [1, 'path'], [2, 'limit']]) await page.click(`#s2api .sort-item[data-i="${i}"] .opt[data-p="${p}"]`);
  await page.locator('#s2q .opt').first().waitFor({ timeout: 5000 });
  await clickOpt('#s2q', 'API: sign-in');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  log('stage 2 cleared', await xp(), 'hearts', await hearts());

  /* ---- reload mid-quest ---- */
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), s2: document.querySelector('#s2').classList.contains('cleared'), clock: document.querySelector('#ivClock').textContent }));
  log('after reload:', JSON.stringify(resume), 'hearts', await hearts());
  if (!resume.banner || !resume.s1 || !resume.s2) errs.push('resume failed');

  /* ---- stage 3 ---- */
  // one wrong pair first
  await page.click('#mleft .opt[data-k="sync"]'); await page.click('#mright .opt[data-k="cost"]');
  for (const k of ['sync', 'sec', 'cons', 'rev', 'conf', 'notify', 'off', 'cost', 'big']) { await page.click(`#mleft .opt[data-k="${k}"]`); await page.click(`#mright .opt[data-k="${k}"]`); }
  const lines = await page.evaluate(() => document.querySelectorAll('#mlines path').length);
  log('match lines drawn:', lines);
  const FOLLOW_OK = ['completion callback', 'one-way and infrequent', 'look random', 'ACID comes built in'];
  for (const sel of ['#s3f1', '#s3f2']) {
    await page.locator(`${sel} .opt`).first().waitFor({ timeout: 8000 });
    const texts = await page.locator(`${sel} .opt`).allTextContents();
    const t = texts.find(x => FOLLOW_OK.some(f => x.includes(f)));
    await clickOpt(sel, t);
  }
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  log('stage 3 cleared', await xp(), 'hearts', await hearts());

  /* ---- stage 4 ---- */
  const ANS = { 'metadata DB master': 'b', 'notification server': 'a', 'S3 is down': 'c', 'One byte': 'c', 'Two saves': 'b', 'block server dies': 'a', 'storage bill': 'c' };
  for (let i = 0; i < 7; i++) {
    const t = await page.textContent('#barrage .scenario h3');
    const k = Object.entries(ANS).find(([s]) => t.includes(s))[1];
    await page.click(`#barrage .choice .opt[data-c="${k}"]`);
    await page.click('#barrage .q-arena .btn.primary');
  }
  await page.locator('#s4bonus .opt').first().waitFor();
  await clickOpt('#s4bonus', 'Cut block edges');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  log('stage 4 cleared', await xp(), 'hearts', await hearts());

  /* ---- stage 5 ---- */
  const SIDE = ['L', 'L', 'R', 'R', 'R'];
  const rows = await page.$$eval('#chiprows .chiprow', rs => rs.map(r => r.dataset.i));
  for (const i of rows) await page.click(`#chiprows .chiprow[data-i="${i}"] .opt[data-s="${SIDE[+i]}"]`);
  await page.locator('#s5extras').waitFor({ state: 'visible', timeout: 8000 });
  await clickOpt('#wrapcards', 'presence service'); await clickOpt('#wrapcards', 'Rate-limit');
  await page.click('#mention');
  await page.locator('#s5q .opt').first().waitFor({ timeout: 8000 });
  await clickOpt('#s5q', 'Logic must be rebuilt');
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  log('stage 5 cleared', await xp(), 'hearts', await hearts());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', Array.from({ length: 60 }, (_, i) => 'word' + i).join(' '));
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 6000 });
  const end = await page.evaluate(() => ({ lesson: JSON.parse(localStorage.getItem('sdq:v1')).lessons['1506'], iv: Object.keys(JSON.parse(localStorage.getItem('sdq:v1:1506-interview') || '{}')), score: document.querySelector('.sc-overall') && document.querySelector('.sc-overall').textContent.replace(/\s+/g, ' '), overflow: document.documentElement.scrollWidth - innerWidth }));
  log('VICTORY', JSON.stringify(end));
  await page.locator('#s2').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SHOT, fullPage: true });

  /* ---- review mode reload ---- */
  await page.reload(); await page.waitForTimeout(500);
  log('review banner:', await page.evaluate(() => !!document.querySelector('.banner') && !document.querySelector('.banner.resume')), 'victory shown:', await page.evaluate(() => document.querySelector('#victory').classList.contains('show')));

  log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})();
