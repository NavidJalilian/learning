const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0202-latency-numbers.html';
const SHOT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const ORDER = ['l1', 'br', 'l2', 'mx', 'mem', 'zip', 'net2k', 'mem1m', 'dc', 'seek', 'net1m', 'disk1m', 'cn'];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE);
  await page.waitForTimeout(300);
  const opt = async (scope, text) => { const b = page.locator(`${scope} .opt`, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout: 20000 }); await b.click(); };
  const cleared = async n => { await page.waitForFunction(n => document.querySelector('#s' + n).classList.contains('cleared'), n, { timeout: 20000 }); console.log('stage', n, 'cleared'); };
  const xp = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}'));

  // Stage 1: sort with one deliberate swap first, check, then practice again perfectly
  for (const k of ORDER) await page.click(`#pool .opcard[data-k="${k}"]`);
  // send one back and re-place to test undo
  await page.click('#ladder .rung[data-k="cn"]'); await page.click('#pool .opcard[data-k="cn"]');
  await page.click('#ordCheck');
  const score = await page.textContent('#ordScore'); console.log('s1 score:', score);
  const misses = await page.$$eval('#chart1 .lc-row.miss', r => r.length); console.log('misses', misses);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: SHOT + 's1-375-dark.png', fullPage: false, clip: undefined });
  await opt('#s1quiz', 'The disk seek: 10 ms');
  await cleared(1);
  // practice re-try path
  await page.click('#ordAgain');
  const poolN = await page.$$eval('#pool .opcard', x => x.length); console.log('retry pool size', poolN);

  // Stage 2
  await page.locator('#s2').scrollIntoViewIfNeeded();
  await opt('#z2predict', 'About 8 months');
  await page.waitForSelector('#z2predict .explain.show', { timeout: 20000 });
  console.log('timeline items', await page.$$eval('#tl li', x => x.length));
  await page.click('#htSeg button[data-m="human"]');
  console.log('human row cn:', await page.textContent('#htable tr:last-child td.v'));
  await opt('#s2quiz', 'About 100,000 reads');
  await cleared(2);

  // Reload mid-quest → resume
  await page.waitForTimeout(800);
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), done: document.querySelectorAll('.hud .dot.done').length, c1: document.querySelector('#s1').classList.contains('cleared') }));
  console.log('resume', JSON.stringify(resume));
  if (!resume.banner || resume.done !== 2) errs.push('resume failed');

  // Stage 3: duels
  const duelAns = ['Memory, by 100×', 'Sequential, about 25×', 'C: 5 calls inside', 'About 1 ms'];
  for (let i = 0; i < 4; i++) {
    await opt('#duelBox', duelAns[i]);
    await page.waitForSelector('#duelBox .explain.show', { timeout: 20000 });
    const w = await page.textContent('#race .lane.win .lane-t'); console.log('duel', i + 1, 'winner:', w);
    await page.locator('#duelBox .btn.primary').click();
  }
  console.log('cards up', await page.$$eval('#cards3 .card:not(.down)', x => x.length));
  await opt('#s3quiz', 'Batch the calls');
  await cleared(3);

  // Stage 4
  await opt('#eraPredict', 'The disk bars');
  await page.waitForSelector('#eraPredict .explain.show', { timeout: 20000 });
  console.log('seek now:', await page.textContent('#chart4 .lc-row[data-k="seek"] .lc-val'), '|', await page.textContent('#chart4 .lc-row[data-k="seek"] .lc-sub'));
  await page.locator('#lightBtn').scrollIntoViewIfNeeded();
  await page.click('#lightBtn');
  await page.waitForSelector('#lightNote', { state: 'visible', timeout: 20000 });
  await page.screenshot({ path: SHOT + 's4-375-dark.png' });
  await opt('#s4quiz', 'The cross-ocean round trip');
  await cleared(4);

  // Stage 5: boss
  const bossAns = ['disk', 'region', 'fine', 'bytes', 'disk', 'fine'];
  for (const a of bossAns) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    await page.locator('#boss .q-arena .row .btn.primary').click();
  }
  await cleared(5);

  // Stage 6: drill
  await page.fill('#drill textarea', 'Memory reads take about 100 ns while a disk seek is 10 ms, so a cache in RAM in the same data center at 0.5 ms round trip beats disk; keep it in region since cross ocean is 150 ms; SSDs narrowed the gap.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 20000 });
  console.log('victory shown');
  const st = await xp(); console.log('saved', JSON.stringify(st.lessons['0202']), 'run left:', !!st.runs['0202']);
  await page.waitForTimeout(1500);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); console.log('overflowX', ov);
  await page.locator('#s3').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SHOT + 's3-375-dark.png' });
  await page.locator('#s2').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SHOT + 's2-375-dark.png' });
  await page.screenshot({ path: SHOT + 'full-375-dark.png', fullPage: true });
  // desktop light shot
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const p2 = await ctx2.newPage(); await p2.goto(FILE); await p2.waitForTimeout(300);
  for (const k of ORDER.slice().reverse()) await p2.click(`#pool .opcard[data-k="${k}"]`);
  await p2.click('#ordCheck'); await p2.waitForTimeout(2000);
  await p2.locator('#chart1').scrollIntoViewIfNeeded();
  await p2.screenshot({ path: SHOT + 's1-1280-light.png' });
  await browser.close();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
