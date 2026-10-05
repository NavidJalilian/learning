const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1505-drive-storage-and-failures.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.goto(FILE); await page.waitForTimeout(300);
  const cleared = async n => page.evaluate(n => document.querySelector('#s' + n).classList.contains('cleared'), n);
  const optByText = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };

  // Stage 1
  for (const [f, v] of [['deck', '20 MB stored'], ['copy', '20 MB stored'], ['v2', '24 MB stored'], ['photo', '36 MB stored']]) {
    await page.click(`#ddFiles .file[data-f="${f}"]`);
    await page.locator('#ddPredict .opt', { hasText: new RegExp('^' + v + '$') }).click();
    await page.waitForSelector('#ddPredict .explain.show');
    await page.waitForTimeout(200);
  }
  console.log('stage1 stored:', await page.textContent('#mSto'), 'logical:', await page.textContent('#mLog'));
  await page.waitForSelector('#s1quiz .opt');
  await optByText('#s1quiz', 'same hash value');
  await page.waitForTimeout(1200);
  console.log('stage1 cleared', await cleared(1));

  // Stage 2
  await optByText('#vpPredict', 'About 3 hours back');
  await page.$eval('#capR', e => { e.value = 7; e.dispatchEvent(new Event('input', { bubbles: true })); });
  console.log('verdict after cap only:', await page.textContent('#verdict'));
  await page.click('#thinSeg button[data-v="1"]');
  await page.$eval('#coldR', e => { e.value = 4; e.dispatchEvent(new Event('input', { bubbles: true })); });
  console.log('bill:', await page.textContent('#billV'), '|', await page.textContent('#verdict'));
  await page.waitForSelector('#s2quiz .opt');
  await optByText('#s2quiz', 'Restoring it first');
  await page.waitForTimeout(1200);
  console.log('stage2 cleared', await cleared(2));

  // reload mid-quest
  await page.reload(); await page.waitForTimeout(400);
  console.log('after reload: banner', await page.isVisible('.banner.resume'), 'cleared1', await cleared(1), 'cleared2', await cleared(2), 'cleared3', await cleared(3));

  // Stage 3
  for (const k of ['lb', 'block', 's3', 'api', 'cache', 'db', 'notif', 'queue']) {
    await page.click(`#kills .kbtn[data-k="${k}"]`);
    await page.click('#chBox .opt[data-i="0"]');
    await page.waitForSelector('#chBox .explain.show', { timeout: 10000 });
  }
  console.log('killed', await page.textContent('#killN'), 'storm visible', await page.isVisible('#storm'));
  await page.click('#stRun');
  await page.waitForFunction(() => !document.querySelector('#stRun').disabled, null, { timeout: 30000 });
  await page.click('#stMode button[data-m="jitter"]');
  await page.click('#stRun');
  await page.waitForFunction(() => !document.querySelector('#stRun').disabled, null, { timeout: 30000 });
  console.log('storm log:', (await page.textContent('#stLog')).slice(0, 600));
  await page.waitForSelector('#s3quiz .opt');
  await optByText('#s3quiz', '1M open connections');
  await page.waitForTimeout(1200);
  console.log('stage3 cleared', await cleared(3));

  // Stage 4 boss
  for (const a of ['dedup', 'cap', 'promote', 'region', 'reconnect']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForTimeout(500);
  console.log('stage4 cleared', await cleared(4));

  // Stage 5 drill
  await page.fill('#drill textarea', 'Dedup blocks by hash, cap versions and keep valuable ones, cold storage for old data, replicate S3 across regions, promote a DB replica, notification clients reconnect slowly.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForTimeout(1500);
  console.log('stage5 cleared', await cleared(5));
  console.log('victory shown', await page.isVisible('#victory.show'));
  const store = await page.evaluate(() => localStorage.getItem('sdq:v1'));
  console.log('store', store);
  console.log('hearts', await page.$$eval('.hud .heart:not(.lost)', x => x.length));
  console.log('errors', errs);
  await page.screenshot({ path: 'q1505/desk-full.png', fullPage: true });

  // mobile dark screenshots
  const m = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const mp = await m.newPage();
  mp.on('pageerror', e => errs.push('m pageerror: ' + e.message));
  await mp.goto(FILE); await mp.waitForTimeout(400);
  await mp.click('#ddFiles .file[data-f="v2"]');
  await mp.locator('#ddPredict .opt').first().click();
  await mp.waitForTimeout(2000);
  await mp.click('#kills .kbtn[data-k="db"]');
  await mp.click('#chBox .opt[data-i="1"]');
  await mp.waitForTimeout(3500);
  await mp.click('#kills .kbtn[data-k="notif"]');
  await mp.click('#chBox .opt[data-i="0"]');
  await mp.waitForTimeout(1500);
  await mp.click('#stRun');
  await mp.waitForTimeout(3000);
  for (const [n, sel] of [['s1', '#s1'], ['s2', '#s2'], ['s3', '#s3'], ['storm', '#storm']]) {
    await mp.locator(sel).screenshot({ path: `q1505/m-${n}.png` });
  }
  console.log('mobile overflow', await mp.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  console.log('errors after mobile', errs);
  await browser.close();
})();
