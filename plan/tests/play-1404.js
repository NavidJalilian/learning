const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1404-youtube-transcoding-architecture.html';
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
  const click = async (scope, text) => { const b = page.locator(scope).locator('button', { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout: 30000 }); await b.click(); };
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const xp = () => page.evaluate(() => document.querySelector('.q-xp').textContent);
  const cleared = () => page.evaluate(() => [...document.querySelectorAll('.stage.cleared')].map(s => +s.dataset.stage));
  const waitCleared = async n => { await page.waitForFunction(n => document.querySelector('#s' + n).classList.contains('cleared'), n, { timeout: 60000 }); console.log('stage', n, 'cleared · hearts', await hearts(), '·', await xp()); };
  const log = async id => (await page.textContent('#' + id)).replace(/\s+/g, ' ').slice(-220);

  /* stage 1 */
  // one wrong match first (costs a heart)
  await page.click('#jobs .jobc[data-k="dag"]'); await page.click('#floor button.st[data-k="pre"]');
  console.log('s1 wrong → hearts', await hearts());
  for (const k of ['pre', 'dag', 'rm', 'wk', 'out', 'tmp']) { await page.click(`#jobs .jobc[data-k="${k}"]`); await page.click(`#floor button.st[data-k="${k}"]`); }
  console.log('lit:', await page.locator('#floor .st.lit').count());
  await page.click('#s1run');
  await click('#s1quiz', 'The preprocessor');
  await click('#s1quiz', 'The task workers');
  await waitCleared(1);

  /* stage 2 */
  await page.click('#strip .fr[data-i="5"]');
  console.log('bad chunk shown:', await page.locator('#chunks .chunk.bad').count());
  await page.click('#strip .fr[data-i="5"]');
  for (const i of [12, 24, 36]) await page.click(`#strip .fr[data-i="${i}"]`);
  await page.waitForSelector('#encWrap', { state: 'visible' });
  await page.screenshot({ path: DIR + '1404-s2-375-dark.png', fullPage: false });
  await click('#s2box', 'After about 2 s');
  console.log('race log:', await log('s2log'));
  await click('#s2box', 'Next: a worker crashes');
  await click('#s2box', 'Only GOP 3, on a new worker');
  await click('#s2box', 'Next: switch storage OFF');
  await click('#s2box', 'The whole job, from the original upload');
  console.log('off log:', await log('s2log'));
  await click('#s2box', 'Finish the lab');
  await click('#s2quiz', 'Each GOP opens with a keyframe');
  await click('#s2quiz', 'So a failed encode can retry');
  await waitCleared(2);

  /* reload mid-quest */
  await page.reload();
  await page.waitForSelector('.banner.resume');
  console.log('after reload:', (await page.textContent('.banner.resume')).trim().slice(0, 90), '| cleared', await cleared(), '| hearts', await hearts(), '|', await xp());

  /* stage 3 */
  await page.click('#tray .tchip[data-k="split"]'); await page.click('#cols .col[data-c="2"]'); // legal but slow
  console.log('slow msg:', (await log('s3log')).slice(-120));
  const place = { split: 1, ve: 2, th: 2, ae: 2, asm: 3 };
  for (const [k, c] of Object.entries(place)) { await page.click(`#tray .tchip[data-k="${k}"]`); await page.click(`#cols .col[data-c="${c}"]`); }
  await page.click('#s3run');
  await click('#s3quiz', 'No. If it did');
  await click('#s3quiz', 'Into the resource manager');
  await waitCleared(3);

  /* stage 4 */
  await page.click('#tks .tk[data-n="1"]'); // not the top task → hint, no heart
  console.log('prio hint:', (await log('s4log')).slice(-110), '| hearts', await hearts());
  const ticks = [[3, 'E3'], [3, 'E2'], [5, 'M1'], [7, 'E3'], [6, 'T2'], [1, 'E2'], [2, 'T2']]; // first one deliberately not optimal
  for (const [n, w] of ticks) {
    await page.click(`#tks .tk[data-n="${n}"]`);
    await page.click(`#wks .wk[data-id="${w}"]`);
    if (await page.isEnabled('#rmRun')) { await page.click('#rmRun'); await page.waitForFunction(() => !document.querySelector('#s4log').closest('.stage').querySelector('#rmRun').disabled || document.querySelector('#rmAuto').style.display !== 'none' || true); await page.waitForTimeout(reduced ? 300 : 2500); }
    else console.log('  rejected', n, w, '→', (await log('s4log')).slice(-90));
  }
  console.log('manual:', await page.textContent('#manN'));
  await page.click('#rmAuto');
  await click('#rmTwist', 'Put it back in the task queue');
  console.log('twist:', (await page.textContent('#rmTwist .explain')).slice(0, 80));
  await page.screenshot({ path: DIR + '1404-s4-375-dark.png' });
  await click('#rmTwist', 'Continue autopilot');
  await click('#s4quiz', 'The running queue, which pairs');
  await click('#s4quiz', 'To get the least-busy worker fast');
  await waitCleared(4);
  console.log('s4 end log:', (await log('s4log')).slice(-200));

  /* stage 5 */
  const BIN = { meta: 'mem', gop: 'blob', aud: 'blob', cfg: 'mem', thumb: 'blob', final: 'perm' };
  for (const [k, b] of Object.entries(BIN)) await page.click(`#s5sort .sort-item[data-k="${k}"] .opt[data-b="${b}"]`);
  await page.waitForSelector('#s5after', { state: 'visible' });
  await page.click('#bell');
  await page.waitForTimeout(1600);
  console.log('junk:', (await page.textContent('#junk')).trim());
  for (const k of ['meta', 'gop', 'aud', 'cfg', 'thumb']) await page.click(`#shelves [data-free="${k}"]`);
  console.log('junk after:', (await page.textContent('#junk')).trim());
  await click('#s5quiz', 'Data type, size');
  await waitCleared(5);

  /* stage 6 boss */
  for (const [lab, last] of [['Raise its priority'], ['Retry chunk 37'], ['Split on the server'], ['Edit the DAG config'], ['Free it when done', 1]]) {
    await click('#boss', lab);
    await click('#boss', last ? 'Final blow' : 'Next');
  }
  await waitCleared(6);

  /* stage 7 drill */
  await page.fill('#drill textarea', 'The preprocessor splits by GOP and builds the DAG from config and caches GOPs in temp storage. The DAG scheduler cuts stages into the task queue. The resource manager has task, worker and running queues. Workers by type. Temp storage freed after; output funny_720p.mp4.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.locator('#drill .selfgrade input').all()) await cb.check();
  await page.click('#drill .q-finish');
  await waitCleared(7);

  await page.waitForSelector('#victory.show', { timeout: 10000 });
  console.log('VICTORY:', (await page.textContent('#victory h2')).trim(), '|', (await page.textContent('#victory .vstats')).replace(/\s+/g, ' '));
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('overflowX', ov);
  await page.screenshot({ path: DIR + '1404-375-dark.png', fullPage: true });
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
