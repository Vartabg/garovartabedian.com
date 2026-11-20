# Review record: guide checks record

- **Plan reviewed:** `docs/plans/guide-checks-record.md`, revision 1, against
  `master` at `121f51ea`.
- **Reviewer:** one fresh-context Claude subagent on the Opus model. It was
  given the plan and a reading list, with no conversation history, and told to
  read nothing else and to change nothing.
- **Reading list:** `AGENTS.md`; the release record files in
  `src/app/work/garovartabedian/`; `src/app/styles/core.css` lines 836-960;
  `scripts/site/build-corpus-health.mjs`;
  `scripts/scriptures/guide-validation.mjs`; `scripts/lib/guide-validation.mjs`;
  `prepareTarget` in `scripts/scriptures/build-guides-v2.mjs`;
  `src/lib/site/corpus-health.ts`; `src/lib/scriptures/server/canons.ts`; the
  chapter route's `generateStaticParams`; `tests/case-study-source.test.tsx`;
  `tests/corpus-health.test.ts`; `scripts/check-voice.ts`;
  `scripts/site/build-ai-legibility.ts`; `package.json` scripts; the shape of
  `canons.json`; two sample guides.
- **Completion evidence:** the reviewer returned a full report after 18 tool
  calls (about 150 seconds), with file and line evidence for each finding.
- **Verdict on revision 1:** "Ready after blockers fixed."

## Findings and dispositions

| # | Finding | Kind | Disposition |
|---|---|---|---|
| 1 | Putting the JSON import in the module the client component imports would ship the whole record in client JavaScript. | Blocker | Accepted. Types and pure functions are in `guide-record.ts`; the JSON import is in `guide-record-data.ts`, server only. |
| 2 | The chapter link always routes, but under the first tradition that lists a book the reader can have no text for that chapter (for example Psalms 151). | Blocker | Accepted and confirmed: 25 rows. `tradition` is now per row, the first tradition whose preferred translation has that chapter's text. A test checks every row. |
| 3 | Two drafter labels had no wording. | Blocker | Accepted. Decision 7 gives every drafter sentence. Only the validator's fixed literal `hand-authored` gets special wording. |
| 4 | An earlier guide with zero rubric failures would get contradictory copy. | Blocker | Accepted. Decision 7 has a sentence for `problems` 0, with a fixture test. |
| 5 | "Source lock" named four of the seven inputs the prompt hash covers. | Blocker | Accepted. The sentence now says "the sources, instructions and rubric the guide was drafted from". |
| 6 | A rebind may correct a citation's label as well as its link. | Blocker | Accepted. "a citation's link or name". |
| 7 | Following a touch across a 400 px tall map would fight page scrolling. | Blocker | Accepted. Touch is tap to select; only a mouse drag follows. Taps in gaps take the nearest mark. |
| 8 | "word for word" overstates the key verse check, which ignores case and punctuation and allows omissions. | Improvement | Accepted. "each a quotation from the hosted text". |
| 9 | A guide-v2 file that fails the rubric should stop the build, not become `earlier`. | Improvement | Accepted. `collectGuideRecord` throws. |
| 10 | Spell out the provenance message match, the `verses` text, and first-seen order. | Improvement | Accepted in decisions 2 and 3. |
| 11 | Build and test cost was not stated. | Improvement | Accepted in part. Measured: about 5 seconds, recorded in decision 1. Hosted texts are loaded once per book by the generator; sharing one pass with corpus health is left for later because it would change that script. |
| 12 | Imperative class toggling beside React is premature. | Improvement | Accepted. Each book is a memoized component; a selection re-renders at most two books. |
| 13 | The last book is about 65 key presses away. | Improvement | Accepted. A labelled Book select jumps to any book. The double announcement (slider text and live panel) matches the release record and is left as is. |
| 14 | A valid file of the wrong shape would not fail the build. | Improvement | Accepted. `guideRecordFrom` throws unless `schemaVersion` is 1. |
| 15 | The Next.js docs step was missing. | Improvement | Accepted. Read before writing the components; named in decision 4. |
| 16 | The review date format was not given. | Improvement | Accepted. `dateLabel` is exported from `ReleaseRecord.tsx` and reused. |

The reviewer also confirmed against source: the `validateGuideV2` and
`prepareTarget` signatures, the CLI guard pattern, the `prebuild` position,
the release's generated-source check, that commit `b91da770` deleted exactly
829 guide files on 2026-11-20, that `canons.json` sums to 1,586 slots, that
`check-voice` scans the new files' strings, and that the earlier-guide line
matches `validateGuideContract`.

## Re-review of revision 2

The same reviewer was resumed with its own context (still no conversation
history) and asked only whether its seven blockers were resolved and whether
revision 2 introduced new ones. It also read the generator and the two data
modules, which existed by then. It returned after 4 tool calls.

- Blockers 1 to 7: all **resolved**. Improvement 9 confirmed in the generator.
- **New blocker A:** "It predates the current rubric" is a date claim; the
  code only checks that `generation.rubricVersion` is not `guide-v2`.
  **Accepted.** Revision 3 says "It has no record of being drafted under the
  current rubric."
- **Minor B:** the zero-problem sentence said the guide "has no drafting
  record", which a guide drafted under another rubric version would make
  false. **Accepted**; the revision 3 wording no longer says it.
- **Minor C:** `hand-authored` is the marker `stamp-guide-review.mjs` writes,
  not a literal in a validator. **Accepted**; the plan and the code comment
  name the right file.
- The reviewer checked the other panel sentences against the validator lines
  they describe and found them accurate.
- Verdict: "Ready after blockers fixed." Blocker A is a wording change and is
  fixed in revision 3; no further review was run.

## Remaining limitations

- The reviewer read source; it did not run the generator or the page.
- Mark colour contrast and phone layout are checked in the browser during
  implementation, not by this review.
- The review does not establish that Garo likes the result. He sees the
  visible calls before commit.
