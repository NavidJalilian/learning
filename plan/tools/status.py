"""status.py — regenerate plan/STATUS.md (done/undone checklist) from the engine catalog, plan/done.txt and lessons/."""
import os, re
R = '/home/user/learning'
eng = open(f'{R}/lessons/quest-engine.js').read()
done = set(open(f'{R}/plan/done.txt').read().split())
W = {int(m.group(1)): (m.group(2).replace("\\'", "'"), m.group(3).replace("\\'", "'"), m.group(4)) for m in re.finditer(
    r"\{ w: (\d+), t: '((?:[^'\\]|\\.)*)', name: '((?:[^'\\]|\\.)*)', slug: '[^']+'(?:, cheatsheet: '([^']+)')?", eng)}
Q = {}
for m in re.finditer(r"\{ id: '(\d{4})', w: (\d+), n: '([^']*)', t: '((?:[^'\\]|\\.)*)'.*?file: '([^']+)'.*?ready: (true|false)", eng):
    qid, w, n, t, f, r = m.groups()
    st = 'live' if r == 'true' else 'built' if qid in done else 'building' if os.path.exists(f'{R}/lessons/{f}') else 'todo'
    Q.setdefault(int(w), []).append((qid, n, t.replace("\\'", "'"), f, st))
tot = sum(len(v) for v in Q.values())
c = {k: sum(1 for v in Q.values() for q in v if q[4] == k) for k in ('live', 'built', 'building', 'todo')}
L = ["# Plan checklist — System Design Quest", "",
     "Every chapter of *System Design Interview* Vol. 1 as a world of quests. Ticked = done. Regenerate: `python3 plan/tools/status.py`.", "",
     f"**{c['live'] + c['built']} of {tot} quests built** · {c['live']} live on the map · {c['built']} built, awaiting world review · "
     f"{c['building']} being built (draft on disk, not verified) · {c['todo']} not started.", "",
     "Legend: `[x]` done · `[ ]` not done. A world is **done** when every quest is built, the world review has run, its cheat sheet",
     "exists, and its quests are `ready: true` on the map.", ""]
for w in sorted(W):
    t, name, cs = W[w]; qs = Q.get(w, [])
    wd = bool(qs) and all(q[4] == 'live' for q in qs) and bool(cs)
    L += [f"## {'✅' if wd else '⬜'} World {w} · {t} — *{name}*", ""]
    for qid, n, title, f, st in qs:
        tag = {'live': 'live', 'built': 'built · needs world review', 'building': 'being built (unverified draft)', 'todo': 'not started'}[st]
        L.append(f"- [{'x' if st in ('live', 'built') else ' '}] `{qid}` {n} · [{title}](../lessons/{f}) — {tag}")
    L += [f"- [{'x' if wd else ' '}] World review + cheat sheet" + (f" — [{cs}](../reference/{cs})" if cs else ""), ""]
L += ["## Next steps", "",
      "1. Build every unticked quest from `plan/quests/quest-<id>.json` with `plan/BRIEF.md` (order: `plan/queue.txt`).",
      "2. When a world's quests are all built, run the world finisher (`plan/WORLD-BRIEF.md`), then `plan/tools/release.py <N>`.",
      "3. Final pass: quest map + every cheat-sheet link, `NOTES.md` update.", ""]
open(f'{R}/plan/STATUS.md', 'w').write('\n'.join(L))
print(c, tot)
