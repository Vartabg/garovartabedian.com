# Independent review: case study release record

- **Reviewer:** a fresh-context general-purpose Claude agent, given only the plan and a reading list, with no conversation history.
- **What it reviewed:** plan revision 1 at master `ef840592`. It noted that untracked draft files were already in the worktree and that it did not review them.
- **What it read:** the plan, `AGENTS.md`, `scripts/release/production.mjs`, `tests/production-deployment.test.ts`, `src/app/work/garovartabedian/page.tsx`, `src/lib/portfolio-content.ts` (440–620), `tests/case-study-source.test.tsx`, `.gitignore`, `.vercelignore`, and the field structure of the newest release report. It checked further excerpts in `package.json`, `next.config.ts`, the a11y config and test, `scripts/release/browser.mjs`, `scripts/check-voice.ts`, core.css tokens, and vercel@65's build code.
- **Verdict:** "Ready after blockers fixed."

## Blockers and what was done

| # | Finding | Disposition |
| --- | --- | --- |
| B1 | Production could silently show the fallback line: no check that the built page used the record, the record step depends on the operator's local script, and vercel@65 `build` filters through `.vercelignore` | Fixed. Added the `Verify release record` step after the build, which reads the built HTML marker and compares the count. Added a loader throw when `VERCEL_ENV=production` and the record is missing. Dropped the `.vercelignore` line. |
| B2 | The privacy allowlist was only tested on fixtures, never on the published file | Fixed. `buildReleaseRecord` now validates every step name against a strict pattern and scans the serialized output; both throw. Throws are unit-tested. |
| B3 | Report shapes that fit no outcome (refused before `try`, killed between steps), and cleanup failing after a rejection picked as the cause | Fixed. Cleanup is ignored in all stop rules, every report not live or stopped is "interrupted" (shown as "ended early"), and complete-without-promote throws. Each case has a fixture. |

## Optional findings

| # | Finding | Disposition |
| --- | --- | --- |
| 1 | Page tests depend on local files | Accepted: `readReleaseRecord(file?)` and `ReleaseRecordSection({ record })`; tests render the section |
| 2 | About 2.5px bars cannot be tapped on phones | Accepted: nearest-bar selection by pointer x across the whole chart |
| 3 | Light-theme marks below 3:1, and colour was the only cue | Accepted: per-theme mark colours validated at 3:1 on vellum, and live bars at full height as a non-colour cue |
| 4 | The a11y gate never audits the page | Accepted: route added to `scripts/a11y/config.mjs` |
| 5 | The voice check would not see the new copy | Accepted: both components added to `scripts/check-voice.ts` |
| 6 | Bar height was misleading (cleanup counted, older pipelines shorter) | Accepted: cleanup excluded from `ran`, live drawn at full height |
| 7 | An operator cancel looks like a gate stop; a domain-check failure after promotion | Accepted: copy says "stopped at", not "caught"; post-promotion failures count as live, since production changed |
| 8 | The page never shows the release that published it | Accepted as copy ("Before the release that published this page…"); wording goes to the owner |
| 9 | Spec gaps (stylesheet, step placement, sort, ARIA pattern, resolved-path exclude) | Accepted: all stated in revision 2 |
| 10 | The "repository is private" boundary line contradicts the public code button | Out of scope; shown to the owner as a separate decision |

## Targeted re-review of revision 2

- **Reviewer and scope:** the same reviewer, in its own context, checking the three blockers against revision 2 and the implementation.
- **What it read:** the plan, this file, `release-record.mjs`, `check-release-record.mjs`, the `production.mjs` diff, `release-record-data.ts`, `ReleaseRecordSection.tsx`, `ReleaseRecord.tsx`, the `page.tsx` diff, and the three test files. It ran the three test files (22/22) and changed no files.
- **Verdict:** "Ready." B1, B2 and B3 are all resolved. It also confirmed that vercel@65 `build` loads the pulled `.vercel/.env.production.local`, which carries `VERCEL_ENV`, so the loader guard fires during the release build. That holds while the Vercel project keeps exposing system variables.

| # | Optional finding | Disposition |
| --- | --- | --- |
| 1 | The summary clause "stayed on the last version that passed every step" isn't derived from the data, and ended-early runs were counted as stopped | Accepted: the clause is removed, and the summary gives three separate counts |
| 2 | Mouse hover floods the `aria-live` line | Accepted: hover no longer selects; click, tap, touch-drag and keys do |
| 3 | The name pattern would pass a staged hostname or short hash | Accepted: a dot is allowed only before a known production domain, and 7+ hex runs are rejected; tested |
| 4 | An empty `steps` array would render as stopped at "undefined" | Accepted: such reports are skipped as malformed; tested |
| 5 | Plan doc mismatches (missing-folder failure point, VERCEL_ENV status, a11y-runner test not listed) | Accepted: corrected in revision 2 |

## Remaining limitations

- The record shows attempts before the release that publishes it, never that release itself.
- If Vercel stops exposing system variables, the loader guard stops firing. `Verify release record` still blocks the release.
