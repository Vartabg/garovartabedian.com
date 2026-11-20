# Remove the batch-template chapter guides

Plan revision 2 (after independent review; see `remove-template-guides-review.md`).
Source baseline: `master` at `1f4542ba`.

## Goal

Garo's decision (2026-11-19, "Option 1"): the site should hold only finished
chapter guides. The leftover batch-template guide files leave the site and the
public code copy, and the empty "not published" box leaves the chapter pages.
No new guides are written in this change.

## What is true today

- `public/scriptures/guides/{BOOK}/{chapter}.json` holds 1,586 files.
- `hasTemplateSignature` (`scripts/scriptures/guide-validation.mjs`) flags 829
  of them as v1 generator boilerplate. None of the 829 has a `reviewStatus` or
  `generation` record. 30 books are template only.
- The chapter page already withholds them: `getChapterGuide`
  (`src/lib/scriptures/server/guides.ts`) and `loadChapterGuide`
  (`src/lib/scriptures/client.ts`) return `null` for a template guide.
- They are still public: each file is served as a static asset (for example
  `/scriptures/guides/HEB/11.json`), `public/llms.txt` gives that URL pattern,
  and the files are in the public repository snapshot.
- On a chapter with no published guide, `ChapterGuide.tsx` renders a box:
  "Cheat Sheet — {book} {chapter}", a "not published" badge, and a paragraph.
- Two tests forbid what this change does on purpose:
  - `tests/scripture-guide-integrity.test.ts`: "every hosted WEB chapter has
    exactly one guide".
  - `tests/corpus-health.test.ts`: the coverage gap "must equal exactly the
    chapters of unguided books".

## Decisions

1. **Delete by the repository's own detector.** Remove exactly the files for
   which `hasTemplateSignature(guide)` is true. Do not use a looser pattern:
   ten reviewed guides contain the phrase "What is happening in" in a real
   question and must stay.
2. **Keep the template guard in code.** `isTemplateGuide`, the `null` return in
   `getChapterGuide` and `loadChapterGuide`, and the `{ kind: "template" }`
   x-ray case stay. They cost nothing and still hide a template file if one is
   ever generated again.
3. **Replace the two rules with ones that keep their intent.** The intent was
   that finished guides never disappear silently. New rules:
   - no file under `public/scriptures/guides` carries a template signature
     (replaces "every hosted WEB chapter has exactly one guide");
   - every guide file belongs to a chapter of a hosted text. "Hosted" means
     any hosted translation, through the existing `hostedTextsFor(book)` in
     `tests/scripture-guide-integrity.test.ts`, because ENO and JUB guides sit
     on Charles texts, not WEB;
   - `corpus.guides.batchTemplateGuides` is 0;
   - `corpus.guides.files` does not fall below 757, the count at removal;
   - coverage keeps one rule only: `status` is "complete" exactly when
     `guides === chapterSlots`. The "gap equals whole unguided books" rule in
     `tests/corpus-health.test.ts` is removed, since gaps are now per chapter.
     `tests/e2e/recruiter-path.spec.ts` asserts the same status rule and stays
     true; only its comment is updated.
4. **Corpus health keeps its shape.** `schemaVersion` and every field stay.
   Values change: `files` 757, `batchTemplateGuides` 0,
   `customStructuredGuides` 757, `review.untracked` 20, coverage `guides` 757
   and `status` "incomplete". The coverage `scope` sentence is reworded,
   because "one guide for every hosted union book/chapter slot" is no longer
   the goal that the number describes.
5. **A chapter with no guide shows nothing where the box was** in Reader mode.
   The Engineer lens tag stays and uses its existing wording, "No guide file
   for this chapter". (Garo sees this call before commit; the alternative is
   one quiet line.)
6. **Counts in copy follow the data.** Lines that say "N still on the batch
   template" drop that clause when N is 0 and say how many chapters have a
   guide:
   - `src/lib/scriptures/xray-tags.ts` (published-guide detail line);
   - `src/lib/site/world-xray.ts` (Scriptures home detail line);
   - `src/app/labs/page.tsx`: the `guide-coverage` row says "complete
     structural coverage", which stops being true; the `custom-guides` row
     names the template count; the `editorial-review` row says agent panels
     reviewed "every non-template guide", which is wrong today: 20
     non-template guides, 18 in ENO and 2 in PSA, have no review record.
   - The "no guide" Engineer tag gains one detail line with the site-wide
     count, as the template tag had.
7. **Two accuracy fixes that the removal exposes:**
   - `opengraph-image.tsx` falls back to "Read the text, its cross-references,
     and its guide." for a chapter without a guide. Drop "and its guide" there.
   - `scripts/site/build-ai-legibility.ts`: say that not every chapter has a
     guide and that a missing one returns 404.
8. **Out of scope:** the v1 generator `scripts/scriptures/build-guides.mjs`,
   the v2 pipeline, the 20 unreviewed non-template guides, and writing guides.
   One known effect on the v2 pipeline: `build-guides-v2.mjs --only-template`
   used the template files as its rewrite queue and now selects nothing. A
   chapter without a guide is an ordinary target when the flag is left off.
   The removed files stay in git history.
9. **The links in the removed box are not lost.** "Book overview" is the book
   link in the chapter header, and "Sources" is in the site menu and footer.

## Affected files

- Delete: the 829 flagged files under `public/scriptures/guides/`.
- Edit: `ChapterGuide.tsx`, `opengraph-image.tsx`, `xray-tags.ts`,
  `world-xray.ts`, `labs/page.tsx`, `build-corpus-health.mjs` (scope sentence),
  `build-ai-legibility.ts`.
- Regenerate with `npm run data:health`, `npm run data:xray` and
  `npm run data:llms` (all three run in `prebuild`): `public/meta/corpus-health.json`,
  `public/meta/site-xray.json` if it changes, and `public/llms.txt`. The
  release fails on any `git status --porcelain` change after its build, and
  `tests/corpus-health.test.ts` compares the snapshot to a fresh collection.
- Tests: `scripture-guide-integrity.test.ts`, `corpus-health.test.ts`,
  `chapter-xray.test.ts`, `world-xray.test.ts`, the comment in
  `e2e/recruiter-path.spec.ts`, plus any test that reads a removed file (the
  review found none).

## Failure behavior

- A guide URL that used to return a template file returns 404. The reader
  already treats a failed guide fetch as "no guide" (`.catch(() => null)`).
- A chapter page for a removed guide renders as an unguided chapter does today,
  without the box.
- If a template file is generated again, the page still hides it and the new
  test fails the build.
- `next.config.ts` gives `/scriptures/guides/:path+` a day of freshness and a
  week of stale-while-revalidate. A browser that fetched a template file
  before the release can keep its copy for that long. Nothing on the site
  links to those files, so no page shows them.

## Acceptance checks

- `node` count with `hasTemplateSignature`: 0 flagged, 757 files.
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass,
  with no generated-source drift after the build.
- Locally, `/scriptures/protestant/HEB/11` shows no Cheat Sheet box in Reader
  mode and the "No guide file" tag in Engineer mode; `/scriptures/protestant/MRK/4`
  still shows its guide.
- After release: `/scriptures/guides/HEB/11.json` returns 404 and
  `/scriptures/guides/MRK/4.json` returns 200 on the live site (checked with a
  fresh query string, to step around caches).
- After the public snapshot refresh: the public repository has 757 guide files.
