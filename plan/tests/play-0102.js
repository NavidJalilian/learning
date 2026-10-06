const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/0102-scale-database-replication.html';
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
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };
  const overflow = async (tag) => { const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 1) errs.push(`overflow ${o}px at ${tag}`); };

  /* ---- stage 1 ---- */
  let mistakes = 0;
  for (let i = 0; i < 12; i++) {
    const kind = await page.evaluate(() => document.querySelector('#deck .qcard').classList.contains('read') ? 'read' : 'write');
    if (!mistakes && kind === 'write') { await page.click('#dbrow .dbn[data-t="r1"]'); mistakes++; console.log('bounce coach:', await page.textContent('#coach')); }
    if (mistakes === 1 && kind === 'read') { await page.click('#dbrow .dbn[data-t="m"]'); mistakes++; await page.waitForTimeout(400); console.log('read-on-master coach:', await page.textContent('#coach')); continue; }
    await page.click(`#dbrow .dbn[data-t="${kind === 'write' ? 'm' : (i % 2 ? 'r1' : 'r2')}"]`);
    await page.waitForTimeout(350);
  }
  console.log('round over:', await page.textContent('#deck'), '| mistakes', mistakes, await hud());
  await page.screenshot({ path: SP + '0102-s1.png' });
  await page.locator('#ratioIn').fill('7');
  await page.waitForTimeout(200);
  console.log('ratio:', await page.textContent('#ratioVal'), 'reps', await page.textContent('#rsReps'));
  await page.waitForSelector('#s1quiz .opt', { timeout: 5000 });
  await clickOpt('#s1quiz', 'Only the master');
  await page.waitForSelector('#s1quiz .quiz:nth-child(2) .opt', { timeout: 5000 });
  await clickOpt('#s1quiz .quiz:nth-child(2)', 'Apps read far more');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());
  // round 2 heart check: misroute a write in round 2
  await page.click('#rAgain');
  console.log('round label:', await page.textContent('#rRound'));

  /* ---- stage 2 ---- */
  const ans = t => /earthquake|flood/.test(t) ? 'rel' : /Five replicas|queuing/.test(t) ? 'perf' : 'ha';
  const incs = await page.$$eval('#incs .inc', bs => bs.map(b => ({ i: b.dataset.i, t: b.textContent })));
  let wrongDone = false;
  for (const inc of incs) {
    await page.click(`#incs .inc[data-i="${inc.i}"]`);
    if (!wrongDone) { wrongDone = true; await page.click(`#tiles .tile[data-b="${ans(inc.t) === 'rel' ? 'ha' : 'rel'}"]`); console.log('wrong match feed:', await page.textContent('#mfeed')); }
    await page.click(`#tiles .tile[data-b="${ans(inc.t)}"]`);
  }
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());
  await page.locator('#s2').screenshot({ path: SP + '0102-s2.png' });

  /* ---- reload mid-quest ---- */
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), text: (document.querySelector('.banner') || {}).textContent }));
  console.log('resume:', JSON.stringify(resume), await hud());

  /* ---- stage 3 ---- */
  const waitRow = async () => page.waitForSelector('#p3box .btn:has-text("Run it again")', { timeout: 20000 });
  await page.click('#scns .scn[data-s="A"]');
  await clickOpt('#p3box', 'To the master, for the time being');
  await waitRow();
  console.log('A log:', await page.evaluate(() => [...document.querySelectorAll('#t3log div')].map(d => d.textContent).join(' | ')));
  await page.click('#scns .scn[data-s="B"]');
  await clickOpt('#p3box', 'They are lost');  // wrong on purpose
  await waitRow();
  await page.click('#scns .scn[data-s="C"]');
  await page.waitForSelector('#p3box .promo .opt', { timeout: 8000 });
  await page.locator('#s3 .topo').screenshot({ path: SP + '0102-s3-pick.png' });
  await page.click('#p3box .promo .opt[data-id="R1"]');
  await page.waitForSelector('#recRow .btn', { timeout: 8000 });
  console.log('lost writes:', await page.$$eval('#wl span.lost', s => s.map(x => x.textContent)));
  await page.locator('#s3 .topo').screenshot({ path: SP + '0102-s3-lost.png' });
  await page.click('#recRow .btn');
  await waitRow();
  console.log('fixed writes:', await page.$$eval('#wl span.fixed', s => s.length), '| note shown:', await page.isVisible('#c3note'));
  await page.locator('#s3 .topo').screenshot({ path: SP + '0102-s3-after.png' });
  // quiz should be up now (A,B,C done); do bonus D first anyway
  await page.click('#scns .scn[data-s="D"]');
  await clickOpt('#p3box', 'No, it is missing');
  await page.waitForSelector('#rywSw', { timeout: 10000 });
  console.log('phone (missing):', await page.textContent('#p3 .phone'));
  await page.click('#rywSw');
  await page.click('#rywGo');
  await waitRow();
  console.log('phone (fixed):', await page.textContent('#p3 .phone'));
  await page.locator('#s3 .topo').screenshot({ path: SP + '0102-s3-ryw.png' });
  await page.waitForSelector('#s3quiz .opt', { timeout: 5000 });
  await clickOpt('#s3quiz', 'To the master, for the time being');
  await page.waitForSelector('#s3quiz .quiz:nth-child(2) .opt');
  await clickOpt('#s3quiz .quiz:nth-child(2)', 'A replica is promoted');
  await page.waitForSelector('#s3quiz .quiz:nth-child(3) .opt');
  await clickOpt('#s3quiz .quiz:nth-child(3)', 'missing the most recent');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* ---- stage 4 ---- */
  await page.click('#steps .stepc[data-n="3"]'); // wrong first
  console.log('step hint:', await page.textContent('#stepHint'));
  for (const n of [1, 2, 3, 5, 4]) { await page.click(`#steps .stepc[data-n="${n}"]`); await page.waitForTimeout(150); }
  console.log('placed:', await page.$$eval('#placed li', l => l.length), 'hint:', await page.textContent('#stepHint'));
  await page.locator('#flow').screenshot({ path: SP + '0102-flow.png' });
  await page.click('#bugs .tap[aria-label*="INSERT order"]'); // false alarm
  console.log('false alarm:', await page.textContent('#bugfeed'));
  for (const t of ['10.0.0.2', 'UPDATE profile', 'Read feed']) { await page.click(`#bugs .tap[aria-label*="${t}"]`); await page.waitForTimeout(200); }
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  await page.locator('#bugs').screenshot({ path: SP + '0102-bugs.png' });
  console.log('after s4', await hud());

  /* ---- stage 5 ---- */
  for (const k of ['replica', 'master', 'promote', 'add', 'master', 'master', 'replica']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', 'One master takes writes and replicas take reads; more replicas since reads dominate. Benefits performance reliability availability. Replica dies reads move; master dies promote a replica; lag may lose writes and break read your writes.');
  await page.click('#drill .q-reveal');
  const cbs = await page.$$('#drill .selfgrade input');
  for (const cb of cbs.slice(0, 3)) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#drillAgain', { timeout: 3000 });
  console.log('drill retry shown, s6 cleared?', await page.evaluate(() => document.querySelector('#s6').classList.contains('cleared')));
  await page.click('#drillAgain');
  await page.fill('#drill textarea', 'One master takes writes and replicas take reads; more replicas since reads dominate. Benefits performance reliability availability. Replica dies reads move; master dies promote a replica; lag may lose writes and break read your writes.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY', await page.textContent('#victory h2'), await hud());
  await overflow('end');
  await page.screenshot({ path: SP + '0102-victory.png' });

  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  p2.on('pageerror', e => errs.push('p2 pageerror: ' + e.message));
  await p2.goto(URL); await p2.waitForTimeout(600);
  await p2.screenshot({ path: SP + '0102-375-dark.png', fullPage: true });
  const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p3.goto(URL); await p3.waitForTimeout(600);
  await p3.screenshot({ path: SP + '0102-1280-light.png', fullPage: true });

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
