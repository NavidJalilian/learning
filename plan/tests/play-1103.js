const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1103-news-feed-publishing-pipeline.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(URL);
  await page.waitForTimeout(400);
  const hud = async () => page.evaluate(() => ({ xp: document.querySelector('.q-xp').textContent, hearts: document.querySelectorAll('.heart:not(.lost)').length, cleared: [...document.querySelectorAll('.stage.cleared')].map(s => s.dataset.stage) }));
  const opt = async (scope, text) => { const l = page.locator(`${scope} .opt:not([disabled])`, { hasText: text }).first(); await l.waitFor({ timeout: 10000 }); await l.click(); };
  const shot = async (sel, name) => { await page.locator(sel).scrollIntoViewIfNeeded(); await page.waitForTimeout(300); await page.screenshot({ path: SP + name }); };
  const goal = async (list, g, timeout = 20000) => page.waitForSelector(`${list} [data-g="${g}"].done`, { timeout });

  /* ---- stage 1 ---- */
  await page.click('#gateStart');
  let mistake = false;
  for (let k = 0; k < 12; k++) {
    await page.waitForSelector('#admitBtn:not([disabled])');
    const c = await page.evaluate(() => { const r = [...document.querySelectorAll('#belt .req.in')].pop(); return { tok: r.dataset.tok, n: +r.dataset.n, u: r.dataset.u }; });
    let admit = c.tok === 'valid' && c.n <= 5;
    if (!mistake && c.u === 'Cy') { admit = true; mistake = true; } // one deliberate miss
    await page.click(admit ? '#admitBtn' : '#rejectBtn');
    if (k === 4) await shot('#s1 .sim', '1103-s1.png');
  }
  await page.waitForSelector('#g1res .saved');
  console.log('s1 result:', (await page.textContent('#g1res')).slice(0, 120));
  await opt('#s1quiz', 'Authentication and rate limiting');
  await opt('#s1quiz', 'A blocked post never triggers');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());

  /* ---- reload: resume ---- */
  await page.reload(); await page.waitForTimeout(500);
  console.log('resume:', JSON.stringify(await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared') }))), await hud());

  /* ---- stage 2 ---- */
  await page.click('#steps2 .opt[data-k="3"]');
  await page.waitForTimeout(500);
  for (let k = 1; k <= 5; k++) {
    await page.click(`#steps2 .opt[data-k="${k}"]`);
    await page.waitForSelector(`#steps2 .opt[data-k="${k}"].right`);
    await page.waitForTimeout(2300);
  }
  await shot('#flow2', '1103-s2.png');
  console.log('s2 log tail:', await page.evaluate(() => [...document.querySelectorAll('#f2log div')].slice(-2).map(d => d.textContent).join(' | ')));
  await opt('#s2quiz', 'Step 1 stalls');
  await opt('#s2quiz', 'falls back to the user DB');
  await opt('#s2quiz', 'stays on the queue');
  await opt('#s2quiz', 'From the graph database');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());

  /* ---- stage 3 ---- */
  for (const k of ['bo', 'eli', 'fay', 'gus']) await page.click(`#friends .fr[data-k="${k}"]`);
  await page.click('#fanBtn');
  await page.waitForSelector('#twistBtn');
  await page.click('#twistBtn');
  await shot('#s3 .sim', '1103-s3.png');
  await opt('#s3quiz', 'Yes, it was written yesterday');
  await opt('#s3quiz', 'Re-check permissions');
  await opt('#s3quiz', 'Still friends; his posts are filtered out');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* ---- stage 4 ---- */
  await opt('#s4pred', 'As soon as the post is saved');
  await page.click('#modeSeg button[data-m="inline"]');
  await page.click('#postBtn');
  await page.waitForTimeout(800);
  await shot('#qsim', '1103-s4-inline.png');
  await goal('#s4goals', 'inline');
  await page.waitForSelector('#rushBtn:not([disabled])');
  await page.click('#rushBtn');
  await goal('#s4goals', 'rushIn');
  console.log('phone after inline rush:', await page.textContent('#pst'));
  await page.waitForSelector('#modeSeg button[data-m="queue"]:not([disabled])');
  await page.click('#modeSeg button[data-m="queue"]');
  await page.click('#postBtn');
  await goal('#s4goals', 'queue');
  await page.waitForSelector('#killBtn:not([disabled])', { timeout: 10000 });
  await page.click('#killBtn');
  await goal('#s4goals', 'kill');
  await page.waitForSelector('#rushBtn:not([disabled])', { timeout: 15000 });
  // too few workers first: should miss the 10 s target
  await page.click('#rushBtn');
  await page.waitForTimeout(1200);
  await shot('#qsim', '1103-s4-rush.png');
  await page.evaluate(() => { const s = document.querySelector('#wSlider'); s.value = 10; s.dispatchEvent(new Event('input')); });
  await page.waitForSelector('#rushBtn:not([disabled])', { timeout: 30000 });
  const rq = await page.evaluate(() => document.querySelector('[data-g="rushQ"]').classList.contains('done'));
  console.log('rushQ after slider bump mid-drain:', rq, '| log:', await page.evaluate(() => [...document.querySelectorAll('#q4log div')].slice(-1)[0].textContent));
  if (!rq) { await page.click('#rushBtn'); await goal('#s4goals', 'rushQ'); }
  await opt('#s4quiz', 'Spikes wait in the queue');
  await opt('#s4quiz', 'Friends see the post after a short delay');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());

  /* ---- stage 5 ---- */
  await page.click('#pushBtn');
  await goal('#s5goals', 'trim');
  await page.fill('#c1', '80'); await page.click('#c1b');
  await page.fill('#c2', '50'); await page.click('#c2b');
  console.log('c2 wrong msg:', (await page.textContent('#c2m')).slice(0, 60));
  await page.fill('#c2', '5'); await page.click('#c2b');
  await page.evaluate(() => { const s = document.querySelector('#capSlider'); s.value = 7; s.dispatchEvent(new Event('input')); });
  console.log('cap readouts:', await page.textContent('#capVal'), await page.textContent('#memVal'), await page.textContent('#missVal'), '|', await page.textContent('#capMsg'));
  await page.click('#capLock');
  await page.click('#pastBtn');
  await goal('#s5goals', 'past');
  await shot('#s5 .chart', '1103-s5.png');
  await opt('#s5quiz', 'Copying full posts');
  await opt('#s5quiz', 'Few people scroll that far');
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* ---- stage 6 ---- */
  for (const a of ['web', 'graph', 'mq', 'cache', 'web', 'mq', 'cache']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    await page.click('#boss .q-arena .btn.primary');
  }
  await page.waitForSelector('#s6.cleared', { timeout: 5000 });
  console.log('after s6', await hud());

  /* ---- stage 7 ---- */
  await page.fill('#drill textarea', 'Web servers check the auth token and rate limit, then the fanout service reads friends from the graph DB, filters by settings, queues the job and workers write IDs into the capped feed cache.');
  await page.click('#drill .q-reveal');
  for (const b of await page.$$('#drill .selfgrade input')) await b.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('victory:', await page.textContent('#victory h2'), await hud());
  await page.waitForTimeout(800);
  await shot('#victory', '1103-victory.png');

  // full-page dark screenshot
  await page.screenshot({ path: SP + '1103-375-dark.png', fullPage: true });
  console.log('overflowX:', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  console.log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
})();
