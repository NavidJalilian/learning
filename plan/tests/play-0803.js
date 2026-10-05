const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0803-url-shortener-base62.html';
const SHOT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/0803-375-dark.png';
const RIGHT = ['The value 10', 'The value 36', 'Numbers near 2⁶³ need about 10.6 base-62 digits',
  'IDs go up by one, so the next code is predictable', 'Scramble the ID with a secret key, then encode'];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
  await page.goto(FILE);
  const ok = async n => { await page.waitForSelector(`#s${n}.cleared`, { timeout: 40000 }); console.log('stage', n, 'cleared', await page.evaluate(() => { try { const d = JSON.parse(localStorage.getItem('sdq:v1')); return (d.runs['0803'] || d.lessons['0803']).xp; } catch (e) { return e.message; } })); };
  async function answerQuiz(sel) {
    await page.waitForSelector(`${sel} .quiz .opt:not([disabled])`, { timeout: 10000 });
    const opts = await page.$$(`${sel} .quiz .opt:not([disabled])`);
    for (const o of opts) { const t = (await o.textContent()).trim(); if (RIGHT.includes(t)) { await o.click(); return; } }
    throw new Error('no right option in ' + sel);
  }
  // stage 1 (one wrong division first)
  await page.fill('#qIn', '180'); await page.fill('#rIn', '1'); await page.click('#divGo');
  console.log('after wrong, hearts lost:', await page.$$eval('.heart.lost', x => x.length));
  for (const [q, r] of [[179, 59], [2, 55], [0, 2]]) {
    await page.fill('#qIn', String(q)); await page.fill('#rIn', String(r)); await page.click('#divGo');
    await page.click(`#kb1 .key[data-i="${r}"]`);
  }
  await page.waitForSelector('#reveal1 .code');
  console.log('reveal code:', await page.textContent('#reveal1 .code'));
  await answerQuiz('#s1quiz'); await page.waitForTimeout(700);
  await page.waitForSelector('#s1quiz .quiz:nth-of-type(2) .opt'); await answerQuiz('#s1quiz');
  await ok(1);
  // stage 2
  const puz = { '2TX': '11157', '10': '62', 'zz': '2205' };
  for (const box of await page.$$('#puzzles .puz')) {
    const code = (await (await box.$('code')).textContent()).trim();
    await (await box.$('input')).fill(puz[code]); await (await box.$('.pz-go')).click();
  }
  await page.click('#mEnc'); await page.waitForFunction(() => document.querySelector('#mCode').value === 'zn9edcu', null, { timeout: 10000 });
  console.log('machine:', await page.textContent('#mOut'));
  await ok(2);
  // reload mid-quest
  await page.reload(); await page.waitForTimeout(500);
  console.log('resume banner:', !!(await page.$('.banner.resume')), 'cleared after reload:', await page.$$eval('.stage.cleared', x => x.map(s => s.id)));
  // stage 3
  const p3 = await page.$$('#predict3 .opt');
  for (const o of p3) if ((await o.textContent()).includes('56,800,235,584')) await o.click();
  await page.click('#oSpeed button[data-v="1000000000"]');
  await page.click('#oRun');
  await page.waitForSelector('#sfwrap.on', { timeout: 40000 });
  console.log('odometer at:', await page.textContent('#olen'));
  await page.click('#srcSeg button[data-s="sf"]');
  console.log('snowflake:', await page.textContent('#olen'));
  await answerQuiz('#s3quiz');
  await ok(3);
  // stage 4
  for (let i = 0; i < 5; i++) await page.click('#tryNext');
  await page.click('#scrOn');
  for (let i = 0; i < 5; i++) await page.click('#tryNext');
  console.log('alarm:', (await page.textContent('#alarm')).slice(0, 60));
  await answerQuiz('#s4quiz'); await page.waitForTimeout(700);
  await page.waitForSelector('#s4quiz .quiz:nth-of-type(2) .opt'); await answerQuiz('#s4quiz');
  await ok(4);
  // stage 5
  const ANS = { 'Short URL length is fixed': 'hash', 'Needs a unique ID generator': 'b62', 'Collisions can happen and must be resolved': 'hash', 'The next short URL is easy to guess': 'b62', 'Length grows as the ID grows': 'b62', 'Collisions are impossible': 'b62', 'No unique ID generator needed': 'hash', 'The next short URL can’t be worked out': 'hash' };
  let first = true;
  while (await page.$('#pool .pcard')) {
    const c = await page.$('#pool .pcard'); const t = (await (await c.$('p')).textContent()).trim();
    if (first) { first = false; await (await c.$(`.opt[data-k="${ANS[t] === 'hash' ? 'b62' : 'hash'}"]`)).click(); console.log('bounce hint:', await (await c.$('.hint')).textContent()); }
    await (await c.$(`.opt[data-k="${ANS[t]}"]`)).click();
  }
  await ok(5);
  // stage 6
  const BOSS = { 'No ID service': 'hash', 'No retry loops': 'b62', 'Private lab reports': 'hash', 'Short and sweet at launch': 'b62', 'Competitors are counting': 'hash', 'Zero uniqueness lookups': 'b62' };
  for (let i = 0; i < 6; i++) {
    const t = (await page.textContent('#boss .scenario h3')).trim();
    await page.click(`#boss .choice .opt[data-c="${BOSS[t]}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await ok(6);
  // stage 7
  await page.fill('#drill textarea', 'I would take a unique ID from a generator and base 62 encode it so there are never collisions, but scramble it so codes are not guessable.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await ok(7);
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY:', (await page.textContent('#victory h2')).trim(), '| xp', await page.textContent('#victory .vstats b'));
  console.log('errors:', errs.length ? errs : 'none');
  await ctx.close();
  // screenshot at 375 dark (fresh context, partially played stage 1 + stage 3 states visible)
  const c2 = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const p2 = await c2.newPage(); const e2 = [];
  p2.on('pageerror', e => e2.push(e.message));
  await p2.goto(FILE); await p2.waitForTimeout(400);
  await p2.fill('#qIn', '179'); await p2.fill('#rIn', '59'); await p2.click('#divGo');
  await p2.screenshot({ path: SHOT, fullPage: true });
  console.log('overflowX 375:', await p2.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'errors:', e2.length ? e2 : 'none');
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
