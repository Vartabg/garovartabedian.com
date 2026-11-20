# Guide checks record on the site case study

Plan revision 3 (after independent review and one re-review; see
`guide-checks-record-review.md`).
Source baseline: `master` at `121f51ea`.

## Brief

- **Who it is for:** an engineer or hiring manager who opens
  `/work/garovartabedian` to see whether the chapter guides, which AI agents
  drafted, were held to a standard.
- **What they can do:** see every hosted chapter at once, open any one, and
  read which checks its guide passed, who or what reviewed it, and what is
  missing.
- **Action and result:** select a chapter mark; its own record appears below
  the map, with a link to that chapter.
- **Accepted by Garo:** the release record on the same page as the kind of
  proof he wants (working, real data, failures in view); the clickable sketch of
  this map (2026-11-20, "Yes, build it"), after he was shown that it makes
  public that the older guides do not meet the current rubric.
- **Rejected by Garo:** stat tiles and arrow-row cards as proof; the words
  "structure" and "digestible" in site copy.
- **Not decided:** the same record on each chapter page (Engineer lens). Out of
  scope here.

## What is true today (measured on the baseline)

- `public/scriptures/canons.json` lists 86 books and 1,586 chapter slots.
- `public/scriptures/guides/{BOOK}/{chapter}.json` holds 757 guides.
- 560 guides carry `generation.rubricVersion === "guide-v2"` and all 560 pass
  `validateGuideV2` (`scripts/scriptures/guide-validation.mjs`) with the
  prompt hash from `prepareTarget` (`scripts/scriptures/build-guides-v2.mjs`).
  540 of them are `reviewStatus: "agent-reviewed"`; 20 have no review fields.
- 197 guides have no `generation` record. All 197 are agent-reviewed. Run
  through `validateGuideV2` without a prompt hash, and ignoring the
  missing-provenance message, 174 report at least one failure and 23 cannot be
  checked because the primary hosted text does not carry that chapter
  (for example `EZR/11`, `PSA/151`).
- All 757 pass `validateGuideContract` (`scripts/lib/guide-validation.mjs`),
  the same facts `tests/scripture-guide-integrity.test.ts` checks: identity,
  resolved references, and key verses that quote one hosted translation.
- No guide is `human-reviewed`.
- The release record precedent: `ReleaseRecordSection.tsx` and
  `ReleaseRecord.tsx` in `src/app/work/garovartabedian/`, styles under
  `.release-record` in `src/app/styles/core.css`, tests in
  `tests/case-study-source.test.tsx`.
- `public/meta/corpus-health.json` is the aggregate ledger. It is imported by
  Labs and by every chapter page, so per-chapter rows do not belong in it.
- The chapter route builds every tradition, book and union chapter
  (`generateStaticParams`), but a tradition's preferred translation can lack a
  chapter; the page then renders with no text. Twenty-five rows are in that
  position under the first tradition that lists their book (for example
  `PSA/151` under Protestant).

## Decisions

1. **A generated, tracked file holds the record.**
   `scripts/site/build-guide-record.mjs` exports `collectGuideRecord()`,
   `serializeGuideRecord()` and `writeGuideRecord()` and writes
   `public/meta/guide-record.json`. The CLI body is guarded with
   `process.argv[1] === fileURLToPath(import.meta.url)`, as in
   `build-corpus-health.mjs`, because tests import the module.
   `package.json` gains `"data:guide-record"` and `prebuild` runs it right
   after `data:health`. The file is public at `/meta/guide-record.json`.
   Measured run time: about 5 seconds. It loads each book's hosted texts once;
   `validateGuideV2` and `prepareTarget` read them again per guide, as they do
   for corpus health.

2. **Record shape (schemaVersion 1).** No timestamp, so a rebuild with the
   same guides is byte-identical.

   ```jsonc
   {
     "schemaVersion": 1,
     "generatedBy": "scripts/site/build-guide-record.mjs",
     "rubricVersion": "guide-v2",
     "totals": { "chapters": 1586, "current": 560, "earlier": 197, "none": 829,
                 "agentReviewed": 737, "humanReviewed": 0, "unreviewed": 20 },
     "traditions": ["protestant", "catholic", "orthodox", "ethiopian", "armenian"],
     "reviewers": ["…"],                       // distinct reviewer strings
     "drafters": [{ "kind": "measured", "label": "gpt-5.5" }],  // or "attributed"
     "books": [{ "id": "GEN", "name": "Genesis",
                 "chapters": [ /* one row per chapter, in order */ ] }]
   }
   ```

   A row is `{ "chapter": n, "state": "none", "tradition": 0 }` or:

   ```jsonc
   { "chapter": 1, "state": "current",   // or "earlier"
     "tradition": 0,        // index into traditions, see below; null if none qualifies
     "keyVerses": 3, "questions": 8, "outlineParts": 6,
     "verses": 31,          // see decision 3
     "review": "agent",     // "agent" | "human" | "none"
     "reviewer": 0,         // index into reviewers, or null
     "reviewedAt": "2026-09-28",  // or null
     "drafter": 0,          // index into drafters, or null
     "rebinds": 0,          // generation.rebound length
     "problems": 0 }        // see decision 3
   ```

   - Books follow `canons.bookOrder`. `reviewers` and `drafters` are in
     first-seen order, walking books in that order and chapters upward.
   - `tradition` is per row: the first tradition, in `canons.traditions`
     order, that lists the book and whose preferred hosted translation (the
     `pickTranslation` rule: first of `transPreference` the book has, else the
     book's first translation) has a non-empty chapter at that number. So the
     chapter link always opens a page with text. On the baseline every row
     gets one.
   - The file is written with one row per line so a guide change is a
     one-line diff.

3. **States are what was checked, per guide, at build time.**
   - Every guide must pass `validateGuideContract` with all hosted texts from
     `loadHostedTexts`. If one throws, `collectGuideRecord` throws: such a
     guide must not ship, and the unit suite already fails on it.
   - `current`: the guide has guide-v2 provenance
     (`generation.rubricVersion === GUIDE_RUBRIC_VERSION`) and
     `validateGuideV2({ expectedPromptHash: prepareTarget(book, chapter).promptHash })`
     returns no failures. If a guide with that provenance fails,
     `collectGuideRecord` throws, as `writeCorpusHealth` does. `problems` is 0.
   - `earlier`: a guide without guide-v2 provenance. `problems` is the number
     of failure messages from `validateGuideV2` called without a prompt hash,
     not counting the message that contains `missing or malformed guide-v2
     generation provenance` (messages carry a `BOOK/chapter: ` prefix).
   - `verses` is the verse count of that chapter in the text `validateGuideV2`
     checks against: the book's `web` text if hosted, otherwise its first
     hosted text. It is 0 when that text lacks the chapter; then the rubric
     cannot run and `problems` is `null`.
   - `none`: no guide file.
   - `drafter`: `generation.model` gives `kind: "measured"`;
     `generation.attributedModel` gives `kind: "attributed"`; neither gives
     `null`.

4. **The section sits directly under "Release record"** on
   `/work/garovartabedian`, headed "Guide checks". Before writing it, read
   `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
   (AGENTS.md rule). Files:
   - `src/lib/site/guide-record.ts`: types and the pure `packGuideRecord()`,
     `unpackRow()`, `packedState()`. It imports no data, so the client
     component may import it.
   - `src/lib/site/guide-record-data.ts`: the JSON import and
     `guideRecordFrom()`, which throws unless `schemaVersion === 1` and
     `books` is non-empty. Server code only.
   - `src/app/work/garovartabedian/GuideRecordSection.tsx` (server): heading,
     summary sentence, the client component, and the by-book table. It passes
     the packed record as a prop: a chapter with no guide is one number, a
     guide is a number array in a fixed order with review dates indexed, so
     the page payload is a fraction of the 200 KB file.
   - `src/app/work/garovartabedian/GuideRecord.tsx` (client): legend, map,
     detail panel.

5. **Summary sentences, from `totals`.** The four counts that match the
   legend sit above the map; the review counts and the history sentence sit
   under the detail panel, so the map is not pushed down a phone screen.
   Together: "The Scripture section hosts 1,586
   chapters. 560 have a guide that passes every current check. 197 have a
   guide that passes only the earlier checks. 829 have no guide. An agent
   panel reviewed 737 guides. No person has reviewed any." Verbs agree with
   the counts ("1 has"). The last sentence becomes "A person has reviewed N."
   when `humanReviewed` is above 0. One more sentence is fixed history, kept
   as a constant with the commit named in a comment (`b91da770`, 829 guide
   files deleted on 2026-11-20): "On Nov 20, 2026, 829 batch-template guides
   were removed; those chapters show no guide until one is written and
   checked."

6. **The map.** One mark per chapter in canon order, in a wrapping flex row so
   it reflows on a phone (9 px marks on desktop, 7 px at 40rem and below).
   Solid teal = current, half-filled teal = earlier, hollow = none; the three
   differ by fill shape, not only by colour. Marks are `aria-hidden`.
   - Each book is a `display: contents` wrapper around its marks, rendered by
     a memoized component that receives its selected chapter or `null`. A
     selection re-renders at most two books, with no imperative DOM writes.
     The first mark of each book after the first has a small left gap; the
     selected book's marks carry an underline.
   - The map container is the control: `tabIndex={0}`, `role="slider"`,
     `aria-valuemin={1}`, `aria-valuemax={chapters}`, `aria-valuenow`,
     `aria-valuetext` ("Mark 4: passes the earlier checks only"), the pattern
     `ReleaseRecord.tsx` uses. Arrow keys move one chapter, Page Up and Page
     Down move to the next or previous book, Home and End go to the ends.
   - Pointer: a tap or click (the `click` event) selects the mark under it;
     in a gap, the nearest mark within a few pixels. A mouse drag with a
     button held follows the pointer. A touch does not follow, and a finger
     that starts a page scroll on the map does not change the selection.
   - A labelled "Book" `<select>` in the detail panel jumps to the first
     chapter of any book. It is the direct route on a phone, where marks are
     small, and by keyboard, where the last book is many key presses away.
   - It opens on Genesis 1.

7. **The detail panel** (`aria-live="polite"`): chapter name; the Book select;
   "Previous chapter" and "Next chapter" buttons; the state with its mark;
   then these lines, word for word.
   - current:
     - "Key verses: N, each a quotation from the hosted text."
     - "Questions: N, each tied to a verse in this chapter."
     - "Outline: N parts that cover all V verses with no gaps."
     - "Source lock: the saved fingerprint still matches the sources,
       instructions and rubric the guide was drafted from." When `rebinds` is
       above 0, add: "It was moved once after a citation's link or name was
       corrected, with the reason on file." ("N times" above 1.)
     - the drafter line; the review line.
   - earlier:
     - "Its verse references resolve, and its key verses quote a hosted
       translation."
     - `problems` above 0: "It has no record of being drafted under the
       current rubric. Run against it today, the rubric reports N problems."
       ("1 problem".)
     - `problems` 0: "It has no record of being drafted under the current
       rubric, so it is not counted as current. Run against it today, the
       rubric reports no problems."
     - `problems` null: "It has no record of being drafted under the current
       rubric, and the rubric cannot run here: the translation it checks
       against does not carry this chapter."
     - These sentences say what the code checks (`generation.rubricVersion`
       is not the current one). They make no claim about when the guide was
       written.
     - the drafter line; the review line.
   - none: "No guide for this chapter."
   - Drafter line:
     - measured: "Drafted by: {label}. The run recorded the model."
     - attributed, label exactly `hand-authored` (the fixed marker
       `scripts/scriptures/stamp-guide-review.mjs` writes): "Written by hand.
       Stated at review, not recorded by a run."
     - attributed, any other label: "Drafted by: {label}. Stated at review,
       not recorded by a run."
     - null: "Drafted by: not recorded."
   - Review line:
     - agent: "Review: agent panel on {date}, recorded as “{reviewer}”. No
       person has reviewed it."
     - human: "Review: {reviewer} on {date}."
     - none: "Review: none recorded."
     - `{date}` uses `dateLabel` from `ReleaseRecord.tsx`, exported for this.
   - A link "Open {book} {chapter}" to
     `/scriptures/{traditions[tradition]}/{id}/{chapter}`; no link when
     `tradition` is null.

8. **By-book table** in a `<details>` ("Every book as a table"): book,
   chapters, current, earlier, no guide. It is the non-visual equivalent of the
   map at book level; the slider and the Book select give chapter level.
   Under it, one line of links so the checks can be read: the rubric and the
   validator in the public code copy (`SITE_SOURCE_URL`, both files are there
   today) and `/meta/guide-record.json`.

9. **Styles** go beside `.release-record` in `core.css` as `.guide-record*`,
   reusing that block's teal values and its light/dark selector pattern
   (`html[data-a11y-theme="dark"]` and the `system` media query). The hollow
   mark uses `var(--muted)`. Each mark colour must reach 3:1 against the page
   background in both themes; this is measured in the browser, because the
   axe gate checks text only.

10. **Voice check.** The two new TSX files join `PORTFOLIO_SOURCE_FILES` in
    `scripts/check-voice.ts`.

11. **`llms.txt`.** `scripts/site/build-ai-legibility.ts` names
    `/meta/corpus-health.json`; it gains one line for
    `/meta/guide-record.json`, and `public/llms.txt` is regenerated.

12. **Out of scope:** the Engineer tag on chapter pages, Labs, the README,
    rewriting any guide, and changes to the validators.

## Affected files

- New: `scripts/site/build-guide-record.mjs`, `public/meta/guide-record.json`,
  `src/lib/site/guide-record.ts`, `src/lib/site/guide-record-data.ts`,
  `src/app/work/garovartabedian/GuideRecordSection.tsx`,
  `src/app/work/garovartabedian/GuideRecord.tsx`, `tests/guide-record.test.ts`.
- Edit: `package.json` (script and `prebuild`),
  `src/app/work/garovartabedian/page.tsx`,
  `src/app/work/garovartabedian/ReleaseRecord.tsx` (export `dateLabel`),
  `src/app/styles/core.css`, `scripts/check-voice.ts`,
  `scripts/site/build-ai-legibility.ts`, `public/llms.txt` (generated),
  `tests/case-study-source.test.tsx`.

## Failure behavior

- A missing or malformed `guide-record.json` breaks the import, and a file
  with another `schemaVersion` throws in `guideRecordFrom`, so the build fails
  instead of rendering an empty or half-filled section.
- A stale file: `prebuild` rewrites it, the release's generated-source check
  fails on the resulting diff, and `tests/guide-record.test.ts` compares the
  file to a fresh `collectGuideRecord()`.
- A guide-v2 file that fails the rubric stops this script and
  `data:health`, so it cannot be published as `current` or as `earlier`.
- A new book or chapter in `canons.json`: rows appear with no code change.
- A first human review: the summary sentence and the review line switch
  wording from the data.
- A chapter no tradition's reader has text for: the row's `tradition` is null
  and the panel shows no link.
- JavaScript off: the summary, legend, map marks and table are in the HTML;
  only selection needs script.

## Acceptance checks

- `collectGuideRecord()` on the baseline gives totals 1,586 / 560 / 197 / 829
  and review 737 / 0 / 20; `current` equals
  `corpus-health.json` `corpus.guides.v2.passing`; `current + earlier` equals
  `corpus.guides.files`; `none` equals `unionChapterSlots - files`.
- `tests/guide-record.test.ts`: the tracked file equals a fresh collection,
  byte for byte; the totals above tie to corpus health; every `current` row
  has `problems === 0`; `problems` is null exactly where `verses` is 0; rows
  are in chapter order and every book has `canons.books[id].chapters` rows;
  every row's tradition lists the book and its preferred translation has that
  chapter's text; `packGuideRecord` then `unpackRow` returns each row
  unchanged.
- `tests/case-study-source.test.tsx`, from a small fixture: the summary
  sentence, `role="slider"`, a `data-guide-chapters` marker with the chapter
  count, one mark per chapter, the table rows, the human-reviewed wording, and
  each of the three `earlier` lines (problems above 0, 0, and null).
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, with no
  generated-source drift after the build.
- In the browser on `/work/garovartabedian`, light and dark, desktop and
  375 px: no horizontal page scroll; selecting Mark 4 shows the earlier-checks
  record; selecting 1 Chronicles 1 shows "No guide"; arrow keys and Page
  Up move the selection and the announced text; the Book select jumps to a
  book; the link for Psalms 151 opens a chapter page that shows its text.
- `tests/e2e/worlds-responsive.spec.ts` (covers this route at phone widths)
  and `npm run test:a11y` for `/work/garovartabedian` pass.
