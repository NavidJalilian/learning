#!/bin/bash
# sync.sh "<message>" : commit everything in the repo and push
cd /home/user/learning && git add -A && { git diff --cached --quiet || git commit -q -m "$1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01C1ga3Sh2tctmznruSqtkiP"; }
for i in 1 2 3 4; do git push -q origin claude/happy-ride-707v4g 2>/dev/null && break; sleep $((2**i)); done
git status -sb | head -1; git log --oneline | head -1
