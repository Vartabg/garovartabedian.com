# Home page: a strip of story pictures (story shelf, slice 2)

Plan revision 2 · 2026-11-10 · source baseline `90c12172` (master) · branch `codex/home-story-strip`

Revision 2 answers the independent review in
`2026-11-10-home-story-strip-review.md`: a browser spec that clicked a removed
link, the skip link's anchor, stronger browser checks, and the home page's
word budget.

## Who it is for and what they do

The visitor who has no idea what this site is, on a phone. On the first screen
they should see that the Bible's stories are told here in pictures, and open
one with one tap. Tap a picture, get that story.

## Why

The story shelf is live at `/scriptures/stories` (slice 1,
`2026-11-09-story-shelf.md`), but the home page still names no story. Measured
at 375 x 812 on `90c12172`: the first screen is full (builder line, label,
title, text, two buttons, two scroll links, ending at 775 px), the tomb plate
starts at 799 px, and the tools section below it is 1,744 px tall before the
list of worlds.

## Owner decisions

Accepted (Garo, 2026-11-10, on three mocks of the real page, "B, pictures"): a
sideways strip of the story pictures under the two buttons, with a link to all
of them, in place of the two scroll links.

Not chosen: the eleven situation words on the home page (5 rows, 2 on the first
screen, plate moved down 187 px), and a single text link.

Accepted (Garo, 2026-11-10, on screenshots of the built page, in his words
"Keep, ship it"): all five calls below.

1. Removing both scroll links, "Try the research tools" and "Explore the whole
   record". The second was his 2026-10-03 call and
   `tests/focus-navigation.test.tsx` asserted it; this replaces that call.
2. The order of the strip: shelf order, from Genesis to Acts, so it opens on
   Noah. (Opening on the manger was offered and not taken.)
3. The link text: "All 27 stories" (the number follows the data).
4. A link only keyboard users meet, shown on focus: "Skip the story pictures".
5. The home page's 520-word budget (`tests/focus-navigation.test.tsx`) now
   counts prose only. The 27 story titles add 67 words and are counted apart;
   the test requires the strip to hold exactly the shelf's titles and nothing
   else. Without the strip the page has 472 words.

Standing decisions this keeps: "Read his words" stays the main button and
"Open the Scriptures" the second (Jesus first); the builder line; the plate;
and "keep the top screen and one directory" (2026-10-15), because the strip
sits inside the top screen and is not a new section.

Out of scope: the eleven words on the home page, the tools section, the worlds
rail, the site menu, and the site's look.

## What changes

1. `src/app/_components/StoryStrip.tsx` (new). A server component with no
   client script. It reads `SHELF_STORIES` from `src/lib/story-shelf.ts` and
   renders, in this order:
   - the skip link (`.skip-link`, the site's existing class) pointing at the
     "All stories" link;
   - a `ul` that scrolls sideways, one `li` per story: a `next/link` to the
     story's existing page holding a 4:3 picture (`next/image`, `fill`,
     `quality={70}`, `sizes="6.2rem"`, empty `alt`, the first four eager) and
     the story's title;
   - a link to `/scriptures/stories`: "All 27 stories".
2. `src/app/_components/StoryHome.tsx`: remove the two scroll-link anchors and
   render `<StoryStrip />` after `.st-front-actions`.
3. `src/lib/portfolio-content.ts`, `HOME`: remove `discoveryLinkLabel`,
   `worldsHref` and `worldsLinkLabel` (nothing else reads them); add
   `storiesHref`, `storiesLinkStart` ("All"), `storiesLinkEnd` ("stories") and
   `storiesSkipLabel`.
4. `src/app/styles/core.css`: add the strip rules beside the other hero rules;
   remove the `.st-front-explore` rules and its entries in three selector
   lists (the lit-text halo list takes the strip's two text classes instead).
   `src/app/styles/discovery.css`: remove `.st-front-tool-link`.
5. `tests/focus-navigation.test.tsx`: in the home page test, replace the
   assertion for the `#worlds` link with the checks below, and count the word
   budget as in owner call 5. No new test file.
6. `tests/e2e/discovery.spec.ts` clicked `a[href="#discover"]` on the home
   page to reach the tools; it now scrolls the tools heading into view.
   `tests/e2e/worlds-responsive.spec.ts` gains one test for the strip (phone,
   tablet and desktop projects).

## Behaviour

- The strip is plain HTML and CSS: `overflow-x: auto` on the list, each item a
  fixed 6.2rem wide. In the one-column layout (up to 899 px) the strip runs to
  the screen's right edge. Inside `.st-front` (a column with `align-items:
  flex-start`) the strip stretches to the column's width and has `min-width:
  0`, so it scrolls inside itself and the page never scrolls sideways.
- The scrolling list holds links, so it is reachable and scrollable by
  keyboard. The skip link saves a keyboard user 27 tab stops. The strip's
  wrapper is `position: relative`, so the focused skip link shows at the
  strip's own top-left corner and not at the corner of the hero.
- Text over the sun-lit leaf (`.story.is-lit`) gets the same halo the other
  hero text has.
- Phone: three pictures and part of a fourth show on the first screen. Desktop:
  the strip sits in the left column under the buttons.

## Failure behaviour

Static. A story removed from a source module or a missing picture already
fails `tests/scripture-stories.test.ts`. With images blocked, the titles
remain as links.

## Acceptance checks

Unit (`tests/focus-navigation.test.tsx`, home page test):

- No link to `#discover` or `#worlds` inside the hero; the heading "The whole
  record." remains.
- The strip's links are exactly the shelf's `href`s, in shelf order, and each
  shows the story's title.
- One link to `/scriptures/stories` whose text is "All 27 stories", where 27
  is the shelf's length; the skip link points at it.

Browser, on a production build, light and dark:

- 375 x 812: no horizontal page scroll; at least three whole pictures above
  812 px; the plate's top position recorded against 799 px before.
- 1280 wide: the strip stays inside the left column.
- A strip link opens its story; "All 27 stories" opens the shelf; the skip
  link, focused by Tab, moves focus past the pictures.
- Axe with the gate's tags on `/`: 0 violations in light and dark.

Browser specs (`tests/e2e/worlds-responsive.spec.ts`, new test): 27 links;
the list is one row and wider than its box; no page overflow; the skip link,
focused, is in the viewport and Enter moves focus to "All 27 stories"; the
first picture opens `/scriptures/stories/noah`.

Gates: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`,
and the two touched browser specs run locally. The release runs the whole
browser suite and the accessibility matrix.
`agent-task finish` pushes the task branch only. Merging and the production
release waited for the owner's word on the five calls above, given 2026-11-10.

## Built and checked, 2026-11-10

Measured on the production build (`next start`), Node 24.20.0.

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors (54 warnings, none in the files this slice touches) |
| `npm run typecheck` | clean |
| `npm run test` | 1,092 unit tests and 67 smoke checks pass |
| `npm run build` | passes |
| Browser specs touched (`discovery.spec.ts`, `worlds-responsive.spec.ts`) | 9 tests pass across the desktop, phone and tablet projects |
| Axe, WCAG 2.2 AA tags, `/`, light and dark, 390 and 1280 wide | 0 violations. The 27 titles' contrast is listed as "needs review" because they sit over the lit canvas; they use the same ink and halo as the hero paragraph. |
| 375 x 812 | three whole pictures and 17 px of a fourth; no horizontal page scroll; "All 27 stories" at 791 to 835 px, partly below the first screen |
| 768 and 1280 wide | no horizontal page scroll; at 1280 the strip stays in the left column (five whole pictures) and clear of the plate |
| Skip link, reached by Tab | shows at the strip's top-left corner; Enter moves focus to "All 27 stories" |
| Home page words | 472 without the strip (budget 520); the strip holds the 27 titles, 67 words |

Before this slice, at 375 x 812: the two scroll links ended at 775 px and the
plate started at 799 px. After: the strip ends at 787 px and the plate starts
at 859 px, 60 px lower.

Not checked: a real phone, the full browser suite and the full accessibility
matrix (the release runs both).
