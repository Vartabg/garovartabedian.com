# Story pages: verse links inside the passage (story shelf, slice 4)

Plan revision 2 · 2026-11-13 · source baseline `39f980cf` (master) · branch `codex/story-links-passage`

Revision 2 takes in the independent review
(`2026-11-13-story-verse-links-review.md`): the styles move to a global
stylesheet, each box gets its own colours, the sayings' links are built and
tested in a library function, and one language table covers both slices.

## Who it is for and what they do

The visitor with no background, on a phone, who has just read one of the 13
told stories that slice 3 did not reach. When they open the story's passage
to check the words, they find two more steps on the verse the story turns on:
see it in other translations with the original language, or see the original
words behind it. One tap opens the tool already on that verse.

## Owner decisions

Accepted (Garo, 2026-11-13, on a board of three options drawn on the live
"Come and eat" page, in his words "B, inside passage"): the links go inside
the story's passage box and show once the visitor opens "Read the passage".

Not chosen: A, three lines at the end of every story, as the 14 Scripture path
stories have since PR #267; C, two links in the page's own "From …" group of
the site menu, with the page unchanged.

Accepted (Garo, 2026-11-14, on the built pages and the before-and-after
pictures in light and dark, in his words "Keep, ship it"), all seven calls as
listed:

1. Two lines, not three. The passage box already has its own read link ("Read
   the full chapter", or "Open the full chapter" on Dothan), and the sayings
   keep their "Read this chapter" button, so no read line is added.
2. Wording, as in slice 3: "Compare translations of John 21:12, with the
   Greek" and "See the Greek words behind John 21:12".
3. The verse each story's lines point at (table below), including Acts 2:8
   rather than 2:11 for "In our own languages".
4. Angels and apostles: the lines sit inside the open passage, under its read
   link. They are hidden until "Read the passage" is opened.
5. The six sayings have no passage box. The saying shows its one verse; the
   lines sit right under that verse, above "Read this chapter", and are
   visible without a tap. The page's closed "Go deeper into a saying" guide
   already has a line "Open the Greek at …", and for the prayer it points at
   Matthew 6:11 (where ἐπιούσιος is), while the new words line points at the
   anchor, 6:9. Both stay; this is listed so he can rule on the repeat.
6. The Good Samaritan walk has no passage box. The lines sit in its last step
   (4 of 4, Luke 10:36–37) under the step's verse link and above "Back", so
   they show only on that step.
7. The rows look like the slice 3 rows (a hairline between rows, the label on
   the left, an arrow on the right), drawn in the text colour of the box they
   sit in. On Dothan the rows take the passage's 2.5 rem indent and use the
   same "→" text arrow as everywhere else, not Dothan's drawn arrow.

Standing rules this keeps: say each thing once
(`docs/plans/2026-11-03-say-it-once-repeats.md`); link text says what the
visitor gets; angel stories keep their own interaction and art
(`src/app/angels/stories/AGENTS.md`): nothing is added to the artwork or the
gestures, only two links inside the existing passage text.

Out of scope: the menu; the 14 path stories; any change to the comparison
page, the reader or the word links; the passage boxes' own wording; Dothan's
second read link ("Read 2 Kings 6 in context" above its box); the walk's step
links, which open the reader without `?t=web`; the sayings guide's own Greek
line.

## The verse for each story

| Story | Kind | Verse | Phrase in the World English Bible |
| --- | --- | --- | --- |
| Open his eyes | angel | 2 Kings 6:17 | “please open his eyes” |
| I am with you | angel | Genesis 28:15 | “Behold, I am with you” |
| The gate opened | angel | Acts 12:10 | “which opened to them by itself” |
| Come and eat | apostle | John 21:12 | “Come and eat breakfast!” |
| Peace be with you | apostle | John 20:26 | “Peace be to you.” |
| In our own languages | apostle | Acts 2:8 | “in our own native language” |
| The six sayings | saying | the saying's own anchor (Matthew 13:31, 6:9, 5:44, Mark 8:34, John 8:58, 13:34) | the verse the page already shows |
| The good Samaritan | walk | Luke 10:37 | “Go and do likewise.” |

Two titles are not word for word in the World English Bible: "Peace be with
you" (it reads "Peace be to you") and "In our own languages" (2:8 "in our own
native language"; 2:11 "in our languages"). Acts 2:8 is the one the title's
"own" comes from; 2:11 is the alternative.

`{Language}` is Hebrew for 2 Kings and Genesis and Greek for Acts, John,
Matthew, Mark and Luke.

Word-link quality, for his information: every verse has at least four checked
word links (Acts 2:8 has exactly four of ten words). In Genesis 28:15, Acts
12:10 and Matthew 5:44 more words are marked "needs review" than checked. The
word panel already shows that status per word; nothing here changes it.

## What changes

1. `src/lib/scriptures/verse-study-links.ts` (new). `verseStudyLinks({ book,
   chapter, verse })` returns the two lines as `{ id: "compare" | "words",
   href, label }[]`. Hrefs come only from `studyToolHref("/scriptures/polyglot",
   …)` (tradition `protestant`, translation `web`) and `wordBridgeHref(
   "protestant", …)`. The book name comes from `public/scriptures/canons.json`.
   The language comes from one explicit table, the union of both slices'
   books: Genesis, Exodus, Ruth, 1 Samuel, 1 Kings, 2 Kings and Jonah are
   Hebrew; Luke, Acts, John, Matthew and Mark are Greek. A book that is not in
   the table throws, and so does a book with `hasUnverifiedStudyNumbering`.
   The module does not import `scriptures/story-text` (it carries whole books).
2. `src/lib/scriptures/story-deeper.ts` builds its compare and words lines
   with `verseStudyLinks` and drops its own language table, so the two slices
   share one source. Its labels and hrefs do not change (its tests hold them).
3. Data: `ApostleStory` gains `titleVerse: number` (same book and chapter as
   the story). Each angel story gains `titleVerse: { book, chapter, verse }`.
   The walk uses its last step's last verse; a saying uses its `anchor`.
4. `src/lib/jesus/saying-study-links.ts` (new): `sayingStudyLinks()` returns a
   map from each of the six `WORD_STUDIES` ids to its two lines, built from the
   anchor. `src/app/jesus/words/page.tsx` passes it to `WordsRoom.tsx` as a
   required prop `studyLinks`. The client bundle gains only those strings, not
   the scripture data behind them. The two test files that render `WordsRoom`
   (`tests/jesus-interactions.test.tsx`, `tests/jesus-words-study.test.tsx`)
   pass the prop.
5. `src/app/_components/PassageStudyLinks.tsx` (new): `<nav
   className="passage-study" aria-label="Study this verse">` holding one list
   of links, each with a "→" hidden from screen readers. No client script and
   no stylesheet import, because unit tests import `ParableWalk` and
   `WordsRoom` under `tsx`, where a CSS import fails. It only takes the links
   as a prop, so the client sayings page can render it too.
6. Styles go in `src/app/styles/reading.css`, which `globals.css` already
   loads on every page. Selectors are `.passage-study li > a` and stronger, so
   they win over `.visual-story-passage a` (which sets `inline-flex`, a 2 rem
   gap and the light story ink). Colours:
   - label and arrow use `color: inherit`, the text colour of the box they sit
     in: the reading ink on the cream angel and Dothan boxes, the page ink in
     the apostle box, the sayings and the walk;
   - hairlines use `currentColor` mixed toward transparent, so they follow the
     same text colour in light and dark;
   - focus is a 2 px outline in the same text colour. Dothan's own focus
     colour is a pale gold drawn for its dark scene, which would barely show
     on the cream passage box.
   Slice 3's `.scr-story-more` rows stay as they are: those sit on the path
   story page, which is not inside a coloured box, so this is a second small
   rule set on purpose rather than a shared one.
7. Placement:
   - `src/app/angels/stories/StoryFrame.tsx`: `StorySource` takes the links
     and renders them after "Read the full chapter" (I am with you, The gate
     opened pass them in their pages).
   - `src/app/angels/stories/open-his-eyes/page.tsx`: after "Open the full
     chapter" inside `.dothan-passage-text`, with the passage's indent.
   - `src/app/apostles/stories/StoryArticle.tsx`: after "Read the full
     chapter" inside `.as-source-verses`.
   - `src/app/jesus/parables/ParableWalk.tsx`: in the last `StopPanel`, after
     the step's verse link and before `.parable-stop-nav`.
   - `src/app/jesus/words/WordsRoom.tsx`: the chosen saying's lines after
     `.jsu-word-door-verse` and before the "Read this chapter" button, drawn
     even while the hosted verse is still loading.
8. `public/meta/site-xray.json` is regenerated with `npm run data:xray`; its
   snapshot test counts browser specs, and this adds one.

## Failure behaviour

Static and server-rendered; no new runtime request. A story whose verse is in
an unlisted book, or in a book whose editions are not verified to line up,
fails the unit test instead of printing a wrong line. The angel and apostle
pages are built ahead, so for them the build fails too; `/jesus/words` and
`/jesus/parables` render per request, so for them the unit test is the guard.
Missing word-link data for a chosen verse fails the unit test.

## Acceptance checks

Unit (new `tests/story-verse-links.test.ts`, plus the existing suites):

- `verseStudyLinks` returns exactly compare then words, with the labels above
  and hrefs equal to `studyToolHref` and `wordBridgeHref`; it throws for
  Esther, Daniel and a book missing from the language table.
- Slice 3's tests in `tests/scripture-stories.test.ts` pass unchanged.
- Each angel story's `titleVerse` lies inside its passage range and in its
  `passage` href's book and chapter; each apostle story's `titleVerse` lies
  between `start` and `end`.
- The World English Bible text of each angel, apostle and walk verse contains
  the exact phrase in the table above.
- `sayingStudyLinks()` has all six `WORD_STUDIES` ids, each with two lines on
  its anchor.
- For all 13 verses: the chapter is in `public/scriptures/bridge/index.json`,
  the original edition is `oshb` or `sblgnt`, the verse has at least four rows
  of kind `link` and status `ok` (read with `KIND_CODES` and `STATUS_CODES`),
  the World English Bible, King James and Douay-Rheims hold it, and the
  language the line names is the language of the hosted original.
- `tests/jesus-words-study.test.tsx` checks that the chosen saying shows its
  two lines and that choosing another saying changes them.

Browser (new `tests/e2e/story-verse-links.spec.ts`, desktop project, setting
320, 390 and 1280 px itself):

- `/apostles/stories/come-and-eat`: before "Read the passage" is opened the
  lines are not visible; after it, two links with the hrefs for John 21:12,
  each at least 44 px tall, no sideways page scroll.
- `/angels/stories/i-am-with-you` and `/angels/stories/open-his-eyes`: the
  same, for Genesis 28:15 and 2 Kings 6:17.
- `/jesus/words?study=mustard-seed`: two links for Matthew 13:31 under the
  verse, each at least 44 px tall; choosing "Love your enemies" changes them
  to Matthew 5:44.
- `/jesus/parables?story=good-samaritan`: the lines are in the page but hidden
  on step 1; after pressing Next three times, two visible links for Luke
  10:37, each at least 44 px tall.
- axe with the release gate's tags, in light and dark, reports no violations
  on Come and eat, I am with you and Open his eyes with the passage open, on
  the mustard seed, and on the walk's last step.
- The words line on John 21:12 opens the reader with the word panel visible
  under verse 12 (`#vp12 .scr-bridge`); the compare line opens "Compare
  translations" with John 21:12 in the King James and the World English
  Bible.

The existing angel, apostle and parable walk specs run with the new one.

By hand on a production build at 375 x 812 and 1280 wide, light and dark: the
rows read clearly inside each box and focus is visible. Before and after
pictures of each kind.

Gates: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`,
and the browser specs above. `agent-task finish` pushes the task branch only.
Merging and the production release waited for the owner's ruling on the
seven calls above; he gave it on 2026-11-14.
