# Phone leftovers: one-row header and first-screen links

Date: 2026-11-11. Branch: `codex/phone-leftovers`. Base: `bbd4c05e`.

## Where this came from

A sweep of 41 live pages on 2026-11-10 found nine problems. PRs #258 to #261
fixed seven of them. A second sweep of the same pages on 2026-11-11 found
these still open on phones:

- `/word` still had a two-row header (125 px; 69 px on other sections).
- `/church`, `/evidence` and `/word` had nothing to tap in the page body on
  the first phone screen. The first link sat about 1,200 to 1,290 px down on
  an 844 px screen.
- `/early` showed its three buttons and then a grey line that repeated them
  ("Browse all 23 writings", then "23 original shelf texts").

## What changed

1. **Header.** On screens up to 760 px the section name's column may shrink
   (`flex: 1 1 9rem` on `.world-header .world-brand-lockup`), so a long name
   wraps to two lines beside Find and Menu. The base is in rem, so under
   enlarged type the navigation still takes a second row.
2. **Writings.** The grey facts line is gone on `/early`.
3. **Church, How We Know, Word.** The ways in are buttons under the opening
   paragraph (`WorldHeroActions`), made from the old path card's own labels
   and links. The card (`WorldEntry`) is removed from the pages, and its
   component, styles and unit test are deleted. A button that points down the
   page opens any folded section that holds its target.
4. The grey facts lines on those three pages stay.

## Measured, live site before and this branch after

| Page | 390 px wide | 360 px wide |
|---|---|---|
| `/word`, `/word/cases`, `/word/free` header | 125 to 69 px | 125 to 69 px |
| `/angels/demons`, an angel story header | 123 to 67 px | 123 to 67 px |
| `/angels`, `/jesus`, `/apostles` header | unchanged, one row | 123 to 125 px down to 67 to 69 px |
| `/church/giants` header | unchanged, one row | 128 to 72 px |

Headers at 768 px are unchanged. No page has sideways overflow.

| Page | Links on the first phone screen (390 x 844) |
|---|---|
| `/church` | 0 to 5 |
| `/evidence` | 0 to 4 |
| `/word` | 0 to 4 |
| `/early` | 3 to 3 (the picture moves up 119 px) |

## Owner's rulings

Shown as a before-and-after picture with four calls on 2026-11-11. Answer:
"Keep, ship it".

| Call | Ruling |
|---|---|
| Long section names wrap to two lines in the phone header | Accepted |
| Grey facts line removed on Writings | Accepted |
| Buttons replace the path card on Church, How We Know and Word; the card's one-line descriptions go | Accepted |
| Grey facts lines stay on those three pages | Accepted |

Not decided here: the phone menu (18 links, 1.4 screens), the Angels title
repeating the header name, and the long library page.

## Checks

Node 24.20.0. Lint, typecheck, unit and smoke tests, production build. Eight
browser test files on desktop, phone and tablet. An axe scan of the header
and the opening block of six routes in light and dark at 390 and 1440 px.
All sixteen buttons tapped; each lands on its target. Not checked on a real
phone.
