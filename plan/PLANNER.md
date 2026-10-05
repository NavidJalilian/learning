# Planner brief — one chapter of System Design Interview Vol. 1

You plan the gamified lessons ("quests") for ONE chapter of Alex Xu's *System Design Interview — An Insider's Guide* (Vol. 1).
Do NOT write lesson files. Write ONE JSON file (path given in your task) and return a 5-line summary.

## Context — read first (repo /home/user/learning)
- MISSION.md and NOTES.md: who the learner is and how to teach them (gamified quests, plain language, jargon defined inline,
  honest caveats, short lessons alongside a full-time job, no locks).
- lessons/quest-engine.js: the shared engine. Lessons are a hero + numbered `<section class="stage" data-stage="N">` blocks,
  widgets Q.quiz(), Q.boss() (scenario cards, 2–4 choices), Q.drill() (free recall then self-grade), plus lesson-specific
  custom simulations, XP and hearts.
- Skim lessons/0002-consistent-hashing.html (normal quest, 7 stages: concept sims with predict-then-watch, quizzes, a boss()
  round, a drill() last) and lessons/0008-boss-design-it-live.html (chapter "BOSS" quest: a full mock interview following
  the book's 4-step framework).
- Chapter 6 (key-value store) is already built as World 6, quests 0001–0008 (CAP, consistent hashing, replication, quorum,
  vector clocks, failure handling, write/read path, boss).

## How to plan
- COPYRIGHT: never reproduce the book's (or any source's) text verbatim or near-verbatim. Paraphrase in your own words; use facts, numbers and structure only. Quotes at most one short sentence, attributed.
- Follow the book's chapter closely: section order, diagrams, numbers (estimates, bit layouts, latencies…), final design.
  You may try WebFetch on https://bytebytego.com/courses/system-design-interview/<chapter-slug> to check details; if it
  fails, rely on your knowledge. Where the book simplifies or differs from real systems, add a caveat.
- 3 to 6 quests (scale to how much the chapter contains). The LAST quest is the chapter boss (n "BOSS", boss true):
  a live mock interview of the chapter's prompt using the 4-step framework (scope → high-level → deep dive → wrap-up), like 0008.
- Non-boss quests are numbered "<ch>.1", "<ch>.2", … each covering one tight slice.
- Each quest has 5–7 stages. Typical: 3–4 concept stages, each with a real interactive mechanic (simulation the learner
  drives, predict-then-watch, sort/order, calculate-and-check, spot-the-bug), ending in a short quiz; then a Q.boss()
  scenario round; then a Q.drill() "say it like a senior" stage last. Vary mechanics. Describe simulations concretely
  (what's on screen, what the learner clicks, what happens, what the right answer is) — a separate builder agent will
  implement each quest from your plan alone.
- 'teaches' holds concrete content: definitions, numbers, trade-offs, failure modes, "what happens when X fails?" follow-ups.
- Titles short and game-y; descriptions plain.
- Sources: the book's chapter on ByteByteGo plus the chapter's real references (papers, engineering blogs, docs) with real
  URLs you are confident exist.

## Output JSON shape (write exactly this structure, valid JSON)
{
  "world": <chapter number>,
  "chapterTitle": "...",
  "worldName": "short game-y world name",
  "quests": [
    {
      "n": "7.1" | "BOSS",
      "slug": "kebab-case-file-slug",
      "t": "Game-y Title",
      "d": "one-line plain description for the quest map",
      "boss": false,
      "badge": "🛡️ Badge: Name",
      "winTitle": "victory heading",
      "goal": "Your win today: what the learner can say to an interviewer afterwards",
      "bookSections": "which book sections this covers",
      "stages": [ { "title": "", "sub": "", "teaches": "", "interaction": "", "check": "" } ],
      "caveats": ["..."],
      "sources": [ { "label": "", "url": "" } ]
    }
  ],
  "cheatsheetOutline": "outline of the one-page chapter cheat sheet (one section per quest + key numbers + final design)"
}
Validate it with `python3 -m json.tool <file> > /dev/null` before finishing.
