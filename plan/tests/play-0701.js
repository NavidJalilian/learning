const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0701-unique-id-scope-and-multi-master.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(400);
  const xp = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('sdq:v1') || '{}'); return d.runs && d.runs['0701'] ? d.runs['0701'] : d.lessons && d.lessons['0701']; });
  const cleared = n => page.waitForSelector(`#s${n}.cleared`, { timeout: 20000 });
  async function quizzes(sel, n) {
    for (let k = 1; k <= n; k++) {
      const q = `${sel} .quiz:nth-of-type(${k}) .opt[data-i="0"]`;
      await page.waitForSelector(q, { timeout: 10000 });
      await page.click(q);
    }
  }

  // Stage 1
  await page.click('#insA').catch(() => {}); // disabled before predicting
  await page.click('#p1opts .opt[data-i="0"]');
  await page.click('#insA'); await page.click('#insA'); await page.click('#insB');
  const dupRows = await page.$$eval('#mrows li.dup', l => l.length);
  console.log('s1 dup rows after A,A,B:', dupRows);
  await quizzes('#s1quiz', 3);
  await cleared(1); console.log('stage 1 cleared', await xp());

  // reload mid-quest
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), xp: document.querySelector('.q-xp').textContent }));
  console.log('after reload:', resume);

  // Stage 2
  const qn = await page.$$eval('#qdeck .opt', l => l.length);
  for (let i = 0; i < qn; i++) { await page.click(`#qdeck .opt:nth-child(${i + 1})`); await page.waitForTimeout(550); }
  console.log('signal:', await page.textContent('#signal'));
  const REQ = { 'Each new ID': '0', 'An ID made at 9pm': '1', 'IDs may contain': '0', 'Every ID fits': '1', 'The system can': '1', 'IDs must be impossible': '0' };
  const items = await page.$$('#s2sort .sort-item');
  for (const it of items) {
    const t = await it.$eval('p', p => p.textContent);
    const k = Object.entries(REQ).find(([p]) => t.startsWith(p))[1];
    await (await it.$(`.opt[data-k="${k}"]`)).click();
  }
  await cleared(2); console.log('stage 2 cleared', await xp());

  // Stage 3
  for (let i = 0; i < 4; i++) { await page.click(`#srvs .srv:nth-child(${(i % 2) + 1})`); await page.waitForTimeout(80); }
  await page.waitForSelector('#r3box .opt[data-i="0"]', { timeout: 5000 });
  const disabledDuringRound = await page.$eval('#srvs .srv', b => b.disabled);
  await page.click('#r3box .opt[data-i="0"]');
  await page.waitForSelector('#r3box .row .btn.primary', { timeout: 10000 });
  console.log('r1 timeline:', await page.$$eval('#tl .tc b', l => l.map(x => x.textContent).join(',')), 'servers disabled during round:', disabledDuringRound);
  await page.click('#r3box .row .btn.primary');
  await page.waitForSelector('#r3box .opt[data-i="0"]', { timeout: 5000 });
  await page.click('#r3box .opt[data-i="0"]');
  await page.waitForSelector('#r3box .row .btn.primary', { timeout: 10000 });
  console.log('r2 dups:', await page.$$eval('#tl .tc.dup b', l => l.map(x => x.textContent).join(',')));
  await page.screenshot({ path: SP + '0701-s3.png', fullPage: false });
  await page.click('#r3box .row .btn.primary');
  await page.waitForSelector('#r3replay', { timeout: 10000 });
  console.log('after replan timeline:', await page.$$eval('#tl .tc b', l => l.map(x => x.textContent).join(',')));
  await quizzes('#s3quiz', 3);
  await cleared(3); console.log('stage 3 cleared', await xp());

  // Stage 4: one wrong check first, then correct
  const ANS = ['y', 'y', 'y', 'n', 'y', 'n'];
  for (let i = 0; i < 6; i++) await page.click(`#score .srow[data-i="${i}"] .tog .${i === 3 ? 'y' : ANS[i]}`);
  await page.click('#scoreCheck');
  console.log('s4 wrong check msg:', await page.textContent('#scoreMsg'));
  await page.click(`#score .srow[data-i="3"] .tog .n`);
  await page.click('#scoreCheck');
  await cleared(4); console.log('stage 4 cleared', await xp());

  // Stage 5 boss
  const BOSS = ['single', 'multi', 'other', 'other', 'multi', 'other'];
  for (const a of BOSS) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await cleared(5); console.log('stage 5 cleared', await xp());

  // Stage 6 drill
  await page.fill('#drill textarea', 'Before designing I would confirm unique numeric 64 bit time ordered ten thousand per second then multi-master step by k with offsets, but not time ordered and hard to add servers.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 10000 });
  const fin = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).lessons['0701']);
  console.log('VICTORY', fin);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('overflow', ov);
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelector('#s1').scrollIntoView());
  await page.screenshot({ path: SP + '0701-s1.png' });
  await page.evaluate(() => document.querySelector('#s2').scrollIntoView());
  await page.screenshot({ path: SP + '0701-s2.png' });
  await page.evaluate(() => document.querySelector('#s4').scrollIntoView());
  await page.screenshot({ path: SP + '0701-s4.png' });
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close();
})();
