const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0904-web-crawler-downloader-and-robustness.html';
const OUT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/q0904/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.goto(FILE); await page.waitForTimeout(300);
  const cleared = n => page.evaluate(n => document.querySelector('#s' + n).classList.contains('cleared'), n);
  const opt = (scope, text) => page.locator(`${scope} .opt`, { hasText: text }).last().click();
  const xp = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs?.['0904']?.xp);

  // ---- Stage 1
  const KEY = {
    spider: { '/products/42': 'A', '/cart/checkout': 'A', '/search?q=shoes': 'A', '/private/hr': 'B', '/private/press/launch': 'A', '/blog/post-1': 'A', '/searching-tips': 'A', '/CART/x': 'A' },
    other: { '/products/42': 'A', '/cart/checkout': 'B', '/search?q=shoes': 'B', '/private/hr': 'A', '/private/press/launch': 'A', '/blog/post-1': 'A', '/searching-tips': 'B', '/CART/x': 'A' },
  };
  // first: deliberately wrong for spider (all allowed except mistake on /cart)
  for (const [bot, key] of Object.entries(KEY)) {
    await page.click(`#botSeg button[data-b="${bot}"]`);
    const cards = await page.$$('#ugrid .ucard');
    for (const c of cards) {
      const p = (await c.$eval('.path', e => e.lastChild.textContent));
      await (await c.$(`.pick button[data-v="${key[p]}"]`)).click();
    }
    await page.click('#rbCheck');
    await page.waitForTimeout(200);
    console.log(bot, 'wrong cards', await page.$$eval('#ugrid .ucard.wrong', x => x.length));
  }
  console.log('day panel visible', await page.isVisible('#dayPanel.on'));
  await page.click('#dayRun');
  await page.waitForSelector('#s1quiz .opt', { timeout: 5000 });
  console.log('counters', await page.textContent('#cPages'), await page.textContent('#cNo'), await page.textContent('#cYes'));
  await opt('#s1quiz', 'Before it starts crawling that site');
  await page.waitForTimeout(700);
  await opt('#s1quiz', 'To skip re-downloading it for every page');
  await page.waitForTimeout(1600);
  console.log('stage1 cleared', await cleared(1), 'xp', await xp());

  // ---- Stage 2
  await page.click('#deal');
  await page.waitForTimeout(2200);
  const laneHosts = await page.$$eval('#lanes .tiles', ts => ts.map(t => [...t.querySelectorAll('.ut')].map(u => u.textContent.split('/')[0])));
  const hostLane = {}; let split = false;
  laneHosts.forEach((l, i) => l.forEach(h => { if (hostLane[h] !== undefined && hostLane[h] !== i) split = true; hostLane[h] = i; }));
  console.log('lanes', JSON.stringify(laneHosts.map(l => l.length)), 'host split?', split);
  const setR = (sel, v) => page.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  await setR('#srvR', 3); await setR('#thrR', 100);
  await page.click('#saveSet'); console.log('low msg:', await page.textContent('#saveMsg'));
  await setR('#srvR', 8); await setR('#fetR', 15);
  await page.click('#saveSet'); console.log('fetch msg:', await page.textContent('#saveMsg'));
  await setR('#fetR', 10);
  await page.click('#saveSet');
  await setR('#srvR', 4); await setR('#thrR', 200);
  await page.click('#saveSet');
  console.log('found', await page.textContent('#found'));
  await page.waitForSelector('#s2quiz .opt');
  await opt('#s2quiz', 'About 1,000 pages/s');
  await page.waitForTimeout(1600);
  console.log('stage2 cleared', await cleared(2), 'xp', await xp());

  // reload mid-quest
  await page.reload(); await page.waitForTimeout(400);
  console.log('after reload: banner', await page.isVisible('.banner.resume'), 'c1', await cleared(1), 'c2', await cleared(2), 'c3', await cleared(3), 'xp', await xp());

  // ---- Stage 3
  console.log('toggle disabled before predict', await page.$eval('.tg[data-t="dns"]', e => e.disabled));
  await opt('#tlPredict', 'Timeout = 5 s');
  const ro = async () => [await page.textContent('#roTotal'), await page.textContent('#roLive'), await page.textContent('#roDns')].join(' | ');
  console.log('base', await ro());
  for (const t of ['dns', 'local', 'timeout']) {
    await page.click(`.tg[data-t="${t}"]`); await page.waitForTimeout(150);
    console.log('on', t, await ro());
  }
  await page.locator('#s3').screenshot({ path: OUT + 'd-s3.png' });
  for (let i = 0; i < 3; i++) {
    await page.waitForSelector(`#s3quiz .quiz:nth-of-type(${i + 1}) .opt`);
    const correctText = ['About 10 to 200 milliseconds', 'A synchronous lookup can block other threads', 'Give up on it and crawl other pages'][i];
    await page.locator(`#s3quiz .quiz:nth-of-type(${i + 1}) .opt`, { hasText: correctText }).click();
    await page.waitForTimeout(700);
  }
  await page.waitForTimeout(1000);
  console.log('stage3 cleared', await cleared(3), 'xp', await xp());

  // ---- Stage 4
  const ANS = { crash: 'hash', power: 'state', garbage: 'exc', longurl: 'valid' };
  // one wrong first
  await page.click('#chaosBtns .cbtn[data-k="garbage"]');
  await page.click('#chBox .opt[data-s="valid"]');
  console.log('garbage wrong -> worker state', await page.textContent('#workers'));
  for (const [k, a] of Object.entries(ANS)) {
    await page.click(`#chaosBtns .cbtn[data-k="${k}"]`);
    await page.click(`#chBox .opt[data-s="${a}"]`);
    await page.waitForFunction(() => !/Watch it play out/.test(document.querySelector('#chBox .explain').textContent), null, { timeout: 8000 });
    if (k === 'crash') { await page.click('#cmpMod'); console.log('cmp:', (await page.textContent('#cmp')).replace(/\s+/g, ' ').slice(0, 200)); }
  }
  console.log('log:', (await page.textContent('#chLog')).slice(0, 500));
  await page.waitForSelector('#s4quiz .opt');
  await opt('#s4quiz', 'About a quarter of them');
  await page.waitForTimeout(700);
  await opt('#s4quiz', 'A crash resumes from the last save');
  await page.waitForTimeout(1600);
  console.log('stage4 cleared', await cleared(4), 'xp', await xp());

  // ---- Stage 5 boss
  for (const a of ['speed', 'robots', 'robots', 'speed', 'robust', 'robust', 'speed', 'robust']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    const right = await page.$eval('#boss .explain', e => e.classList.contains('good'));
    if (!right) console.log('BOSS WRONG for', a);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForTimeout(500);
  console.log('stage5 cleared', await cleared(5));

  // ---- Stage 6 drill
  await page.fill('#drill textarea', 'First read robots.txt and cache it. Distribute over servers and threads, cache DNS (10-200 ms), locality, short timeout. Consistent hashing, checkpoints, exception handling, validation.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForTimeout(1500);
  console.log('stage6 cleared', await cleared(6));
  console.log('victory shown', await page.isVisible('#victory.show'));
  const store = await page.evaluate(() => localStorage.getItem('sdq:v1'));
  console.log('store', store);
  console.log('hearts', await page.$$eval('.hud .heart:not(.lost)', x => x.length));
  console.log('errors', errs);
  await page.screenshot({ path: OUT + 'desk-full.png', fullPage: true });

  // mobile dark
  const m = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const mp = await m.newPage();
  mp.on('pageerror', e => errs.push('m pageerror: ' + e.message));
  await mp.goto(FILE); await mp.waitForTimeout(400);
  await mp.click('#ugrid .ucard .pick button[data-v="B"]');
  await mp.locator('#tlPredict .opt').first().click();
  await mp.click('.tg[data-t="timeout"]');
  await mp.click('#deal');
  await mp.click('#chaosBtns .cbtn[data-k="crash"]');
  await mp.click('#chBox .opt[data-s="hash"]');
  await mp.waitForTimeout(2500);
  for (const n of ['s1', 's2', 's3', 's4']) await mp.locator('#' + n).screenshot({ path: OUT + `m-${n}.png` });
  await mp.screenshot({ path: OUT + 'm-top.png' });
  console.log('mobile overflow', await mp.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  // light mobile s3 too
  const l = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'light' });
  const lp = await l.newPage(); await lp.goto(FILE); await lp.waitForTimeout(300);
  await lp.locator('#s4').screenshot({ path: OUT + 'l-s4.png' });
  console.log('errors after mobile', errs);
  await browser.close();
})();
