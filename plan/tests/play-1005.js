const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1005-notification-boss-design-it-live.html';
const DIR = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const W = +(process.argv[2] || 375), SCHEME = process.argv[3] || 'dark';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: W, height: 800 }, colorScheme: SCHEME });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(300);
  const log = (...a) => console.log(...a);
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const run = () => page.evaluate(() => JSON.stringify((JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['1005']));
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };
  const shot = async (sel, name) => { await page.locator(sel).screenshot({ path: DIR + `1005-${W}-${SCHEME}-${name}.png` }); };

  /* ---- stage 1 ---- */
  await page.locator('#s1open .opt').first().waitFor();
  await clickOpt('#s1open', 'Ask questions');
  await page.locator('#qdeck .opt').first().waitFor({ state: 'visible' });
  await clickOpt('#qdeck', 'programming language');
  for (const q of ['Which kinds', 'real-time', 'Which devices', 'What triggers', 'opt out', 'login codes', 'How many notifications']) {
    await clickOpt('#qdeck', q); await page.waitForTimeout(120);
  }
  await page.locator('#s1lock .opt').first().waitFor({ timeout: 8000 });
  await clickOpt('#qdeck', 'Which countries'); // bonus still allowed before lock-in
  await clickOpt('#s1lock', '10M push, 1M SMS');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  log('stage 1 cleared', await run(), 'clock', await page.textContent('#ivClock'));
  await shot('#s1', 's1');

  /* ---- stage 2 ---- */
  await page.locator('#s2q0 .opt').first().waitFor({ timeout: 8000 });
  await clickOpt('#s2q0', 'Device tokens');
  await page.locator('#s2q1 .opt').first().waitFor({ timeout: 8000 });
  await clickOpt('#s2q1', 'single point of failure');
  await page.locator('#tiles .opt').first().waitFor({ state: 'visible', timeout: 8000 });
  await page.click('#tiles .opt[data-k="wrk"]'); // dependency missing: −1 min
  await page.click('#tiles .opt[data-k="onebig"]'); // decoy: −1 heart
  log('after decoy hearts =', await hearts());
  for (const k of ['svc', 'srv', 'lb', 'cache', 'db', 'qios', 'qand', 'qsms', 'qmail', 'wrk', 'apns', 'fcm', 'smsp', 'mailp']) await page.click(`#tiles .opt[data-k="${k}"]`);
  log('arch status:', await page.textContent('#archStatus'));
  await page.locator('#s2flow .opt').first().waitFor({ timeout: 8000 });
  await page.click('#s2flow .opt[data-i="3"]'); // out of order
  for (let i = 0; i < 6; i++) {
    await page.click(`#s2flow .opt[data-i="${i}"]`);
    await page.waitForFunction(i => document.querySelector(`#s2flow .opt[data-i="${i}"] .n`), i);
    await page.waitForTimeout(1200);
  }
  await shot('#s2 .sim', 's2arch');
  await page.locator('#s2q2 .opt').first().waitFor({ timeout: 8000 });
  await clickOpt('#s2q2', 'Isolation');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  log('stage 2 cleared', await run(), 'hearts', await hearts(), 'clock', await page.textContent('#ivClock'));

  /* ---- reload mid-quest ---- */
  await page.reload(); await page.waitForTimeout(600);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), s2: document.querySelector('#s2').classList.contains('cleared'), clock: document.querySelector('#ivClock').textContent }));
  log('after reload:', JSON.stringify(resume), 'hearts', await hearts());
  if (!resume.banner || !resume.s1 || !resume.s2) errs.push('resume failed');

  /* ---- stage 3 ---- */
  await page.click('#mleft .opt[data-k="lost"]'); await page.click('#mright .opt[data-k="alert"]'); // wrong pair
  for (const k of ['lost', 'dup', 'iso', 'burst', 'alert', 'behind', 'spam', 'over', 'tmpl', 'track']) { await page.click(`#mleft .opt[data-k="${k}"]`); await page.click(`#mright .opt[data-k="${k}"]`); }
  log('match lines drawn:', await page.evaluate(() => document.querySelectorAll('#mlines path').length));
  await shot('#s3 .sim', 's3arch');
  await page.locator('#s3f .opt').first().waitFor({ timeout: 8000 });
  await clickOpt('#s3f', 'On the server');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  log('stage 3 cleared', await run(), 'hearts', await hearts());

  /* ---- stage 4 ---- */
  for (let i = 0; i < 7; i++) {
    await page.click(`#barrage .opts .opt[data-i="${i === 2 ? 1 : 0}"]`); // one junior answer
    if (i === 2) log('junior hearts =', await hearts());
    await page.click('#barrage .q-arena .btn.primary');
  }
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  log('stage 4 cleared', await run(), 'hearts', await hearts());

  /* ---- stage 5 ---- */
  for (const t of ['Reliability', 'Security', 'Tracking', 'Respect user', 'high-priority queue']) await clickOpt('#wrapcards', t);
  await page.click('#deliver');
  await page.locator('#s5q .opt').first().waitFor({ timeout: 15000 });
  await clickOpt('#s5q', 'exactly-once');
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  log('stage 5 cleared', await run(), 'hearts', await hearts());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', Array.from({ length: 50 }, (_, i) => 'word' + i).join(' '));
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 6000 });
  const end = await page.evaluate(() => ({ lesson: JSON.parse(localStorage.getItem('sdq:v1')).lessons['1005'], iv: Object.keys(JSON.parse(localStorage.getItem('sdq:v1:1005-interview') || '{}')), score: document.querySelector('.sc-overall') && document.querySelector('.sc-overall').textContent.replace(/\s+/g, ' '), overflow: document.documentElement.scrollWidth - innerWidth }));
  log('VICTORY', JSON.stringify(end));
  await shot('#scorecard', 'score');
  await page.screenshot({ path: DIR + `1005-${W}-${SCHEME}-full.png`, fullPage: true });

  /* ---- review mode reload ---- */
  await page.reload(); await page.waitForTimeout(500);
  log('review banner:', await page.evaluate(() => !!document.querySelector('.banner') && !document.querySelector('.banner.resume')), 'victory shown:', await page.evaluate(() => document.querySelector('#victory').classList.contains('show')));

  log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})();
