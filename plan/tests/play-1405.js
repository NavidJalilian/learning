const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1405-youtube-optimizations-and-errors.html';
const OUT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/q1405';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.goto(FILE); await page.waitForTimeout(300);
  const cleared = n => page.evaluate(n => document.querySelector('#s' + n).classList.contains('cleared'), n);
  const opt = (scope, text) => page.locator(`${scope} .opt`, { hasText: text }).first().click();
  const xp = () => page.evaluate(() => (JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['1405']);
  const quiz = async (sel, a, b) => {
    await page.waitForSelector(`${sel} .quiz .opt`);
    await opt(sel, a);
    await page.waitForFunction(s => document.querySelectorAll(s + ' .quiz').length === 2, sel, { timeout: 5000 });
    await opt(`${sel} .quiz:nth-of-type(2)`, b);
    await page.waitForTimeout(1500);
  };

  // ---------- Stage 1 ----------
  console.log('go disabled before predictions:', await page.isDisabled('#rcGo'));
  await opt('#rcPredict .pgroup[data-k="win"]', 'Lane B');
  await opt('#rcPredict .pgroup[data-k="waste"]', 'About 110 seconds');
  await page.click('#rcGo');
  await page.waitForSelector('#rcPredict .explain.show', { timeout: 15000 });
  console.log('race1 A:', await page.textContent('#aStat'), '| B:', await page.textContent('#bStat'));
  await page.locator('#s1 .opt', { hasText: 'About 600 ms' }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('#s1 .challenge.boxed .explain.show')].length >= 2, null, { timeout: 20000 });
  console.log('far A:', await page.textContent('#aStat'), '| B:', await page.textContent('#bStat'));
  await page.waitForFunction(() => !document.querySelector('#rcGo').disabled && !document.querySelector('#rcSeg button').disabled);
  await page.click('#rcSeg button[data-w="near"]');
  await page.click('#rcGo');
  await page.waitForSelector('#s1goals [data-g="near"].done', { timeout: 15000 });
  console.log('log:', (await page.textContent('#rcLog')).slice(-200));
  await quiz('#s1quiz', 'Chunks travel in parallel', 'Shorter round trips');
  console.log('stage1 cleared', await cleared(1), await xp());

  // ---------- Stage 2 ----------
  await page.click('#pRun');
  await page.waitForSelector('#pPredict .opt', { timeout: 10000 });
  console.log('noq stats:', await page.textContent('#pTot'), await page.textContent('#pBlk'));
  await opt('#pPredict', 'About 34 min');
  await page.waitForSelector('#pPredict .explain.show', { timeout: 10000 });
  console.log('q2 stats:', await page.textContent('#pTot'), await page.textContent('#pQ'));
  await page.click('#pLoad button[data-v="20"]');
  await page.click('#pRun'); await page.waitForFunction(() => !document.querySelector('#pRun').disabled);
  await page.click('#pMode button[data-v="noq"]');
  await page.click('#pRun'); await page.waitForFunction(() => !document.querySelector('#pRun').disabled);
  console.log('burst log:', (await page.textContent('#pLog')).slice(-260));
  await page.screenshot({ path: OUT + '/desk-s2.png', clip: await page.locator('#s2 .sim').boundingBox() });
  await quiz('#s2quiz', 'Waiting for the download module', 'More moving parts');
  console.log('stage2 cleared', await cleared(2), await xp());

  // ---------- reload mid-quest ----------
  await page.reload(); await page.waitForTimeout(500);
  console.log('after reload: banner', await page.isVisible('.banner.resume'), 'c1', await cleared(1), 'c2', await cleared(2), 'c3', await cleared(3));

  // ---------- Stage 3 ----------
  await page.click('#sqPlay');
  await page.waitForSelector('#bouncer', { state: 'visible', timeout: 10000 });
  for (let i = 0; i < 5; i++) {
    const raw = await page.textContent('#attBox .urlraw');
    const hasChg = await page.$('#attBox .urlraw .chg');
    const reject = !!hasChg || raw.includes('expires=10:12');
    await page.click(`#attBox .stamps .opt[data-v="${reject ? 'no' : 'ok'}"]`);
    await page.click('#attBox .row .btn.primary');
  }
  const TH = { 'downloads the full movie': 'DRM / AES', 'upload a file into another': 'Pre-signed URL', 'leaked clip': 'Visual watermark' };
  for (const [t, a] of Object.entries(TH)) await page.locator('#thSort .sort-item', { hasText: t }).locator('.opt', { hasText: a }).click();
  await quiz('#s3quiz', 'No: they hand out', 'Apple FairPlay, Google Widevine and Microsoft');
  console.log('stage3 cleared', await cleared(3), await xp());

  // ---------- Stage 4 ----------
  await opt('#tPredict', 'About 80% of views');
  await page.waitForSelector('#tPredict .explain.show', { timeout: 10000 });
  console.log('bill at 10%:', await page.textContent('#bTot'), await page.textContent('#bLatV'));
  await page.click('#tacs .tac[data-t="few"]');
  await page.click('#tacs .tac[data-t="reg"]');
  console.log('bill +few +reg:', await page.textContent('#bTot'), await page.textContent('#bLatV'));
  await page.waitForSelector('#s4goals [data-g="win"].done');
  await page.screenshot({ path: OUT + '/desk-s4.png', clip: await page.locator('#s4 .sim').boundingBox() });
  await quiz('#s4quiz', 'Most views hit a small set', 'Study historical viewing data');
  console.log('stage4 cleared', await cleared(4), await xp());

  // ---------- Stage 5 ----------
  const ES = { 'timed out': 'Recoverable', 'failed to transcode, once': 'Recoverable', 'malformed': 'Non-recoverable', 'Wi-Fi': 'Recoverable', 'corrupt': 'Non-recoverable', 'worker running': 'Recoverable' };
  for (const [t, a] of Object.entries(ES)) await page.locator('#errSort .sort-item', { hasText: t }).locator('.opt', { hasText: new RegExp('^\\S+ ' + a + '$') }).click();
  const FIX = ['Retry the upload a few times', 'Send the whole video; split on the server', 'Retry the transcoding task', 'Regenerate the DAG diagram', 'Reschedule the task', 'Switch over to a replica of the queue', 'Retry the task on a new worker', 'Send requests to another API server', 'Read other replicas; replace the node', 'Promote one replica to be the primary', 'Read from another replica; replace it'];
  await page.click('#pgStart');
  for (const f of FIX) {
    await page.locator('#pgOpts .opt', { hasText: f }).click();
    await page.click('#pgRow .btn.primary');
  }
  console.log('board fixed:', await page.$$eval('#board .tile.fixed', x => x.length), 'recap rows:', await page.$$eval('#recap tbody tr', x => x.length));
  await quiz('#s5quiz', 'stateless', 'Promote one of the replicas');
  console.log('stage5 cleared', await cleared(5), await xp());

  // ---------- Stage 6 ----------
  for (const a of ['chunk', 'url', 'tail', 'drm', 'retry', 'stop']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForTimeout(900);
  console.log('stage6 cleared', await cleared(6), await xp());

  // ---------- Stage 7 ----------
  await page.fill('#drill textarea', 'Chunked GOP resumable uploads near users, queues between modules, pre-signed URLs, DRM AES watermark, long tail CDN head only, retries and replica promotion.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForTimeout(1500);
  console.log('stage7 cleared', await cleared(7));
  console.log('victory shown', await page.isVisible('#victory.show'));
  console.log('store', await page.evaluate(() => localStorage.getItem('sdq:v1')));
  console.log('hearts', await page.$$eval('.hud .heart:not(.lost)', x => x.length));
  console.log('errors', errs);

  // ---------- mobile dark screenshots ----------
  const m = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const mp = await m.newPage();
  mp.on('pageerror', e => errs.push('m pageerror: ' + e.message));
  await mp.goto(FILE); await mp.waitForTimeout(400);
  await mp.locator('#rcPredict .pgroup[data-k="win"] .opt').first().click();
  await mp.locator('#rcPredict .pgroup[data-k="waste"] .opt').first().click();
  await mp.click('#rcGo'); await mp.waitForTimeout(2600);
  await mp.locator('#race').screenshot({ path: OUT + '/m-race-mid.png' });
  await mp.click('#pRun'); await mp.waitForTimeout(3000);
  await mp.click('#sqPlay'); await mp.waitForTimeout(3500);
  await mp.locator('#tPredict .opt').first().click(); await mp.waitForTimeout(1500);
  await mp.click('#pgStart'); await mp.waitForTimeout(300);
  for (const s of [1, 2, 3, 4, 5]) await mp.locator('#s' + s).screenshot({ path: `${OUT}/m-s${s}.png` });
  console.log('mobile overflow', await mp.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  console.log('errors after mobile', errs);
  await browser.close();
})();
