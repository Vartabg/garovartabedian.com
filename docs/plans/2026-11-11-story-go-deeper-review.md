# Independent review: story pages, links into the story's own passage

Reviewed 2026-11-11. Plan `2026-11-11-story-go-deeper.md`, revision 1, at
`bbd4c05e` in the task worktree (branch `codex/story-go-deeper`).

## Reviewer and method

One reviewer: a fresh general-purpose Claude agent with no conversation
history, read-only. It was given the plan, the repository rules, and a reading
list of the source the plan touches. It was told not to edit, build or test,
and not to give a pass or fail. It completed and returned a written report;
the list below is from that report, checked against source by the author.

Files it reported opening: the plan, `AGENTS.md`,
`src/app/angels/stories/AGENTS.md`, `docs/plans/2026-11-03-say-it-once-repeats.md`,
`StoryReading.tsx`, `stories.css`, `stories/[slug]/page.tsx`, `stories.ts`,
`story-text.ts`, `study-context.ts`, `study-passage.ts`, `word-bridge-url.ts`,
`word-bridge.ts`, `WorldNextSteps.tsx`, `CuriosityCompass.tsx`, `FromHere.tsx`,
`continuity.css`, `core.css` (the `data-from-here` rule), `scriptures/layout.tsx`,
`story-shelf.ts`, `portfolio-content.ts`, `StoryStrip.tsx`, `ReaderClient.tsx`,
`tests/scripture-stories.test.ts`, `tests/e2e/scriptures-hub.spec.ts`,
`tests/site-xray.test.ts`, `playwright.config.ts`, `scripts/a11y/config.mjs`,
and the hosted word-link, original and translation data for the 14 quoted
verses.

## What it confirmed

- All 14 stories have exactly one stop marked `words`, with one cite.
- `.scr-story` is only on the `StoryReading` root, so the stylesheet change
  reaches only the 14 story pages. No browser spec asserts the continuation on
  those routes.
- `studyToolHref` accepts the values the plan passes for every quoted verse,
  and `parseStudyContext` reads them back.
- The Esther and Daniel rule matches `hasUnverifiedStudyNumbering`.
- "Read the chapters in order" and `.scr-story-chapters` are used nowhere
  else.
- The three cards, three tools and the sentence "Each tool opens with its own
  selection." are in the code, and the same strings count to 114 words.
- All 11 compare verses exist in the World English Bible, the King James, the
  Douay-Rheims and the original text.

## Material findings and what was done

| # | Finding | Disposition |
| --- | --- | --- |
| 1 | `scriptures-hub.spec.ts` runs in the desktop project only (`playwright.config.ts:45-54`), so the 44px and no-sideways-scroll checks would never run at phone width. | Accepted. The new tests set 320, 390 and 1280 px themselves. |
| 2 | The plan's example "Read Esther 2–8" contradicted its rule `Read {reference}`: Esther's reference is "Esther" and the story starts at chapter 2, so the line would have read "Read Esther" and skipped chapter 1. | Accepted. Line 1 is now built from the book and the chapters the story covers. A test holds it equal to `Read {reference}` wherever the reference names chapters. Ruth and Jonah read "Read Ruth 1–4" and "Read Jonah 1–4". |
| 3 | "Links at least four words" had more than one reading of the word-link rows, and the browser check proved only the address, not that the word panel opens. | Accepted. The unit check counts rows of kind `link` and status `ok` (at least four), and requires the chapter in the word-link index and an `oshb` or `sblgnt` original. The browser test requires `#vp13 .scr-bridge` to be visible. |

## Optional points

| Point | Disposition |
| --- | --- |
| "Behind each word" overstates: in Genesis 9:13 five English words have no Hebrew word behind them. | Accepted. The line reads "See the Hebrew words behind Genesis 9:13". |
| The site calls the comparison page "Compare translations". | Accepted. Line 2 says "translations". |
| The page already links to the shelf above the title. | Accepted. The fourth line "All 27 stories" was dropped and is listed as offered, not built. |
| Say the quoted verse is the stop's first cite. | Accepted in the plan and the code comment. |
| Test the longest lines (David) at 320 px. | Accepted. |
| Mark the arrow as hidden from screen readers; remove only the one selector from the grouped rule. | Accepted. |
| The accessibility gate already lists all 14 story routes; run it instead of axe by hand. | Partly. The release runs the full matrix. Before that, one route is checked with the gate's tags in light and dark. |
| Type the language table as a full record so the type check catches a new book. | Not taken. Esther and Daniel would need a language they never print. A new story in an unlisted book already stops the build and fails the unit test. |

## Limits

The reviewer could not check the live-site measurements, the rendered look
(row height, dark mode, focus), or whether the x-ray snapshot changes. Those
are covered by the author's checks recorded in the plan. One review round was
run; revision 2 was not sent back, because every accepted finding is now held
by a test.
