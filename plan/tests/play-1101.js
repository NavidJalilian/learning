const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1101-news-feed-scope-and-flows.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
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
  const btn = (scope, text) => page.locator(scope).locator('button', { hasText: text }).first();
  const click = async (scope, text) => { const b = btn(scope, text); await b.waitFor({ state: 'visible', timeout: 20000 }); await b.click(); };
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const xp = () => page.evaluate(() => document.querySelector('.q-xp').textContent);
  const waitCleared = async n => { await page.waitForFunction(n => document.querySelector('#s' + n).classList.contains('cleared'), n, { timeout: 30000 }); if (n === 2) console.log('chips now', await page.locator('#need .chip').count()); console.log('stage', n, 'cleared · hearts', await hearts(), '·', await xp()); };

  /* stage 1 */
  const GOOD = ['Mobile, web', 'must-have', 'Newest first, or ranked', 'How many friends', 'How much traffic', 'Text only'];
  await page.click('#clockGo');
  let wasted = false;
  for (let k = 0; k < 20; k++) {
    const lit = await page.locator('#board .tile.on').count();
    if (lit === 6) break;
    const texts = await page.locator('#hand .opt').allTextContents();
    let idx = texts.findIndex(t => GOOD.some(g => t.includes(g)));
    if (!wasted) { const w = texts.findIndex(t => !GOOD.some(g => t.includes(g))); if (w >= 0) { idx = w; wasted = true; } }
    await page.locator('#hand .opt').nth(idx).click();
  }
  console.log('clock after round:', await page.textContent('#clock'), '| hint:', (await page.textContent('#s1hint')).slice(0, 60));
  const CMAP = { plat: 'One HTTP API', feat: 'Two flows', order: 'No ranking', friends: 'Caps how many', dau: 'Sizes the caches', media: 'CDN' };
  // one deliberate wrong match
  await page.click('#board .tile[data-k="plat"]'); await click('#conseq', 'CDN');
  for (const [k, t] of Object.entries(CMAP)) { await page.click(`#board .tile[data-k="${k}"]`); await click('#conseq', t); }
  await click('#s1quiz', 'Feed order is newest first');
  await click('#s1quiz', 'The 5,000-friend cap');
  await waitCleared(1);

  /* stage 2 */
  await page.click('#plist .post[data-id="kai"]'); // wrong on purpose (free)
  await click('#ordBox', 'Next prediction');
  await page.click('#peek');
  await page.click('#plist .post[data-id="ana"]');
  const order = await page.evaluate(() => [...document.querySelectorAll('#plist .post')].map(p => p.dataset.id).join(','));
  console.log('ranked order:', order, '| need chips:', await page.locator('#need .chip').count());
  await click('#s2quiz', 'It keeps the core design simple');
  await click('#s2quiz', 'It stays; ranking adds');
  await waitCleared(2);

  /* reload mid-quest */
  await page.reload();
  await page.waitForSelector('.banner.resume');
  console.log('after reload:', (await page.textContent('.banner.resume')).trim().slice(0, 70), '| hearts', await hearts(), '|', await xp());

  /* stage 3 */
  const tok = t => page.locator(`#toks .opt[data-t="${t}"]`).click();
  await tok('content'); console.log('soft hint:', (await page.textContent('#apiHint')).slice(0, 50), '| hearts', await hearts());
  await tok('GET'); console.log('wrong verb hint:', (await page.textContent('#apiHint')).slice(0, 50), '| hearts', await hearts());
  for (const t of ['POST', '/v1/me/feed', 'auth_token', 'content', 'GET', '/v1/me/feed', 'auth_token']) await tok(t);
  console.log('api states:', await page.textContent('#l1state'), '|', await page.textContent('#l2state'));
  const BAD = [0, 1, 3];
  for (let i = 0; i < 3; i++) await page.click(`#bugs .bug[data-i="${i}"] .opt[data-j="${BAD[i]}"]`);
  await click('#s3quiz', 'The caller, found from the auth token');
  await waitCleared(3);

  /* stage 4 */
  await page.click('#tray .opt[data-k="rank"]'); await page.click('#pubSvg .slot[data-k="lb"]');
  console.log('decoy hint:', (await page.textContent('#trayHint')).slice(0, 50), '| hearts', await hearts());
  // drop fanout onto the post slot (same row) to test snapping
  await page.click('#tray .opt[data-k="fanout"]'); await page.click('#pubSvg .slot[data-k="post"]');
  for (const k of ['dns', 'lb', 'web', 'post', 'notif', 'nfcache', 'pdb', 'pcache']) { await page.click(`#tray .opt[data-k="${k}"]`); await page.click(`#pubSvg .slot[data-k="${k}"]`); }
  console.log('placed:', await page.textContent('#placed'));
  await page.screenshot({ path: SP + '1101-s4-built.png', fullPage: false });
  await page.click('#pubGo');
  await page.waitForSelector('#jobBox .sort-item', { state: 'visible', timeout: 20000 });
  const JA = ['post', 'fanout', 'notif'];
  for (let i = 0; i < 3; i++) await page.click(`#jobs .sort-item[data-i="${i}"] .opt[data-k="${JA[i]}"]`);
  await click('#s4quiz', 'The fanout service');
  await click('#s4quiz', 'Post DB, via the post service');
  await waitCleared(4);
  console.log('pub log tail:', (await page.locator('#pubLog div').last().textContent()).slice(0, 70));
  await page.locator('#pubDia').screenshot({ path: SP + '1101-s4-375-dark.png' });

  /* stage 5 */
  await click('#readBox', 'Zero: one cache lookup');
  await click('#readBox', 'One more question');
  await click('#cliffBox', 'The fanout service, when each');
  await click('#s5quiz', 'A list of post IDs');
  await waitCleared(5);
  console.log('read counter:', await page.textContent('#readCount'));
  await page.locator('#readDia').screenshot({ path: SP + '1101-s5-375-dark.png' });

  /* stage 6 */
  for (const a of ['post', 'fanout', 'notif', 'nfsvc', 'post', 'fanout']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    await page.locator('#boss .q-arena .row .btn.primary').click();
  }
  await waitCleared(6);

  /* stage 7 */
  await page.fill('#drill textarea', 'Two endpoints POST and GET on /v1/me/feed with an auth token, then publishing via post fanout notification services and reading via the news feed service from the cache of post IDs.');
  await page.click('#drill .q-reveal');
  for (const c of await page.locator('#drill .selfgrade input').all()) await c.check();
  await page.click('#drill .q-finish');
  await waitCleared(7);

  await page.waitForSelector('#victory.show', { timeout: 10000 });
  console.log('VICTORY:', (await page.textContent('#victory h2')).trim(), '| stats', (await page.textContent('#victory .vstats')).replace(/\s+/g, ' '));
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('overflowX', ov);
  await page.screenshot({ path: SP + '1101-375-dark.png', fullPage: true });
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
