// Playthrough for quest 0405. Usage: NODE_PATH=... node play-0405.js [reduce|no-preference]
const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0405-distributed-rate-limiting.html';
const DIR = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const motion = process.argv[2] || 'reduce';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: motion });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE);
  await page.waitForTimeout(300);
  const ok = (c, msg) => { if (!c) { console.log('FAIL:', msg); process.exitCode = 1; } else console.log('ok  ', msg); };
  const txt = s => page.locator(s).innerText();
  const cleared = n => page.locator(`#s${n}.cleared`).waitFor({ timeout: 20000 });
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const xp = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('sdq:v1') || '{}'); return d.runs && d.runs['0405'] ? d.runs['0405'].xp : (d.lessons && d.lessons['0405'] ? d.lessons['0405'].xp : 0); });

  /* ---- stage 1 ---- */
  ok(await page.locator('#laneA [data-s="0"]').isDisabled(), 's1: steps locked before predicting');
  await page.click('#racePredict [data-m="plain"] .opt[data-i="1"]');
  // safe order first: A fully, then B
  for (const [l, s] of [['A', 0], ['A', 1], ['A', 2], ['B', 0], ['B', 1]]) await page.click(`#lane${l} [data-s="${s}"]`);
  ok((await txt('#rCount')) === '4' && (await txt('#rRej')) === '1', 's1: serial order is safe (counter 4, one 429)');
  ok(await page.locator('#s1goals [data-g="bug"].done').count() === 0, 's1: safe order does not count as the bug');
  await page.click('#raceReset');
  for (const [l, s] of [['A', 0], ['B', 0], ['A', 1], ['B', 1], ['A', 2], ['B', 2]]) await page.click(`#lane${l} [data-s="${s}"]`);
  await page.locator('#s1goals [data-g="bug"].done').waitFor();
  ok((await txt('#rCount')) === '4' && (await txt('#rIn')) === '2', 's1: interleaved → both in, counter 4');
  await page.click('#raceMode [data-m="lua"]');
  ok(await page.locator('#racePredict [data-m="plain"]').isHidden(), 's1: plain prediction hidden in lua mode');
  await page.click('#racePredict [data-m="lua"] .opt[data-i="0"]');
  await page.click('#laneB [data-run="B"]');
  await page.locator('#laneA [data-run="A"]:not([disabled])').waitFor();
  await page.click('#laneA [data-run="A"]');
  await page.locator('#s1goals [data-g="lua"].done').waitFor({ timeout: 10000 });
  ok((await txt('#rCount')) === '4' && (await txt('#rIn')) === '1' && (await txt('#rRej')) === '1', 's1: lua → one in, one out, counter 4');
  await page.click('#raceMode [data-m="lock"]');
  const h0 = await hearts();
  await page.click('#racePredict [data-m="lock"] .opt[data-i="1"]'); // wrong on purpose
  await page.click('#fireBoth');
  await page.locator('#s1goals [data-g="lock"].done').waitFor({ timeout: 15000 });
  ok(await hearts() === h0 - 1, 's1: wrong lock prediction cost a heart');
  ok((await txt('#laneB .trips')).includes('waited'), 's1: lane B shows waiting');
  await page.locator('#s1quiz .quiz').waitFor();
  await page.click('#s1quiz .opt[data-i="0"]');
  await cleared(1); ok(true, 's1 cleared, xp=' + await xp());

  /* ---- reload mid-quest ---- */
  await page.reload(); await page.waitForTimeout(400);
  ok(await page.locator('#s1.cleared').count() === 1, 'resume: stage 1 still cleared after reload');
  ok(await page.locator('.banner.resume').count() === 1, 'resume: welcome-back banner shown');
  ok(await hearts() === 2, 'resume: hearts kept (2)');

  /* ---- stage 2 ---- */
  ok(await page.locator('#topoSend').isDisabled(), 's2: send locked before predicting');
  await page.click('#topoPredict [data-m="local"] .opt[data-i="1"]');
  await page.click('#topoSend');
  await page.locator('#s2goals [data-g="local"].done').waitFor({ timeout: 15000 });
  ok((await txt('#topoIn')) === '10', 's2: local → 10 in');
  await page.click('#topoMode [data-m="sticky"]');
  await page.click('#topoPredict [data-m="sticky"] .opt[data-i="0"]');
  await page.click('#topoSend');
  await page.locator('#topoKill:not([disabled])').waitFor({ timeout: 15000 });
  ok((await txt('#topoIn')) === '5', 's2: sticky phase 1 → 5 in');
  await page.click('#topoKill');
  await page.click('#topoSend');
  await page.locator('#s2goals [data-g="sticky"].done').waitFor({ timeout: 15000 });
  ok((await txt('#topoIn')) === '10', 's2: sticky after failover → 10 in');
  await page.click('#topoMode [data-m="central"]');
  await page.click('#topoPredict [data-m="central"] .opt[data-i="0"]');
  await page.click('#topoSend');
  await page.locator('#s2goals [data-g="central"].done').waitFor({ timeout: 15000 });
  ok((await txt('#topoIn')) === '5', 's2: central → 5 in');
  await page.locator('#s2quiz .quiz').waitFor();
  await page.click('#s2quiz .opt[data-i="0"]');
  await cleared(2); ok(true, 's2 cleared, xp=' + await xp());

  /* ---- stage 3 ---- */
  await page.fill('#calc1 input', '200'); await page.click('#calc1 .btn');
  await page.fill('#calc2 input', '200'); await page.click('#calc2 .btn');
  await page.waitForFunction(() => document.querySelector('#sydVal').textContent === '200/100', null, { timeout: 15000 });
  ok(true, 's3: overshoot shown 200/100');
  await page.locator('#s3quiz .quiz').waitFor({ timeout: 10000 });
  await page.click('#s3quiz .opt[data-i="0"]');
  await cleared(3); ok(true, 's3 cleared, xp=' + await xp());

  /* ---- stage 4 ---- */
  for (const k of ['relax', 'fine', 'algo']) {
    await page.click(`#incBox .diag .opt[data-k="${k}"]`);
    await page.click('#incBox .row .btn.primary');
  }
  ok(await page.locator('#incAgain').count() === 1, 's4: dashboards done');
  ok(await page.locator('#applyFail').isDisabled(), 's4: apply disabled until both chosen');
  await page.click('#redisInc [data-ep="search"] [data-v="open"]');
  await page.click('#redisInc [data-ep="login"] [data-v="closed"]');
  await page.click('#applyFail');
  await page.locator('#s4quiz .quiz').waitFor({ timeout: 10000 });
  await page.click('#s4quiz .opt[data-i="0"]');
  await cleared(4); ok(true, 's4 cleared, xp=' + await xp());

  /* ---- stage 5 ---- */
  for (const a of ['atomic', 'central', 'sf', 'edge', 'open', 'relax']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    await page.click('#boss .q-arena .row .btn.primary');
  }
  await cleared(5); ok(true, 's5 boss cleared, xp=' + await xp());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', 'Race on read check write: use a Lua script so it is atomic. Central Redis not sticky sessions. Edge counters with eventual consistency. Monitor rules. Fail open when Redis dies.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.locator('#drill .selfgrade input').all()) await cb.check();
  await page.click('#drill .q-finish');
  await page.locator('#victory.show').waitFor({ timeout: 10000 });
  ok(true, 'victory card shown');
  const d = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).lessons['0405']);
  console.log('     saved result:', JSON.stringify(d));
  ok(d.xp === 440, 'total XP 440 (450 max minus one wrong prediction)');
  ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, 'no horizontal overflow at 375');
  await page.screenshot({ path: DIR + '0405-375-dark-full.png', fullPage: true });
  for (const n of [1, 2, 3, 4]) { await page.locator('#s' + n).scrollIntoViewIfNeeded(); await page.locator('#s' + n).screenshot({ path: DIR + `0405-s${n}-375-dark.png` }); }
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await browser.close();
})();
