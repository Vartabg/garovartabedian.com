#!/bin/bash
# Repo-health check for the multi-agent media workflow.
#
# The failure mode we guard against: git keeps EVERY version of a binary
# forever. If an agent regenerates images in-place (same path, new bytes),
# .git grows without bound while the working tree stays the same size.
#
# Heuristic: for this repo the media in /public dominates both the working
# tree and history, so a healthy repo has .git ~= public. When .git pulls
# well ahead of public, history is carrying dead (overwritten) blobs.
#
# Advisory only — this NEVER blocks a push. Run manually any time, or let
# the pre-push hook run it for you.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

kb() { du -sk "$1" 2>/dev/null | cut -f1; }
human() { awk -v k="$1" 'BEGIN{ if(k>1048576) printf "%.1f GB", k/1048576; else printf "%.0f MB", k/1024 }'; }

GIT_KB=$(kb .git); GIT_KB=${GIT_KB:-0}
PUB_KB=$(kb public); PUB_KB=${PUB_KB:-0}
RATIO=0; [ "$PUB_KB" -gt 0 ] && RATIO=$(( GIT_KB * 100 / PUB_KB ))

# Uncommitted media sitting in the tree (info, not a warning).
UNCOMMITTED=$(git status --porcelain -- 'public/**/*.jpg' 'public/**/*.png' 'public/**/*.webp' 2>/dev/null | wc -l | tr -d ' ')

echo "── repo health ─────────────────────────────"
printf "  .git history   %s\n" "$(human "$GIT_KB")"
printf "  public/ assets %s\n" "$(human "$PUB_KB")"
printf "  ratio          %s%%  (healthy ≈ 100%%, warn > 180%%)\n" "$RATIO"
printf "  uncommitted media files  %s\n" "$UNCOMMITTED"

STATUS=0
# 300MB absolute floor so tiny repos don't false-alarm on a high ratio.
if [ "$GIT_KB" -gt 307200 ] && [ "$RATIO" -gt 180 ]; then
  echo "  ⚠️  BLOAT: .git is $(( RATIO ))% of /public — history is likely"
  echo "     carrying overwritten image blobs. Prefer add-once media; if a"
  echo "     regen was intentional, plan a history cleanup (git filter-repo)."
  STATUS=1
else
  echo "  ✓ history is lean — no duplicate-blob bloat detected"
fi
echo "────────────────────────────────────────────"
exit $STATUS
