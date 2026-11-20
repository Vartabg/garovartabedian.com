# Story pages: links into the story's own passage (story shelf, slice 3)

Plan revision 2 · 2026-11-11 · source baseline `bbd4c05e` (master) · branch `codex/story-go-deeper`

Revision 2 answers the independent review in
`2026-11-11-story-go-deeper-review.md`: the browser checks now set phone
widths themselves, the first line is built from the chapters a story covers,
the word-link check is defined exactly and proved in the browser, and two
labels changed to match what the visitor lands on. The fourth line ("All 27
stories") is out: the page already links to the shelf above the title.

## Who it is for and what they do

The visitor with no background, on a phone, who has just read one of the told
stories. With one tap they should be able to take one more step into the same
passage: read all of it, see the verse the story quotes in other versions with
the original language, or see the original word behind each English word.
Tap a line, land in the tool already open on this story's verse.

## Why

Measured on the live site, `bbd4c05e`, `/scriptures/stories/noah`:

- The story ends with a closed disclosure, "Read the chapters in order".
- After it the Scriptures layout adds "Continue exploring" (three cards:
  "Search the text", "Start with Jesus", "Scriptures overview") and a closed
  "More research tools" disclosure (three tools). That is 114 words and six
  links, the same on every Scriptures page. None is about Noah. The tools
  heading says "Each tool opens with its own selection."
- The tools can open on a passage. Checked live for Genesis 9:13: the
  comparison page (`/scriptures/polyglot?…verse=13`) shows the Hebrew and the
  hosted English versions of that verse, and the chapter reader opens with the
  word links on (`?t=web&study=word-bridge#v13`).

Owner direction (2026-11-09, on the first mock): the research tools become a
"go deeper" layer under each story.

## Owner decisions

Accepted (Garo, 2026-11-11, on a four-panel sketch of the end of the Noah
story, in his words "A, story links"): replace the generic links under a
story with lines about that story's passage, each opening a tool on its verse.

Not chosen: showing other versions in place under the verse (B), and a single
button into the chapter (C).

Accepted (Garo, 2026-11-13, on the built page and the before-and-after
pictures, in his words "Keep, ship it"), all eight calls as listed:

1. The wording of the three passage lines (table below).
2. No heading above the lines.
3. "Read the chapters in order" goes. The first line replaces it and opens the
   story's first chapter; the reader's own next-chapter link carries on.
4. "Continue exploring" and "More research tools" are not shown on the 14
   story pages.
5. Esther, The furnace and The lions get only the first line. The site marks
   Esther and Daniel as books whose editions it has not verified line up
   (`hasUnverifiedStudyNumbering`), and the comparison page shows a single
   edition for them.
6. The second and third lines point at the one verse each story quotes in
   full (the first cite of its stop with `words: true`), and name that verse.
7. No link back to the shelf at the end. The page already has one above the
   title ("Stories"), and his rule is to say each thing once. Offered, not
   built: a last line "All 27 stories".
8. This unit covers the 14 Scripture path stories. The other 13 (one walked
   parable, six pictured sayings, three angel stories, three apostle stories)
   sit inside other pages with their own endings and come next, each with its
   own placement call.

Standing rules this keeps: say each thing once
(`docs/plans/2026-11-03-say-it-once-repeats.md`); no label or intro block
above the thing; link text says what the visitor gets; angel stories keep
their own interaction (`src/app/angels/stories/AGENTS.md`), so they are not
touched here.

Out of scope: the other 13 stories; the site menu's "From here" list; any
change to the comparison page, the reader or the word links; story-specific
extras (Gospel accounts side by side, life events, parallels with later
tellings); the sentence under each story title; the site's look.

## The lines

For a story with book `B`, first chapter `F`, last chapter `T`, and quoted
verse `C:V`:

| Order | Text | Opens |
| --- | --- | --- |
| 1 | `Read {Book} F–T` (or `Read {Book} F` for one chapter) | `passageHref(B, F, 1)`, the reader at the story's first chapter |
| 2 | `Compare translations of {Book} C:V, with the {Language}` | `studyToolHref("/scriptures/polyglot", …)` at `C:V`, translation `web`, tradition `protestant` |
| 3 | `See the {Language} words behind {Book} C:V` | `wordBridgeHref("protestant", B, C, V)` |

Line 1 is built from the chapters and not from the story's `reference`,
because Esther's reference is "Esther" while the story starts at chapter 2.
For every story whose reference names chapters the two agree, and a test
holds them together. Line 2 says "translations" because the page it opens is
titled "Compare translations". Line 3 does not say "each word": in Genesis
9:13 five English words have no Hebrew word behind them.

`{Language}` is Hebrew for Genesis, Exodus, Ruth, 1 Samuel, 1 Kings and Jonah,
and Greek for Luke. Lines 2 and 3 are left out for Esther and Daniel.

Examples: Noah gets "Read Genesis 6–9", "Compare translations of Genesis
9:13, with the Hebrew", "See the Hebrew words behind Genesis 9:13". Ruth's
first line is "Read Ruth 1–4". Esther gets "Read Esther 2–8" alone.

## What changes

1. `src/lib/scriptures/story-deeper.ts` (new). `storyPassageLinks(story)`
   returns the passage lines (1 to 3) as `{ id: "read" | "compare" | "words",
   href, label }[]`. It finds the quoted verse as the single stop with
   `words: true` and throws if a story has none or more than one. It reads the
   language from an explicit table of the books above and throws for a book
   that is not listed and is not an unverified-numbering book. It builds hrefs
   only with the existing helpers `passageHref`, `studyToolHref` and
   `wordBridgeHref`, and book names with `bookName`.
2. `src/app/scriptures/stories/StoryReading.tsx`. The `details` block
   "Read the chapters in order" is replaced by
   `<nav class="scr-story-more" aria-label="More on this story">` holding one
   list of links, the passage lines, each with an arrow hidden from screen
   readers. Server-rendered, no client script.
3. `src/app/scriptures/stories/stories.css`. Remove the `.scr-story-chapters`
   rules (and only that selector from the grouped link-colour rule). Add `.scr-story-more`: full-width rows with a hairline between them,
   48px minimum height, the label on the left and an arrow on the right, using
   the page's existing tokens (`--ink`, `--accent`, `--line`).
4. `src/app/styles/continuity.css`. Add `.scr-story` to the existing rule that
   hides the layout's continuation on story pages
   (`.world-shell:has(.visual-story, .dothan-story) .world-continuation`). The
   class is on `StoryReading` only, so the shelf and every other Scriptures
   page keep the continuation.
5. `tests/scripture-stories.test.ts`: new checks (below).
6. `tests/e2e/scriptures-hub.spec.ts`: new browser tests (below). That spec
   runs in the desktop project only, so the tests set their own widths.
7. `public/meta/site-xray.json`: regenerated with `npm run data:xray` if the
   snapshot test asks for it.

## Failure behaviour

Static pages; no new runtime request. A story added in a book that is not in
the language table, or with no quoted verse, fails the build and the unit
test instead of printing a wrong line. Missing word-link data for a quoted
verse fails the unit test. Without CSS `:has()` the generic continuation shows
again under the new lines; nothing breaks.

## Acceptance checks

Unit (`tests/scripture-stories.test.ts`):

- Every story's first line names its book and chapters and opens
  `passageHref(book, fromChapter, 1)`; where the story's reference names
  chapters, the line equals `Read {reference}`.
- Stories in Esther and Daniel have exactly one passage line. Every other
  story has three, in the order read, compare, words.
- The compare href equals `studyToolHref` for the quoted verse and
  `parseStudyContext` reads the same book, chapter and verse back from it.
- The words href equals `wordBridgeHref` for the quoted verse. The chapter is
  in `public/scriptures/bridge/index.json`, the original edition is `oshb` or
  `sblgnt` (the reader opens the panel only then), and the verse has at least
  four rows whose kind is `link` and whose status is `ok`, read with
  `KIND_CODES` and `STATUS_CODES`. (Daniel 6:22, which is left out, has one.)
- For every story with a compare line, the World English Bible, the King
  James and the Douay-Rheims hold that verse, the hosted original text holds
  it, and the language the line names is the language of that original verse.
- Exact labels for Noah, The tomb, Ruth and Esther.

Browser (`tests/e2e/scriptures-hub.spec.ts`, at 320, 390 and 1280 px wide):

- `/scriptures/stories/noah`: the nav holds three links with the hrefs above;
  "Read the chapters in order" is gone; "Continue exploring" and "More
  research tools" are hidden; every link is at least 44px tall.
- `/scriptures/stories/david` (the longest lines): no horizontal page scroll.
- `/scriptures/stories/esther`: the nav holds one link, "Read Esther 2–8".
- The compare line opens "Compare translations" showing Genesis 9:13 in the
  King James and the World English Bible; the words line opens the reader on
  chapter 9 with the word panel visible under verse 13 (`#vp13 .scr-bridge`);
  the first line opens Genesis 6.

By hand on a production build, 375 x 812 and 1280 wide, light and dark: the
rows read clearly, focus is visible, and axe with the release gate's tags
reports no violations on `/scriptures/stories/noah`. The release's
accessibility matrix already lists all 14 story routes
(`scripts/a11y/config.mjs`). Measured before and
after: words and links under the story, and the page height.

Gates: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`,
and the touched browser spec. `agent-task finish` pushes the task branch only.
Merging and the production release waited for the owner's ruling on the
eight calls above; he gave it on 2026-11-13.

## Built and checked, 2026-11-11

Measured on the production build (`next start`), Node 24.20.0, against the
live site at `bbd4c05e`.

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors (54 warnings, none in the files this slice touches) |
| `npm run typecheck` | clean |
| `npm run test` | 1,097 unit tests and 67 smoke checks pass |
| `npm run build` | passes; it regenerated `public/meta/site-xray.json` (the story page kind now lists `scriptures-hub.spec.ts`) |
| `tests/e2e/scriptures-hub.spec.ts` | 6 tests pass, 4 of them new (320, 390 and 1280 px, and the three lines opened) |
| Axe, WCAG 2.2 AA tags, Noah, David and Esther, light and dark, 375 and 1280 wide | 0 violations; nothing in the new links listed for review |
| Keyboard focus on a row | the site's 3px outline, light and dark |

End of the Noah story at 375 x 812, same script on both:

| | Before (live) | After (branch) |
| --- | --- | --- |
| Blocks under the story | "Read the chapters in order", "Continue exploring", "More research tools" | the three lines |
| Links in them | 10 (4 chapters, 3 cards, 3 tools; 7 of them behind a tap) | 3 |
| Words in them | 101 | 18 |
| Their height | 533 px | 183 px |
| Page height | 2,015 px | 1,618 px |

Rows are 48 px tall on one line and 67 px on two.

Seen and left alone: the comparison page opens on its own title and intro, so
on a phone the versions start below the first screen. That page is out of
scope here.

Not checked: a real phone, the full browser suite and the full accessibility
matrix (the release runs both).

Re-checked 2026-11-12 after merging master `9c0fb827` (four merges landed
meanwhile; none touched the story files, and the x-ray snapshot merged
without a change): lint 0 errors (44 warnings), type check clean, 1,103 unit
tests and 67 smoke checks, build, and 17 browser tests across
`scriptures-hub.spec.ts` and `navigation.spec.ts` all pass. The before and
after pictures were retaken on that build.
