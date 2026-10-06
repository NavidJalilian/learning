const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0101-scale-one-box-to-load-balancer.html';
const SHOT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/0101-';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE);
  await page.waitForTimeout(300);
  const opt = async (scope, text) => { const b = page.locator(`${scope} .opt:not([disabled])`, { hasText: text }).first(); await b.waitFor({ state: 'visible', timeout: 20000 }); await b.click(); };
  const cleared = async n => { await page.waitForFunction(n => document.querySelector('#s' + n).classList.contains('cleared'), n, { timeout: 20000 }); console.log('stage', n, 'cleared'); };
  const hearts = () => page.$$eval('.hud .heart:not(.lost)', x => x.length);
  const xp = () => page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1') || '{}'));

  // ---------- Stage 1 ----------
  await page.click('#steps .opt[data-i="2"]'); // wrong first
  console.log('hearts after wrong step', await hearts(), '| hint:', await page.textContent('#tripHint'));
  await page.click('#steps .opt[data-i="1"]'); // second wrong: no extra heart
  console.log('hearts after 2nd wrong', await hearts());
  for (let i = 0; i < 4; i++) {
    await page.click(`#steps .opt[data-i="${i}"]`);
    await page.waitForFunction(n => document.querySelector('#tripCount').textContent === `${n} / 4`, i + 1, { timeout: 10000 });
  }
  await page.waitForSelector('#clientLab.on');
  await page.click('#sendBtn');
  await page.waitForSelector('#resp .browser', { timeout: 10000 });
  await page.click('#clientSeg button[data-c="mobile"]');
  await page.waitForFunction(() => !document.querySelector('#sendBtn').disabled);
  await page.click('#sendBtn');
  await page.waitForSelector('#resp pre', { timeout: 10000 });
  await page.locator('#tripSvg').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SHOT + 's1-375-dark.png' });
  await page.locator('#clientLab').screenshot({ path: SHOT + 's1-lab.png' });
  await page.locator('#steps').screenshot({ path: SHOT + 's1-steps.png' });
  await opt('#s1quiz', 'paid third-party DNS');
  await opt('#s1quiz', 'IP address');
  await opt('#s1quiz', 'JSON data over HTTP');
  await cleared(1);

  // ---------- Stage 2 ----------
  await page.locator('#splitSvg').scrollIntoViewIfNeeded();
  // real drag of the DB out of the box
  const box = await page.locator('#splitSvg .db').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, { steps: 5 });
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await page.waitForSelector('#knobs.on', { timeout: 5000 });
  await page.fill('#kWeb', '3').catch(() => {});
  await page.$eval('#kWeb', e => { e.value = 3; e.dispatchEvent(new Event('input')); });
  await page.waitForTimeout(700);
  await page.screenshot({ path: SHOT + 's2-375-dark.png' });
  const MAP = [['Bank', 'Relational'], ['session', 'NoSQL'], ['Petabytes', 'NoSQL'], ['Friends', 'NoSQL'], ['online shop', 'Relational'], ['JSON blob', 'NoSQL'], ['HR app', 'Relational']];
  let first = true;
  for (const [k, a] of MAP) {
    const item = page.locator('#dbSort .sort-item', { hasText: k });
    if (first) { // one wrong pick first, then the retry
      await item.locator('.opt', { hasText: a === 'NoSQL' ? 'Relational' : 'NoSQL' }).click();
      console.log('hearts after wrong sort', await hearts());
      first = false;
    }
    await item.locator('.opt', { hasText: a }).click();
  }
  const FAM = [['Key-value store', 'DynamoDB'], ['Graph store', 'Neo4j'], ['Column store', 'Cassandra'], ['Document store', 'CouchDB']];
  for (const [k, a] of FAM) await page.locator('#famSort .sort-item', { hasText: k }).locator('.opt', { hasText: a }).click();
  await page.locator('#famSort').screenshot({ path: SHOT + 's2-fam.png' });
  await page.locator('#dbSort .sort-item').first().screenshot({ path: SHOT + 's2-sort.png' });
  await opt('#s2quiz', 'scale separately');
  await opt('#s2quiz', 'relational (SQL)');
  await cleared(2);

  // ---------- reload mid-quest → resume ----------
  await page.waitForTimeout(800);
  await page.reload(); await page.waitForTimeout(500);
  const resume = await page.evaluate(() => ({ banner: !!document.querySelector('.banner.resume'), done: document.querySelectorAll('.hud .dot.done').length, c2: document.querySelector('#s2').classList.contains('cleared') }));
  console.log('resume', JSON.stringify(resume), 'hearts', await hearts());
  if (!resume.banner || resume.done !== 2 || !resume.c2) errs.push('resume failed');

  // ---------- Stage 4 first (any order) ----------
  await page.locator('#lbSvg').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: SHOT + 's4-375-dark.png' });
  await opt('#killBox', 'shift to server 2');
  await page.waitForSelector('#killBox .explain.show', { timeout: 20000 });
  console.log('lb stats after kill:', await page.textContent('#lbStats'));
  await page.click('#killBtn'); // revive
  await page.click('#probeBtn');
  await page.$eval('#lbTraffic', e => { e.value = 240; e.dispatchEvent(new Event('input')); });
  console.log('lb stats overloaded:', await page.textContent('#lbStats'));
  await page.click('#addSrv');
  console.log('lb stats fixed:', await page.textContent('#lbStats'));
  await page.waitForTimeout(1200);
  await page.locator('#lbSvg').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SHOT + 's4b-375-dark.png' });
  await opt('#s4quiz', 'public IP');
  await opt('#s4quiz', 'reach them directly');
  await opt('#s4quiz', 'one database server');
  await cleared(4);

  // ---------- Stage 3 ----------
  await page.locator('#upSim').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.locator('#upSim').screenshot({ path: SHOT + 's3a.png' });
  for (let i = 0; i < 4; i++) await page.click('#upBtn');
  console.log('upBtn:', await page.textContent('#upBtn'), 'disabled', await page.$eval('#upBtn', b => b.disabled));
  await opt('#plugBox', 'All of them');
  await page.waitForSelector('#plugBox .explain.show', { timeout: 20000 });
  await page.click('#addSecond');
  await page.locator('#upSim').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SHOT + 's3-375-dark.png' });
  await opt('#s3quiz', 'hardware ceiling and no failover');
  await opt('#s3quiz', 'only know server 1');
  await cleared(3);

  // ---------- Stage 5: boss ----------
  for (const a of ['split', 'up', 'out', 'out', 'nosql', 'nosql']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    await page.locator('#boss .q-arena .row .btn.primary').click();
  }
  await cleared(5);

  // ---------- Stage 6: drill (first a weak self-grade, then a retry) ----------
  const ANSWER = 'DNS gives one IP for api.mysite.com, the client sends HTTP and gets JSON or HTML. First split the database onto its own server so tiers scale separately; relational by default, NoSQL for low latency or massive data. Scaling up hits a ceiling and has no failover, so scale out behind a load balancer with a public IP and private IPs for servers; the database is then the single point of failure.';
  await page.fill('#drill textarea', ANSWER);
  await page.click('#drill .q-reveal');
  const cbs = await page.$$('#drill .selfgrade input');
  for (const cb of cbs.slice(0, 2)) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#drillAgain', { timeout: 5000 });
  console.log('drill retry offered; s6 cleared?', await page.$eval('#s6', s => s.classList.contains('cleared')));
  await page.click('#drillAgain');
  await page.fill('#drill textarea', ANSWER);
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForSelector('#victory.show', { timeout: 20000 });
  console.log('victory shown');
  const st = await xp(); console.log('saved', JSON.stringify(st.lessons['0101']), 'run left:', !!(st.runs || {})['0101']);
  await page.waitForTimeout(1500);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); console.log('overflowX', ov);
  await page.screenshot({ path: SHOT + 'full-375-dark.png', fullPage: true });

  // desktop light quick look
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const p2 = await ctx2.newPage(); await p2.goto(FILE); await p2.waitForTimeout(300);
  for (let i = 0; i < 4; i++) { await p2.click(`#steps .opt[data-i="${i}"]`); await p2.waitForFunction(n => document.querySelector('#tripCount').textContent === `${n} / 4`, i + 1); }
  await p2.locator('#tripSvg').scrollIntoViewIfNeeded(); await p2.screenshot({ path: SHOT + 's1-1280-light.png' });
  await p2.locator('#lbSvg').scrollIntoViewIfNeeded(); await p2.waitForTimeout(1500); await p2.screenshot({ path: SHOT + 's4-1280-light.png' });
  await browser.close();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
