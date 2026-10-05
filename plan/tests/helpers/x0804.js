
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const Q = Quest.init({
  id: '0804',
  winTitle: 'Every click lands!',
  badge: '🏃 Badge: Flow Runner',
  cheatsheet: '../reference/ch08-url-shortener-cheatsheet.html',
});
const { sleep, shuffle, esc } = Q;
const NS = 'http://www.w3.org/2000/svg';

/* ================= shared helpers ================= */
function S(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
const fmt = n => Math.round(n).toLocaleString('en-US');
const B62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
// Base-62 with BigInt (IDs from a distributed generator are up to 64 bits)
function base62(id) {
  let n = BigInt(id); const digits = [];
  if (n === 0n) return { s: '0', digits: [0] };
  while (n > 0n) { digits.unshift(Number(n % 62n)); n /= 62n; }
  return { s: digits.map(d => B62[d]).join(''), digits };
}
const BOOK_URL = 'https://en.wikipedia.org/wiki/Systems_design';
const BOOK_ID = 2009215674938n;
const DOMAIN = 'tinyurl.com/';
function logTo(id, html, cls) { const l = $('#' + id); l.insertAdjacentHTML('beforeend', `<div class="${cls || ''}">${html}</div>`); l.scrollTop = l.scrollHeight; }
function checkGoal(listSel, g, set, xp) {
  if (set.has(g)) return false;
  set.add(g);
  const li = $(`${listSel} [data-g="${g}"]`); li.classList.add('done');
  const n = xp ?? 10; if (n) Q.addXP(n, li);
  return true;
}
const pause = ms => sleep(Q.reduced ? Math.min(ms, 60) : ms);
// Predict-then-watch round. Resolves after the learner picks and the action has played.
function predict(box, { step, title, options, correct, act, explain, xp = 25 }) {
  box.innerHTML = `${step ? `<div class="step">${step}</div>` : ''}<h3>${title}</h3><div class="opts"></div><div class="explain"></div><div class="row" style="margin-top:12px"></div>`;
  const opts = $('.opts', box);
  let busy = false;
  return new Promise(resolve => {
    shuffle(options.map((o, i) => ({ o, i }))).forEach(({ o, i }) => {
      const b = document.createElement('button'); b.className = 'opt'; b.textContent = o; b.dataset.i = i;
      b.onclick = async () => {
        if (busy) return; busy = true;
        $$('.opt', opts).forEach(x => x.disabled = true);
        b.classList.add('picked');
        const extra = await act();
        const ok = i === correct;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) $(`.opt[data-i="${correct}"]`, opts).classList.add('right');
        const ex = $('.explain', box); ex.className = 'explain show ' + (ok ? 'good' : 'bad');
        ex.innerHTML = (ok ? '<b>Called it.</b> ' : '<b>Surprise!</b> ') + (typeof explain === 'function' ? explain(extra) : explain);
        ok ? Q.addXP(xp, b) : Q.loseHeart(b);
        resolve({ ok, row: $('.row', box) });
      };
      opts.appendChild(b);
    });
  });
}
function nextBtn(row, label, fn, primary = true) {
  const b = document.createElement('button'); b.className = 'btn' + (primary ? ' primary' : ''); b.textContent = label; b.onclick = fn; row.appendChild(b); return b;
}
// Run quizzes one after another, then call done.
function quizChain(mount, list, done) {
  let i = 0;
  const next = () => {
    if (i >= list.length) { setTimeout(done, 900); return; }
    const cfg = list[i++];
    Q.quiz(mount, { ...cfg, onDone: () => setTimeout(next, 500) });
  };
  next();
}
// Tiny DB table widget: id | short URL | long URL
function makeTable(table, countEl) {
  let rows = [];
  function render(flashIdx, foundIdx) {
    const seen = new Map();
    rows.forEach(r => seen.set(r.long, (seen.get(r.long) || 0) + 1));
    table.innerHTML = `<thead><tr><th>id</th><th>shortURL</th><th>longURL</th></tr></thead><tbody>${rows.length ? rows.map((r, i) =>
      `<tr class="${i === flashIdx ? 'new ' : ''}${i === foundIdx ? 'found ' : ''}${seen.get(r.long) > 1 ? 'dupe' : ''}"><td>${r.id}</td><td>${esc(r.short)}</td><td title="${esc(r.long)}">${esc(r.long)}</td></tr>`).join('')
      : '<tr class="empty"><td colspan="3">empty table</td></tr>'}</tbody>`;
    if (countEl) countEl.textContent = rows.length + (rows.length === 1 ? ' row' : ' rows');
    const sc = table.closest('.tblscroll'); if (sc && flashIdx != null) sc.scrollTop = sc.scrollHeight;
  }
  render();
  return {
    get rows() { return rows; },
    add(r) { rows.push(r); render(rows.length - 1); return rows.length - 1; },
    find(long) { return rows.findIndex(r => r.long === long); },
    highlight(i) { render(null, i); },
    clear() { rows = []; render(); },
  };
}

/* ================= STAGE 1: order the shortening flow ================= */
Q.onStage(1, () => {
  const STEPS = [
    { t: 'Take the long URL as the input', node: 'f1', edge: null },
    { t: 'Check: is this long URL already in the DB?', node: 'f2', edge: 'e12' },
    { t: 'If yes: fetch its short URL and return it', node: 'f3', edge: 'e23' },
    { t: 'If no: get a new ID from the ID generator', node: 'f4', edge: 'e24' },
    { t: 'Turn the ID into a short URL with base 62', node: 'f5', edge: 'e45' },
    { t: 'Save a new row: ID, short URL, long URL', node: 'f6', edge: 'e56' },
  ];
  const goals = new Set();
  const tbl = makeTable($('#t1'), $('#t1count'));
  let placed = 0, slipped = false, running = false, quizShown = false;
  const svg = $('#flowSvg');
  const node = id => $('#' + id, svg);

  function setupOrder() {
    placed = 0; slipped = false;
    $('#slots').innerHTML = STEPS.map((_, i) => `<li data-n="${i + 1}">…</li>`).join('');
    let order;
    do { order = shuffle(STEPS.map((_, i) => i)); } while (order.every((v, i) => v === i));
    $('#pool').innerHTML = order.map(i => `<button class="opt" data-i="${i}">${STEPS[i].t}</button>`).join('');
    $$('.fnode', svg).forEach(n => n.classList.remove('lit', 'hot'));
    $$('.fedge', svg).forEach(n => n.classList.remove('lit', 'hot'));
    $('#orderMsg').textContent = 'Tap the step that happens first.';
    $$('#pool .opt').forEach(b => b.onclick = () => tap(b));
  }
  function tap(b) {
    const i = +b.dataset.i;
    if (i === placed) {
      const li = $$('#slots li')[placed];
      li.textContent = STEPS[i].t; li.classList.add('filled');
      node(STEPS[i].node).classList.add('lit');
      if (STEPS[i].edge) $('#' + STEPS[i].edge, svg).classList.add('lit');
      b.remove();
      placed++;
      if (placed < STEPS.length) { $('#orderMsg').textContent = `✓ Step ${placed} placed. What comes next?`; return; }
      $('#orderMsg').innerHTML = '<b style="color:var(--good)">✓ The full flow chart is lit.</b> Now run the book\'s example through it.';
      $('#runBtn').disabled = false;
      if (checkGoal('#s1goals', 'order', goals, 20)) maybeQuiz();
      addReshuffle();
    } else {
      b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
      $('#orderMsg').textContent = i === 2 && placed < 2 ? 'Not yet. You can\'t return an existing short URL before you\'ve looked for it.' : 'Not yet. Something else has to happen before that step.';
      if (!slipped) { slipped = true; Q.loseHeart(b); } else Q.toast('not yet', b, 'practice');
      setTimeout(() => b.classList.remove('wrong'), 450);
    }
  }
  function addReshuffle() {
    if ($('#reshuf')) return;
    const r = document.createElement('button'); r.className = 'btn'; r.id = 'reshuf'; r.textContent = '↻ Shuffle and order again'; r.onclick = setupOrder;
    $('#pool').appendChild(r);
  }

  const hot = async (ids, ms) => {
    $$('.hot', svg).forEach(n => n.classList.remove('hot'));
    ids.forEach(id => { const el = $('#' + id, svg); if (el) el.classList.add('hot'); });
    await pause(ms);
  };
  async function tickId(target) {
    const el = $('#idTick');
    if (Q.reduced) { el.textContent = target.toString(); return; }
    const t0 = performance.now();
    while (performance.now() - t0 < 900) {
      el.textContent = String(Math.floor(1e12 + Math.random() * 9e12));
      await sleep(45);
    }
    el.textContent = target.toString();
  }
  async function convert(id) {
    const box = $('#b62'); box.innerHTML = '';
    const { s, digits } = base62(id);
    let n = BigInt(id);
    for (let k = digits.length - 1; k >= 0; k--) {
      const r = Number(n % 62n);
      logTo('f1log', `&nbsp;&nbsp;${n} % 62 = ${r} → <b>${B62[r]}</b>`);
      n /= 62n;
      const sp = document.createElement('span'); sp.textContent = B62[r]; box.prepend(sp);
      await pause(260);
    }
    const sm = document.createElement('small'); sm.textContent = `remainders, last to first: ${digits.join(' ')}`; box.appendChild(sm);
    return s;
  }
  async function run() {
    if (running) return; running = true;
    $('#runBtn').disabled = true;
    $('#b62').innerHTML = ''; $('#idTick').textContent = '—';
    const existing = tbl.find(BOOK_URL);
    logTo('f1log', `── run: shorten ${BOOK_URL}`, 'w');
    await hot(['f1'], 700);
    logTo('f1log', '1 · input: the long URL');
    await hot(['e12', 'f2'], 800);
    if (existing >= 0) {
      tbl.highlight(existing);
      logTo('f1log', '2 · lookup by long URL → <b>found</b>', 'g');
      await hot(['e23', 'f3'], 900);
      logTo('f1log', `3 · return the existing short URL: ${DOMAIN}<b>${tbl.rows[existing].short}</b>. No new ID, no new row.`, 'g');
    } else {
      logTo('f1log', '2 · lookup by long URL → not found');
      await hot(['e24', 'f4'], 300);
      await tickId(BOOK_ID);
      logTo('f1log', `4 · ID generator → <b>${BOOK_ID}</b>`);
      await hot(['e45', 'f5'], 300);
      logTo('f1log', '5 · base 62: divide by 62 again and again, keep the remainders');
      const s = await convert(BOOK_ID);
      await hot(['e56', 'f6'], 400);
      tbl.add({ id: BOOK_ID.toString(), short: s, long: BOOK_URL });
      logTo('f1log', `6 · saved row (${BOOK_ID}, ${s}, …Systems_design) → return ${DOMAIN}<b>${s}</b>`, 'g');
      if (checkGoal('#s1goals', 'run', goals, 10)) maybeQuiz();
    }
    await pause(600);
    $$('.hot', svg).forEach(n => n.classList.remove('hot'));
    $('#runBtn').textContent = tbl.find(BOOK_URL) >= 0 ? '▶ Run the same URL again' : '▶ Run it';
    $('#runBtn').disabled = false;
    running = false;
  }
  $('#runBtn').onclick = run;
  $('#runReset').onclick = () => { if (running) return; tbl.clear(); $('#b62').innerHTML = ''; $('#idTick').textContent = '—'; $('#runBtn').textContent = '▶ Run it'; logTo('f1log', '↻ table emptied'); };
  setupOrder();

  function maybeQuiz() {
    if (quizShown || goals.size < 2) return;
    quizShown = true;
    setTimeout(() => quizChain($('#s1quiz'), [
      { q: 'Someone shortens a long URL that was already shortened last week. What does this flow do?',
        options: ['Returns the old short URL, makes no new ID', 'Makes a new ID and a second short URL', 'Rejects the request as a duplicate URL'],
        correct: 0,
        good: 'Step 2 finds the long URL in the DB, so step 3 returns the short URL it already has. You saw this on the second run.',
        bad: 'Step 2 finds the long URL, so the flow takes the "yes" branch and returns the existing short URL. No error, and no new ID is spent.' },
      { tag: 'Check 2 of 2', q: 'Where does the new ID in step 4 come from?',
        options: ['A distributed unique ID generator (Ch. 7)', 'A hash of the long URL, cut to 7 chars', 'The table\'s row count plus one, each time'],
        correct: 0,
        good: 'The book points back to Chapter 7: a distributed unique ID generator (Snowflake-style) hands out IDs that never repeat, even across many servers.<a class="cite" href="https://bytebytego.com/courses/system-design-interview/design-a-unique-id-generator-in-distributed-systems" target="_blank" rel="noopener">[3]</a>',
        bad: 'Hashing is the <i>other</i> approach (Quest 8.2). Row count plus one breaks as soon as two servers insert at once. The book uses the distributed unique ID generator from Chapter 7.<a class="cite" href="https://bytebytego.com/courses/system-design-interview/design-a-unique-id-generator-in-distributed-systems" target="_blank" rel="noopener">[3]</a>' },
    ], () => Q.clearStage(1)), 500);
  }
});

/* ================= STAGE 2: same URL twice ================= */
Q.onStage(2, () => {
  const PRESETS = [
    BOOK_URL,
    'https://example.com/blog/2026/10/how-we-scaled-checkout?utm_source=newsletter&utm_medium=email',
    'https://example.org/docs/getting-started/install-on-linux#step-3',
  ];
  const goals = new Set();
  const tbl = makeTable($('#t2'));
  let checkOn = true, nextId = BOOK_ID, idsUsed = 0, awaitingPredict = false, predicted = false, quizShown = false, firstUrl = null;
  $('#u2chips').innerHTML = PRESETS.map((u, i) => `<button class="chip" data-i="${i}" title="${esc(u)}">${['wikipedia…/Systems_design', 'example.com/blog/…', 'example.org/docs/…'][i]}</button>`).join('');
  $$('#u2chips .chip').forEach(c => c.onclick = () => { $('#u2').value = PRESETS[+c.dataset.i]; });
  $$('#chk2 button').forEach(b => b.onclick = () => {
    if (awaitingPredict) { Q.toast('predict first ↓', b, 'practice'); return; }
    checkOn = b.dataset.v === 'on';
    $$('#chk2 button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
  });
  function counters() {
    const distinct = new Set(tbl.rows.map(r => r.long)).size;
    $('#c2rows').textContent = tbl.rows.length;
    $('#c2ids').textContent = idsUsed;
    $('#c2waste').textContent = idsUsed - distinct;
    return idsUsed - distinct;
  }
  function submit(url) {
    const res = $('#res2');
    if (checkOn) {
      const i = tbl.find(url);
      if (i >= 0) {
        tbl.highlight(i);
        res.className = 'result2 reuse';
        res.innerHTML = `Step 2 found it → returned the existing <b class="code">${DOMAIN}${esc(tbl.rows[i].short)}</b>. No new ID used.`;
        counters();
        return { reused: true };
      }
    }
    const id = nextId; idsUsed++;
    nextId += BigInt(150000 + Math.floor(Math.random() * 850000)); // next IDs from the generator: unique and rising
    const s = base62(id).s;
    tbl.add({ id: id.toString(), short: s, long: url });
    const dup = tbl.rows.filter(r => r.long === url).length > 1;
    res.className = 'result2 ' + (dup ? 'waste' : 'fresh');
    res.innerHTML = dup
      ? `Check skipped → new ID ${id} → <b class="code">${DOMAIN}${s}</b>. That's a <b>second</b> short URL for the same page.`
      : `New ID ${id} → base 62 → <b class="code">${DOMAIN}${s}</b>. One new row.`;
    const w = counters();
    return { reused: false, waste: w };
  }
  $('#sub2').onclick = () => {
    const url = $('#u2').value.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(url)) { Q.toast('enter a full http(s) URL', $('#sub2'), 'practice'); return; }
    if (awaitingPredict) { Q.toast('predict first ↓', $('#sub2'), 'practice'); $('#p2').scrollIntoView({ behavior: Q.reduced ? 'auto' : 'smooth', block: 'center' }); return; }
    const r = submit(url);
    if (checkOn && !r.reused && !goals.has('first')) {
      checkGoal('#s2goals', 'first', goals); firstUrl = url;
      if (!predicted) startPredict();
    }
    if (!checkOn && r.waste >= 2 && checkGoal('#s2goals', 'waste', goals)) {
      logWaste();
      maybeQuiz();
    }
  };
  function logWaste() {
    $('#idxNote').style.display = 'block';
    $('#res2').innerHTML += '<br><b>Without step 2, every submit burns an ID and a row.</b> Same page, many codes, and clicks get split across them.';
  }
  $('#reset2').onclick = () => { if (awaitingPredict) return; tbl.clear(); idsUsed = 0; nextId = BOOK_ID; counters(); $('#res2').className = 'result2'; $('#res2').textContent = 'Table emptied.'; };

  function startPredict() {
    awaitingPredict = true;
    $('#sub2').disabled = true;
    $('#p2').style.display = 'block';
    const short = tbl.rows[tbl.find(firstUrl)].short;
    predict($('#p2'), {
      step: 'Predict first',
      title: `The same URL is submitted again, with the check ON. What comes back?`,
      options: [`The same code, ${short}, and no new row`, 'A brand-new code in a brand-new row', 'An error: "this URL is already taken"'],
      correct: 0,
      act: async () => { $('#u2').value = firstUrl; await pause(300); submit(firstUrl); await pause(700); },
      explain: 'Step 2 found the long URL and returned the short URL it already had. Shortening is <b>idempotent</b> now: submit a thousand times and you get one row. Now flip the check <b>OFF</b> and submit the same URL a few times.',
    }).then(() => {
      awaitingPredict = false; predicted = true; $('#sub2').disabled = false;
      checkGoal('#s2goals', 'predict', goals, 0);
      maybeQuiz();
    });
  }
  counters();

  function maybeQuiz() {
    if (quizShown || goals.size < 3) return;
    quizShown = true;
    setTimeout(() => Q.quiz($('#s2quiz'), {
      q: 'Step 2 runs on every shorten request. What does the URL table need to make it fast?',
      options: ['An index on long URL, or on a hash of it', 'An index on the short URL column alone', 'No index: scan the table on each request'],
      correct: 0,
      good: 'Step 2 looks rows up <i>by long URL</i>, so that’s what needs an index. Long URLs are long, so many designs index a fixed-size hash of the URL instead. The short URL index serves the <i>redirect</i> path, not this one.',
      bad: 'The lookup in step 2 is by <i>long URL</i>, so that’s the column that needs an index (often a hash of it, since URLs are long). A short URL index helps redirects, not this check. A full scan dies at billions of rows.',
      onDone: () => setTimeout(() => Q.clearStage(2), 900),
    }), 500);
  }
});

/* ================= STAGE 3: redirect with a cache ================= */
Q.onStage(3, () => {
  const svg = $('#tSvg');
  const CAP = 3000, NKEYS = 10000, CACHE_SIZE = 1000, ZIPF = 1.2, WIN = 2000, BATCH = 100;
  // popularity: a few hot links get most clicks (Zipf distribution)
  const cdf = new Float64Array(NKEYS); let tot = 0;
  for (let k = 0; k < NKEYS; k++) { tot += Math.pow(k + 1, -ZIPF); cdf[k] = tot; }
  for (let k = 0; k < NKEYS; k++) cdf[k] /= tot;
  const sample = () => { const u = Math.random(); let lo = 0, hi = NKEYS - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cdf[m] < u) lo = m + 1; else hi = m; } return lo; };
  const cache = new Map(); // LRU: Map keeps insertion order
  const win = new Uint8Array(WIN); let wi = 0, wn = 0, wsum = 0;
  let traffic = 1000, cacheOn = false, cacheUnlocked = false, hitRatio = 0, dbReads = 1000;
  const goals = new Set();
  let quizShown = false, busy = false;

  // --- draw the system ---
  const W = { lb: [58, 82, 50, 36], web: [[134, 28, 58, 32], [134, 84, 58, 32], [134, 140, 58, 32]], cache: [218, 80, 60, 40], db: [298, 78, 56, 44] };
  const wires = S('g', {}, svg);
  S('path', { class: 'wire', d: 'M42 100H58' }, wires);
  W.web.forEach(([x, y, w, h]) => { S('path', { class: 'wire', d: `M108 100L134 ${y + h / 2}` }, wires); S('path', { class: 'wire', d: `M192 ${y + h / 2}L218 100` }, wires); });
  S('path', { class: 'wire', d: 'M278 100H298' }, wires);
  const box = (x, y, w, h, label, cls) => { const g = S('g', { class: 'box ' + (cls || '') }, svg); S('rect', { x, y, width: w, height: h, rx: 9 }, g); S('text', { x: x + w / 2, y: y + h / 2 }, g).textContent = label; return g; };
  const users = S('g', { class: 'box' }, svg); S('text', { x: 22, y: 96, style: 'font-size:24px' }, users).textContent = '👥';
  S('text', { class: 'lbl', x: 22, y: 128 }, svg).textContent = 'users';
  box(...W.lb, 'LB');
  W.web.forEach((r, i) => box(...r, 'web ' + (i + 1)));
  const cacheG = box(...W.cache, 'cache', 'off');
  const dbG = box(...W.db, 'DB');
  S('text', { class: 'lbl', x: 83, y: 136 }, svg).textContent = 'load balancer';
  S('text', { class: 'lbl', x: 248, y: 138 }, svg).textContent = 'short → long';
  S('text', { class: 'lbl', x: 326, y: 140 }, svg).textContent = 'url table';
  const dotsG = S('g', {}, svg);
  const pathFor = (wi2, kind) => {
    const wy = W.web[wi2][1] + W.web[wi2][3] / 2;
    const p = [[36, 100], [83, 100], [148, wy], [178, wy], [232, 100], [248, 100]];
    if (kind !== 'hit') p.push([326, 100]);
    return p;
  };

  // --- moving dots (one rAF loop) ---
  const dots = [];
  let rafOn = false;
  function spawn(kind, opts = {}) {
    if (Q.reduced && !opts.force) return null;
    const pts = pathFor(opts.web ?? Math.floor(Math.random() * 3), kind);
    const segs = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); L += d; }
    const c = S('circle', { class: 'tdot ' + (opts.cls || (kind === 'hit' ? 'hit' : 'miss')), r: opts.r || 3.6, cx: pts[0][0], cy: pts[0][1] }, dotsG);
    const d = { c, pts, segs, L, t0: performance.now(), dur: opts.dur || (L * 2.6), stops: opts.stops || null, done: opts.done || null };
    dots.push(d);
    if (!rafOn) { rafOn = true; requestAnimationFrame(frame); }
    return d;
  }
  function frame(now) {
    for (let i = dots.length - 1; i >= 0; i--) {
      const d = dots[i];
      const p = Math.min(1, (now - d.t0) / d.dur);
      let dist = p * d.L, k = 0;
      while (k < d.segs.length - 1 && dist > d.segs[k]) { dist -= d.segs[k]; k++; }
      const f = d.segs[k] ? Math.min(1, dist / d.segs[k]) : 1;
      const a = d.pts[k], b = d.pts[k + 1];
      d.c.setAttribute('cx', (a[0] + (b[0] - a[0]) * f).toFixed(1));
      d.c.setAttribute('cy', (a[1] + (b[1] - a[1]) * f).toFixed(1));
      if (p >= 1) { dots.splice(i, 1); d.done ? d.done(d) : d.c.remove(); }
    }
    if (dots.length) requestAnimationFrame(frame); else rafOn = false;
  }

  // --- the simulation tick ---
  function step() {
    for (let i = 0; i < BATCH; i++) {
      let hit = 0;
      if (cacheOn) {
        const k = sample();
        if (cache.has(k)) { hit = 1; cache.delete(k); cache.set(k, 1); }
        else { cache.set(k, 1); if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value); }
      }
      wsum += hit - (wn === WIN ? win[wi] : 0);
      win[wi] = hit; wi = (wi + 1) % WIN; if (wn < WIN) wn++;
    }
    hitRatio = cacheOn && wn ? wsum / wn : 0;
    dbReads = traffic * (1 - hitRatio);
    render();
    // spawn a few dots that reflect the mix (each stands for many clicks)
    const n = Math.max(1, Math.min(4, Math.round(traffic / 3000)));
    for (let i = 0; i < n; i++) if (Math.random() < 0.55) spawn(cacheOn && Math.random() < hitRatio ? 'hit' : 'miss');
  }
  function render() {
    $('#tVal').textContent = fmt(traffic);
    $('#gHit').textContent = cacheOn ? Math.round(hitRatio * 100) + '%' : 'off';
    $('#gDb').textContent = fmt(dbReads);
    const over = dbReads > CAP;
    // toy latency: cache ~1 ms, DB ~10 ms, and the DB queue explodes past capacity
    const dbMs = over ? 10 * Math.min(40, Math.pow(dbReads / CAP, 4)) : 10 / (1 - Math.min(0.9, dbReads / CAP * 0.9));
    const ms = cacheOn ? hitRatio * 1 + (1 - hitRatio) * dbMs : dbMs;
    $('#gMs').textContent = ms >= 100 ? '≥100 ms' : ms.toFixed(ms < 10 ? 1 : 0) + ' ms';
    const fill = $('#heatFill');
    fill.style.width = Math.min(100, dbReads / (CAP * 2) * 100) + '%';
    fill.style.background = over ? 'var(--bad)' : dbReads > CAP * 0.7 ? 'var(--warn)' : 'var(--good)';
    $('#heatTxt').innerHTML = over ? `<span class="over">🔥 ${fmt(dbReads)} / 3,000 · overloaded</span>` : `<b>${fmt(dbReads)}</b> / 3,000`;
    dbG.classList.toggle('hot', over);
    cacheG.classList.toggle('off', !cacheOn); cacheG.classList.toggle('cacheon', cacheOn);
    if (!cacheOn && traffic >= 11600 && checkGoal('#s3goals', 'melt', goals)) {
      logTo('t3log', `🔥 11,600 clicks/s and no cache: every click is a DB read. That's almost 4× what the DB can take. Queries queue up and every redirect slows to a crawl.`, 'e');
      maybeQuiz();
    }
  }
  let timer = null, visible = true;
  const startTimer = () => { if (!timer) timer = setInterval(() => { if (visible) step(); }, 100); };
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '200px' }).observe($('#s3'));
  startTimer();

  // --- controls ---
  $('#tSlider').oninput = e => { traffic = +e.target.value; dbReads = traffic * (1 - hitRatio); render(); };
  function setCache(on) {
    if (on === cacheOn) return;
    cacheOn = on; cache.clear(); win.fill(0); wi = 0; wn = 0; wsum = 0; hitRatio = 0;
    $$('#cacheSeg button').forEach(x => { const me = (x.dataset.v === 'on') === on; x.classList.toggle('on', me); x.setAttribute('aria-pressed', me); });
    logTo('t3log', on ? 'Cache ON. It starts <b>empty</b> (cold), so the first clicks all miss and go to the DB.' : 'Cache OFF. Every click reads the DB.', on ? 'g' : 'w');
    render();
  }
  $$('#cacheSeg button').forEach(b => b.onclick = () => { if (!cacheUnlocked) { Q.toast('predict first ↓', b, 'practice'); return; } setCache(b.dataset.v === 'on'); });
  function unlockCache() { cacheUnlocked = true; $$('#cacheSeg button').forEach(b => b.disabled = false); $('#cacheLock').textContent = ''; }

  // trace one click through the five steps
  $('#traceBtn').onclick = async () => {
    if (busy) return; busy = true;
    const inCache = cacheOn && cache.has(0); // key 0 = the hottest link = zn9edcu
    $('#card404').classList.remove('show');
    logTo('t3log', `── trace: GET ${DOMAIN}zn9edcu`, 'w');
    logTo('t3log', '1 · user clicks the short link');
    const d = spawn(inCache ? 'hit' : 'miss', { force: true, cls: 'trace', r: 6, web: 1, dur: Q.reduced ? 10 : 2200 });
    await pause(450); logTo('t3log', '2 · load balancer → web 2');
    await pause(650);
    if (inCache) logTo('t3log', '3 · cache <b>hit</b>: zn9edcu → …/wiki/Systems_design', 'g');
    else { logTo('t3log', cacheOn ? '3 · cache miss (not cached yet)' : '3 · no cache, so skip to the DB'); await pause(500); logTo('t3log', '4 · DB lookup by short URL → found the row' + (cacheOn ? ', and put it in the cache for next time' : ''), 'g'); if (cacheOn) { cache.set(0, 1); } }
    await pause(500);
    logTo('t3log', `5 · reply <b>302 Found</b>, Location: ${BOOK_URL} → the browser goes there`, 'g');
    if (d && d.c.isConnected) d.c.remove();
    if (checkGoal('#s3goals', 'trace', goals)) maybeQuiz();
    busy = false;
  };
  // invalid code
  $('#badBtn').onclick = async () => {
    if (busy) return; busy = true;
    $('#card404').classList.remove('show');
    logTo('t3log', `── GET ${DOMAIN}zzz9999`, 'w');
    spawn('miss', { force: true, cls: 'dead', r: 6, web: 0, dur: Q.reduced ? 10 : 2000 });
    await pause(1300);
    logTo('t3log', '3 · cache miss → 4 · DB: <b>no such row</b>', 'e');
    await pause(700);
    logTo('t3log', '5 · reply <b>404 Not Found</b>. The user probably mistyped the code.', 'e');
    $('#card404').classList.add('show');
    if (checkGoal('#s3goals', '404', goals)) maybeQuiz();
    busy = false;
  };

  // predict
  function runPredict() {
    predict($('#p3'), {
      step: 'Predict first',
      title: 'At the 11,600 clicks/s peak, you switch the cache ON. Once it warms up, will the DB stay under its 3,000 reads/s limit?',
      options: ['Yes: most clicks never reach the DB', 'No: the DB still serves every click', 'Only if we also add two more DBs'],
      correct: 0,
      act: async () => {
        unlockCache();
        traffic = 11600; $('#tSlider').value = 11600;
        setCache(false); setCache(true);
        await sleep(Q.reduced ? 2600 : 3000); // the sim keeps ticking; let the cache warm
        if (wn < WIN) for (let i = 0; i < 25 && wn < WIN; i++) step(); // in case the tab was throttled
        logTo('t3log', `Warm cache at peak: hit ratio ${Math.round(hitRatio * 100)}%, DB ${fmt(dbReads)} reads/s.`, 'g');
        return { h: Math.round(hitRatio * 100), db: fmt(dbReads) };
      },
      explain: x => `The hit ratio settled near <b>${x.h}%</b>, so only about <b>${x.db} reads/s</b> reach the DB. Because a few hot links get most clicks, a small cache (here 10% of the links) catches most of the traffic. Watch the first second next time, though: an empty, <i>cold</i> cache sends everything to the DB until it fills.`,
    }).then(({ row }) => {
      checkGoal('#s3goals', 'predict', goals, 0);
      nextBtn(row, '↻ Predict again', runPredict, false);
      maybeQuiz();
    });
  }
  runPredict();
  if (Q.isCleared(3)) unlockCache();
  render();

  function maybeQuiz() {
    if (quizShown || goals.size < 4) return;
    quizShown = true;
    setTimeout(() => quizChain($('#s3quiz'), [
      { q: 'What does the redirect cache store?',
        options: ['shortURL → longURL pairs', 'Whole pages of each long URL', 'longURL → click count pairs'],
        correct: 0,
        good: 'The book keeps <code>&lt;shortURL, longURL&gt;</code> mappings in the cache. A redirect needs nothing else: look up the code, send the redirect.',
        bad: 'The shortener never fetches the destination page; it only redirects. The cache holds <code>&lt;shortURL, longURL&gt;</code> mappings, which is all a redirect needs.' },
      { tag: 'Check 2 of 2', q: 'A short code is in neither the cache nor the DB. What should the web server do?',
        options: ['Return 404: the short URL is invalid', 'Make up a new long URL for that code', 'Keep retrying the DB until it appears'],
        correct: 0,
        good: 'The book says the user most likely entered an invalid short URL. Answer with a 404 (Not Found).',
        bad: 'Nothing is coming. Codes only exist once someone shortened a URL, and links are never deleted here. The book treats it as an invalid short URL, so return a 404 (Not Found).' },
    ], () => Q.clearStage(3)), 500);
  }
});

/* ================= STAGE 4: wrap-up arsenal ================= */
Q.onStage(4, () => {
  const FIX = {
    rl: 'Rate limiter (per IP)',
    web: 'Add stateless web servers',
    shard: 'Shard the DB by short URL',
    an: 'Click analytics pipeline',
    repl: 'DB replica with failover',
    crep: 'Cache replicas, DB headroom',
  };
  const PROBS = [
    { e: '🤖', t: 'A bot submits 50,000 URLs a minute', f: 'rl', why: 'The book\'s first wrap-up point. A malicious user can flood the shortening endpoint. A rate limiter drops requests past a limit, keyed by IP address or other rules (Ch. 4).' },
    { e: '🛍️', t: 'Black Friday traffic triples overnight', f: 'web', why: 'Web servers keep no data of their own: no sessions, no files. That makes them <b>stateless</b>, so you add more behind the load balancer for the rush and remove them after.' },
    { e: '💾', t: 'The url table has outgrown one machine', f: 'shard', why: '<b>Sharding</b> splits the rows across several DB servers, each holding a slice. Split by short URL (or ID), and every redirect still reads exactly one shard.' },
    { e: '📈', t: 'Marketing asks which campaign drove clicks', f: 'an', why: 'Log every click (code, time, country, referrer) into an analytics pipeline. Every click has to reach your servers to be counted, which is one reason to pick 302 over 301.' },
    { e: '💥', t: 'The primary DB crashes at 3 a.m.', f: 'repl', why: '<b>Replication</b> keeps copies of the data on other machines. When the primary dies, a replica is promoted to take its place and redirects keep working (Ch. 1).' },
    { e: '🧊', t: 'A cache node dies and DB reads spike', f: 'crep', why: 'A replacement node starts cold and every click on it falls to the DB. Replicated cache nodes keep the hot data alive, and DB headroom absorbs the misses while a node warms up.' },
  ];
  let sel = 0;
  const matched = new Set();
  const svg = $('#boardSvg');
  // --- board ---
  const wireG = S('g', {}, svg), compG = S('g', {}, svg);
  const comps = {};
  function comp(x, y, w, h, label, fix) {
    const g = S('g', { class: 'comp' + (fix ? ' fix' : '') }, compG);
    S('rect', { x, y, width: w, height: h, rx: 9 }, g);
    S('text', { x: x + w / 2, y: y + h / 2 }, g).textContent = label;
    if (fix) (comps[fix] = comps[fix] || []).push(g);
    return g;
  }
  function wire(d, fix, dash) {
    const p = S('path', { class: 'bw' + (fix ? ' fix' : '') + (dash ? ' dash' : ''), d }, wireG);
    if (fix) (comps[fix] = comps[fix] || []).push(p);
    return p;
  }
  // wires (drawn first so boxes sit on top)
  wire('M180 38V56'); wire('M180 86V104');
  [[52, 'web'], [138], [222], [308, 'web']].forEach(([x, f]) => wire(`M180 134L${x} 152`, f));
  wire('M138 182L105 204'); wire('M222 182L105 204');
  wire('M52 182L105 204', 'web'); wire('M308 182L105 204', 'web');
  wire('M105 234V256');
  wire('M170 219H190', 'crep');
  wire('M170 273H190', 'repl');
  wire('M60 290V310', 'shard'); wire('M105 290L172 310', 'shard'); wire('M150 290L284 310', 'shard');
  wire('M308 152V136', 'an', true);
  comp(130, 8, 100, 30, '👥 Users');
  comp(120, 56, 120, 30, 'Rate limiter', 'rl');
  comp(120, 104, 120, 30, 'Load balancer');
  comp(266, 104, 84, 30, '📊 Analytics', 'an');
  comp(16, 152, 72, 30, 'web', 'web');
  comp(102, 152, 72, 30, 'web');
  comp(186, 152, 72, 30, 'web');
  comp(272, 152, 72, 30, 'web', 'web');
  comp(40, 204, 130, 30, 'Cache');
  comp(190, 204, 130, 30, 'Cache replica', 'crep');
  comp(40, 256, 130, 34, 'DB primary');
  comp(190, 256, 130, 34, 'DB replica', 'repl');
  comp(16, 310, 96, 34, 'shard A', 'shard');
  comp(124, 310, 96, 34, 'shard B', 'shard');
  comp(236, 310, 108, 34, 'shard C', 'shard');
  function pin(f) { (comps[f] || []).forEach((el, i) => setTimeout(() => el.classList.add('pinned'), Q.reduced ? 0 : i * 70)); }

  // --- match UI ---
  function renderProblems() {
    $('#plist').innerHTML = PROBS.map((p, i) => `<button class="opt${matched.has(i) ? ' done' : ''}${i === sel && !matched.has(i) ? ' sel' : ''}" data-i="${i}" aria-pressed="${i === sel}">${p.e} ${p.t}${matched.has(i) ? `<small>✓ ${FIX[p.f]}</small>` : ''}</button>`).join('');
    $$('#plist .opt').forEach(b => b.onclick = () => {
      const i = +b.dataset.i;
      if (matched.has(i)) return;
      sel = i; renderProblems();
    });
  }
  function renderFixes() {
    const used = new Set([...matched].map(i => PROBS[i].f));
    $('#fixes').innerHTML = FIXKEYS.map(k => `<button class="opt${used.has(k) ? ' used' : ''}" data-k="${k}"${used.has(k) ? ' disabled aria-hidden="true"' : ''}>${FIX[k]}</button>`).join('');
    $$('#fixes .opt').forEach(b => b.onclick = () => choose(b));
  }
  const FIXKEYS = shuffle(Object.keys(FIX));
  function choose(b) {
    if (sel == null || matched.has(sel)) { Q.toast('pick a problem first', b, 'practice'); return; }
    const p = PROBS[sel], ex = $('#mExplain');
    if (b.dataset.k === p.f) {
      matched.add(sel);
      ex.className = 'explain show good';
      ex.innerHTML = `<b>${p.e} → ${FIX[p.f]}.</b> ${p.why}`;
      Q.addXP(8, b);
      pin(p.f);
      $('#pinCount').textContent = `${matched.size} of 6 fixes pinned` + (matched.size === 6 ? ' · that\'s the book\'s full design, plus extras' : '');
      const nx = PROBS.findIndex((_, i) => !matched.has(i));
      sel = nx >= 0 ? nx : null;
      renderProblems(); renderFixes();
      if (matched.size === PROBS.length) maybeQuiz();
    } else {
      b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
      ex.className = 'explain show bad';
      ex.innerHTML = `<b>Not that one.</b> "${FIX[b.dataset.k]}" doesn't fix "${p.t.toLowerCase()}". Ask: what is actually running out or breaking here?`;
      Q.loseHeart(b);
    }
  }
  renderProblems(); renderFixes();

  let quizShown = false;
  function maybeQuiz() {
    if (quizShown) return; quizShown = true;
    setTimeout(() => Q.quiz($('#s4quiz'), {
      q: 'Why can you add or remove web servers so easily in this design?',
      options: ['They\'re stateless: all data is in cache and DB', 'Each one keeps its own full copy of the DB', 'The load balancer caches every single reply'],
      correct: 0,
      good: 'No web server holds anything the others need. Any server can answer any click, so the load balancer can send traffic to a new one right away, and a removed one takes nothing with it.',
      bad: 'Web servers here hold no data at all, which is exactly why they\'re easy to scale. The mappings live in the cache and the DB, so any server can answer any click.',
      onDone: () => setTimeout(() => Q.clearStage(4), 900),
    }), 500);
  }
});

/* ================= STAGE 5: boss ================= */
Q.onStage(5, () => Q.boss($('#boss'), {
  name: '📟 The 3 a.m. Pager',
  xp: 15,
  choices: [
    { k: 'cache', label: 'Cache layer', sub: 'hot reads' },
    { k: 'db', label: 'DB replication / sharding', sub: 'durable mapping' },
    { k: 'rl', label: 'Rate limiter', sub: 'abuse control' },
    { k: 'web', label: 'Scale web tier', sub: 'stateless servers' },
  ],
  scenarios: [
    { e: '🐦', t: 'A viral tweet', d: 'One short link gets 200,000 clicks a minute. Every one of them asks for the same row.', a: 'cache', why: 'One hot key read over and over is the perfect cache case. After the first miss it\'s served from memory and the DB barely notices.' },
    { e: '🎣', t: 'A spam botnet', d: 'Bots are creating millions of short links that point to phishing pages.', a: 'rl', why: 'Throttle the shortening endpoint: a rate limiter by IP address, API key or other rules (Ch. 4). Real services also scan destinations for abuse, but the book\'s answer is the limiter.' },
    { e: '💀', t: 'The primary DB dies', d: 'Redirects for links that aren\'t in the cache start failing.', a: 'db', why: 'With replication, a replica holds the same rows. It\'s promoted to primary and redirects keep working. That\'s the availability point from the book\'s wrap-up.' },
    { e: '📦', t: 'Out of disk', d: 'The url table has grown past what one machine can store.', a: 'db', why: 'Shard it: split rows across DB servers by short URL (or ID), so each redirect still touches one shard.' },
    { e: '🌅', t: 'Morning rush', d: 'Traffic doubles and the web servers sit at 90% CPU. Cache and DB look fine.', a: 'web', why: 'The bottleneck is the web tier, and it\'s stateless. Add servers behind the load balancer (or let autoscaling do it).' },
    { e: '🕷️', t: 'A code scraper', d: 'One IP tries codes in order, 1,000 lookups a second, to find private links.', a: 'rl', why: 'Rate-limit by IP. Base-62 IDs that count upward are easy to guess, a known downside of this approach. Don\'t treat a short link as a secret.' },
    { e: '🐢', t: 'Slow redirects', d: 'p99 redirect latency is 200 ms. Tracing shows every click is a DB read.', a: 'cache', why: 'Reads are 10× writes. Keep shortURL → longURL in an in-memory cache and most clicks never touch the DB. (p99 = the time that 99% of requests beat.)' },
  ],
  outro: 'Pattern: hot reads → cache. Losing or outgrowing data → replicate and shard. Abuse → rate limit. CPU-bound app servers → add stateless servers.',
  onDone: () => Q.clearStage(5),
}));

/* ================= STAGE 6: interview drill ================= */
Q.onStage(6, () => Q.drill($('#drill'), {
  prompt: 'The interviewer: <i>"Walk me through what happens when someone shortens a URL, and when someone clicks the short link."</i>',
  placeholder: 'To shorten, the request hits…',
  model: '"Shortening: the API server checks whether the long URL is already in the DB. If it is, it returns the existing short URL. If not, it gets a new ID from the distributed ID generator and base-62 encodes it. For example, 2009215674938 becomes zn9edcu. Then it stores the ID, short URL and long URL as one row. Redirecting: the click goes through a load balancer to a stateless web server. The server checks the cache for the short URL and falls back to the DB on a miss. If it isn\'t in either, it returns a 404. Otherwise it sends a 301 or 302 to the long URL. To scale, I\'d add a rate limiter on shortening, more web servers, DB replicas and sharding by short URL, plus click analytics."',
  checks: ['I described the shortening flow, including the existence check', 'I described the redirect flow: cache, then DB, then the 404 case', 'I named at least three of: rate limiting, web scaling, DB replication or sharding, analytics'],
  onDone: () => Q.clearStage(6),
}));

Q.start();
})();
