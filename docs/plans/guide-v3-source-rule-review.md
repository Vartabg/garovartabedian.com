# Review record: the source rule in guide-v3, and binding Mark

- **Plan reviewed:** `docs/plans/guide-v3-source-rule.md`, revision 1,
  against `master` at `930c5337` plus the uncommitted work on
  `codex/mark-bind-v3`.
- **Reviewer:** one fresh-context Claude subagent on the Opus model, given
  the plan and a reading list, with no conversation history, told to change
  nothing. The EGM skill prefers the Gemini route where suitable; this
  review needed line evidence across the validator, the build and stamp
  scripts and the tests, which the same route did well on the earlier plan.
- **Reading list:** `AGENTS.md`; the plan; `guide-rubric-v3-mark.md`; both
  rubric files; `guide-validation.mjs`; `build-guides-v2.mjs`;
  `stamp-guide-review.mjs`; `build-guide-record.mjs`;
  `build-corpus-health.mjs`; `scripture-guide-v3.test.ts`;
  `guide-record.test.ts`; the 2026-11-23 source check record; Mark 2, 14, 16.
- **Completion evidence:** a full report after 15 tool calls. The reviewer
  recomputed the prompt hash of all 560 bound guides (all match, none on
  guide-v3), ran the stamp command with `--dry-run` (16 of 16), and
  confirmed no test pins the guide-v3 rubric text.
- **Verdict on revision 1:** "Ready after blockers fixed."

## Findings and dispositions

| # | Finding | Kind | Disposition |
|---|---|---|---|
| 1 | The rubric said a kept claim names its source in the sentence. Several kept Mark sentences name none, and some background claims were never checked. | Blocker | Accepted. Revision 2: the record carries the source; naming it in the sentence is encouraged, not required. A last sweep (decision 1a) lists the background claims no check has covered, and each is sourced or cut before the stamp. |
| 2 | A drafter cannot see the record, and the prompt tells it to use only the supplied grounding. The exception read as a drafting rule. The rubric freezes when Mark is bound. | Blocker | Accepted. The rubric now says the two rules bind a draft and that only a reviewer may keep or add such a claim. "Unsupported by the grounding" became "by the grounding or the book's source check record". Done before the stamp. |
| 3 | The record path used `<book>`, which elsewhere means the book code; the files use the lower-case name. The new record was untracked with no check that it ships. | Blocker | Accepted. The path now says "book name, lower case". Acceptance check 4a requires both records and this file to be committed. |
| 4 | The lock covers the briefing, cross-references, topical matches, hosted text and exemplar, not only the rubric. | Optional | Accepted; decision 3 says so. |
| 5 | The history bullet reached the briefing only through "follows the same rule". | Optional | Accepted; it now says "in neither the hosted text nor the supplied briefing". |
| 6 | A new bullet required every interpreting sentence to mark itself, which Mark does not do. | Optional | Accepted in a narrower form. The new bullet is withdrawn. The existing bullet on naming disagreement gains one sentence: where one reading is given alone, say it is a reading. |
| 7 | Acceptance check 4 should state the totals. | Optional | Accepted. |
| 8 | Re-binding a guide already on guide-v3 works; dry-run first. | Note | Followed. |
| 9 | This review record did not exist. | Note | This file. |

## Limits

One reviewer, one pass. The reviewer did not check whether the 2026-11-21
record covers every language claim, and did not run the browser check.
Revision 2 was not sent back for a second review; its changes are the
reviewer's own proposed corrections.