# Notes & Preferences

## How to teach this user
- **Gamified, beautiful UI** (stated 2026-10-06: "learn things gamified with a nice UI rather than this boring thing"). Every lesson = a quest: stages that unlock, XP, hearts, predict-then-watch simulations, a boss round, victory screen. Not a reading page.
- **Shared engine (2026-10-06):** every lesson loads `lessons/quest.css` + `lessons/quest-engine.js` and calls `Quest.init({id})`. The engine owns the HUD, stage locking, saving, **resume after reload**, **review mode** (a cleared quest reopens fully unlocked; replays are free practice, no XP or hearts at stake), clickable stage bars for jumping back, prev/next lesson links, the victory card, and the widgets `quiz()`, `boss()`, `drill()`. `Quest.CATALOG` in the engine is the single list of quests (flip `ready: true` once a lesson is verified); the quest map reads it.
- Saved in `localStorage` key `sdq:v1` → `{ lessons: { id: { xp, stars, at } }, runs: { id: { cleared, xp, hearts } } }`. Storage is per browser *and* per address: file:// vs the LAN console (http://…:4242) keep separate progress.
- The LAN console (`senior-developer/bridge/server.js`) was patched to serve `.js`/`.css` from lessons/ so the shared engine works there; restart it to pick that up.
- User asked (2026-10-06) for the ability to **go back**, then: **"remove all the locks"** — no stage or quest is ever locked. Order is suggested, never enforced. Victory fires only when every stage is cleared (any order). Don't reintroduce gating.
- User pastes book text; follow the book's chapter order. Teach one tight slice per lesson.
- Global style pref: plain language, define jargon inline, honest caveats.

## Open threads
- **World 6 complete (2026-10-06):** lessons 0001–0008 built (0002–0008 by a fleet of 7 subagents on the shared engine; brief kept in the session scratchpad). User had cleared 0001 (1★) before the rebuild — review mode picks that up.
- Chapter cheat sheet `reference/kv-store-cap-cheatsheet.html` now covers 6.1–6.7 + the boss (one section per quest).
- Honest caveats taught in-lesson (revisit if the user asks): book's CP blocks the majority side (0001→paid off in 0004); W+R>N breaks under sloppy quorum (0004, 0006); "quorum consensus" ≠ Raft/Paxos (0004); async replication really means W acks then background (0003); real preference lists > N (0003); Cassandra uses last-write-wins not vector clocks (0005, 0008); commit log is fsynced periodically by default (0007); Cassandra reads merge all candidate SSTables, not first-hit (0007); Dynamo's Table 1 has a gossip row the book drops (0008).
- 0008 stores its interview scorecard under a separate key `sdq:v1:0008-interview`.
- Engine wishlist from the fleet (not done): shared `Q.order()` tap-in-order widget, `Q.predict()`/rounds helper, HUD-height CSS variable, quiz word-count lint.
- No learning records yet — completing quests ≠ evidence of understanding. Write one when the user explains a concept back or nails a drill in chat.
- MISSION.md is a draft — confirm with the user.
- Next: Chapter 7 (unique ID generator) when the user pastes it, or Ch. 1–5 if they want to go back to the start of the book.
