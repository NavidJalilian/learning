function makeSim(split) {
  const ARR = ['ios','and','mail','ios','and','sms'];
  const WK = { ios: 2, and: 2, sms: 2, mail: 1 };
  const st = { t: 0, qs: split ? { ios: [], and: [], sms: [], mail: [] } : { all: [] }, workers: [] };
  if (split) for (const ch in WK) for (let i = 0; i < WK[ch]; i++) st.workers.push({ q: ch, stuck: 0, msg: null });
  else for (let i = 0; i < 7; i++) st.workers.push({ q: 'all', stuck: 0, msg: null });
  function step(outage) {
    st.workers.forEach(w => { if (w.stuck > 0) { w.stuck--; if (!w.stuck) { st.qs[w.q].push(w.msg); w.msg = null; } } });
    ARR.forEach(ch => st.qs[split ? ch : 'all'].push({ ch, born: st.t }));
    st.workers.forEach(w => { if (w.stuck) return; const m = st.qs[w.q].shift(); if (!m) return; if (m.ch === 'sms' && outage) { w.stuck = 3; w.msg = m; } });
    st.t++;
  }
  const oldest = ch => { let o = null; for (const k in st.qs) for (const m of st.qs[k]) if (m.ch === ch && (o === null || m.born < o)) o = m.born; return o === null ? 0 : st.t - o; };
  const depth = () => Object.values(st.qs).reduce((s, q) => s + q.length, 0);
  return { st, step, oldest, depth };
}
for (const split of [false, true]) {
  const s = makeSim(split); const out = [];
  for (let t = 0; t < 34; t++) { s.step(t >= 4); if (t % 4 === 3) out.push(`${t+1}:d${s.depth()} ios${s.oldest('ios')} stuck${s.st.workers.filter(w=>w.stuck).length}`); }
  console.log(split ? 'split ' : 'shared', out.join(' | '));
}
