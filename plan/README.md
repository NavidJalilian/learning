# The build plan for the rest of the book

Everything the subagent fleet used to plan and build Chapters 1–5 and 7–15 is kept here, so the work can resume in a
fresh session without re-planning. Current progress: **[STATUS.md](STATUS.md)**.

## How it was built
1. **Plan** — one planner agent per chapter followed [PLANNER.md](PLANNER.md) and wrote `chapters/ch<N>.json`
   (quests, stages, mechanics, numbers, caveats, sources, cheat-sheet outline).
2. **Integrate** — `tools/integrate.py <N>` folds a chapter plan into `lessons/quest-engine.js` (`WORLDS` + `CATALOG`,
   all `ready: false`) and writes one assignment file per quest to `quests/quest-<id>.json`.
   Quest ids are `chapter × 100 + k` (`0101` … `1506`); the boss is the last quest of each world.
3. **Build** — one builder agent per quest followed [BRIEF.md](BRIEF.md) with its `quests/quest-<id>.json`, wrote
   `lessons/<id>-<slug>.html`, and verified it with `tools/smoke.js` plus its own Playwright playthrough
   (kept in `tests/play-<id>.js`).
4. **Finish a world** — once all of a chapter's quests were built, one finisher agent followed
   [WORLD-BRIEF.md](WORLD-BRIEF.md): cross-quest review and fixes, then the chapter cheat sheet in `reference/`.
5. **Release** — `tools/release.py <N>` flips that world's quests to `ready: true` and links its cheat sheet on the map.

## Resuming
Work through STATUS.md top to bottom:
- **PARTIAL** quests: their builder was stopped mid-write. Rebuild from scratch with BRIEF.md + the quest json
  (delete or overwrite the partial file; don't trust it).
- **not started**: build with BRIEF.md + the quest json.
- **built, awaiting world review**: when the whole world is built, run the world finisher, then `release.py`.
- `queue.txt` is the build order the fleet was using; `done.txt` lists quests whose builder reported a verified build.

The tools expect the scratchpad layout they were written for (`plans/`, `smoke.js` next to them); adjust the paths at
the top of each script if you run them from here. Run Playwright with
`NODE_PATH=/opt/node22/lib/node_modules node <script>` and Chromium at `/opt/pw-browsers/chromium`.

## Regenerating STATUS.md
The status is derived from `lessons/quest-engine.js` (`ready` flags), `plan/done.txt` and which lesson files exist.
