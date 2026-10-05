const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0805-url-shortener-boss-design-it-live.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: process.env.MOTION ? 'no-preference' : 'reduce' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE);
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const xp = () => page.evaluate(() => (JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['0805']);
  const clickText = async (sel, text) => { const loc = page.locator(sel, { hasText: text }).first(); await loc.waitFor({ state: 'visible' }); await loc.click(); };
  const cleared = n => page.waitForSelector(`#s${n}.cleared`, { timeout: 15000 });

  /* ---- stage 1 ---- */
  await page.waitForSelector('#qdeck .opt');
  await clickText('#qdeck .opt', 'programming language');
  for (const t of ['walk me through', 'How many new', 'How short', 'Which characters', 'edited or deleted', 'non-functional']) await clickText('#qdeck .opt', t);
  await page.waitForSelector('#ests .est');
  // one wrong estimate first
  await page.locator('#ests .est[data-e="0"] .opt[data-i="1"]').click();
  for (let k = 0; k < 4; k++) await page.locator(`#ests .est[data-e="${k}"] .opt[data-i="0"]`).click();
  await cleared(1);
  console.log('stage 1 cleared; hearts', await hearts(), 'run', JSON.stringify(await xp()));
  const told = await page.locator('#reqs .req.got').count();
  console.log('  board facts asked:', told);

  /* ---- reload mid-quest ---- */
  await page.reload();
  await page.waitForSelector('.banner.resume');
  console.log('resume banner:', (await page.locator('.banner.resume').innerText()).slice(0, 90).replace(/\n/g, ' '));
  console.log('  s1 cleared after reload:', await page.locator('#s1.cleared').count() === 1, 'hearts', await hearts());

  /* ---- stage 2 ---- */
  await clickText('#s2api .opt', 'POST api/v1/data/shorten');
  await page.waitForSelector('#tiles .opt');
  for (const k of ['client', 'lb', 'web', 'cache', 'db']) await page.locator(`#tiles .opt[data-k="${k}"]`).click();
  await page.locator('#buyin').click(); // should fail: idgen missing
  await page.waitForTimeout(200);
  for (const k of ['idgen', 'rl', 'kafka']) await page.locator(`#tiles .opt[data-k="${k}"]`).click();
  const box = async k => page.locator(`#wb .bx[data-b="${k}"]`).click();
  const h0 = await hearts();
  await box('client'); await box('db'); // bad edge → heart
  console.log('  bad edge cost heart:', h0 - await hearts() === 1);
  // keyboard connect for one edge
  await page.locator('#wb .bx[data-b="client"]').focus(); await page.keyboard.press('Enter');
  await page.locator('#wb .bx[data-b="lb"]').focus(); await page.keyboard.press('Enter');
  for (const [a, b] of [['lb', 'web'], ['web', 'cache'], ['web', 'db'], ['web', 'idgen'], ['client', 'rl']]) { await box(a); await box(b); }
  console.log('  edges drawn:', await page.locator('#wb line.edge').count());
  await page.locator('#buyin').click();
  await page.waitForSelector('#s2redir .pick2 .opt');
  await page.locator('#s2redir .pick2 .opt[data-c="301"]').click();
  await page.locator('#s2redir .reasons .opt[data-r="stats"]').click();
  await page.locator('#redirGo').click(); // mismatch → heart
  await page.locator('#s2redir .pick2 .opt[data-c="302"]').click();
  await page.locator('#redirGo').click();
  await cleared(2);
  console.log('stage 2 cleared; hearts', await hearts());
  await page.screenshot({ path: SP + 'p0805-s2.png', fullPage: false, clip: undefined });
  await page.locator('#wbWrap').screenshot({ path: SP + 'p0805-wb.png' });

  /* ---- stage 3 ---- */
  await page.waitForSelector('#pSchema .cols .opt');
  for (const c of ['id', 'shortURL', 'longURL']) await page.locator(`#pSchema .cols .opt[data-c="${c}"]`).click();
  await page.locator('#schemaGo').click();
  await page.waitForSelector('#lenR');
  await page.locator('#lenR').fill('6'); await page.locator('#lenGo').click(); // wrong → heart
  await page.locator('#lenR').fill('7'); await page.locator('#lenGo').click();
  await page.waitForSelector('#pGen .gen .opt');
  await page.locator('#pGen .gen .opt[data-g="b62"]').click();
  await clickText('#genPush .opt', 'Scramble the ID');
  await page.waitForSelector('#genCmp table');
  console.log('  worked example code:', await page.locator('#genCmp code').innerText());
  const FL = [
    ['A long URL arrives', 'Look the long URL up', 'Found it?', 'New URL: get a unique ID', 'Convert that ID', 'Save the row'],
    ['The user clicks', 'The load balancer forwards', 'Cache hit?', 'Cache miss', 'Send the long URL back'],
  ];
  await page.waitForSelector('.order[data-f="0"] .pool .opt');
  for (const t of FL[0]) await clickText('.order[data-f="0"] .pool .opt', t);
  await page.waitForSelector('.order[data-f="1"] .pool .opt');
  // one wrong tap in redirect flow
  await clickText('.order[data-f="1"] .pool .opt', 'Cache miss');
  for (const t of FL[1]) await clickText('.order[data-f="1"] .pool .opt', t);
  await cleared(3);
  console.log('stage 3 cleared; hearts', await hearts());

  /* ---- stage 4 ---- */
  const ANS = { 'One link goes viral': 'cache', 'The database primary dies': 'data', '365 billion rows on one box?': 'data', 'Bots mass-create links': 'guard', 'Someone enumerates the codes': 'design', '"Make it 10× bigger"': 'design', 'A link to a malware site': 'guard', 'The cache restarts cold': 'cache' };
  for (let i = 0; i < 8; i++) {
    await page.waitForSelector('#boss .scenario h3');
    const t = (await page.locator('#boss .scenario h3').innerText()).trim();
    if (!ANS[t]) throw new Error('unknown scenario ' + t);
    await page.locator(`#boss .choice .opt[data-c="${ANS[t]}"]`).click();
    await page.locator('#boss .row .btn.primary').click();
  }
  await cleared(4);
  console.log('stage 4 cleared; hearts', await hearts());

  /* ---- stage 5 ---- */
  await page.locator('#wrapGo').click();
  await page.waitForSelector('#wrapcards .opt');
  for (const t of ['rate limiter on the shorten', 'stateless', 'Replicate the database', 'Shard the database', 'click analytics']) await clickText('#wrapcards .opt', t);
  await page.locator('#deliver').click();
  await cleared(5);
  console.log('stage 5 cleared; hearts', await hearts());

  /* ---- stage 6 ---- */
  await page.locator('#drill textarea').fill('Scope first: 100 million new URLs a day, codes from 0-9 a-z A-Z, no edits. About 1160 writes and 11600 reads a second, 365 billion rows, 36.5 TB. POST to shorten and GET to redirect with 301 or 302. Seven characters of base 62 from a unique ID, scrambled. Cache in front of the DB, rate limiter, replication, sharding and analytics.');
  await page.locator('#drill .q-reveal').click();
  const cbs = page.locator('#drill .selfgrade input');
  for (let i = 0; i < await cbs.count(); i++) await cbs.nth(i).check();
  await page.locator('#drill .q-finish').click();
  await page.waitForSelector('#victory.show', { timeout: 15000 });
  console.log('VICTORY shown:', (await page.locator('#victory h2').innerText()).trim());
  const lessons = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).lessons['0805']);
  console.log('saved lesson:', JSON.stringify(lessons));
  console.log('interview record:', await page.evaluate(() => localStorage.getItem('sdq:v1:0805-interview')));
  console.log('scorecard overall:', (await page.locator('.sc-overall').innerText()).replace(/\n/g, ' '));
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('overflowX', ov);
  await page.locator('#s3').screenshot({ path: SP + 'p0805-s3.png' });
  await page.locator('#s6').screenshot({ path: SP + 'p0805-s6.png' });
  await page.locator('#s1').screenshot({ path: SP + 'p0805-s1.png' });
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
