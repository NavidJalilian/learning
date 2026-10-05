const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0203-availability-nines.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.goto(FILE);
  await page.waitForTimeout(300);
  const ok = (c, msg) => { if (!c) { console.log('FAIL:', msg); process.exitCode = 1; } else console.log('ok  ', msg); };
  const cleared = n => page.$eval('#s' + n, e => e.classList.contains('cleared'));
  const xp = () => page.$eval('.q-xp', e => e.textContent);
  const clickText = async (scope, text) => { await page.locator(scope).getByRole('button', { name: text, exact: true }).click(); };

  // ---------- Stage 1 ----------
  await page.locator('#dial .notch').first().click(); // before predicting → toast only
  ok((await page.$eval('#ro-year', e => e.textContent)) === '?', 's1: dial inert before prediction');
  await clickText('#p1', 'About 8.77 hours');
  await page.waitForTimeout(1200);
  ok((await page.$eval('#ro-year', e => e.textContent)) === '8.77 h', 's1: predict sets dial to 3 nines → 8.77 h');
  for (const n of [2, 4, 5, 6]) { await page.locator(`#dial .notch[aria-label^="${n} nines"]`).click(); await page.waitForTimeout(700); }
  ok((await page.$eval('#ro-month', e => e.textContent)) === '2.63 s', 's1: 6 nines month = 2.63 s');
  ok(await page.$eval('#mag', e => e.classList.contains('show')), 's1: magnifier visible beyond 2 nines');
  await page.locator('#dial .notch[aria-label^="2 nines"]').click(); await page.waitForTimeout(700);
  ok((await page.$$eval('#year i.dn', e => e.length)) === 3, 's1: 99% paints 3 full red days + partial');
  await page.screenshot({ path: SP + 'p0203-s1.png', fullPage: false });
  await page.locator('#dial .notch[aria-label^="3 nines"]').focus();
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(400);
  ok((await page.$eval('#dial .notch.on', e => e.getAttribute('aria-label'))).startsWith('3'), 's1: arrow key turns dial (2 → 3)');
  await page.waitForSelector('#s1quiz .opt');
  await clickText('#s1quiz', 'About 4.4 minutes');
  await page.waitForTimeout(1200);
  ok(await cleared(1), 's1 cleared');

  // ---------- reload mid-quest ----------
  const xpBefore = await xp();
  await page.reload(); await page.waitForTimeout(500);
  ok(await cleared(1), 'resume: stage 1 still cleared after reload');
  ok(!!(await page.$('.banner.resume')), 'resume: welcome-back banner shown');
  ok((await xp()) === xpBefore, `resume: XP kept (${xpBefore})`);

  // ---------- Stage 2 ----------
  const answers = [['43.8', 'min'], ['52.6', 'min'], ['0.365', 'h'], ['1.83', 'days']];
  for (let i = 0; i < 4; i++) {
    const card = `#calcs .calc[data-i="${i}"]`;
    if (i === 0) { await page.locator(card + ' .q-check').click(); ok(!(await page.$eval(card, e => e.classList.contains('miss'))), 's2: empty input does not cost a heart'); }
    await page.fill(card + ' input', answers[i][0]);
    await page.locator(`${card} .units button[data-u="${answers[i][1]}"]`).click();
    await page.locator(card + ' .q-check').click();
    ok(await page.$eval(card, e => e.classList.contains('ok')), `s2: card ${i + 1} accepted ${answers[i].join(' ')}`);
  }
  ok(await page.$eval('#stairs', e => e.classList.contains('show')), 's2: staircase shown at the end');
  await page.waitForSelector('#s2quiz .opt');
  await clickText('#s2quiz', 'about 52.6 minutes, ten times less');
  await page.waitForTimeout(1200);
  ok(await cleared(2), 's2 cleared');

  // ---------- Stage 3 ----------
  for (let i = 0; i < 3; i++) await page.locator('#palette .btn[data-k="1"]').click();
  ok((await page.$eval('#rBig', e => e.textContent)) === '99.70%', 's3: three 99.9% in a row = 99.70% (got ' + await page.$eval('#rBig', e => e.textContent) + ')');
  await page.locator('#cbox').getByRole('button', { name: /Next: challenge 2/ }).click();
  await page.locator('#chain .spare').first().click();
  ok((await page.$eval('#rBig', e => e.textContent)).startsWith('99.99'), 's3: two 99% in parallel ≈ 99.99%');
  ok(await page.$eval('#s3goals [data-g="c2"]', e => e.classList.contains('done')), 's3: challenge 2 done');
  await page.locator('#cbox').getByRole('button', { name: /Next: challenge 3/ }).click();
  await page.locator('#chain .grp[data-g="0"] .spare').click(); // spare API: not enough
  ok(!(await page.$eval('#s3goals [data-g="c3"]', e => e.classList.contains('done'))), 's3: spare API alone does not pass challenge 3');
  await page.locator('#chain .grp[data-g="0"] .blk .x').first().click();
  await page.locator('#chain .grp[data-g="1"] .spare').click();
  ok(await page.$eval('#s3goals [data-g="c3"]', e => e.classList.contains('done')), 's3: spare DB passes challenge 3');
  await page.locator('#strikeBtn').click();
  ok(!(await page.$eval('#s3goals [data-g="rack"]', e => e.classList.contains('done'))), 's3: strike needs "same rack" on');
  await page.locator('#rackBtn').click();
  await page.locator('#strikeBtn').click();
  await page.waitForTimeout(700);
  ok((await page.$eval('#rBig', e => e.textContent)) === 'DOWN', 's3: strike shows DOWN');
  await page.screenshot({ path: SP + 'p0203-s3.png', fullPage: false });
  await page.waitForSelector('#s3quiz .opt');
  await clickText('#s3quiz', 'About 99.6%, the product of all four');
  await page.waitForTimeout(1200);
  ok(await cleared(3), 's3 cleared');

  // ---------- Stage 4 ----------
  const MAP = { 'p99': 'SLI', 'We aim': 'SLO', 'If monthly': 'SLA', 'The fraction': 'SLI', 'Internal target': 'SLO', 'A contract': 'SLA', 'Error rate': 'SLI', 'Alert us': 'SLO' };
  for (let i = 0; i < 8; i++) {
    const st = await page.$eval('#sortcard .stmt', e => e.textContent);
    const key = Object.keys(MAP).find(k => st.replace(/^"/, '').startsWith(k));
    await page.locator(`#sortcard .opts3 .opt[data-b="${MAP[key]}"]`).click();
    ok(await page.$eval(`#sortcard .opts3 .opt[data-b="${MAP[key]}"]`, e => e.classList.contains('right')), `s4: "${st.slice(0, 30)}…" → ${MAP[key]}`);
    await page.locator('#sortcard .row .btn.primary').click();
  }
  ok(await page.$eval('#s4goals [data-g="sort"]', e => e.classList.contains('done')), 's4: sorting goal done');
  let shipped = 0;
  while (!(await page.$eval('#deployBtn', e => e.disabled)) && shipped < 40) { await page.locator('#deployBtn').click(); shipped++; }
  ok(await page.$eval('#freeze', e => e.classList.contains('show')), `s4: budget drained after ${shipped} releases, freeze shown`);
  await page.waitForSelector('#s4quiz .opt');
  await clickText('#s4quiz', 'Customers can claim service credits, a partial refund');
  await page.waitForTimeout(1200);
  ok(await cleared(4), 's4 cleared');

  // ---------- Stage 5 (boss) ----------
  for (const a of ['over', 'cant', 'opt', 'year', 'low']) {
    await page.locator(`#boss .choice .opt[data-c="${a}"]`).click();
    ok(await page.$eval(`#boss .choice .opt[data-c="${a}"]`, e => e.classList.contains('right')), `s5: boss pick ${a}`);
    await page.locator('#boss .q-arena .row .btn.primary').click();
  }
  await page.waitForTimeout(500);
  ok(await cleared(5), 's5 cleared');

  // ---------- Stage 6 (drill) ----------
  await page.fill('#drill textarea', 'I would target three to four nines: 99.9% is about 43 minutes a month, each nine is ten times less downtime, and chained dependencies multiply.');
  await page.locator('#drill .q-reveal').click();
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.locator('#drill .q-finish').click();
  await page.waitForTimeout(1200);
  ok(await cleared(6), 's6 cleared');

  ok(await page.$eval('#victory', e => e.classList.contains('show')), 'victory card shown');
  const hearts = await page.$$eval('.heart:not(.lost)', e => e.length);
  ok(hearts === 3, 'hearts intact: ' + hearts);
  console.log('final XP line:', await xp());
  const store = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')));
  console.log('saved:', JSON.stringify(store.lessons['0203']));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(overflow <= 1, 'no horizontal overflow at 375 after play: ' + overflow);
  await page.locator('#s2').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SP + 'p0203-full.png', fullPage: true });
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await browser.close();
})();
