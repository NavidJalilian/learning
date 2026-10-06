const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0906-web-crawler-boss-design-it-live.html';
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
  const run = () => page.evaluate(() => (JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['0906']);
  const clickText = async (sel, text) => { const loc = page.locator(sel, { hasText: text }).first(); await loc.waitFor({ state: 'visible' }); await loc.click(); };
  const cleared = n => page.waitForSelector(`#s${n}.cleared`, { timeout: 15000 });

  /* ---- stage 1 ---- */
  await page.waitForSelector('#qdeck .opt');
  await clickText('#qdeck .opt', 'programming language');
  for (const t of ['What is the crawler for', 'How many pages', 'Which content types', 'new and edited', 'how long']) await clickText('#qdeck .opt', t);
  await page.waitForSelector('#traits .opt');
  console.log('  told:', await page.locator('#reqs .req.told').count(), 'got:', await page.locator('#reqs .req.got').count());
  let h0 = await hearts();
  for (const k of ['scale', 'robust', 'polite', 'rt']) await page.locator(`#traits .opt[data-t="${k}"]`).click();
  await page.locator('#traitGo').click();
  console.log('  wrong traits cost heart:', h0 - await hearts() === 1);
  await page.locator('#traits .opt[data-t="rt"]').click();
  await page.locator('#traits .opt[data-t="ext"]').click();
  await page.locator('#traitGo').click();
  await page.waitForSelector('#ests .est');
  await page.locator('#ests .est[data-e="0"] .opt[data-i="1"]').click();
  for (let k = 0; k < 4; k++) await page.locator(`#ests .est[data-e="${k}"] .opt[data-i="0"]`).click();
  await cleared(1);
  console.log('stage 1 cleared; hearts', await hearts(), 'run', JSON.stringify(await run()));

  /* ---- reload mid-quest ---- */
  await page.reload();
  await page.waitForSelector('.banner.resume');
  console.log('resume banner:', (await page.locator('.banner.resume').innerText()).slice(0, 90).replace(/\n/g, ' '));
  console.log('  s1 cleared after reload:', await page.locator('#s1.cleared').count() === 1, 'hearts', await hearts());

  /* ---- stage 2 ---- */
  await page.waitForSelector('#tiles .opt');
  await page.locator('#tiles .opt[data-k="pubsub"]').click();
  for (const k of ['seed', 'frontier', 'dl', 'dns', 'parser', 'cseen', 'cstore', 'extract', 'filter']) await page.locator(`#tiles .opt[data-k="${k}"]`).click();
  await page.locator('#buyin').click(); // missing boxes
  await page.waitForTimeout(100);
  for (const k of ['useen', 'ustore']) await page.locator(`#tiles .opt[data-k="${k}"]`).click();
  const box = async k => page.locator(`#wb .bx[data-b="${k}"]`).click();
  h0 = await hearts();
  await box('extract'); await box('frontier'); // bad edge
  console.log('  bad edge cost heart:', h0 - await hearts() === 1);
  await page.locator('#wb .bx[data-b="seed"]').focus(); await page.keyboard.press('Enter');
  await page.locator('#wb .bx[data-b="frontier"]').focus(); await page.keyboard.press('Enter');
  for (const [a, b] of [['frontier', 'dl'], ['dl', 'dns'], ['dl', 'parser'], ['parser', 'cseen'], ['cseen', 'cstore'], ['cseen', 'extract'], ['extract', 'filter'], ['filter', 'useen'], ['useen', 'ustore']]) { await box(a); await box(b); }
  await page.locator('#buyin').click(); // missing loop edge
  await page.waitForTimeout(100);
  await box('useen'); await box('frontier');
  console.log('  edges drawn:', await page.locator('#wb path.edge').count());
  await page.locator('#wbWrap').screenshot({ path: SP + 'p0906-wb.png' });
  await page.locator('#buyin').click();
  await clickText('#s2q1 .opt', 'Hashes are tiny');
  await page.waitForSelector('#s2q2 .opt');
  await clickText('#s2q2 .opt', 'SQL LIKE');
  await clickText('#s2q2 .opt', 'Bloom filter');
  await clickText('#s2q3 .opt', 'False positives');
  await cleared(2);
  console.log('stage 2 cleared; hearts', await hearts());

  /* ---- stage 3 ---- */
  await clickText('#bfsQ .opt', 'BFS, but plain');
  await page.waitForSelector('#parts .opt');
  const drop = async (p, z) => { await page.locator(`#parts .opt[data-p="${p}"]`).click(); await page.locator(`#frame .zone[data-z="${z}"]`).click(); };
  await drop('prio', 'back'); // wrong → heart
  await page.locator('#parts .opt[data-p="prio"]').click(); // deselect after wrong? still selected; clicking toggles off
  for (const [p, z] of [['prio', 'front'], ['fq', 'front'], ['fsel', 'front'], ['router', 'back'], ['map', 'back'], ['bq', 'back'], ['bsel', 'back'], ['work', 'back']]) await drop(p, z);
  await clickText('#politeQ .opt', 'The back queues');
  await clickText('#storeQ .opt', 'Mostly on disk');
  await page.waitForSelector('#prof .pbar');
  const fix = async (b, f) => { await page.locator(`#prof .pbar[data-b="${b}"]`).click(); await page.locator(`#fixes .opt[data-f="${f}"]`).click(); };
  await fix('dns', 'local'); // wrong
  await page.locator('#fixes .opt[data-f="dns"]').click(); // dns bar still selected
  for (const [b, f] of [['far', 'local'], ['dead', 'timeout'], ['robots', 'robots']]) await fix(b, f);
  console.log('  batch time:', await page.locator('#btime').innerText());
  await page.locator('#pDown').screenshot({ path: SP + 'p0906-down.png' });
  await clickText('#push1 .opt', 'Switch off');
  await clickText('#push1 .opt', 'Accept it');
  await page.waitForSelector('#push2 .opt');
  await clickText('#push2 .opt', 'Only the hosts on');
  await cleared(3);
  console.log('stage 3 cleared; hearts', await hearts());
  await page.locator('#pFront').screenshot({ path: SP + 'p0906-front.png' });
  await page.locator('#pPush').screenshot({ path: SP + 'p0906-push.png' });

  /* ---- stage 4 ---- */
  const ANS = { 'A site owner': 'frontier', 'spam forums': 'frontier', 'name lookups': 'download', 'crawl server crashes': 'robust', 'JavaScript-heavy': 'content', '50 million URLs': 'content', '10 downloader servers': 'robust', 'Stale news': 'frontier', 'never answer': 'download', 'syndicated story': 'content' };
  for (let i = 0; i < 10; i++) {
    await page.waitForSelector('#boss .scenario h3');
    const t = (await page.locator('#boss .scenario h3').innerText()).trim();
    const key = Object.keys(ANS).find(k => t.includes(k));
    if (!key) throw new Error('unknown scenario ' + t);
    await page.locator(`#boss .choice .opt[data-c="${ANS[key]}"]`).click();
    await page.locator('#boss .row .btn.primary').click();
  }
  await cleared(4);
  console.log('stage 4 cleared; hearts', await hearts());

  /* ---- stage 5 ---- */
  await page.locator('#wrapGo').click();
  await page.waitForSelector('#wrapcards .opt');
  for (const t of ['Render JavaScript', 'anti-spam', 'Replicate and shard', 'stateless', 'per IP']) await clickText('#wrapcards .opt', t);
  await page.locator('#deliver').click();
  await cleared(5);
  console.log('stage 5 cleared; hearts', await hearts());

  /* ---- stage 6 ---- */
  await page.locator('#drill textarea').fill('Scope: search indexing crawler, one billion HTML pages a month, new and edited pages, keep five years, skip duplicates. About 400 pages a second, 800 peak, 500 TB a month, 30 PB in five years. Scalable, robust, polite, extensible. Seed URLs, frontier, downloader with DNS, parser, content seen, storage, extractor, filter, URL seen with a Bloom filter, back to frontier. Front queues for priority and back queues for politeness. Cache DNS, locality, short timeouts, robots cache, consistent hashing, checkpoints. Cap URL length for traps, render JavaScript.');
  await page.locator('#drill .q-reveal').click();
  const cbs = page.locator('#drill .selfgrade input');
  for (let i = 0; i < await cbs.count(); i++) await cbs.nth(i).check();
  await page.locator('#drill .q-finish').click();
  await page.waitForSelector('#victory.show', { timeout: 15000 });
  console.log('VICTORY shown:', (await page.locator('#victory h2').innerText()).trim());
  const lessons = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).lessons['0906']);
  console.log('saved lesson:', JSON.stringify(lessons));
  console.log('interview record:', await page.evaluate(() => localStorage.getItem('sdq:v1:0906-interview')));
  console.log('scorecard overall:', (await page.locator('.sc-overall').innerText()).replace(/\n/g, ' '));
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('overflowX', ov);
  await page.locator('#s1').screenshot({ path: SP + 'p0906-s1.png' });
  await page.locator('#s6').screenshot({ path: SP + 'p0906-s6.png' });
  await page.screenshot({ path: SP + 'p0906-375-dark-full.png', fullPage: true });
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
