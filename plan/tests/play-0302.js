const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0302-ask-before-you-build.html';
const SHOT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(300);
  const log = (...a) => console.log(...a);
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const xp = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs?.['0302']?.xp ?? null);
  const cleared = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs?.['0302']?.cleared ?? null);
  async function answer(stage, text) {
    const b = page.locator(`#s${stage} .quiz .opt:not([disabled])`, { hasText: text }).first();
    await b.waitFor({ timeout: 15000 });
    await b.click();
  }
  async function waitCleared(n) {
    await page.waitForFunction(n => document.querySelector('#s' + n).classList.contains('cleared'), n, { timeout: 15000 });
    log(`stage ${n} cleared · xp=${await xp()} hearts=${await hearts()}`);
  }

  // ---- Stage 2 first (any order allowed)
  log('run btn disabled before predict:', await page.locator('#rRun').isDisabled());
  const card = q => page.locator(`#s2 .qc[aria-label="Ask: ${q}"]`);
  await card('What colour is the like button?').click();
  await card('Should I use Java or Go?').click();
  log('after 2 low cards hearts', await hearts(), 'min', await page.locator('#dMin').innerText());
  await card('Is there a deadline for launch?').click();
  await card('How many daily active users?').click();
  await card('Mobile app, web app, or both?').click();
  await card('Who are your main competitors?').click();
  log('round1 status:', await page.locator('#dStatus').innerText());
  await page.locator('#dReset').click();
  for (const q of ['Which features matter most?', 'How many daily active users?', 'What scale do we expect in 6–12 months?', 'Any existing services to reuse, like login or notifications?']) await card(q).click();
  log('round2 status:', await page.locator('#dStatus').innerText(), 'xp', await xp());
  await answer(2, 'How many daily users');
  await waitCleared(2);

  // ---- Stage 1
  await page.locator('#rPredict .opt[data-p="B"]').click();
  await page.locator('#rRun').click();
  await page.waitForTimeout(1500);
  log('mid-race clock', await page.locator('#rClock').innerText());
  await page.locator('#rSkip').click();
  await page.locator('#rEnd.show').waitFor({ timeout: 10000 });
  log('crossed out on A board:', await page.locator('#laneA .box2.x').count(), 'B notes', await page.locator('#laneB .note').count());
  await answer(1, 'wrong problem');
  await waitCleared(1);

  // ---- Reload mid-quest
  await page.reload(); await page.waitForTimeout(500);
  log('RESUME banner:', await page.locator('.banner.resume').count(), 'cleared:', JSON.stringify(await cleared()), 'xp', await xp(), 'hearts', await hearts(),
    's1/s2 cleared class', await page.locator('#s1.cleared').count(), await page.locator('#s2.cleared').count());

  // ---- Stage 3
  const askQ = t => page.locator('#asks .opt', { hasText: t }).click();
  const reply = kind => page.locator(`#replies .opt[data-kind="${kind}"]`).click();
  await askQ('newest-first'); await page.waitForTimeout(600);
  await reply('stall'); log('after stall hearts', await hearts());
  await reply('stated');
  await askQ('mobile app'); await page.waitForTimeout(600);
  await reply('silent');
  await askQ('notification'); await page.waitForTimeout(600);
  await reply('stated');
  await askQ('daily active'); await page.waitForTimeout(600);
  log('req notes', await page.locator('#reqCol .note').count(), 'asm notes', await page.locator('#asmCol .note').count(), 'ghosts', await page.locator('#asmCol .note.ghost').count());
  await page.locator('#ffBtn').click();
  await page.waitForTimeout(2500);
  log('replay status:', await page.locator('#c3status').innerText(), 'hearts', await hearts());
  await page.locator('#asmCol button.note.ghost').click();
  await page.locator('#ffBtn').click();
  await answer(3, 'I’ll assume newest first');
  await waitCleared(3);

  // ---- Stage 4
  const chip = t => page.locator('#pile .chipb', { hasText: t }).first();
  const slot = k => page.locator(`#slots .slot[data-k="${k}"]`);
  await chip('100M DAU').click(); await slot('traffic').click();
  log('dud hint:', await page.locator('#bHint').innerText(), 'hearts', await hearts());
  const pairs = [['Mobile + web', 'plat'], ['Post + see', 'feat'], ['Newest first', 'order'], ['Up to 5,000', 'friends'], ['10M DAU', 'traffic'], ['Images + videos', 'media']];
  for (const [t, k] of pairs) { await chip(t).click(); await slot(k).click(); }
  log('board:', await page.locator('#bStatus').innerText());
  await page.fill('#calcIn', '11574'); await page.click('#calcGo');
  log('calc wrong:', (await page.locator('#calcMsg').innerText()).slice(0, 40));
  await page.fill('#calcIn', '~1,160'); await page.press('#calcIn', 'Enter');
  log('calc right:', (await page.locator('#calcMsg').innerText()).slice(0, 40));
  await page.screenshot({ path: SHOT + '0302-375-dark-s4.png', fullPage: false });
  await answer(4, 'Up to 5,000 friends');
  await waitCleared(4);

  // ---- Stage 5: lose the first fight on purpose (3 wrong), then win the rematch
  const ANS = ['Features', 'Scale', 'Existing stack', 'Not worth asking', 'Scale', 'Features', 'Existing stack'];
  const WRONG = ['Not worth asking', 'Features', 'Scale', 'Features', 'Not worth asking', 'Existing stack', 'Features'];
  async function fight(list) {
    for (let i = 0; i < list.length; i++) {
      await page.locator('#boss .choice .opt', { hasText: list[i] }).first().click();
      await page.locator('#boss .row .btn.primary').click();
    }
  }
  await fight(ANS.map((a, i) => i < 3 ? WRONG[i] : a));
  log('boss first result:', await page.locator('#boss .scenario h3').innerText(), 's5 cleared?', await page.locator('#s5.cleared').count());
  await page.locator('#rematch').click();
  await fight(ANS);
  await waitCleared(5);

  // ---- Stage 6
  await page.fill('#drill textarea', 'Before I draw anything I would ask about platform, features, feed order, friends, daily users, growth, media and reuse, and write it all down.');
  await page.locator('#drill .q-reveal').click();
  const boxes = page.locator('#drill .selfgrade input');
  for (let i = 0; i < 4; i++) await boxes.nth(i).check();
  await page.locator('#drill .q-finish').click();
  await waitCleared(6);

  await page.locator('#victory.show').waitFor({ timeout: 5000 });
  const best = await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).lessons['0302']);
  log('VICTORY shown; saved best', JSON.stringify(best));
  await page.locator('#victory').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SHOT + '0302-victory.png' });
  log('errors:', errs.length ? errs : 'none');
  await browser.close();
})();
