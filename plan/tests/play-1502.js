const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1502-drive-blocks-and-delta-sync.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.goto(FILE); await page.waitForTimeout(300);
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}'));
  const opt = async (scope, text) => { const b = page.locator(`${scope} .opt`, { hasText: text }).first(); await b.click(); };
  const cleared = async n => { await page.waitForFunction(n => document.querySelector('#s' + n).classList.contains('cleared'), n, { timeout: 30000 }); console.log('stage', n, 'cleared'); };

  // ---- Stage 1: one wrong drop, one real drag, rest tap-tap
  await page.click('#tray .tile[data-k="cold"]');
  await page.click('#board .slot[data-k="lb"]');
  console.log('wrong drop info:', (await page.textContent('#tinfo')).slice(0, 60));
  // drag block servers with the mouse (tall viewport so tile and slot are both on screen)
  await page.setViewportSize({ width: 1280, height: 1500 });
  await page.locator('#boardSim').scrollIntoViewIfNeeded();
  const t = await page.locator('#tray .tile[data-k="block"]').boundingBox();
  const s = await page.locator('#board .slot[data-k="block"]').boundingBox();
  await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2); await page.mouse.down();
  await page.mouse.move(t.x + 40, t.y - 30, { steps: 5 });
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2, { steps: 10 }); await page.mouse.up();
  await page.setViewportSize({ width: 1280, height: 900 });
  console.log('drag placed block:', await page.locator('#board .slot[data-k="block"].filled').count());
  for (const k of ['cloud', 'cold', 'lb', 'api', 'mcache', 'mdb', 'notif', 'queue']) {
    await page.click(`#tray .tile[data-k="${k}"]`); await page.click(`#board .slot[data-k="${k}"]`);
  }
  await page.waitForSelector('#s1quiz .opt');
  await opt('#s1quiz', 'Offline backup queue');
  await cleared(1);

  // ---- Stage 2
  await opt('#pool', 'Compress'); // wrong first -> heart
  for (const x of ['Split', 'Compress', 'Encrypt', 'Upload']) await opt('#pool', x);
  await page.click('#runMeter');
  await page.waitForFunction(() => /→/.test(document.querySelector('#mGood').textContent), null, { timeout: 15000 });
  console.log('meter:', await page.textContent('#mGood'), '|', await page.textContent('#mBug'), '|', await page.textContent('#meterNote'));
  await page.click('#code .cl[data-i="2"]');
  await opt('#whyQuiz', 'look random');
  await page.waitForSelector('#s2quiz .opt');
  await opt('#s2quiz', '.mp4');
  await cleared(2);

  // ---- reload mid-quest
  await page.reload(); await page.waitForTimeout(400);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), done: document.querySelectorAll('.dot.done').length, c1: document.querySelector('#s1').classList.contains('cleared') }));
  console.log('after reload:', JSON.stringify(resume), 'run:', JSON.stringify((await state()).runs));

  // ---- Stage 3
  await page.click('#e2'); await page.click('#e5');
  await page.fill('#r1in', '8');
  await page.click('#r1go');
  await page.waitForSelector('#dbox .explain.show', { timeout: 20000 });
  console.log('r1:', (await page.textContent('#dbox .explain')).slice(0, 40), '| sent', await page.textContent('#dSent'), 'saved', await page.textContent('#dSaved'));
  await page.click('#dbox .btn.primary:has-text("Next round")');
  await page.click('#ins');
  await opt('#dbox', 'Every block changes');
  await page.waitForSelector('#dbox .explain.show', { timeout: 20000 });
  console.log('r2 fixed: sent', await page.textContent('#dSent'), '| blocks', await page.locator('#stripLoc .blk').count());
  await page.click('#modebar button[data-m="cdc"]');
  await page.waitForSelector('#dbox .quiz .opt', { timeout: 20000 });
  console.log('r2 cdc: sent', await page.textContent('#dSent'), '| blocks', await page.locator('#stripLoc .blk').count(), '| diff', await page.locator('#stripLoc .blk.diff').count());
  await opt('#dbox .quiz', 'content-defined cuts');
  await page.waitForSelector('#s3quiz .opt');
  await opt('#s3quiz', '12 MB');
  await cleared(3);

  // ---- Stage 4
  await opt('#r1', 'join them in block order');
  await page.waitForSelector('#r2 .opt'); await opt('#r2', 'In the metadata DB');
  await page.waitForSelector('#r3 .opt'); await opt('#r3', 'Upload file blocks');
  await cleared(4);

  // ---- Stage 5 boss
  for (const a of ['delta', 'both', 'ce', 'split']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    await page.click('#boss .q-arena .btn.primary');
  }
  await cleared(5);

  // ---- Stage 6 drill
  await page.fill('#drill textarea', 'Block servers split files into 4 MB blocks, compress then encrypt, store in S3, hashes in metadata DB, delta sync uploads changed blocks only.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.locator('#drill .selfgrade input').all()) await cb.check();
  await page.click('#drill .q-finish');
  await cleared(6);

  await page.waitForSelector('#victory.show', { timeout: 5000 });
  const st = await state();
  console.log('victory shown; lesson record:', JSON.stringify(st.lessons['1502']));
  console.log('ERRORS:', errs.length ? errs : 'none');

  // 375 dark screenshots
  const c2 = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const p2 = await c2.newPage();
  await p2.goto(FILE); await p2.waitForTimeout(400);
  await p2.click('#tray .tile[data-k="api"]');
  await p2.locator('#s1').screenshot({ path: SP + 'q1502/s1-375-dark.png' });
  await p2.click('#e2');
  await p2.locator('#s3').screenshot({ path: SP + 'q1502/s3-375-dark.png' });
  await p2.click('#pool .opt >> nth=0');
  await p2.locator('#s2').screenshot({ path: SP + 'q1502/s2-375-dark.png' });
  console.log('overflow375:', await p2.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
