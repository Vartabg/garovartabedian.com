# The menu opens on the page's own links

Date: 2026-11-12. Branch: `codex/menu-from-here`. Base: `d66e1aa4`.

## Where this came from

The phone menu was the largest finding left open by the 2026-11-10 site
review. Measured live at 390 x 844 on 2026-11-12:

| Page | Links | Words | Height |
|---|---|---|---|
| Home | 18 | 173 | 1,202 px in a 748 px scrolling panel |
| A section page (`/jesus/parables`) | 29 | 290 | 1,833 px |
| A chapter | 3, then a folded "Everything else" | 26 | 270 px |

The menu opened with a two-line intro ("Explore the whole site"). On
2026-10-29 the owner rejected a flat list and a move of links to the footer;
those were not offered again.

## Options shown

Three options were mocked on the real pages in a private browser and shown as
one picture:

1. From here on every page: the page's own links, the rest behind one
   "Everything else" row.
2. One door: no Menu button on phones; Find lists the site when empty. Find's
   opening list showed 6 of the 8 sections and no about or work links, and
   Find was being changed that week.
3. Names only: every link, no intro and no second lines, two columns.

The owner picked option 1.

## What changed

- `SiteNavigation.tsx`: a page without a From-here list opens the menu on
  its own links: a section's pages; the "Understand the work" and "Work with
  Garo" groups on an about or work page; the eight sections anywhere else.
  The remaining groups sit inside `details.site-nav-everything`, one heading
  level down. The intro block is removed. A change of page closes
  "Everything else" again.
- `core.css`: the panel is one column, 30rem wide, at every width. The
  `site-nav-panel--here` modifier and the `site-nav-panel-head` rules are
  removed. The group labels are named from `.site-navigation`, so a page's
  own heading rules no longer restyle them.
- Reading pages keep their From-here list.

## Measured, this branch

| Page | 390 x 844 | 1440 x 900 |
|---|---|---|
| Home | 8 links, 80 words, 529 px, fits | 360 px |
| `/jesus`, `/jesus/parables` | 11 links, 119 words, 707 px, fits | 501 px |
| `/hire`, `/about` | 7 links, 54 words, 510 px, fits | 525 px |
| `/angels/demons` | 10 links, 628 px, fits | 454 px |
| `/scriptures` | 16 links, 167 words, 966 px, scrolls | 665 px |

At 360 x 780 the Jesus menu is 721 px and scrolls by about 40 px. No menu
repeats a link, and no link was dropped. The smallest tap target is 44 px.

## Owner's rulings

Shown as a before-and-after picture on 2026-11-12. Answer: "Keep, ship it".

| Call | Ruling |
|---|---|
| Option 1 on the home page and on section pages; the intro block removed | Accepted |
| About and work pages open on the about and work links | Accepted |
| Desktop gets the same one-column menu | Accepted |
| One style for the group labels on every page | Accepted |

Known and not addressed here: the Scriptures menu still scrolls on a phone;
Find's opening list leaves out two sections.

## Research cited

Pernice and Budiu, "Hamburger Menus and Hidden Navigation Hurt UX Metrics",
Nielsen Norman Group, 2016-06-26 (179 participants, 6 sites): on phones
people used hidden navigation in 57% of cases against 86% when some links
were also visible, and were 15% slower. Read on 2026-11-12. A general
finding, not a test of this site.

## Checks

Node 24.20.0. Lint, typecheck, unit and smoke tests, production build. Eight
browser test files on desktop, phone and tablet. An axe scan of the open
menu, folded and unfolded, on six routes in light and dark at 390 and
1440 px. Keyboard: Tab reaches the fold, Enter opens it, Escape closes the
menu and returns focus. No independent plan review was run; this extends the
pattern already live on chapter pages. Not checked on a real phone.
