const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0201-powers-of-two.html';
const SHOT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/0201-375-dark.png';
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
  const cleared = n => page.waitForSelector(`#s${n}.cleared`, { timeout: 15000 });
  const opt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}'));

  // ---- Stage 1: ladder
  // one wrong placement first (practice, no heart)
  await page.click('#trayW .pchip[data-v="million"]');
  await page.click('#ladder .rung[data-k="1"]');
  const R = [[1, 'thousand', 'KB'], [2, 'million', 'MB'], [3, 'billion', 'GB'], [4, 'trillion', 'TB'], [5, 'quadrillion', 'PB']];
  for (const [k, w, u] of R) {
    await page.click(`#trayW .pchip[data-v="${w}"]`); await page.click(`#ladder .rung[data-k="${k}"]`);
    await page.click(`#trayU .pchip[data-v="${u}"]`); await page.click(`#ladder .rung[data-k="${k}"]`);
  }
  await page.waitForSelector('#s1quiz .opt', { timeout: 10000 });
  await opt('#s1quiz', '1 billion bytes');
  await cleared(1);
  console.log('stage 1 cleared; hearts', (await state()).runs['0201'].hearts);

  // ---- Stage 2: predict, slider, drive, quiz
  await opt('#dPredict', 'About 10%');
  await page.waitForSelector('#dPredict .explain.show');
  await page.focus('#dSlider');
  await page.keyboard.press('Home');
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
  await page.click('#osBtn');
  await page.waitForSelector('#s2quiz .opt', { timeout: 10000 });
  console.log('gauge needle text:', await page.textContent('#gauge .needle text'), '| OS:', await page.textContent('#osGB'));
  await page.waitForTimeout(1200); await page.locator('#s2 .gauge').screenshot({ path: SHOT.replace('.png', '-gauge.png') }); await page.locator('#s2 .drive').screenshot({ path: SHOT.replace('.png', '-drive.png') });
  await opt('#s2quiz', 'True, about 10% off');
  await cleared(2);
  console.log('stage 2 cleared');

  // ---- reload mid-quest: resume
  await page.reload(); await page.waitForTimeout(400);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), c1: document.querySelector('#s1').classList.contains('cleared'), c2: document.querySelector('#s2').classList.contains('cleared'), c3: document.querySelector('#s3').classList.contains('cleared'), xp: JSON.parse(localStorage.getItem('sdq:v1')).runs['0201'].xp }));
  console.log('after reload:', JSON.stringify(resume));
  if (!resume.banner || !resume.c1 || !resume.c2 || resume.c3) errs.push('resume broken');

  // ---- Stage 3: four cards
  const ANS = [['300', 'GB'], ['1,000', 'TB'], ['0.02', 'TB'], ['30', 'TB']];
  for (const [n, u] of ANS) {
    await page.click('#zbox .fchip >> nth=0');
    await page.fill('#zNum', n); await page.selectOption('#zUnit', u);
    await page.click('#zCheck');
    const good = await page.waitForSelector('#zWorked.show').then(e => e.getAttribute('class'));
    if (!/good/.test(good)) errs.push('stage 3 answer rejected: ' + n + ' ' + u);
    await page.waitForSelector('#zRow .btn');
    if (n === '30') { await page.waitForTimeout(800); await page.locator('#zbox').screenshot({ path: SHOT.replace('.png', '-card4.png') }); }
    await page.click('#zRow .btn');
  }
  await page.waitForSelector('#s3quiz .opt');
  await opt('#s3quiz', 'About 10 GB');
  await cleared(3);
  console.log('stage 3 cleared');

  // ---- Stage 4: sprint + whiteboard
  for (const t of ['100,000 ÷ 10', '90,000 × 3', '1,000,000 ÷ 100,000', '50 × 2,000', '4 × 300']) {
    await page.locator('#sprint .opt', { hasText: t }).filter({ hasText: new RegExp('^' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).first().click();
    await page.click('#sprint .row .btn.primary');
  }
  await page.click('#board .wline:has-text("Media size = 1")');
  await page.click('#board .wline:has-text("Storage/5 yrs = 55")');
  await page.waitForSelector('#s4quiz .opt');
  await opt('#s4quiz', 'So you don’t mix up');
  await cleared(4);
  console.log('stage 4 cleared');

  // ---- Stage 5: boss
  for (const a of ['ok', 'k', 'fake', 'unit', 'k', 'ok', 'fake']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await cleared(5);
  console.log('stage 5 cleared');

  // ---- Stage 6: drill
  await page.fill('#drill textarea', '300 million is 3 times 10 to the 8, 1 KB is 10 to the 3, add exponents gives 3 times 10 to the 11 bytes which is 300 GB, roughly.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 10000 });
  const fin = await state();
  console.log('VICTORY shown. lesson record:', JSON.stringify(fin.lessons['0201']));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: SHOT, fullPage: false });
  // screenshot of stage 1 ladder and stage 3
  await page.locator('#s1').screenshot({ path: SHOT.replace('.png', '-s1.png') });
  await page.locator('#s2').screenshot({ path: SHOT.replace('.png', '-s2.png') });
  await page.locator('#s3').screenshot({ path: SHOT.replace('.png', '-s3.png') });
  await page.locator('#s4').screenshot({ path: SHOT.replace('.png', '-s4.png') });
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('overflowX at 375:', ov);

  // ---- second context: wrong answers cost hearts
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => errs.push('p2 pageerror: ' + e.message));
  await p2.goto(FILE); await p2.waitForTimeout(300);
  await p2.fill('#zNum', '300'); await p2.selectOption('#zUnit', 'MB'); await p2.click('#zCheck');
  await p2.waitForSelector('#zWorked.show.bad');
  await p2.click('#board .wline:has-text("QPS")');
  await p2.waitForTimeout(300);
  const h2 = await p2.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).runs['0201'].hearts);
  console.log('hearts after 2 wrong answers (expect 1):', h2);
  await p2.screenshot({ path: SHOT.replace('-375-dark.png', '-1280-light.png'), fullPage: true });

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})();
