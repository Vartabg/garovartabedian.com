# Scripts Directory Triage — Consolidated EGM Plan Review

- **Plan:** [`docs/plans/2026-11-23-scripts-triage.md`](./2026-11-23-scripts-triage.md)
- **Baseline:** `master` @ `fde3e9b4` (`codex/scripts-triage`)
- **Final Verdict:** **APPROVED** (`r2`)

## Review Passes

### Pass 1 (`r1`, baseline `8e21ef34`) — `BLOCKED` (4 material blockers, 4 optional improvements)

Fresh-context independent read-only review (`research` subagent) caught 4 concrete blockers before any code was touched:

| ID | Finding | Disposition in `r2` |
|---|---|---|
| B1 | Active concurrent unmerged worktree `codex/grok-content-review` (`fa9640e9`, 2026-11-18) modifies `scripts/scriptures/generate-romans-v2.mjs` and `scripts/scriptures/romans-data-1.mjs`, violating Criterion 3. | **Accepted.** Held all 3 Romans files (`generate-romans-v2.mjs`, `romans-data-1.mjs`, `romans-data-2.mjs`) in `scripts/scriptures/` and narrowed this PR to the 2 zero-overlap scripts (`generate-thessalonians-v2.mjs`, `build-synoptic-pericopes.mjs`). Documented deferral in `scripts/README.md` and `scripts/archive/README.md`. |
| B2 | `origin/master` advanced to `fde3e9b4` (PR #294, `unitTestFiles: 175`) and `.git/local-production-release.lock` was actively held by an in-flight release. | **Accepted.** Rebased `codex/scripts-triage` onto `origin/master` (`fde3e9b4`), updated expected `site-xray.json` counts (`unitTestFiles: 175`), and added lock-wait check before `npm run release:production`. |
| B3 | `build-site-xray.mjs` needed `skipDir` plumbed through both `files()` and recursive `walk()`, using an exact path check (`target === ARCHIVE_SCRIPTS_DIR`) instead of basename `dirName === "archive"`; `tests/site-xray.test.ts` needed an independent count assertion proving exclusion. | **Accepted.** Specified exact-path `ARCHIVE_SCRIPTS_DIR` plumbing in `walk()` + `files()` and independent filesystem exclusion assertion in `tests/site-xray.test.ts`. |
| B4 | Clean worktree lacked `node_modules` (`npm ci --include=dev` required); `node --check` alone does not verify module specifiers/exports; Playwright needed `CI=1 PORT=3199` so `reuseExistingServer` never attaches to port 3000; post-build `git status` check needed. | **Accepted.** Added `npm ci --include=dev`, static import/export verification + fail-closed CLI check, post-build `git status` check, and isolated `CI=1 PORT=3199` Playwright verification. |

All 4 optional improvements from Pass 1 (exact line count `1,261` for `generate-thessalonians-v2.mjs`, fail-closed `--allow-archived-overwrite` CLI guard on both archived writers, accurate `narration-pipeline.test.ts` scope note, and `build-shelf.mjs` note in `scripts/README.md`) were also adopted in `r2`.

### Pass 2 (`r2`, baseline `fde3e9b4`) — `APPROVED` (0 material blockers, 4 optional improvements)

Fresh-context independent read-only re-review verified every claim, git baseline, zero overlap across all 29 other linked worktrees, exact x-ray deltas (`counts.buildScripts: 36 → 35`, `worlds.scriptures.scripts: 36 → 35`, `worlds.jesus.scripts: 8 → 7`), and verification commands.

All 4 optional improvements from Pass 2 are applied during execution:
1. Pass `--reporter=list` under `CI=1 PORT=3199` for readable local Playwright logs.
2. Place the fail-closed guard before `PERICOPES.map(...)` in `build-synoptic-pericopes.mjs` so guard exit skips disk reads while keeping all bindings live for ESLint.
3. Resolve `ROOT` via `import.meta.url` in `tests/site-xray.test.ts` for CWD independence.
4. Rebase and re-run `npm run data:xray` if concurrent `codex/furnace-count` merges `public/meta/site-xray.json` before this PR.
