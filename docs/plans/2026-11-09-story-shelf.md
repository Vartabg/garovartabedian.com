# Story shelf, slice 1: one way into all 27 told stories

Plan revision 2 · 2026-11-09 · source baseline `ef2ccee8` (master) · branch `codex/story-shelf`

Revision 2 answers the independent review in
`2026-11-09-story-shelf-review.md`: it adds the three content tables, the
per-module mapping, the data flow, the hydration and address method, a typed
tag contract, and browser checks that test what the address parameter is for.

## Who it is for and what they do

The visitor who has no idea what this site is, on a phone. They should be able
to recognise their own situation in a plain word, tap it, and land on a Bible
story where someone faced the same thing. Tap a word, get the stories and the
line that put each one there.

## Why

A review on 2026-11-09 found 27 told stories on the site in four sections and
five formats, with no shared list. `/scriptures/stories` lists only 14, as text
rows that each repeat "Tap a point. One stop at a time." Nothing lets a visitor
arrive from a present-day situation.

## Owner decisions

Accepted (Garo, 2026-11-09, on a clickable mock): the direction. One shelf for
all the stories, entered by what the people in them faced, with the research
tools later becoming a "go deeper" layer under each story.

Accepted (Garo, 2026-11-09, on screenshots of the built page, in his words
"Keep, ship it"): all nine calls below.

1. The 11 situation words (table below).
2. The sentence that introduces them: "The people in these stories were".
3. The count line: "All 27 stories, from Genesis to Acts", and when a word is
   chosen, "5 stories where people were far from home".
4. Removing the "Scriptures" label above the title and the intro sentence
   under it from this page (his standing "say each thing once" rule,
   `docs/plans/2026-11-03-say-it-once-repeats.md`).
5. Dropping "Tap a point. One stop at a time." from the list.
6. One line under the list: "The pictures are interpretive illustrations."
7. The page description and the route note: "Find a Bible story by what the
   people in it faced."
8. The cover picture chosen for nine stories (list below).
9. Five of the 33 pairings put a saying, which is a teaching and not an
   event, under "stories where people were …" (love your enemies, take up the
   cross, a new commandment, the mustard seed, teach us to pray).

Not decided: everything in later slices (a shared walk format, the home page,
the menu, "go deeper" links) and the site's look.

Rejected earlier and not reopened: regrouping existing lists without changing
what the visitor does (site menu, 2026-10-29).

Out of scope for this slice: a single walk format for all stories, the home
page, the site menu, "go deeper" links, any change to a story page, and any
change to the site's look. This page keeps the existing tokens and the shared
`Button`. The question on the Scriptures home card
(`src/lib/scriptures/study-catalog.ts`) still fits and is left alone.

Constraint for later slices: `src/app/angels/stories/AGENTS.md` asks each
angel story to keep its own interaction. A shared walk format must not replace
those three pages without the owner reopening that rule.

## The 27 stories and where each field comes from

| Source | Stories | Title | Reference | Page | Picture |
| --- | ---: | --- | --- | --- | --- |
| `SCRIPTURE_STORIES` in `src/lib/scriptures/stories.ts` | 14 | `title` | `reference` | `scriptureStoryPath(slug)` | a cover stop: `/scriptures/stories/<slug>/<stop id>.jpg` |
| `PARABLE_WALKS` in `src/lib/jesus/parable-walks.ts` | 1 | the walk's entry in `public/jesus/parables.json` | that entry's first account, "LUK 10:30-37" shown as "Luke 10:30–37" | `/jesus/parables?story=<id>` | the `inn` stop's `picture.src` (a walk's first stop unless named) |
| `WORD_STUDIES` in `src/lib/jesus/word-studies.ts` | 6 | `title` | `anchor.label` | `/jesus/words?study=<id>` | `picture.src` |
| `angelStories` in `src/lib/angel-stories.ts` | 3 | `title` | `reference` | `/angels/stories/<slug>` | `image` |
| `APOSTLE_STORIES` in `src/lib/apostles/stories.ts` | 3 | `title` without its closing full stop | `reference` | `/apostles/stories/<slug>` | `image` |

`src/lib/story-shelf.ts` holds one helper, `shelfStopPicture(slug, stopId)`,
for the picture path. It first went into `src/lib/scriptures/stories.ts`, but
the task `sower-two-books` has right of way on that file, so the shelf module
keeps it and `stories.ts` is untouched. `StoryReading.tsx` is not edited.

The cover stop is the first stop, except where another stop shows what the
title names (the reviewer's second pass noted that the first picture of "The
manger" is a Roman clerk): sea `walls`, ruth `stay`, david `name`, fire `fell`,
furnace `four`, lions `angel`, jonah `fish`, manger `trough`, tomb `risen`.
This is owner decision 8.

Order ("from Genesis to Acts"): Old Testament stories by book, then chapter.
Then the birth; then teaching by Gospel (Matthew, Mark, Luke, John) and
chapter; then the supper, cross and resurrection; then Acts by chapter.

`noah, mountain, i-am-with-you, joseph, sea, ruth, david, fire, open-his-eyes,
esther, furnace, lions, jonah, manger, love-enemies, lords-prayer,
mustard-seed, take-up-cross, good-samaritan, lost-son, before-abraham,
new-commandment, tomb, peace-be-with-you, come-and-eat, every-language,
the-gate-opened`

## The 11 situations and the 33 tags

A tag describes something that happens in the story. It never tells the
visitor what the story will do for them. A tag is one of five kinds, and no
other wording is allowed:

| Kind | The line shown | The verse shown |
| --- | --- | --- |
| `stop` | that stop's `line` in `SCRIPTURE_STORIES` | that stop's first cite |
| `saying` | the study's `saying` | the study's `anchor` |
| `invitation` | the angel story's `invitation` | stated in the table; inside the story's `reference` |
| `opening` | the apostle story's `opening.title` | stated in the table; inside `opening.reference` |
| `quote` | a word-for-word cut from the hosted World English Bible, shown in quotation marks | the verse the cut is from; inside the story's passage (for a one-verse saying, the same chapter) |

| Id | Label | Story | Kind | Key or cut | Verse |
| --- | --- | --- | --- | --- | --- |
| afraid | afraid | sea | stop | `afraid` | Exodus 14:10 |
| | | david | stop | `afraid` | 1 Samuel 17:11 |
| | | open-his-eyes | quote | Alas, my master! What shall we do? | 2 Kings 6:15 |
| grieving | grieving | ruth | stop | `loss` | Ruth 1:5 |
| | | tomb | stop | `stone` | Luke 23:53 |
| hurt | hurt by someone | joseph | stop | `sold` | Genesis 37:28 |
| | | good-samaritan | quote | stripped him and beat him, and departed, leaving him half dead. | Luke 10:30 |
| | | love-enemies | saying | | Matthew 5:44 |
| far | far from home | i-am-with-you | invitation | | Genesis 28:11 |
| | | ruth | stop | `stay` | Ruth 1:16 |
| | | jonah | stop | `fled` | Jonah 1:3 |
| | | lost-son | stop | `far` | Luke 15:13 |
| | | every-language | quote | How do we hear, everyone in our own native language? | Acts 2:8 |
| stuck | stuck or waiting | noah | stop | `rain` | Genesis 7:12 |
| | | joseph | stop | `forgotten` | Genesis 40:23 |
| | | come-and-eat | opening | | John 21:3 |
| | | the-gate-opened | invitation | | Acts 12:6 |
| pressure | under pressure | esther | stop | `decree` | Esther 3:13 |
| | | furnace | stop | `refuse` | Daniel 3:12 |
| | | lions | stop | `decree` | Daniel 6:7 |
| doubting | doubting | fire | stop | `two` | 1 Kings 18:21 |
| | | before-abraham | quote | You are not yet fifty years old! Have you seen Abraham? | John 8:57 |
| | | peace-be-with-you | quote | Unless I see in his hands the print of the nails, put my finger into the print of the nails, and put my hand into his side, I will not believe. | John 20:25 |
| over | starting over | jonah | quote | Yahweh’s word came to Jonah the second time | Jonah 3:1 |
| | | lost-son | stop | `himself` | Luke 15:17 |
| asked | asked for a lot | mountain | stop | `isaac` | Genesis 22:2 |
| | | take-up-cross | saying | | Mark 8:34 |
| | | new-commandment | saying | | John 13:34 |
| | | tomb | stop | `cup` | Luke 22:42 |
| small | starting small | manger | stop | `trough` | Luke 2:7 |
| | | mustard-seed | saying | | Matthew 13:31 |
| praying | praying | lions | stop | `prayed` | Daniel 6:10 |
| | | lords-prayer | saying | | Matthew 6:9 |

## What changes

`/scriptures/stories` becomes the shelf. No new route.

1. `src/lib/story-shelf.ts` (new). Exports `SHELF_ORDER`, `SHELF_STORIES`,
   `SHELF_SITUATIONS`, `shelfCiteLabel`. It imports the five source modules
   only. It does not import `src/lib/jesus/server.ts` or
   `src/lib/scriptures/story-text.ts`, so no hosted book enters any bundle. A
   missing key, a duplicate story in one situation, or a story missing from
   the order throws when the module loads.
2. `src/app/scriptures/stories/page.tsx`. Server component. Builds plain props
   from the lib (cards, and situations with each line and verse label already
   resolved) and renders the title, `<StoryShelf>` and the picture line.
3. `src/app/scriptures/stories/StoryShelf.tsx` (new, client). Takes those
   props. It imports nothing from `@/lib`.
4. `src/app/scriptures/stories/stories.css`. Adds the shelf rules and removes
   the `.scr-story-list` rules, which nothing else uses. `.scr-story-kicker`
   and `.scr-story-deck` stay; story pages use them.
5. `src/lib/site-navigation.ts`: the route note (decision 7).
6. `tests/scripture-stories.test.ts`: new cases. No new test file, so the
   unit-test count in `public/meta/site-xray.json` does not change.

## Behaviour

- The server HTML holds the title, the 11 buttons (disabled) and all 27 cards.
  There is no `useSearchParams` and no Suspense boundary around the list.
- State without `setState` in an effect (new components fail lint on
  `react-hooks/set-state-in-effect`): both values come from
  `useSyncExternalStore`, as in `src/app/_components/FromHere.tsx` and
  `src/app/jesus/parables/ParablesRoom.tsx`.
  - hydrated: `false` on the server, `true` on the client.
  - chosen word: the client snapshot is the `were` value in
    `window.location.search` when it is a known id, else `null`; the server
    snapshot is `null`. It subscribes to `popstate` and to a local event.
- Choosing a word calls `window.history.replaceState(null, "", url)` and then
  fires the local event. `null` is deliberate: Next's patch then updates the
  router's own address (`app-router.js`, `replaceState` patch), so Back from a
  story returns to `?were=<id>` and the list reads it on mount.
- The buttons are a group labelled by the lead sentence, each a shared
  `Button` (`size="sm"`, `variant="secondary"`, `aria-pressed`). Pressing the
  chosen one again clears it.
- The count line is always mounted (`aria-live="polite"`). "Show all 27"
  appears only when a word is chosen; using it moves focus to the word that
  was chosen, because the control itself goes away
  (`docs/ui/button-standard.md`, focus on removal).
- Cards: a 4:3 picture box (`fill`, `object-fit: cover`), the title as an
  `h2`, the reference, and, when a word is chosen, the tag's line and verse.
  The picture's `alt` is empty because the title follows in the same link.
  Where the title and reference are the same word (Ruth, Jonah, Esther) the
  reference reads "Book of Ruth".
- Pictures use `next/image` (`quality={70}`, one `sizes` value for both
  layouts so choosing a word refetches nothing). The story pages use native
  images to stay independent of the optimizer; the shelf differs because 27
  originals of 80 to 450 KB each are too heavy for a phone list, and the two
  existing story collections (`/angels/stories`, `/apostles`) already use it.
- Layout: its own class `.storyshelf` inside the page wrap, which is 720 px
  wide at most. All stories: 2 columns, 3 from 40rem. A chosen word: one
  column of rows (picture left), 2 columns from 52rem. (`.scr-shelf` is
  already the canon bookshelf in `scriptures.css`, so the name is not reused.)

## Failure behaviour

All data is static and imported at build time. A renamed stop, a removed
story, a missing picture or a cut that no longer matches the hosted verse
fails the unit test or the build, not the page. With JavaScript off the page
is the full list with disabled buttons. An unknown `?were=` value shows the
full list with nothing pressed.

## Acceptance checks

Unit (`tests/scripture-stories.test.ts`); the test reads the hosted books
directly from `public/scriptures/text/web/*.json`:

- The shelf ids equal `SHELF_ORDER`, and that set equals the ids of the five
  source modules: 27, no duplicates.
- The Samaritan title equals the one in `public/jesus/parables.json`.
- Every `href` is the form in the mapping table for a real id, and each of the
  three angel slugs has a page directory under `src/app/angels/stories/`.
- Every picture file exists under `public/`.
- Every situation has at least two stories; every story is under at least one
  word; there are 33 tags.
- For each tag, the test re-derives the line and verse from the source module
  by the tag's kind and key and compares them with what the shelf shows. For
  `invitation`, `opening` and `quote` it also checks the verse lies inside the
  range named in the kinds table.
- Every `quote` is found in its hosted verse, starting and ending on a word
  boundary.

Browser, at 375 x 812 and at desktop width, light and dark:

- 27 cards and no horizontal scroll. At 375 x 812 and scroll 0, the bottom
  edge of the first row of pictures is at or above 812.
- "far from home": 5 cards with their lines; the address gains `?were=far`.
- Choose a word, open a card, press Back: the same cards, the same address,
  no console error.
- `?were=zzz`: 27 cards, nothing pressed.
- The page's HTML as served (no script run) contains 27 card links.
- Each of the seven query links opens its story: the Samaritan link shows
  `details.parable-walk-details[open]`; each saying link shows that saying.
- Buttons are at least 44 px tall (48 px on a coarse pointer).

Gates: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`,
and the accessibility gate for this route if the local browser gate can run.
`agent-task finish` commits and pushes the task branch only. Merging to
`master` and the production release waited for the owner's word on the nine
decisions above, given 2026-11-09.

## Built and checked, 2026-11-09

Measured on the production build (`next start`), Node 24.20.0.

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors (54 warnings, none in the files this slice touches) |
| `npm run typecheck` | clean |
| `npm run test` | 1,092 unit tests and 67 smoke checks pass |
| `npm run build` | passes; `/scriptures/stories` is statically rendered |
| Axe, WCAG 2.2 AA tags, light and dark, all stories and `?were=far` | 0 violations (one-route run with the gate's own axe-core and tags; the full `test:a11y` matrix was not run) |
| Served HTML, no script | 27 card links, 11 disabled buttons |
| 375 x 812, scroll 0 | 4 rows of buttons, 48 px tall; first picture row ends at 670 px; first row with titles ends at 737 px; no horizontal scroll |
| "far from home" | 5 cards with their lines; address `?were=far` |
| Choose a word, open Ruth, press Back | the same 5 cards, the same address |
| "Show all 27" | 27 cards; focus on the word that was chosen |
| `?were=zzz` | 27 cards, nothing pressed |
| The seven query links | the Samaritan walk opens; each saying page renders its saying |
| Desktop, 1280 px | 3 columns in the 720 px wrap; a chosen word shows 2 columns of rows |

Before this slice, at 375 x 812: the first story started at 352 px; 14 text
rows, 2,121 px of list, no pictures. After: the first story starts at 553 px
because the eleven words come first; 27 stories with pictures, 3,025 px of
list. On a 338 px wide screen the eleven buttons take 6 rows.

Landing order: the shelf ships first. `codex/sower-two-books` (pushed, not
merged, no pull request at the time of writing) adds a second parable walk,
`sower`, and changes a walk stop from one book and range to a list of
`readings`. The shelf reads only a walk's id and pictures, and takes title
and passage from the parables list, so that change compiles as it is. When
that branch rebases onto the shelf, the shelf's unit test fails on purpose
until someone places the new story: add `sower` to `SHELF_ORDER` before
`mustard-seed`, raise the story count in the test, and tag it under a word
with a line the story itself has. If no word fits, change the rule "every
story is under a word" rather than force a pairing. The count line on the
page follows the data.

Not checked: a real phone, the browser suite (`test:e2e`), and the full
accessibility matrix before the release run.
