// Playthrough for quest 1105: clears every stage via real clicks, checks resume + victory.
const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1105-news-feed-boss-design-it-live.html';
const OUT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const reduce = process.argv[2] !== 'motion';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark', reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(300);
  const T = 20000;
  const clickText = async (scope, text) => { const l = page.locator(scope).filter({ hasText: text }).first(); await l.waitFor({ timeout: T }); await l.click(); };
  const hearts = () => page.locator('.hud .heart:not(.lost)').count();
  const cleared = n => page.locator(`#s${n}.cleared`).waitFor({ timeout: T });
  const xp = () => page.locator('.q-xp').textContent();

  /* ---- stage 1 ---- */
  await page.locator('#qdeck .opt').first().waitFor({ timeout: T });
  await clickText('#qdeck .opt', 'Which cloud provider');           // waster: -2 min, no heart
  for (const q of ['Mobile app, web app', 'most important features', 'newest first, or ranked', 'How many friends', 'how many daily users', 'images and videos', 'Two-way friends', 'How fresh must']) await clickText('#qdeck .opt', q);
  await clickText('#s1lock .opt', 'The friend cap, and friends versus followers');
  await cleared(1);
  console.log('stage 1 cleared; hearts', await hearts(), 'xp', await xp(), 'clock', await page.locator('#ivClock').textContent());

  /* ---- stage 2 ---- */
  await page.locator('#toks .opt').first().waitFor({ timeout: T });
  await page.click('#toks .opt[data-t="PUT"]');                      // wrong tile: -1 min
  for (const t of ['POST', '/v1/me/feed', 'content', 'auth_token', 'GET', '/v1/me/feed', 'auth_token']) await page.click(`#toks .opt[data-t="${t}"]`);
  await page.locator('#diaWrap').waitFor({ state: 'visible', timeout: T });
  await page.locator('#pubSvg .slot').first().waitFor({ timeout: T });
  // decoy: costs a heart
  const h0 = await hearts();
  await page.click('#tray .opt[data-k="rank"]'); await page.click('#pubSvg .slot[data-k="post"]');
  if (await hearts() !== h0 - 1) throw new Error('decoy did not cost a heart');
  // misplaced row: post service into the LB slot (-1 min), then into the read diagram (-1 min)
  await page.click('#tray .opt[data-k="post"]'); await page.click('#pubSvg .slot[data-k="lb"]');
  await page.click('#rdSvg .slot[data-k="nfsvc"]');
  // snap: drop fanout onto the post slot → snaps to its own spot
  await page.click('#pubSvg .slot[data-k="post"]');                // still holding post → correct
  await page.click('#tray .opt[data-k="fanout"]'); await page.click('#pubSvg .slot[data-k="notif"]');
  for (const k of ['lb', 'web', 'notif', 'pcache', 'pdb', 'nfcache']) { await page.click(`#tray .opt[data-k="${k}"]`); await page.click(`#pubSvg .slot[data-k="${k}"]`); }
  if (await page.locator('#pubCount').textContent() !== '8 / 8') throw new Error('pub diagram incomplete: ' + await page.locator('#pubCount').textContent());
  // keyboard path for the read diagram
  for (const k of ['lb', 'web', 'nfsvc', 'nfcache']) { await page.click(`#tray .opt[data-k="${k}"]`); await page.focus(`#rdSvg .slot[data-k="${k}"]`); await page.keyboard.press('Enter'); }
  if (await page.locator('#rdCount').textContent() !== '4 / 4') throw new Error('read diagram incomplete');
  for (const t of ['Reading is safe to repeat', 'Full copies in every friend', 'So friends hear about new posts']) await clickText('#s2q .opt', t);
  await cleared(2);
  console.log('stage 2 cleared; hearts', await hearts(), 'xp', await xp(), 'clock', await page.locator('#ivClock').textContent());

  /* ---- reload mid-quest: resume ---- */
  await page.reload(); await page.waitForTimeout(500);
  const banner = await page.locator('.banner.resume').textContent().catch(() => '');
  const nCleared = await page.locator('.stage.cleared').count();
  if (!/Welcome back/.test(banner) || nCleared !== 2) throw new Error(`resume failed: banner="${banner}" cleared=${nCleared}`);
  console.log('resume ok:', banner.trim().slice(0, 80), '| hearts', await hearts(), '| clock', await page.locator('#ivClock').textContent());

  /* ---- stage 3 ---- */
  await page.locator('#fanCh .opt').first().waitFor({ timeout: T });
  await page.click('#fanCh .opt[data-c="hybrid"]');                // acceptable, no heart
  await clickText('#fanNext .btn', 'Next fact');
  await page.click('#fanCh .opt[data-c="hybrid"]'); await clickText('#fanNext .btn', 'Next fact');
  await page.click('#fanCh .opt[data-c="hybrid"]'); await clickText('#fanNext .btn', 'Where');
  await clickText('#thrQ .opt', 'Above a follower-count threshold');
  await page.locator('#pcards .opt').first().waitFor({ timeout: T });
  const h1 = await hearts();
  await page.click('#pcards .opt[data-k="2"]'); await page.click('#pipeSvg .pslot[data-k="1"]');   // wrong: heart
  if (await hearts() !== h1 - 1) throw new Error('wrong pipeline slot did not cost a heart');
  for (const k of [2, 1, 3, 4, 5]) { if (k !== 2) await page.click(`#pcards .opt[data-k="${k}"]`); await page.click(`#pipeSvg .pslot[data-k="${k}"]`); }
  await page.locator('#srcs .opt').first().waitFor({ timeout: T });
  for (const s of ['nfc', 'user', 'cdn', 'post', 'cdn', 'cnt', 'act']) await page.click(`#srcs .opt[data-s="${s}"]`);
  await cleared(3);
  console.log('stage 3 cleared; hearts', await hearts(), 'xp', await xp());

  /* ---- stage 4 ---- */
  for (let i = 0; i < 8; i++) {
    await page.locator('#barrage .opts .opt[data-i="0"]').waitFor({ timeout: T });
    await page.click('#barrage .opts .opt[data-i="0"]');
    await page.click('#barrage .q-arena .row .btn.primary');
  }
  await cleared(4);
  console.log('stage 4 cleared; hearts', await hearts(), 'xp', await xp());

  /* ---- stage 5 ---- */
  await page.locator('#wrapcards .opt').first().waitFor({ timeout: T });
  for (const t of ['Keep the web tier stateless', 'Cache as much as you can', 'Shard the databases', 'Read replicas', 'Monitor peak-hour QPS']) await clickText('#wrapcards .opt', t);
  // 5th pick is refused (max 4); remove one through the closing list, re-add another
  await page.click('#closing .rm >> nth=3');
  await clickText('#wrapcards .opt', 'Monitor peak-hour QPS');
  if (await page.locator('#deliver').isDisabled()) throw new Error('deliver not enabled with 4 picks');
  await page.click('#deliver');
  await clickText('#s5q .opt', 'QPS at peak hours');
  await cleared(5);
  console.log('stage 5 cleared; hearts', await hearts(), 'xp', await xp());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', 'Scope first: mobile and web, publish and read friends posts newest first, up to five thousand friends, ten million daily users, images and video. APIs are POST and GET on v1 me feed with an auth token. Publishing goes through web servers that rate limit, a post service, a fanout service that reads the graph DB and user cache, filters, queues jobs for workers that write post IDs into capped feed lists. Hybrid push pull for celebrities. Reading hydrates IDs from user and post caches plus counters and actions, media via CDN. Scale with sharding, replicas, stateless web tier, monitoring.');
  await page.click('#drill .q-reveal');
  const boxes = page.locator('#drill .selfgrade input');
  for (let i = 0; i < 7; i++) await boxes.nth(i).check();
  await page.click('#drill .q-finish');
  await page.locator('#victory.show').waitFor({ timeout: T });
  console.log('VICTORY shown; hearts', await hearts(), 'xp', await xp());
  const sc = await page.locator('#scorecard').innerText();
  console.log('scorecard:', sc.replace(/\s+/g, ' ').slice(0, 600));
  const store = await page.evaluate(() => ({ main: JSON.parse(localStorage.getItem('sdq:v1')).lessons['1105'], iv: Object.keys(JSON.parse(localStorage.getItem('sdq:v1:1105-interview') || '{}')) }));
  console.log('stored:', JSON.stringify(store));
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('overflowX', ov);
  await page.screenshot({ path: OUT + 'shot-1105-375-dark.png', fullPage: true });
  // review mode after reload
  await page.reload(); await page.waitForTimeout(500);
  console.log('review banner:', (await page.locator('.banner').first().textContent()).trim().slice(0, 60));
  await browser.close();
  if (errs.length) { console.log('ERRORS:\n' + errs.join('\n')); process.exit(1); }
  console.log('OK, no page errors');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
