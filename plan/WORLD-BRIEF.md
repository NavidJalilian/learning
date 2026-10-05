# World finisher brief — review a chapter's quests + build its cheat sheet

You finish ONE world (book chapter) of the System Design Quest course (repo /home/user/learning; read MISSION.md, NOTES.md).
Each quest in the world was built by a separate agent from `plans/quest-<id>.json` (scratchpad dir:
/tmp/claude-0/-home-user-learning/d9454b66-4e73-5742-9599-3801914aa20a/scratchpad). The chapter plan is `plans/ch<N>.json`
(its `cheatsheetOutline` field outlines the cheat sheet). Builder rules are in BRIEF.md (same dir) — the same rules bind you.

## Part 1 — review every quest file in this world (lessons/<id>-*.html for ids <N>01…)
1. Run the smoke test on all of them:
   `NODE_PATH=/opt/node22/lib/node_modules node <scratchpad>/smoke.js /home/user/learning/lessons/<N padded>*.html`
2. Read each file. Check, and FIX in place (small, surgical edits; don't rewrite lessons):
   - Factual accuracy vs the book's chapter and real systems; numbers consistent ACROSS the world's quests
     (the same estimate must not differ between quests). Paraphrase rule: no verbatim book text.
   - Cross-links: links to sibling quests/other lessons point at files that exist (`ls lessons/`); cheat sheet link is
     `../reference/<cheatsheet file>` exactly as in the plan JSON `cheatsheet` field.
   - No stage gating/locks; every stage reachable and clearable on its own; Quest.init id matches the file's id.
   - Quiz options similar length; no obviously broken copy, leftover TODOs, or placeholder text.
3. If a builder's playthrough script exists (`<scratchpad>/play-<id>.js`), re-run it after any fix to make sure the quest still clears.
   Otherwise write a quick one for anything you changed in logic.

## Part 2 — build the chapter cheat sheet
Write `/home/user/learning/reference/<cheatsheet file>` (name = basename of the plan's `cheatsheet` field).
Match the style and structure of `reference/kv-store-cap-cheatsheet.html` (read it fully): standalone page, same fonts/tokens,
light+dark (both the media-query block and `:root[data-theme="dark"]`), printable, one section per quest (with a link to
the quest file `../lessons/<file>`), a key-numbers box, the final design as an inline SVG or clear diagram, "say it like a
senior" lines, honest caveats, a back link to `quest-map.html`. Content must agree with the lessons. Works at 375px with
no horizontal page scroll. Smoke-check it loads with no console errors (adapt smoke.js or a quick Playwright check; it has no HUD).

## Don'ts
Don't edit quest-engine.js, quest.css, quest-map.html, NOTES.md, other worlds' files. Don't commit.

Return: per quest — verdict + what you fixed; cheat sheet path; anything still broken that you couldn't fix.
