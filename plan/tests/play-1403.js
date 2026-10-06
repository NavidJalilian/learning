const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1403-youtube-transcoding-and-dag.html';
const DIR = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const reduced = process.argv[2] !== 'motion';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE);
  const click = async (scope, text) => { const b = page.locator(scope).locator('button:not([disabled])', { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout: 60000 }); await b.click(); };
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const xp = () => page.evaluate(() => document.querySelector('.q-xp').textContent);
  const cleared = () => page.evaluate(() => [...document.querySelectorAll('.stage.cleared')].map(s => +s.dataset.stage));
  const waitCleared = async n => { await page.waitForFunction(n => document.querySelector('#s' + n).classList.contains('cleared'), n, { timeout: 90000 }); console.log('stage', n, 'cleared · hearts', await hearts(), '·', await xp()); };
  const setRange = (sel, v) => page.evaluate(([sel, v]) => { const e = document.querySelector(sel); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, [sel, v]);

  /* stage 1 */
  await click('#resSeg', '1080p'); await click('#fpsSeg', '60'); await setRange('#durR', '60');
  console.log('bars:', (await page.locator('#szs .val').allTextContents()).join(' | '), '|', (await page.textContent('#ratio')).trim());
  await click('#kPredict', 'About 4×');
  console.log('4K bars:', (await page.locator('#szs .val').allTextContents()).join(' | '));
  const RANS = { 'smart TV': 'Compatibility', 'rural': 'Bandwidth', 'tunnel': 'Changing network', 'Finance': 'Storage' };
  for (const [k, v] of Object.entries(RANS)) await page.locator('#reasons .sort-item', { hasText: k }).locator('button', { hasText: v }).click();
  await click('#s1quiz', 'Changing network conditions');
  await click('#s1quiz', 'Many devices can');
  await waitCleared(1);

  /* stage 2: one deliberate mistake on the first tile */
  const KIND = { '.mp4': 'box', '.mov': 'box', '.avi': 'box', 'H.264': 'codec', 'VP9': 'codec', 'HEVC': 'codec', 'AV1': 'codec', 'audio track': 'in', 'subtitles / metadata': 'in' };
  for (let i = 0; i < 9; i++) {
    await page.waitForSelector('#belt .tile');
    const t = (await page.textContent('#belt .tile')).trim();
    let k = KIND[t]; if (i === 0) k = k === 'box' ? 'codec' : 'box';
    await page.click(`#bins .bin[data-k="${k}"]`);
    await page.waitForFunction(i => !document.querySelector('#belt .beltinfo').textContent.includes(`Tile ${i + 1} of`), i);
  }
  console.log('after belt hearts', await hearts(), '| msg:', (await page.textContent('#sortMsg')).slice(0, 80));
  const PLAY = { 0: ['b'], 1: ['a', 'b'], 2: ['b', 'c'] };
  for (const d of [0, 1, 2]) { for (const f of PLAY[d]) await page.click(`#devs .dev[data-d="${d}"] .ftog[data-f="${f}"]`); await page.click(`#devs .dev[data-d="${d}"] .q-chk`); console.log('  dev', d, (await page.textContent(`#devs .dev[data-d="${d}"] .verdict`)).slice(0, 90)); }
  await click('#s2quiz', 'container: the box');
  await click('#s2quiz', 'A different codec is inside');
  await waitCleared(2);

  /* reload mid-quest */
  await page.reload();
  await page.waitForSelector('.banner.resume');
  console.log('after reload:', (await page.textContent('.banner.resume')).trim().slice(0, 90), '| cleared', await cleared(), '| hearts', await hearts(), '|', await xp());

  /* stage 3 */
  await click('#abrBox', 'Yes: a few seconds into the tunnel');
  await page.waitForSelector('#abrBox .explain.show', { timeout: 90000 });
  console.log('R1:', (await page.textContent('#abrBox .explain')).slice(0, 160));
  await click('#abrBox', 'Round 2');
  await click('#abrBox', 'Drop to a low rung');
  await page.waitForSelector('#abrBox .explain.show', { timeout: 90000 });
  console.log('R2 log:', (await page.textContent('#abrLog')).slice(-120));
  await click('#abrBox', 'Round 3');
  await click('#abrBox', 'Start the ride');
  let decisions = 0;
  while (true) {
    await page.waitForSelector('#r3panel .rungs .opt, #r3panel .scorecard', { timeout: 90000 });
    if (await page.$('#r3panel .scorecard')) break;
    const info = await page.textContent('#r3panel .dinfo');
    const t = parseFloat(info.match(/time ([\d.]+) s/)[1]);
    const q = t < 13 ? 3 : t < 34 ? 0 : 3;
    await page.click(`#r3panel .rungs .opt[data-q="${q}"]`);
    decisions++;
  }
  console.log('R3 decisions', decisions, '|', (await page.textContent('#r3panel .scorecard')).replace(/\s+/g, ' '));
  await click('#s3quiz', 'The manifest');
  await click('#s3quiz', 'Fetch the next segments at a lower');
  await waitCleared(3);
  await page.locator('#s3').screenshot({ path: DIR + '1403-s3-375-dark.png' });

  /* stage 4: first a loop + a wrong edge, check (costs a heart), then fix */
  const tap = async (a, b) => { await page.click(`#dagSvg .node[data-k="${a}"]`); await page.click(`#dagSvg .node[data-k="${b}"]`); };
  await tap('asm', 'insp'); await tap('insp', 'enc'); await tap('enc', 'asm'); await tap('audio', 'insp');
  await page.click('#dagCheck');
  console.log('check1:', (await page.textContent('#dagFeedback')).replace(/\s+/g, ' ').slice(0, 300), '| hearts', await hearts());
  await page.click('#edgeList .ech[data-e="asm>insp"]'); await page.click('#edgeList .ech[data-e="audio>insp"]');
  await tap('video', 'insp'); await tap('insp', 'thumb'); await tap('insp', 'wm'); await tap('audio', 'aenc');
  await page.click('#dagCheck');
  console.log('check2:', (await page.textContent('#dagFeedback')).replace(/\s+/g, ' ').slice(0, 300), '| hearts', await hearts());
  for (const k of ['thumb', 'wm', 'aenc', 'meta']) await tap(k, 'asm');
  await page.click('#dagCheck');
  console.log('check3:', (await page.textContent('#dagFeedback')).replace(/\s+/g, ' ').slice(0, 200));
  await page.locator('#dagSim').screenshot({ path: DIR + '1403-dag-375-dark.png' });
  await click('#runBox', '12 seconds');
  await page.waitForSelector('#runBox .explain.show', { timeout: 30000 });
  console.log('run:', (await page.textContent('#runBox .explain')).slice(0, 260));
  await click('#runBox', 'On to the check');
  await click('#s4quiz', 'A loop means a task waits on itself');
  await click('#s4quiz', 'The longest chain');
  await waitCleared(4);
  await page.locator('#s4').screenshot({ path: DIR + '1403-s4-375-dark.png' });

  /* stage 5: lose first (2 wrong), rematch, win */
  const ANS = ['cfg', 'abr', 'par', 'fail', 'h264'];
  const WRONG = ['fork', 'cdn', 'par', 'fail', 'h264'];
  for (const run of [WRONG, ANS]) {
    for (let i = 0; i < 5; i++) {
      await page.click(`#boss .choice .opt[data-c="${run[i]}"]`);
      await click('#boss', i < 4 ? 'Next' : 'Final blow');
    }
    if (run === WRONG) { await page.waitForSelector('#rematch', { state: 'visible' }); console.log('boss lost:', (await page.textContent('#boss .scenario p')).trim().slice(0, 60), '| cleared?', (await cleared()).includes(5)); await page.click('#rematch .btn'); }
  }
  await waitCleared(5);

  /* stage 6 */
  await page.fill('#drill textarea', 'Four reasons: storage, compatibility, bandwidth and changing networks. Container vs codec. Renditions plus a manifest for ABR. DAG with split, inspection, encodings, thumbnail, watermark, audio, assemble.');
  await page.click('#drill .q-reveal');
  const boxes = page.locator('#drill .selfgrade input');
  for (let i = 0; i < await boxes.count(); i++) await boxes.nth(i).check();
  await page.click('#drill .q-finish');
  await waitCleared(6);

  await page.waitForSelector('#victory.show', { timeout: 10000 });
  console.log('VICTORY:', (await page.textContent('#victory h2')).trim(), '|', (await page.textContent('#victory .vstats')).replace(/\s+/g, ' ').trim());
  console.log('store:', await page.evaluate(() => localStorage.getItem('sdq:v1')));
  console.log('overflowX:', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await page.screenshot({ path: DIR + '1403-375-dark.png', fullPage: true });
  for (const n of [1, 2, 5]) await page.locator('#s' + n).screenshot({ path: DIR + `1403-s${n}-375-dark.png` });
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
