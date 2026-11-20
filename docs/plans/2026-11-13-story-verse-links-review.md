# Independent review: story pages, verse links inside the passage

Reviewed 2026-11-13. Plan `2026-11-13-story-verse-links.md`, revision 1, at
`39f980cf` in the task worktree (branch `codex/story-links-passage`).

## Reviewer and method

One reviewer: a fresh general-purpose Claude agent with no conversation
history, read-only. It was given the plan, the repository rules, and a reading
list of the source the plan touches (the five pages that get the links, their
stylesheets, `reading.css`, the link helpers in `study-context.ts`,
`word-bridge-url.ts` and `story-deeper.ts`, the story data, the unit and
browser tests that render these pages, and the hosted translation, original
and word-link data for the 13 verses). It was told not to edit, build or
test, and not to give a pass or fail. It returned a written report; the
findings below were checked against source by the author before being
accepted.

## What it confirmed

- All 13 verses exist in the World English Bible, the King James and the
  Douay-Rheims, and in the hosted original (`oshb` for 2 Kings and Genesis,
  `sblgnt` for the rest).
- Every verse's chapter is in the word-link index, and each verse has at
  least four rows of kind `link` and status `ok`. Acts 2:8 is the lowest, at
  exactly four.
- None of the 13 books is marked as having editions not verified to line up.
- `studyToolHref` and `wordBridgeHref` accept every verse, and the comparison
  page reads them back.
- The phrases in the verse table appear in the World English Bible text.

## Material findings and what was done

| # | Finding | Disposition |
| --- | --- | --- |
| 1 | The plan gave the new component its own stylesheet. Unit tests import `ParableWalk` and `WordsRoom` under `tsx`, where a CSS import fails, so those suites would crash. | Accepted. The component imports no CSS; its rules go in `src/app/styles/reading.css`, which `globals.css` loads on every page. |
| 2 | "Each page's own colours" was not specific. The angel and Dothan passage boxes are cream with dark reading ink, while those pages set `--ink` and `--story-ink` to a light colour, so slice 3's `--ink` and `--accent` would be unreadable there. `.visual-story-passage a` also sets `inline-flex`, a 2 rem gap and the light ink, and would win at equal specificity. | Accepted. Labels, arrows and hairlines follow the text colour of the box they sit in (`inherit` and `currentColor`); selectors are `.passage-study li > a` or stronger. The browser spec runs axe in light and dark with each passage open. |
| 3 | `WordsRoom` gains a prop, but two test files render it (`tests/jesus-interactions.test.tsx` at lines 87 and 120, `tests/jesus-words-study.test.tsx` at 81, 147 and 200), and the map built inside `page.tsx` had no test of its own. | Accepted. The map is built by `sayingStudyLinks()` in `src/lib/jesus/saying-study-links.ts`, unit-tested for all six sayings. The prop is required and both test files pass it. |
| 4 | Slice 3's language table in `story-deeper.ts` covers only its own seven books. A table for slice 4 alone would leave two tables that can disagree. | Accepted. One table in `verse-study-links.ts` covers the twelve books of both slices; `story-deeper.ts` loses its own. |

## Optional points

| Point | Disposition |
| --- | --- |
| "Fails the build" is wrong for `/jesus/words` and `/jesus/parables`, which render per request. | Accepted. The plan says the unit test is the guard there. |
| The walk test should show the lines are hidden, not absent, on step 1, reach step 4 by pressing Next, and check 44 px for the walk and the sayings. | Accepted. |
| Add 320 px, and run the existing angel, apostle and parable walk specs too. | Accepted. |
| The x-ray snapshot counts browser specs, so it will change. | Accepted. `npm run data:xray` is a step. |
| Use the exact phrases in the table. | Accepted. |
| The sayings page already has "Open the Greek at …" inside its closed guide, and for the prayer that points at 6:11, not the anchor 6:9. | Accepted as a call for the owner (call 5). Nothing is removed. |
| Draw the saying's lines even while its verse is loading. | Accepted. |
| Note the word-link quality: Genesis 28:15, Acts 12:10 and Matthew 5:44 have more words marked "needs review" than checked. | Accepted. Noted in the plan for the owner; no change to the word links. |
| Two row implementations (slice 3's and the new one). | Accepted as intended, and said so in the plan: the path stories' rows do not sit in a coloured box. |
| Dothan's 2.5 rem indent and its drawn arrow. | Accepted. The rows take the indent; the arrow is the same "→" as elsewhere, listed in call 7. |

## Limits

The reviewer read source and data only. It did not build, run tests or look
at the pages. Its report is kept in this session's records, not in the
repository. Contrast and layout are checked in the browser spec and by hand
after the build.
