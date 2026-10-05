/* System Design Quest — shared game engine.
 *
 * Every lesson loads this file and calls Quest.init({...}). The engine owns:
 *   - the HUD (back-to-map link, total XP + rank, hearts, clickable stage dots)
 *   - stage locking/unlocking, and saving progress after every change
 *   - resume (reload mid-quest → you're where you left off)
 *   - review mode (quest already cleared → replays are practice, no XP/hearts at stake)
 *   - no locks: every stage and every quest is open; order is suggested, never enforced
 *   - the victory card, prev/next lesson links, confetti
 *   - reusable widgets: quiz(), boss(), drill()
 *
 * Saved in localStorage under 'sdq:v1':
 *   { lessons: { "0001": { xp, stars, at } },          // best finished result per quest
 *     runs:    { "0002": { cleared: [1,2], xp, hearts } } } // an unfinished attempt
 */
(function () {
  'use strict';
  const STORE_KEY = 'sdq:v1';
  const RANKS = [[0, 'Intern'], [300, 'Junior'], [800, 'Mid-level'], [1500, 'Senior'], [2400, 'Staff'], [3200, 'Principal']];
  // One catalog for the quest map and the prev/next links. `file` is relative to lessons/.
  // `ready: true` once the lesson file exists and has been checked.
  const CATALOG = [
    { id: '0001', n: '6.1', t: 'The Key-Value Vault', d: 'put/get, single-server limits, CAP, CP vs AP', file: '0001-key-value-store-and-cap.html', ready: true },
    { id: '0002', n: '6.2', t: 'Slice the Keyspace', d: 'Data partition with consistent hashing', file: '0002-consistent-hashing.html', ready: true },
    { id: '0003', n: '6.3', t: 'Copies Everywhere', d: 'Data replication across nodes', file: '0003-replication.html', ready: true },
    { id: '0004', n: '6.4', t: 'Majority Rules', d: 'Quorum consensus (N, W, R) and tunable consistency', file: '0004-quorum-consensus.html', ready: true },
    { id: '0005', n: '6.5', t: 'Who Wrote Last?', d: 'Inconsistency resolution with versioning & vector clocks', file: '0005-vector-clocks.html', ready: true },
    { id: '0006', n: '6.6', t: 'When Nodes Die', d: 'Gossip, sloppy quorum, hinted handoff, Merkle trees', file: '0006-handling-failures.html', ready: true },
    { id: '0007', n: '6.7', t: 'The Write & Read Path', d: 'Commit log, memtable, SSTables, Bloom filters', file: '0007-write-and-read-path.html', ready: true },
    { id: '0008', n: 'BOSS', t: 'Design It Live', d: 'Full mock interview: design a key-value store', file: '0008-boss-design-it-live.html', boss: true, ready: true },
  ];

  const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      d.lessons = d.lessons || {}; d.runs = d.runs || {};
      return d;
    } catch (_) { return { lessons: {}, runs: {} }; }
  }
  function save(d) { try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (_) {} }
  function rankOf(xp) {
    let i = 0; RANKS.forEach((r, k) => { if (xp >= r[0]) i = k; });
    const lo = RANKS[i][0], hi = RANKS[i + 1] ? RANKS[i + 1][0] : lo + 1000;
    return { i, name: RANKS[i][1], lo, hi };
  }
  function totalXP(d, exceptId) { return Object.entries(d.lessons).reduce((s, [k, l]) => s + (k === exceptId ? 0 : (l.xp || 0)), 0); }
  function isUnlocked(d, id) {
    const i = CATALOG.findIndex(q => q.id === id);
    return true; // no locks — any quest can be opened in any order
  }

  function burst() {
    if (REDUCED) return;
    const cv = document.createElement('canvas'); cv.className = 'confetti'; document.body.appendChild(cv);
    const cx = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
    const cols = ['#5a48f0', '#0d9a96', '#f0b400', '#e5484d', '#43d98a', '#8f82ff'];
    const ps = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - .5) * 14, vy: Math.random() * -12 - 3, s: Math.random() * 6 + 4, c: cols[Math.random() * cols.length | 0], r: Math.random() * 6 }));
    let f = 0;
    (function tick() {
      cx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .35; p.vx *= .99; p.r += .1; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cx.restore(); });
      if (++f < 150) requestAnimationFrame(tick); else cv.remove();
    })();
  }

  /**
   * Quest.init(cfg) → Q
   * cfg: {
   *   id: '0002',                        // must match CATALOG
   *   badge: '🛡️ Badge: Ring Master',
   *   winTitle: 'Keyspace sliced',        // victory heading
   *   map: '../reference/quest-map.html', // optional
   *   cheatsheet: '../reference/kv-store-cap-cheatsheet.html' // optional
   * }
   * Then register stage setup with Q.onStage(n, fn) and finally call Q.start().
   */
  function init(cfg) {
    const id = cfg.id;
    const meta = CATALOG.find(q => q.id === id) || { n: '', t: document.title };
    const idx = CATALOG.indexOf(meta);
    const prevQ = idx > 0 ? CATALOG[idx - 1] : null, nextQ = idx >= 0 ? CATALOG[idx + 1] : null;
    const map = cfg.map || '../reference/quest-map.html';
    const stages = $$('.stage[data-stage]').sort((a, b) => a.dataset.stage - b.dataset.stage);
    const N = stages.length;
    const handlers = {}, inited = new Set();
    let d = load();
    let run, review = false, finished = false;

    if (d.runs[id]) run = { cleared: new Set(d.runs[id].cleared || []), xp: d.runs[id].xp || 0, hearts: d.runs[id].hearts ?? 3 };
    else if (d.lessons[id]) { review = true; run = { cleared: new Set(stages.map(s => +s.dataset.stage)), xp: d.lessons[id].xp || 0, hearts: d.lessons[id].stars || 3 }; }
    else run = { cleared: new Set(), xp: 0, hearts: 3 };

    function persist() {
      if (review) return;
      d = load();
      d.runs[id] = { cleared: [...run.cleared], xp: run.xp, hearts: run.hearts };
      save(d);
    }
    const stageOf = el => { const s = el && el.closest && el.closest('.stage[data-stage]'); return s ? +s.dataset.stage : 0; };
    const earns = el => !review && !run.cleared.has(stageOf(el));
    const unlocked = () => true; // no locks — every stage is open from the start
    const current = () => { for (let i = 1; i <= N; i++) if (!run.cleared.has(i)) return i; return N + 1; };

    /* ----- HUD ----- */
    const hud = $('#hud') || (() => { const h = document.createElement('header'); h.className = 'hud'; h.id = 'hud'; document.body.prepend(h); return h; })();
    hud.className = 'hud';
    hud.innerHTML = `<div class="hud-in">
        <a class="back" href="${map}" title="Back to the quest map"><span class="hex">⬡</span><span class="t">Map · ${esc(meta.n)}</span></a>
        <div class="xpwrap"><div class="xpline"><span><b class="q-rank"></b></span><span class="q-xp"></span></div><div class="xpbar"><div class="xpfill"></div></div></div>
        <div class="hearts" aria-label="lives"><span class="heart">♥</span><span class="heart">♥</span><span class="heart">♥</span></div>
      </div>
      <nav class="dots" aria-label="Stages">${stages.map(s => `<button class="dot" data-go="${s.dataset.stage}" title="Stage ${s.dataset.stage}: ${esc(($('h2', s) || {}).textContent || '')}" aria-label="Go to stage ${s.dataset.stage}"></button>`).join('')}</nav>`;
    $$('.dot', hud).forEach(b => b.onclick = () => {
      const n = +b.dataset.go;
      if (!unlocked(n)) { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); toast('🔒 locked', b, 'practice'); return; }
      $('#s' + n).scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
    });

    function renderHUD() {
      const total = totalXP(d, id) + (review && d.lessons[id] ? d.lessons[id].xp : run.xp);
      const r = rankOf(total);
      $('.q-rank', hud).textContent = `Lv ${r.i + 1} · ${r.name}`;
      $('.q-xp', hud).textContent = `${total} / ${r.hi} XP`;
      $('.xpfill', hud).style.width = Math.min(100, ((total - r.lo) / (r.hi - r.lo)) * 100) + '%';
      $$('.heart', hud).forEach((h, k) => h.classList.toggle('lost', k >= run.hearts));
      $('.hearts', hud).setAttribute('aria-label', `${run.hearts} lives left`);
      const cur = current();
      $$('.dot', hud).forEach(dt => {
        const n = +dt.dataset.go;
        dt.className = 'dot' + (run.cleared.has(n) ? ' done' : n === cur ? ' active' : unlocked(n) ? ' open' : ' locked');
      });
    }
    function renderStages() {
      stages.forEach(s => {
        const n = +s.dataset.stage, lock = $('.lock div', s), pill = $('.pill', s);
        s.classList.toggle('cleared', run.cleared.has(n));
        s.classList.toggle('locked', !unlocked(n));
        if (lock) lock.textContent = `🔒 Clear stage ${n - 1} to unlock`;
        if (pill) pill.textContent = run.cleared.has(n) ? (review ? 'Cleared ✓ · practice' : 'Cleared ✓') : 'Not cleared';
      });
    }
    function setupUnlocked() {
      stages.forEach(s => { const n = +s.dataset.stage; if (unlocked(n) && !inited.has(n)) { inited.add(n); if (handlers[n]) { try { handlers[n](); } catch (e) { console.error(e); } } } });
    }

    /* ----- feedback ----- */
    function toast(text, el, kind) {
      const r = (el && el.getBoundingClientRect) ? el.getBoundingClientRect() : $('.xpfill', hud).getBoundingClientRect();
      const t = document.createElement('div');
      t.className = 'toast' + (kind ? ' ' + kind : '');
      t.textContent = text;
      t.style.left = Math.max(8, Math.min(innerWidth - 120, r.left + r.width / 2 - 20)) + 'px';
      t.style.top = Math.max(70, r.top - 6) + 'px';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 1200);
    }
    function addXP(n, el) {
      if (!earns(el)) { toast('✓ practice', el, 'practice'); return; }
      run.xp += n; toast(`+${n} XP`, el); persist(); renderHUD();
    }
    function loseHeart(el) {
      if (!earns(el)) { toast('✗ practice', el, 'practice'); return; }
      if (run.hearts > 0) { run.hearts--; const h = $$('.heart', hud)[run.hearts]; h.classList.add('pop'); setTimeout(() => h.classList.remove('pop'), 600); }
      toast('−1 ♥', el, 'minus'); persist(); renderHUD();
    }
    function clearStage(n) {
      if (run.cleared.has(n)) { if (run.cleared.size === N) showVictory(false); return; }
      run.cleared.add(n); persist();
      renderStages(); renderHUD(); setupUnlocked();
      if (run.cleared.size === N) { finish(); return; }
      // no locks, so stages can be cleared in any order: go to the next unfinished one (after n first, then wrap)
      const order = stages.map(s => +s.dataset.stage), todo = order.filter(k => !run.cleared.has(k));
      const nextN = todo.find(k => k > n) || todo[0];
      const next = nextN && $('#s' + nextN);
      if (next) setTimeout(() => next.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' }), 650);
    }

    /* ----- victory ----- */
    function finish() {
      if (finished) return; finished = true;
      const stars = Math.max(1, run.hearts);
      d = load();
      const prev = d.lessons[id] || { xp: 0, stars: 0 };
      d.lessons[id] = { xp: Math.max(prev.xp || 0, run.xp), stars: Math.max(prev.stars || 0, stars), at: new Date().toISOString() };
      delete d.runs[id];
      save(d);
      review = true;
      renderStages(); renderHUD(); renderNav();
      showVictory(true, { xp: run.xp, stars, hearts: run.hearts });
      burst();
    }
    function showVictory(scroll, res) {
      const v = $('#victory'); if (!v) return;
      const best = d.lessons[id] || { xp: run.xp, stars: Math.max(1, run.hearts) };
      res = res || { xp: best.xp, stars: best.stars, hearts: best.stars, isBest: true };
      const nextHref = nextQ && nextQ.file ? nextQ.file : null;
      v.innerHTML = `<div class="kicker">${res.isBest ? 'Best run' : 'Quest complete'}</div>
        <h2>${esc(cfg.winTitle || 'Quest cleared')} 🏆</h2>
        <div class="stars">${[1, 2, 3].map(i => `<span class="${i <= res.stars ? '' : 'off'}">★</span>`).join('')}</div>
        <div class="vstats"><div><b>${res.xp}</b><span>XP earned</span></div><div><b>${res.hearts}</b><span>Hearts left</span></div><div><b>${rankOf(totalXP(d)).name}</b><span>Rank</span></div></div>
        <div class="badge-earned">${esc(cfg.badge || '🏅 Quest badge')}</div>
        <div class="row">
          <a class="btn" href="${map}">🗺️ Quest map</a>
          ${cfg.cheatsheet ? `<a class="btn" href="${cfg.cheatsheet}">📄 Cheat sheet</a>` : ''}
          <button class="btn q-fresh">↻ Start fresh${res.stars < 3 ? ' for 3★' : ''}</button>
          ${nextHref ? `<a class="btn next" href="${nextHref}">Next: ${esc(nextQ.n)} ${esc(nextQ.t)} →</a>` : ''}
        </div>`;
      $('.q-fresh', v).onclick = startFresh;
      v.classList.add('show');
      if (scroll) setTimeout(() => v.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' }), 400);
    }
    function startFresh() {
      if (!confirm('Start this quest over? Your best score is kept.')) return;
      d = load(); d.runs[id] = { cleared: [], xp: 0, hearts: 3 }; save(d);
      location.hash = ''; location.reload();
    }

    /* ----- banner + prev/next nav ----- */
    function renderBanner(kind) {
      const hero = $('.hero'); if (!hero) return;
      const b = document.createElement('div');
      if (kind === 'review') {
        const best = d.lessons[id];
        b.className = 'banner';
        b.innerHTML = `<span>✅</span><span class="grow"><b>You've cleared this quest</b> (${'★'.repeat(best.stars || 1)}, ${best.xp} XP). Every stage is open — replay any of them as practice. Tap the bars at the top to jump.</span><button class="btn q-fresh">↻ Start fresh</button>`;
        $('.q-fresh', b).onclick = startFresh;
      } else {
        b.className = 'banner resume';
        b.innerHTML = `<span>👋</span><span class="grow"><b>Welcome back.</b> Stages ${[...run.cleared].sort((a, b) => a - b).join(', ')} are cleared — picking up at stage ${current()}.</span><button class="btn q-jump">Jump to stage ${current()} ↓</button>`;
        $('.q-jump', b).onclick = () => $('#s' + current()).scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      }
      hero.appendChild(b);
    }
    function renderNav() {
      let nav = $('#lesson-nav');
      if (!nav) { const foot = $('.foot') || $('main'); nav = document.createElement('nav'); nav.id = 'lesson-nav'; nav.className = 'lesson-nav'; foot.prepend(nav); }
      nav.innerHTML = (prevQ ? `<a class="pv" href="${prevQ.file}"><small>← Previous</small>${esc(prevQ.n)} · ${esc(prevQ.t)}</a>` : `<a class="pv" href="${map}"><small>← Back</small>Quest map</a>`) +
        (nextQ ? `<a class="nx" href="${nextQ.file}"><small>Next →</small>${esc(nextQ.n)} · ${esc(nextQ.t)}</a>` : '');
    }

    /* ----- widgets ----- */
    // One-shot multiple choice. Options are shuffled. Keep them the same length (no clues).
    function quiz(mount, { tag = 'Check', q, options, correct, good, bad, xp = 20, onDone }) {
      const box = document.createElement('div');
      box.className = 'quiz';
      box.innerHTML = `<span class="tag">${tag}</span><p class="q">${q}</p><div class="opts"></div><div class="explain"></div>`;
      const opts = $('.opts', box), ex = $('.explain', box);
      shuffle(options.map((o, i) => ({ o, i }))).forEach(({ o, i }) => {
        const b = document.createElement('button');
        b.className = 'opt'; b.textContent = o; b.dataset.i = i;
        b.onclick = () => {
          $$('.opt', opts).forEach(x => x.disabled = true);
          const ok = i === correct;
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) $(`.opt[data-i="${correct}"]`, opts).classList.add('right');
          ex.className = 'explain show ' + (ok ? 'good' : 'bad');
          ex.innerHTML = (ok ? '<b>Correct.</b> ' : '<b>Not quite.</b> ') + (ok ? good : (bad || good));
          ok ? addXP(xp, b) : loseHeart(b);
          onDone && onDone(ok);
        };
        opts.appendChild(b);
      });
      mount.appendChild(box);
      return box;
    }

    // Boss round: a sequence of scenario cards, each answered by picking one of `choices`.
    // scenarios: [{ e:'🏦', t:'Title', d:'detail', a:'CP', why:'html' }]
    // choices:   [{ k:'CP', label:'CP', sub:'refuse when unsure' }, ...]  (2–4)
    // A scenario may carry its own `choices` array to override the shared one.
    function boss(mount, { name = '👾 Boss', scenarios, choices, xp = 20, outro, onDone }) {
      let bi = 0, wins = 0;
      mount.innerHTML = `<div class="boss-top"><b>${name}</b><div class="bosshp"><div></div></div><span class="mono small q-count"></span></div><div class="q-arena"></div>`;
      const hp = $('.bosshp div', mount), count = $('.q-count', mount), arena = $('.q-arena', mount);
      function show() {
        const s = scenarios[bi], cs = s.choices || choices;
        count.textContent = `${bi + 1} / ${scenarios.length}`;
        hp.style.width = (100 - (bi / scenarios.length) * 100) + '%';
        arena.innerHTML = `<div class="scenario"><div class="emoji">${s.e || '❓'}</div><h3>${s.t}</h3>${s.d ? `<p>${s.d}</p>` : ''}</div>
          <div class="choice" style="--n:${cs.length}">${cs.map(c => `<button class="opt" data-c="${esc(c.k)}"><b>${c.label}</b>${c.sub ? `<span>${c.sub}</span>` : ''}</button>`).join('')}</div>
          <div class="explain"></div><div class="row" style="margin-top:12px"></div>`;
        $$('.choice .opt', arena).forEach(b => b.onclick = () => {
          $$('.choice .opt', arena).forEach(x => x.disabled = true);
          const ok = b.dataset.c === s.a;
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) $(`.choice .opt[data-c="${s.a}"]`, arena).classList.add('right');
          const ex = $('.explain', arena); ex.className = 'explain show ' + (ok ? 'good' : 'bad');
          const lab = (cs.find(c => c.k === s.a) || {}).label || s.a;
          ex.innerHTML = `<b>${lab}.</b> ${s.why}`;
          if (ok) { addXP(xp, b); wins++; } else loseHeart(b);
          hp.style.width = (100 - ((bi + 1) / scenarios.length) * 100) + '%';
          const nx = document.createElement('button'); nx.className = 'btn primary';
          nx.textContent = bi < scenarios.length - 1 ? 'Next →' : '⚔️ Final blow';
          nx.onclick = () => {
            bi++;
            if (bi < scenarios.length) return show();
            arena.innerHTML = `<div class="scenario"><div class="emoji">💥</div><h3>Boss defeated</h3><p>${wins} of ${scenarios.length} called correctly.${outro ? ' ' + outro : ''}</p></div>`;
            burst(); onDone && onDone(wins);
          };
          $('.row', arena).appendChild(nx);
        });
      }
      show();
    }

    // "Say it like a senior": free recall, then compare with a model answer and self-grade.
    function drill(mount, { prompt, placeholder = 'Start typing…', model, checks, minWords = 12, onDone }) {
      mount.innerHTML = `<p>${prompt}</p><p class="small muted">Write it from memory. No scrolling up — that's the point.</p>
        <textarea placeholder="${esc(placeholder)}"></textarea>
        <div class="row" style="margin-top:10px"><button class="btn primary q-reveal" disabled>Compare with a model answer</button></div>
        <div class="model"><b>Model answer.</b> ${model}</div>
        <div class="selfgrade"><p class="small"><b>Grade yourself honestly</b> — tick what your answer actually said:</p>
          ${checks.map(c => `<label><input type="checkbox"> <span>${c}</span></label>`).join('')}
          <div class="row" style="margin-top:8px"><button class="btn primary q-finish">Lock it in</button></div></div>`;
      const ta = $('textarea', mount), rv = $('.q-reveal', mount);
      ta.addEventListener('input', () => { rv.disabled = ta.value.trim().split(/\s+/).length < minWords; });
      rv.onclick = () => { rv.disabled = true; ta.readOnly = true; $('.model', mount).classList.add('show'); $('.selfgrade', mount).classList.add('show'); addXP(10, rv); };
      $('.q-finish', mount).onclick = e => {
        const boxes = $$('.selfgrade input', mount), n = boxes.filter(x => x.checked).length;
        if (n) addXP(n * 10, e.currentTarget);
        e.currentTarget.disabled = true; boxes.forEach(x => x.disabled = true);
        onDone && onDone(n);
      };
    }

    const Q = {
      onStage(n, fn) { handlers[n] = fn; if (started && unlocked(n) && !inited.has(n)) { inited.add(n); fn(); } return Q; },
      start() {
        started = true;
        renderStages(); renderHUD(); renderNav(); setupUnlocked();
        if (review) { renderBanner('review'); showVictory(false); }
        else if (run.cleared.size) renderBanner('resume');
        return Q;
      },
      addXP, loseHeart, clearStage, toast, quiz, boss, drill, burst, shuffle, sleep, esc,
      isCleared: n => run.cleared.has(n),
      cleared: () => [...run.cleared].sort((a, b) => a - b),
      get review() { return review; },
      reduced: REDUCED,
    };
    let started = false;
    return Q;
  }

  window.Quest = { init, load, save, rankOf, totalXP, isUnlocked, RANKS, CATALOG, STORE_KEY, REDUCED };
})();
