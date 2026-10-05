const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0301-rules-of-the-room.html';
const DIR = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
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
  const cleared = n => page.waitForSelector(`#s${n}.cleared`, { timeout: 20000 });
  const opt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}'));
  const run = async () => (await state()).runs['0301'];

  // ---- Stage 1: radar
  const S1 = { 'daily users': 'questions', 'pushes back on SQL': 'collab', 'web app or a mobile': 'ambig', 'cache in front': 'design', 'minute 30': 'pressure', 'two storage options': 'design', 'level of detail': 'collab' };
  const LBL = { questions: 'Good questions', collab: 'Collaboration', ambig: 'Ambiguity', design: 'Design skill', pressure: 'Under pressure' };
  for (let i = 0; i < 7; i++) {
    const t = await page.textContent('#bcard .bcard p');
    const k = Object.entries(S1).find(([s]) => t.includes(s))[1];
    if (i === 0) { // keyboard on the SVG spoke
      await page.focus(`#radar .sp[aria-label="${LBL[k]} spoke"]`);
      await page.keyboard.press('Enter');
    } else await page.click(`#spokebtns .opt[data-k="${k}"]`);
    await page.waitForSelector('#bcard .explain.show.good');
    if (i === 3) await page.locator('#s1 .radar').screenshot({ path: DIR + '0301-s1-radar.png' });
    await page.click('#bcard .row .btn');
  }
  await page.waitForSelector('#radarCap.show');
  await page.waitForSelector('#s1quiz .opt', { timeout: 5000 });
  await page.locator('#s1 .radar').screenshot({ path: DIR + '0301-s1-full.png' });
  await opt('#s1quiz', 'How you reason');
  await cleared(1);
  console.log('stage 1 cleared', JSON.stringify(await run()));

  // ---- Stage 2: transcript
  await page.click('#chat .msg.c[data-i="2"]'); // decoy
  await page.click('#chat .fmenu .opt[data-f="narrow"]');
  const h2 = (await run()).hearts;
  console.log('after flagging decoy hearts =', h2);
  if (h2 !== 2) errs.push('decoy did not cost a heart');
  // cancel path
  await page.click('#chat .msg.c[data-i="1"]');
  await page.click('#chat .fmenu .opt[data-f="none"]');
  if (await page.locator('#chat .fmenu').count()) errs.push('cancel did not close menu');
  for (const [i, f] of [[3, 'over'], [5, 'narrow'], [7, 'stubborn']]) {
    await page.click(`#chat .msg.c[data-i="${i}"]`);
    await page.click(`#chat .fmenu .opt[data-f="${f}"]`);
  }
  await page.waitForSelector('#decoyNote', { state: 'visible' });
  console.log('flag count', await page.textContent('#flagCount'));
  await page.locator('#s2 .sim').screenshot({ path: DIR + '0301-s2.png' });
  await page.waitForSelector('#s2quiz .opt', { timeout: 5000 });
  await opt('#s2quiz', 'Give your reason');
  await cleared(2);
  console.log('stage 2 cleared', JSON.stringify(await run()));

  // ---- reload mid-quest
  await page.reload(); await page.waitForTimeout(400);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), c1: document.querySelector('#s1').classList.contains('cleared'), c2: document.querySelector('#s2').classList.contains('cleared'), c3: document.querySelector('#s3').classList.contains('cleared') }));
  console.log('after reload:', JSON.stringify(resume), JSON.stringify(await run()));
  if (!resume.banner || !resume.c1 || !resume.c2 || resume.c3) errs.push('resume broken');

  // ---- Stage 3: sliders + Sam
  if (!(await page.isDisabled('#lockBud'))) errs.push('lock enabled at invalid start');
  for (const [i, val] of [[0, 7], [1, 13], [2, 21], [3, 4]]) {
    await page.focus('#sl' + i); await page.keyboard.press('Home');
    for (let j = 0; j < val; j++) await page.keyboard.press('ArrowRight');
  }
  console.log('budget status:', await page.textContent('#bstatus'));
  await page.click('#lockBud');
  await page.locator('#s3 .challenge.boxed').first().screenshot({ path: DIR + '0301-s3-budget.png' });
  await opt('#samPredict', 'He ran out of time');
  await page.waitForSelector('#samPredict .explain.show', { timeout: 15000 });
  await page.locator('#s3 .challenge.boxed').nth(1).screenshot({ path: DIR + '0301-s3-sam.png' });
  await page.waitForSelector('#s3quiz .opt', { timeout: 5000 });
  await opt('#s3quiz', 'Deep dive');
  await cleared(3);
  console.log('stage 3 cleared', JSON.stringify(await run()));

  // ---- Stage 4: deck
  const S4 = { 'what scale': 'do', 'mobile-only': 'dont', 'two storage': 'do', 'index layout': 'dont', 'hint after': 'do', 'Go quiet': 'dont', 'done"': 'dont', 'done”': 'dont', 'direction make sense': 'do', 'most critical': 'do', 'one textbook': 'dont', 'Practise': 'do', 'Give up': 'dont' };
  for (let i = 0; i < 12; i++) {
    const t = await page.textContent('#dText');
    const e = Object.entries(S4).find(([s]) => t.includes(s));
    if (!e) { errs.push('unknown card ' + t); break; }
    let k = e[1];
    if (i === 0) k = k === 'do' ? 'dont' : 'do'; // deliberate miss
    if (i === 1) { // swipe
      await page.locator('#dcard').scrollIntoViewIfNeeded(); await page.waitForTimeout(300); const b = await page.locator('#dcard').boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
      await page.mouse.move(b.x + b.width / 2 + (k === 'do' ? 120 : -120), b.y + b.height / 2, { steps: 8 }); await page.mouse.up();
    } else await page.click(`#dbtns .opt[data-k="${k}"]`);
    await page.waitForSelector('#dcard.flip', { state: 'attached', timeout: 4000 }).catch(async () => { console.log('no flip at card', i, await page.evaluate(() => document.querySelector('#dcard').className + ' busy? ' + document.querySelector('#dbtns .opt').disabled)); throw new Error('flip'); });
    if (i === 1) await page.locator('#s4 .sim').screenshot({ path: DIR + '0301-s4.png' });
    await page.click('#dNext .btn');
  }
  console.log('deck right:', await page.textContent('#dRight'));
  await page.waitForSelector('#s4quiz .opt', { timeout: 5000 });
  await opt('#s4quiz', 'ask for a hint');
  await cleared(4);
  console.log('stage 4 cleared', JSON.stringify(await run()));

  // ---- Stage 5: boss
  const S5 = { 'Startup or giant?': 'strong', 'Kafka for ten users': 'red', 'The hot-key hint': 'strong', 'The silent sketch': 'red', 'A decisive pick': 'strong', 'Not what they pictured': 'neutral', '"No weaknesses"': 'red', 'Feedback mid-design': 'strong' };
  for (let i = 0; i < 8; i++) {
    const t = (await page.textContent('#boss .scenario h3')).trim();
    await page.click(`#boss .choice .opt[data-c="${S5[t]}"]`);
    if (i === 5) await page.locator('#s5 .stage-b').screenshot({ path: DIR + '0301-s5.png' });
    await page.click('#boss .row .btn.primary');
  }
  await cleared(5);
  console.log('stage 5 cleared', JSON.stringify(await run()));

  // ---- Stage 6: drill
  await page.fill('#drill textarea', 'I treat it as a design session with a colleague. Scope for about 5 to 10 minutes, then a high level diagram for 10 to 15, then a deep dive on the critical parts, then wrap up with bottlenecks. I think out loud, offer options, and avoid over-engineering.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await cleared(6);
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  const st = await state();
  console.log('victory shown; lesson record', JSON.stringify(st.lessons['0301']), 'run left?', !!st.runs['0301']);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: DIR + '0301-375-dark.png', fullPage: true });

  // light mode desktop quick look
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => errs.push('pageerror(light): ' + e.message));
  await p2.goto(FILE); await p2.waitForTimeout(400);
  await p2.locator('#s1').screenshot({ path: DIR + '0301-s1-light.png' });
  await p2.locator('#s3').screenshot({ path: DIR + '0301-s3-light.png' });
  await ctx2.close();

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
  await browser.close();
})();
