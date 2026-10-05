const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1304-query-service.html';
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
  const tapBox = async k => page.locator(`#p1svg .pbox[data-k="${k}"]`).click();
  const waitIdle = async () => page.waitForFunction(() => !document.querySelector('#p1send').disabled || document.querySelector('#p1pred').textContent.includes('tap the boxes'), null, { timeout: 15000 });

  /* ---- stage 4 first (order-independence) ---- */
  await page.locator('#f4rules .tog[data-r="hateful"]').click();
  console.log('s4 rule goal after hateful on "how to":', await page.evaluate(() => document.querySelector('#s4goals [data-g="rule"]').classList.contains('done')));
  await page.locator('#f4rules .tog[data-r="violent"]').click();
  console.log('s4 drop count:', await page.textContent('#f4cnt'));
  for (const r of ['explicit', 'dangerous']) await page.locator(`#f4rules .tog[data-r="${r}"]`).click();
  await page.locator('#f4pfx .tog[data-p="best"]').click();
  console.log('s4 best:', await page.textContent('#f4cnt'));
  for (const w of ['filter', 'purge', 'both']) {
    await page.locator(`#w4btns .btn[data-w="${w}"]`).click();
    await page.waitForFunction(w => document.querySelector(`#w4btns .btn[data-w="${w}"]`).classList.contains('done'), w, { timeout: 8000 });
    console.log(' what-if', w, '→', await page.textContent('#w4msg'));
  }
  await page.locator('#s4 .stage-b').screenshot({ path: SP + '1304-s4.png' });
  await page.waitForSelector('#s4quiz .opt', { timeout: 5000 });
  await clickOpt('#s4quiz', 'The filter hides it now');
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  console.log('after s4', await hud());

  /* ---- stage 1 ---- */
  // run 1: warm → correct prediction
  for (const k of ['lb', 'api', 'ca']) await tapBox(k);
  console.log('pred row:', await page.textContent('#p1pred'));
  await page.click('#p1send');
  await page.waitForFunction(() => document.querySelector('#s1goals [data-g="r1"]').classList.contains('done'), null, { timeout: 15000 });
  console.log('run1 ms:', await page.textContent('#p1ms'), '| step:', await page.textContent('#p1step'), '| send disabled before restart?', await page.evaluate(() => { return document.querySelector('#p1send').disabled; }));
  // run 2: restart, predict miss path
  await page.click('#p1restart');
  for (const k of ['lb', 'api', 'ca', 'db', 'ca']) await tapBox(k);
  await page.click('#p1send');
  await page.waitForFunction(() => document.querySelector('#s1goals [data-g="r2"]').classList.contains('done'), null, { timeout: 15000 });
  console.log('run2 ms:', await page.textContent('#p1ms'));
  await page.locator('#s1 .sim').screenshot({ path: SP + '1304-s1.png' });
  // run 3: deliberately WRONG prediction (predict a miss) to check heart loss
  for (const k of ['lb', 'api', 'ca', 'db']) await tapBox(k);
  await page.click('#p1send');
  await page.waitForFunction(() => document.querySelector('#s1goals [data-g="r3"]').classList.contains('done'), null, { timeout: 15000 });
  console.log('run3 ms:', await page.textContent('#p1ms'), '| lat:', await page.textContent('#p1lat'));
  await page.waitForSelector('#s1quiz .opt', { timeout: 5000 });
  await clickOpt('#s1quiz', 'Only when the Trie Cache misses');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  console.log('after s1', await hud());

  /* ---- reload mid-quest: resume ---- */
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), s4: document.querySelector('#s4').classList.contains('cleared'), text: (document.querySelector('.banner') || {}).textContent }));
  console.log('resume:', JSON.stringify(resume), await hud());

  /* ---- stage 2 ---- */
  const inp = page.locator('#b2in');
  await inp.click();
  await page.keyboard.type('dinner', { delay: 30 });
  console.log('after first pass: server =', await page.textContent('#b2srv'));
  for (let i = 0; i < 3; i++) await page.keyboard.press('Backspace');
  await page.keyboard.type('ner', { delay: 30 });
  console.log('after second pass: server =', await page.textContent('#b2srv'), 'hits =', await page.textContent('#b2hit'));
  await page.click('#b2ff');
  await inp.click();
  await page.keyboard.press('Backspace');
  await page.keyboard.type('r');
  console.log('after ff: server =', await page.textContent('#b2srv'));
  await page.click('#b2seg button[data-v="public"]');
  console.log('public msg:', (await page.textContent('#b2pmsg')).slice(0, 60));
  await page.click('#b2seg button[data-v="private"]');
  await page.click('#b2key');
  await page.waitForTimeout(1400);
  console.log('s2 goals:', await page.evaluate(() => [...document.querySelectorAll('#s2goals li.done')].map(l => l.dataset.g).join(',')));
  await page.locator('#s2 .sim').screenshot({ path: SP + '1304-s2.png' });
  await page.waitForSelector('#s2quiz .opt', { timeout: 5000 });
  await clickOpt('#s2quiz', 'Reuse this answer for up to one hour');
  await page.waitForFunction(() => document.querySelectorAll('#s2quiz .quiz').length === 2, null, { timeout: 5000 });
  await page.locator('#s2quiz .quiz').nth(1).locator('.opt', { hasText: 'Only the user’s own browser' }).click();
  await page.waitForFunction(() => document.querySelectorAll('#s2quiz .quiz').length === 3, null, { timeout: 5000 });
  await page.locator('#s2quiz .quiz').nth(2).locator('.opt', { hasText: '0, every prefix' }).click();
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  console.log('after s2', await hud());

  /* ---- stage 3 ---- */
  for (const v of ['1', '2', '3']) {
    await page.locator('#n3').fill(v);
    await page.waitForTimeout(100);
    console.log(' N=', await page.textContent('#n3v'), await page.textContent('#n3rows'), await page.textContent('#n3gb'), '|', await page.textContent('#n3verdict'));
  }
  await page.click('#n3re');
  console.log(' log:', await page.evaluate(() => [...document.querySelectorAll('#n3log div')].slice(-2).map(d => d.textContent).join(' || ')));
  await page.locator('#s3 .sim').screenshot({ path: SP + '1304-s3.png' });
  await page.fill('#c3in', '1,000,000');
  await page.click('#c3go');
  console.log('wrong calc hearts:', (await hud()).hearts);
  await page.fill('#c3in', '10 million');
  await page.click('#c3go');
  await page.waitForSelector('#s3quiz .opt', { timeout: 5000 });
  await clickOpt('#s3quiz', 'Accurate counts for rare');
  await page.waitForSelector('#s3.cleared', { timeout: 5000 });
  console.log('after s3', await hud());

  /* ---- stage 5: boss ---- */
  const ans = ['Browser cache', 'Filter + purge', 'Warm the cache', 'Sample the logs', 'Keep it private'];
  for (let i = 0; i < ans.length; i++) {
    await page.locator('#boss .choice .opt', { hasText: ans[i] }).click();
    await page.locator('#boss .row .btn.primary').click();
  }
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  console.log('after s5', await hud());

  /* ---- stage 6: drill ---- */
  await page.fill('#drill textarea', 'AJAX request to the load balancer then an API server which reads the Trie Cache and on a miss reads the Trie DB and writes back. Browser cache private max-age 3600. Sample one in N logs. Filter layer in front of cache plus async delete from DB.');
  await page.click('#drill .q-reveal');
  const boxes = page.locator('#drill .selfgrade input');
  for (let i = 0; i < await boxes.count(); i++) await boxes.nth(i).check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 6000 });
  console.log('VICTORY', await page.textContent('#victory h2'), await hud());
  await page.waitForTimeout(800);
  await page.screenshot({ path: SP + '1304-375-dark.png', fullPage: false });
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('overflowX', ov);
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
