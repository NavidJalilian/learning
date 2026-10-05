const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1206-chat-boss-design-it-live.html';
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(300);
  const log = (...a) => console.log(...a);
  const hearts = () => page.evaluate(() => document.querySelectorAll('.hud .heart:not(.lost)').length);
  const xp = () => page.evaluate(() => (JSON.parse(localStorage.getItem('sdq:v1') || '{}').runs || {})['1206']);
  const clickOpt = async (scope, text) => { await page.locator(`${scope} .opt`, { hasText: text }).first().click(); };

  /* ---- stage 3 first (any order) ---- */
  await page.click('#mleft .opt[data-k="lat"]'); await page.click('#mright .opt[data-k="ord"]'); // wrong pair
  for (const k of ['lat', 'pick', 'off', 'dev', 'grp', 'pres', 'fan', 'big', 'ord']) { await page.click(`#mleft .opt[data-k="${k}"]`); await page.click(`#mright .opt[data-k="${k}"]`); }
  log('match lines:', await page.evaluate(() => document.querySelectorAll('#mlines path').length));
  await page.locator('#s3pred .opt').first().waitFor({ timeout: 8000 });
  await clickOpt('#s3pred', 'Notification servers send a push');
  await page.waitForSelector('#s3.cleared', { timeout: 15000 });
  log('flow log:', (await page.textContent('#flowLog')).slice(0, 80));
  await page.click('#bobSeg button[data-b="on"]'); await page.click('#playFlow');
  await page.waitForFunction(() => /5a/.test(document.querySelector('#flowLog').textContent) && !document.querySelector('#playFlow').disabled, null, { timeout: 15000 });
  log('stage 3 cleared', JSON.stringify(await xp()), 'hearts', await hearts());

  /* ---- stage 1 ---- */
  await page.locator('#s1open .opt').first().waitFor();
  await clickOpt('#s1open', 'Ask questions');
  await page.locator('#qdeck .opt').first().waitFor({ timeout: 5000 });
  await page.locator('#qdeck .opt', { hasText: 'Kubernetes' }).click(); // waste
  for (const q of ['1-on-1 chat, group', 'Mobile app', 'What scale', 'limit on group size', 'Which features', 'Message size limit', 'end-to-end']) {
    await page.locator('#qdeck .opt', { hasText: q }).click(); await page.waitForTimeout(100);
  }
  log('reqs lit:', await page.evaluate(() => document.querySelectorAll('#reqs .req.got').length));
  await page.locator('#s1lock .opt').first().waitFor({ timeout: 8000 });
  await clickOpt('#s1lock', 'Low-latency');
  await page.waitForSelector('#s1.cleared', { timeout: 5000 });
  log('stage 1 cleared', JSON.stringify(await xp()), 'clock', await page.textContent('#ivClock'));

  /* ---- stage 2 ---- */
  await page.click('#tiles .opt[data-k="mono"]');
  for (const k of ['lb', 'api', 'sd', 'chat', 'pres', 'kv', 'notif']) await page.click(`#tiles .opt[data-k="${k}"]`);
  await page.locator('#s2links .lrow').first().waitFor({ timeout: 8000 });
  await page.click('#s2links .lrow[data-k="lb"] .opt[data-l="ws"]'); // wrong
  await page.click('#s2links .lrow[data-k="chat"] .opt[data-l="ws"]');
  await page.click('#s2links .lrow[data-k="pres"] .opt[data-l="ws"]');
  log('arch status:', await page.textContent('#archStatus'));
  for (const [sel, t] of [['#s2q1', 'Polls can land'], ['#s2q2', 'scales out easily'], ['#s2q3', 'Sort by message_id']]) {
    await page.locator(`${sel} .opt`).first().waitFor({ timeout: 8000 }); await clickOpt(sel, t);
  }
  await page.waitForSelector('#s2.cleared', { timeout: 5000 });
  log('stage 2 cleared', JSON.stringify(await xp()), 'hearts', await hearts());
  await page.locator('#arch').scrollIntoViewIfNeeded();
  await page.locator('#s2 .sim').screenshot({ path: SP + '1206-arch-375-dark.png' });

  /* ---- reload mid-quest ---- */
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), s1: document.querySelector('#s1').classList.contains('cleared'), s2: document.querySelector('#s2').classList.contains('cleared'), s3: document.querySelector('#s3').classList.contains('cleared'), clock: document.querySelector('#ivClock').textContent }));
  log('after reload:', JSON.stringify(resume), 'hearts', await hearts());
  if (!resume.banner || !resume.s1 || !resume.s2 || !resume.s3) errs.push('resume failed');

  /* ---- stage 4 ---- */
  const RIGHT = ['service discovery, then sync', 'only after 30 s', 'Saved in the KV store', 'Stop per-member inbox', 'Client-made message ID', 'per-channel message_id, never', 'above its cur_max_message_id'];
  for (let i = 0; i < 7; i++) {
    const texts = await page.locator('#barrage .opts .opt').allTextContents();
    const t = i === 1 ? texts.find(x => x.includes('Yes, at once')) : texts.find(x => RIGHT.some(r => x.includes(r)));
    if (!t) { errs.push('no right option at curveball ' + i + ': ' + texts.join(' | ')); break; }
    await clickOpt('#barrage .opts', t);
    await page.click('#barrage .q-arena .btn.primary');
  }
  await page.waitForSelector('#s4.cleared', { timeout: 5000 });
  log('stage 4 cleared', JSON.stringify(await xp()), 'hearts', await hearts());

  /* ---- stage 5 ---- */
  await page.locator('#wrapcards .opt').first().waitFor();
  await clickOpt('#wrapcards', 'Rust');
  for (const t of ['Media files', 'End-to-end', 'Cache messages', 'Edge cache', 'Error handling']) await clickOpt('#wrapcards', t);
  await page.locator('#s5q .opt').first().waitFor({ timeout: 8000 });
  await clickOpt('#s5q', 'Server-side search');
  await page.waitForSelector('#s5.cleared', { timeout: 5000 });
  log('stage 5 cleared', JSON.stringify(await xp()), 'hearts', await hearts());

  /* ---- stage 6 ---- */
  await page.fill('#drill textarea', Array.from({ length: 60 }, (_, i) => 'word' + i).join(' '));
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 6000 });
  const end = await page.evaluate(() => ({ lesson: JSON.parse(localStorage.getItem('sdq:v1')).lessons['1206'], iv: Object.keys(JSON.parse(localStorage.getItem('sdq:v1:1206-interview') || '{}')), stats: document.querySelector('.sc-stats') && document.querySelector('.sc-stats').textContent.replace(/\s+/g, ' '), score: document.querySelector('.sc-overall') && document.querySelector('.sc-overall').textContent.replace(/\s+/g, ' '), overflow: document.documentElement.scrollWidth - innerWidth }));
  log('VICTORY', JSON.stringify(end));
  await page.screenshot({ path: SP + '1206-375-dark.png', fullPage: true });
  await page.locator('#s3 .stage-b').screenshot({ path: SP + '1206-s3-375-dark.png' });
  await page.locator('#s6 .stage-b').screenshot({ path: SP + '1206-s6-375-dark.png' });

  /* ---- review mode reload ---- */
  await page.reload(); await page.waitForTimeout(500);
  log('review banner:', await page.evaluate(() => !!document.querySelector('.banner') && !document.querySelector('.banner.resume')), 'victory shown:', await page.evaluate(() => document.querySelector('#victory').classList.contains('show')));

  /* light mode desktop shots */
  const c2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const p2 = await c2.newPage(); p2.on('pageerror', e => errs.push('pageerror(light): ' + e.message));
  await p2.goto(FILE); await p2.waitForTimeout(300);
  for (const k of ['lb', 'api', 'sd', 'chat', 'pres', 'kv', 'notif']) await p2.click(`#tiles .opt[data-k="${k}"]`);
  await p2.locator('#s2links .lrow').first().waitFor({ timeout: 8000 });
  await p2.click('#s2links .lrow[data-k="lb"] .opt[data-l="http"]');
  await p2.locator('#s2 .sim').screenshot({ path: SP + '1206-arch-1280-light.png' });

  log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close();
})();
