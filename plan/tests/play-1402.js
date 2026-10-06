const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1402-youtube-upload-and-stream-flows.html';
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

  /* ---- stage 1 ---- */
  const LANE = { 'Play the next': 'cdn', 'Sign up': 'api', 'home feed': 'api', 'upload URL': 'api', 'title and description': 'api', '720p': 'cdn', 'Like a video': 'api', 'thumbnail': 'cdn' };
  let wrongDone = false, softDone = false;
  for (let n = 0; n < 8; n++) {
    const t = await page.textContent('#req .rt');
    const key = Object.keys(LANE).find(k => t.includes(k));
    const lane = LANE[key];
    if (!wrongDone && lane === 'api') { await page.click('#toCdn'); wrongDone = true; console.log('wrong drop msg:', await page.textContent('#sortmsg')); await page.waitForTimeout(450); }
    if (!softDone && key === 'thumbnail') { await page.click('#toApi'); softDone = true; console.log('soft bounce msg:', await page.textContent('#sortmsg')); await page.waitForTimeout(450); }
    await page.click(lane === 'cdn' ? '#toCdn' : '#toApi');
    await page.waitForTimeout(450);
  }
  console.log('lanes:', await page.evaluate(() => [document.querySelectorAll('#listCdn li').length, document.querySelectorAll('#listApi li').length]));
  await page.waitForSelector('#s1q1 .opt', { timeout: 5000 });
  await clickOpt('#s1q1', 'An edge is close by');
  await page.waitForSelector('#s1q2 .opt', { timeout: 5000 });
  await clickOpt('#s1q2', 'Big binary files');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());

  /* ---- stage 2 ---- */
  await page.click('#tray2 .tile[data-id="cdn"]');
  console.log('early msg:', await page.textContent('#hint2'));
  await page.click('#tray2 .tile[data-id="search"]');
  console.log('decoy msg:', await page.textContent('#hint2'));
  for (const id of ['lb', 'api', 'cache', 'db', 'orig', 'trans', 'tstore', 'cdn', 'queue', 'handler']) {
    await page.click(`#tray2 .tile[data-id="${id}"]`);
    await page.waitForTimeout(120);
  }
  console.log('stat2:', await page.textContent('#stat2'), '| hint:', await page.textContent('#hint2'));
  await page.locator('#board2 .nd[data-id="queue"]').click();
  console.log('node tap:', await page.textContent('#hint2'));
  await page.locator('#s2 .board').screenshot({ path: SP + '1402-board2.png' });
  await page.waitForSelector('#s2q1 .opt', { timeout: 5000 });
  await clickOpt('#s2q1', 'move on; workers');
  await page.waitForSelector('#s2q2 .opt', { timeout: 5000 });
  await clickOpt('#s2q2', 'Shards spread the load');
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());

  /* ---- reload mid-quest: resume ---- */
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), s2: document.querySelector('#s2').classList.contains('cleared'), text: (document.querySelector('.banner') || {}).textContent }));
  console.log('resume:', JSON.stringify(resume), await hud());

  /* ---- stage 3 ---- */
  const J = [['orig'], ['trans'], ['tstore', 'queue'], ['cdn'], ['handler'], ['meta'], ['api']];
  for (let i = 0; i < J.length; i++) {
    if (i === 0) { await page.click('#jbox .opt[data-k="api"]'); console.log('junction wrong:', await page.textContent('#jbox .explain')); }
    for (const k of J[i]) await page.click(`#jbox .opt[data-k="${k}"]`);
    await page.waitForSelector('#jbox .row .btn.primary', { timeout: 8000 });
    await page.click('#jbox .row .btn.primary');
  }
  await page.click('#jbox .opt[data-i="0"]');
  await page.waitForSelector('#ordbox .opt', { timeout: 8000 });
  console.log('steps lit:', await page.evaluate(() => [...document.querySelectorAll('#steps3 .chip.on')].map(c => c.dataset.s).join(',')));
  await page.locator('#s3 .board').screenshot({ path: SP + '1402-board3.png' });
  await page.click('#replay2x');
  await page.waitForTimeout(4000);
  console.log('after replay log:', await page.evaluate(() => [...document.querySelectorAll('#log3 div')].slice(-1)[0].textContent));
  // one wrong order tap then right order
  await page.click('#ordbox .opt[data-i="3"]');
  for (let i = 0; i < 5; i++) await page.click(`#ordbox .opt[data-i="${i}"]`);
  await page.waitForSelector('#s3q .opt', { timeout: 5000 });
  await clickOpt('#s3q', 'Metadata is tiny');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* ---- stage 4 ---- */
  await page.click('#preds .sort-item[data-p="D"] .opt[data-k="slow"]');
  await page.click('#preds .sort-item[data-p="S"] .opt[data-k="fast"]');
  await page.click('#raceGo');
  await page.waitForTimeout(3000);
  await page.locator('#s4 .race').screenshot({ path: SP + '1402-race-mid.png' });
  await page.waitForSelector('#raceNote:not([style*="none"])', { timeout: 15000 });
  console.log('race:', await page.textContent('#ffD'), await page.textContent('#ffS'), await page.textContent('#statS'));
  await page.click('#cities .btn[data-c="sy"]');
  await page.waitForTimeout(900);
  console.log('sydney:', await page.textContent('#rEv'), await page.textContent('#rOv'));
  await page.locator('#wmap').click({ position: { x: 5, y: 5 } }).catch(() => {});
  await page.click('#cities .btn[data-c="ld"]');
  await page.waitForTimeout(900);
  console.log('london:', await page.textContent('#rEv'), await page.textContent('#rOv'), '|', await page.textContent('#rnote'));
  await page.locator('#s4 .wmap').screenshot({ path: SP + '1402-map.png' });
  await page.click('#match [data-a="hls"]'); await page.click('#match [data-b="hds"]'); // wrong
  for (const k of ['dash', 'hls', 'mss', 'hds']) { await page.click(`#match [data-a="${k}"]`); await page.click(`#match [data-b="${k}"]`); }
  await page.waitForSelector('#s4q1 .opt', { timeout: 5000 });
  await clickOpt('#s4q1', 'closest to the viewer');
  await page.waitForSelector('#s4q2 .opt', { timeout: 5000 });
  await clickOpt('#s4q2', 'different encodings');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());

  /* ---- stage 5: lose first (3 wrong), rematch, win ---- */
  const BOSS = ['q', 'edge', 'keep', 'fine', 'bad'];
  for (let i = 0; i < 5; i++) { await page.click(`#boss .choice .opt[data-c="${i < 2 ? BOSS[i] : ['cdn', 'api', 'drop', 'block', 'good'][i]}"]`); await page.click('#boss .row .btn.primary'); }
  console.log('boss lost:', await page.textContent('#bossRetry'));
  await page.click('#bossRetry .btn.primary');
  for (const k of BOSS) { await page.click(`#boss .choice .opt[data-c="${k}"]`); await page.click('#boss .row .btn.primary'); }
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', 'File goes to original storage while metadata goes via API servers to cache and DB; transcoding servers fetch and transcode; then transcoded storage to CDN and a completion event to the queue; handler updates DB and cache; API tells client; friend streams from nearest CDN edge with HLS.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY', await page.textContent('#victory h2'), await hud());

  // fresh full-page screenshots
  const p2 = await (await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' })).newPage();
  await p2.goto(URL); await p2.waitForTimeout(500);
  await p2.screenshot({ path: SP + '1402-375-dark.png', fullPage: true });
  console.log('overflow 375:', await p2.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  const p3 = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })).newPage();
  await p3.goto(URL); await p3.waitForTimeout(500);
  await p3.screenshot({ path: SP + '1402-1280-light.png', fullPage: true });

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
