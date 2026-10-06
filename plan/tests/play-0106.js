const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0106-scale-boss-millions-live.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad';
const REDUCED = process.argv[2] !== 'motion';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: REDUCED ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(500);
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const xp = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs?.['0106']?.xp);
  const cleared = () => page.evaluate(() => [...document.querySelectorAll('.stage.cleared')].map(s => +s.dataset.stage));
  const clickText = async (sel, text) => { await page.locator(sel, { hasText: text }).first().click(); };
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

  /* stage 1 */
  await page.waitForSelector('#qdeck .opt', { timeout: 10000 });
  await clickText('#qdeck .opt', 'colour is the logo');
  for (const t of ['How many users now', 'ratio of reads', 'images or video', 'slow work']) { await clickText('#qdeck .opt', t); await page.waitForTimeout(100); }
  await page.waitForSelector('#s1lock .opt', { timeout: 10000 });
  console.log('s1 board got', await page.$$eval('#reqs .req.got', e => e.length), 'told', await page.$$eval('#reqs .req.told', e => e.length), 'tokens', await page.textContent('#tokens'));
  await clickText('#s1lock .opt', '10 reads');
  await page.waitForTimeout(1300);
  console.log('after s1: cleared', await cleared(), 'hearts', await hearts(), 'xp', await xp(), 'bar', await page.textContent('#ivbar'));

  /* reload mid-quest */
  await page.reload(); await page.waitForTimeout(700);
  console.log('resume banner:', await page.$eval('.banner.resume', e => e.textContent.trim().slice(0, 80)).catch(() => 'NONE'), 'cleared', await cleared(), 'xp', await xp());

  /* stage 2 */
  await page.waitForSelector('#tiles2 .opt');
  await page.click('#tiles2 .opt[data-k="shard"]');
  for (const k of ['webc', 'mob', 'dns', 'web', 'db']) { await page.click(`#tiles2 .opt[data-k="${k}"]`); await page.waitForTimeout(80); }
  await page.waitForSelector('#s2q1 .opt', { timeout: 15000 });
  console.log('s2 log:', (await page.textContent('#log2')).slice(0, 200));
  await page.click('#s2q1 .opt[data-i="0"]');
  await page.waitForSelector('#s2q2 .opt', { timeout: 8000 });
  await page.click('#s2q2 .opt[data-i="0"]');
  await page.waitForTimeout(1300);
  console.log('after s2: cleared', await cleared(), 'hearts', await hearts(), 'xp', await xp());
  await page.locator('#wb2').screenshot({ path: SP + '/0106-wb2.png' });

  /* stage 3 */
  const ORDER = ['lb', 'repl', 'cache', 'cdn', 'stateless', 'dc', 'mq', 'ops', 'shard'];
  for (let i = 0; i < 9; i++) {
    await page.waitForFunction(k => { const b = document.querySelector(`#toolbox .opt[data-k="${k}"]`); return b && !b.disabled; }, ORDER[i], { timeout: 8000 });
    if (i === 0) { await page.click('#toolbox .opt[data-k="shard"]'); await page.click('#toolbox .opt[data-k="up"]'); console.log('wrong msg:', (await page.textContent('#rampEx')).slice(0, 140)); }
    await page.click(`#toolbox .opt[data-k="${ORDER[i]}"]`);
    await page.waitForSelector('#rampQ .opt');
    await page.click(i === 3 ? '#rampQ .opt[data-i="1"]' : '#rampQ .opt[data-i="0"]');
    await page.waitForSelector('#rampGo');
    if (i === 4) await page.locator('.ramp').screenshot({ path: SP + '/0106-ramp-mid.png' });
    await page.click('#rampGo');
  }
  await page.waitForTimeout(1200);
  console.log('after s3: cleared', await cleared(), 'hearts', await hearts(), 'xp', await xp(), 'dash', (await page.textContent('#dash')).slice(0, 120));
  await page.locator('#wb3').screenshot({ path: SP + '/0106-wb3-final.png' });

  /* stage 4 */
  const ANS = { 'load balancer': 'redundancy', 'only cache': 'redundancy', 'viral': 'cache', 'Brazil': 'cache', 'Signing up': 'async', 'primary database dies': 'redundancy', 'Writes outgrow': 'data', '8 shards': 'data' };
  for (let i = 0; i < 8; i++) {
    const h = await page.textContent('#barrage .scenario h3');
    const k = Object.entries(ANS).find(([t]) => h.includes(t))[1];
    await page.click(`#barrage .choice .opt[data-c="${k}"]`);
    await page.click('#barrage .q-arena .row .btn.primary');
  }
  await page.waitForTimeout(800);
  console.log('after s4: cleared', await cleared(), 'xp', await xp());

  /* stage 5 */
  await page.waitForSelector('#rules .opt');
  for (const t of ['Always start with microservices', 'Shard the database on day one', 'stateless', 'redundancy', 'Cache data', 'multiple data', 'static assets', 'Split tiers']) await clickText('#rules .opt', t);
  await page.click('#lockRules');
  await page.waitForSelector('#rulesAgain', { timeout: 8000 });
  console.log('retry path ex:', (await page.textContent('#rulesEx')).slice(0, 200), 'hearts', await hearts());
  await page.click('#rulesAgain');
  await clickText('#rules .opt', 'Always start with microservices');
  for (const t of ['stateless', 'redundancy', 'Cache data', 'multiple data', 'static assets', 'sharding', 'Split tiers']) await clickText('#rules .opt', t);
  console.log('lock btn:', await page.textContent('#lockRules'), 'timer', await page.textContent('#timer'));
  await page.click('#lockRules');
  await page.waitForSelector('#rulechips .opt', { timeout: 8000 });
  console.log('rules ex:', (await page.textContent('#rulesEx')).slice(0, 160));
  const TG = { 'stateless': 'sess', 'redundancy': 'lb', 'Cache data': 'cache', 'multiple data': 'dns', 'static assets': 'cdn', 'sharding': 'db', 'Split tiers': 'mq', 'Monitor': 'ops' };
  let first = true;
  for (const [t, k] of Object.entries(TG)) {
    await clickText('#rulechips .opt', t);
    if (first) { await page.click('#wb5 [data-k="cache"]'); console.log('misplace:', (await page.textContent('#placeEx')).slice(0, 120)); first = false; }
    await page.click(`#wb5 [data-k="${k}"]`);
  }
  await page.waitForTimeout(1500);
  console.log('after s5: cleared', await cleared(), 'hearts', await hearts(), 'xp', await xp(), 'status', await page.textContent('#placeStatus'));
  await page.locator('#wb5').screenshot({ path: SP + '/0106-wb5.png' });

  /* stage 6 */
  await page.fill('#drill textarea', 'I grow it in response to pain. Split the database first, then add a load balancer and stateless web servers with a shared session store, replicas with failover, a cache and CDN, GeoDNS across data centers, a queue for filters, metrics and automation, and finally shard by user id while watching hot keys.');
  await page.click('#drill .q-reveal');
  const boxes = await page.$$('#drill .selfgrade input');
  for (const b of boxes.slice(0, 5)) await b.check();
  await page.click('#drill .q-finish');
  await page.waitForTimeout(2500);
  console.log('after s6: cleared', await cleared(), 'xp', await xp());
  console.log('scorecard:', (await page.textContent('#scorecard')).replace(/\s+/g, ' ').slice(0, 600));
  const vic = await page.$eval('#victory', e => e.classList.contains('show') ? e.textContent.replace(/\s+/g, ' ').slice(0, 200) : 'NOT SHOWN');
  console.log('victory:', vic);
  const best = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}').lessons?.['0106']);
  console.log('saved:', JSON.stringify(best), 'overflow', await overflow());
  await page.screenshot({ path: SP + '/0106-375-dark-full.png', fullPage: true });
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close();
})();
