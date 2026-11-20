# Say it once: section chrome

Branch `codex/section-chrome-once`, from master `bba479b3`. Plan revision 2 (after independent review; see `2026-11-03-say-it-once-section-chrome-review.md`).

## Owner decisions

| Decision | Status |
| --- | --- |
| Redundancy is a site-wide problem; rule: say each thing once | "Yes, that's it", 2026-11-03 |
| 1. Drop the small label (eyebrow/kicker) above the title on the 8 section homes | "Yes, all three", 2026-11-03 |
| 2. Drop the section box (`WorldGuide`) under the header | same |
| 3. Move that box's section links into the header Menu, at the top | same |
| Shown before approval: live `/early` and `/scriptures` with parts 1 and 2 removed (title 307→210 px on phone, 363→258 px on desktop) | shown |
| Not yet shown to the owner: what the box removal does on room and reader pages (see "Visible calls") | to show before commit |

Background (owner, 2026-10-03): the box "with the path that leads back to home is just too much space ... is it even necessary?"; no kickers, intro blocks or wayfinding boxes that repeat the header. The box came back in `e71bd73c` (2026-10-19).

## Goal

Every page inside the eight sections (`/scriptures`, `/jesus`, `/apostles`, `/early`, `/church`, `/word`, `/angels`, `/evidence`) names its section once, in the header (`WorldHeader` brand link). Nothing between the header and the page's own content repeats it. The section's pages stay one tap away, in the header Menu.

## Today

- `src/app/<world>/layout.tsx` (8 files) renders `WorldHeader` then `<main><div class="wrap"><WorldGuide world=…/>{children}<WorldNextSteps …/></div></main>`.
- `WorldGuide` (`src/app/_components/WorldGuide.tsx`) renders, by layout mode from `worldGuideLayout()` (`src/lib/world-continuity.ts`):
  - all widths 561px+: breadcrumb "All worlds / <section> / <page>", room chips (`WORLD_GUIDES[w].nav`), `WorldSourceDisclosure` ("Sources & method", one line + link to `/sources#…`), "Browse this section" (all `getWorldRoutes(w)` with notes);
  - 560px and below: a sticky bar "Explore this section · <page>" (all routes) + "All worlds";
  - room pages at 1100px+: a sticky left rail (`core.css` "Desktop rail");
  - reader pages: mostly hidden by world CSS.
- Section homes put an eyebrow above the h1: `WorldHomeHero` prop `eyebrow` (early, church, word, angels, evidence), `jl-eyebrow` (jesus), `scr-hub-eyebrow` (scriptures), `ap-home-eyebrow` (apostles).
- `SiteNavigation` (header Find + Menu) knows `activeHref` (the section base) but shows only site-wide groups, or a "From <page>" panel on reading pages.

## Changes

1. **Remove `WorldGuide`** from the 8 layouts and delete the component, `worldGuideLayout()` (and its unit cases), `WorldSourceDisclosure.tsx`, and every `.world-guide` / `.wg-*` rule: `core.css` (wayfinding block, the 760px `.wg-grid` rule, the desktop-rail block, the 560px sticky-bar block, the reduced-motion/forced-colors entry), `continuity.css`, `worlds-shared.css`, `angels-visual-system.css`, `angels-story.css`, `apostles-home.css`, `church.css`, `early.css`, `jesus.css`, `scriptures.css`, `scriptures-hub.css`, `scriptures-study.css`, `src/app/angels/stories/story-frame.css`, `src/app/apostles/stories/story.css`, and the stale entry in `eslint.config.mjs`. Rules that hid `.world-guide` together with other elements keep the other elements. `WorldNextSteps` stays (same file). Scroll offsets that only made room for the sticky phone bar return to normal: `.parables-browse` (5.5rem at 560px and below) and `.scr-hub-reading` (8rem). `WORLD_GUIDES[w].source.text` / `hrefLabel` become unused data and stay (no consumer is harmed; deleting them is a separate cleanup). `WorldGuide.tsx` is renamed `WorldNextSteps.tsx`. Done when `grep -rE "world-guide|wg-|WorldGuide\b|worldGuideLayout|WorldSourceDisclosure" src tests eslint.config.mjs` returns nothing (the `WORLD_GUIDES` data and its `WorldGuideLink` type stay; `WorldNextSteps` uses them).
2. **Section group in the header Menu** (`SiteNavigation.tsx`, with the link list and current page computed by a pure helper `sectionMenu(activeHref, pathname)` in `src/lib/site/section-menu.ts` so it can be unit-tested on deep paths). The section is the `WORLD_GUIDES` entry whose `base` equals `activeHref`; non-section headers get no group.
   - Links: `getWorldRoutes(world)` minus the section base (the brand link already goes there), each with its note, then "Sources for <section label>" → `source.href ?? "/sources"`.
   - Current: one link at most, the longest `href` for which `getNavigationCurrent` is truthy (same filter `WorldGuide` used), marked `aria-current="page"` on an exact match and `"location"` on a descendant.
   - Say it once inside the Menu: a site-wide group link whose `href` is already in the section group is not repeated (for example Search Scripture and Bible topics on Scripture pages).
   - Default panel: the group is rendered before "Explore the whole site" as `<section class="site-nav-group site-nav-group--section">` with the section label as its heading (h2; "In <label>" read badly for "Who Owns the Word?"), spanning the whole panel (`grid-column: 1 / -1`), its links in `repeat(auto-fill, minmax(13rem, 1fr))` columns (one column at 520px and below). It is rendered outside the `MENU_GROUPS` index mapping, so `--worlds` stays on the worlds group.
   - From-here panel (reading pages): unchanged at the top; the section group becomes the first group inside the folded "Everything else" (heading h3), so the reading-page Menu still opens on "From <page>" only.
   - `has-current` logic is unchanged.
3. **Remove only the element directly above each section-home h1**: `WorldHomeHero`'s `eyebrow` prop and its `<p class="world-home-hero-eyebrow">` (callers: `early/page.tsx`, `church/ChurchHome.tsx`, `word/WordHome.tsx`, `angels/AngelsHome.tsx`, `evidence/EvidenceHome.tsx`), the `jl-eyebrow` paragraph in `jesus/page.tsx`, the first `scr-hub-eyebrow` in `scriptures/page.tsx`, and the `ap-home-eyebrow` in the hero copy of `apostles/ApostlesHome.tsx`. CSS: delete `.world-home-hero-eyebrow`, `.jl-eyebrow` if unused afterwards, and `.ap-home-hero-copy .ap-home-eyebrow`; keep the shared `scr-hub-eyebrow` / `ap-home-eyebrow` base rules (still used lower on those pages). Remove the `.world-home-hero-eyebrow` entry from `PenWrites.tsx`. Every `WorldEntry eyebrow=` stays.

Out of scope (owner not asked): eyebrows on room pages (for example "Jesus Christ" above "Parables"), the Reader/Engineer bar, pinning the header, repeated lists inside pages. These are listed for the owner afterwards.

## Visible calls to show the owner before commit

- Room pages lose the phone bar that stayed pinned while scrolling; the Menu is at the top only.
- Room pages at 1100px+ lose the left rail of section pages; the page column returns to normal width.
- The breadcrumb ("All worlds / <section> / <page>") is gone everywhere; the brand link and the cross seal remain as the way up.
- "Sources & method" moves from a collapsed line in the box to the Menu link "Sources for <section>" (the one-line summary is no longer on each page; `/sources` keeps the full text). Pages with their own "Sources & method" section keep it.
- On reading pages the section's pages sit inside "Everything else" in the Menu, not open.
- On Scripture pages, Search Scripture and Bible topics appear once in the Menu (in the section group), not twice.

## Failure behaviour

| Situation | Result |
| --- | --- |
| A section has no routes | Group shows only "Sources & method". |
| Header on a non-section page | No section group; Menu unchanged. |
| JavaScript off | Menu is a native `<details>`; the group is server-rendered inside it. |

## Affected files

- Removed: `WorldGuide` export, `worldGuideLayout`, `WorldSourceDisclosure.tsx`.
- Changed: 8 `layout.tsx`, `SiteNavigation.tsx`, `WorldHomeHero.tsx`, `PenWrites.tsx`, `jesus/page.tsx`, `scriptures/page.tsx`, `apostles/ApostlesHome.tsx`, `early/page.tsx`, `church/ChurchHome.tsx`, `word/WordHome.tsx`, `angels/AngelsHome.tsx`, `evidence/EvidenceHome.tsx`, `jesus/parables` CSS offset, the CSS files in change 1, `eslint.config.mjs`.
- Tests: `tests/world-continuity.test.ts` (drop layout cases); `tests/e2e/continuity.spec.ts` (section navigation now through the Menu group; the `/scriptures/disputation` Breadcrumb assertion is removed; the axe check targets the open Menu group instead of `.world-guide`); `tests/e2e/worlds-responsive.spec.ts`; `tests/e2e/scriptures-hub.spec.ts`; `tests/e2e/scriptures-study-flow.spec.ts`; re-run `tests/e2e/navigation.spec.ts` and `tests/e2e/navigation-reflow.spec.ts`; new unit cases for the section group.

## Acceptance checks

1. Unit: the Menu on a section page renders a group headed with the section label with every `getWorldRoutes` link except the base plus "Sources for <label>", marks exactly one current link (checked on `/jesus/history/belief-and-growth`), does not repeat Search Scripture under "Use Scripture" on `/scriptures`, and renders no section group on `/about`.
2. Browser, 390 and 1280 px, all 8 homes: no `.world-guide`; the h1 is the first child of its hero copy; no horizontal scroll. No `.world-guide` on a room page and a reading page either. Pixel movement is measured against a local master build and reported, not asserted.
3. Browser: opening the Menu on `/jesus/parables` shows the "Jesus Christ" group with Parables current; on a reading page the group is inside "Everything else"; Escape closes the Menu and returns focus.
4. `npm run check`, the touched e2e specs on a production build, and `test:a11y`.
5. Screenshots of a home, a room page and a reading-page Menu, phone and 1440 px, shown to the owner with the visible calls before commit.
