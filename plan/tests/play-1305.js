const { chromium } = require('playwright');
const FILE = 'file:///home/user/learning/lessons/1305-scaling-autocomplete.html';
const OUT = '/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/q1305';
require('fs').mkdirSync(OUT, { recursive: true });
const W = +(process.env.W || 1280), SCHEME = process.env.SCHEME || 'light';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: W, height: 900 }, colorScheme: SCHEME, hasTouch: W < 500 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE); await page.waitForTimeout(400);
  const cleared = n => page.evaluate(n => document.querySelector('#s' + n).classList.contains('cleared'), n);
  const hearts = () => page.$$eval('.hud .heart:not(.lost)', x => x.length);
  const xp = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('sdq:v1') || '{}'); return d.runs && d.runs['1305'] ? d.runs['1305'].xp : (d.lessons && d.lessons['1305'] ? d.lessons['1305'].xp : 0); });
  const click = async sel => { await page.locator(sel).first().scrollIntoViewIfNeeded(); await page.locator(sel).first().click(); };
  const opt = async (scope, text) => { await page.waitForSelector(`${scope} .opt:not([disabled])`, { timeout: 15000 }); await page.locator(`${scope} .opt:not([disabled])`, { hasText: text }).first().click(); };
  const shot = async name => { if (W < 500) await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false }); };

  // ---------- Stage 1 ----------
  await click('#nSeg button[data-n="3"]');
  console.log('s1 book msg:', (await page.textContent('#s1msg')).slice(0, 80));
  // real pointer drag on divider 1
  await page.locator('#alpha1').scrollIntoViewIfNeeded();
  const h = await page.locator('#alpha1 .divg .handle').first().boundingBox();
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(h.x + h.width / 2 - 25, h.y + h.height / 2, { steps: 6 });
  await page.mouse.up();
  console.log('after drag, divider1 =', await page.textContent('[data-bc="0"]'));
  // nudge to f|g and p|q
  const L = 'abcdefghijklmnopqrstuvwxyz';
  const bpos = async bi => L.indexOf((await page.textContent(`[data-bc="${bi}"]`)).trim().slice(-1));
  for (const [bi, target] of [[0, 6], [1, 16]]) {
    let guard = 0;
    while ((await bpos(bi)) !== target && guard++ < 30) {
      const cur = await bpos(bi);
      await click(`#nudges .btn[data-bi="${bi}"][data-d="${cur > target ? -1 : 1}"]`);
    }
  }
  console.log('s1 drag msg:', (await page.textContent('#s1msg')).slice(0, 90));
  await shot('s1-3srv');
  await click('#nSeg button[data-n="26"]');
  await click('#lgrid .lbtn[data-l="s"]');
  console.log('s1 hot:', (await page.textContent('#s1msg')).slice(0, 70));
  await click('#nSeg button[data-n="30"]');
  const hb = await hearts();
  await click('#lgrid .lbtn[data-l="x"]');
  console.log('cold tap msg:', (await page.textContent('#s1msg')).slice(0, 70), 'hearts', hb, '->', await hearts());
  for (const l of ['s', 'c', 'p', 'm']) await click(`#lgrid .lbtn[data-l="${l}"]`);
  console.log('s1 spares:', (await page.textContent('#s1msg')).slice(0, 90));
  console.log('split list:', await page.textContent('#splitList'));
  await shot('s1-30srv');
  await opt('#s1quiz', '26 servers, one per letter');
  await opt('#s1quiz', 'Shard on the 2nd');
  await opt('#s1quiz', 'Far more queries start');
  await page.waitForTimeout(1300);
  console.log('stage1 cleared', await cleared(1), 'hearts', await hearts(), 'xp', await xp());

  // ---------- Stage 2 ----------
  await opt('#pred2', 'u through z');
  await page.waitForSelector('#pred2 .explain.show', { timeout: 15000 });
  const F = { a: 55, b: 56, c: 90, d: 54, e: 41, f: 40, g: 33, h: 35, i: 37, j: 8, k: 10, l: 30, m: 58, n: 22, o: 25, p: 75, q: 5, r: 56, s: 110, t: 50, u: 30, v: 20, w: 49, x: 2, y: 6, z: 3 };
  const loads = [0, 0, 0, 0], target = {};
  Object.keys(F).sort((a, b) => F[b] - F[a]).forEach(l => { const k = loads.indexOf(Math.min(...loads)); target[l] = k; loads[k] += F[l]; });
  console.log('LPT loads', loads);
  const asg = Object.fromEntries(L.split('').map((l, i) => [l, Math.min(3, Math.floor(i / 7))]));
  let moves = 0, usedDrag = false;
  for (const l of Object.keys(target)) {
    if (await page.isVisible('#mapWrap')) break;
    if (asg[l] === target[l]) continue;
    if (!usedDrag && W >= 500) { // one real HTML5 drag
      await page.dragAndDrop(`#bins .tile[data-l="${l}"]`, `#bins .bin[data-k="${target[l]}"]`);
      usedDrag = true;
    } else {
      await click(`#bins .tile[data-l="${l}"]`);
      await click(`#bins .bin[data-k="${target[l]}"] .mv`);
    }
    asg[l] = target[l]; moves++;
  }
  const realAsg = await page.$$eval('#bins .tile', ts => Object.fromEntries(ts.map(t => [t.dataset.l, +t.closest('.bin').dataset.k])));
  console.log('moves', moves, 'drag used', usedDrag, 'maxline:', await page.textContent('#maxline'));
  console.log('map:', await page.textContent('#mapchips'));
  await shot('s2-bins');
  for (const q of ['sun', 'xylophone', 'cat']) {
    await page.waitForSelector('#look2 .shardpick .opt:not([disabled])', { timeout: 15000 });
    await click(`#look2 .shardpick .opt[data-k="${realAsg[q[0]]}"]`);
    await page.waitForSelector('#look2 .explain.show', { timeout: 15000 });
    if (q === 'sun') await shot('s2-flow');
    await click('#look2 .row .btn.primary');
  }
  await page.waitForTimeout(1300);
  console.log('stage2 cleared', await cleared(2), 'hearts', await hearts(), 'xp', await xp());

  // ---------- reload mid-quest ----------
  await page.reload(); await page.waitForTimeout(500);
  console.log('after reload: banner =', (await page.textContent('.banner') || '').slice(0, 80), '| s1,s2 cleared', await cleared(1), await cleared(2), 's3', await cleared(3), 'xp', await xp());

  // ---------- Stage 3 ----------
  const ANS = { hiragana: 'uni', 'straße': 'uni', Brazil: 'geo', football: 'geo', India: 'geo', typos: 'none' };
  for (const [frag, bin] of Object.entries(ANS)) {
    await click(`#pool3 .scard:has-text("${frag}")`);
    await click(`#sbins3 .sbin[data-k="${bin}"] .btn`);
  }
  await click('#ins3 .btn[data-c="é"]');
  console.log('arr insert:', (await page.textContent('#nmsg3')).slice(0, 70));
  await click('#kind3 button[data-k="map"]');
  await click('#ins3 .btn[data-c="ひ"]');
  console.log('map insert:', (await page.textContent('#nmsg3')).slice(0, 70));
  await shot('s3-node');
  await opt('#s3quiz', 'Serve it from servers close');
  await page.waitForTimeout(1200);
  console.log('stage3 cleared', await cleared(3), 'hearts', await hearts(), 'xp', await xp());

  // ---------- Stage 4 ----------
  await click('#news4');
  await page.waitForSelector('#pred4 .opt', { timeout: 15000 });
  await opt('#pred4', 'A streaming pipeline');
  await page.waitForSelector('#pred4 .explain.show', { timeout: 15000 });
  console.log('eta after predict:', await page.textContent('#eta4'));
  await click('#togs4 .tog[data-k="stream"]');
  await click('#togs4 .tog[data-k="rec"]');
  console.log('eta rec only:', (await page.textContent('#eta4')).slice(0, 60));
  await click('#togs4 .tog[data-k="shard"]');
  console.log('eta rec+shard:', (await page.textContent('#eta4')).slice(0, 60));
  await click('#togs4 .tog[data-k="stream"]');
  console.log('eta all:', (await page.textContent('#eta4')).slice(0, 60), '| drop:', await page.textContent('#drop4'));
  await shot('s4-trend');
  await opt('#s4quiz', 'Rebuild isn');
  await page.waitForTimeout(1200);
  console.log('stage4 cleared', await cleared(4), 'hearts', await hearts(), 'xp', await xp());

  // ---------- Stage 5 ----------
  for (const a of ['Rebalance by history', 'Shard deeper', 'Unicode + JP trie', 'AU trie on a CDN', 'Stream + recency', 'Even load, split subtrees']) {
    await opt('#boss', a);
    await click('#boss .row .btn.primary');
  }
  await page.waitForTimeout(800);
  console.log('stage5 cleared', await cleared(5), 'hearts', await hearts(), 'xp', await xp());

  // ---------- Stage 6 ----------
  await page.locator('#drill textarea').fill('I would shard the trie by first letter a-m n-z up to 26 then second level, use a shard map manager with historical data, unicode nodes, per country tries on CDNs, and streaming with recency weighting for trends.');
  await click('#drill .q-reveal');
  for (const cb of await page.$$('#drill .selfgrade input')) await cb.check();
  await click('#drill .q-finish');
  await page.waitForTimeout(1500);
  const vic = await page.evaluate(() => document.querySelector('#victory').classList.contains('show'));
  console.log('stage6 cleared', await cleared(6), 'victory', vic, 'final', await page.evaluate(() => JSON.parse(localStorage.getItem('sdq:v1')).lessons['1305']));
  if (W < 500) { await page.locator('#victory').scrollIntoViewIfNeeded(); await page.waitForTimeout(600); await shot('victory'); }
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('overflowX', ov);
  console.log('ERRORS:', errs.length ? errs : 'none');
  await browser.close();
})();
