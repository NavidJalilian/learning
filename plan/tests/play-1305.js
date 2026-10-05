const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1305-scaling-autocomplete.html';
const OUT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/q1305';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(300);
  const cleared = n => page.evaluate(n => document.querySelector('#s' + n).classList.contains('cleared'), n);
  const hearts = () => page.$$eval('.hud .heart:not(.lost)', x => x.length);
  const opt = async (scope, text) => { await page.waitForSelector(`${scope} .opt`); await page.locator(`${scope} .opt:not([disabled])`, { hasText: text }).first().click(); };

  // ---------- Stage 1 ----------
  await page.click('#nSeg button[data-n="2"]');
  await page.click('#nSeg button[data-n="3"]');
  console.log('s1 msg after 3:', await page.textContent('#s1msg'));
  await page.click('#nSeg button[data-n="26"]');
  await page.click('#lgrid .lbtn[data-l="s"]');
  console.log('s1 hot:', await page.textContent('#s1msg'));
  await page.click('#nSeg button[data-n="30"]');
  for (const l of ['s', 'c', 'p', 'm']) { await page.click(`#lgrid .lbtn[data-l="${l}"]`); console.log('  spare', l, '→', await page.textContent('#s1msg')); }
  console.log('s1 hottest:', await page.textContent('#hotVal'));
  await opt('#s1quiz', '26, one for each letter');
  await opt('#s1quiz', 'Shard on the 2nd');
  await opt('#s1quiz', 'Some letters start');
  await page.waitForTimeout(1000);
  console.log('stage1 cleared', await cleared(1), 'hearts', await hearts());

  // ---------- Stage 2 ----------
  for (const l of ['u', 'v', 'w', 'x', 'y', 'z']) await page.click(`#chips .lchip[data-l="${l}"]`);
  console.log('s2 scale:', await page.textContent('#scaleMsg'));
  // LPT target assignment
  const F = await page.evaluate(() => ({ a: 55, b: 56, c: 90, d: 54, e: 41, f: 40, g: 33, h: 35, i: 37, j: 8, k: 10, l: 30, m: 58, n: 22, o: 25, p: 75, q: 5, r: 56, s: 110, t: 50, u: 30, v: 20, w: 49, x: 2, y: 6, z: 3 }));
  const loads = [0, 0, 0, 0], target = {};
  Object.keys(F).sort((a, b) => F[b] - F[a]).forEach(l => { const k = loads.indexOf(Math.min(...loads)); target[l] = k; loads[k] += F[l]; });
  console.log('LPT loads', loads);
  let moves = 0;
  for (const l of Object.keys(target)) {
    if (await page.isVisible('#mapWrap')) break;
    const cur = await page.$eval(`#bins .tilebtn[data-l="${l}"]`, t => +t.closest('.bin').dataset.k);
    if (cur === target[l]) continue;
    await page.click(`#bins .tilebtn[data-l="${l}"]`);
    await page.click(`#bins .bin[data-k="${target[l]}"]`);
    moves++;
  }
  console.log('moves', moves, 'max load', await page.textContent('#maxLoad'), 'map visible', await page.isVisible('#mapWrap'));
  console.log('map:', (await page.textContent('#mapTable')).replace(/\s+/g, ' '));
  for (const q of ['sun', 'xylophone', 'cat']) {
    const k = await page.$eval(`#bins .tilebtn[data-l="${q[0]}"]`, t => +t.closest('.bin').dataset.k);
    await page.click(`#lkBox .shardpick .opt[data-k="${k}"]`);
    await page.waitForSelector('#lkBox .explain.show', { timeout: 10000 });
    await page.click('#lkBox .row .btn.primary');
  }
  await page.waitForTimeout(1000);
  console.log('stage2 cleared', await cleared(2), 'hearts', await hearts());

  // ---------- reload mid-quest ----------
  await page.reload(); await page.waitForTimeout(500);
  console.log('after reload: resume banner', await page.isVisible('.banner.resume'), 'c1', await cleared(1), 'c2', await cleared(2), 'c3', await cleared(3));

  // ---------- Stage 3 ----------
  await page.click('#insCafe');
  console.log('s3 node err:', await page.textContent('#n-caf .overflow'));
  await page.click('#modeSeg button[data-m="map"]');
  await page.click('#insCafe'); await page.click('#insKana');
  const ANS = { kana: 'Unicode trie nodes', Brazil: 'Per-country tries on CDNs', India: 'Per-country tries on CDNs', 'slot for': 'Unicode trie nodes', recieve: 'Neither: out of scope', German: 'Unicode trie nodes' };
  for (const [frag, a] of Object.entries(ANS)) {
    const item = page.locator('#sort3 .sort-item', { hasText: frag });
    await item.locator('.opt', { hasText: a }).click();
  }
  await opt('#s3quiz', 'Serve it from near');
  await page.waitForTimeout(1000);
  console.log('stage3 cleared', await cleared(3), 'hearts', await hearts());

  // ---------- Stage 4 ----------
  await opt('#trPredict', 'A streaming pipeline');
  await page.click('#trRun');
  await page.waitForFunction(() => !document.querySelector('#trRun').disabled, null, { timeout: 15000 });
  console.log('s4 after run, top of dropdown:', await page.textContent('#dropList li'), '| eta', await page.textContent('#trEta'));
  const lever = async l => { await page.click(`#levers .lever[data-l="${l}"]`); return (await page.textContent('#trEta')) + ' / first: ' + (await page.textContent('#dropList li')); };
  console.log('  shard on', await lever('shard')); console.log('  shard off', await lever('shard'));
  console.log('  recent on', await lever('recent')); console.log('  recent off', await lever('recent'));
  console.log('  stream on', await lever('stream')); console.log('  +recent', await lever('recent'));
  await opt('#s4quiz', 'Workers aren');
  await page.waitForTimeout(1000);
  console.log('stage4 cleared', await cleared(4), 'hearts', await hearts());
  await page.locator('#s4').screenshot({ path: OUT + '/desk-s4.png' });

  // ---------- Stage 5 boss ----------
  for (const a of ['map', 'deep', 'uni', 'cdn', 'stream', 'trade']) {
    await page.click(`#boss .choice .opt[data-c="${a}"]`);
    await page.click('#boss .row .btn.primary');
  }
  await page.waitForTimeout(500);
  console.log('stage5 cleared', await cleared(5), 'hearts', await hearts());

  // ---------- Stage 6 drill ----------
  await page.fill('#drill textarea', 'Shard the trie by first letter, a-m and n-z, up to 26, then by second char. Uneven letters so use a shard map manager from history. Unicode nodes, per-country tries on CDNs, recency weighting and streaming with Kafka for trends.');
  await page.click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await page.click('#drill .q-finish');
  await page.waitForTimeout(1500);
  console.log('stage6 cleared', await cleared(6));
  console.log('victory shown', await page.isVisible('#victory.show'));
  console.log('store', await page.evaluate(() => localStorage.getItem('sdq:v1')));
  console.log('errors', errs);
  await page.screenshot({ path: OUT + '/desk-full.png', fullPage: true });

  // ---------- mobile dark screenshots ----------
  const m = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' });
  const mp = await m.newPage();
  mp.on('pageerror', e => errs.push('m pageerror: ' + e.message));
  await mp.goto(FILE); await mp.waitForTimeout(400);
  await mp.click('#nSeg button[data-n="30"]');
  await mp.click('#lgrid .lbtn[data-l="s"]');
  await mp.click('#chips .lchip[data-l="w"]');
  await mp.click('#bins .tilebtn[data-l="c"]');
  await mp.locator('#trPredict .opt').first().click();
  await mp.click('#trRun'); await mp.waitForTimeout(6500);
  await mp.click('#levers .lever[data-l="stream"]');
  await mp.click('#levers .lever[data-l="recent"]');
  for (const n of [1, 2, 3, 4, 5]) await mp.locator('#s' + n).screenshot({ path: `${OUT}/m-s${n}.png` });
  console.log('mobile overflow', await mp.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  console.log('errors after mobile', errs);
  await browser.close();
})();
