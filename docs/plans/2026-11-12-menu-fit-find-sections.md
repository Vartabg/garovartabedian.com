# Scriptures menu fits a phone; Find lists every section

Date: 2026-11-12. Branch: `codex/menu-fit-find-sections`. Base: `9c0fb827`.

## Where this came from

Two things were left open when the menu was changed to open on each page's
own links (`docs/plans/2026-11-12-menu-from-here.md`):

- The Scriptures section has fifteen pages plus its sources link. Its menu
  was 966 px tall in a 748 px panel at 390 x 844, so it still scrolled.
- Find's opening list showed six of the eight sections under "Worlds", with
  the count "6".

A check of the live site in mobile Safari (iPhone 15 simulator, iOS 17.0)
found a third: Safari drew its own triangle beside "Everything else" and
Chrome drew nothing.

## What changed

1. **A section may name the pages its menu opens on.** `WorldGuideConfig`
   takes an optional `menuLead` list. `sectionMenu` returns `links` (what
   the menu opens on), `more` (the section's other pages) and `all`. The
   page you are on always leads, even when it is not in the list. A section
   with no `menuLead` keeps every page up front, as before.
2. **Scriptures names seven**: Stories, Search the text, Word Bridge, Bible
   topics, Compare translations, Catena, Cross-reference graph, then the
   sources link. Six are the section's own shortlist in `world-guidance.ts`;
   Word Bridge was added because the Scriptures page features it. The other
   eight pages come first inside "Everything else", under "More in
   Scriptures" (`.site-nav-group--more`).
3. **One chevron on "Everything else" in every browser**
   (`.site-nav-fold-chevron`): down when closed, up when open. Safari's own
   marker is hidden.
4. **Find's opening "Worlds" group shows every section.** Its bound in
   `find-surface.ts` is the number of sections, not 6.

On a chapter page the fold still lists the whole section in one group.

## Measured, this branch

| Menu | 390 x 844 | 360 x 780 | 1440 x 900 |
|---|---|---|---|
| `/scriptures` | 8 links, 538 px, fits (was 16 links, 966 px) | 566 px, fits | 388 px |
| `/scriptures/disputation` | 9 links, 590 px, fits | 618 px, fits | 435 px |
| Other sections | unchanged | unchanged | unchanged |

No menu repeats a link and no link was dropped (31 links on `/scriptures`).
Find's opening list: "Worlds 8" on the home page and on a section page.

Known and not addressed: the Jesus menu (11 links) is 721 px at 360 x 780
and scrolls by about 37 px.

## Owner's rulings

Shown as a before-and-after picture with three calls on 2026-11-12. Answer
on 2026-11-13: "Keep, ship it".

| Call | Ruling |
|---|---|
| The Scriptures menu opens on the seven pages above plus Sources; the other eight fold under "More in Scriptures" | Accepted |
| One chevron on "Everything else" in every browser | Accepted |
| Find's opening list shows all eight sections | Accepted |

## Checks

Node 24.20.0. Lint, typecheck, unit and smoke tests, production build. Eight
browser test files on desktop, phone and tablet. An axe scan of the open
menu, folded and unfolded, on seven routes in light and dark at 390 and
1440 px. The chevron rules were also loaded in mobile Safari on a bare page:
the simulator's Safari cannot load a local build over plain http, because
the site's security headers make it drop the stylesheets. No independent
plan review was run; this extends the menu change above. Not checked on a
real phone.
