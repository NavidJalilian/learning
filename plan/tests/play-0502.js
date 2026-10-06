const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/0502-consistent-hashing-cracks-and-riders.html';
const DIR = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/';
const RIGHT = [
  'About 50% of the ring', 'Its partition doubles, to 50% of the ring',
  'About 1 time in 3', 'No: that key still maps to one server; cache or replicate it',
  '18', 'It drops by about 30%, from ~10% to ~7%',
  '2, 2 and 3 slots, in some order', 'More even load, but a few extra slots move when backends change',
];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push(m.text()); });
  await page.goto(FILE);
  const xp = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('sdq:v1') || '{}'); const r = (d.runs || {})['0502'] || (d.lessons || {})['0502']; return r ? r.xp : 0; });
  const hearts = () => page.$$eval('.heart.lost', x => 3 - x.length);
  const ok = async n => { await page.waitForSelector(`#s${n}.cleared`, { timeout: 40000 }); console.log('stage', n, 'cleared, xp', await xp(), 'hearts', await hearts()); };
  async function pickRight(sel) {
    await page.waitForSelector(`${sel} .opt:not([disabled])`, { timeout: 15000 });
    for (const o of await page.$$(`${sel} .opt:not([disabled])`)) { if (RIGHT.includes((await o.textContent()).trim())) { await o.click(); return; } }
    throw new Error('no right option in ' + sel);
  }
  async function clickRingAt(svgSel, deg, r = 150) {
    const box = await (await page.$(svgSel)).boundingBox();
    const a = deg * Math.PI / 180, x = 200 + r * Math.sin(a), y = 200 - r * Math.cos(a);
    await page.mouse.click(box.x + x / 400 * box.width, box.y + y / 400 * box.height);
  }

  // ---- stage 1
  await page.click('#ring1 g.srv.tap[data-sid="0"]');
  console.log('after remove:', await page.textContent('#read1'), '|', await page.textContent('#note1'));
  await page.click('#arrive1');
  console.log('s4 arrives:', await page.textContent('#read1'));
  // keyboard nudge, then drag with the mouse to the midpoint (45°)
  await page.focus('#ring1 g.srv[data-sid="4"]'); await page.keyboard.press('ArrowRight');
  console.log('after arrow:', await page.textContent('#note1'));
  const box = await (await page.$('#ring1')).boundingBox();
  const P = d => { const a = d * Math.PI / 180; return [box.x + (200 + 150 * Math.sin(a)) / 400 * box.width, box.y + (200 - 150 * Math.cos(a)) / 400 * box.height]; };
  await page.mouse.move(...P(185)); await page.mouse.down();
  for (const d of [150, 110, 80, 60, 45]) await page.mouse.move(...P(d), { steps: 3 });
  await page.mouse.up();
  console.log('after drag:', await page.textContent('#read1'));
  await page.click('#mode1 button[data-m="hash"]');
  for (let i = 0; i < 3; i++) { await page.click('#name1'); console.log('  hash:', await page.textContent('#note1')); }
  await pickRight('#pred1');
  await page.waitForSelector('#pred1 .explain.show', { timeout: 10000 });
  console.log('MC N=4:', await page.textContent('#t1sim'), 'formula', await page.textContent('#t1form'));
  await page.click('#nseg1 button[data-n="100"]');
  await page.click('#roll1');
  await page.waitForFunction(() => document.querySelector('#t1n').textContent === '1,000' && !document.querySelector('#roll1').disabled, null, { timeout: 10000 });
  console.log('MC N=100:', await page.textContent('#t1sim'), 'formula', await page.textContent('#t1form'), 'ratio', await page.textContent('#t1ratio'));
  await pickRight('#s1quiz');
  await ok(1);

  // ---- stage 2
  await pickRight('#pred2');
  await page.waitForSelector('#pred2 .explain.show', { timeout: 10000 });
  console.log('tally:', await page.textContent('#tally2'));
  await page.click('#kseg2 button[data-k="4000"]'); await page.click('#throw2');
  console.log('4000 keys:', await page.textContent('#read2'));
  await page.click('#cVN'); console.log('  VN:', await page.textContent('#read2c'));
  await page.click('#cAdd'); console.log('  add:', await page.textContent('#read2c'));
  await page.click('#cRep'); console.log('  rep:', await page.textContent('#read2c'));
  await pickRight('#s2quiz');
  await ok(2);

  // ---- reload mid-quest
  await page.reload(); await page.waitForTimeout(500);
  console.log('resume banner:', !!(await page.$('.banner.resume')), 'cleared:', await page.$$eval('.stage.cleared', x => x.map(s => s.id)), 'xp', await xp(), 'hearts', await hearts());

  // ---- stage 3 (one wrong on purpose)
  await page.fill('#c1 input', '50'); await page.click('#c1 .row .btn');
  console.log('c1 wrong:', await page.textContent('#c1 > .fb'), 'hearts', await hearts());
  await page.fill('#c1 input', '25'); await page.click('#c1 .row .btn');
  await page.fill('#c2 input', '400'); await page.press('#c2 input', 'Enter');
  await page.fill('#c3 input', '200,000'); await page.click('#c3 .row .btn');
  await pickRight('#c3 .follow');
  await page.$eval('#v3', el => { el.value = 300; el.dispatchEvent(new Event('input')); });
  await page.click('#park3'); console.log('park at max:', await page.textContent('#park3msg'));
  await page.$eval('#v3', el => { el.value = 230; el.dispatchEvent(new Event('input')); });
  await page.click('#park3'); console.log('park at 230:', await page.textContent('#park3msg'), '|', await page.textContent('#info3'));
  await pickRight('#s3quiz');
  await ok(3);

  // ---- stage 4
  await page.click('.sys[data-k="mag"]'); await page.click('.mcard[data-k="aka"]');
  console.log('wrong pair:', await page.textContent('#mnote4'), 'hearts', await hearts());
  for (const k of ['dyn', 'cas', 'dis', 'aka', 'mag']) { await page.click(`.sys[data-k="${k}"]`); await page.click(`.mcard[data-k="${k}"]`); }
  await pickRight('#mpred4');
  for (let i = 0; i < 3; i++) await page.click('#mnext4');
  await page.click('#mfill4');
  await page.waitForSelector('#mkill4:visible', { timeout: 10000 });
  console.log('table:', await page.$$eval('#slots4 .slot', x => x.map(b => b.textContent.trim()).join(' ')));
  console.log('pred explain:', (await page.textContent('#mpred4 .explain')).slice(0, 60));
  await page.click('#mkill4');
  console.log('rebuilt:', await page.$$eval('#slots4 .slot', x => x.map(b => b.textContent.trim()).join(' | ')));
  await page.click('#slots4 .slot[data-s="1"]');
  await page.click('#slots4 .slot[data-s="6"]');
  console.log('log tail:', await page.$eval('#mlog4', l => l.lastElementChild.textContent));
  await pickRight('#s4quiz');
  await ok(4);

  // ---- stage 5
  const BOSS = { 'One node holds 31%': 'vn', 'The leaderboard melts': 'hot', 'Six nodes, slightly different': 'ok', 'Shard 9 logs everyone out': 'ring', 'Tiny test cluster': 'ok', 'The big disk sits idle': 'vn', 'Domino crash': 'vn' };
  for (let i = 0; i < 7; i++) {
    const t = (await page.textContent('#boss .scenario h3')).trim();
    if (!BOSS[t]) throw new Error('unknown scenario ' + t);
    await page.click(`#boss .choice .opt[data-c="${BOSS[t]}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await ok(5);

  // ---- stage 6
  await page.fill('#drill textarea', 'The basic ring has uneven arcs and keys can bunch up; virtual nodes fix arcs at the cost of metadata, but one hot key still needs caching. Dynamo and Cassandra use rings.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await ok(6);
  await page.waitForSelector('#victory.show', { timeout: 5000 });
  console.log('VICTORY:', (await page.textContent('#victory h2')).trim(), '| xp', await page.textContent('#victory .vstats b'), '| hearts', await hearts());
  console.log('errors:', errs.length ? errs : 'none');
  await ctx.close();

  // ---- screenshots at 375 dark
  const c2 = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const p2 = await c2.newPage();
  await p2.goto(FILE); await p2.waitForTimeout(300);
  await p2.click('#ring1 g.srv.tap[data-sid="1"]'); await p2.click('#arrive1');
  await (await p2.$('#s1')).screenshot({ path: DIR + '0502-375-dark-s1.png' });
  await p2.click('#pred2 .opt'); await p2.waitForSelector('#pred2 .explain.show', { timeout: 10000 });
  await p2.click('#kseg2 button[data-k="400"]'); await p2.click('#throw2'); await p2.click('#cVN');
  await p2.waitForTimeout(900);
  await (await p2.$('#s2')).screenshot({ path: DIR + '0502-375-dark-s2.png' });
  await p2.$eval('#v3', el => { el.value = 230; el.dispatchEvent(new Event('input')); });
  await (await p2.$('#s3')).screenshot({ path: DIR + '0502-375-dark-s3.png' });
  await p2.click('#mpred4 .opt'); await p2.click('#mfill4'); await p2.waitForSelector('#mkill4:visible'); await p2.click('#mkill4');
  await (await p2.$('#s4 .mag')).screenshot({ path: DIR + '0502-375-dark-s4.png' });
  await (await p2.$('#s5')).screenshot({ path: DIR + '0502-375-dark-s5.png' });
  console.log('overflowX 375:', await p2.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await c2.close();
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
