(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const Q = Quest.init({
  id: '0404',
  badge: '🧮 Badge: Counter Keeper',
  winTitle: 'Counters under control',
  cheatsheet: '../reference/ch04-rate-limiter-cheatsheet.html',
});
const { sleep, shuffle, esc } = Q;
const NS = 'http://www.w3.org/2000/svg';
const pause = ms => sleep(Q.reduced ? Math.min(ms, 30) : ms);

/* ================= shared helpers ================= */
function S(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function logTo(el, html, cls) { el.insertAdjacentHTML('beforeend', `<div class="${cls || ''}">${html}</div>`); el.scrollTop = el.scrollHeight; }
function checkGoal(listSel, g, set, xp) {
  if (set.has(g)) return false;
  set.add(g);
  const li = $(`${listSel} [data-g="${g}"]`); li.classList.add('done'); Q.addXP(xp || 10, li);
  return true;
}
const ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
function tween(dur, fn) {
  return new Promise(res => {
    if (Q.reduced || dur <= 0) { fn(1); return res(); }
    const t0 = performance.now();
    const f = now => { const p = Math.min(1, (now - t0) / dur); fn(p); p < 1 ? requestAnimationFrame(f) : res(); };
    requestAnimationFrame(f);
  });
}
function nudge(el) { el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); }
// Predict-then-watch round. Resolves after the learner picks and the action has played.
function predict(box, { step, title, options, correct, act, explain, xp = 15 }) {
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
        await act();
        const ok = i === correct;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) $(`.opt[data-i="${correct}"]`, opts).classList.add('right');
        const ex = $('.explain', box); ex.className = 'explain show ' + (ok ? 'good' : 'bad');
        ex.innerHTML = (ok ? '<b>Called it.</b> ' : '<b>Surprise!</b> ') + explain;
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

/* ================= STAGE 1: Redis counters ================= */
Q.onStage(1, () => {
  const KEY = 'rl:user42', LIMIT = 5, TTL = 60;
  const st = { t: 0, key: null, busy: false, sawReject: false, expiredAfterReject: false };
  const goals = new Set();
  let fixDone = false, quizShown = false;
  const log = $('#rlog');

  async function line(text, cls) {
    const d = document.createElement('div'); d.className = cls || ''; log.appendChild(d);
    if (Q.reduced || cls !== 'in') d.textContent = text;
    else for (let i = 1; i <= text.length; i += 2) { d.textContent = text.slice(0, i + 1); log.scrollTop = log.scrollHeight; await sleep(16); }
    log.scrollTop = log.scrollHeight;
    await pause(110);
  }
  function render() {
    $('#rT').textContent = `t = ${st.t} s`;
    const k = st.key;
    $('#rVal').textContent = k ? k.v : '(nil)';
    $('#rTTL').textContent = k ? (k.exp == null ? '-1 (none)' : Math.max(0, k.exp - st.t) + ' s') : '— (no key)';
    $('#rBar').style.width = k && k.exp != null ? Math.max(0, (k.exp - st.t) / TTL * 100) + '%' : '0%';
    $('#rKeyCard').classList.toggle('empty', !k);
  }
  function setStatus(code) { const s = $('#rStatus'); s.textContent = code === 200 ? '200 OK' : '429 Too Many'; s.className = 'status ' + (code === 200 ? 'ok' : 'no'); }
  function setBtns(on) { ['#rSend', '#rWait', '#rReset'].forEach(s => $(s).disabled = !on); }
  function expireIfDue() { if (st.key && st.key.exp != null && st.t >= st.key.exp) { st.key = null; return true; } return false; }

  $('#rSend').onclick = async () => {
    if (st.busy) return; st.busy = true; setBtns(false);
    if (expireIfDue()) render();
    await line(`> GET ${KEY}`, 'in');
    const v = st.key ? st.key.v : 0;
    await line(st.key ? `"${v}"` : '(nil)   // no key yet, so count = 0', 'nil');
    if (v >= LIMIT) {
      await line(`${v} ≥ ${LIMIT}: limit reached → 429 Too Many Requests (no INCR)`, 'err');
      setStatus(429); st.sawReject = true;
      checkGoal('#s1goals', 'reject', goals, 10);
    } else {
      await line(`${v} < ${LIMIT} → forward to API servers → 200 OK`, 'ok');
      setStatus(200);
      await line(`> INCR ${KEY}`, 'in');
      if (!st.key) st.key = { v: 0, exp: null };
      st.key.v++; render();
      await line(`(integer) ${st.key.v}`, 'ok');
      if (st.key.v === 1) {
        await line(`> EXPIRE ${KEY} ${TTL}`, 'in');
        st.key.exp = st.t + TTL; render();
        await line('(integer) 1   // key will vanish in 60 s', 'ok');
      }
      if (st.expiredAfterReject) checkGoal('#s1goals', 'reset', goals, 10);
    }
    st.t += 4; render();
    st.busy = false; setBtns(true); maybeQuiz();
  };
  $('#rWait').onclick = async () => {
    if (st.busy) return; st.busy = true; setBtns(false);
    st.t += 60;
    const gone = expireIfDue(); render();
    if (gone) { await line(`// 60 s pass. TTL hits 0, so Redis deletes ${KEY} by itself. A new window starts with the next request.`, 'nil'); if (st.sawReject) st.expiredAfterReject = true; }
    else await line('// 60 s pass. There was no key to expire.', 'nil');
    st.busy = false; setBtns(true);
  };
  $('#rReset').onclick = () => {
    if (st.busy) return;
    Object.assign(st, { t: 0, key: null, sawReject: false, expiredAfterReject: false });
    log.innerHTML = '<div class="nil">// Redis console reset. Each request runs the commands below.</div>';
    $('#rStatus').textContent = 'no request yet'; $('#rStatus').className = 'status';
    render();
  };
  render();

  /* ---- spot the bug ---- */
  const CODE = [
    `count = GET ${KEY}`,
    `if count >= 5: return 429`,
    `n = INCR ${KEY}`,
    `if n == 1: EXPIRE ${KEY} 60`,
    `forward to API servers`,
  ];
  const bug = { p: 0, crashed: false, played: false, key: null, busy: false };
  const blog = $('#bugLog');
  function renderCode() {
    $('#bugCode').innerHTML = CODE.map((c, i) => {
      const cls = bug.crashed ? (i === 3 || i === 4 ? ' skipped' : ' ran') : (i === bug.p ? ' cur' : i < bug.p ? ' ran' : '');
      return `<div class="ln${cls}"><span class="no">${i + 1}</span>${esc(c)}</div>${i === 2 ? `<div class="gap${!bug.crashed && bug.p === 3 ? ' on' : ''}">⚠ danger zone: the key exists but has no TTL yet</div>` : ''}`;
    }).join('');
  }
  function renderBugKey() {
    const k = bug.key;
    $('#bugKey').innerHTML = `<span>${KEY} = <b>${k ? k.v : '(nil)'}</b></span><span>TTL = ${k ? (k.exp == null ? '<b class="bad">-1 (never expires)</b>' : '<b class="good">60 s</b>') : '—'}</span>${bug.crashed ? '<span>server: <b class="bad">restarted</b></span>' : ''}`;
  }
  function resetBug() {
    Object.assign(bug, { p: 0, crashed: false, played: false, key: null, busy: false });
    blog.innerHTML = '<div>Fresh window: rl:user42 doesn\'t exist yet.</div>';
    $('#bugStep').disabled = false; $('#bugStep').textContent = '▶ Run next line'; $('#bugKill').disabled = false;
    $('#bugNext').style.display = 'none';
    renderCode(); renderBugKey();
  }
  $('#bugStep').onclick = () => {
    if (bug.crashed || bug.busy) return;
    if (bug.p > 4) { resetBug(); return; }
    const p = bug.p;
    if (p === 0) logTo(blog, 'GET → (nil), so count = 0');
    if (p === 1) logTo(blog, '0 < 5, so carry on');
    if (p === 2) { bug.key = { v: 1, exp: null }; logTo(blog, 'INCR → 1. The key now exists, with <b>no TTL yet</b>. Now is the moment.', 'w'); }
    if (p === 3) { bug.key.exp = 60; logTo(blog, 'EXPIRE ran: TTL 60 s. Safe this time.', 'g'); }
    if (p === 4) { logTo(blog, 'Forwarded. Nothing crashed, so this run was fine. Start over and pull the plug right after INCR.'); $('#bugStep').textContent = '↻ Start over'; }
    bug.p++; renderCode(); renderBugKey();
  };
  $('#bugKill').onclick = async () => {
    const kb = $('#bugKill');
    if (bug.crashed || bug.busy) return;
    if (bug.p !== 3) {
      nudge(kb);
      logTo(blog, bug.p < 3 ? 'Nothing bad happens if it dies now: Redis has no key yet. The risky gap is after INCR (line 3) and before EXPIRE (line 4).' : 'Too late: EXPIRE already ran, so the key will expire. Start over.', 'w');
      return;
    }
    bug.busy = true; bug.crashed = true;
    const code = $('#bugCode'); code.classList.remove('crash'); void code.offsetWidth; code.classList.add('crash');
    $('#bugStep').disabled = true; kb.disabled = true;
    renderCode();
    logTo(blog, '💥 The middleware server crashed between INCR and EXPIRE.', 'e');
    await pause(700);
    logTo(blog, '🔁 It restarts. Redis didn\'t crash, so it still holds rl:user42 = 1, with TTL -1 (no expiry).', 'w');
    renderBugKey();
    Q.addXP(15, kb);
    bug.busy = false;
    $('#bugNext').style.display = '';
  };
  $('#bugFF').onclick = async () => {
    if (bug.played || bug.busy) return;
    bug.busy = true; bug.played = true; $('#bugFF').disabled = true;
    for (let v = 2; v <= 5; v++) { bug.key.v = v; renderBugKey(); logTo(blog, `t = ${v * 8} s: user42 sends a request → INCR → ${v}. (n isn't 1, so no EXPIRE.)`); await pause(380); }
    logTo(blog, 't = 60 s: a healthy key would vanish now. This one has no TTL, so it stays.', 'w'); await pause(650);
    logTo(blog, 't = 2 min: user42 tries again → GET → 5 → <b>429</b>.', 'e'); await pause(650);
    logTo(blog, '3 days later: GET → 5 → <b>429</b>. user42 is locked out for good, until someone deletes the key by hand.', 'e');
    await pause(400);
    bug.busy = false;
    Q.quiz($('#s1fix'), {
      tag: 'Pick the fix',
      q: 'How do you make sure this can never happen again?',
      options: ['Run INCR and EXPIRE together in one atomic Lua script', 'Raise the EXPIRE timeout from 60 to 600 seconds', 'Move the counters out of Redis into a MySQL table'],
      correct: 0,
      good: '<b>Atomic</b> means all-or-nothing: both commands happen, or neither does. Redis runs a Lua script as one step, so no crash can land between INCR and EXPIRE. A <code>MULTI</code>/<code>EXEC</code> transaction works too.',
      bad: 'A longer TTL doesn\'t help, because the TTL was never set at all. MySQL brings back slow disk access and has no built-in expiry. The fix is to make INCR and EXPIRE <b>atomic</b> (all-or-nothing), for example in one Lua script or a <code>MULTI</code>/<code>EXEC</code> transaction.',
      onDone: () => { fixDone = true; maybeQuiz(); },
    });
  };
  resetBug();

  function maybeQuiz() {
    if (quizShown || !fixDone) return;
    if (goals.size < 2) { $('#s1wait').style.display = ''; return; }
    $('#s1wait').style.display = 'none';
    quizShown = true;
    setTimeout(() => Q.quiz($('#s1quiz'), {
      q: 'Why does the book keep the counters in Redis and not in the main database?',
      options: ['It lives in memory and keys can expire on their own', 'Only Redis can add one to a stored number safely', 'A database cannot hold one counter for every user'],
      correct: 0,
      good: 'Speed and expiry. The check runs on every request, so it must be fast, and memory beats disk by a wide margin. And <code>EXPIRE</code> ends each window for free, with no cleanup job.',
      bad: 'A database can count, and it can hold millions of rows. The problem is speed: it reads from disk, and this check runs on every request. Redis lives in memory, and <code>EXPIRE</code> ends each window for free.',
      onDone: () => setTimeout(() => Q.clearStage(1), 900),
    }), 400);
  }
});

/* ================= STAGE 2: write the rules ================= */
Q.onStage(2, () => {
  const FIELDS = {
    domain: ['auth', 'messaging', 'search'],
    key: ['auth_type', 'message_type', 'search_type'],
    value: ['keyword', 'login', 'marketing', 'signup'],
    unit: ['second', 'minute', 'hour', 'day'],
    requests_per_unit: ['1', '5', '60', '100', '500'],
  };
  const RULES = [
    { en: 'No more than <b>5 marketing messages</b> per <b>day</b>.', src: 'Book example 1', ico: '✉️', ev: 'marketing message', ans: { domain: 'messaging', key: 'message_type', value: 'marketing', unit: 'day', requests_per_unit: '5' } },
    { en: 'A client can\'t <b>log in</b> more than <b>5 times</b> in <b>1 minute</b>.', src: 'Book example 2', ico: '🔑', ev: 'login', ans: { domain: 'auth', key: 'auth_type', value: 'login', unit: 'minute', requests_per_unit: '5' } },
    { en: 'No more than <b>100 keyword searches</b> per <b>hour</b>.', src: 'New rule: your turn', ico: '🔍', ev: 'search', ans: { domain: 'search', key: 'search_type', value: 'keyword', unit: 'hour', requests_per_unit: '100' } },
  ];
  const HINT = {
    domain: () => '<b>domain</b> is the part of the product the rule covers: messaging, logins (auth) or search.',
    key: () => '<b>key</b> names a kind of request, and it matches the domain: message_type, auth_type or search_type.',
    value: () => '<b>value</b> picks the one specific kind of request this rule is about.',
    unit: (a, c) => `Read the rule again. <b>unit</b>: it says per ${a}, and per ${c || '—'} ≠ per ${a}.`,
    requests_per_unit: () => '<b>requests_per_unit</b>: how many are allowed in each unit of time?',
  };
  let ri = 0;
  const sel = f => `<select data-f="${f}" aria-label="${f}"><option value="">—</option>${FIELDS[f].map(o => `<option>${o}</option>`).join('')}</select>`;
  function pips(done) { $$('#pips i').forEach((p, i) => p.className = i < done ? 'done' : i === ri ? 'on' : ''); }
  function show() {
    const r = RULES[ri];
    let missed = false, built = false;
    pips(ri);
    $('#ruleWrap').innerHTML = `<div class="rulecard"><div class="src">Rule ${ri + 1} of 3 · ${r.src}</div><p>${r.en}</p></div>
      <div class="yaml" id="yaml">
        <div class="yl f"><span class="k">domain</span>:${sel('domain')}</div>
        <div class="yl"><span class="k">descriptors</span>:</div>
        <div class="yl f">  - <span class="k">key</span>:${sel('key')}</div>
        <div class="yl f">    <span class="k">value</span>:${sel('value')}</div>
        <div class="yl">    <span class="k">rate_limit</span>:</div>
        <div class="yl f">      <span class="k">unit</span>:${sel('unit')}</div>
        <div class="yl f">      <span class="k">requests_per_unit</span>:${sel('requests_per_unit')}</div>
      </div>
      <ul class="hints" id="hints"></ul>
      <div class="row" style="margin-top:12px" id="ruleRow"><button class="btn primary" id="ruleCheck">Check my YAML</button></div>
      <div id="evWrap"></div>`;
    const sels = $$('#yaml select');
    sels.forEach(s => s.onchange = () => { s.classList.remove('wrong'); });
    $('#ruleCheck').onclick = () => {
      if (built) return;
      const bad = [];
      sels.forEach(s => {
        const f = s.dataset.f, ok = s.value === r.ans[f];
        s.classList.toggle('wrong', !ok); s.classList.toggle('right', ok);
        if (!ok) bad.push(f);
      });
      const hl = $('#hints');
      if (bad.length) {
        hl.innerHTML = bad.map(f => `<li>${HINT[f](r.ans[f], (sels.find(s => s.dataset.f === f) || {}).value)}</li>`).join('');
        nudge($('#ruleCheck'));
        if (!missed) { missed = true; Q.loseHeart($('#ruleCheck')); }
        else Q.toast('try again', $('#ruleCheck'), 'practice');
        return;
      }
      built = true;
      hl.innerHTML = '';
      sels.forEach(s => s.disabled = true);
      $('#yaml').classList.add('ok');
      Q.addXP(15, $('#ruleCheck'));
      $('#ruleCheck').remove();
      const n = +r.ans.requests_per_unit;
      nextBtn($('#ruleRow'), `🧪 Test it: fire ${n + 1} ${r.ev}${n + 1 === 1 ? '' : (r.ev.endsWith('h') ? 'es' : 's')}`, e => runTest(e.currentTarget));
    };
    async function runTest(btn) {
      btn.disabled = true;
      const n = +r.ans.requests_per_unit, w = $('#evWrap');
      if (n <= 10) {
        w.innerHTML = '<div class="evs" id="evs"></div>';
        for (let i = 1; i <= n; i++) { $('#evs').insertAdjacentHTML('beforeend', `<span class="ev">${r.ico} ${i} ✓</span>`); await pause(200); }
      } else {
        w.innerHTML = `<div class="meter"><div class="mt"><div class="mf" id="mf"></div></div><span id="mc">0 / ${n}</span></div><div class="evs" id="evs"></div>`;
        await tween(1300, p => { const c = Math.round(n * p); $('#mf').style.width = (c / n * 100) + '%'; $('#mc').textContent = `${c} / ${n}`; });
      }
      await pause(250);
      $('#evs').insertAdjacentHTML('beforeend', `<span class="ev no">${r.ico} ${n + 1} → 429</span>`);
      w.insertAdjacentHTML('beforeend', `<p class="small" style="margin:8px 0 0">The first ${n} pass. Number ${n + 1} goes over <code>requests_per_unit: ${n}</code> for this <code>unit: ${r.ans.unit}</code>, so it bounces with a 429. The count starts again in the next ${r.ans.unit}.</p>`);
      Q.addXP(5, btn);
      btn.remove();
      pips(ri + 1);
      if (ri < RULES.length - 1) nextBtn($('#ruleRow'), 'Next rule →', () => { ri++; show(); });
      else {
        $('#ruleRow').insertAdjacentHTML('beforeend', '<span class="small"><b>All three rules written and tested.</b></span>');
        nextBtn($('#ruleRow'), '↻ Write them again', () => { ri = 0; show(); }, false);
        Q.clearStage(2);
      }
    }
  }
  show();
});

/* ================= STAGE 3: tell the client ================= */
Q.onStage(3, () => {
  const LIMIT = 5, RESET = 60;
  const REQS = [0, 5, 10, 15, 20, 25].map((t, i) => ({ n: i + 1, t, status: i < LIMIT ? '200' : '429', limit: '5', rem: String(i < LIMIT ? LIMIT - 1 - i : 0), retry: i < LIMIT ? '' : String(RESET - t) }));
  let cur = 1; // index of the request being answered (0 is the worked example)
  const done = new Set([0]);
  const svg = $('#tlSvg');
  const tx = t => 22 + t * 5;
  function drawTL() {
    svg.innerHTML = '';
    S('rect', { class: 'win', x: tx(0), y: 18, width: tx(60) - tx(0), height: 18, rx: 9 }, svg);
    S('text', { class: 'ax', x: tx(0), y: 56 }, svg).textContent = 't = 0 s';
    const e = S('text', { class: 'ax', x: tx(60), y: 56, 'text-anchor': 'end' }, svg); e.textContent = 'window resets at 60 s';
    REQS.forEach((r, i) => {
      const c = S('circle', { class: 'tk' + (done.has(i) ? (r.status === '200' ? ' ok' : ' no') : i === cur ? ' cur' : ''), cx: tx(r.t), cy: 27, r: 9 }, svg);
      S('text', { class: 'tn', x: tx(r.t), y: 27 }, svg).textContent = r.n;
      void c;
    });
  }
  const blank = v => ['', '-', '—', 'none', 'n/a'].includes(String(v).trim().toLowerCase());
  function respHTML(r, worked) {
    const d = worked ? ' disabled' : '';
    return `<div class="resp${worked ? ' worked' : ''}" data-n="${r.n}">
      <div class="rh"><span>Request #${r.n} · t = ${r.t} s</span><span class="muted">GET /api/feed</span></div>
      <div class="rb">
        <div class="hl"><span class="hk">HTTP/1.1</span><select data-f="status" aria-label="Status code"${d}><option value="">— status —</option><option value="200"${worked ? ' selected' : ''}>200 OK</option><option value="429">429 Too Many Requests</option></select></div>
        <div class="hl"><span class="hk">X-Ratelimit-Limit:</span><input data-f="limit" inputmode="numeric" aria-label="X-Ratelimit-Limit" value="${worked ? r.limit : ''}"${d}></div>
        <div class="hl"><span class="hk">X-Ratelimit-Remaining:</span><input data-f="rem" inputmode="numeric" aria-label="X-Ratelimit-Remaining" value="${worked ? r.rem : ''}"${d}></div>
        <div class="hl"><span class="hk">X-Ratelimit-Retry-After:</span><input data-f="retry" inputmode="numeric" aria-label="X-Ratelimit-Retry-After (leave blank if not sent)" placeholder="blank = not sent" value=""${d}></div>
        ${worked ? '<p class="note">Worked example: the first request of the window. Allowed (200). The limit is 5, and after this one 4 are left. No Retry-After, because nothing was refused.</p>' : '<div class="row" style="margin-top:8px"><button class="btn primary q-chk">Send this response</button></div><div class="explain"></div>'}
      </div></div>`;
  }
  function logLine(r) {
    const d = document.createElement('div'); d.className = r.status === '429' ? 'no' : '';
    d.textContent = `#${r.n} t=${r.t}s → ${r.status} · Limit ${r.limit} · Remaining ${r.rem}${r.retry ? ' · Retry-After ' + r.retry : ''}`;
    $('#respLog').appendChild(d);
  }
  function hint(f, r) {
    if (f === 'status') return `Count it: this is request #${r.n} in a window that allows ${LIMIT}.`;
    if (f === 'limit') return 'Limit never changes from one response to the next: it\'s how many calls the window allows.';
    if (f === 'rem') return r.status === '429' ? 'This request was refused, and nothing is left in the window.' : `Remaining = allowed requests left in this window after this one. #${r.n} of ${LIMIT} just went through.`;
    return r.status === '429' ? `Seconds until the window resets. It resets at t = ${RESET} s, and it's now t = ${r.t} s.` : 'This one went through, so there\'s nothing to wait for. Leave Retry-After blank (not sent).';
  }
  function showReq() {
    drawTL();
    const r = REQS[cur], wrap = $('#respWrap');
    wrap.innerHTML = respHTML(REQS[0], true) + (cur < REQS.length ? respHTML(r, false) : '');
    if (cur >= REQS.length) return;
    const box = $(`.resp[data-n="${r.n}"]`, wrap);
    let missed = false;
    $$('select, input', box).forEach(el => el.addEventListener('input', () => el.classList.remove('wrong')));
    $('.q-chk', box).onclick = e => {
      const btn = e.currentTarget, bad = [];
      $$('select, input', box).forEach(el => {
        const f = el.dataset.f, want = r[f];
        const ok = f === 'retry' ? (want === '' ? blank(el.value) : el.value.trim() === want) : el.value.trim() === want;
        el.classList.toggle('wrong', !ok); el.classList.toggle('right', ok);
        if (!ok) bad.push(f);
      });
      const ex = $('.explain', box);
      if (bad.length) {
        ex.className = 'explain show bad';
        ex.innerHTML = '<b>Not quite.</b> ' + bad.map(f => hint(f, r)).join(' ');
        nudge(btn);
        if (!missed) { missed = true; Q.loseHeart(btn); } else Q.toast('try again', btn, 'practice');
        return;
      }
      btn.disabled = true;
      Q.addXP(8, btn);
      done.add(cur); logLine(r);
      cur++;
      if (cur < REQS.length) { setTimeout(showReq, Q.reduced ? 0 : 450); return; }
      drawTL();
      ex.className = 'explain show good';
      ex.innerHTML = '<b>All six right.</b> Five allowed, Remaining counting down 4, 3, 2, 1, 0. The sixth bounced with a 429 and Retry-After 35: the window resets at 60 s, and it was 25 s.';
      startClient();
    };
  }
  logLine(REQS[0]);
  showReq();

  /* ---- client behaviour ---- */
  let clientStarted = false;
  const lx = t => 74 + (t - 25) * 6.8;
  function drawLanes() {
    const L = $('#lanes'); L.innerHTML = '';
    S('text', { class: 'ln-lbl', x: 4, y: 52 }, L).textContent = 'Impatient';
    S('text', { class: 'ln-sub', x: 4, y: 65 }, L).textContent = 'retry every 0.5 s';
    S('text', { class: 'ln-lbl', x: 4, y: 104 }, L).textContent = 'Polite';
    S('text', { class: 'ln-sub', x: 4, y: 117 }, L).textContent = 'wait 35 s + jitter';
    S('line', { class: 'track', x1: lx(25), y1: 55, x2: lx(65), y2: 55 }, L);
    S('line', { class: 'track', x1: lx(25), y1: 107, x2: lx(65), y2: 107 }, L);
    S('line', { class: 'reset', x1: lx(60), y1: 22, x2: lx(60), y2: 124 }, L);
    S('text', { class: 'rlbl', x: lx(60) - 10, y: 16 }, L).textContent = 'window resets';
    [25, 35, 45, 55, 65].forEach(t => { S('text', { class: 'ax', x: lx(t), y: 137 }, L).textContent = t + 's'; });
    S('circle', { class: 'd-no', cx: lx(25), cy: 55, r: 4.5 }, L);
    S('circle', { class: 'd-no', cx: lx(25), cy: 107, r: 4.5 }, L);
    const g = S('g', { id: 'laneDots' }, L); void g;
    $('#lnBad').textContent = '0'; $('#lnGood').textContent = '0';
  }
  async function playLanes() {
    drawLanes();
    const g = $('#laneDots');
    const wait = S('line', { class: 'wait', x1: lx(25), y1: 107, x2: lx(25), y2: 107 }, g);
    let shown = 0, okBad = false, okGood = false;
    const RETRIES = []; for (let t = 25.5; t < 60; t += 0.5) RETRIES.push(t);
    await tween(3200, p => {
      const now = 25 + 40 * p;
      while (shown < RETRIES.length && RETRIES[shown] <= now) { S('circle', { class: 'd-no', cx: lx(RETRIES[shown]), cy: 55, r: 1.7 }, g); shown++; $('#lnBad').textContent = shown; }
      if (!okBad && now >= 60) { okBad = true; S('circle', { class: 'd-ok', cx: lx(60), cy: 55, r: 5.5 }, g); }
      wait.setAttribute('x2', lx(Math.min(now, 62.1)));
      if (!okGood && now >= 62.1) { okGood = true; S('circle', { class: 'd-ok', cx: lx(62.1), cy: 107, r: 5.5 }, g); }
    });
    return shown;
  }
  function startClient() {
    if (clientStarted) return; clientStarted = true;
    $('#clientPart').style.display = '';
    drawLanes();
    predict($('#lanePred'), {
      step: 'Predict, then watch',
      title: 'Both clients got that 429 at t = 25 s. Which one gets its next <b>200 OK</b> first?',
      options: ['The impatient one, by about 30 seconds', 'The polite one, by about 30 seconds', 'Neither: both get in at about t = 60 s'],
      correct: 2,
      xp: 20,
      act: playLanes,
      explain: 'Nobody can beat the window: it opens at t = 60 s for everyone. The impatient client got in at 60 s, and the polite one about 2 s later. But the impatient one sent <b>69 extra requests</b> that all bounced, burning its user\'s battery and your server\'s capacity. Some APIs treat that hammering as abuse and block the client for longer.',
    }).then(({ row }) => {
      nextBtn(row, '↻ Replay the race', () => playLanes(), false);
      showBP();
    });
  }
  /* ---- best practices ---- */
  const BP = [
    { t: 'Cache API responses on the client to avoid repeat calls', ok: true },
    { t: 'Know the limit, and don\'t send bursts in a short time', ok: true },
    { t: 'Catch errors and exceptions so the client recovers gracefully', ok: true },
    { t: 'Add enough back-off time to the retry logic', ok: true },
    { t: 'On a 429, retry immediately in a tight loop until it works', ok: false },
    { t: 'Open more parallel connections so requests get through faster', ok: false },
  ];
  let bpShown = false, bpMissed = false, bpDone = false;
  function showBP() {
    if (bpShown) return; bpShown = true;
    $('#bpPart').style.display = '';
    $('#bp').innerHTML = shuffle(BP.map((b, i) => ({ b, i }))).map(({ b, i }) => `<button class="opt" data-i="${i}" aria-pressed="false">${b.t}</button>`).join('');
    const btns = $$('#bp .opt');
    const picked = () => btns.filter(b => b.getAttribute('aria-pressed') === 'true');
    btns.forEach(b => b.onclick = () => {
      if (bpDone) return;
      btns.forEach(x => x.classList.remove('right', 'wrong', 'miss'));
      const on = b.getAttribute('aria-pressed') !== 'true';
      if (on && picked().length >= 4) { Q.toast('pick 4', b, 'practice'); return; }
      b.setAttribute('aria-pressed', on);
      $('#bpCheck').disabled = picked().length !== 4;
    });
    $('#bpCheck').onclick = () => {
      if (bpDone) return;
      const pk = picked(), ex = $('#bpEx');
      const wrong = pk.filter(b => !BP[+b.dataset.i].ok);
      if (wrong.length) {
        wrong.forEach(b => b.classList.add('wrong'));
        btns.filter(b => BP[+b.dataset.i].ok && b.getAttribute('aria-pressed') !== 'true').forEach(b => b.classList.add('miss'));
        ex.className = 'explain show bad';
        ex.innerHTML = '<b>Not quite.</b> Retrying in a loop and opening more connections both send <i>more</i> traffic at a server that just asked for less. The dashed cards are the ones you missed. Swap and check again.';
        if (!bpMissed) { bpMissed = true; Q.loseHeart($('#bpCheck')); } else Q.toast('try again', $('#bpCheck'), 'practice');
        return;
      }
      bpDone = true;
      pk.forEach(b => b.classList.add('right'));
      btns.forEach(b => b.disabled = true); $('#bpCheck').disabled = true;
      ex.className = 'explain show good';
      ex.innerHTML = '<b>Exactly the book\'s list.</b> Cache what you can, respect the limit, handle errors so the app doesn\'t crash, and back off before retrying. When the server sends a Retry-After, that number comes first.';
      Q.addXP(20, $('#bpCheck'));
      setTimeout(() => Q.clearStage(3), 900);
    };
  }
});

/* ================= STAGE 4: the detailed design ================= */
Q.onStage(4, () => {
  const W = 150, H = 60;
  const BOX = {
    rules:   { x: 10,  y: 10,  t: '📄 Rules', s: 'config files on disk' },
    workers: { x: 205, y: 10,  t: '⚙️ Workers', s: 'pull rules often' },
    cache:   { x: 205, y: 118, t: '⚡ Cache', s: 'copy of the rules' },
    redis:   { x: 400, y: 118, t: '🧮 Redis', s: 'counters' },
    client:  { x: 10,  y: 226, t: '📱 Client', s: 'app or browser' },
    mw:      { x: 205, y: 226, t: '🚦 Rate limiter', s: 'middleware' },
    api:     { x: 400, y: 226, t: '🖥️ API servers', s: 'the real work' },
    queue:   { x: 205, y: 334, t: '📬 Message queue', s: 'run later' },
  };
  const C = k => [BOX[k].x + W / 2, BOX[k].y + H / 2];
  const ARROWS = [
    { id: 'rw', a: 'rules', b: 'workers', d: 'M160 40 L201 40' },
    { id: 'wc', a: 'workers', b: 'cache', d: 'M280 70 L280 114' },
    { id: 'cm', a: 'cache', b: 'mw', d: 'M280 178 L280 222' },
    { id: 'cl', a: 'client', b: 'mw', d: 'M160 246 L201 246' },
    { id: 'bk', a: 'client', b: 'mw', d: 'M205 270 L164 270', cls: 'bad' },
    { id: 'mr', a: 'mw', b: 'redis', d: 'M335 224 L418 182', two: true },
    { id: 'ma', a: 'mw', b: 'api', d: 'M355 256 L396 256' },
    { id: 'mq', a: 'mw', b: 'queue', d: 'M280 286 L280 330', cls: 'warn' },
  ];
  const TILES = [
    { k: 'client', t: 'Client', s: 'sends the requests' },
    { k: 'mw', t: 'Rate limiter middleware', s: 'checks every request', need: 'client', why: 'Middleware in front of what? Draw who sends the requests first.' },
    { k: 'api', t: 'API servers', s: 'do the real work', need: 'mw', why: 'Requests reach the API servers <i>through</i> the limiter. Draw the middleware first.' },
    { k: 'redis', t: 'Redis', s: 'counters', need: 'mw', why: 'Who reads these counters? Put the middleware on the board first.' },
    { k: 'rules', t: 'Rules', s: 'config files on disk' },
    { k: 'workers', t: 'Workers', s: 'pull the rules', need: 'rules', why: 'Workers pull rules from disk, and there are no rules on the board yet.' },
    { k: 'cache', t: 'Cache', s: 'a copy of the rules', need: 'workers', why: 'Something has to fill this cache. Draw whatever copies the rules into it first.' },
    { k: 'queue', t: 'Message queue', s: 'requests for later', need: 'mw', why: 'Who sends requests into this queue? Draw the middleware first.' },
    { k: 'cdn', t: 'CDN', s: 'for static images', bad: 'A CDN serves static files (images, scripts) from servers near the user. Useful, but it has nothing to do with deciding whether a request is over the limit.' },
    { k: 'sql', t: 'SQL database', s: 'for the counters', bad: 'That\'s stage 1\'s trap. A database reads from disk, which is too slow for a check on <b>every</b> request, and it has no built-in expiry. Counters go in Redis.' },
  ];
  const SAY = {
    client: 'Every request starts at the <b>client</b>: a phone app, a browser, or another service.',
    mw: 'The <b>rate limiter middleware</b> sees every request <i>before</i> the API servers do. When it says no, it sends a 429 back (red dashed arrow).',
    api: 'Requests under the limit go on to the <b>API servers</b>.',
    redis: 'The middleware fetches the <b>counters</b> (and the last request\'s timestamp) from <b>Redis</b>, then updates them.',
    rules: '<b>Rules</b> live in config files on disk, like the YAML you wrote in stage 2.',
    workers: '<b>Workers</b> pull the rules from disk often, so an edit gets picked up.',
    cache: 'Workers store the rules in a <b>cache</b>. The middleware reads its rules from here, never straight from disk.',
    queue: 'Over-limit requests are either <b>dropped</b> or sent to a <b>message queue</b> to be processed later.',
  };
  const svg = $('#wb');
  let placed, lost, phase;
  function build() {
    svg.innerHTML = `<defs>${['', 'bad', 'warn'].map(c => `<marker id="ah${c}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="ah ${c}"/></marker>`).join('')}</defs>`;
    const ag = S('g', {}, svg), bg = S('g', {}, svg);
    ARROWS.forEach(a => {
      const p = S('path', { class: 'part arrow ' + (a.cls || ''), id: 'ar-' + a.id, d: a.d, 'marker-end': `url(#ah${a.cls || ''})` }, ag);
      if (a.two) p.setAttribute('marker-start', 'url(#ah)');
    });
    Object.entries(BOX).forEach(([k, b]) => {
      const g = S('g', { class: 'part box', id: 'bx-' + k }, bg);
      S('rect', { x: b.x, y: b.y, width: W, height: H, rx: 12 }, g);
      S('text', { class: 'bt', x: b.x + W / 2, y: b.y + 27 }, g).textContent = b.t;
      S('text', { class: 'bs', x: b.x + W / 2, y: b.y + 46 }, g).textContent = b.s;
    });
    S('text', { class: 'note n', id: 'nCount', x: 85, y: 152 }, svg);
    S('text', { class: 'note', id: 'nResp', x: 85, y: 310 }, svg);
    S('text', { class: 'note q', id: 'nQueue', x: 475, y: 368 }, svg);
    S('text', { class: 'note no', id: 'nDrop', x: 280, y: 215 }, svg);
    S('g', { id: 'pkts' }, svg);
  }
  function setup() {
    placed = new Set(); lost = 0; phase = 'build';
    build();
    $('#wbMsg').className = 'wbmsg'; $('#wbMsg').innerHTML = 'The whiteboard is empty. Where does a request start?';
    $('#wbCount').textContent = '0 / 8'; $('#wbClock').textContent = '0';
    $('#wbMode').innerHTML = 'over-limit mode: <b>—</b>';
    $('#s4pred').innerHTML = ''; $('#s4quiz').innerHTML = ''; $('#s4replay').style.display = 'none';
    $('#tiles').innerHTML = shuffle(TILES).map(t => `<button class="opt" data-k="${t.k}">${t.t}<small>${t.s}</small></button>`).join('');
    $$('#tiles .opt').forEach(b => b.onclick = () => onTile(b));
  }
  function msg(html, cls) { const m = $('#wbMsg'); m.className = 'wbmsg' + (cls ? ' ' + cls : ''); m.innerHTML = html; }
  function onTile(b) {
    if (phase !== 'build' || b.disabled) return;
    const t = TILES.find(x => x.k === b.dataset.k);
    if (t.bad) { b.disabled = true; b.classList.add('wrong'); Q.loseHeart(b); msg('✗ ' + t.bad, 'bad'); return; }
    if (t.need && !placed.has(t.need)) { nudge(b); lost++; $('#wbClock').textContent = lost; msg(t.why + ' <span class="muted">(−1 min)</span>', 'nudge'); return; }
    placed.add(t.k); b.disabled = true; b.classList.add('right'); Q.addXP(4, b);
    $('#bx-' + t.k).classList.add('on');
    ARROWS.forEach(a => { if (placed.has(a.a) && placed.has(a.b)) $('#ar-' + a.id).classList.add('on'); });
    $('#wbCount').textContent = `${placed.size} / 8`;
    msg(SAY[t.k]);
    if (placed.size === 8) {
      phase = 'predict';
      $$('#tiles .opt').forEach(x => x.disabled = true);
      msg(`Complete: the book's detailed design${lost ? `, with ${lost} minute${lost === 1 ? '' : 's'} lost to ordering` : ', in a clean order'}. Now send some traffic through it.`);
      setTimeout(() => rounds(0), 500);
    }
  }
  /* ---- predict-then-watch ---- */
  function lit(k, on, cls = 'lit') { $('#bx-' + k).classList.toggle(cls, on); }
  function note(id, text) { $('#' + id).textContent = text || ''; }
  async function travel(keys, cls) {
    const pts = keys.map(C);
    const c = S('circle', { r: 9, class: 'pkt ' + cls, cx: pts[0][0], cy: pts[0][1] }, $('#pkts'));
    lit(keys[0], true);
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      await tween(Math.max(320, Math.hypot(x2 - x1, y2 - y1) * 3.4), p => { const k = ease(p); c.setAttribute('cx', x1 + (x2 - x1) * k); c.setAttribute('cy', y1 + (y2 - y1) * k); });
      lit(keys[i + 1], true);
    }
    await pause(200); c.remove();
  }
  function clearLit() { Object.keys(BOX).forEach(k => { lit(k, false); lit(k, false, 'hot'); }); ['nCount', 'nResp', 'nQueue', 'nDrop'].forEach(n => note(n, '')); }
  async function checkCounter(count) {
    lit('cache', true); note('nCount', 'rule: 5 / min'); await pause(450);
    await travel(['mw', 'redis', 'mw'], 'ok');
    note('nCount', `count = ${count}`);
    await pause(350);
  }
  const OPTS = ['Client → limiter → API servers: 200 OK', 'Client → limiter → back to client: 429', 'Client → limiter → queue, plus a 429'];
  const ROUNDS = [
    { mode: 'drop', title: 'user42 has made <b>2 requests</b> this minute. The rule allows 5. A 3rd request arrives. Which path does it take?', correct: 0,
      act: async () => { clearLit(); await travel(['client', 'mw'], 'ok'); await checkCounter('2 → 3'); await travel(['mw', 'api'], 'ok'); note('nResp', '200 OK'); $('#nResp').setAttribute('class', 'note ok'); },
      explain: 'The middleware loads the rule from the cache, gets the counter from Redis (2 is under 5), and forwards the request to the API servers. The counter goes up to 3.' },
    { mode: 'drop', title: 'Same rule. user42 tries a <b>6th login</b> inside one minute. Over-limit mode for logins is <b>drop</b>.', correct: 1,
      act: async () => { clearLit(); await travel(['client', 'mw'], 'ok'); await checkCounter('5 ≥ 5'); lit('mw', true, 'hot'); note('nDrop', '✗ dropped'); await travel(['mw', 'client'], 'no'); note('nResp', '429 + headers'); $('#nResp').setAttribute('class', 'note no'); },
      explain: 'Over the limit, so the request never reaches the API servers. The client gets a 429 with the rate-limit headers (Retry-After included), and the request is dropped.' },
    { mode: 'enqueue', title: 'During a flash sale a <b>checkout order</b> arrives, and orders are over their limit. Over-limit mode for orders is <b>enqueue</b>.', correct: 2,
      act: async () => { clearLit(); await travel(['client', 'mw'], 'ok'); await checkCounter('limit hit'); lit('mw', true, 'hot'); await Promise.all([travel(['mw', 'client'], 'no'), travel(['mw', 'queue'], 'q')]); note('nResp', '429'); $('#nResp').setAttribute('class', 'note no'); note('nQueue', '⏳ 1 order waiting'); },
      explain: 'The client still gets a 429 right away, but the order isn\'t thrown out. It goes into the message queue and is processed later, when there\'s room. That\'s the book\'s example: keep orders that were limited because the system was overloaded.' },
  ];
  async function rounds(i) {
    const r = ROUNDS[i];
    $('#wbMode').innerHTML = `over-limit mode: <b>${r.mode}</b>`;
    const { row } = await predict($('#s4pred'), { step: `Request ${i + 1} of 3 · predict, then watch`, title: r.title, options: OPTS, correct: r.correct, act: r.act, explain: r.explain });
    nextBtn(row, i < ROUNDS.length - 1 ? 'Next request →' : 'One last question →', () => {
      if (i < ROUNDS.length - 1) return rounds(i + 1);
      row.innerHTML = '';
      Q.quiz($('#s4quiz'), {
        q: 'Why do workers copy the rules from disk into a cache?',
        options: ['So the limiter never reads the disk on each request', 'So rules can be changed without editing any file', 'So each API server can keep its own private rules'],
        correct: 0,
        good: 'The middleware needs a rule for every request. Reading it from memory is fast. Reading it from disk every time would be slow. The workers do the slow disk reads in the background, every so often.',
        bad: 'Rules are still edited in files on disk, and they\'re shared. The point is speed: the middleware needs a rule for every request, so it reads them from the in-memory cache. The workers do the slow disk reads in the background.',
        onDone: () => { $('#s4replay').style.display = ''; setTimeout(() => Q.clearStage(4), 900); },
      });
    });
  }
  $('#s4replay .btn').onclick = setup;
  setup();
});

/* ================= STAGE 5: boss ================= */
Q.onStage(5, () => Q.boss($('#boss'), {
  name: '🗿 Header Golem',
  xp: 15,
  scenarios: [
    { e: '🔒', t: 'Locked out for days', d: 'Support ticket: user 981 has been getting 429s since Monday. In Redis, <code>rl:user981</code> = 5 and its TTL is -1. Most likely cause?', a: 'crash',
      choices: [{ k: 'crash', label: 'Non-atomic INCR + EXPIRE', sub: 'a crash skipped EXPIRE' }, { k: 'low', label: 'Limit set too low', sub: '5 per minute is strict' }, { k: 'full', label: 'Redis ran out of memory', sub: 'it evicted the wrong keys' }],
      why: 'TTL -1 means the key never expires, so the window never ends. That\'s the classic sign that INCR ran but EXPIRE didn\'t. Run the pair atomically, in a Lua script or a MULTI/EXEC transaction.' },
    { e: '📝', t: 'Ops edits a rule', d: 'Ops raises the login limit from 5 to 10 per minute by editing the config file on disk. How does the middleware see the change?', a: 'workers',
      choices: [{ k: 'workers', label: 'Workers refresh the cache', sub: 'they pull rules from disk often' }, { k: 'disk', label: 'Middleware reads disk', sub: 'on every single request' }, { k: 'restart', label: 'Restart every server', sub: 'rules load only at boot' }],
      why: 'In the book\'s design, workers pull the rules from disk often and store them in the cache. The middleware reads rules from that cache, so the edit shows up on the next refresh.' },
    { e: '🛒', t: 'Flash-sale orders', d: 'During a sale, checkout orders hit the limit because the order system is overloaded. Every lost order is lost money.', a: 'queue',
      choices: [{ k: 'queue', label: '429 + enqueue', sub: 'process the order later' }, { k: 'drop', label: '429 + drop', sub: 'the client can try again' }, { k: 'off', label: 'Turn the limiter off', sub: 'let every order through' }],
      why: 'This is the book\'s own example. Orders limited because of overload can go to a queue and be processed later. Turning the limiter off is how an overloaded system falls over completely.' },
    { e: '⏳', t: 'Retry-After: 30', d: 'Your mobile app gets a 429 with <code>X-Ratelimit-Retry-After: 30</code>. What should the app do?', a: 'wait',
      choices: [{ k: 'wait', label: 'Wait 30 s + jitter', sub: 'then retry' }, { k: 'now', label: 'Retry right away', sub: 'maybe it was a blip' }, { k: 'more', label: 'Open more connections', sub: 'to spread the load' }],
      why: 'Honour the header: wait at least 30 seconds, add a little random jitter so every phone doesn\'t retry at the same instant, then retry. Anything sooner just collects more 429s.' },
    { e: '🐘', t: '"We already have PostgreSQL"', d: 'A teammate asks: "Why add Redis just for counters? Our PostgreSQL database is right there."', a: 'mem',
      choices: [{ k: 'mem', label: 'Memory speed + expiry', sub: 'checked on every request' }, { k: 'sql', label: 'SQL can\'t count', sub: 'it has no + 1 update' }, { k: 'size', label: 'Too much data', sub: 'counters are enormous' }],
      why: 'The book\'s reason: disk access makes the database slow for a check that runs on every request. An in-memory cache like Redis is fast and has time-based expiry built in.' },
  ],
  outro: 'Counters in memory, set atomically. Rules on disk, cached by workers. A 429 with headers, then drop or queue.',
  onDone: () => Q.clearStage(5),
}));

/* ================= STAGE 6: interview drill ================= */
Q.onStage(6, () => Q.drill($('#drill'), {
  prompt: 'The interviewer: <i>"Walk me through what happens to one request in your rate limiter, from the client to the API server or back."</i>',
  placeholder: 'The request first hits the rate limiter middleware…',
  model: '"Rules live in config files on disk, and workers pull them into a cache, so the limiter never reads disk on the request path. A request first hits the rate limiter middleware. It loads the matching rule from the cache and gets this user\'s counter from Redis. Redis, because it\'s in memory and keys expire on their own: INCR adds one, EXPIRE ends the window, and I\'d run the pair atomically in a Lua script. If the user is under the limit, the request goes to the API servers and the counter goes up. If not, the client gets a 429 with X-Ratelimit-Limit, X-Ratelimit-Remaining and X-Ratelimit-Retry-After, and the request is dropped, or queued to run later if it\'s something like an order. On the client side: cache responses, respect the limit, handle errors, and back off with jitter before retrying."',
  checks: ['Rules on disk, pulled by workers into a cache', 'Counters in Redis with INCR and EXPIRE, done atomically', 'A 429 plus at least two of the rate-limit headers', 'Over-limit requests are dropped or queued for later'],
  onDone: () => Q.clearStage(6),
}));

Q.start();
})();
