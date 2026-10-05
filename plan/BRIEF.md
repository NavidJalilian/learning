# Builder brief — System Design Quest lessons

You are building ONE lesson ("quest") of a gamified course on Alex Xu's *System Design Interview* (Vol. 1).
Repo: `/home/user/learning`. Read `MISSION.md` and `NOTES.md` first (who the learner is, how to teach them).

## What already exists (read, don't modify)
- `lessons/quest-engine.js` — shared engine. Read it fully. `Quest.init({id, badge, winTitle, cheatsheet})` → `Q`.
  `Q.onStage(n, fn)` registers a stage's setup; `Q.start()` last. Widgets: `Q.quiz(mount, {...})`,
  `Q.boss(mount, {...})`, `Q.drill(mount, {...})`. Scoring: `Q.addXP(n, el)`, `Q.loseHeart(el)`,
  `Q.clearStage(n)`. Helpers: `Q.toast, Q.shuffle, Q.sleep, Q.esc, Q.burst, Q.reduced, Q.review, Q.isCleared`.
  The engine owns the HUD, saving/resume, review mode, victory card, prev/next nav. Never reimplement those.
- `lessons/quest.css` — shared styles. Reuse its classes (`.hero .kicker .lede .goal .stage .stage-h .num .pill
  .stage-b .callout(.tip/.warn) .cite .btn(.primary) .row .sim .sim-bar .simlog .challenge .sort .sort-item
  .cards .card .chips .chip .checklist .term .seg .small .muted .foot .card2 .victory`). Put only
  lesson-specific CSS in the lesson's own `<style>`; define any new colours as tokens on `:root` with
  dark-mode overrides exactly like `lessons/0002-consistent-hashing.html` does (both the
  `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {...} }` and `:root[data-theme="dark"]` blocks).
- Gold-standard examples — study at least one closely and match its quality, density, and tone:
  `lessons/0002-consistent-hashing.html` (normal quest), `lessons/0008-boss-design-it-live.html` (chapter boss / mock interview),
  `lessons/0006-handling-failures.html` (rich simulations).

## File skeleton (copy the structure of 0002)
- `<!DOCTYPE html>`, charset, viewport, `color-scheme` meta, `<title>` = the quest title, `<link rel="icon" href="data:,">`,
  the same Google Fonts link, `<link rel="stylesheet" href="quest.css">`, lesson `<style>`.
- `<header class="hud" id="hud"></header>` then `<main>`:
  - `<section class="hero">` with `.kicker` ("Quest {n} · {Chapter title}" or "Boss · {Chapter title}"), `<h1>`, `.lede`, `.goal` ("Your win today: …").
  - One `<section class="stage" data-stage="N" id="sN">` per stage, with `.stage-h` (`.num`, `h2`, `.sub`, `.pill`) and `.stage-b`.
  - `<section class="victory" id="victory"></section>`
  - `<div class="foot">` with `.card2` blocks: "📖 Read next (primary source)" (the book chapter on ByteByteGo + real refs) and "🎓 Level-up note" (deeper caveats).
- `<script src="quest-engine.js"></script>` then an inline `<script>` IIFE: `const Q = Quest.init({...})`, stage handlers, `Q.start()`.
- Single self-contained HTML file. No external JS libraries. No images from the web — draw with inline SVG / CSS / canvas.

## Teaching rules (from NOTES.md — non-negotiable)
- COPYRIGHT: never reproduce the book's (or any source's) text verbatim or near-verbatim. Paraphrase in your own words; use facts, numbers and structure only. Quotes at most one short sentence, attributed.
- A quest, not a reading page: every concept stage has something the learner DOES (drive a simulation, predict-then-watch,
  sort/order, calculate-and-check, spot-the-bug, drag/tap). Short text blocks between interactions.
- Plain language; define every piece of jargon inline the first time. Short sentences.
- Follow the book's content and numbers. Add honest caveats where real systems differ (callout or Level-up note).
- Cite with `<a class="cite" href="…" target="_blank" rel="noopener">[n]</a>`. Only real URLs you are confident exist.
- NO LOCKS. Every stage is open from the start and can be cleared in any order. Never gate a stage on another.
  Each stage must be clearable on its own (its sim/quiz must not depend on state from another stage).
- Every stage must eventually call `Q.clearStage(n)` exactly through the learner's own actions (finishing its sim + quiz,
  defeating the boss, locking in the drill). Wrong answers cost a heart via `Q.loseHeart`; right ones give XP via `Q.addXP`.
  Typical XP: quiz 20, boss scenario 15–20, sim milestones 10–30. A full quest should be worth roughly 250–450 XP
  (boss quests up to ~600).
- Quiz options must be similar in length so the longest isn't a giveaway.
- Typical shape: 3–4 concept stages → a `Q.boss()` scenario round → a `Q.drill()` "Say it like a senior" stage last.
  The chapter BOSS quest is a mock interview following the book's 4-step framework, like 0008 (it may store extra state
  under its own localStorage key `sdq:v1:<id>-…`, wrapped in try/catch).
- Respect `Q.reduced` (prefers-reduced-motion): skip or shorten animations.
- Mobile: works at 375px wide with no horizontal page scroll; tap targets ≥ 40px; SVGs use viewBox and scale.
- Light and dark mode both readable (use the CSS tokens: --ink, --muted, --panel, --bg, --bg-2, --line, --accent, --teal, --good, --bad, --warn, --xp …; check quest.css `:root` for the full list).
- Accessible: buttons are `<button>`, interactive SVG elements get `role="button"`, `tabindex="0"`, `aria-label`, and keyboard (Enter/Space) support.

## Don'ts
- Do NOT edit `lessons/quest-engine.js`, `lessons/quest.css`, `reference/*`, `NOTES.md`, other lessons, or anything outside your own lesson file. The orchestrator owns shared files and the catalog (your id is already in `Quest.CATALOG`).
- Do NOT git commit or push.

## Verify before you finish (required)
1. Smoke test (console errors, HUD, overflow at 375px, light+dark):
   `NODE_PATH=/opt/node22/lib/node_modules node /tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/smoke.js /home/user/learning/lessons/<your-file>.html`
2. Write your own throwaway Playwright playthrough in the scratchpad (`/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad/play-<id>.js`,
   run with `NODE_PATH=/opt/node22/lib/node_modules node …`; launch chromium with `executablePath: '/opt/pw-browsers/chromium'`).
   It must clear EVERY stage through real clicks/typing (in a fresh context so localStorage is empty), confirm the
   victory card appears (`#victory.show`), and confirm no page errors. Also reload mid-quest once and check resume works.
   Fix everything it finds. Take one screenshot at 375px dark and look at it (Read the PNG) to catch visual breakage.
3. Re-read your file for factual accuracy against the book and for the teaching rules above.

Return a short report: file path, stage list (title + mechanic), total XP available, what the playthrough verified, and any known gaps.

## Your assignment fields
Your plan JSON `plans/quest-<ID>.json` carries everything you need:
`id` (pass to Quest.init), `file` (write exactly `/home/user/learning/lessons/<file>`), `cheatsheet` (pass to Quest.init as-is;
the cheat sheet is built separately), `badge`, `winTitle`, `n`, `chapterTitle` (hero kicker: "Quest <n> · <chapterTitle>",
or "Boss · <chapterTitle>" when `boss` is true), `bookUrl` (the ByteByteGo chapter — cite it), `siblings` (the other quests
in this world, for teasers/cross-links: sibling files are `<id>-*.html` in lessons/), plus `stages`, `caveats`, `sources`.
Implement the plan fully; you may improve a mechanic that wouldn't work well, but keep content and stage count close.
Boss quests (`boss: true`) are mock interviews — model them on lessons/0008-boss-design-it-live.html.
Snowflake-style 64-bit IDs must use BigInt. Note: bytebytego.com and many sites are blocked by the network proxy — don't burn time fetching.
