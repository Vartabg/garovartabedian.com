# Case study: the release record

Branch `claude/case-study-release-record`, from master `ef840592`. Plan revision 2 (after independent review; see the `-review.md` beside this file).

## Owner decisions

| Decision | Status |
| --- | --- |
| Proof on the portfolio must be working things built from real data, not sentences ("I want there to be actual proof not in words but being implemented in the portfolio") | Accepted |
| An interactive record of every production release attempt, shown in chat as a prototype | "Yes, this kind" |
| Build it into the case study page; each release adds its own history; public fields are date, steps passed, where it stopped, minutes; no commit codes or file paths; remove the old buzzword sections in the same change; independent plan review before building | "Yes, build it" |
| Exact copy (including "Before the release that published this page…"), placement and screenshots | To be shown to the owner before commit |

## Goal

`/work/garovartabedian` shows every earlier production release attempt since the release script began keeping reports (2026-09-07). Each one shows whether it went live, how far it got, and the step that stopped it. The data comes from the release reports themselves and is checked on the built page before upload.

## Data source

`scripts/release/production.mjs` writes one JSON report per attempt to `~/.local/state/garovartabedian/releases/` (mode 0600). File names start with the start time in milliseconds. Fields used: `status`, `startedAt`, `completedAt`, `steps[]` (`name`, `status`). Fields never published: `commit`, `url`, `stagedUrl`, `deploymentId`, `error`, and recovery fields.

## Classification (`classify` in `scripts/release/release-record.mjs`)

Every report gets exactly one outcome. `Remove release checkout` (cleanup) is never the cause.

- **live**: a step whose name starts with `Promote` passed. This covers recovery runs, and runs whose domain checks failed after promotion.
- `status: "complete"` that is not live throws. This invariant catches an unknown promote name.
- **stopped**: the first non-cleanup step with `status: "failed"`. If there is none and the report `status` is `failed`, the last non-cleanup step stops it, because a code check rejected its result.
- **interrupted** (shown as "ended early"): everything else. This means the process ended without recording a result: killed, Ctrl-C, or refused before `try` (wrong origin, lock held). The stop is the running non-cleanup step, or the last non-cleanup step.
- The report of the release that is running is excluded, compared by resolved path. Reports keep file-name order.
- Malformed files (not JSON, or no `steps` array) are skipped.

## Public output (allowlist, fail closed)

```json
{ "schemaVersion": 1, "steps": ["Locate repository", "…"],
  "attempts": [{ "date": "2026-10-30", "outcome": "live", "ran": [0, 1], "stop": null, "minutes": 30 }] }
```

- `steps` is a name dictionary in first-seen order. `ran` lists the steps reached, without cleanup. `stop` is a position in `ran`, or `null`.
- `date` is the start date in America/New_York.
- Every step name must:
  - match `^[A-Za-z][A-Za-z0-9 .-]{0,63}$`;
  - contain no 7+ character hex run;
  - contain a dot only when it ends with one of the production `domains` exported by `production.mjs`.

  The serialized record must not match 40-hex, `http(s):`, `/Users/` or `dpl_`. Any violation throws, so the `Write release record` step fails and the release stops before upload. Reports with an empty `steps` array are skipped as malformed.

## Release integration (`releasePipeline(run, sha, onStaged, record)`)

- `main()` passes `{ reports, exclude: reportFile }`. Without `record`, the order is unchanged, so the existing tests still hold.
- Immediately after `Unit and smoke tests` and immediately before `Pull production configuration`, the step `Write release record` runs `node scripts/release/release-record.mjs --reports <dir> --exclude <current report> --out .release-record/record.json`.
- Immediately after `Build production locally`, the step `Verify release record` runs `node scripts/release/check-release-record.mjs`. It fails unless `.next/server/app/work/garovartabedian.html` contains `data-release-attempts="<N>"`, with N equal to the record's attempt count. That catches a build that quietly showed the fallback.
- `.release-record/` is gitignored, so `Check generated source` stays clean. It is not added to `.vercelignore`.
- As a second guard, the page's loader throws when `VERCEL_ENV === "production"` and the record is missing. That covers a release run from an older local script without the new steps.

## Page

- `release-record-data.ts`: `readReleaseRecord(file?)` reads the file synchronously, so the page stays static. It returns `null` when the file is absent or invalid, and throws in production builds.
- `ReleaseRecordSection({ record })`: a server-safe section with the h2 "Release record". With no record it shows the fallback line. Tests render this section directly.
- `ReleaseRecord` (client) shows:
  - A summary sentence.
  - A legend.
  - The chart: one SVG bar per attempt. Live bars are full height; stopped bars are height = steps reached / longest run. That gives a non-colour cue.
  - Bar colours, each pair validated for colour-blind separation and 3:1 against its page: teal `#14866a` and coral `#c8532c` on light vellum, `#1d9e75` and `#d85a30` on dark.
  - Pointer selection by nearest x, so a tap anywhere works on phones.
  - A focusable `role="slider"` with `aria-valuetext`, and Left/Right/Home/End keys.
  - An `aria-live` detail line, with step chips (white on `#0f6e56` or `#993c1d`, AA).
  - A `<details>` table of every attempt.
- The sections "Computational Research & AI Dossier Suite" (with its five buttons) and "From Ancient Manuscripts to Enterprise Knowledge" are removed, and their content lists are deleted. Other sections stay.
- The CSS lives in `src/app/styles/core.css`, next to `.case-cards`.
- `/work/garovartabedian` is added to `scripts/a11y/config.mjs`, and the route count in `tests/a11y-runner.test.ts` moves from 71 to 72. Both new components are added to `scripts/check-voice.ts`.
- A plain mouse hover does not change the selection. Click, tap, touch-drag and keys do, so the `aria-live` line isn't flooded.
- The summary gives three counts (went live, stopped before going live, ended early). It makes no claim about what production showed in between.

## Failure behaviour

| Situation | Result |
| --- | --- |
| Missing reports folder | Empty record. The loader treats it as missing, so the build throws under `VERCEL_ENV=production`; otherwise `Verify release record` fails. Either way the release stops before upload |
| Private-looking text | Release stops at `Write release record` |
| Build shows the fallback | Release stops at `Verify release record` |
| No JavaScript | The summary, the server-rendered SVG, the detail line and the table still show |
| Operator cancel | Recorded by the executor as a failed step, so it appears as "stopped at" that step. The copy says "stopped", never "caught" |

## Acceptance checks

1. `tests/release-record.test.ts`: every outcome, including refused-before-try, cleanup failing after a rejection, recovery promotion, and the complete-without-promote throw. Also the allowlist, the private-text throws, the excluded current report, malformed files, and the built-page check.
2. `tests/production-deployment.test.ts`: the record step order and arguments, a failed verify blocking staging, and no record steps without `record`.
3. `tests/case-study-source.test.tsx`: the section with fixture data, the fallback without it, the production-build throw, and the existing public-code link.
4. `npm run lint`, `npm run typecheck`, `npm run test` and `npm run build` pass. The page stays static.
5. Browser at 375px and desktop, light and dark: no horizontal overflow, keyboard and tap selection work, the table opens, and axe passes on the route.
6. The counts shown equal an independent count from the reports folder: on 2026-10-31, 139 = 69 live + 66 stopped + 4 ended early.
