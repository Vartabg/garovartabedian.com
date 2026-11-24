# Scripts Directory Triage Plan (`r2`)

- **Date:** 2026-11-23
- **Baseline:** `master` @ `fde3e9b4` (rebased onto `origin/master` after PR #294)
- **Branch / Worktree:** `codex/scripts-triage` (`/Users/vartny/.codex/worktrees/scripts-triage/garovartabedian`)

## 1. Objective

Make `scripts/` (452 git-tracked files across 20 subdirectories + 2 root scripts) legible and safe to operate without breaking any build, test, media, research, release, or concurrent-worktree contract:

1. **Archive verified zero-overlap superseded / drifted one-off generators** into `scripts/archive/` with a fail-closed CLI overwrite guard so stale writers cannot silently clobber reviewed `public/` JSON files.
2. **Exclude `scripts/archive/` from active build-script counts** in `scripts/site/build-site-xray.mjs`, refresh `public/meta/site-xray.json`, and lock the exclusion invariant in `tests/site-xray.test.ts`.
3. **Publish an accurate directory inventory** in `scripts/README.md` and `scripts/archive/README.md`, linked from top-level `README.md`, distinguishing automated build/test/release gates, active on-demand data/media/research pipelines, and archived historical scripts.

## 2. Archiving Criteria (Strict)

A script moves to `scripts/archive/` **only if all three hold**:

1. **Zero active references** anywhere in `package.json`, `src/`, `tests/`, `scripts/smoke/`, `scripts/release/`, `docs/`, `README.md`, `.github/`, or any active sibling script.
2. **Superseded or drifted** relative to committed outputs or active pipelines (replaced by a general pipeline, or its committed output was subsequently edited directly without updating the script so re-running it silently reverts reviewed changes).
3. **Zero overlap** with all active concurrent unmerged worktree branches (verified directly by `git diff --name-only origin/master...<branch>` across every linked worktree, not only `agent-task collisions` on an uncommitted plan).

### Files Moving to `scripts/archive/` (2 files, 1,522 lines)

| Current path | New path | Lines | Evidence & adjustment |
|---|---|---:|---|
| `scripts/scriptures/generate-thessalonians-v2.mjs` | `scripts/archive/generate-thessalonians-v2.mjs` | 1,261 | One-off batch writer (`87473bc4`, 2026-09-02) emitting hardcoded 1–2 Thessalonians guides; zero external callers and zero overlap across all active worktrees; superseded by `scripts/scriptures/build-guides-v2.mjs` (`npm run data:guides`), `rebind-guide-grounding.mjs`, and `stamp-guide-review.mjs`. Update relative imports `./guide-validation.mjs` → `../scriptures/guide-validation.mjs` and `./build-guides-v2.mjs` → `../scriptures/build-guides-v2.mjs`; add archive header note and fail-closed `--allow-archived-overwrite` CLI guard before any writes. `ROOT = path.resolve(SCRIPT_DIR, "../..")` remains valid at depth 2. |
| `scripts/jesus/build-synoptic-pericopes.mjs` | `scripts/archive/build-synoptic-pericopes.mjs` | 261 | Initial generator (`30d4685a`, 2026-09-04) for `public/jesus/synoptic-pericopes.json`; zero external callers and zero overlap across all active worktrees. `public/jesus/synoptic-pericopes.json` was subsequently directly edited on 2026-10-26 (`e44579f3`) to revise `traditionLabel` and `synopsis` prose without updating the script, making it an overwrite footgun in `scripts/jesus/`. Update usage comment, add explicit header warning citing `e44579f3` drift, and add fail-closed `--allow-archived-overwrite` CLI guard before any writes. `ROOT = path.join(path.dirname(...), "../..")` remains valid at depth 2. |

**Fail-closed CLI guard (both archived writers):** Before the write loop / `writeFileSync`, check `if (!process.argv.includes("--allow-archived-overwrite"))` and exit with code `1` after printing a concise error pointing to `scripts/archive/README.md` (and, for `build-synoptic-pericopes.mjs`, warning about overwriting `e44579f3` edits).

### Deferred Due to Active Concurrent Worktree Overlap (Held in Place)

| Path | Lines | Reason deferred |
|---|---:|---|
| `scripts/scriptures/generate-romans-v2.mjs`, `romans-data-1.mjs`, `romans-data-2.mjs` | 2,153 | Active unmerged worktree `codex/grok-content-review` (`fa9640e9`, 2026-11-18) modifies `generate-romans-v2.mjs` and `romans-data-1.mjs`. Held in `scripts/scriptures/` to avoid a rename/modify conflict and avoid preempting that branch's disposition; documented in `scripts/README.md` and `scripts/archive/README.md` as queued for archiving once `codex/grok-content-review` lands or closes. |

### Explicitly Retained Scripts (Not Archived)

| Path | Reason retained in place |
|---|---|
| `scripts/apostles/build-map-land.mjs` | Sole canonical geometry baker for `src/lib/apostles/map-land.json` (used by `SendingMap.tsx`); not superseded or drifted; keeps `SITE_XRAY.worlds.apostles.scripts === 1` accurate on `/apostles`. |
| `scripts/parallels/build-enoch-matrices.mjs` & `build-enoch-sources.mjs` | Actively maintained (`086c1c5b`, 2026-10-19) alongside `build-matrix.mjs`, `provenance.mjs`, `witness-metadata.mjs`, and `validate-parallels.mjs`. |
| `scripts/scriptures/build-guides.mjs` | Referenced by `tests/build-guides-safety.test.ts` and `src/lib/scriptures/server/guides.ts:26`. |
| `scripts/scriptures/{batch-narration,narration_pipeline,verify-narration,generate-narration}.py` | `tests/narration-pipeline.test.ts` directly exercises `batch-narration.py`, `narration_pipeline.py`, and `verify-narration.py`; `generate-narration.py` is the single-chapter CLI wrapper sharing `narration_pipeline.py`; `scripts/research-audio/*` reuses `narration_pipeline.py`. |
| `scripts/{angels,church,early,jesus}/copy-*-image.sh` & `build-*-manifest.mjs` | Active media-lane workflows documented in `docs/media-lanes.md`. |
| `scripts/early/{acquire-expansion.py,extract-secret-book-james.py,import-library.mjs}` | Tested (`tests/early-secret-james.test.tsx`, `scripts/smoke/early-library.test.mjs`) or documented (`docs/research/scripture-library-import.md`). |
| `scripts/scriptures/{build-data,build-doorways,build-shelf,extract-words,ingest-enoch,reconstruct-jubilees,stamp-guide-review}.mjs`, `build-nave.py` | Referenced by `src/`, `tests/`, `scripts/scriptures/README.md`, or sibling pipelines (`scripts/README.md` notes that `build-data.mjs` and `charles-supplement.mjs` also emit `shelf.json` atomically alongside standalone `build-shelf.mjs`). |
| `scripts/check-repo-health.sh` | Advisory `.git` vs `public/` binary-bloat check; documented in `scripts/README.md`. |
| `scripts/social/build-romans-8-promo.mjs` | Wired to `npm run social:romans8` in `package.json`. |
| `scripts/research/*`, `scripts/research-audio/*`, `scripts/bench/*`, `scripts/benchmarks/*`, `scripts/reading/*` | Active local research/benchmark/audio workflows (`package.json`, `tests/retrieval-benchmark.test.ts`, `scripts/smoke/research-audio.test.mjs`). |

## 3. Site X-Ray Contract Update

`scripts/site/build-site-xray.mjs` currently counts `counts.buildScripts` by recursively walking all of `scripts/` for `/^build-.*\.(?:mjs|ts)$/`. Moving `build-synoptic-pericopes.mjs` into `scripts/archive/` would still count it as an active build script on the live Engineer lens (`XrayFoot.tsx`: `"N build scripts write M JSON files"`) unless exact `scripts/archive` is excluded.

Changes:

1. **`scripts/site/build-site-xray.mjs`:**
   - Define `const ARCHIVE_SCRIPTS_DIR = path.join(ROOT, "scripts", "archive");`.
   - Update `walk(directory, keep, skipDir)` to skip `entry.isDirectory()` when `skipDir?.(target)` is truthy, and forward `skipDir` on recursive `walk(target, keep, skipDir)`.
   - Update `files(directory, keep, skipDir)` to pass `skipDir` through to `walk(path.join(ROOT, directory), keep, skipDir)`.
   - Call `files("scripts", (name) => /^build-.*\.(?:mjs|ts)$/.test(name), (target) => target === ARCHIVE_SCRIPTS_DIR)` for `counts.buildScripts` so only top-level `scripts/archive` is skipped (not any arbitrary nested directory named `archive`).
2. **`public/meta/site-xray.json`:** Regenerate via `npm run data:xray` on baseline `fde3e9b4`. Expected deterministic diff:
   - `counts.buildScripts`: `36` → `35`
   - `worlds.scriptures.scripts`: `36` → `35`
   - `worlds.jesus.scripts`: `8` → `7`
   - `counts.unitTestFiles` remains `175`, `worlds.apostles.scripts` remains `1`, all other fields unchanged.
3. **`tests/site-xray.test.ts`:** Independently walk all of `scripts/` for `/^build-.*\.(?:mjs|ts)$/` (including `scripts/archive/`) and walk `scripts/archive/` for `/^build-.*\.(?:mjs|ts)$/`, then assert:
   - `archivedBuildScripts.length >= 1`
   - `collectSiteXray().counts.buildScripts === allBuildScripts.length - archivedBuildScripts.length`

## 4. Documentation Additions

1. **`scripts/README.md`:** Concise, accurate directory & workflow map covering all 20 active subdirectories + 2 root scripts + `archive/`:
   - **Automated Build, Test & Release Gates:** `release/`, `site/`, `smoke/`, `a11y/`, `browser/`, `lib/`, `check-voice.ts`, `check-repo-health.sh` (explicitly naming what runs in `prebuild`, `postbuild`, `test`, `test:a11y`, and `release:production`).
   - **Data, Media & Research Pipelines:** `scriptures/` (including note on `build-shelf.mjs` vs `build-data.mjs`/`charles-supplement.mjs` and the 3 Romans scripts temporarily held pending `codex/grok-content-review`), `early/`, `jesus/`, `parallels/`, `angels/`, `apostles/`, `church/`, `media/`, `research/`, `research-audio/`, `bench/`, `benchmarks/`, `reading/`, `social/`, linking existing subdirectory READMEs (`scripts/scriptures/README.md`, `scripts/research/README.md`, `scripts/research-audio/README.md`, `docs/media-lanes.md`).
   - **Archived One-Off Generators:** `archive/` (linking `scripts/archive/README.md`).
2. **`scripts/archive/README.md`:** Table of archived files (`generate-thessalonians-v2.mjs`, `build-synoptic-pericopes.mjs`), original path & commit, why archived (superseded vs output drifted), the `--allow-archived-overwrite` safeguard, and a brief note listing the 3 Romans scripts deferred while `codex/grok-content-review` is open.
3. **`README.md`:** Update the `"How the data is generated"` row in the top-level map table to link [`scripts/README.md`](scripts/README.md) alongside `scripts/*/build-*.mjs`.

## 5. Verification Plan

All commands run with Node 24 (`/Users/vartny/.nvm/versions/node/v24.20.0/bin` first on `PATH`) inside `/Users/vartny/.codex/worktrees/scripts-triage/garovartabedian`:

1. **Install dependencies in clean worktree:** `npm ci --include=dev`
2. **Archived script syntax, import/export, and fail-closed guard checks:**
   - Syntax check: `for f in scripts/archive/*.mjs; do node --check "$f"; done`
   - Read-only ESM import/export audit script: parse static `import ... from "..."` statements in `scripts/archive/*.mjs`, assert every resolved relative target file exists on disk, and dynamically import each side-effect-free target (`scripts/scriptures/build-guides-v2.mjs` [CLI-guarded], `scripts/scriptures/guide-validation.mjs`) to assert every named import (`prepareTarget`, `validateGuideV2`) is defined (`typeof mod[name] !== "undefined"`).
   - Fail-closed runtime guard check: run `node scripts/archive/generate-thessalonians-v2.mjs` and `node scripts/archive/build-synoptic-pericopes.mjs` without `--allow-archived-overwrite`, confirming both exit non-zero, print the archive warning, and leave `public/` completely unmodified (`git diff -- public/` empty).
3. **Regenerate x-ray snapshot:** `npm run data:xray`
4. **Full repo checks:** `npm run lint`, `npm run typecheck`, `npm run test` (unit + smoke), `npm run build` (runs full `prebuild` + `next build` + `postbuild` traces), then verify `git status --short` shows zero unexpected generated-file drift and `git diff --check` is clean.
5. **Isolated Playwright Engineer-lens check:** Run against the freshly built `.next` output on a dedicated unused port (never reusing an existing server on port 3000):
   `CI=1 PORT=3199 npx playwright test tests/e2e/engineer-xray.spec.ts tests/e2e/section-homes-xray.spec.ts`
6. **Finish, merge, and production release check:**
   - Finish via `agent-task finish` (gitleaks staged + history security gate, clean branch push), open and merge PR into `master`.
   - Fast-forward `/Users/vartny/code/garovartabedian` (`master`).
   - Confirm `/Users/vartny/code/garovartabedian/.git/local-production-release.lock` is absent (wait if an earlier concurrent release is still in progress — never remove another process's lock) before running `npm run release:production`, so `master` (including PR #293, PR #294, and this PR) ships cleanly to production.

## 6. Independent Reviewer Reading List

Review independently from these files only (without conversation history or author verdict):

- `AGENTS.md`
- `docs/plans/2026-11-23-scripts-triage.md` (this `r2` plan)
- `package.json`, `README.md`, `eslint.config.mjs`, `tsconfig.json`, `playwright.config.ts`
- `scripts/scriptures/generate-thessalonians-v2.mjs`, `scripts/scriptures/build-guides-v2.mjs`, `scripts/scriptures/guide-validation.mjs`
- `scripts/jesus/build-synoptic-pericopes.mjs`, `public/jesus/synoptic-pericopes.json`
- `scripts/apostles/build-map-land.mjs`, `scripts/parallels/build-enoch-matrices.mjs`, `scripts/parallels/build-enoch-sources.mjs`
- `scripts/site/build-site-xray.mjs`, `public/meta/site-xray.json`, `tests/site-xray.test.ts`, `src/app/_components/xray/XrayFoot.tsx`, `src/lib/site/world-xray.ts`
- `scripts/release/production.mjs`
