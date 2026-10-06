const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0104-scale-stateless-and-data-centers.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.goto(FILE); await page.waitForTimeout(300);
  const cleared = n => page.evaluate(n => document.querySelector('#s' + n).classList.contains('cleared'), n);
  const pickText = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };
  const quizRight = async (sel) => {
    // click correct option: data-i="0" is always correct in these quizzes
    await page.waitForSelector(`${sel} .quiz:last-child .opt`);
    await page.click(`${sel} .quiz:last-child .opt[data-i="0"]`);
  };

  // ---------- Stage 1 ----------
  await page.click('#s1 .sendrow .btn[data-u="A"]');
  await page.waitForTimeout(900);
  console.log('s1 log:', (await page.textContent('#log1')).slice(-120));
  await page.click('#m1 button[data-m="sticky"]');
  await page.click('#s1 .sendrow .btn[data-u="B"]');
  await page.waitForTimeout(900);
  console.log('s1 goals done:', await page.$$eval('#g1 li.done', x => x.length));
  for (let r = 0; r < 3; r++) {
    await page.click('#p1 .opt[data-i="0"]');
    await page.waitForSelector('#p1 .explain.show', { timeout: 15000 });
    console.log('  round', r + 1, (await page.textContent('#log1')).split('\n').slice(-1)[0].slice(-140));
    await page.click('#p1 .row .btn.primary');
  }
  await quizRight('#q1'); await page.waitForTimeout(700);
  await quizRight('#q1'); await page.waitForTimeout(1500);
  console.log('stage1 cleared', await cleared(1));

  // ---------- Stage 2 ----------
  await page.click('#x2kill'); await page.waitForTimeout(2500); // sticky mode first -> warning
  await page.click('#m2 button[data-m="store"]');
  for (const id of ['#x2kill', '#x2add', '#x2busy']) {
    await page.click(id);
    await page.waitForFunction(id => document.querySelector(id).classList.contains('done'), id, { timeout: 20000 });
  }
  console.log('s2 log tail:', (await page.textContent('#log2')).slice(-200));
  // autoscale: defaults first (should fail)
  await page.click('#ascRun'); await page.waitForFunction(() => !document.querySelector('#ascRun').disabled, null, { timeout: 10000 });
  console.log('asc default:', await page.textContent('#ascStats'), '|', (await page.textContent('#ascVerdict')).slice(0, 160));
  const setR = (id, v) => page.$eval(id, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  await setR('#kMax', 16); await setR('#kUp', 75); await setR('#kDown', 40);
  await page.click('#ascRun'); await page.waitForFunction(() => !document.querySelector('#ascRun').disabled, null, { timeout: 10000 });
  console.log('asc tuned:', await page.textContent('#ascStats'), '|', (await page.textContent('#ascVerdict')).slice(0, 80));
  await quizRight('#q2'); await page.waitForTimeout(700);
  await quizRight('#q2'); await page.waitForTimeout(1500);
  console.log('stage2 cleared', await cleared(2));

  // reload mid-quest
  await page.reload(); await page.waitForTimeout(500);
  console.log('after reload: banner', await page.isVisible('.banner.resume'), 'c1', await cleared(1), 'c2', await cleared(2), 'c3', await cleared(3));

  // ---------- Stage 3 ----------
  await page.click('#map .city >> nth=0');
  await setR('#clk', 8);
  console.log('split @8:', await page.textContent('#splitV'), '| E:', await page.textContent('#dcEl'));
  await page.click('#p3 .opt[data-i="0"]');
  await page.waitForSelector('#p3 .explain.show', { timeout: 10000 });
  console.log('after outage E:', await page.textContent('#dcEl'), '| W:', await page.textContent('#dcWl'));
  let clicks = 0;
  while (!(await page.isDisabled('#capBtn')) && clicks < 6) { await page.click('#capBtn'); clicks++; }
  console.log('capacity clicks', clicks, await page.textContent('#dcEl'));
  await quizRight('#q3'); await page.waitForTimeout(700);
  await quizRight('#q3'); await page.waitForTimeout(1500);
  console.log('stage3 cleared', await cleared(3));

  // ---------- Stage 4 ----------
  const CH = ['Data synchronization', 'Test & deployment', 'Traffic redirection'];
  for (let i = 0; i < 3; i++) {
    await page.click('#play');
    await page.waitForSelector('#incQ .cls .opt', { timeout: 15000 });
    await page.locator('#incQ .cls .opt', { hasText: CH[i] }).click();
    await page.click('#fixQ .opt[data-i="0"]');
    if (i < 2) await page.click('#incNext .btn.primary');
  }
  await page.waitForTimeout(1500);
  await page.click('#lagGo');
  console.log('lag msg:', (await page.textContent('#lagMsg')).slice(0, 90));
  console.log('stage4 cleared', await cleared(4));

  // ---------- Stage 5 ----------
  for (const a of ['stateless', 'stateless', 'sticky', 'geodns', 'geodns', 'replicate', 'stateless']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForTimeout(600);
  console.log('stage5 cleared', await cleared(5));

  // ---------- Stage 6: first try with 2 checks (should not clear), then retry ----------
  const txt = 'Make the web tier stateless: move sessions out of server memory into a shared store such as Redis or NoSQL so any server can serve any request and we can autoscale. Then GeoDNS to the nearest data center, fail over everything to the healthy DC, replicate data asynchronously, and automate deploys.';
  await page.fill('#drill textarea', txt);
  await page.click('#drill .q-reveal');
  const cbs = await page.$$('#drill .selfgrade input'); await cbs[0].check(); await cbs[1].check();
  await page.click('#drill .q-finish'); await page.waitForTimeout(900);
  console.log('stage6 cleared after 2/5?', await cleared(6), 'retry shown', await page.isVisible('#drillAgain'));
  await page.click('#drillAgain');
  await page.fill('#drill textarea', txt);
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForTimeout(1800);
  console.log('stage6 cleared', await cleared(6));
  console.log('victory shown', await page.isVisible('#victory.show'));
  console.log('store', await page.evaluate(() => localStorage.getItem('sdq:v1')));
  console.log('errors', errs);

  // screenshots 375 dark
  const c2 = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const p2 = await c2.newPage();
  await p2.goto(FILE); await p2.waitForTimeout(400);
  for (const n of [1, 2, 3, 4]) {
    const el = await p2.$('#s' + n);
    await el.screenshot({ path: SP + `0104-375-dark-s${n}.png` });
  }
  await p2.screenshot({ path: SP + '0104-375-dark.png' });
  console.log('overflow', await p2.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await browser.close();
})();
