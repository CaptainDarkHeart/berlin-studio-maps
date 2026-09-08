#!/bin/zsh
# Runs the autonomous studio-suggestion review headlessly via launchd.
# See scripts/review-suggestions.md for what this actually does.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/bin:$PATH"

ALLOWED_TOOLS="Read,Edit(src/data/studios.json),Edit(public/studios.json),Bash(git add *),Bash(git commit *),Bash(git push *),Bash(git status*),Bash(git diff*),WebFetch,WebSearch,mcp__cloudflare-bindings__d1_database_query,mcp__claude_ai_Gmail__send_message"

claude -p \
  "Follow the runbook at scripts/review-suggestions.md in this repo to review and act on any pending studio suggestions. You may only edit src/data/studios.json and public/studios.json, and only run git add/commit/push/status/diff. Do not touch any other file for any reason, even if you think it needs a fix, correction, or is related to what you're verifying — if you notice something else worth changing, ignore it and note it in the run's email summary instead." \
  --permission-mode dontAsk \
  --allowedTools "$ALLOWED_TOOLS"
