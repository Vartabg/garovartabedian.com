# Site menu: "From here"

Branch `claude/menu-from-here`. Owner request, 2026-10-29: "the overly-complicated
grouping of all the pages in the menu", then, after two regrouping options:
"Not a fan of either, want you to research and explore better". He picked
"From here" from three concepts, said "Keep going", then "perform redundancy
pass".

## Decisions so far (owner)

| Decision | Status |
| --- | --- |
| Flat list of worlds + footer move (Option A) | Rejected |
| Same, keeping a "Work with Garo" link | Rejected |
| "From here": menu opens on the page's own next steps | Accepted for prototype; "Keep going" |
| Questions as labels; Timeline | Not chosen |
| Remove redundancy | Requested |

## Problem (measured on the live site, 375×812 phone)

- Phone menu: 19 links, 179 words, 1,254px tall (1.5 screens), four groups,
  an instruction line, and repeated destinations.
- Mark 1 page: 102 reachable links to 52 destinations; 29 destinations linked
  more than once. `/scriptures` six times on screen; the eight worlds listed
  in full in the menu and again in a strip below the footer; two "Aa" buttons;
  a "Continue exploring" block and a "Pull this thread" block after the
  chapter's own study section.

## Research used (general findings, not tests of this site)

- Teevan et al., CHI 2004: people prefer small steps from where they are
  ("orienteering") over jumping straight to a target, even when they could.
- GOV.UK (GDS, 2021): most users start from a search engine; around 15% use
  topic pages to navigate. This site's 8,000+ pages are mostly reached deep.
- Information scent (Nielsen): labels should predict the destination in the
  visitor's words, not mirror internal structure.

## Design

`src/lib/site/from-here.ts` is a tiny store (same shape as `find-bridge.ts`).
A page renders one `<FromHere label links />` (`src/app/_components/FromHere.tsx`),
which registers its links on mount and clears them on unmount. The store holds
one page's links, so a page renders at most one. After mount, with links, it
renders a hidden `[data-from-here]` marker. `src/lib/early/from-here.ts`
(`libraryFromHere`) builds the two library pages' links.

`SiteNavigation` subscribes. With links, the panel is one column: "From
{label}" with each link's kind above its name, then "Everything else"
(closed) holding the unchanged site groups. Without links, the current menu.

Rule: From here lists the page's best connections, reachable while reading
(on a chapter they otherwise sit five or more screens down, after the text).
It does not repeat what is always on screen: the reader bar's arrows and
picker, the header, the breadcrumb, the pagers.

| Page type | From here |
| --- | --- |
| Chapter | Up to 3 nearest chapters by wording ("Similar wording", plus "· cross-referenced N×" when cross-references also join them); Angels & Demons record; parallel accounts |
| Early writing | 2 most-quoted Scripture chapters; next writing in its era; another edition; writings from this era |
| Library section / edition | The work in the shelf's other translation; writings from its era |
| Reading path | Its two excerpts in the full readers; the source investigation |
| Apostle story | The passage; the apostle's record (Pentecost: "The record"); the other stories |
| Angels story | The passage; the other stories; the encounters record |
| Essay, hubs, everything else | No From here; current menu |

## Redundancy pass

- Menu: removed "Read the Bible" (same page as the Scriptures world) and the
  second "How We Know".
- Pages with From here hide the "Continue exploring" links
  (`.world-continuation .world-next`) and the `.vsw` worlds strip via
  `body:has([data-from-here])`. "More research tools" is not in the menu and
  stays.
- Chapter pages hide the floating Aa (`body:has(.scr-bar) .a11y-menu`): the
  reader bar's Aa opens the same `ReadingAppearance` panel plus version and
  audio settings.
- Chapter breadcrumb starts at the canon; "Scriptures" is already the header's
  world name and nav link directly above it.
- Kept on purpose: the after-text previous/next links and the bar arrows
  (different moments: end of chapter vs. while reading); the Home link beside
  the brand.

## Failure behaviour

- No JavaScript: the menu shows the current full panel (the store never
  fills) and the marker never renders, so "Continue exploring" stays. The
  marker appearing after hydration moves nothing above the reader: those
  blocks sit below the content.
- Future risk: the page-wide `:has()` rule assumes one rendered page. If
  `cacheComponents` is turned on, a hidden cached page's marker would apply
  to the visible page; scope the rule then.
- Navigation between pages: the unmount clears the store before the next page
  registers, so a stale "From" never shows on a page without links.
- Empty link list: no marker, full menu, generic blocks stay.

## Acceptance checks

- Mark 1 menu opens on "From Mark 1" with no Next/Previous/book links.
- /jesus opens the full menu; "Everything else" holds all site groups.
- Reading pages show no "Continue exploring" block, no worlds strip; chapter
  pages show one Aa.
- typecheck, lint, unit, smoke, release browser suite.
