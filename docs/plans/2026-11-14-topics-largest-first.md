# The topics page opens on the largest topics

Date: 2026-11-14. Branch: `codex/topics-largest-first`. Base: `6f5e98f8`.

## Who it is for and what they do

A visitor who opens `/scriptures/topics` and does not know Nave's Topical
Bible. They should see subjects they recognise on the first screen and reach
one in a tap. A visitor who knows the word types it, or picks its letter.

## Where this came from

The phone review on 2026-11-11 measured this page at about 24 phone screens.
Measured again on the live site on 2026-11-14 at 390 x 844:

- 20,564 px, 24.4 screens.
- It opened on 400 names from "Aaron" on and stopped partway through A (A
  has 529 topics), with no note that it had stopped.
- The letters appeared twice: an "Index density" block (377 px), then a row
  of letter buttons (259 px). The list started 1,177 px down.
- Of the 5,319 topics, 2,021 have one reference or none, and 635 have 20 or
  more.

Found on the way: titles were made by lowercasing the whole name, so live
topic pages read "Jesus, the christ", "Word of god" and "Holy spirit". Find
and Scripture search used a second rule that capitalised every word and
wrote "Lord'S Supper".

## Options shown

Three phone mocks, made from the live page, were shown on 2026-11-14.

| Option | What is listed before the visitor chooses | Whole page at 390 x 844 |
|---|---|---|
| 1. Largest topics first | The 40 topics with the most references | 3.4 screens |
| 2. Letters only | Nothing | 2.1 |
| 3. A to Z, tidied | All 529 topics under A | 17.1 |

Owner's pick, 2026-11-14: **"Option 1"**. Options 2 and 3 were not chosen.

Research read at the source that day. A general finding, not a test of this
site: Jakob Nielsen, "Alphabetical Sorting Must (Mostly) Die", NN/g,
2010-10-03. A-to-Z lists are "useless" when people do not know the name of
what they want; importance or frequency can order a long listing instead.

## What changed

1. **The page opens on the 40 largest topics**, largest first, with their
   reference counts. A line under them says how many topics there are in
   all.
2. **One letter picker.** The "Index density" block is gone. On a phone the
   letters run in one row that scrolls sideways; on a wider screen they wrap
   into a grid.
3. **A letter leads with its larger topics**, those with 20 or more
   references, in A-to-Z order. The whole letter sits under them in a closed
   fold ("All 570 topics under S"). A letter with no larger topics lists
   everything. Nothing stops silently at 400 any more.
4. **Rows read across**, two to a row on a phone and three on a wide screen.
   The old layout filled one long column and then the next, so a reader had
   to scroll back up to read the second.
5. **Search** lists the matches under a count ("4 topics match"). A search
   that matches more than 400 still stops there and says so.
6. **One title helper for a topic**, `topicTitle` in
   `src/lib/scriptures/topic-title.ts`, used by the topics page, each topic
   page, its metadata and share image, Find, and Scripture search. It keeps
   the capitals of the names inside a title. 75 of the 5,319 titles change.

Files: `src/app/scriptures/topics/TopicsRoom.tsx`,
`src/lib/scriptures/topics-index.ts` (new), `src/lib/scriptures/topic-title.ts`
(new), `src/lib/scriptures/server/nave.ts`, `[topic]/layout.tsx`,
`src/lib/site/find-query.ts`, `src/app/scriptures/search/SearchRoom.tsx`,
`src/app/styles/worlds-shared.css`, `scriptures.css`, `core.css`.

## The capitals rule

- A word the index already wrote in mixed case keeps its case
  ("Minister, Christian", "Angel (Holy Trinity)").
- A fixed list of names is capitalised when one stands as a whole word after
  the first: names of God ("God", "Jesus", "Christ", "Lord's", "Savior"),
  "Satan", "Bible", and the people and places the index names in second
  position or in brackets ("Aquila and Priscilla", "Elisabeth (Elizabeth)").
  A test checks that every name on the list is used.
- Four whole titles are set by hand: "I AM THAT I AM", "Holy Spirit",
  "Prince of Peace", "El-elohe-Israel".
- "(R. V.)" and "(A. V.)" are written in capitals.
- Left as the King James text prints them, on purpose: the later parts of a
  hyphened name ("Abel-beth-maachah"), "Red sea", "Kingdom of heaven",
  "Ten commandments".

## Calls not in the mock

- **Letters in one sideways row on a phone.** The mock showed four rows of
  seven. The site's rule is a 48 px touch target, which fits six across at
  390 px, so 25 letters took five rows and pushed every topic off the first
  screen. One row keeps six topics on screen 1.
- **Find and Scripture search use the same titles.** They change from
  "Word Of God" and "Lord'S Supper" to "Word of God" and "Lord's supper".
- The list heading uses the real count when an index is smaller than 40.

## Measured, this branch

Production build.

| | 390 x 844 | 360 x 780 | 1440 x 900 |
|---|---|---|---|
| Whole page | 2,778 px, 3.3 screens (was 24.4) | 3.7 screens | 2,096 px, 2.3 screens (was 12.0) |
| List starts at | 567 px (was 1,177 px) | 567 px | 564 px |
| Topics whole on screen 1 | 6 | 4 | 15 |
| Letter S picked | 4.1 screens | | 2.9 screens |

With "All 570 topics under S" open the page is 20.2 phone screens; that is
the longest state and it is one the visitor asks for. No sideways scroll of
the page at any size. Letter buttons are 48 px on a phone; a topic link is
45 px tall and fills its row.

## Owner's rulings

Shown as a before-and-after picture with the calls below on 2026-11-14.
Answer the same day: "Keep, ship it".

| Call | Ruling |
|---|---|
| The page opens on the 40 topics with the most references (option 1) | Accepted |
| The "Index density" block is gone; one letter picker stays | Accepted |
| A letter shows its topics with 20 or more references first, the whole letter in a fold under them | Accepted |
| Two topics to a row on a phone, three on desktop, reading across | Accepted |
| Titles keep their capitals; 75 titles change | Accepted |
| Find and Scripture search use the same titles | Accepted |
| Letters in one sideways row on a phone (not the mock's four rows) | Accepted |
| A topic name fills its row as the touch target | Accepted |

He was told that "Red sea", "Kingdom of heaven" and the later parts of
hyphened names were left in King James style, and asked to say if he wanted
any capitalised. He did not ask for a change.

Not decided, because it was not asked: whether `/sources` (20 phone screens)
should be shortened; whether a letter or a search should be kept in the
address so it can be shared.

## Checks

Node 24.20.0. Lint, typecheck, 1,122 unit and 67 smoke tests, production
build. Four browser test files (topics, responsive, Scripture search, Find):
94 passed, 7 skipped by design. Run together, one Playwright worker hung on
shutdown after every test had passed; run one file at a time all four exit
clean. An axe scan of five states of the page (largest, a letter, the letter
unfolded, matches, no matches) in light and dark at 390 and 1440 px: 20 runs,
no violations. Keyboard: Tab reaches the letters, Enter picks one, the list
follows, each with a visible focus ring.

Every one of the 75 changed titles was read. `/scriptures/topics` is in the
release's accessibility route list. Not loaded in Safari before release; the
sideways letter row and the fold are checked on the live site. No independent
plan review was run. Not checked on a real phone.
