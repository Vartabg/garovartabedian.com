# Plan: a second guide rubric that fits the Mark standard

- **Revision:** 3 (2026-11-21). Revision 2 followed the independent review of
  revision 1; revision 3 narrows what ships after the grounding review of Mark
- **Source baseline:** `master` at `d5362ce1`
- **Branch:** `codex/mark-guides-current`
- **Review record:** `docs/plans/guide-rubric-v3-mark-review.md`

## Goal

Mark's 16 chapter guides are the standard Garo chose on 2026-08-04. They
were written outside the drafting pipeline, in commit `a657d4b6`. The
guide-v2 rubric, written later to bound machine drafts, rejects all 16.
Garo's ruling on 2026-11-21: do not cut Mark to fit the rubric; add a second
rubric version with wider limits and bind Mark to it. The 560 guides already
locked to guide-v2 must not change by one byte.

Done means: the Mark guides carry guide-v3 provenance and pass it; the 560
guide-v2 guides have the same prompt hashes as before; the public record
says which rubric each guide passed and claims nothing the code did not
check.

## Scope change in revision 3: Mark is not bound in this change

Before binding, two models from other vendors read all 16 Mark guides
against the hosted text and the Mark briefing
(`docs/reviews/2026-11-21-mark-grounding-review.md`). The lead verified 13
slips against the text. 32 places make a Greek, Hebrew, Aramaic or Latin
claim that the briefing does not supply, and about 119 state history or
geography that nothing has checked. Marking Mark "reviewed" over that would
claim more than was done.

So this change ships:

- the rubric tooling in decisions 1 to 6, with no guide locked to guide-v3;
- the corrected "Source lock" sentence in decision 8 and the sentence that
  names guide-v2 for older guides;
- the 13 corrections to Mark, each verified against the hosted text. Garo
  ruled "Fix all 13" on 2026-11-21. Mark keeps its present state and its
  review stamp of 2026-08-25; the corrections and who made them are in the
  review file;
- one display rule: the pages say nothing of a second rubric until a guide is
  locked to it. With one rubric in use the record keeps the single "Read the
  rubric" link, the note about rubrics is not shown, and `/labs` has no
  guide-v3 row.

Deferred until Mark's language and background claims are source-checked:
decision 7 (glossary `verses` on Mark, the Mark 14 glossary, the binding) and
the Mark lines of decision 8. Acceptance check 4 for this change is
560 current, 197 earlier, 829 none, with no row on guide-v3. Acceptance
check 1 lists `MRK/` with only the 13 corrections.

## What Mark has that guide-v2 rejects (measured)

| Rule in guide-v2 | Mark |
|---|---|
| 7 to 9 questions | 10 to 14 per chapter; 177 in all, 33 over |
| 3 to 7 outline parts | Mark 14 has 9 |
| 2 to 4 key verses | Mark 8 has 5 |
| a glossary term shares a word of four letters or more with the chapter text | 10 entries do not: Blasphemy (2), Sea of Galilee (4), Denarius (6), Transfigured (9), Shema (12), Apocalyptic (13), Crucifixion (15), and in 16 the codices, The longer ending, Textual criticism |
| at least one `word` question | Mark 5, 10, 15, 16 have none by category |
| at least two glossary entries | Mark 14 has no glossary |

The same glossary rule failed six of 21 models in a drafting trial on
Matthew 5, each on the term "Beatitudes".

## Decisions

### 1. Two supported rubrics, version chosen per guide

`scripts/scriptures/guide-validation.mjs` gains:

```js
export const GUIDE_RUBRICS = {
  "guide-v2": { file: "GUIDE_RUBRIC_V2.md", questions: [7, 9], outlineMax: 7, keyVerses: [2, 4], requireWord: true,  glossaryVerseTie: false },
  "guide-v3": { file: "GUIDE_RUBRIC_V3.md", questions: [7, 14], outlineMax: 9, keyVerses: [2, 5], requireWord: false, glossaryVerseTie: true },
};
```

`GUIDE_RUBRIC_VERSION` stays `"guide-v2"`. It is the drafting default, so
`build-guides-v2.mjs` keeps drafting under guide-v2 and every existing hash
is computed exactly as today.

Everything not in that table is the same in both versions: grounding,
quotation matching, outline coverage with no gaps, themes 3 to 6, question
refs, the `hard_verse` requirement, glossary minimum of two entries, prose
residue checks, review fields, provenance fields.

guide-v3 only widens. Every guide that passes guide-v2's content rules also
passes guide-v3's. A test proves this over all 560 (see decision 2 for how
it calls the validator).

### 2. The validator reads the guide's own version

`validateGuideV2` keeps its name and gains one optional argument,
`rubricVersion`, which means "measure the content against this version's
limits".

- Limits come from `rubricVersion` if given, else from
  `guide.generation.rubricVersion` when that is a supported version, else
  guide-v2. A guide with no provenance is measured against guide-v2, as
  today, so the 197 older guides keep their reported problem counts.
- The provenance check accepts any supported version in the guide's own
  `generation` block. Its message becomes
  `missing or malformed guide generation provenance` (no version in it), and
  the two matchers change with it: `build-guide-record.mjs` and
  `tests/scripture-guide-v2.test.ts`.
- The validator does not compare the argument with the guide's own version.
  That guard lives in the stamp tool, which writes `generation` with the
  requested version before it validates. The record and health builders pass
  no argument, so each guide is measured against the version it is locked to.
- The "only widens" test calls
  `validateGuideV2({ guide, root, canons, book, chapter, rubricVersion: "guide-v3" })`
  with no `expectedPromptHash` on each guide-v2 file and expects no failures.
- Messages that carry limits print the limits in force.

### 3. The glossary rule in guide-v3

A glossary entry may carry `verses`: an array of refs in the same form as a
question's `verseRefs` (`"15:24"`, `"16:9-20"`).

- Only guide-v3 reads `verses`. guide-v2 behaviour is unchanged in every
  code path.
- Under guide-v3, a present `verses` must be a non-empty array whose every
  ref parses, is in this chapter, and ends inside it.
- Under guide-v3 an entry passes the "active" test if its term shares a word
  with the chapter text (today's test) or it has valid `verses`.

What the code checks here is that the ref resolves. That the term belongs to
those verses is the reviewer's judgment, not a machine result.
`GUIDE_RUBRIC_V3.md` and the corpus-health `scope` text say so in those
words. Nothing on the site says the glossary was machine-checked against the
text.

`ChapterGuide`'s type gains `verses?: string[]` on glossary entries. The
chapter page does not render it in this change. `GUIDE_SCHEMA` (drafting
only, guide-v2) is not changed.

### 4. The prompt and its hash

`buildGuidePrompt(grounding, { rubricVersion = GUIDE_RUBRIC_VERSION } = {})`
reads the rubric file for that version and writes `Rubric version: <version>`.
`prepareTarget(book, chapter, options)` passes `options.rubricVersion`
through. With no option the output is byte-identical to today.

`GUIDE_RUBRIC_V3.md` is the guide-v2 text with the Shape numbers and the
glossary bullet changed, and the `word` question described as expected where
a chapter turns on a word, not required.

### 5. Freeze the exemplar

`MARK_EXEMPLAR` is today read from `public/scriptures/guides/MRK/1.json`,
minus `reviewStatus`, `reviewedAt`, `reviewer`, `sourceIds`, `generation`.
Its content is inside every prompt hash. Garo's own review of Mark comes
next and may edit Mark 1; one edit would move all 576 hashes, and the rebind
tool cannot repair that.

So this change writes that projection, key order kept, to
`scripts/scriptures/mark-exemplar.json`, and `build-guides-v2.mjs` reads the
exemplar from there. Hashes stay byte-identical. A test pins the sha256 of
the frozen file's content and says what breaks if it moves. The published
Mark 1 can then be edited like any other guide.

### 6. Tools that name the version

- `stamp-guide-review.mjs`: `--rubric` accepts any supported version;
  `--bind-hand-authored` requires one. It prepares the target and validates
  with that version and writes it into `generation.rubricVersion`. For a
  guide that already has `generation`, a `--rubric` that differs from the
  guide's own is refused.
- `rebind-guide-grounding.mjs`: accepts any supported version and prepares
  the target with the guide's own version.
- `build-corpus-health.mjs`: the `v2` block stays guide-v2 only. A `v3`
  block with the same five fields is added, `validation.guides.v3Rubric`
  mirrors `v2Rubric` with its own `scope` text, and `writeCorpusHealth`
  throws if either has a failing guide. `src/lib/site/corpus-health.ts`
  types and `/labs` gain the v3 row.
- `build-guide-record.mjs`: a guide is `current` when it carries a supported
  version and passes it with the expected hash for that version (it still
  throws otherwise). Each `current` row gains `rubric`, an index into a new
  top-level `rubrics` array, which replaces the top-level `rubricVersion`.
  `schemaVersion` becomes 2. `guideRecordFrom`, `packGuideRecord` and
  `unpackRow` follow.

### 7. Changes to Mark's 16 files

No question, answer, outline, key verse, theme or summary is edited.

1. `verses` is added to the 10 glossary entries listed above, each pointing
   at the verse or verses the term names (for example Crucifixion → 15:24,
   The longer ending → 16:9-20).
2. Mark 14 gets a glossary of three entries, written by the lead and shown to
   Garo before commit. If he drops it, Mark 14 is left out of the binding and
   keeps its present state, and the totals are 575 / 182 / 829.
3. The guides are bound with:

   ```
   node scripts/scriptures/stamp-guide-review.mjs --status agent-reviewed \
     --reviewer "<reviewer label>" --books MRK --rubric guide-v3 \
     --bind-hand-authored --attributed-model "<drafter label>" \
     --generated-at 2026-08-04T15:51:37.000Z --grounding-bundle-reviewed
   ```

**`generatedAt`.** For a review-bound guide this is when the draft was
written, as best recorded, not when it was bound. For Mark that is the
commit time of `a657d4b6`. `types.ts` gains that definition.

**The drafter label.** `a657d4b6` says "All 16 Mark chapter guides rewritten
by hand against the hosted WEB text" and carries
`Co-Authored-By: Claude Opus 5`. The proposed label is `Claude Opus 5`,
which the page shows as an attribution stated at review, not a measured run.
The alternative is the fixed marker, which the page shows as "Written by
hand, not generated". This is Garo's call, shown with the commit evidence.

**The review behind the binding.** `--grounding-bundle-reviewed` asserts
that the exact prepared bundle was inspected. Two models from other vendors
(Muse Wonder 1.0 through the `muse` CLI, Gemini 4 Hydrogen through `agy`)
each read every Mark guide against its chapter text and book briefing and
report contradictions, misquotes, unsupported claims and overreach. The lead
(Claude Fable 5.2) checks every finding against the hosted text and decides.
A guide with an unresolved must-fix finding is not bound. The reports and
the lead's disposition of each finding are saved as
`docs/reviews/2026-11-21-mark-grounding-review.md`, which also names the
earlier review this stamp replaces on the page (the 7-pass agent panel of
2026-08-24, commit `ef77c7d1`).

**The reviewer label** names the lead and both readers and the date, so the
page's "Attributed to … by <reviewer>" names who made the attribution.

Fixing a finding means editing Mark's reader-facing text. Any such edit is
listed for Garo with the evidence before commit; none is made silently.

### 8. What a reader sees (all listed for Garo before commit)

Chapter pages:
- Mark's 16 pages gain the provenance sentence they lack today: reviewer and
  date, the drafter label, `guide-v3`, "canonical grounding reviewed".

`/work/garovartabedian`, "Guide checks":
- Mark's marks become "Passes every current check". The label is unchanged.
- The note under the record gains one sentence built from the data: "Guides
  are checked against the rubric they are locked to: 560 against guide-v2
  and 16 against guide-v3, which has wider limits."
- A current chapter's record gains the line `Rubric: guide-v3.` or
  `Rubric: guide-v2.`
- **A correction to a sentence that is live today.** "Source lock: the saved
  fingerprint still matches the sources, instructions and rubric the guide
  was drafted from" is true only where the build ran the model
  (`direct-generation`, 238 guides). For the 322 `review-bound` guides, and
  for Mark, the code checks a lock made at review. Those rows will say
  "…the guide was bound to at review." The drafter kind already in the
  record tells the two apart.
- The earlier-state sentences name the rubric that ran: "It has no record of
  being drafted under a current rubric. Run against it today, guide-v2
  reports N problems." The two other variants change the same way.
- "Read the rubric" becomes "Read the rubrics: guide-v2 · guide-v3".

`/labs`: one new row, `16 / 16`, "guides locked to the wider guide-v3 limits
that pass them".

## Files

- `scripts/scriptures/guide-validation.mjs`, `build-guides-v2.mjs`,
  `stamp-guide-review.mjs`, `rebind-guide-grounding.mjs`,
  `GUIDE_RUBRIC_V3.md` (new), `mark-exemplar.json` (new)
- `scripts/site/build-corpus-health.mjs`, `build-guide-record.mjs`
- `src/lib/scriptures/types.ts`, `src/lib/site/corpus-health.ts`,
  `src/lib/site/guide-record.ts`, `guide-record-data.ts`
- `src/app/work/garovartabedian/GuideRecord.tsx`, `GuideRecordSection.tsx`,
  `src/app/labs/page.tsx`
- `public/scriptures/guides/MRK/1.json` to `16.json`
- generated: `public/meta/corpus-health.json`, `guide-record.json`,
  `site-xray.json`
- tests: `scripture-guide-v2.test.ts`, `guide-record.test.ts` (the totals
  tie becomes v2 passing plus v3 passing), `corpus-health.test.ts`,
  `case-study-source.test.tsx`, `chapter-xray.test.ts` (it pins Mark 4's
  reviewer and date), `scripture-book-briefing.test.tsx` as needed, and a
  new `scripture-guide-v3.test.ts`
- `docs/reviews/2026-11-21-mark-grounding-review.md` (new)

## Failure behaviour

- A guide-v3 file that fails guide-v3, or whose hash does not match its
  guide-v3 prompt, stops `data:health` and `data:guide-record`, so the build
  and the release stop.
- A guide naming an unsupported version is treated as having no provenance:
  it cannot be `current`.
- If any of the 560 guide-v2 hashes moves, the guide record generator throws
  and the exemplar pin test fails.
- The stamp tool stamps none of a batch if any guide in it fails.

## Acceptance checks

1. `git diff --stat master -- public/scriptures/guides` lists only `MRK/`.
2. For every guide-v2 file, `prepareTarget(book, chapter).promptHash` equals
   the stored hash (the guide record test rebuilds the record and compares).
3. New tests: guide-v3 limits accept Mark's shapes and reject one past each
   limit; guide-v2 still rejects them; all 560 guide-v2 guides pass guide-v3
   content rules; a `verses` ref outside the chapter fails under guide-v3;
   guide-v2 ignores `verses`; the frozen exemplar's hash is pinned; the stamp
   tool refuses a `--rubric` that differs from a guide's own.
4. `public/meta/guide-record.json` totals: 576 current, 181 earlier, 829
   none, with 16 rows on guide-v3 (or 575, 182, 829 and 15 if the Mark 14
   glossary is dropped).
5. `docs/reviews/2026-11-21-mark-grounding-review.md` exists and lists, per
   chapter, each reader's findings and the lead's disposition.
6. `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass
   with no generated-file drift after the build.
7. Browser: a Mark chapter page shows the provenance sentence; the case
   study map shows Mark as current and the chosen chapter's rubric line; a
   review-bound and a direct-generation chapter show their different source
   lock sentences; light and dark, desktop and 375 px.

## Out of scope

- Drafting new guides under guide-v3, and the muse, Antigravity and opencode
  transports for the build script.
- Matthew, Luke, John, Acts, and the nine books without briefings.
- Garo's own review of Mark (`human-reviewed`). It follows this change,
  one chapter at a time.
- Rendering glossary `verses` on the chapter page.
