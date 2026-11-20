# The library page opens on closed shelves

Date: 2026-11-13. Branch: `codex/library-shelves`. Base: `39f980cf`.

## Who it is for and what they do

A visitor who lands on `/early/library` and does not know what is in it. They
should see what the library holds on the first screen, open the part they
want, and reach a writing in a tap or two. A visitor who already knows a
name types it.

## Where this came from

The 41-page phone review on 2026-11-11 measured this page at about 38 phone
screens. Measured again on the live site on 2026-11-13 at 390 x 844:

- 31,986 px, 37.9 screens. 123 cards, about 200 px each.
- The first card sat 1,871 px down (2.2 screens), under an intro line, seven
  jump buttons, a search link, a canon note, a count line, the meaning-search
  panel and a filter form.
- 45 of the 123 cards were Philo. Each repeated the same translator and the
  same 21-word coverage note. "Historical works" alone was 14.7 screens.

## Options shown

Three phone mocks, made from the live page, were shown on 2026-11-13.

| Option | What the visitor does | Whole page at 390 x 844 |
|---|---|---|
| 1. Shelves you open | Taps a shelf to see its writings | 4.0 screens |
| 2. Big authors folded | Scrolls every shelf; taps only the four big authors | 10.4 |
| 3. Short rows | Scrolls all 123 rows; nothing to tap | 14.9 |

Owner's pick, 2026-11-13: **"Option 1"**. Options 2 and 3 were not chosen.

Research read at the source that day. Both are general findings, not tests
of this site.

- Raluca Budiu, "Accordions on Mobile", NN/g, 2015-05-31: accordions "often
  solve the problem of displaying too much content in too little screen
  space" and let people "get the big picture before focusing on details".
  Costs named there: disorientation, and long open panels that take
  scrolling to close.
- Hoa Loranger, "Accordions Are Not Always the Answer for Complex Content on
  Desktops", NN/g, 2014-05-18: they suit pages where people need only a few
  pieces of the content, and should be avoided when people need most of it.

## What changed

1. **Seven closed shelves.** Each shelf row shows its name, its number of
   entries and one line of the names inside. A shelf opens in place
   (`<details>`, so it works without JavaScript). `#collection-…` links and
   `?group=…` links open their shelf.
2. **Short rows.** A row is the title and the edition. A status is said only
   when the entry cannot be read here: "Reference only" or "Not yet
   acquired". The coverage note and "Also on the original shelf" are no
   longer on the row; both are still on the entry's own page.
3. **Big authors fold.** Inside a shelf, a name that leads three or more
   entries is one row that opens in place: Philo (45), Ignatius (7),
   Josephus (5), Justin Martyr (3). The rule reads the "Name: " lead of the
   title and is pinned to the catalog by a test.
4. **One find box.** "Find a writing" narrows the list as you type, by title
   or edition, and keeps the address in step (`?q=`). The Collection
   dropdown, the "Filter library" button and the seven jump buttons are
   gone. Without JavaScript the box still submits and the server returns the
   matching rows.
5. **The top is the title, one count line and the find box.** The intro
   line is gone. The link to text search and the meaning-search panel now
   follow the list. The canon note moved into "Coverage and source care",
   also under the list.

Files: `src/app/early/library/page.tsx`, `LibraryShelves.tsx` (new),
`src/lib/early/library-shelves.ts` (new), `src/app/styles/early.css`.

## Measured, this branch

| | 390 x 844 | 360 x 780 | 1440 x 900 |
|---|---|---|---|
| Whole page | 3,372 px, 4.0 screens (was 37.9) | 4.5 screens | 2,510 px, 2.8 screens (was 19.9) |
| List of shelves ends at | 1.14 screens | 1.24 | 1.01 |
| First shelf starts at | 414 px (first card was 1,871 px) | 414 px | 381 px |
| Shelves whole on screen 1 | 5 of 7 | 4 of 7 | 6 of 7 |

Production build. With "Apostolic Fathers" open the list ends at 2.0 phone
screens. With "Historical works" and Philo open it ends at 5.1. No sideways
scroll at any size. Smallest tap target 44 px.

## Calls not in the mock

- Author rows say "45 entries", not "45 writings": Josephus's five entries
  are four works.
- The count line uses a numeral: "7 shelves".
- "Awaiting acquisition" reads "Not yet acquired" on a row.
- Desktop gets the same one-column list (it was two columns of cards).
- A `?group=` link now opens that shelf and leaves the other six closed
  below it; before, it showed that group alone.

## Owner's rulings

Shown as a before-and-after picture with the calls below on 2026-11-13.
Answer the same day: "Keep, ship it".

| Call | Ruling |
|---|---|
| The page opens on seven closed shelves (option 1) | Accepted |
| The top is the title, one count line and one find box; the intro line and the seven jump buttons are gone | Accepted |
| The find box narrows the list as you type; the Collection dropdown and the Filter button are gone | Accepted |
| A row shows the title and the edition only; "Read edition", the coverage note and "Also on the original shelf" stay on the entry's own page | Accepted |
| Philo, Ignatius, Josephus and Justin Martyr each fold to one row that opens in place | Accepted |
| The text-search link and the meaning-search panel follow the list; the canon note sits in "Coverage and source care" | Accepted |
| Desktop uses the same one-column list | Accepted |
| "45 entries", not "45 writings" | Accepted |
| "Not yet acquired" replaces "Awaiting acquisition" on a row | Accepted |
| A `?group=` link opens its shelf and leaves the other six closed below | Accepted |

Not decided, because it was not asked: whether any other long page
(`/scriptures/topics`, `/sources`) should take the same pattern.

## Checks

Node 24.20.0. Lint, typecheck, 1,108 unit and 67 smoke tests, production
build. Four browser test files on desktop, phone and tablet (71 passed, 4
skipped by design). An axe scan of four states of the page (closed, shelves
open, matches, no matches) in light and dark at 390 and 1440 px: 16 runs, no
violations. Keyboard: Tab reaches a shelf, Enter opens it, Tab reaches its
first row, each with a visible focus ring. With JavaScript off a shelf still
opens and `?q=` still lists the matches.

The shelf markup and its styles were also loaded in mobile Safari (iPhone 15
simulator, iOS 17.0) on a bare page, because the simulator's Safari cannot
load a local build over plain http. The grid on `<summary>`, the chevrons and
the nested author fold rendered as in Chrome.

`/early/library` is not in the release's accessibility route list, so the
axe scan above was run by hand. No independent plan review was run. Not
checked on a real phone.
