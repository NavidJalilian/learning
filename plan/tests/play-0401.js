const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0401-rate-limiter-why-and-where.html';
const SHOT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(400);
  const log = (...a) => console.log(...a);
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const xp = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs?.['0401']?.xp ?? null);
  const cleared = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs?.['0401']?.cleared ?? null);
  async function answer(stage, text) {
    const b = page.locator(`#s${stage} .quiz .opt:not([disabled])`, { hasText: text }).first();
    await b.waitFor({ timeout: 8000 });
    await b.click();
  }
  async function waitCleared(n) {
    await page.waitForFunction(n => document.querySelector('#s' + n).classList.contains('cleared'), n, { timeout: 15000 });
    log(`stage ${n} cleared · xp=${await xp()} hearts=${await hearts()}`);
  }

  // ---- Stage 1: sort incidents
  const MAP = [['sign-up', 'starve'], ['database connection', 'starve'], ['retries', 'over'], ['scraper', 'over'], ['credit-check', 'cost'], ['add servers', 'cost'], ['botnet', 'none']];
  for (let i = 0; i < 7; i++) {
    const t = await page.locator('#incCard p').innerText();
    let k = MAP.find(([s]) => t.includes(s))[1];
    if (i === 0) { // deliberately near-miss on first if possible to test 'near'
      if (k === 'starve') k = 'over'; else if (k === 'over') k = 'starve';
    }
    await page.locator(`#bins .bin[data-k="${k}"]`).click();
    if (i === 0) log('first card near/right:', await page.locator('#incEx').getAttribute('class'), 'hearts', await hearts());
    await page.locator('#incRow .btn.primary').click();
  }
  log('bin counts:', await page.locator('#bins .ct').allInnerTexts());
  await page.locator('#s1').screenshot({ path: SHOT + '0401-s1.png' });
  await answer(1, 'within 100 ms');
  await waitCleared(1);

  // ---- Stage 2: interview
  await page.locator('#deck .qbtn', { hasText: 'Kubernetes' }).click();
  await page.waitForTimeout(400);
  log('after time-waster hearts', await hearts());
  for (const q of ['Client-side or server-side', 'Throttle by IP', 'What scale', 'many servers', 'Separate service', 'throttled users be told'])
    { await page.locator('#deck .qbtn', { hasText: q }).click(); await page.waitForTimeout(350); }
  log('board:', await page.locator('#boardCnt').innerText());
  await page.waitForSelector('#match.on');
  // one wrong placement first
  const pairs = { acc: 'Accurate limiting', lat: 'Low latency', mem: 'Little memory', dist: 'Distributed', exc: 'Exception handling', ft: 'High fault tolerance' };
  await page.locator('#pool .rq[data-k="lat"]').click();
  await page.locator('#slots .slot[data-k="mem"]').click();
  log('after wrong match hearts', await hearts());
  for (const k of Object.keys(pairs)) {
    await page.locator(`#pool .rq[data-k="${k}"]`).click();
    await page.locator(`#slots .slot[data-k="${k}"]`).click();
  }
  await page.locator('#s2').screenshot({ path: SHOT + '0401-s2.png' });
  await answer(2, 'High fault tolerance');
  await waitCleared(2);

  // ---- Reload mid-quest
  await page.reload(); await page.waitForTimeout(600);
  log('RESUME banner:', await page.locator('.banner.resume').count(), 'cleared:', JSON.stringify(await cleared()), 'xp', await xp(), 'hearts', await hearts(),
    's1.cleared', await page.locator('#s1.cleared').count(), 's2.cleared', await page.locator('#s2.cleared').count());

  // ---- Stage 3: placement
  await page.locator('#pbox .opt', { hasText: /^2$/ }).click();
  await page.waitForSelector('#pbox .explain.show', { timeout: 10000 });
  log('r1 counters', await page.locator('.counters').innerText());
  await page.locator('#pbox .btn.primary', { hasText: 'Round 2' }).click();
  await page.locator('#pbox .opt', { hasText: /^30$/ }).click();
  await page.waitForSelector('#pbox .explain.show', { timeout: 15000 });
  log('r2 counters', (await page.locator('.counters').innerText()).replace(/\n/g, ' '));
  await page.locator('#pbox .btn.primary', { hasText: 'Your move' }).click();
  // tap SVG slot C via keyboard on the slot group, then send
  await page.locator('#psvg g.slotg.live[aria-label*="API servers"]').focus();
  await page.keyboard.press('Enter');
  await page.locator('#slotSeg button[data-s="B"]').click(); // back to middleware via button
  await page.locator('#sendBtn').click();
  await page.waitForSelector('#osi.on', { timeout: 15000 });
  log('challenge counters', (await page.locator('.counters').innerText()).replace(/\n/g, ' '));
  await page.locator('#ladder .lay[data-n="4"]').click(); // wrong
  log('after wrong layer hearts', await hearts());
  await page.locator('#ladder .lay[data-n="7"]').click();
  await page.locator('#ladder .lay[data-n="3"]').click();
  await page.locator('#s3').screenshot({ path: SHOT + '0401-s3.png' });
  await answer(3, 'forge or patch');
  await waitCleared(3);

  // ---- Stage 4: profiles
  const PROF = [['Three-person', 'gw', 'g3'], ['Payments', 'build', 'g2'], ['40-engineer', 'build', 'g4'], ['tight deadline', 'gw', 'g4']];
  for (let i = 0; i < 4; i++) {
    const t = await page.locator('#profBox .prof h3').innerText();
    const [, c, g] = PROF.find(([s]) => t.includes(s));
    await page.locator(`#profBox [data-c="${c}"]`).click();
    await page.locator(`#profBox [data-g="${g}"]`).click();
    await page.locator('#profBox .q-lock').click();
    log('profile', t, '→', await page.locator('#profBox .explain').getAttribute('class'), 'xp', await xp());
    await page.locator('#profBox .q-next .btn').click();
  }
  await answer(4, 'choice of algorithm');
  await waitCleared(4);

  // ---- Stage 5: boss
  for (const a of ['server', '429', 'key', 'gw', 'open']) {
    await page.locator(`#boss .choice .opt[data-c="${a}"]`).click();
    await page.locator('#boss .row .btn.primary').click();
  }
  await waitCleared(5);

  // ---- Stage 6: drill
  await page.locator('#drill textarea').fill('A rate limiter caps requests per client per time window and returns 429. It prevents DoS starvation, cuts cost and stops overload. Put it in middleware or the API gateway, not the client, because clients can be forged.');
  await page.locator('#drill .q-reveal').click();
  for (const c of await page.locator('#drill .selfgrade input').all()) await c.check();
  await page.locator('#drill .q-finish').click();
  await waitCleared(6);

  await page.waitForSelector('#victory.show', { timeout: 5000 });
  log('VICTORY:', await page.locator('#victory h2').innerText(), '|', (await page.locator('#victory .vstats').innerText()).replace(/\n/g, ' '));
  log('saved lesson', JSON.stringify(await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).lessons['0401'])));
  log('overflowX', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await page.screenshot({ path: SHOT + '0401-375-dark.png' });
  await page.locator('#s4').screenshot({ path: SHOT + '0401-s4.png' });
  log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('FAILED', e); process.exit(2); });
