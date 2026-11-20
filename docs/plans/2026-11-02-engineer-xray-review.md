# Review record: Engineer lens x-ray plan

## Reviewed

- Plan: `docs/plans/2026-11-02-engineer-xray.md`, revision 1, on branch `codex/engineer-xray-plan` from master `f6591f99`.
- Reviewer: one fresh-context Claude subagent (general-purpose, no access to the planning conversation; instructed not to read memory or session logs). Read-only; it ran no build or test commands. It also inspected a 2026-11-01 production build left in the `parables-e2e-inventory` worktree to confirm emitted HTML paths.
- Reading list supplied: `AGENTS.md`; the release-record plan and its review; `DiscoveryLens.tsx`, `discovery-lens.ts`, `discovery-content.ts`, `layout.tsx`, `discovery.css`; the chapter `page.tsx` and `ReaderClient.tsx`; `scriptures/server.ts`; `build-corpus-health.mjs`; `release-record.mjs`, `check-release-record.mjs`, `release-record-data.ts`; `SOURCES.md`, `canons.json`, `corpus-health.json`; the Mark 4 xref, original, bridge and guide files; `scripts/a11y/config.mjs`, `tests/a11y-runner.test.ts`; `scripts/check-voice.ts`; `package.json`.
- Completion evidence: the agent returned a full report (28 tool uses, about 10 minutes). The lead re-checked every cited line against source before accepting.

## Verdict on revision 1

**Not ready.** Ten material blockers, all accepted and fixed in revision 2.

## Findings and dispositions

| # | Finding | Evidence (checked by lead) | Disposition in revision 2 |
| --- | --- | --- | --- |
| B1 | The bridge "checked" count misread `checker` (a version number) and `sources` (`"c"` = drafted by AI models, `"e"` = eBible tags). Mark 4 has 39 `sources` entries, not 41. | `word-bridge.ts:62`; `bridge-verdicts.mjs:10,66-68` | Accepted. `getBridgeSummary` now returns per-link verdicts from `RawLink[2]` (615 ok / 39 plain / 37 flag) and drafting source per verse (39 ai / 0 ebible / 2 none), with book totals from `bridge/index.json`. Acceptance 2 corrected. |
| B2 | Four of six tag anchors were conditional or per-verse, not stable regions. | `ReaderClient.tsx:768,908,918,947,956,967` | Accepted. Tags now anchor to the verse `<article>`, `.scr-chapter-source`, `#connections`, `ChapterGuide`, `ChapterNeighbours`, `UnseenRecord`, and render even when the child returns `null`. |
| B3 | "Tag above" and "bounding box identical in both modes" contradict. | Plan lines 90, 115 | Accepted. Decision proposed to the owner: content moves down in Engineer; Reader must be pixel-identical to master (acceptance 5). |
| B4 | Tests that the change breaks were not listed. | `tests/discovery.test.ts:4,14,32-33`; `tests/e2e/discovery.spec.ts:14-42,111`; `tests/release-record.test.ts:96-98`; `DiscoveryLens.tsx:21` | Accepted. All four listed with what they assert afterwards. |
| B5 | `generatedOn` in a committed, prebuild-regenerated file fails `Check generated source`; counts drift silently. | `production.mjs:75,79-80`; `tests/corpus-health.test.ts:12` | Accepted. Date dropped; `deepEqual(snapshot, collectSiteXray())` unit test added. |
| B6 | Reading the release record in the root layout runs at render on ISR routes; the file is not traced into function bundles. | chapter `page.tsx:86`; `release-record-data.ts:11-27`; `next.config.ts:62-66` | Accepted, with a different fix than proposed: the record summary is inlined at build via `next.config.ts` `env`, so the layout reads nothing from disk. ISR row added to the failure table. |
| B7 | "Release attempt N" is an ordinal the data cannot support. | `ReleaseRecord.tsx:24`; `release-record.mjs` skips malformed reports | Accepted. Foot shows a count of recorded earlier attempts; wording goes to the owner with the rest. |
| B8 | No mechanism for an Engineer-lens accessibility pass. | `pool.mjs:8-9`; `worker.mjs:50-54`; `tests/a11y-runner.test.ts:50` | Accepted. `#lens=engineer` route suffix handled in `worker.mjs` via `addInitScript`; Lighthouse stays Reader; count 72 → 74. |
| B9 | Foot position and DOM presence unstated; a client-conditional foot would fail the release check. | `layout.tsx:317-324`; `DiscoveryLens.tsx:24`; `discovery-lens.ts:33` | Accepted. Foot renders after `{children}` before `<ReadingNavigation />`, always in the DOM, CSS-gated. |
| B10 | Smoke check compared dates that `SOURCES.md` does not carry per id; ids do not match `canons.translations`. | `SOURCES.md:3-4` and table; `canons.json` | Accepted. `sources.ts` keyed by `canons.translations` with `byBook` for `charles`; smoke test checks row presence and origin word only. |

Optional improvements accepted: reuse `getOriginalChapter`; distinguish template guides; take gate steps from the latest live attempt; replace the numeric-literal test with an output-versus-JSON comparison; page count 6,838 and build-script count 34; name the contrast check (unit test computing WCAG ratio); stricter `home` family rule; "verse slots" wording; wait for the lens attribute after reload; use `CORPUS_HEALTH`.

Optional improvements not taken: none.

## Verified correct by the reviewer

`canons.translations` shape; `readReleaseRecord` location and behaviour; production build emits `.next/server/app/scriptures/protestant/MRK/4.html`; Mark 4 numbers (41 verses; 41 xref verses / 570 links; `sblgnt` 41; neighbours 6 with MAT 13 at 50; guide 10 questions, agent-reviewed 2026-08-25); corpus-health review counts; release step order; `check-voice.ts` file list; `--font-mono` token; `.lens-engineer-copy` gating; 58 browser specs.

## Remaining limitations

- The `next.config.ts` inlining route (the lead's fix for B6) has not been reviewed by the independent reviewer. It removes the render-time read the reviewer objected to; the implementer should confirm `env` values reach the server component bundle in a production build before relying on it, and fall back to `outputFileTracingIncludes` for `.release-record/record.json` if not.
- Colour tokens are not chosen yet; contrast is asserted by a test in the implementation.
- Word Bridge verdict wording and the decision in B3 await the owner.
