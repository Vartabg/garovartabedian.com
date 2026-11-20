# The Jesus menu fits a small phone

Date: 2026-11-14. Branch: `codex/jesus-menu-fold`. Base: `a3ac3431`.

## Where this came from

Left open by `docs/plans/2026-11-12-menu-fit-find-sections.md`. Measured on
the live site on 2026-11-14: the Jesus section menu had 11 links and was 707
to 721 px tall. It fit at 390 x 844, scrolled 39 px at 360 x 780 and 138 px
at 375 x 667.

## Options shown

| Option | Result |
|---|---|
| A. Fold it like the Scriptures menu | About 490 px; fits all three sizes |
| B. One-line links on small phones | Still about 10 px over at 375 x 667 |

Owner's pick, 2026-11-14: "Yes, fold it" (option A).

## What changed

`WORLD_GUIDES.jesus.menuLead` names six pages the menu opens on: His words,
Parables, His life on the map, Cross to ascension, Gospels word by word,
Prophecy and fulfillment, then the sources link. The other four (What
history can establish, Belief and growth, How the world sees him, Research
worksheets) come first inside "Everything else" under "More in Jesus
Christ". The page you are on always leads. No code changed beyond the list;
the mechanism is the one built for Scriptures.

## Measured, this branch (production build)

486 px at 360 x 780, 375 x 667 and 390 x 844, with no scrolling; 538 px on a
folded page (it leads its own menu). 29 links in all, none repeated.

## Owner's ruling

The list of six was shown with before and after pictures on 2026-11-14.
Answer: "Keep, ship it". Accepted.

Not decided: the Angels and Word section titles repeat their header names.
He was told a title is his wording and has not given one.

## Checks

Node 24.20.0. Lint, typecheck, 1,123 unit and 67 smoke tests, production
build, 20 browser tests (navigation and continuity), including a new one
that holds the Jesus menu to 375 x 667. Not loaded in Safari; the fold is
the one already checked there on the Scriptures menu.
