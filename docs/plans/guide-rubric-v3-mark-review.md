# Review record: a second guide rubric that fits the Mark standard

- **Plan reviewed:** `docs/plans/guide-rubric-v3-mark.md`, revision 1,
  against `master` at `d5362ce1`.
- **Reviewer:** one fresh-context Claude subagent on the Opus model. It was
  given the plan and a reading list, with no conversation history, and told
  to read nothing else and to change nothing. The EGM skill prefers the
  Gemini route where suitable; this review needed line evidence across about
  twenty repository files, which the fresh-context subagent had already done
  well the day before, so it was used again.
- **Reading list:** `AGENTS.md`; the plan; `guide-validation.mjs`;
  `GUIDE_RUBRIC_V2.md`; `build-guides-v2.mjs`; `stamp-guide-review.mjs`;
  `rebind-guide-grounding.mjs`; `build-corpus-health.mjs` and
  `corpus-health.ts`; `build-guide-record.mjs` and the two `guide-record`
  modules; `GuideRecord.tsx`, `GuideRecordSection.tsx`; `ChapterGuide.tsx`;
  `types.ts`; `labs/page.tsx`; `scripts/lib/guide-validation.mjs`; six test
  files; Mark 1, 14, 16 and one guide-v2 guide.
- **Completion evidence:** the reviewer returned a full report after 33 tool
  calls (about five minutes), with file and line evidence. It also ran the
  validator on Mark and simulated stamping Mark 1 in memory.
- **Verdict on revision 1:** "Ready after blockers fixed."

## Findings and dispositions

| # | Finding | Kind | Disposition |
|---|---|---|---|
| 1 | The plan said who drafted Mark is not recorded. Commit `a657d4b6` says the guides were "rewritten by hand" and carries `Co-Authored-By: Claude Opus 5`. | Blocker | Accepted and confirmed with `git show`. The lead had read a truncated log. Revision 2 states the evidence, proposes the label `Claude Opus 5`, and leaves the choice to Garo. |
| 2 | "Source lock … the guide was drafted from" would be false for Mark, which was written before the bundle and the rubric existed. | Blocker | Accepted, and wider than reported: the sentence is live today and is inaccurate for all 322 review-bound guides. Revision 2 gives review-bound rows "…the guide was bound to at review" and lists it as a correction. |
| 3 | `--generated-at <now>` would publish a false time. | Blocker | Accepted. Revision 2 uses the commit time of `a657d4b6` and defines the field for review-bound guides in `types.ts`. |
| 4 | The stamp command lacked `--reviewer` and could not run. | Blocker | Accepted. The full command is in decision 7. |
| 5 | `tests/chapter-xray.test.ts` pins Mark 4's reviewer and date; `tests/guide-record.test.ts` ties totals to v2 passing only. Neither was listed. | Improvement | Accepted. Both are in the file list. |
| 6 | Re-stamping erases the 7-pass review from the page; the Muse and Gemini label would read as if those models made the attribution; nothing proved the cross-vendor review happened. | Improvement | Accepted. The reports and dispositions are saved under `docs/reviews/`, the earlier review is named there, the reviewer label names the lead, and an acceptance check requires the file. |
| 7 | The "all 560 pass guide-v3" test could not be written with the planned mismatch rule. | Improvement | Accepted. The argument now means "measure under this version"; the mismatch guard moved to the stamp tool. |
| 8 | The glossary `verses` rule checks only that a ref resolves; the `verses` format check also ran under guide-v2. | Improvement | Accepted. Only guide-v3 reads `verses`; the rubric and the health scope text say the tie is the reviewer's judgment. The optional shared-prefix test was not added: it would pass Crucifixion and still reject Shema and The longer ending, so it would not remove the need for the tie. A zero-entry glossary was not adopted; Mark 14's glossary is offered to Garo instead, with a fallback if he drops it. |
| 9 | Keeping the exemplar tied to Mark 1 risks moving every hash at the next edit of Mark 1. | Improvement | Accepted. Revision 2 freezes the exemplar now. |
| 10 | Copy left undefined: the headline counting two rubrics as one, "the current rubric" in the earlier-state lines, the `/labs` row, the top-level `rubricVersion`, the provenance message naming guide-v2, and the 575/182 branch. | Improvement | Accepted. Decision 8 gives each line; the record names the rubric per chapter and in a note; the message loses its version; `rubrics` replaces `rubricVersion`; the acceptance check has both totals. The label "Passes every current check" is kept, since Garo approved it on 2026-11-20 and the record now says which rubric applies. |

The reviewer also confirmed against source: every row of the measured table;
the five fields stripped from the exemplar; that stamping Mark 1 leaves the
projection hash unchanged; the provenance message's two matchers; that
guide-v3 only widens; the totals; and that the Romans and Thessalonians
generators, the `llms.txt` builder and the search indexes are not affected.

## Re-review of revision 2

The same reviewer was resumed with its own context and asked whether its four
blockers were resolved and whether revision 2 introduced new ones. It
returned after 3 tool calls.

- Blockers 1 to 4: all **resolved**.
- New blockers: **none**. It confirmed that "hashes stay byte-identical"
  holds for the frozen exemplar, that only `build-guides-v2.mjs` reads Mark 1
  as an exemplar, that the provenance message has exactly two matchers, and
  that each reader-facing sentence states only what the code checks.
- Three improvements for implementation, all taken: the reviewer label should
  put the lead first as the one who signs (deferred with the binding); the
  `generatedAt` definition in `types.ts` says "as supplied by whoever bound
  it"; the exemplar pin is computed from the parsed object's serialisation,
  so reformatting the file cannot trip it.
- It disagreed with no disposition.
- Verdict: "Ready."

## After the review: what changed in revision 3

The grounding review of Mark, which the plan required before binding, found
verified slips and a large set of unchecked claims. Revision 3 defers the
binding and ships the tooling, the sentence correction and 13 verified
corrections. The versioning design the reviewer assessed is unchanged. The
display rule added in revision 3 (say nothing of a second rubric until a
guide uses it) was not reviewed; it removes reader-facing text and adds none.

## Remaining limitations

- The reviewer did not run the test suite or the 560-guide hash rebuild.
  Both ran during implementation: the record and health builders rebuilt
  with all 560 guide-v2 locks matching.
- The review does not establish that Garo likes the result. He sees the
  visible calls before commit.
