const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const URL = 'file:///home/user/learning/lessons/1203-chat-storage-and-ids.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(URL);
  await page.waitForTimeout(300);
  const run = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('sdq:v1') || '{}'); return JSON.stringify(d.runs && d.runs['1203'] || (d.lessons && d.lessons['1203'])); });
  const quiz = async (sel, text) => { await page.waitForSelector(`${sel} .quiz:last-child .opt:has-text("${text}")`, { timeout: 8000 }); await page.click(`${sel} .quiz:last-child .opt:has-text("${text}")`); };

  // ---- stage 4 first (any order allowed)
  for (let i = 0; i < 2; i++) { await page.click('#send1'); await page.click('#send2'); }
  await page.click('#both');
  await page.click('#mergeBtn');
  console.log('merge local:', (await page.textContent('#merged .mh')).trim());
  await page.click('#idSeg button[data-m="snow"]');
  for (let i = 0; i < 2; i++) { await page.click('#send1'); await page.click('#send2'); }
  await page.click('#both');
  console.log('gen:', (await page.textContent('#gen')).replace(/\s+/g, ' ').slice(0, 160));
  await page.click('#mergeBtn');
  console.log('merge snow:', (await page.textContent('#merged .mh')).trim());
  await (await page.$('#s4 .sim')).screenshot({ path: SP + '1203-s4.png' });
  await quiz('#s4quiz', 'Unique, and sortable');
  await quiz('#s4quiz', 'No: order only matters');
  await quiz('#s4quiz', 'local per-channel');
  await page.waitForSelector('#s4.cleared', { timeout: 6000 });
  console.log('stage 4 cleared', await run());

  // ---- stage 1
  const ANS = { 'User profile': 'rdb', 'Notification settings': 'rdb', 'Friend list': 'rdb', 'Messages in a 1-on-1 chat': 'kv', 'Messages in a group chat': 'kv', 'Group member list': 'rdb', 'Last-seen timestamp': 'kv', 'Profile photo URL': 'rdb' };
  for (let i = 0; i < 8; i++) {
    const t = (await page.textContent('#deck .dcard b')).trim();
    await page.click(ANS[t] === 'kv' ? '#toKv' : '#toRdb');
  }
  console.log('bins:', (await page.textContent('#binRdb')), '|', await page.textContent('#binKv'));
  const BG = [false, false, true, true];
  for (let i = 0; i < 4; i++) await page.click(`#bingo .btile[data-i="${i}"] .opt[data-v="${BG[i] ? 1 : 0}"]`);
  await quiz('#s1quiz', 'reads match writes');
  await page.waitForSelector('#s1.cleared', { timeout: 6000 });
  console.log('stage 1 cleared', await run());

  // ---- reload mid-quest
  await page.reload(); await page.waitForTimeout(400);
  console.log('resume banner:', await page.isVisible('.banner.resume'), '| s1,s4 cleared after reload:', await page.isVisible('#s1.cleared'), await page.isVisible('#s4.cleared'), '| hearts lost:', await page.$$eval('.heart.lost', x => x.length));

  // ---- stage 2
  await page.focus('#yrs'); await page.keyboard.press('End');
  console.log('slider before predict (should clamp to 3):', await page.inputValue('#yrs'));
  await page.click('#p2 .opt:has-text("rises sharply")');
  await page.waitForSelector('#p2 .explain.show', { timeout: 8000 });
  console.log('latency after predict:', await page.textContent('#latVal'), await page.getAttribute('#meter', 'class'));
  await page.screenshot({ path: SP + '1203-s2-rdb.png' });
  await page.click('#modeSeg button[data-m="kv"]');
  await page.focus('#yrs'); await page.keyboard.press('End');
  console.log('kv latency @10:', await page.textContent('#latVal'), await page.getAttribute('#meter', 'class'));
  await (await page.$('#s2 .sim')).screenshot({ path: SP + '1203-s2.png' });
  await quiz('#s2quiz', 'Easy horizontal scaling');
  await quiz('#s2quiz', 'Cassandra');
  await page.waitForSelector('#s2.cleared', { timeout: 6000 });
  console.log('stage 2 cleared', await run());

  // ---- stage 3
  await page.click('#tray .fchip[data-f="avatar_url"]'); await page.click('#tgrid .tcard[data-t="one"]');
  console.log('distractor hint:', await page.textContent('#fb3'));
  const T = { one: ['message_id', 'message_from', 'message_to', 'content', 'created_at'], grp: ['channel_id', 'message_id', 'user_id', 'content', 'created_at'] };
  for (const [t, cols] of Object.entries(T)) for (const c of cols) { await page.click(`#tray .fchip[data-f="${c}"]`); await page.click(`#tgrid .tcard[data-t="${t}"]`); }
  console.log('keyask:', await page.textContent('#keyask'));
  await page.click('#tgrid .tcard[data-t="one"] li.keyable[data-c="message_id"]');
  await page.click('#tgrid .tcard[data-t="grp"] li.keyable[data-c="channel_id"]');
  await page.click('#tgrid .tcard[data-t="grp"] li.keyable[data-c="message_id"]');
  console.log('pk lines:', await page.$$eval('#tgrid .pkline', x => x.map(e => e.textContent)));
  await page.click('#code3 .ln[data-k="D"]');
  await page.click('#fixBtn');
  await page.waitForTimeout(700);
  console.log('feed order:', await page.$$eval('#feed3 .msg', x => x.map(e => e.dataset.id).join(',')));
  await (await page.$('#s3 .stage-b')).screenshot({ path: SP + '1203-s3.png' });
  await quiz('#s3quiz', 'Every group query');
  await page.waitForSelector('#s3.cleared', { timeout: 6000 });
  console.log('stage 3 cleared', await run());

  // ---- stage 5 boss
  for (const k of ['rdb', 'kv', 'local', 'snow', 'local', 'rdb']) {
    await page.click(`#boss .choice .opt[data-c="${k}"]`);
    await page.click('#boss .q-arena .row .btn.primary');
  }
  await page.waitForSelector('#s5.cleared', { timeout: 6000 });
  console.log('stage 5 cleared', await run());

  // ---- stage 6 drill
  await page.fill('#drill textarea', 'Profiles go in a relational database. Chat history goes in a key value store like Cassandra because of huge volume, 1:1 reads and writes, and the long tail. Group key is channel_id plus message_id, ordered by message_id not created_at, with a local per channel sequence.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 8000 });
  console.log('VICTORY:', await page.textContent('#victory h2'));
  console.log('saved lesson:', await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('sdq:v1')).lessons['1203'])));
  console.log('overflowX:', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await page.screenshot({ path: SP + '1203-full.png', fullPage: true });
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close();
})();
